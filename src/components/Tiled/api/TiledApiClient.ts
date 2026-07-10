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
} from './TiledArrayApi';
import { buildTiledArraySlice } from './TiledArrayApi';
import type { TiledTableApi } from './TiledTableApi';
import type { TiledSearchApi } from './TiledSearchApi';
import type { TiledClientConfigApi, TiledRequestOptions, TiledPathMode } from './TiledConfigApi';



export type TiledApiClientConfig = {
  client?: AxiosInstance;
  baseUrl?: string;
  initialPath?: string;
  apiKey?: string | null;
};


export class TiledApiClient implements FinchTiledApi {
  private client: AxiosInstance;
  private baseUrl: string;
  private initialPath: string;
  private apiKey: string | null;

  constructor(config: TiledApiClientConfig = {}) {
    this.client =
      config.client ??
      axios.create({
        baseURL: normalizeBaseUrl(config.baseUrl ?? ''),
      });

    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? '');
    this.initialPath = normalizeTiledPath(config.initialPath ?? '');
    this.apiKey = config.apiKey ?? null;

    this.client.interceptors.request.use((requestConfig) => {
      if (this.apiKey) {
        requestConfig.headers.Authorization = `ApiKey ${this.apiKey}`;
      } else {
        delete requestConfig.headers.Authorization;
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
  const endpoint = this.resolveArrayFullEndpoint(arrayPath, options);

  return this.get<T>(endpoint, options, {
    params: {
      format: options.format ?? 'application/json',
      slice: buildTiledArraySlice(options),
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
  const endpoint = this.resolveArrayFullEndpoint(arrayPath, options);
  const format = options.format ?? 'image/png';

  return this.get<Blob>(endpoint, options, {
    responseType: 'blob',
    params: {
      format,
      slice: buildTiledArraySlice(options),
    },
    headers: {
      Accept: format,
    },
  });
}

async getArrayAsBuffer(
  arrayPath: string,
  options: GetArrayAsOptionsMap['BUFFER'] = {},
): Promise<ArrayBuffer> {
  const endpoint = this.resolveArrayFullEndpoint(arrayPath, options);
  const format = options.format ?? 'application/octet-stream';

  return this.get<ArrayBuffer>(endpoint, options, {
    responseType: 'arraybuffer',
    params: {
      format,
      slice: buildTiledArraySlice(options),
    },
    headers: {
      Accept: format,
    },
  });
}

getArrayAsImagePath(
  arrayPath: string,
  options: GetArrayAsOptionsMap['IMAGE_PATH'] = {},
): string {
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

  private async get<T>(
    endpoint: string,
    options: TiledRequestOptions = {},
    config: AxiosRequestConfig = {},
  ): Promise<T> {
    const client = this.resolveClient(options);
    const baseURL = this.resolveBaseUrl(options);

    const response = await client.get<T>(endpoint, {
      ...config,
      baseURL,
      signal: options.signal,
      params: removeUndefinedValues({
        ...config.params,
      }),
      headers: {
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