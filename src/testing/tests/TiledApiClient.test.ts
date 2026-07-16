import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TiledApiClient } from '../../components/Tiled/api/TiledApiClient';
import type { ArrayStructure } from '../../components/Tiled/types';

const BASE_URL = 'https://test-api.example.com/api/v1';

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockSearchResult = {
  data: [
    {
      id: 'item1',
      attributes: {
        ancestors: [],
        structure_family: 'container',
        specs: [],
        metadata: {},
        structure: {},
        sorting: null,
        data_sources: null,
      },
      links: { self: '/search/item1' },
      meta: null,
    },
  ],
  error: null,
  links: {
    self: '?page[offset]=0&page[limit]=10',
    first: '?page[offset]=0&page[limit]=10',
    last: '?page[offset]=0&page[limit]=10',
    next: null,
    prev: null,
  },
  meta: { count: 1 },
};

const mockMetadataResult = {
  data: {
    id: 'my/item',
    attributes: {
      ancestors: ['my'],
      structure_family: 'array',
      specs: [],
      metadata: {},
      structure: {
        data_type: { endianness: '>', kind: 'u', itemsize: 4, dt_units: null },
        chunks: [[10, 10]],
        shape: [10, 10],
        dims: null,
        resizable: false,
      },
      sorting: null,
      data_sources: null,
    },
    links: { self: '/metadata/my/item' },
    meta: null,
  },
  error: null,
  links: null,
  meta: null,
};

const mockInfoResponse = {
  api_version: 1,
  library_version: '1.0.0',
  formats: {
    container: [],
    array: ['application/json', 'image/png', 'application/octet-stream'],
    awkward: [],
    table: ['application/json'],
    sparse: [],
    xarray_dataset: [],
  },
  aliases: {
    container: {},
    array: {},
    awkward: {},
    table: {},
    sparse: {},
    xarray_dataset: {},
  },
  queries: [],
  authentication: {
    required: false,
    providers: [
      {
        id: 'toy',
        mode: 'password',
        links: {
          auth_endpoint: `${BASE_URL}/auth/provider/toy/token`,
        },
      },
    ],
    links: {
      whoami: `${BASE_URL}/auth/whoami`,
      apikey: `${BASE_URL}/auth/apikey`,
      refresh_session: `${BASE_URL}/auth/refresh`,
      revoke_session: `${BASE_URL}/auth/revoke_session`,
      logout: `${BASE_URL}/auth/logout`,
    },
  },
  links: { self: `${BASE_URL}/`, documentation: `${BASE_URL}/docs` },
  meta: { root_path: '/' },
};

// Small 100×100 uint32 array: 40,000 bytes total.
// With DEFAULT_MAX_BYTES_ALLOWED (1 MB) → step = 1.
// With maxBytesAllowed = 1000 → step = ceil(sqrt(40000/1000)) = ceil(6.32) = 7.
const mockArrayStructure: ArrayStructure = {
  data_type: { endianness: '>', kind: 'u', itemsize: 4, dt_units: null },
  chunks: [[100, 100]],
  shape: [100, 100],
  dims: null,
  resizable: false,
};

const server = setupServer();

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
  localStorage.clear();
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  localStorage.clear();
});

// ─── Constructor and configuration ───────────────────────────────────────────

describe('constructor and configuration', () => {
  it('stores baseUrl, initialPath, and apiKey from config', () => {
    const client = new TiledApiClient({
      baseUrl: BASE_URL,
      initialPath: 'data/project',
      apiKey: 'my-key',
    });
    expect(client.getBaseUrl()).toBe(BASE_URL);
    expect(client.getInitialPath()).toBe('data/project');
    expect(client.getApiKey()).toBe('my-key');
  });

  it('strips trailing slashes from baseUrl', () => {
    const client = new TiledApiClient({ baseUrl: `${BASE_URL}///` });
    expect(client.getBaseUrl()).toBe(BASE_URL);
  });

  it('strips leading and trailing slashes from initialPath', () => {
    const client = new TiledApiClient({ initialPath: '/leading/and/trailing/' });
    expect(client.getInitialPath()).toBe('leading/and/trailing');
  });

  it('defaults apiKey to null when not provided', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    expect(client.getApiKey()).toBeNull();
  });

  it('setBaseUrl / getBaseUrl round-trip', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    client.setBaseUrl('https://other.example.com/api/v1');
    expect(client.getBaseUrl()).toBe('https://other.example.com/api/v1');
  });

  it('setInitialPath / getInitialPath round-trip; strips slashes', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    client.setInitialPath('/foo/bar/');
    expect(client.getInitialPath()).toBe('foo/bar');
  });

  it('setApiKey(null) clears the key', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL, apiKey: 'key' });
    client.setApiKey(null);
    expect(client.getApiKey()).toBeNull();
  });

  it('setMaxArrayBytes / getMaxArrayBytes round-trip', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    client.setMaxArrayBytes(512_000);
    expect(client.getMaxArrayBytes()).toBe(512_000);
    client.setMaxArrayBytes(undefined);
    expect(client.getMaxArrayBytes()).toBeUndefined();
  });

  it('setSignal / getSignal round-trip', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const ctrl = new AbortController();
    client.setSignal(ctrl.signal);
    expect(client.getSignal()).toBe(ctrl.signal);
    client.setSignal(undefined);
    expect(client.getSignal()).toBeUndefined();
  });

  it('getAxiosClient returns an Axios instance with a get method', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const axiosClient = client.getAxiosClient();
    expect(typeof axiosClient.get).toBe('function');
  });
});

