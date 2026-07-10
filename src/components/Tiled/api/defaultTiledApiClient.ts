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
} from './TiledTableApi';

import type { TiledRequestOptions } from './TiledConfigApi';
import type { TiledSearchItem, TiledStructures } from '../types';

let activeTiledApiClient = new TiledApiClient(); //contains all the good stuff

export function getDefaultTiledApiClient(): TiledApiClient {
  return activeTiledApiClient;
}

export function setDefaultTiledApiClient(client: TiledApiClient): void {
  activeTiledApiClient = client;
}

export function resetDefaultTiledApiClient(): void {
  activeTiledApiClient = new TiledApiClient();
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

export function getArrayAsJSON<T = number[][]>(
  arrayPath: string,
  options: GetArrayAsOptionsMap['JSON'] = {},
): Promise<T> {
  return activeTiledApiClient.getArrayAsJSON<T>(arrayPath, options);
}

export function getArrayAsPng(
  arrayPath: string,
  options: GetArrayAsOptionsMap['PNG'] = {},
): Promise<Blob> {
  return activeTiledApiClient.getArrayAsPng(arrayPath, options);
}

export function getArrayAsImagePath(
  arrayPath: string,
  options: GetArrayAsOptionsMap['IMAGE_PATH'] = {},
): string {
  return activeTiledApiClient.getArrayAsImagePath(arrayPath, options);
}

export function getArrayAsBuffer(
  arrayPath: string,
  options: GetArrayAsOptionsMap['BUFFER'] = {},
): Promise<ArrayBuffer> {
  return activeTiledApiClient.getArrayAsBuffer(
    arrayPath,
    options,
  );
}

export function getTableAs<T extends TiledTableReturnType>(
  tablePath: string,
  type: T = 'JSON' as T,
  options: GetTableAsOptionsMap[T] = {} as GetTableAsOptionsMap[T],
): Promise<TiledTableReturnMap[T]> {
  return getDefaultTiledApiClient().getTableAs(
    tablePath,
    type,
    options,
  );
}

export function getTableAsJSON(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON'] = {},
): Promise<TiledTableJSONResponse> {
  return getDefaultTiledApiClient().getTableAsJSON(
    tablePath,
    options,
  );
}

export function getTableAsJSONSequence(
  tablePath: string,
  options: GetTableAsOptionsMap['JSON_SEQ'] = {},
): Promise<TiledTableRow[]> {
  return getDefaultTiledApiClient().getTableAsJSONSequence(
    tablePath,
    options,
  );
}

export function getMetadata<S extends TiledStructures = TiledStructures>(
  path: string,
  options: TiledRequestOptions = {},
): Promise<TiledSearchItem<S>> {
  return getDefaultTiledApiClient().getMetadata<S>(path, options);
}