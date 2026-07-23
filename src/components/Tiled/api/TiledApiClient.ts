// TiledApiClient.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  ResponseType,
} from 'axios';
import { getAuthFromLocalStorage, saveAuthToLocalStorage, clearAuthFromLocalStorage } from '../utils';

import type { FinchTiledApi } from './TiledFinchApi';
import type {
  TiledArrayReturnType,
  TiledArrayReturnMap,
  GetArrayAsOptionsMap,
  TiledArrayRequestOptions,
} from './TiledArrayApi';
import { buildTiledArraySlice, buildTiledArraySliceAsync } from './TiledArrayApi';
import type { StructureFetcher } from './TiledArrayApi';
import type { GetTableAsOptionsMap, TiledTableApi, TiledTableReturnMap, TiledTableReturnType, TiledTableEndpoint, TiledTableJSONResponse } from './TiledTableApi';
import type { TiledSearchConfig } from './TiledSearchApi';
import { buildSearchParams } from './TiledSearchApi';
import type { TiledClientConfigApi, TiledRequestOptions, TiledPathMode } from './TiledConfigApi';
import { parseJsonSequenceTableResponse } from './TiledTableApi';
import type { TiledTableRow, TiledSearchItem, TiledSearchMetadataResult, TiledStructures, ArrayStructure, TiledSearchResult, TiledInfoResponse, TiledAuthProvider } from '../types';
import { isValidTiledInfoResponse } from '../types';
type GetTableAsJSONOptions = GetTableAsOptionsMap['JSON'];
type GetTableAsJSONSequenceOptions = GetTableAsOptionsMap['JSON_SEQ'];


type AuthErrorCallback = (error: unknown) => void;

export type TiledApiClientConfig = {
  client?: AxiosInstance;
  baseUrl?: string;
  initialPath?: string;
  apiKey?: string | null;
  signal?: AbortSignal;
  maxArrayBytes?: number;
  onAuthError?: AuthErrorCallback;
};


