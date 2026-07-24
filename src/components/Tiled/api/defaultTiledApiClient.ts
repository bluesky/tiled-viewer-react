// defaultTiledApiClient.ts
import { TiledApiClient } from './TiledApiClient';
import type { TiledTableRow } from '../types';

import type {
  TiledArrayReturnType,
  TiledArrayReturnMap,
  GetArrayAsOptionsMap,
} from './TiledArrayApi';

import type {
  GetTableAsOptionsMap,
  TiledTableJSONResponse,
  TiledTableReturnMap,
  TiledTableReturnType,
  TiledTableEndpoint,
} from './TiledTableApi';

import type { TiledRequestOptions } from './TiledConfigApi';
import type { TiledSearchItem, TiledStructures, TiledSearchResult, TiledInfoResponse, TiledAuthProvider } from '../types';
import type { TiledSearchConfig, TiledSearchOptions } from './TiledSearchApi';

export type { TiledAuthProvider };

/** Callback invoked when a token-refresh attempt fails (e.g. to show a login prompt). */
export type AuthErrorCallback = (error: unknown) => void;

function getDefaultBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return '';
}

let activeTiledApiClient = new TiledApiClient({ baseUrl: getDefaultBaseUrl() });

// ─── Singleton management ─────────────────────────────────────────────────────

/**
 * Returns the active module-level `TiledApiClient` singleton used by all
 * `getTiled*` / `setDefault*` functions in this module.
 *
 * @returns The current `TiledApiClient` instance.
 */
export function getDefaultTiledApiClient(): TiledApiClient {
  return activeTiledApiClient;
}

/**
 * Replaces the active singleton with a custom `TiledApiClient` instance.
 *
 * Useful when you need fine-grained control over the Axios client (e.g.
 * injecting a mock in tests or pre-configuring auth).
 *
 * @param client - The `TiledApiClient` instance to use from this point on.
 */
export function setDefaultTiledApiClient(client: TiledApiClient): void {
  activeTiledApiClient = client;
}

/**
 * Resets the singleton to a fresh `TiledApiClient` with the default base URL
 * derived from `window.location` (port 8000, `/api/v1`).
 *
 * Call this in test `beforeEach` / `afterEach` to prevent state leaking between
 * test cases.
 *
 * @example
 * beforeEach(() => { resetDefaultTiledApiClient(); });
 */
export function resetDefaultTiledApiClient(): void {
  activeTiledApiClient = new TiledApiClient({ baseUrl: getDefaultBaseUrl() });
}

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Sets the Tiled server base URL on the singleton.
 *
 * Must include the API version path, e.g. `"https://myserver.example.com/api/v1"`.
 *
 * @param baseUrl - Full base URL of the Tiled server.
 */
export function setDefaultTiledUrl(baseUrl: string): void {
  activeTiledApiClient.setBaseUrl(baseUrl);
}

/**
 * Sets the global `initialPath` prefix on the singleton.
 *
 * All subsequent relative-path requests are automatically prefixed with this
 * value. Pass `pathMode: 'absolute'` in request options to bypass it for a
 * single call.
 *
 * @param initialPath - Path prefix, e.g. `"data/project"`.
 */
export function setDefaultInitialPath(initialPath: string): void {
  activeTiledApiClient.setInitialPath(initialPath);
}

/**
 * Reads the current `initialPath` prefix from the singleton.
 *
 * @returns The current initial path string (may be empty).
 */
export function getDefaultTiledInitialPath(): string {
  return activeTiledApiClient.getInitialPath();
}

/**
 * Sets the API key on the singleton.
 *
 * The request interceptor automatically attaches it as
 * `Authorization: ApiKey <key>` to every request that does not already have an
 * `Authorization` header.
 *
 * @param apiKey - The API key string, or `null` to clear it.
 */
export function setGlobalApiKey(apiKey: string | null): void {
  activeTiledApiClient.setApiKey(apiKey);
}

/**
 * Sets a global maximum payload size for array requests on the singleton.
 *
 * When set, the client auto-computes a downsample step ratio so that the
 * returned array data stays under this byte limit.
 *
 * @param maxBytes - Maximum bytes for array payloads, or `undefined` to disable
 *   the global limit (per-request `maxBytesAllowed` still applies).
 */
export function setGlobalMaxArrayBytes(maxBytes: number | undefined): void {
  activeTiledApiClient.setMaxArrayBytes(maxBytes);
}

// ─── Arrays ───────────────────────────────────────────────────────────────────

