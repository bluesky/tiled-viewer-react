import './components/style.css';

//COMPONENTS
export { default as Tiled } from './components/Tiled/Tiled';
export type { TiledProps } from './components/Tiled/Tiled';

//HOOKS

//TYPES
export type { TiledItemLinks, TiledSearchItem, TiledBlueskyPlanMetadataResponse, TiledStructures, TiledTableRow, TableStructure, TiledTableJSONResponse, ArrayStructure, ContainerStructure, AwkwardStructure, AwkwardForm, SparseStructure } from './components/Tiled/types';
//UTILS
export {
  // Path management
  setInitialPath,
  getInitialPath,
  
  // Authentication and server configuration
  setAuthErrorCallback,
  getDefaultTiledUrl,
  setBearerToken,
  getServerInfo,
  loginUserWithNamePassword,
  
  // Search and data retrieval
  getSearchResults,
  getItemMetadata,
  getBlueskyPlanMetadata,
  getFirstSearchWithApiKey,
  getTableDataAsJson,
  getTableDataAsSequence,
  getStructuredArrayData,
  getXArrayData,
  
  // Image handling
  generateFullImagePngPath,
  getAuthenticatedImage,
  
  // Configuration and state management
  setReverseSort,
  resetGlobalState
} from './components/Tiled/apiClient';
export { isArrayStructure, isTableStructure, isContainerStructure} from './components/Tiled/types';