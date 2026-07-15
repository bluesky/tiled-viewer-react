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

function getDefaultBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return '';
}

let activeTiledApiClient = new TiledApiClient({ baseUrl: getDefaultBaseUrl() });

export function getDefaultTiledApiClient(): TiledApiClient {
  return activeTiledApiClient;
}

export function setDefaultTiledApiClient(client: TiledApiClient): void {
  activeTiledApiClient = client;
}

export function resetDefaultTiledApiClient(): void {
  activeTiledApiClient = new TiledApiClient({ baseUrl: getDefaultBaseUrl() });
}

export function setDefaultTiledUrl(baseUrl: string): void {
  activeTiledApiClient.setBaseUrl(baseUrl);
}

export function setDefaultInitialPath(initialPath: string): void {
  activeTiledApiClient.setInitialPath(initialPath);
}

export function setGlobalApiKey(apiKey: string | null): void {
  activeTiledApiClient.setApiKey(apiKey);
}

export function setGlobalMaxArrayBytes(maxBytes: number | undefined): void {
  activeTiledApiClient.setMaxArrayBytes(maxBytes);
}

export function getTiledArrayAsJSON<T = number[][]>(
  arrayPath: string,
  options: GetArrayAsOptionsMap['JSON'] = {},
): Promise<T> {
  return activeTiledApiClient.getArrayAsJSON<T>(arrayPath, options);
}

export function getTiledArrayAsPng(
  arrayPath: string,
  options: GetArrayAsOptionsMap['PNG'] = {},
): Promise<Blob> {
  return activeTiledApiClient.getArrayAsPng(arrayPath, options);
}

export function getTiledArrayAsImagePath(
  arrayPath: string,
  options: GetArrayAsOptionsMap['IMAGE_PATH'] = {},
): string {
  return activeTiledApiClient.getArrayAsImagePath(arrayPath, options);
}

export function getTiledArrayAsBuffer(
  arrayPath: string,
  options: GetArrayAsOptionsMap['BUFFER'] = {},
): Promise<ArrayBuffer> {
  return activeTiledApiClient.getArrayAsBuffer(arrayPath, options);
}

export function getTiledTableAs<T extends TiledTableReturnType>(
  tablePath: string,
  type: T = 'JSON' as T,
  endpoint: TiledTableEndpoint = 'partition',
  options: GetTableAsOptionsMap[T] = {} as GetTableAsOptionsMap[T],
): Promise<TiledTableReturnMap[T]> {
  return getDefaultTiledApiClient().getTableAs(tablePath, type, endpoint, options);
}

export function getTiledTablePartitionAsJSON(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON'] = {},
): Promise<TiledTableJSONResponse> {
  return getDefaultTiledApiClient().getTablePartitionAsJSON(tablePath, options);
}

export function getTiledTablePartitionAsJSONSequence(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON_SEQ'] = {},
): Promise<TiledTableRow[]> {
  return getDefaultTiledApiClient().getTablePartitionAsJSONSequence(tablePath, options);
}

export function getTiledTableFullAsJSON(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON'] = {},
): Promise<TiledTableJSONResponse> {
  return getDefaultTiledApiClient().getTableFullAsJSON(tablePath, options);
}

export function getTiledTableFullAsJSONSequence(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON_SEQ'] = {},
): Promise<TiledTableRow[]> {
  return getDefaultTiledApiClient().getTableFullAsJSONSequence(tablePath, options);
}

export function getTiledServerInfo(
  options: TiledRequestOptions = {},
): Promise<TiledInfoResponse | null> {
  return getDefaultTiledApiClient().getServerInfo(options);
}

export function getTiledMetadata<S extends TiledStructures = TiledStructures>(
  path: string,
  options: TiledRequestOptions = {},
): Promise<TiledSearchItem<S>> {
  return getDefaultTiledApiClient().getMetadata<S>(path, options);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function getTiledSearch(
  searchPath: string,
  config: TiledSearchConfig = {},
  requestOptions: TiledRequestOptions = {},
): Promise<TiledSearchResult> {
  return getDefaultTiledApiClient().getSearch(searchPath, config, requestOptions);
}

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

export type AuthErrorCallback = (error: unknown) => void;

export function setDefaultBearerToken(token: string | null): void {
  activeTiledApiClient.setBearerToken(token);
}

export function setDefaultAuthErrorCallback(callback: AuthErrorCallback | undefined): void {
  activeTiledApiClient.setAuthErrorCallback(callback);
}

export function loginWithDefaultTiledClient(
  username: string,
  password: string,
  url?: string,
  provider?: TiledAuthProvider,
): Promise<{ access_token: string; refresh_token: string } | null> {
  return activeTiledApiClient.loginWithUsernamePassword(username, password, url, provider);
}

export function getDefaultTiledInitialPath(): string {
  return activeTiledApiClient.getInitialPath();
}