import type { TiledTableApi } from './TiledTableApi';
import type { TiledArrayApi } from './TiledArrayApi';
import type { TiledSearchApi } from './TiledSearchApi';
import type { TiledClientConfigApi } from './TiledConfigApi';
import type { TiledMetadataApi } from './TiledMetadataApi';
export type FinchTiledApi = TiledArrayApi & TiledTableApi & TiledSearchApi & TiledClientConfigApi & TiledMetadataApi;