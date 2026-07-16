import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TiledApiClient } from '../../components/Tiled/api/TiledApiClient';
import {
  getDefaultTiledApiClient,
  setDefaultTiledApiClient,
  resetDefaultTiledApiClient,
  setDefaultTiledUrl,
  setDefaultInitialPath,
  getDefaultTiledInitialPath,
  setGlobalApiKey,
  setGlobalMaxArrayBytes,
  setDefaultBearerToken,
  setDefaultAuthErrorCallback,
  getTiledSearch,
  getTiledSearchBySpecs,
  getTiledSearchByFullText,
  getTiledSearchByMetadataEquals,
  getTiledSearchByStructureFamily,
  getTiledArrayAsJSON,
  getTiledArrayAsImagePath,
  getTiledTablePartitionAsJSON,
  getTiledTableFullAsJSONSequence,
  getTiledMetadata,
  getTiledServerInfo,
  loginWithDefaultTiledClient,
} from '../../components/Tiled/api/defaultTiledApiClient';
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
    id: 'my/array',
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
    links: { self: '/metadata/my/array' },
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
    array: ['application/json', 'image/png'],
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
        links: { auth_endpoint: `${BASE_URL}/auth/provider/toy/token` },
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

const mockArrayStructure: ArrayStructure = {
  data_type: { endianness: '>', kind: 'u', itemsize: 4, dt_units: null },
  chunks: [[10, 10]],
  shape: [10, 10],
  dims: null,
  resizable: false,
};

const server = setupServer();

beforeEach(() => {
  resetDefaultTiledApiClient();
  setDefaultTiledUrl(BASE_URL);
  server.listen({ onUnhandledRequest: 'error' });
  localStorage.clear();
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  localStorage.clear();
});

// ─── Singleton management ─────────────────────────────────────────────────────