/**
 * Fetches a Tiled array in the specified format.
 *
 * This is the generic dispatcher; prefer the typed convenience helpers
 * (`getTiledArrayAsJSON`, `getTiledArrayAsPng`, etc.) for cleaner call sites.
 *
 * @param arrayPath - Tiled path to the array.
 * @param type - Return format: `'JSON'`, `'PNG'`, `'BUFFER'`, or `'IMAGE_PATH'`. Defaults to `'BUFFER'`.
 * @param options - Format-specific array request options.
 * @returns A promise resolving to the array data in the requested format.
 *
 * @example
 * const buf = await getTiledArrayAs('scans/run1/detector');
 * const img = await getTiledArrayAs('scans/run1/detector', 'PNG', { stack: [0] });
 */
export function getTiledArrayAs<T extends TiledArrayReturnType = 'BUFFER'>(
  arrayPath: string,
  type: T = 'BUFFER' as T,
  options: GetArrayAsOptionsMap[T] = {} as GetArrayAsOptionsMap[T],
): Promise<TiledArrayReturnMap[T]> {
  return activeTiledApiClient.getArrayAs(arrayPath, type, options);
}

/**
 * Fetches a Tiled array as JSON data.
 *
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options (stack, downsampling, format, etc.).
 * @returns A promise resolving to the array data. Defaults to `number[][]`.
 *
 * @example
 * const frame = await getTiledArrayAsJSON<number[][]>('scans/run1/detector', { stack: [0] });
 */
export function getTiledArrayAsJSON<T = number[][]>(
  arrayPath: string,
  options: GetArrayAsOptionsMap['JSON'] = {},
): Promise<T> {
  return activeTiledApiClient.getArrayAsJSON<T>(arrayPath, options);
}

/**
 * Fetches a Tiled array as a PNG `Blob`.
 *
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options (stack, downsampling, format, etc.).
 * @returns A promise resolving to a PNG `Blob`.
 */
export function getTiledArrayAsPng(
  arrayPath: string,
  options: GetArrayAsOptionsMap['PNG'] = {},
): Promise<Blob> {
  return activeTiledApiClient.getArrayAsPng(arrayPath, options);
}

/**
 * Builds and returns the full URL for a Tiled array image without making a
 * network request. Use the returned string as an `<img src>` attribute.
 *
 * This function is synchronous — it uses any structure already present in
 * `options`; it does not fetch metadata from the server.
 *
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options (stack, format, downsampling, etc.).
 * @returns A URL string pointing to the array image endpoint.
 *
 * @example
 * const src = getTiledArrayAsImagePath('scans/run1/detector', { stack: [0] });
 * return <img src={src} />;
 */
export function getTiledArrayAsImagePath(
  arrayPath: string,
  options: GetArrayAsOptionsMap['IMAGE_PATH'] = {},
): string {
  return activeTiledApiClient.getArrayAsImagePath(arrayPath, options);
}

/**
 * Fetches a Tiled array as a raw `ArrayBuffer`.
 *
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options (stack, downsampling, format, etc.).
 * @returns A promise resolving to an `ArrayBuffer` of the raw bytes.
 */
export function getTiledArrayAsBuffer(
  arrayPath: string,
  options: GetArrayAsOptionsMap['BUFFER'] = {},
): Promise<ArrayBuffer> {
  return activeTiledApiClient.getArrayAsBuffer(arrayPath, options);
}

// ─── Tables ───────────────────────────────────────────────────────────────────

/**
 * Fetches a Tiled table in the specified format and endpoint variant.
 *
 * This is the generic dispatcher; prefer the typed convenience helpers
 * (`getTiledTablePartitionAsJSON`, etc.) for cleaner call sites.
 *
 * @param tablePath - Tiled path to the table.
 * @param type - Return format: `'JSON'` (column-oriented) or `'JSON_SEQ'` (row-oriented).
 * @param endpoint - `'partition'` (single partition) or `'full'` (entire table).
 * @param options - Table request options (partition index, format, etc.).
 * @returns A promise resolving to the table data in the requested format.
 */
export function getTiledTableAs<T extends TiledTableReturnType>(
  tablePath: string,
  type: T = 'JSON' as T,
  endpoint: TiledTableEndpoint = 'partition',
  options: GetTableAsOptionsMap[T] = {} as GetTableAsOptionsMap[T],
): Promise<TiledTableReturnMap[T]> {
  return getDefaultTiledApiClient().getTableAs(tablePath, type, endpoint, options);
}

/**
 * Fetches a single partition of a Tiled table as column-oriented JSON.
 *
 * The response is a `Record<string, unknown[]>` where each key is a column name
 * and each value is an array of column values.
 *
 * @param tablePath - Tiled path to the table.
 * @param options - Table request options (partition index defaults to `0`).
 * @returns A promise resolving to the column-oriented JSON response.
 */
