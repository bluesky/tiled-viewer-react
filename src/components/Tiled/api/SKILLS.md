# Tiled API Client — AI Agent Skills Reference

Terse reference for LLMs working in this codebase. See README.md for prose explanations.

---

## Entry points

| Symbol | File | Purpose |
|---|---|---|
| `getTiled*` / `setDefault*` functions | `defaultTiledApiClient.ts` | Module singleton — use for the main app |
| `TiledApiClient` class | `TiledApiClient.ts` | Isolated instances (tests, multi-server) |

---

## defaultTiledApiClient.ts — exported functions

### Configuration
```ts
getDefaultTiledApiClient(): TiledApiClient         // returns the active singleton
setDefaultTiledApiClient(client: TiledApiClient)   // swap the singleton
resetDefaultTiledApiClient()                        // restore fresh default instance (use in tests)
setDefaultTiledUrl(baseUrl: string)                 // set server URL on singleton
setDefaultInitialPath(initialPath: string)          // set path prefix on singleton
getDefaultTiledInitialPath(): string                // read current path prefix
setGlobalApiKey(apiKey: string | null)              // set API key on singleton
setGlobalMaxArrayBytes(maxBytes: number | undefined)// cap array payload size globally
```

### Auth
```ts
setDefaultBearerToken(token: string | null)         // set/clear bearer token
setDefaultAuthErrorCallback(cb?: AuthErrorCallback) // called when token refresh fails
loginWithDefaultTiledClient(
  username: string,
  password: string,
  url?: string,
  provider?: TiledAuthProvider
): Promise<{ access_token: string; refresh_token: string } | null>
// Fetches auth endpoint, POSTs credentials, saves tokens to localStorage, sets bearer token.
```

### Search
```ts
getTiledSearch(
  searchPath: string,
  config?: TiledSearchConfig,        // { searchFilters?, searchOptions? }
  requestOptions?: TiledRequestOptions
): Promise<TiledSearchResult>

// Convenience wrappers:
getTiledSearchBySpecs(path, include: string[], exclude?: string[], searchOpts?, reqOpts?)
getTiledSearchByFullText(path, text: string, searchOpts?, reqOpts?)
getTiledSearchByMetadataEquals(path, key: string, value: string, searchOpts?, reqOpts?)
getTiledSearchByStructureFamily(path, family: 'container'|'array'|'table'|'awkward'|'sparse', searchOpts?, reqOpts?)
```

### Arrays
```ts
getTiledArrayAsJSON<T = number[][]>(path, opts?): Promise<T>
getTiledArrayAsPng(path, opts?): Promise<Blob>
getTiledArrayAsBuffer(path, opts?): Promise<ArrayBuffer>
getTiledArrayAsImagePath(path, opts?): string   // synchronous; returns URL string for <img src>
```

### Tables
```ts
getTiledTableAs<T extends TiledTableReturnType>(
  path, type?: T, endpoint?: 'partition'|'full', opts?
): Promise<TiledTableReturnMap[T]>

getTiledTablePartitionAsJSON(path, opts?): Promise<TiledTableJSONResponse>      // column-oriented
getTiledTablePartitionAsJSONSequence(path, opts?): Promise<TiledTableRow[]>     // row-oriented
getTiledTableFullAsJSON(path, opts?): Promise<TiledTableJSONResponse>
getTiledTableFullAsJSONSequence(path, opts?): Promise<TiledTableRow[]>
```

### Metadata / Info
```ts
getTiledMetadata<S extends TiledStructures = TiledStructures>(
  path, opts?
): Promise<TiledSearchItem<S>>                 // returns the item directly (not wrapped)

getTiledServerInfo(opts?): Promise<TiledInfoResponse | null>
```

---

## Key types

### TiledRequestOptions (per-request overrides)
```ts
interface TiledRequestOptions {
  baseUrl?: string
  initialPath?: string
  pathMode?: 'relative' | 'absolute'  // 'absolute' bypasses initialPath
  apiKey?: string | null
  signal?: AbortSignal
  client?: TiledClientLike
}
```

### TiledSearchConfig
```ts
interface TiledSearchConfig {
  searchFilters?: TiledSearchFilters
  searchOptions?: TiledSearchOptions
}

interface TiledSearchOptions {
  fields?: string[]
  selectMetadata?: string
  pageOffset?: number
  pageLimit?: number
  sort?: string           // '-' = reverse/descending, '' = default ascending
  omitLinks?: boolean
  includeDataSources?: boolean
}

interface TiledSearchFilters {
  fulltext?:       { text: string }
  lookup?:         { key: string }
  keysFilter?:     { keys: string[] }
  regex?:          { key: string; pattern: string; caseSensitive?: boolean }
  eq?:             { key: string; value: string }
  noteq?:          { key: string; value: string }
  comparison?:     { operator: 'gt'|'gte'|'lt'|'lte'; key: string; value: string }
  contains?:       { key: string; value: string }
  in?:             { key: string; value: string[] }
  notin?:          { key: string; value: string[] }
  keyPresent?:     { key: string; exists: boolean }
  like?:           { key: string; pattern: string }
  specs?:          { include: string[]; exclude: string[] }
  accessBlob?:     { userId?: string; tags?: string[] }
  structureFamily? { value: 'container'|'array'|'table'|'awkward'|'sparse' }
}
```

### TiledArrayRequestOptions
```ts
interface TiledArrayRequestOptions extends TiledRequestOptions {
  downSampleRatio?: number   // e.g. 2 = every other pixel (sync; explicit ratio)
  maxBytesAllowed?: number   // auto-computes downsample ratio from array shape + dtype
  stack?: number[]           // frame index for N-D arrays, e.g. [5] for frame 5
  structure?: ArrayStructure // avoids a secondary metadata request
  arrayItem?: TiledArrayItem // avoids a secondary metadata request
  isRGB?: boolean            // treat last dim-3 axis as RGB channels
}
```

---

## Auth flow

| Scenario | Function to call |
|---|---|
| API key only | `setGlobalApiKey(key)` — interceptor adds header automatically |
| Username/password login | `loginWithDefaultTiledClient(user, pass)` — fetches tokens, saves to localStorage |
| External token (OIDC, etc.) | `setDefaultBearerToken(token)` |
| Handle auth failure | `setDefaultAuthErrorCallback(cb)` — cb fires when refresh fails |

Token refresh is automatic: the response interceptor catches 401s, reads the refresh token from `localStorage` (`tiledRefreshToken`), and retries. Concurrent 401s share one refresh promise.

---

## Common gotchas

- **`pathMode: 'absolute'`** — pass in `requestOptions` to skip the `initialPath` prefix for a single request.
- **Sort** — `sort: '-'` = newest first (reverse). `sort: ''` or omit = server default.
- **Pagination** — `pageOffset` + `pageLimit` in `searchOptions`. The `links` field of `TiledSearchResult` contains pre-built `next`/`prev` URLs.
- **`getTiledMetadata` return type** — returns `TiledSearchItem<S>` directly (not `{ data, error }` wrapper). Access the item's path as `item.id`, structure as `item.attributes.structure`.
- **`getTiledArrayAsImagePath`** is synchronous — it builds a URL string without making a network request. Use it for `<img src={...} />` bindings.
- **`resetDefaultTiledApiClient()`** replaces the singleton entirely (new `TiledApiClient` with default base URL). Call this in test `beforeEach` to prevent state leaking between tests.
- **`setDefaultAuthErrorCallback`** is called on every render cycle by `Tiled.tsx` — this is intentional so it always has the latest React setState closure.