// ─── API key authentication ────────────────────────────────────────────────

describe('API key authentication', () => {
  it('attaches Apikey header when apiKey is set on the client', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL, apiKey: 'my-api-key' });
    await client.getSearch('');

    expect(capturedAuth).toBe('Apikey my-api-key');
  });

  it('sends no Authorization header when apiKey is null', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('');

    expect(capturedAuth).toBeNull();
  });

  it('per-request apiKey overrides the client-level key', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL, apiKey: 'global-key' });
    await client.getSearch('', {}, { apiKey: 'request-key' });

    expect(capturedAuth).toBe('Apikey request-key');
  });
});

// ─── Bearer token ─────────────────────────────────────────────────────────

describe('bearer token', () => {
  it('setBearerToken attaches Authorization: Bearer header to requests', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    client.setBearerToken('my-bearer-token');
    await client.getSearch('');

    expect(capturedAuth).toBe('Bearer my-bearer-token');
  });

  it('setBearerToken(null) removes the Authorization header', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    client.setBearerToken('token');
    client.setBearerToken(null);
    await client.getSearch('');

    expect(capturedAuth).toBeNull();
  });
});

// ─── Path resolution ──────────────────────────────────────────────────────

describe('path resolution', () => {
  it('prepends initialPath to relative search paths', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL, initialPath: 'experiments' });
    await client.getSearch('run1');

    expect(capturedUrl).toBe('/api/v1/search/experiments/run1');
  });

  it('pathMode: absolute bypasses initialPath', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL, initialPath: 'experiments' });
    await client.getSearch('run1', {}, { pathMode: 'absolute' });

    expect(capturedUrl).toBe('/api/v1/search/run1');
  });

  it('empty path with initialPath returns the initialPath node', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL, initialPath: 'experiments' });
    await client.getSearch('');

    expect(capturedUrl).toBe('/api/v1/search/experiments');
  });

  it('per-request initialPath override replaces the client initialPath', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL, initialPath: 'global' });
    await client.getSearch('path', {}, { initialPath: 'override' });

    expect(capturedUrl).toBe('/api/v1/search/override/path');
  });

  it('per-request baseUrl override sends request to a different origin', async () => {
    const OTHER_URL = 'https://other-server.example.com/api/v1';
    let calledOther = false;
    server.use(
      http.get(`${OTHER_URL}/search/`, () => {
        calledOther = true;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('', {}, { baseUrl: OTHER_URL });

    expect(calledOther).toBe(true);
  });

  it('path segments with spaces are percent-encoded', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('hello world');

    expect(capturedUrl).toContain('hello%20world');
  });

  it('strips leading and trailing slashes from path segments', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('/leading/and/trailing/');

    expect(capturedUrl).toBe('/api/v1/search/leading/and/trailing');
  });
});

// ─── getSearch ────────────────────────────────────────────────────────────