export class TiledApiClient implements FinchTiledApi {
  private client: AxiosInstance;
  private baseUrl: string;
  private initialPath: string;
  private apiKey: string | null;
  private signal: AbortSignal | undefined;
  private maxArrayBytes: number | undefined;
  private authErrorCallback: AuthErrorCallback | undefined;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: TiledApiClientConfig = {}) {
    this.client =
      config.client ??
      axios.create({
        baseURL: normalizeBaseUrl(config.baseUrl ?? ''),
        withCredentials: true,
      });

    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? '');
    this.initialPath = normalizeTiledPath(config.initialPath ?? '');
    this.apiKey = config.apiKey ?? null;
    this.signal = config.signal;
    this.maxArrayBytes = config.maxArrayBytes;
    this.authErrorCallback = config.onAuthError;

    this.client.interceptors.request.use((requestConfig) => {
      if (this.apiKey && !requestConfig.headers.Authorization) {
        requestConfig.headers.Authorization = `ApiKey ${this.apiKey}`;
      }
      return requestConfig;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        const axiosError = error as { config?: AxiosRequestConfig & { _retry?: boolean }; response?: { status?: number } };
        const originalRequest = axiosError.config;

        if (axiosError.response?.status !== 401 || !originalRequest || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        //prevent concurrent 401s from attempting to refresh the token
        if (!this.refreshPromise) {
          this.refreshPromise = this.doTokenRefresh(originalRequest.baseURL as string).finally(() => {
            this.refreshPromise = null;
          });
        }

        try {
          const newToken = await this.refreshPromise; //subsequent 401s wait until the first refresh promise is done
          originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
          return this.client(originalRequest);
        } catch {
          return Promise.reject(error);
        }
      },
    );
  }

  /**
   * Sets the Tiled server base URL and updates the underlying Axios instance.
   * Must include the API version segment, e.g. `"https://server.example.com/api/v1"`.
   * @param baseUrl - Full server base URL.
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.client.defaults.baseURL = this.baseUrl;
  }

  /** Returns the current base URL. */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Sets the initial path prefix prepended to all relative request paths.
   * Leading/trailing slashes are normalised automatically.
   * @param initialPath - Path prefix, e.g. `"data/project"`.
   */
  setInitialPath(initialPath: string): void {
    this.initialPath = normalizeTiledPath(initialPath);
  }

  /** Returns the current initial path prefix. */
  getInitialPath(): string {
    return this.initialPath;
  }

  /**
   * Sets the API key. The request interceptor attaches it as
   * `Authorization: ApiKey <key>` to every request without an existing
   * `Authorization` header.
   * @param apiKey - API key string, or `null` to clear it.
   */
  setApiKey(apiKey: string | null): void {
    this.apiKey = apiKey;
  }

  /** Returns the current API key, or `null` if none is set. */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /** Returns the underlying Axios instance for low-level configuration. */
  getAxiosClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Sets a default `AbortSignal` applied to every request made by this client.
   * @param signal - An `AbortSignal`, or `undefined` to clear it.
   */
  setSignal(signal: AbortSignal | undefined): void {
    this.signal = signal;
  }

  /** Returns the current default abort signal, or `undefined` if none is set. */
  getSignal(): AbortSignal | undefined {
    return this.signal;
  }

  /**
   * Sets a global maximum payload size for array requests.
   * When set, the client auto-computes a downsample step so the payload stays
   * under this byte limit. Per-request `maxBytesAllowed` still takes precedence.
   * @param maxArrayBytes - Byte limit, or `undefined` to disable.
   */
  setMaxArrayBytes(maxArrayBytes: number | undefined): void {
    this.maxArrayBytes = maxArrayBytes;
  }

  /** Returns the current global max array bytes limit, or `undefined` if none. */
  getMaxArrayBytes(): number | undefined {
    return this.maxArrayBytes;
  }

  /**
   * Registers a callback invoked when a token-refresh attempt fails.
   * Use this to show a login prompt or redirect the user.
   * @param callback - Function called with the error (or `null` if no stored tokens),
   *   or `undefined` to clear any existing callback.
   */
  setAuthErrorCallback(callback: AuthErrorCallback | undefined): void {
    this.authErrorCallback = callback;
  }

  /**
   * Sets or clears the bearer token on the Axios instance.
   * Once set, all requests include `Authorization: Bearer <token>`.
   * @param token - Bearer token string, or `null` to remove the header.
   */
  setBearerToken(token: string | null): void {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  private async doTokenRefresh(requestUrl: string): Promise<string> {
    const auth = getAuthFromLocalStorage();
    if (!auth) {
      this.authErrorCallback?.(null);
      throw new Error('No stored auth tokens');
    }

    try {
      const apiV1Index = requestUrl.indexOf('/api/v1');
      const refreshBase = apiV1Index !== -1
        ? requestUrl.slice(0, apiV1Index + '/api/v1'.length)
        : this.baseUrl;
      //the endpoint was changed in more recent Tiled versions from /auth/refresh to /auth/session/refresh
      const refreshResponse = await axios.post(`${refreshBase}/auth/session/refresh`, {
        refresh_token: auth.refreshToken,
      });
      let newAccessToken: string | undefined;
      //in case the refreshResponse returns 404 which may indicate we are on an earlier Tiled server version, attempt /auth/refresh once
      if (refreshResponse.status === 404) {
        const fallbackRefreshResponse = await axios.post(`${refreshBase}/auth/refresh`, {
          refresh_token: auth.refreshToken,
        });
        newAccessToken = fallbackRefreshResponse.data.access_token as string;
      } else {
        newAccessToken = refreshResponse.data.access_token as string;
      }
      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }
      saveAuthToLocalStorage(auth.refreshToken, newAccessToken);
      this.setBearerToken(newAccessToken);
      return newAccessToken;
    } catch (refreshError) {
      clearAuthFromLocalStorage();
      this.authErrorCallback?.(refreshError);
      throw refreshError;
    }
  }

  private resolveArrayOptions<T extends TiledArrayRequestOptions>(options: T): T {
    if (this.maxArrayBytes === undefined || options.maxBytesAllowed !== undefined) {
      return options;
    }
    return { ...options, maxBytesAllowed: this.maxArrayBytes };
  }

/**
 * Generic array dispatcher. Fetches the array in the specified format and
 * returns the strongly-typed result.
 *
 * Prefer the typed helpers (`getArrayAsJSON`, `getArrayAsPng`, etc.) for
 * cleaner call sites.
 *
 * @param arrayPath - Tiled path to the array.
 * @param type - Output format: `'JSON'`, `'PNG'`, `'BUFFER'`, or `'IMAGE_PATH'`.
 * @param options - Format-specific options.
 * @returns A promise resolving to the array data in the requested format.
 */