export function getTiledTablePartitionAsJSON(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON'] = {},
): Promise<TiledTableJSONResponse> {
  return getDefaultTiledApiClient().getTablePartitionAsJSON(tablePath, options);
}

/**
 * Fetches a single partition of a Tiled table as a row-oriented JSON sequence.
 *
 * Each element in the returned array is one row represented as a plain object.
 *
 * @param tablePath - Tiled path to the table.
 * @param options - Table request options (partition index defaults to `0`).
 * @returns A promise resolving to an array of row objects.
 */
export function getTiledTablePartitionAsJSONSequence(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON_SEQ'] = {},
): Promise<TiledTableRow[]> {
  return getDefaultTiledApiClient().getTablePartitionAsJSONSequence(tablePath, options);
}

/**
 * Fetches the full (all partitions) Tiled table as column-oriented JSON.
 *
 * @param tablePath - Tiled path to the table.
 * @param options - Table request options.
 * @returns A promise resolving to the column-oriented JSON response.
 */
export function getTiledTableFullAsJSON(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON'] = {},
): Promise<TiledTableJSONResponse> {
  return getDefaultTiledApiClient().getTableFullAsJSON(tablePath, options);
}

/**
 * Fetches the full (all partitions) Tiled table as a row-oriented JSON sequence.
 *
 * @param tablePath - Tiled path to the table.
 * @param options - Table request options.
 * @returns A promise resolving to an array of row objects.
 */
export function getTiledTableFullAsJSONSequence(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON_SEQ'] = {},
): Promise<TiledTableRow[]> {
  return getDefaultTiledApiClient().getTableFullAsJSONSequence(tablePath, options);
}

// ─── Metadata / Info ──────────────────────────────────────────────────────────

/**
 * Fetches Tiled server information (authentication providers, version, etc.).
 *
 * Returns `null` if the server is unreachable or the response is malformed.
 *
 * @param options - Request options (e.g. `baseUrl` override).
 * @returns A promise resolving to `TiledInfoResponse` or `null`.
 */
export function getTiledServerInfo(
  options: TiledRequestOptions = {},
): Promise<TiledInfoResponse | null> {
  return getDefaultTiledApiClient().getServerInfo(options);
}

/**
 * Fetches Tiled item metadata for the given path.
 *
 * Returns the `TiledSearchItem` directly (not a `{ data, error }` wrapper).
 * Access the item path via `item.id` and its structure via
 * `item.attributes.structure`.
 *
 * @param path - Tiled path to the item.
 * @param options - Request options (e.g. `baseUrl` override).
 * @returns A promise resolving to the typed `TiledSearchItem`.
 *
 * @example
 * const item = await getTiledMetadata<ArrayStructure>('scans/run1/detector');
 * console.log(item.attributes.structure.shape);
 */
