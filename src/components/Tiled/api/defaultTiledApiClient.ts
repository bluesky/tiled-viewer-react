// defaultTiledApiClient.ts
import { TiledApiClient } from './TiledApiClient';

import type {
  TiledArrayReturnType,
  TiledArrayReturnMap,
  GetArrayAsOptionsMap,
} from './TiledArrayApi';

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