describe('singleton management', () => {
  it('getDefaultTiledApiClient returns a TiledApiClient instance', () => {
    const client = getDefaultTiledApiClient();
    expect(client).toBeInstanceOf(TiledApiClient);
  });

  it('setDefaultTiledApiClient replaces the singleton', async () => {
    const OTHER_URL = 'https://other.example.com/api/v1';
    let calledOther = false;
    server.use(
      http.get(`${OTHER_URL}/search/`, () => {
        calledOther = true;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    const custom = new TiledApiClient({ baseUrl: OTHER_URL });
    setDefaultTiledApiClient(custom);
    await getTiledSearch('');

    expect(calledOther).toBe(true);
  });

  it('resetDefaultTiledApiClient discards previously configured state', async () => {
    server.use(
      http.get(`${BASE_URL}/search/`, () => HttpResponse.json(mockSearchResult)),
    );

    setDefaultInitialPath('some/path');
    expect(getDefaultTiledInitialPath()).toBe('some/path');

    resetDefaultTiledApiClient();
    setDefaultTiledUrl(BASE_URL);

    expect(getDefaultTiledInitialPath()).toBe('');
  });

  it('after reset, requests use the new singleton (not the old config)', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setDefaultInitialPath('old/path');
    resetDefaultTiledApiClient();
    setDefaultTiledUrl(BASE_URL);

    await getTiledSearch('');

    // initialPath is gone after reset — should hit root /search/
    expect(capturedPath).toBe('/api/v1/search/');
  });
});

// ─── Configuration wrappers ───────────────────────────────────────────────────

describe('configuration wrappers', () => {
  it('setDefaultTiledUrl routes requests to the new URL', async () => {
    const NEW_URL = 'https://new-server.example.com/api/v1';
    let called = false;
    server.use(
      http.get(`${NEW_URL}/search/`, () => {
        called = true;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setDefaultTiledUrl(NEW_URL);
    await getTiledSearch('');

    expect(called).toBe(true);
  });

  it('setDefaultInitialPath / getDefaultTiledInitialPath round-trip', () => {
    setDefaultInitialPath('data/project');
    expect(getDefaultTiledInitialPath()).toBe('data/project');
  });

  it('setDefaultInitialPath causes requests to use the initialPath prefix', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setDefaultInitialPath('experiments');
    await getTiledSearch('run1');

    expect(capturedPath).toBe('/api/v1/search/experiments/run1');
  });

  it('setGlobalApiKey attaches the key to subsequent requests', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setGlobalApiKey('global-api-key');
    await getTiledSearch('');

    expect(capturedAuth).toBe('Apikey global-api-key');
  });

  it('setGlobalApiKey(null) removes the key from requests', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setGlobalApiKey('some-key');
    setGlobalApiKey(null);
    await getTiledSearch('');

    expect(capturedAuth).toBeNull();
  });

  it('setGlobalMaxArrayBytes is reflected on the singleton', () => {
    setGlobalMaxArrayBytes(256_000);
    expect(getDefaultTiledApiClient().getMaxArrayBytes()).toBe(256_000);
    setGlobalMaxArrayBytes(undefined);
    expect(getDefaultTiledApiClient().getMaxArrayBytes()).toBeUndefined();
  });

  it('setDefaultBearerToken attaches Bearer header to requests', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setDefaultBearerToken('my-bearer');
    await getTiledSearch('');

    expect(capturedAuth).toBe('Bearer my-bearer');
  });

  it('setDefaultAuthErrorCallback is invoked on 401 with no tokens', async () => {
    server.use(
      http.get(`${BASE_URL}/search/`, () => new HttpResponse(null, { status: 401 })),
    );

    const cb = vi.fn();
    setDefaultAuthErrorCallback(cb);

    await expect(getTiledSearch('')).rejects.toBeDefined();
    expect(cb).toHaveBeenCalledWith(null);
  });
});

// ─── Per-request options override singleton defaults ──────────────────────────

describe('per-request options override singleton defaults', () => {
  it('requestOptions.baseUrl sends request to a different server', async () => {
    const OTHER_URL = 'https://other.example.com/api/v1';
    let calledOther = false;
    server.use(
      http.get(`${OTHER_URL}/search/`, () => {
        calledOther = true;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    await getTiledSearch('', {}, { baseUrl: OTHER_URL });

    expect(calledOther).toBe(true);
  });

  it('requestOptions.initialPath overrides the singleton initialPath', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setDefaultInitialPath('global');
    await getTiledSearch('path', {}, { initialPath: 'override' });

    expect(capturedPath).toBe('/api/v1/search/override/path');
  });

  it('requestOptions.pathMode: absolute bypasses the singleton initialPath', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/search/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setDefaultInitialPath('global');
    await getTiledSearch('path', {}, { pathMode: 'absolute' });

    expect(capturedPath).toBe('/api/v1/search/path');
  });

  it('requestOptions.apiKey overrides the global API key', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    setGlobalApiKey('global-key');
    await getTiledSearch('', {}, { apiKey: 'request-key' });

    expect(capturedAuth).toBe('Apikey request-key');
  });
});

// ─── Search wrappers ──────────────────────────────────────────────────────────

describe('search wrappers', () => {
  it('getTiledSearchBySpecs sends filter[specs] params', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    await getTiledSearchBySpecs('', ['BlueskyRun'], []);

    expect(capturedParams?.get('filter[specs][condition][include]')).toBe('["BlueskyRun"]');
    expect(capturedParams?.get('filter[specs][condition][exclude]')).toBe('[]');
  });

  it('getTiledSearchByFullText sends filter[fulltext] param', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    await getTiledSearchByFullText('', 'my search text');

    expect(capturedParams?.get('filter[fulltext][condition][text]')).toBe('my search text');
  });

  it('getTiledSearchByMetadataEquals sends filter[eq] params', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    await getTiledSearchByMetadataEquals('', 'sample', 'Fe');

    expect(capturedParams?.get('filter[eq][condition][key]')).toBe('sample');
    expect(capturedParams?.get('filter[eq][condition][value]')).toBe('Fe');
  });

  it('getTiledSearchByStructureFamily sends filter[structure_family] param', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    await getTiledSearchByStructureFamily('', 'array');

    expect(capturedParams?.get('filter[structure_family][condition][value]')).toBe('array');
  });

  it('search wrapper accepts searchOptions that are forwarded to the query', async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json(mockSearchResult);
      }),
    );

    await getTiledSearchBySpecs('', ['BlueskyRun'], [], { sort: '-', pageLimit: 50 });

    expect(capturedParams?.get('sort')).toBe('-');
    expect(capturedParams?.get('page[limit]')).toBe('50');
  });
});

// ─── Array, table, metadata, and info wrappers ────────────────────────────────