export function getTiledMetadata<S extends TiledStructures = TiledStructures>(
  path: string,
  options: TiledRequestOptions = {},
): Promise<TiledSearchItem<S>> {
  return getDefaultTiledApiClient().getMetadata<S>(path, options);
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Performs a Tiled search at the given path with optional filters and options.
 *
 * @param searchPath - Container path to search within (empty string for root).
 * @param config - Search configuration including `searchFilters` and `searchOptions`.
 * @param requestOptions - Per-request HTTP options (baseUrl, initialPath, etc.).
 * @returns A promise resolving to a `TiledSearchResult` with paginated items.
 *
 * @example
 * const results = await getTiledSearch('experiments', {
 *   searchFilters: { specs: { include: ['BlueskyRun'], exclude: [] } },
 *   searchOptions: { sort: '-', pageLimit: 25 },
 * });
 */
export function getTiledSearch(
  searchPath: string,
  config: TiledSearchConfig = {},
  requestOptions: TiledRequestOptions = {},
): Promise<TiledSearchResult> {
  return getDefaultTiledApiClient().getSearch(searchPath, config, requestOptions);
}

/**
 * Searches a Tiled container, filtering by item specs (tags).
 *
 * @param searchPath - Container path to search within.
 * @param include - Spec strings that items must match (e.g. `['BlueskyRun']`).
 * @param exclude - Spec strings that items must not have. Defaults to `[]`.
 * @param searchOptions - Pagination and sorting options.
 * @param requestOptions - Per-request HTTP options.
 * @returns A promise resolving to a `TiledSearchResult`.
 */
export function getTiledSearchBySpecs(
  searchPath: string,
  include: string[],
  exclude: string[] = [],
  searchOptions: TiledSearchOptions = {},
  requestOptions: TiledRequestOptions = {},
): Promise<TiledSearchResult> {
  return getTiledSearch(
    searchPath,
    { searchFilters: { specs: { include, exclude } }, searchOptions },
    requestOptions,
  );
}

/**
 * Searches a Tiled container using full-text search across item metadata.
 *
 * @param searchPath - Container path to search within.
 * @param text - Text to search for.
 * @param searchOptions - Pagination and sorting options.
 * @param requestOptions - Per-request HTTP options.
 * @returns A promise resolving to a `TiledSearchResult`.
 */
export function getTiledSearchByFullText(
  searchPath: string,
  text: string,
  searchOptions: TiledSearchOptions = {},
  requestOptions: TiledRequestOptions = {},
): Promise<TiledSearchResult> {
  return getTiledSearch(
    searchPath,
    { searchFilters: { fulltext: { text } }, searchOptions },
    requestOptions,
  );
}

/**
 * Searches a Tiled container for items where a metadata key equals a value.
 *
 * @param searchPath - Container path to search within.
 * @param key - Metadata key to match against.
 * @param value - Expected value for the metadata key.
 * @param searchOptions - Pagination and sorting options.
 * @param requestOptions - Per-request HTTP options.
 * @returns A promise resolving to a `TiledSearchResult`.
 */
export function getTiledSearchByMetadataEquals(
  searchPath: string,
  key: string,
  value: string,
  searchOptions: TiledSearchOptions = {},
  requestOptions: TiledRequestOptions = {},
): Promise<TiledSearchResult> {
  return getTiledSearch(
    searchPath,
    { searchFilters: { eq: { key, value } }, searchOptions },
    requestOptions,
  );
}

/**
 * Searches a Tiled container, filtering by structure family.
 *
 * @param searchPath - Container path to search within.
 * @param family - Structure family to filter by: `'container'`, `'array'`,
 *   `'table'`, `'awkward'`, or `'sparse'`.
 * @param searchOptions - Pagination and sorting options.
 * @param requestOptions - Per-request HTTP options.
 * @returns A promise resolving to a `TiledSearchResult`.
 */
export function getTiledSearchByStructureFamily(
  searchPath: string,
  family: 'container' | 'array' | 'table' | 'awkward' | 'sparse',
  searchOptions: TiledSearchOptions = {},
  requestOptions: TiledRequestOptions = {},
): Promise<TiledSearchResult> {
  return getTiledSearch(
    searchPath,
    { searchFilters: { structureFamily: { value: family } }, searchOptions },
    requestOptions,
  );
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Sets or clears the bearer token on the singleton.
 *
 * Once set, every request includes `Authorization: Bearer <token>`. The token
 * is also automatically refreshed on 401 responses using the refresh token
 * stored in localStorage.
 *
 * @param token - Bearer token string, or `null` to clear it.
 */
export function setDefaultBearerToken(token: string | null): void {
  activeTiledApiClient.setBearerToken(token);
}

/**
 * Registers a callback that is invoked when a token-refresh attempt fails.
 *
 * Use this to show a login prompt or redirect the user. Called with the error
 * that caused the refresh to fail (or `null` if no stored tokens were found).
 *
 * @param callback - Function to call on auth failure, or `undefined` to clear it.
 */
export function setDefaultAuthErrorCallback(callback: AuthErrorCallback | undefined): void {
  activeTiledApiClient.setAuthErrorCallback(callback);
}

/**
 * Authenticates with the Tiled server using a username and password.
 *
 * Fetches the server's auth endpoint (via `getServerInfo`), POSTs credentials
 * as `multipart/form-data`, saves the returned tokens to localStorage, and
 * sets the bearer token on the singleton.
 *
 * @param username - The user's login name.
 * @param password - The user's password.
 * @param url - Optional server URL override (defaults to the singleton's base URL).
 * @param provider - Optional pre-fetched auth provider. If omitted, the first
 *   password/internal provider from server info is used.
 * @returns A promise resolving to `{ access_token, refresh_token }` on success,
 *   or `null` on failure.
 *
 * @example
 * const tokens = await loginWithDefaultTiledClient('alice', 'secret');
 * if (!tokens) console.error('Login failed');
 */
export function loginWithDefaultTiledClient(
  username: string,
  password: string,
  url?: string,
  provider?: TiledAuthProvider,
): Promise<{ access_token: string; refresh_token: string } | null> {
  return activeTiledApiClient.loginWithUsernamePassword(username, password, url, provider);
}