describe('getSearch', () => {
  it('hits /search/ with no path and returns results', async () => {
    server.use(
      http.get(`${BASE_URL}/search/`, () => HttpResponse.json(mockSearchResult)),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const result = await client.getSearch('');

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('item1');
  });

  it('passes sort option as query param', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('', { searchOptions: { sort: '-' } });

    expect(capturedParams?.get('sort')).toBe('-');
  });

  it('passes pageOffset and pageLimit as query params', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('', { searchOptions: { pageOffset: 10, pageLimit: 25 } });

    expect(capturedParams?.get('page[offset]')).toBe('10');
    expect(capturedParams?.get('page[limit]')).toBe('25');
  });

  it('passes fulltext filter as query param', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('', { searchFilters: { fulltext: { text: 'hello' } } });

    expect(capturedParams?.get('filter[fulltext][condition][text]')).toBe('hello');
  });

  it('passes specs filter as query param', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('', {
      searchFilters: { specs: { include: ['BlueskyRun'], exclude: [] } },
    });

    expect(capturedParams?.get('filter[specs][condition][include]')).toBe('["BlueskyRun"]');
  });

  it('passes eq filter as query params', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('', { searchFilters: { eq: { key: 'sample', value: 'Fe' } } });

    expect(capturedParams?.get('filter[eq][condition][key]')).toBe('sample');
    expect(capturedParams?.get('filter[eq][condition][value]')).toBe('Fe');
  });

  it('passes structureFamily filter as query param', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getSearch('', {
      searchFilters: { structureFamily: { value: 'array' } },
    });

    expect(capturedParams?.get('filter[structure_family][condition][value]')).toBe('array');
  });
});

// ─── getArrayAs* ──────────────────────────────────────────────────────────

