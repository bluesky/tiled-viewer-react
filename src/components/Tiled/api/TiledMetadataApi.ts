// TiledMetadataApi.ts
import type { TiledRequestOptions } from './TiledConfigApi';
import type { TiledSearchItem, TiledStructures } from '../types';

export interface TiledMetadataApi {
  getMetadata<S extends TiledStructures = TiledStructures>(
    path: string,
    options?: TiledRequestOptions,
  ): Promise<TiledSearchItem<S>>;
}
