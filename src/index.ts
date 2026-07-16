import './components/style.css';

// ─── Components ───────────────────────────────────────────────────────────────

export { default as Tiled } from './components/Tiled/Tiled';
export type { TiledProps } from './components/Tiled/Tiled';

// ─── Tiled API client ─────────────────────────────────────────────────────────

// Core class (for advanced use: isolated instances, custom Axios config)
export { TiledApiClient } from './components/Tiled/api/TiledApiClient';
export type { TiledApiClientConfig } from './components/Tiled/api/TiledApiClient';

// Singleton management
export {
  getDefaultTiledApiClient,
  setDefaultTiledApiClient,
  resetDefaultTiledApiClient,
} from './components/Tiled/api/defaultTiledApiClient';

// Configuration
export {
  setDefaultTiledUrl,
  setDefaultInitialPath,
  getDefaultTiledInitialPath,
  setGlobalApiKey,
  setGlobalMaxArrayBytes,
  setDefaultBearerToken,
  setDefaultAuthErrorCallback,
} from './components/Tiled/api/defaultTiledApiClient';

// Auth
export { loginWithDefaultTiledClient } from './components/Tiled/api/defaultTiledApiClient';
export type { AuthErrorCallback } from './components/Tiled/api/defaultTiledApiClient';

// Search
export {
  getTiledSearch,
  getTiledSearchBySpecs,
  getTiledSearchByFullText,
  getTiledSearchByMetadataEquals,
  getTiledSearchByStructureFamily,
} from './components/Tiled/api/defaultTiledApiClient';

// Arrays
export {
  getTiledArrayAs,
  getTiledArrayAsJSON,
  getTiledArrayAsPng,
  getTiledArrayAsBuffer,
  getTiledArrayAsImagePath,
} from './components/Tiled/api/defaultTiledApiClient';

// Tables
export {
  getTiledTableAs,
  getTiledTablePartitionAsJSON,
  getTiledTablePartitionAsJSONSequence,
  getTiledTableFullAsJSON,
  getTiledTableFullAsJSONSequence,
} from './components/Tiled/api/defaultTiledApiClient';

// Metadata and server info
export {
  getTiledMetadata,
  getTiledServerInfo,
} from './components/Tiled/api/defaultTiledApiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

// Data types
export type {
  TiledAuthProvider,
  TiledSearchResult,
  TiledItemLinks,
  TiledSearchItem,
  TiledBlueskyPlanMetadataResponse,
  TiledStructures,
  TiledTableRow,
  TiledTableJSONResponse,
  TableStructure,
  ArrayStructure,
  ContainerStructure,
  AwkwardStructure,
  AwkwardForm,
  SparseStructure,
} from './components/Tiled/types';

export { isArrayStructure, isTableStructure, isContainerStructure } from './components/Tiled/types';

// Request option types
export type { TiledRequestOptions, TiledPathMode } from './components/Tiled/api/TiledConfigApi';
export type { TiledArrayRequestOptions } from './components/Tiled/api/TiledArrayApi';
export type { TiledTableRequestOptions } from './components/Tiled/api/TiledTableApi';

// Search config and filter types
export type {
  TiledSearchConfig,
  TiledSearchOptions,
  TiledSearchFilters,
  TiledSpecsFilter,
  TiledFulltextFilter,
  TiledRegexFilter,
  TiledEqualityFilter,
  TiledComparisonFilter,
  TiledStructureFamilyFilter,
  TiledLookupFilter,
  TiledKeysFilter,
  TiledContainsFilter,
  TiledInFilter,
  TiledKeyPresentFilter,
  TiledLikeFilter,
  TiledAccessBlobFilter,
} from './components/Tiled/api/TiledSearchApi';

// ─── Old API (deprecated — use the exports above instead) ────────────────────

// export {
//   setInitialPath,
//   getInitialPath,
//   setGlobalUrl,
//   setGlobalApiKey,
//   setAuthErrorCallback,
//   getDefaultTiledUrl,
//   setBearerToken,
//   getServerInfo,
//   loginUserWithNamePassword,
//   getSearchResults,
//   getSearchResultsBySpecs,
//   getItemMetadata,
//   getBlueskyPlanMetadata,
//   getFirstSearchWithApiKey,
//   getTableDataAsJson,
//   getTableDataAsSequence,
//   getStructuredArrayData,
//   getXArrayData,
//   searchBySpecs,
//   searchByFulltext,
//   searchByMetadataEquals,
//   searchByMetadataComparison,
//   searchByRegex,
//   searchByStructureFamily,
//   generateFullImagePngPath,
//   getAuthenticatedImage,
//   setReverseSort,
//   resetGlobalState
// } from './components/Tiled/apiClient';

// export type {
//   TiledSearchConfig,
//   TiledSearchOptions,
//   TiledSearchFilters,
//   TiledSpecsFilter,
//   TiledFulltextFilter,
//   TiledRegexFilter,
//   TiledEqualityFilter,
//   TiledComparisonFilter,
//   TiledStructureFamilyFilter
// } from './components/Tiled/apiTypes';