describe('getArrayAs* methods', () => {
  it('getArrayAsJSON fetches /array/full/:path with format=application/json', async () => {
    let capturedParams: URLSearchParams | null = null;
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/array/full/*`, ({ request }) => {
        const url = new URL(request.url);
        capturedPath = url.pathname;
        capturedParams = url.searchParams;
        return HttpResponse.json([[1, 2], [3, 4]]);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const result = await client.getArrayAsJSON<number[][]>('my/array', {
      structure: mockArrayStructure,
    });

    expect(capturedPath).toBe('/api/v1/array/full/my/array');
    expect(capturedParams?.get('format')).toBe('application/json');
    expect(result).toEqual([[1, 2], [3, 4]]);
  });

  it('getArrayAsJSON with stack option includes stack prefix in slice param', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/array/full/*`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json([[1, 2]]);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getArrayAsJSON('my/array', {
      structure: mockArrayStructure,
      stack: [5],
    });

    // Slice should start with the stack frame index
    expect(capturedParams?.get('slice')).toMatch(/^5,/);
  });

  it('getArrayAsJSON with maxBytesAllowed produces a downsample step > 1', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/array/full/*`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json([[1]]);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    // 100x100 uint32 = 40 000 bytes; maxBytesAllowed=1000 → step = ceil(sqrt(40))= 7
    await client.getArrayAsJSON('my/array', {
      structure: mockArrayStructure,
      maxBytesAllowed: 1000,
    });

    const slice = capturedParams?.get('slice') ?? '';
    // Each step segment should be ::7 (not ::1)
    expect(slice).toMatch(/::7/);
  });

  it('getArrayAsPng fetches /array/full/:path with format=image/png and returns blob', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/array/full/*`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return new HttpResponse(new Uint8Array([137, 80, 78, 71]), {
          headers: { 'Content-Type': 'image/png' },
        });
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const result = await client.getArrayAsPng('my/array', { structure: mockArrayStructure });

    expect(capturedParams?.get('format')).toBe('image/png');
    expect(result).toBeTruthy();
  });

  it('getArrayAsBuffer fetches with format=application/octet-stream', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/array/full/*`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return new HttpResponse(new Uint8Array([1, 2, 3, 4]), {
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const result = await client.getArrayAsBuffer('my/array', { structure: mockArrayStructure });

    expect(capturedParams?.get('format')).toBe('application/octet-stream');
    expect(result).toBeTruthy();
  });

  it('getArrayAsImagePath returns a URL string synchronously with no network request', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const url = client.getArrayAsImagePath('my/array', { structure: mockArrayStructure });

    expect(typeof url).toBe('string');
    expect(url).toContain(`${BASE_URL}/array/full/my/array`);
    expect(url).toContain('format=image%2Fpng');
  });

  it('getArrayAsImagePath includes stack in slice param', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const url = client.getArrayAsImagePath('my/array', {
      structure: mockArrayStructure,
      stack: [3],
    });

    expect(url).toContain('slice=3%2C');
  });

  it('getArrayAsImagePath with maxBytesAllowed produces a step > 1 in URL', () => {
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const url = client.getArrayAsImagePath('my/array', {
      structure: mockArrayStructure,
      maxBytesAllowed: 1000,
    });

    // step = 7 for 100×100 uint32 with maxBytesAllowed = 1000
    expect(url).toContain('7');
  });
});

// ─── getTable* ─────────────────────────────────────────────────────────────

describe('getTable* methods', () => {
  it('getTablePartitionAsJSON fetches /table/partition/:path with partition=0', async () => {
    let capturedPath = '';
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/table/partition/*`, ({ request }) => {
        const url = new URL(request.url);
        capturedPath = url.pathname;
        capturedParams = url.searchParams;
        return HttpResponse.json({ col_a: [1, 2], col_b: [3, 4] });
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const result = await client.getTablePartitionAsJSON('my/table');

    expect(capturedPath).toBe('/api/v1/table/partition/my/table');
    expect(capturedParams?.get('partition')).toBe('0');
    expect(capturedParams?.get('format')).toBe('application/json');
    expect(result).toEqual({ col_a: [1, 2], col_b: [3, 4] });
  });

  it('getTablePartitionAsJSON with partition: 2 sends partition=2', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/table/partition/*`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json({});
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.getTablePartitionAsJSON('my/table', { partition: 2 });

    expect(capturedParams?.get('partition')).toBe('2');
  });

  it('getTablePartitionAsJSONSequence parses newline-delimited JSON into row array', async () => {
    server.use(
      http.get(`${BASE_URL}/table/partition/*`, () =>
        new HttpResponse('{"a":1,"b":2}\n{"a":3,"b":4}\n', {
          headers: { 'Content-Type': 'application/json-seq' },
        }),
      ),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const rows = await client.getTablePartitionAsJSONSequence('my/table');

    expect(rows).toEqual([
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]);
  });

  it('getTableFullAsJSON fetches /table/full/:path', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/table/full/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json({ col_a: [1, 2, 3] });
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const result = await client.getTableFullAsJSON('my/table');

    expect(capturedPath).toBe('/api/v1/table/full/my/table');
    expect(result).toEqual({ col_a: [1, 2, 3] });
  });

  it('getTableFullAsJSONSequence parses all-partition newline-delimited JSON', async () => {
    server.use(
      http.get(`${BASE_URL}/table/full/*`, () =>
        new HttpResponse('{"x":10}\n{"x":20}\n{"x":30}\n', {
          headers: { 'Content-Type': 'application/json-seq' },
        }),
      ),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const rows = await client.getTableFullAsJSONSequence('my/table');

    expect(rows).toHaveLength(3);
    expect(rows[2]).toEqual({ x: 30 });
  });
});

// ─── getMetadata and getServerInfo ────────────────────────────────────────

describe('getMetadata and getServerInfo', () => {
  it('getMetadata fetches /metadata/:path and returns the item directly', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/metadata/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json(mockMetadataResult);
      }),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const item = await client.getMetadata('my/item');

    expect(capturedPath).toBe('/api/v1/metadata/my/item');
    expect(item.id).toBe('my/item');
    expect(item.attributes.structure_family).toBe('array');
  });

  it('getServerInfo fetches / and returns parsed TiledInfoResponse', async () => {
    server.use(
      http.get(`${BASE_URL}/`, () => HttpResponse.json(mockInfoResponse)),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const info = await client.getServerInfo();

    expect(info).not.toBeNull();
    expect(info?.api_version).toBe(1);
    expect(info?.library_version).toBe('1.0.0');
    expect(info?.authentication?.providers[0].id).toBe('toy');
  });

  it('getServerInfo returns null for invalid response shape', async () => {
    server.use(
      http.get(`${BASE_URL}/`, () => HttpResponse.json({ invalid: true })),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const info = await client.getServerInfo();

    expect(info).toBeNull();
  });

  it('getServerInfo returns null when the server is unreachable', async () => {
    server.use(
      http.get(`${BASE_URL}/`, () => HttpResponse.error()),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const info = await client.getServerInfo();

    expect(info).toBeNull();
  });
});

// ─── 401 and token refresh ────────────────────────────────────────────────

describe('401 and token refresh', () => {
  it('calls authErrorCallback when 401 with no tokens in localStorage', async () => {
    server.use(
      http.get(`${BASE_URL}/search/`, () => new HttpResponse(null, { status: 401 })),
    );

    const authErrorCallback = vi.fn();
    const client = new TiledApiClient({ baseUrl: BASE_URL, onAuthError: authErrorCallback });

    await expect(client.getSearch('')).rejects.toBeDefined();
    expect(authErrorCallback).toHaveBeenCalledWith(null);
  });

  it('retries with new token after successful 401 refresh', async () => {
    let searchCallCount = 0;
    server.use(
      http.get(`${BASE_URL}/search/`, () => {
        searchCallCount++;
        if (searchCallCount === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json(mockSearchResult);
      }),
      http.post(`${BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({ access_token: 'new-access-token' }),
      ),
    );

    localStorage.setItem('tiledRefreshToken', 'stored-refresh');
    localStorage.setItem('tiledAccessToken', 'old-access');

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const result = await client.getSearch('');

    expect(searchCallCount).toBe(2);
    expect(result.data).toHaveLength(1);
  });

  it('calls authErrorCallback and clears localStorage when refresh fails', async () => {
    server.use(
      http.get(`${BASE_URL}/search/`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE_URL}/auth/refresh`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    localStorage.setItem('tiledRefreshToken', 'stored-refresh');
    localStorage.setItem('tiledAccessToken', 'old-access');

    const authErrorCallback = vi.fn();
    const client = new TiledApiClient({ baseUrl: BASE_URL, onAuthError: authErrorCallback });

    await expect(client.getSearch('')).rejects.toBeDefined();
    expect(authErrorCallback).toHaveBeenCalled();
    expect(localStorage.getItem('tiledRefreshToken')).toBeNull();
    expect(localStorage.getItem('tiledAccessToken')).toBeNull();
  });

  it('concurrent 401s share one refresh promise (single refresh POST)', async () => {
    let searchCallCount = 0;
    let refreshCount = 0;
    server.use(
      http.get(`${BASE_URL}/search/`, () => {
        searchCallCount++;
        if (searchCallCount <= 2) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json(mockSearchResult);
      }),
      http.post(`${BASE_URL}/auth/refresh`, () => {
        refreshCount++;
        return HttpResponse.json({ access_token: 'shared-new-token' });
      }),
    );

    localStorage.setItem('tiledRefreshToken', 'stored-refresh');
    localStorage.setItem('tiledAccessToken', 'old-access');

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const [r1, r2] = await Promise.all([client.getSearch(''), client.getSearch('')]);

    expect(refreshCount).toBe(1);
    expect(r1.data).toHaveLength(1);
    expect(r2.data).toHaveLength(1);
  });
});

// ─── loginWithUsernamePassword ─────────────────────────────────────────────

describe('loginWithUsernamePassword', () => {
  const mockProvider = {
    id: 'toy',
    mode: 'password' as const,
    links: { auth_endpoint: `${BASE_URL}/auth/provider/toy/token` },
  };

  it('with provider: posts to provider.links.auth_endpoint and returns tokens', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/provider/toy/token`, async () =>
        HttpResponse.json({ access_token: 'access-abc', refresh_token: 'refresh-xyz' }),
      ),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const tokens = await client.loginWithUsernamePassword('alice', 'secret', undefined, mockProvider);

    expect(tokens?.access_token).toBe('access-abc');
    expect(tokens?.refresh_token).toBe('refresh-xyz');
  });

  it('on success saves tokens to localStorage and sets bearer token', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/provider/toy/token`, async () =>
        HttpResponse.json({ access_token: 'access-abc', refresh_token: 'refresh-xyz' }),
      ),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    await client.loginWithUsernamePassword('alice', 'secret', undefined, mockProvider);

    expect(localStorage.getItem('tiledAccessToken')).toBe('access-abc');
    expect(localStorage.getItem('tiledRefreshToken')).toBe('refresh-xyz');
  });

  it('without provider: calls getServerInfo to find auth endpoint', async () => {
    server.use(
      http.get(`${BASE_URL}/`, () => HttpResponse.json(mockInfoResponse)),
      http.post(`${BASE_URL}/auth/provider/toy/token`, async () =>
        HttpResponse.json({ access_token: 'access-abc', refresh_token: 'refresh-xyz' }),
      ),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const tokens = await client.loginWithUsernamePassword('alice', 'secret');

    expect(tokens?.access_token).toBe('access-abc');
  });

  it('returns null when auth endpoint returns 401', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/provider/toy/token`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const tokens = await client.loginWithUsernamePassword('alice', 'wrongpass', undefined, mockProvider);

    expect(tokens).toBeNull();
  });

  it('returns null when provider has no auth_endpoint', async () => {
    const badProvider = { id: 'toy', mode: 'password' as const };
    const client = new TiledApiClient({ baseUrl: BASE_URL });
    const tokens = await client.loginWithUsernamePassword('alice', 'secret', undefined, badProvider as any);

    expect(tokens).toBeNull();
  });
});