describe('array, table, metadata, and info wrappers', () => {
  it('getTiledArrayAsJSON fetches /array/full/:path', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/array/full/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json([[1, 2], [3, 4]]);
      }),
    );

    const result = await getTiledArrayAsJSON<number[][]>('my/array', {
      structure: mockArrayStructure,
    });

    expect(capturedPath).toBe('/api/v1/array/full/my/array');
    expect(result).toEqual([[1, 2], [3, 4]]);
  });

  it('getTiledArrayAsImagePath returns a URL string without a network request', () => {
    const url = getTiledArrayAsImagePath('my/array', { structure: mockArrayStructure });

    expect(typeof url).toBe('string');
    expect(url).toContain(`${BASE_URL}/array/full/my/array`);
    expect(url).toContain('format=image%2Fpng');
  });

  it('getTiledTablePartitionAsJSON fetches /table/partition/:path', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/table/partition/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json({ col_a: [1, 2] });
      }),
    );

    const result = await getTiledTablePartitionAsJSON('my/table');

    expect(capturedPath).toBe('/api/v1/table/partition/my/table');
    expect(result).toEqual({ col_a: [1, 2] });
  });

  it('getTiledTableFullAsJSONSequence parses newline-delimited JSON', async () => {
    server.use(
      http.get(`${BASE_URL}/table/full/*`, () =>
        new HttpResponse('{"x":1}\n{"x":2}\n', {
          headers: { 'Content-Type': 'application/json-seq' },
        }),
      ),
    );

    const rows = await getTiledTableFullAsJSONSequence('my/table');

    expect(rows).toEqual([{ x: 1 }, { x: 2 }]);
  });

  it('getTiledMetadata fetches /metadata/:path and returns item directly', async () => {
    server.use(
      http.get(`${BASE_URL}/metadata/*`, () => HttpResponse.json(mockMetadataResult)),
    );

    const item = await getTiledMetadata('my/array');

    expect(item.id).toBe('my/array');
    expect(item.attributes.structure_family).toBe('array');
  });

  it('getTiledServerInfo fetches / and returns parsed response', async () => {
    server.use(
      http.get(`${BASE_URL}/`, () => HttpResponse.json(mockInfoResponse)),
    );

    const info = await getTiledServerInfo();

    expect(info?.api_version).toBe(1);
    expect(info?.authentication?.providers[0].id).toBe('toy');
  });

  it('getTiledServerInfo with baseUrl requestOption hits the overridden server', async () => {
    const OTHER_URL = 'https://other.example.com/api/v1';
    server.use(
      http.get(`${OTHER_URL}/`, () =>
        HttpResponse.json({ ...mockInfoResponse, library_version: 'other-1.0' }),
      ),
    );

    const info = await getTiledServerInfo({ baseUrl: OTHER_URL });

    expect(info?.library_version).toBe('other-1.0');
  });

  it('getTiledArrayAsJSON with singleton initialPath prefix hits the right path', async () => {
    let capturedPath = '';
    server.use(
      http.get(`${BASE_URL}/array/full/*`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json([[0]]);
      }),
    );

    setDefaultInitialPath('scans');
    await getTiledArrayAsJSON('run1/detector', { structure: mockArrayStructure });

    expect(capturedPath).toBe('/api/v1/array/full/scans/run1/detector');
  });
});

// ─── loginWithDefaultTiledClient ─────────────────────────────────────────────

describe('loginWithDefaultTiledClient', () => {
  const mockProvider = {
    id: 'toy',
    mode: 'password' as const,
    links: { auth_endpoint: `${BASE_URL}/auth/provider/toy/token` },
  };

  it('on success saves tokens to localStorage and sets bearer token on singleton', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/provider/toy/token`, () =>
        HttpResponse.json({ access_token: 'access-abc', refresh_token: 'refresh-xyz' }),
      ),
    );

    const tokens = await loginWithDefaultTiledClient('alice', 'secret', undefined, mockProvider);

    expect(tokens?.access_token).toBe('access-abc');
    expect(tokens?.refresh_token).toBe('refresh-xyz');
    expect(localStorage.getItem('tiledAccessToken')).toBe('access-abc');
    expect(localStorage.getItem('tiledRefreshToken')).toBe('refresh-xyz');
  });

  it('on failure returns null and leaves localStorage unchanged', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/provider/toy/token`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    const tokens = await loginWithDefaultTiledClient('alice', 'wrong', undefined, mockProvider);

    expect(tokens).toBeNull();
    expect(localStorage.getItem('tiledAccessToken')).toBeNull();
  });

  it('after successful login, subsequent requests carry the bearer token', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.post(`${BASE_URL}/auth/provider/toy/token`, () =>
        HttpResponse.json({ access_token: 'access-abc', refresh_token: 'refresh-xyz' }),
      ),
      http.get(`${BASE_URL}/search/`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json(mockSearchResult);
      }),
    );

    await loginWithDefaultTiledClient('alice', 'secret', undefined, mockProvider);
    await getTiledSearch('');

    expect(capturedAuth).toBe('Bearer access-abc');
  });

  it('without provider fetches server info first then posts to its auth endpoint', async () => {
    server.use(
      http.get(`${BASE_URL}/`, () => HttpResponse.json(mockInfoResponse)),
      http.post(`${BASE_URL}/auth/provider/toy/token`, () =>
        HttpResponse.json({ access_token: 'access-abc', refresh_token: 'refresh-xyz' }),
      ),
    );

    const tokens = await loginWithDefaultTiledClient('alice', 'secret');

    expect(tokens?.access_token).toBe('access-abc');
  });
});