async getArrayAs<T extends TiledArrayReturnType>(
  arrayPath: string,
  type: T,
  options: GetArrayAsOptionsMap[T] = {} as GetArrayAsOptionsMap[T],
): Promise<TiledArrayReturnMap[T]> {
  switch (type) {
    case 'JSON':
      return this.getArrayAsJSON(
        arrayPath,
        options as GetArrayAsOptionsMap['JSON'],
      ) as Promise<TiledArrayReturnMap[T]>;

    case 'PNG':
      return this.getArrayAsPng(
        arrayPath,
        options as GetArrayAsOptionsMap['PNG'],
      ) as Promise<TiledArrayReturnMap[T]>;

    case 'BUFFER':
      return this.getArrayAsBuffer(
        arrayPath,
        options as GetArrayAsOptionsMap['BUFFER'],
      ) as Promise<TiledArrayReturnMap[T]>;

    case 'IMAGE_PATH':
      return Promise.resolve(
        this.getArrayAsImagePath(
          arrayPath,
          options as GetArrayAsOptionsMap['IMAGE_PATH'],
        ),
      ) as Promise<TiledArrayReturnMap[T]>;

    default:
      throw new Error(`Unsupported array return type: ${type}`);
  }
}

/**
 * Fetches a Tiled array as JSON data.
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options (stack, downsampling, maxBytesAllowed, etc.).
 * @returns A promise resolving to the array data. Defaults to `number[][]`.
 */
async getArrayAsJSON<T = number[][]>(
  arrayPath: string,
  options: GetArrayAsOptionsMap['JSON'] = {},
): Promise<T> {
  options = this.resolveArrayOptions(options);
  const endpoint = this.resolveArrayFullEndpoint(arrayPath, options);
  const slice = await buildTiledArraySliceAsync(arrayPath, options, this.makeStructureFetcher(options));

  return this.get<T>(endpoint, options, {
    params: {
      format: options.format ?? 'application/json',
      slice,
    },
    headers: {
      Accept: options.format ?? 'application/json',
    },
  });
}

/**
 * Fetches a Tiled array as a PNG `Blob`.
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options (stack, downsampling, etc.).
 * @returns A promise resolving to a PNG `Blob`.
 */
async getArrayAsPng(
  arrayPath: string,
  options: GetArrayAsOptionsMap['PNG'] = {},
): Promise<Blob> {
  options = this.resolveArrayOptions(options);
  const endpoint = this.resolveArrayFullEndpoint(arrayPath, options);
  const format = options.format ?? 'image/png';
  const slice = await buildTiledArraySliceAsync(arrayPath, options, this.makeStructureFetcher(options));

  return this.get<Blob>(endpoint, options, {
    responseType: 'blob',
    params: { format, slice },
    headers: { Accept: format },
  });
}

/**
 * Fetches a Tiled array as a raw `ArrayBuffer`.
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options.
 * @returns A promise resolving to an `ArrayBuffer` of raw bytes.
 */
async getArrayAsBuffer(
  arrayPath: string,
  options: GetArrayAsOptionsMap['BUFFER'] = {},
): Promise<ArrayBuffer> {
  options = this.resolveArrayOptions(options);
  const endpoint = this.resolveArrayFullEndpoint(arrayPath, options);
  const format = options.format ?? 'application/octet-stream';
  const slice = await buildTiledArraySliceAsync(arrayPath, options, this.makeStructureFetcher(options));

  return this.get<ArrayBuffer>(endpoint, options, {
    responseType: 'arraybuffer',
    params: { format, slice },
    headers: { Accept: format },
  });
}

/**
 * Builds and returns a full URL for a Tiled array image without making a
 * network request. Suitable for use directly as an `<img src>` attribute.
 *
 * This method is synchronous and uses structure already present in `options`
 * — it does not fetch metadata from the server.
 *
 * @param arrayPath - Tiled path to the array.
 * @param options - Array request options (stack, format, downsampling, etc.).
 * @returns A URL string pointing to the array image endpoint.
 */
getArrayAsImagePath(
  arrayPath: string,
  options: GetArrayAsOptionsMap['IMAGE_PATH'] = {},
): string {
  options = this.resolveArrayOptions(options);
  const baseUrl = this.resolveBaseUrl(options);
  const endpoint = this.resolveArrayFullEndpoint(arrayPath, options);
  const url = new URL(`${baseUrl}${endpoint}`);

  const format = options.format ?? 'image/png';
  url.searchParams.set('format', format);

  const slice = buildTiledArraySlice(options);
  if (slice) {
    url.searchParams.set('slice', slice);
  }

  return url.toString();
}

