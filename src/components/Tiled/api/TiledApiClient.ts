// TiledApiClient.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  ResponseType,
} from 'axios';

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
import type { TiledTableRow, TiledSearchItem, TiledSearchMetadataResult, TiledStructures, ArrayStructure, TiledSearchResult, TiledInfoResponse } from '../types';
import { isValidTiledInfoResponse } from '../types';
type GetTableAsJSONOptions = GetTableAsOptionsMap['JSON'];
type GetTableAsJSONSequenceOptions = GetTableAsOptionsMap['JSON_SEQ'];


export type TiledApiClientConfig = {
  client?: AxiosInstance;
  baseUrl?: string;
  initialPath?: string;
  apiKey?: string | null;
  signal?: AbortSignal;
  maxArrayBytes?: number;
};


export class TiledApiClient implements FinchTiledApi {
  private client: AxiosInstance;
  private baseUrl: string;
  private initialPath: string;
  private apiKey: string | null;
  private signal: AbortSignal | undefined;
  private maxArrayBytes: number | undefined;

  constructor(config: TiledApiClientConfig = {}) {
    this.client =
      config.client ??
      axios.create({
        baseURL: normalizeBaseUrl(config.baseUrl ?? ''),
      });

    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? '');
    this.initialPath = normalizeTiledPath(config.initialPath ?? '');
    this.apiKey = config.apiKey ?? null;
    this.signal = config.signal;
    this.maxArrayBytes = config.maxArrayBytes;

    this.client.interceptors.request.use((requestConfig) => {
      if (this.apiKey && !requestConfig.headers.Authorization) {
        //only set the apiKey from config if we didn't have auth headers set via tiledRequestOptions
        requestConfig.headers.Authorization = `ApiKey ${this.apiKey}`;
      }

      return requestConfig;
    });
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.client.defaults.baseURL = this.baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setInitialPath(initialPath: string): void {
    this.initialPath = normalizeTiledPath(initialPath);
  }

  getInitialPath(): string {
    return this.initialPath;
  }

  setApiKey(apiKey: string | null): void {
    this.apiKey = apiKey;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  getAxiosClient(): AxiosInstance {
    return this.client;
  }

  setSignal(signal: AbortSignal | undefined): void {
    this.signal = signal;
  }

  getSignal(): AbortSignal | undefined {
    return this.signal;
  }

  setMaxArrayBytes(maxArrayBytes: number | undefined): void {
    this.maxArrayBytes = maxArrayBytes;
  }

  getMaxArrayBytes(): number | undefined {
    return this.maxArrayBytes;
  }

  private resolveArrayOptions<T extends TiledArrayRequestOptions>(options: T): T {
    if (this.maxArrayBytes === undefined || options.maxBytesAllowed !== undefined) {
      return options;
    }
    return { ...options, maxBytesAllowed: this.maxArrayBytes };
  }

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
    console.log({options})

    const apiKey = options.apiKey !== undefined ? options.apiKey : this.apiKey;
    const authHeader = apiKey ? { Authorization: `Apikey ${apiKey}` } : {};
    console.log({authHeader})

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