# Tiled API Client

This folder contains the HTTP client layer for the [Tiled](https://blueskyproject.io/tiled/) scientific data server. It is used by the `<Tiled />` React component but can also be imported directly into any TypeScript application.

---

## Architecture

```
defaultTiledApiClient.ts   ← module-level singleton; main entry point for consumers
TiledApiClient.ts          ← core class; use directly when you need an isolated instance
TiledArrayApi.ts           ← types + slice/step utilities for array requests
TiledTableApi.ts           ← types + JSON-seq parser for table requests
TiledSearchApi.ts          ← types + query-string serializer for search requests
TiledConfigApi.ts          ← shared request-option types and path-mode definitions
TiledMetadataApi.ts        ← getMetadata interface
TiledInfoApi.ts            ← getServerInfo interface
TiledFinchApi.ts           ← composite interface (TiledApiClient satisfies it)
```

### `TiledApiClient` (the class)

The core implementation. Each instance owns its own Axios client with two built-in interceptors:

1. **Request interceptor** — adds `Authorization: ApiKey <key>` when an API key is set and no `Authorization` header is already present.
2. **Response interceptor** — on a `401`, attempts a token refresh via `POST /auth/refresh`. Concurrent 401s share a single refresh promise so only one refresh is ever in-flight at a time. If refresh fails, stored tokens are cleared and `onAuthError` is called.

Instantiate directly when you need fully isolated clients (e.g. multiple servers in one app or in tests):

```ts
import { TiledApiClient } from './TiledApiClient';

const client = new TiledApiClient({
  baseUrl: 'https://my-tiled-server.example.com/api/v1',
  initialPath: 'data/project',
  apiKey: 'my-api-key',
});

const result = await client.getSearch('');
```

### `defaultTiledApiClient.ts` (the singleton)

A module-level `TiledApiClient` instance shared across the application. All `getTiled*` and `setDefault*` functions delegate to it. This is what the `<Tiled />` component uses.

```ts
import {
  setDefaultTiledUrl,
  setGlobalApiKey,
  getTiledSearch,
} from './api/defaultTiledApiClient';

setDefaultTiledUrl('https://my-tiled-server.example.com/api/v1');
setGlobalApiKey('my-api-key');

const results = await getTiledSearch('');
```

When no URL is set, the singleton derives a default from `window.location`:
```
http(s)://<hostname>:8000/api/v1
```

---

## Path resolution

Every request path goes through a two-step resolution:

1. **`initialPath` prefix** — if the client has an `initialPath` set (e.g. `"data/project"`), all relative paths are prefixed with it. A path of `"runs"` becomes `"data/project/runs"`.
2. **`pathMode: 'absolute'`** — pass `pathMode: 'absolute'` in request options to bypass `initialPath` entirely and treat the path as-is.

Leading/trailing slashes are always stripped and each segment is `encodeURIComponent`-encoded before being appended to the URL.

```ts
// With initialPath = "data/project":
await getTiledSearch('runs');
//  → GET /search/data/project/runs

// Bypass initialPath:
await getTiledSearch('runs', {}, { pathMode: 'absolute' });
//  → GET /search/runs
```

---

## Authentication

### API key

Set once on the singleton; the request interceptor attaches it to every request that doesn't already have an `Authorization` header.

```ts
setGlobalApiKey('my-api-key');
// or per-request:
await getTiledSearch('', {}, { apiKey: 'my-api-key' });
```

### Bearer token (username/password login)

```ts
await loginWithDefaultTiledClient('alice', 'secret');
// Tokens are saved to localStorage and the bearer token is set on the client.
// The response interceptor will auto-refresh it on future 401s.
```

### Bearer token (external — e.g. OIDC)

```ts
setDefaultBearerToken('eyJ...');
```

### Auth error callback

Register a callback that is called when a refresh fails (e.g. to show a login prompt):

```ts
setDefaultAuthErrorCallback((error) => {
  console.error('Auth failed:', error);
  setShowLogin(true);
});
```

---

## Configuration reference

### `TiledApiClientConfig`

Used to construct a new `TiledApiClient`:

| Field | Type | Default | Description |
|---|---|---|---|
| `baseUrl` | `string` | `''` | Base URL of the Tiled server including `/api/v1`. |
| `initialPath` | `string` | `''` | Path prefix prepended to all relative request paths. |
| `apiKey` | `string \| null` | `null` | API key sent as `Authorization: ApiKey …` header. |
| `client` | `AxiosInstance` | auto-created | Bring your own Axios instance (useful for testing). |
| `signal` | `AbortSignal` | `undefined` | Default abort signal for all requests. |
| `maxArrayBytes` | `number` | `undefined` | Global byte limit for array payloads; drives auto-downsampling. |
| `onAuthError` | `(error) => void` | `undefined` | Called when token refresh fails. |

### `TiledRequestOptions`

Per-request overrides accepted by every API method:

| Field | Type | Description |
|---|---|---|
| `baseUrl` | `string` | Override the base URL for this request. |
| `initialPath` | `string` | Override the initial path prefix for this request. |
| `pathMode` | `'relative' \| 'absolute'` | `'absolute'` bypasses `initialPath`. |
| `apiKey` | `string \| null` | Override the API key for this request. |
| `signal` | `AbortSignal` | Abort signal for this request. |
| `client` | `TiledClientLike` | Use a different Axios instance for this request. |

### `TiledArrayRequestOptions` (extends `TiledRequestOptions`)

Accepted by all `getArrayAs*` methods:

| Field | Type | Description |
|---|---|---|
| `stack` | `number[]` | Frame/slice index into a higher-dimensional array. E.g. `[5]` selects frame 5 from a `[frames, H, W]` array. |
| `maxBytesAllowed` | `number` | Maximum payload size in bytes. The client auto-computes a downsample step to stay under this limit using the array's shape and dtype. |
| `downSampleRatio` | `number` | Explicit downsample ratio (e.g. `2` = every other pixel). Takes precedence over `maxBytesAllowed`. |
| `structure` | `ArrayStructure` | Pre-fetched array structure from `item.attributes.structure`. Avoids a secondary metadata request when computing downsampling. |
| `arrayItem` | `TiledArrayItem` | Full Tiled item object. Used to extract structure and avoid a secondary metadata request. |
| `isRGB` | `boolean` | Treat the last three dimensions as `[H, W, 3]` RGB channels instead of a grayscale stack. |
| `format` | `string` | Override the response format. Defaults to the method's natural format (`application/json`, `image/png`, etc.). |

### `TiledTableRequestOptions` (extends `TiledRequestOptions`)

Accepted by all `getTable*` methods:

| Field | Type | Description |
|---|---|---|
| `partition` | `number` | Zero-based partition index to fetch. Defaults to `0`. Not used by the `full` endpoint. |
| `structure` | `TableStructure` | Pre-fetched table structure. Avoids a secondary metadata request. |
| `tableItem` | `TiledTableItem` | Full Tiled item object. Used to extract structure when it is not provided directly. |
| `format` | `string` | Override the response format. Defaults to `application/json` or `application/json-seq` per method. |

### `TiledSearchConfig`

Accepted by `getTiledSearch` as the second argument:

```ts
interface TiledSearchConfig {
  searchFilters?: TiledSearchFilters;
  searchOptions?: TiledSearchOptions;
}
```

#### `TiledSearchOptions`

| Field | Type | Description |
|---|---|---|
| `pageOffset` | `number` | Zero-based index of the first result to return. Use with `pageLimit` for pagination. |
| `pageLimit` | `number` | Maximum number of results to return per page. |
| `sort` | `string` | Sort key. Pass `'-'` for reverse/descending order; omit or pass `''` for server default. |
| `fields` | `string[]` | Restrict which fields are returned in each result item. |
| `selectMetadata` | `string` | JSONPath-style pattern to select a subset of item metadata. |
| `omitLinks` | `boolean` | When `true`, omit the `links` field from each result item. |
| `includeDataSources` | `boolean` | When `true`, include data source information in results. |

#### `TiledSearchFilters`

Search filters are currently experimental. `Fulltext` `specs` and `structureFamily` are the only fully tested and working searches.
At most one filter of each type can be active per request:

| Filter key | Condition fields | Description |
|---|---|---|
| `fulltext` | `text: string` | Full-text search across all metadata fields. |
| `eq` | `key, value: string` | Metadata key equals value. |
| `noteq` | `key, value: string` | Metadata key does not equal value. |
| `comparison` | `operator: 'gt'\|'gte'\|'lt'\|'lte'`, `key, value: string` | Numeric comparison on a metadata key. |
| `contains` | `key, value: string` | Metadata value contains the given string. |
| `like` | `key, pattern: string` | SQL-style `LIKE` pattern match on a metadata key. |
| `regex` | `key, pattern: string`, `caseSensitive?: boolean` | Regular expression match on a metadata key. |
| `in` | `key: string`, `value: string[]` | Metadata key value is one of the given values. |
| `notin` | `key: string`, `value: string[]` | Metadata key value is not any of the given values. |
| `keyPresent` | `key: string`, `exists: boolean` | Tests whether a metadata key is present. |
| `lookup` | `key: string` | Looks up items by a specific metadata key. |
| `keysFilter` | `keys: string[]` | Filters by a set of metadata keys. |
| `specs` | `include: string[]`, `exclude: string[]` | Items whose specs include all of `include` and none of `exclude`. |
| `structureFamily` | `value: 'container'\|'array'\|'table'\|'awkward'\|'sparse'` | Filters by Tiled structure family. |
| `accessBlob` | `userId?: string`, `tags?: string[]` | Filters by access-blob user ID or tags. |

---

## Quick-start examples

### Fetch search results

```ts
import { getTiledSearch } from './api/defaultTiledApiClient';

const results = await getTiledSearch('experiments', {
  searchFilters: { specs: { include: ['BlueskyRun'], exclude: [] } },
  searchOptions: { sort: '-', pageLimit: 25 },
});
```

### Fetch an array as JSON

```ts
import { getTiledArrayAsJSON } from './api/defaultTiledApiClient';

const data = await getTiledArrayAsJSON<number[][]>('path/to/array', {
  stack: [0],
  maxBytesAllowed: 500_000,
});
```

### Fetch an array as a PNG image URL

```ts
import { getTiledArrayAsImagePath } from './api/defaultTiledApiClient';

const url = getTiledArrayAsImagePath('path/to/array', { stack: [0] });
// Use directly in <img src={url} />
```

### Fetch a table as row-oriented JSON

```ts
import { getTiledTablePartitionAsJSONSequence } from './api/defaultTiledApiClient';

const rows = await getTiledTablePartitionAsJSONSequence('path/to/table', {
  partition: 0,
});
```

### Fetch metadata

```ts
import { getTiledMetadata } from './api/defaultTiledApiClient';
import type { ArrayStructure } from '../types';

const item = await getTiledMetadata<ArrayStructure>('path/to/array');
console.log(item.attributes.structure.shape);
```

---

## Testing

Use `resetDefaultTiledApiClient()` in your test setup to restore the singleton to a fresh state (new instance, default base URL) between tests. The legacy `resetGlobalState()` in `apiClient.ts` calls this internally.

```ts
import { resetDefaultTiledApiClient } from './api/defaultTiledApiClient';

beforeEach(() => {
  resetDefaultTiledApiClient();
});
```