/**
 * Fetches Tiled item metadata for the given path.
 * Returns the `TiledSearchItem` directly (not a `{ data, error }` wrapper).
 * @param path - Tiled path to the item.
 * @param options - Per-request options (baseUrl override, pathMode, etc.).
 * @returns A promise resolving to the typed `TiledSearchItem`.
 */
async getMetadata<S extends TiledStructures = TiledStructures>(
  path: string,
  options: TiledRequestOptions = {},
): Promise<TiledSearchItem<S>> {
  const endpoint = this.resolveMetadataEndpoint(path, options);
  const response = await this.get<TiledSearchMetadataResult>(endpoint, options, {
    headers: { Accept: 'application/json' },
  });
  return response.data as TiledSearchItem<S>;
}

/**
 * Generic table dispatcher. Fetches the table in the specified format and
 * endpoint variant. Prefer the typed helpers for cleaner call sites.
 * @param tablePath - Tiled path to the table.
 * @param type - `'JSON'` for column-oriented or `'JSON_SEQ'` for row-oriented.
 * @param endpoint - `'partition'` (single partition) or `'full'` (all partitions).
 * @param options - Table request options.
 * @returns A promise resolving to the table data.
 */
async getTableAs<T extends TiledTableReturnType>(
  tablePath: string,
  type: T = 'JSON' as T,
  endpoint: TiledTableEndpoint = 'partition',
  options: GetTableAsOptionsMap[T] = {} as GetTableAsOptionsMap[T],
): Promise<TiledTableReturnMap[T]> {
  if (endpoint === 'full') {
    switch (type) {
      case 'JSON':
        return this.getTableFullAsJSON(tablePath, options as GetTableAsJSONOptions) as Promise<TiledTableReturnMap[T]>;
      case 'JSON_SEQ':
        return this.getTableFullAsJSONSequence(tablePath, options as GetTableAsJSONSequenceOptions) as Promise<TiledTableReturnMap[T]>;
      default:
        throw new Error(`Unsupported table return type: ${String(type)}`);
    }
  }
  switch (type) {
    case 'JSON':
      return this.getTablePartitionAsJSON(tablePath, options as GetTableAsJSONOptions) as Promise<TiledTableReturnMap[T]>;
    case 'JSON_SEQ':
      return this.getTablePartitionAsJSONSequence(tablePath, options as GetTableAsJSONSequenceOptions) as Promise<TiledTableReturnMap[T]>;
    default:
      throw new Error(`Unsupported table return type: ${String(type)}`);
  }
}

/**
 * Fetches a single partition of a Tiled table as column-oriented JSON.
 * @param tablePath - Tiled path to the table.
 * @param options - Options including `partition` index (defaults to `0`).
 * @returns A promise resolving to a `Record<columnName, values[]>` object.
 */
async getTablePartitionAsJSON(
  tablePath: string,
  options: GetTableAsJSONOptions = {},
): Promise<TiledTableJSONResponse> {
  const endpoint = this.resolveTablePartitionEndpoint(tablePath, options);
  const format = options.format ?? 'application/json';
  return this.get<TiledTableJSONResponse>(endpoint, options, {
    params: { partition: options.partition ?? 0, format },
    headers: { Accept: format },
  });
}

/**
 * Fetches a single partition of a Tiled table as row-oriented JSON sequence.
 * @param tablePath - Tiled path to the table.
 * @param options - Options including `partition` index (defaults to `0`).
 * @returns A promise resolving to an array of row objects.
 */
async getTablePartitionAsJSONSequence(
  tablePath: string,
  options: GetTableAsJSONSequenceOptions = {},
): Promise<TiledTableRow[]> {
  const endpoint = this.resolveTablePartitionEndpoint(tablePath, options);
  const format = options.format ?? 'application/json-seq';
  const response = await this.get<unknown>(endpoint, options, {
    responseType: 'text',
    params: { partition: options.partition ?? 0, format },
    headers: { Accept: format },
  });
  return parseJsonSequenceTableResponse(response);
}

