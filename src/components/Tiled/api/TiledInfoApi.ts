// TiledInfoApi.ts
import type { TiledRequestOptions } from './TiledConfigApi';
import type { TiledInfoResponse } from '../types';

export interface TiledInfoApi {
  getServerInfo(options?: TiledRequestOptions): Promise<TiledInfoResponse | null>;
}