/**
 * Fetches the full (all partitions) Tiled table as column-oriented JSON.
 * @param tablePath - Tiled path to the table.
 * @param options - Table request options.
 * @returns A promise resolving to a `Record<columnName, values[]>` object.
 */
async getTableFullAsJSON(
  tablePath: string,
  options: GetTableAsJSONOptions = {},
): Promise<TiledTableJSONResponse> {
  const endpoint = this.resolveTableFullEndpoint(tablePath, options);
  const format = options.format ?? 'application/json';
  return this.get<TiledTableJSONResponse>(endpoint, options, {
    params: { format },
    headers: { Accept: format },
  });
}

/**
 * Fetches the full (all partitions) Tiled table as row-oriented JSON sequence.
 * @param tablePath - Tiled path to the table.
 * @param options - Table request options.
 * @returns A promise resolving to an array of row objects.
 */
async getTableFullAsJSONSequence(
  tablePath: string,
  options: GetTableAsJSONSequenceOptions = {},
): Promise<TiledTableRow[]> {
  const endpoint = this.resolveTableFullEndpoint(tablePath, options);
  const format = options.format ?? 'application/json-seq';
  const response = await this.get<unknown>(endpoint, options, {
    responseType: 'text',
    params: { format },
    headers: { Accept: format },
  });
  return parseJsonSequenceTableResponse(response);
}

  private async get<T>(
    endpoint: string,
    options: TiledRequestOptions = {},
    config: AxiosRequestConfig = {},
  ): Promise<T> {
    const client = this.resolveClient(options);
    const baseURL = this.resolveBaseUrl(options);

    const apiKey = options.apiKey !== undefined ? options.apiKey : this.apiKey;
    const authHeader = apiKey ? { Authorization: `Apikey ${apiKey}` } : {};

    const response = await client.get<T>(endpoint, {
      ...config,
      baseURL,
      signal: options.signal ?? this.signal,
      params: removeUndefinedValues({
        ...config.params,
      }),
      headers: {
        ...authHeader,
        ...config.headers,
      },
    });

    return response.data;
  }

  private resolveClient(options: TiledRequestOptions = {}): AxiosInstance {
    return options.client ?? this.client;
  }

  private resolveBaseUrl(options: TiledRequestOptions = {}): string {
    return normalizeBaseUrl(options.baseUrl ?? this.baseUrl);
  }

  private resolveArrayFullEndpoint(
    arrayPath: string,
    options: TiledRequestOptions = {},
  ): string {
    const encodedPath = this.resolveEncodedPath(arrayPath, options);
    return `/array/full/${encodedPath}`;
  }

  private resolveArrayBlockEndpoint(
    arrayPath: string,
    options: TiledRequestOptions = {},
  ): string {
    const encodedPath = this.resolveEncodedPath(arrayPath, options);
    return `/array/block/${encodedPath}`;
  }

  /**
   * Fetches Tiled server information (auth providers, version, etc.).
   * Returns `null` if the server is unreachable or the response is malformed.
   * @param options - Per-request options (e.g. `baseUrl` override).
   * @returns A promise resolving to `TiledInfoResponse` or `null`.
   */
  async getServerInfo(options: TiledRequestOptions = {}): Promise<TiledInfoResponse | null> {
    try {
      const result = await this.get<TiledInfoResponse>('/', options, {
        headers: { Accept: 'application/json' },
      });
      return isValidTiledInfoResponse(result) ? result : null;
    } catch {
      return null;
    }
  }

  /**
   * Performs a Tiled search at the given path with optional filters and options.
   * @param searchPath - Container path to search within (empty string for root).
   * @param config - Search configuration: `searchFilters` and `searchOptions`.
   * @param requestOptions - Per-request HTTP options (baseUrl, initialPath, etc.).
   * @returns A promise resolving to a `TiledSearchResult` with paginated items.
   */
  async getSearch(
    searchPath: string,
    config: TiledSearchConfig = {},
    requestOptions: TiledRequestOptions = {},
  ): Promise<TiledSearchResult> {
    const endpoint = this.resolveSearchEndpoint(searchPath, requestOptions);
    return this.get<TiledSearchResult>(endpoint, requestOptions, {
      params: buildSearchParams(config),
      headers: { Accept: 'application/json' },
    });
  }

  private resolveSearchEndpoint(
    path: string,
    options: TiledRequestOptions = {},
  ): string {
    const encodedPath = this.resolveEncodedPath(path, options);
    return encodedPath ? `/search/${encodedPath}` : '/search/';
  }

  private makeStructureFetcher(options: TiledRequestOptions): StructureFetcher {
    return (path: string) =>
      this.getMetadata<ArrayStructure>(path, options)
        .then((item) => item.attributes.structure)
        .catch(() => undefined);
  }

  private resolveMetadataEndpoint(
    path: string,
    options: TiledRequestOptions = {},
  ): string {
    const encodedPath = this.resolveEncodedPath(path, options);
    return `/metadata/${encodedPath}`;
  }

  private resolveTableFullEndpoint(
    tablePath: string,
    options: TiledRequestOptions = {},
  ): string {
    const encodedPath = this.resolveEncodedPath(tablePath, options);
    return `/table/full/${encodedPath}`;
  }

  private resolveTablePartitionEndpoint(
    tablePath: string,
    options: TiledRequestOptions = {},
  ): string {
    const encodedPath = this.resolveEncodedPath(tablePath, options);

    return `/table/partition/${encodedPath}`;
  }

  /**
   * Authenticates with the Tiled server using a username and password.
   *
   * Resolves the auth endpoint from `provider.links.auth_endpoint` or, if no
   * provider is given, from the first password/internal provider in server info.
   * On success, saves tokens to localStorage and sets the bearer token on this
   * client instance.
   *
   * @param username - The user's login name.
   * @param password - The user's password.
   * @param url - Optional server URL override. Defaults to this client's base URL.
   * @param provider - Optional pre-fetched auth provider.
   * @returns A promise resolving to `{ access_token, refresh_token }` on success,
   *   or `null` on failure.
   */
  async loginWithUsernamePassword(
    username: string,
    password: string,
    url?: string,
    provider?: TiledAuthProvider,
  ): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
      let authEndpoint = '';
      if (provider && (provider.mode === 'password' || provider.mode === 'internal')) {
        if (!provider.links?.auth_endpoint) {
          console.error('Provided authentication provider is missing auth_endpoint');
          return null;
        }
        authEndpoint = provider.links.auth_endpoint;
      } else {
        const serverInfo = await this.getServerInfo(url ? { baseUrl: url } : {});
        if (!serverInfo?.authentication?.providers) {
          console.error('No authentication providers found in server info');
          return null;
        }
        const passwordProvider = serverInfo.authentication.providers.find(
          (p: TiledAuthProvider) => p.mode === 'password' || p.mode === 'internal',
        );
        if (!passwordProvider?.links?.auth_endpoint) {
          console.error('No password authentication provider found');
          return null;
        }
        authEndpoint = passwordProvider.links.auth_endpoint;
      }

      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await this.client.post<{ access_token: string; refresh_token: string }>(
        authEndpoint,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      const { access_token, refresh_token } = response.data;
      if (access_token && refresh_token) {
        saveAuthToLocalStorage(refresh_token, access_token);
        this.setBearerToken(access_token);
        return { access_token, refresh_token };
      }
      console.error('Login response missing required tokens');
      return null;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  }

  private resolveEncodedPath(
    path: string,
    options: TiledRequestOptions = {},
  ): string {
    const fullPath = this.resolveTiledPath(path, options);
    return encodeTiledPath(fullPath);
  }
  //handles the initialPath merge
  private resolveTiledPath(
    path: string,
    options: TiledRequestOptions = {},
  ): string {
    const pathMode = options.pathMode ?? 'relative';
    const normalizedPath = normalizeTiledPath(path);

    if (pathMode === 'absolute') {
      return normalizedPath;
    }

    const initialPath = normalizeTiledPath(
      options.initialPath ?? this.initialPath,
    );

    if (!initialPath) {
      return normalizedPath;
    }

    if (!normalizedPath) {
      return initialPath;
    }

    return `${initialPath}/${normalizedPath}`;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function normalizeTiledPath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .join('/');
}

function encodeTiledPath(path: string): string {
  return normalizeTiledPath(path)
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

function formatTiledSlice(slice?: number[]): string | undefined {
  if (!slice || slice.length === 0) {
    return undefined;
  }

  return `${slice.join(',')},`;
}

function getResponseTypeForFormat(format: string): ResponseType {
  if (format === 'application/json') {
    return 'json';
  }

  if (format === 'image/png') {
    return 'blob';
  }

  return 'arraybuffer';
}

function removeUndefinedValues<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;
}