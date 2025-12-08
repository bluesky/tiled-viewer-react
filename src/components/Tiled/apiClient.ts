import axios from "axios";
axios.defaults.withCredentials = true; // ensure cookies are sent with requests

import { sampleTiledSearchData } from "./sampleData";
import { isValidTiledInfoResponse, TiledInfoResponse, TiledSearchResult, TiledAuthProvider, TiledTableRow, TiledStructuredArrayData, TiledTableJSONResponse, TiledBlueskyPlanMetadataResponse } from "./types";
import { TiledSearchConfig, TiledSearchOptions, TiledSearchFilters, TiledSpecsFilter } from './apiTypes';
import { addBasicOptions, addSearchFilters } from './apiUtils';
import { getApiKeyFromLocalStorage, getAuthFromLocalStorage, clearAuthFromLocalStorage, saveAuthToLocalStorage } from "./utils";

//if user calls getFirstSearchWithApiKey, it will set this variable and all subsequent calls to getSearchResults, getTabledata, and image paths will use this apikey
let globalApiKey:string | null = null;

let globalReverseSort:boolean = false;

let globalInitialPath:string | null = null;

export const setInitialPath = (path:string | null) => {
    //reformat so that a leading '/' is removed
    if (path && path.startsWith('/')) {
        path = path.substring(1);
    }
    globalInitialPath = path;
    return globalInitialPath;
};

export const getInitialPath = () => {
    return globalInitialPath;
};

/**
 * Helper function to construct API paths with optional initial path and global initial path
 * Removes redundant path segments when searchPath already contains the initial path
 * @param searchPath - The search path to append
 * @param initialPath - Optional initial path that takes priority over globalInitialPath
 * @returns Combined path with initial path prepended if it exists, avoiding duplication
 */
const constructApiPath = (searchPath?: string, initialPath?: string): string => {
    // Priority: initialPath argument > globalInitialPath > none
    const effectiveInitialPath = initialPath || globalInitialPath;
    
    if (effectiveInitialPath) {
        if (searchPath) {
            // Clean up both paths by removing leading/trailing slashes
            const cleanInitialPath = effectiveInitialPath.replace(/^\/+|\/+$/g, '');
            const cleanSearchPath = searchPath.replace(/^\/+|\/+$/g, '');
            
            // If searchPath already starts with the effectiveInitialPath, remove the redundant part
            if (cleanSearchPath.startsWith(cleanInitialPath + '/')) {
                // Return effectiveInitialPath + remainder of searchPath after removing the redundant prefix
                const remainder = cleanSearchPath.substring(cleanInitialPath.length + 1);
                return remainder ? `${cleanInitialPath}/${remainder}` : cleanInitialPath;
            } else if (cleanSearchPath === cleanInitialPath) {
                // If searchPath is exactly the same as effectiveInitialPath, just return effectiveInitialPath
                return cleanInitialPath;
            } else {
                // No redundancy, combine normally
                return `${cleanInitialPath}/${cleanSearchPath}`;
            }
        } else {
            return effectiveInitialPath.replace(/^\/+|\/+$/g, '');
        }
    }
    return searchPath?.replace(/^\/+|\/+$/g, '') || '';
};

// Add a callback function type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthErrorCallback = (error: any) => void;

let authErrorCallback: AuthErrorCallback | null = null;

export const setAuthErrorCallback = (callback: AuthErrorCallback) => {
  authErrorCallback = callback;
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log('axios interceptor caught an error: ', error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const auth = getAuthFromLocalStorage();
        //const refreshToken = localStorage.getItem('tiledRefreshToken');
        
        if (auth) {
          const refreshResponse = await axios.post(`${defaultTiledUrl}/auth/refresh`, {
            refresh_token: auth.refreshToken
          });
          const newAccessToken = refreshResponse.data.access_token;
          saveAuthToLocalStorage(auth.refreshToken, newAccessToken);
          setBearerToken(newAccessToken);
          return axios(originalRequest);
        } else {
            authErrorCallback?.(null);
        }
      } catch {
        // Clear tokens and call the error callback
        clearAuthFromLocalStorage();        
        authErrorCallback?.(null);
      }
    }

    return Promise.reject(error);
  }
);

export const getDefaultTiledUrl = () => {
    const address = window.location.hostname;
    const httpProto = window.location.protocol;
    try{
        if (import.meta.env.VITE_API_TILED_URL) {
            console.log('using env variable for tiled url: ', import.meta.env.VITE_API_TILED_URL);
            return import.meta.env.VITE_API_TILED_URL;
        } else {
            return `${httpProto}//${address}:8000/api/v1`;
        }
    } catch(e) {
        console.error('error parsing VITE_API_TILED_URL env: ', e)
        return `${httpProto}//${address}:8000/api/v1`;
    }
};
const defaultTiledUrl = getDefaultTiledUrl();

/**
 * Sets the Bearer token for authentication in axios requests
 * @param token - The Bearer token string
 * @example
 * ```typescript
 * setBearerToken('your-bearer-token-here');
 * ```
 */
export const setBearerToken = (token:string) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};
// const sampleTableUrl = http://localhost:8000/api/v1/table/partition/short_table?partition=0&format=application/json-seq


/**
 * Searches for data in a Tiled server instance
 * @param searchPath - Optional path to search within (e.g., 'folder/subfolder')
 * @param url - Optional custom Tiled server URL (defaults to environment variable or localhost:8000)
 * @param cb - Optional callback function that receives the search results
 * @param mock - If true, returns sample mock data instead of making API call
 * @param parameters - Optional additional query parameters to include in the request
 * @param sortingKey - Optional key to sort results by (prefix with '-' for descending)
 * @returns Promise that resolves to TiledSearchResult or null if error occurs
 * @example
 * ```typescript
 * const results = await getSearchResults('my-data-folder');
 * ```
 */
export const getSearchResults = async (searchPath?:string, url?:string, cb?:(res:TiledSearchResult)=>void, mock?:boolean, parameters?:Record<string, string | number | boolean>, sortingKey?:string):Promise<TiledSearchResult | null> => {
    if (mock) {
        cb?.(sampleTiledSearchData);
        return sampleTiledSearchData as TiledSearchResult;
    }
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const params = new URLSearchParams();
        
        if (globalApiKey) {
            params.append('api_key', globalApiKey);
        }
        
        if (globalReverseSort) {
            params.append('sort', sortingKey ? `-${sortingKey}` : '-');
        }

        if (parameters) {
            Object.keys(parameters).forEach(key => {
                params.append(key, String(parameters[key]));
            });
        }
        
        const queryString = params.toString();
        const apiPath = constructApiPath(searchPath);
        const fullUrl = baseUrl + '/search/' + apiPath + (queryString ? '?' + queryString : '');
        
        const response = await axios.get(fullUrl);
        cb?.(response.data as TiledSearchResult);
        return response.data as TiledSearchResult;
    } catch (error) {
        console.error('Error searching path: ', error);
        console.log('If you are getting a CORS error, make sure to start tiled with the TILED_ALLOW_ORIGINS environment variable set to your frontend URL');
        return null;
    }
};

/**
 * Performs the first search with an API key, which sets up authentication for subsequent requests
 * @param apiKey - The API key for authentication with the Tiled server
 * @param searchPath - Optional path to search within
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the search results
 * @param mock - If true, returns sample mock data instead of making API call
 * @returns Promise that resolves to TiledSearchResult or null if error occurs
 * @example
 * ```typescript
 * const results = await getFirstSearchWithApiKey('your-api-key', 'data-folder');
 * ```
 */
export const getFirstSearchWithApiKey = async (apiKey:string, searchPath?:string, url?:string, cb?:(res:TiledSearchResult)=>void,  mock?:boolean):Promise<TiledSearchResult | null> => {
    //after first successful GET using apikey, tiled stores a cookie and the apiKey is no longer required for subsequent requests. This doesn't work for CORS cookies though
    
    //overwrite any local storage apiKey, which could be stale if the dev calls Tiled with a new apiKey prop and a previous different apiKey was stored in localstorage
    const localStorageApiKey = getApiKeyFromLocalStorage();
    if (localStorageApiKey && localStorageApiKey !== apiKey) {
        localStorage.removeItem('tiledApiKey');
        localStorage.setItem('tiledApiKey', apiKey);
    }

    globalApiKey = apiKey;  //makes this available to all other functions that make api calls or generate image paths, technically a cookie is not required when this is used
    
    if (mock) {
        cb?.(sampleTiledSearchData);
        return sampleTiledSearchData as TiledSearchResult;
    }
    try {
        // const baseUrl = url ? url : defaultTiledUrl;
        // const response = await axios.get(baseUrl + '/search/' + (searchPath ? searchPath : '') + (globalReverseSort ? '&sort=-' : '') + '?api_key=' + apiKey);
         const baseUrl = url ? url : defaultTiledUrl;
        
        // Build URL with URLSearchParams
        const params = new URLSearchParams();
        params.append('api_key', apiKey);
        
        if (globalReverseSort) {
            params.append('sort', '-');
        }
        
        const queryString = params.toString();
        const apiPath = constructApiPath(searchPath);
        const fullUrl = baseUrl + '/search/' + apiPath + '?' + queryString;
        
        const response = await axios.get(fullUrl);
        return response.data;
    } catch (error) {
        console.error('Error searching path: ', error);
        console.log('If you are getting a CORS error, make sure to start tiled with the TILED_ALLOW_ORIGINS environment variable set to your frontend URL');
        return null;
    }
};

/**
 * Searches for items that include specific specs
 * @param searchPath - Optional path to search within
 * @param includeSpecs - Array of spec names to include in results
 * @param excludeSpecs - Optional array of spec names to exclude from results
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the search results
 * @returns Promise that resolves to TiledSearchResult or null if error occurs
 * @example
 * ```typescript
 * // Search for BlueskyEventStream specs
 * const results = await getSearchResultsBySpecs('my-path', ['BlueskyEventStream']);
 * 
 * // Search for multiple specs but exclude BlueskyRun
 * const results = await getSearchResultsBySpecs('my-path', ['BlueskyEventStream'], ['BlueskyRun']);
 * ```
 */
export const getSearchResultsBySpecs = async (
    searchPath?: string,
    includeSpecs?: string[],
    excludeSpecs?: string[],
    url?: string,
    cb?: (res: TiledSearchResult) => void
): Promise<TiledSearchResult | null> => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const params = new URLSearchParams();
        
        if (globalApiKey) {
            params.append('api_key', globalApiKey);
        }
        
        if (globalReverseSort) {
            params.append('sort', '-');
        }

        // Format as JSON arrays - this is what Tiled expects
        const includeArray = includeSpecs && includeSpecs.length > 0 ? includeSpecs : [];
        const excludeArray = excludeSpecs && excludeSpecs.length > 0 ? excludeSpecs : [];
        
        params.append('filter[specs][condition][include]', JSON.stringify(includeArray));
        params.append('filter[specs][condition][exclude]', JSON.stringify(excludeArray));
        
        const queryString = params.toString();
        const apiPath = constructApiPath(searchPath);
        const fullUrl = baseUrl + '/search/' + apiPath + (queryString ? '?' + queryString : '');
        
        const response = await axios.get(fullUrl);
        cb?.(response.data as TiledSearchResult);
        return response.data as TiledSearchResult;
    } catch (error) {
        console.error('Error searching by specs: ', error);
        return null;
    }
};

/**
 * Retrieves metadata for a specific item from a Tiled server
 * @param searchPath - The path to the item
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the metadata
 * @returns Promise that resolves to metadata object or null if error occurs
 * @example
 * ```typescript
 * const metadata = await getItemMetadata('my-item-id');
 * // Returns: { data: { id: "...", attributes: {...} }, ... }
 * ```
 */
export const getItemMetadata = async(searchPath: string, url?: string, cb?: (metadata: { [key: string]: unknown }) => void): Promise<{ [key: string]: unknown } | null> => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const apiPath = constructApiPath(searchPath);
        const fullUrl = `${baseUrl}/metadata/${apiPath}${globalApiKey ? '?api_key=' + globalApiKey : ''}`;
        
        const response = await axios.get(fullUrl);
        const metadata = response.data;
        cb?.(metadata);
        return metadata;
    } catch (error) {
        console.error('Error fetching item metadata: ', error);
        return null;
    }
};

/**
 * Retrieves Bluesky plan metadata for a specific item from a Tiled server
 * @param searchPath - The path to the Bluesky plan item
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the structured metadata
 * @returns Promise that resolves to Bluesky plan metadata or null if error occurs
 * @example
 * ```typescript
 * const planMetadata = await getBlueskyPlanMetadata('aba7753b-ec5f-464d-abc2-809b620bb66b');
 * if (planMetadata?.data.attributes.metadata.start) {
 *   console.log('Plan name:', planMetadata.data.attributes.metadata.start.plan_name);
 * }
 * ```
 */
export const getBlueskyPlanMetadata = async(searchPath: string, url?: string, cb?: (metadata: TiledBlueskyPlanMetadataResponse) => void): Promise<TiledBlueskyPlanMetadataResponse | null> => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const apiPath = constructApiPath(searchPath);
        const fullUrl = `${baseUrl}/metadata/${apiPath}${globalApiKey ? '?api_key=' + globalApiKey : ''}`;
        
        const response = await axios.get(fullUrl);
        const metadata: TiledBlueskyPlanMetadataResponse = response.data;
        cb?.(metadata);
        return metadata;
    } catch (error) {
        console.error('Error fetching Bluesky plan metadata: ', error);
        return null;
    }
};

/**
 * Retrieves table data from a Tiled server for a specific partition
 * @param searchPath - The path to the table data
 * @param partition - The partition number to retrieve (0-based index)
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the parsed data
 * @returns Promise that resolves to an array of parsed table rows or null if error occurs
 * @example
 * ```typescript
 * const tableData = await getTableDataAsSequence('my-table', 0);
 * // Returns: [{ A: 0.5699, B: 1.1398, C: 1.7098 }, ...]
 * ```
 */
export const getTableDataAsSequence = async(searchPath:string, partition:number, url?:string, cb?:(parsedData:TiledTableRow[])=>void) => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const apiPath = constructApiPath(searchPath);
        const response = await axios.get(baseUrl + '/table/partition/' + apiPath + '?partition=' + partition + '&format=application/json-seq' + (globalApiKey ? '&api_key=' + globalApiKey : ''));        
        const parsedData = response.data
            .trim() // Remove any extra newlines at start or end
            .split("\n") // Split by line
            .map((line:string) => JSON.parse(line)); // Parse each line as JSON
        //parsedData [{ A: 0.5699, B: 1.1398, C: 1.7098 }, ...]
        cb?.(parsedData);
        return parsedData;
    } catch (error) {
        console.error('Error searching table data: ', error);
        return null;
    }
};

/**
 * Retrieves table data from a Tiled server for a specific partition in JSON format
 * @param searchPath - The path to the table data
 * @param partition - The partition number to retrieve (0-based index)
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the parsed data
 * @returns Promise that resolves to an array of parsed table rows or null if error occurs
 * @example
 * ```typescript
 * const tableData = await getTableDataAsJson('my-table', 0);
 * // Returns: { A: [0.5699, ...], B: [1.1398, ...], C: [1.7098, ...] }
 * ```
 */
export const getTableDataAsJson = async(searchPath:string, partition:number, url?:string, cb?:(parsedData:TiledTableJSONResponse)=>void) => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const apiPath = constructApiPath(searchPath);
        const response = await axios.get(baseUrl + '/table/partition/' + apiPath + '?partition=' + partition + '&format=application/json' + (globalApiKey ? '&api_key=' + globalApiKey : ''));
        const jsonData: TiledTableJSONResponse = response.data;
        cb?.(jsonData);
        return jsonData;
    } catch (error) {
        console.error('Error searching table data: ', error);
        throw error;
    }
};

/**
 * Retrieves structured array data from a Tiled server for a specific block
 * @param searchPath - The path to the structured array data
 * @param block - The block number to retrieve (0-based index)
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the parsed data
 * @returns Promise that resolves to an array of structured data rows or null if error occurs
 * @example
 * ```typescript
 * const structuredData = await getStructuredArrayData('structured_data/pets', 0);
 * // Returns: [{ name: "Fluffy", age: 3, weight: 4.2 }, ...]
 * ```
 */
export const getStructuredArrayData = async(searchPath: string, block: number, url?: string, cb?: (parsedData: TiledStructuredArrayData) => void) => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const params = new URLSearchParams();
        params.append('block', block.toString());
        
        if (globalApiKey) {
            params.append('api_key', globalApiKey);
        }
        
        const queryString = params.toString();
        const apiPath = constructApiPath(searchPath);
        const fullUrl = `${baseUrl}/array/block/${apiPath}?${queryString}`;
        
        const response = await axios.get(fullUrl);
        
        // The response data should be the structured array data
        const parsedData = response.data;
        console.log({parsedData})
        cb?.(parsedData);
        return parsedData;
    } catch (error) {
        console.error('Error fetching structured array data: ', error);
        return null;
    }
};

/**
 * Generates a URL path for retrieving a full PNG image from a Tiled array
 * @param searchPath - The path to the array data
 * @param stepY - Step size for Y-axis sampling (default: 1)
 * @param stepX - Step size for X-axis sampling (default: 1)
 * @param stack - Optional array of stack indices for multi-dimensional arrays
 * @param url - Optional custom Tiled server URL
 * @returns Complete URL string for the PNG image
 * @example
 * ```typescript
 * const imageUrl = generateFullImagePngPath('my-image', 1, 1, [0, 5]);
 * ```
 */
export const generateFullImagePngPath = (searchPath?:string, stepY?:number, stepX?:number, stack?:number[], url?:string) => {
    const params = new URLSearchParams();
    const stackString = (stack && stack?.length > 0) ? (stack.join(',') + ',') : '';
    const fullSlice = stackString + `::${stepY},::${stepX}`;
    if (globalApiKey) {
        params.append('api_key', globalApiKey);
    }
    params.append('format', 'image/png');
    params.append('slice', fullSlice);
    const baseUrl = url ? url : defaultTiledUrl;
    const queryString = params.toString();
    const apiPath = constructApiPath(searchPath);
    const fullUrl = `${baseUrl}/array/full/${apiPath}?${queryString}`;
    return fullUrl;
};

/**
 * Configures whether search results should be returned in reverse order
 * @param reverse - If true, results will be sorted in descending order
 * @example
 * ```typescript
 * setReverseSort(true); // Enable reverse sorting
 * ```
 */
export const setReverseSort = (reverse:boolean | undefined) => {
    globalReverseSort = reverse || false; //default to false if undefined
};

/**
 * Resets all global state variables to their default values
 * Useful for testing to ensure clean state between tests
 * @example
 * ```typescript
 * resetGlobalState(); // Clears all global variables
 * ```
 */
export const resetGlobalState = () => {
    globalApiKey = null;
    globalReverseSort = false;
    globalInitialPath = null;
};


//const sampleJsonRequestForXarray = "http://localhost:8000/api/v1/array/full/structured_data/xarray_dataset/time?format=application/json&slice=0:3"

/**
 * Retrieves XArray data from a Tiled server for a specific stack
 * @param searchPath - The path to the XArray data
 * @param stack - Optional array of stack indices for multi-dimensional arrays
 * @param url - Optional custom Tiled server URL
 * @param cb - Optional callback function that receives the parsed data
 * @returns Promise that resolves to parsed XArray data or null if error occurs
 * @example
 * ```typescript
 * const xarrayData = await getXArrayData('xarray_dataset/time', [0, 5]);
 * ```
 */
export const getXArrayData = async(searchPath: string, stack:number[], url?: string, cb?: (parsedData: number[][]) => void) => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const stackString = (stack && stack?.length > 0) ? (stack.join(',') + ',') : '';
        const params = new URLSearchParams();
        params.append('slice', stackString);
        params.append('format', 'application/json');
        
        if (globalApiKey) {
            params.append('api_key', globalApiKey);
        }
        
        const queryString = params.toString();
        const apiPath = constructApiPath(searchPath);
        const fullUrl = `${baseUrl}/array/full/${apiPath}?${queryString}`;
        
        const response = await axios.get(fullUrl);
        
        // The response data should be the structured array data
        const parsedData = response.data;
        cb?.(parsedData);
        return parsedData;
    } catch (error) {
        console.error('Error fetching structured array data: ', error);
        return null;
    }
};

/**
 * Fetches server information from a Tiled server
 * @param url - Optional custom Tiled server URL
 * @returns Promise that resolves to server information or null if error occurs
 * @example
 * ```typescript
 * const serverInfo = await getServerInfo();
 * ```
 */
export const getServerInfo = async(url?:string):Promise<TiledInfoResponse | null> => {
    //this can fail if we have an apikey cookie that is old, if the key is invalid Tiled will reject it and return a 401 even if the base route is public
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const response = await axios.get(baseUrl + '/');
        if (isValidTiledInfoResponse(response.data)) {
            return response.data as TiledInfoResponse;
        } else {
            console.error('Invalid TiledInfoResponse format: ', response.data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching server info: ', error);
        return null;
    }
}

/**
 * Logs in a user with username and password authentication
 * @param username - The username for authentication
 * @param password - The password for authentication
 * @param url - Optional custom Tiled server URL
 * @param provider - Optional specific authentication provider to use
 * @returns Promise that resolves to authentication tokens or null if login fails
 * @example
 * ```typescript
 * const authResult = await loginUser('myusername', 'mypassword');
 * if (authResult) {
 *   console.log('Login successful:', authResult.access_token);
 * }
 * ```
 */
export const loginUserWithNamePassword = async(username: string, password: string, url?: string, provider?: TiledAuthProvider): Promise<{access_token: string, refresh_token: string} | null> => {
    try {
        // If a specific provider is given, use its auth_endpoint, otherwise fetch server info to find the first available password provider
        let authEndpoint = '';
        if (provider && (provider.mode === 'password' || provider.mode === 'internal')) {
            if (!provider.links || !provider.links.auth_endpoint) {
                console.error('Provided authentication provider is missing auth_endpoint');
                return null;
            }
            authEndpoint = provider.links.auth_endpoint;
        } else {
            const serverInfo = await getServerInfo(url);
            
            if (!serverInfo || !serverInfo.authentication || !serverInfo.authentication.providers) {
                console.error('No authentication providers found in server info');
                return null;
            }
            
            // Find the first provider with mode=password, there could be multiple
            const passwordProvider = serverInfo.authentication.providers.find((provider: TiledAuthProvider) => 
                provider.mode === 'password' || provider.mode === 'internal'
            );
            
            if (!passwordProvider || !passwordProvider.links || !passwordProvider.links.auth_endpoint) {
                console.error('No password authentication provider found');
                return null;
            }
            authEndpoint = passwordProvider.links.auth_endpoint;
        }

        console.log('Using auth endpoint:', authEndpoint);
        
        // Create form data for the POST request
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        // Make the POST request to the auth endpoint
        const response = await axios.post(authEndpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        // Extract tokens from response
        const { access_token, refresh_token } = response.data;
        
        if (access_token && refresh_token) {
            // Save tokens to localStorage
            saveAuthToLocalStorage(refresh_token, access_token);
            // Set the bearer token for future requests
            setBearerToken(access_token);
            
            console.log('Login successful');
            return { access_token, refresh_token };
        } else {
            console.error('Login response missing required tokens');
            return null;
        }
    } catch (error: unknown) {
        console.error('Login failed:', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { status?: number } };
            if (axiosError.response?.status === 401) {
                console.error('Invalid username or password');
            } else if (axiosError.response?.status) {
                console.error(`Server error: ${axiosError.response.status}`);
            } else {
                console.error('Network error during login');
            }
        } else {
            console.error('Network error during login');
        }
        
        return null;
    }
};


/**
 * Fetches an image with authentication and returns a blob URL
 * @param imagePath - The complete URL path to the image
 * @returns Promise that resolves to a blob URL string
 */
export const getAuthenticatedImage = async (imagePath: string): Promise<string> => {
    try {
        const response = await axios.get(imagePath, {
            responseType: 'blob',
            headers: {
                'Accept': 'image/png'
            }
        });
        
        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error('Error fetching authenticated image:', error);
        throw error;
    }
};

/**
 * Comprehensive search function for Tiled API with full filter and option support
 * @param config - Complete search configuration object
 * @returns Promise<TiledSearchResult[]>
 */
export const searchTiled = async (config: TiledSearchConfig): Promise<TiledSearchResult[]> => {
    const { baseUrl, path = '', initialPath, filters, options = {}, apiKey } = config;
    
    try {
        const apiPath = constructApiPath(path, initialPath);
        const url = new URL(`${baseUrl}/api/v1/search/${apiPath}`);
        const params = url.searchParams;
        
        // Add basic search options
        addBasicOptions(params, options, false);
        
        // Add search filters
        if (filters) {
            addSearchFilters(params, filters);
        }
        
        const headers: Record<string, string> = {};
        const currentApiKey = apiKey || globalApiKey;
        if (currentApiKey) {
            headers['Authorization'] = `Apikey ${currentApiKey}`;
        }
        
        const response = await axios.get(url.toString(), { headers });
        return response.data.data;
    } catch (error) {
        console.error('Error in searchTiled:', error);
        throw error;
    }
};

/**
 * Search by specs with include/exclude arrays
 * @param baseUrl - Tiled server base URL
 * @param include - Array of specs to include
 * @param exclude - Array of specs to exclude (defaults to empty array)
 * @param path - Optional path within the Tiled server
 * @param options - Additional search options
 * @param apiKey - Optional API key
 * @param initialPath - Optional initial path that takes priority over globalInitialPath
 * @returns Promise<TiledSearchResult[]>
 */
export const searchBySpecs = async (
    baseUrl: string,
    include: string[],
    exclude: string[] = [],
    path: string = '',
    options: TiledSearchOptions = {},
    apiKey?: string,
    initialPath?: string
): Promise<TiledSearchResult[]> => {
    const config: TiledSearchConfig = {
        baseUrl,
        path,
        initialPath,
        filters: {
            specs: { include, exclude }
        },
        options,
        apiKey
    };
    
    return searchTiled(config);
};

/**
 * Search by fulltext
 * @param baseUrl - Tiled server base URL
 * @param text - Text to search for
 * @param path - Optional path within the Tiled server
 * @param options - Additional search options
 * @param apiKey - Optional API key
 * @param initialPath - Optional initial path that takes priority over globalInitialPath
 * @returns Promise<TiledSearchResult[]>
 */
export const searchByFulltext = async (
    baseUrl: string,
    text: string,
    path: string = '',
    options: TiledSearchOptions = {},
    apiKey?: string,
    initialPath?: string
): Promise<TiledSearchResult[]> => {
    const config: TiledSearchConfig = {
        baseUrl,
        path,
        initialPath,
        filters: {
            fulltext: { text }
        },
        options,
        apiKey
    };
    
    return searchTiled(config);
};

/**
 * Search by metadata key equality
 * @param baseUrl - Tiled server base URL
 * @param key - Metadata key to search
 * @param value - Value to match
 * @param path - Optional path within the Tiled server
 * @param options - Additional search options
 * @param apiKey - Optional API key
 * @param initialPath - Optional initial path that takes priority over globalInitialPath
 * @returns Promise<TiledSearchResult[]>
 */
export const searchByMetadataEquals = async (
    baseUrl: string,
    key: string,
    value: any,
    path: string = '',
    options: TiledSearchOptions = {},
    apiKey?: string,
    initialPath?: string
): Promise<TiledSearchResult[]> => {
    const config: TiledSearchConfig = {
        baseUrl,
        path,
        initialPath,
        filters: {
            eq: { key, value }
        },
        options,
        apiKey
    };
    
    return searchTiled(config);
};

/**
 * Search by metadata key comparison
 * @param baseUrl - Tiled server base URL
 * @param key - Metadata key to search
 * @param operator - Comparison operator ('gt', 'gte', 'lt', 'lte')
 * @param value - Value to compare against
 * @param path - Optional path within the Tiled server
 * @param options - Additional search options
 * @param apiKey - Optional API key
 * @param initialPath - Optional initial path that takes priority over globalInitialPath
 * @returns Promise<TiledSearchResult[]>
 */
export const searchByMetadataComparison = async (
    baseUrl: string,
    key: string,
    operator: 'gt' | 'gte' | 'lt' | 'lte',
    value: any,
    path: string = '',
    options: TiledSearchOptions = {},
    apiKey?: string,
    initialPath?: string
): Promise<TiledSearchResult[]> => {
    const config: TiledSearchConfig = {
        baseUrl,
        path,
        initialPath,
        filters: {
            comparison: { operator, key, value }
        },
        options,
        apiKey
    };
    
    return searchTiled(config);
};

/**
 * Search by regex pattern on metadata key
 * @param baseUrl - Tiled server base URL
 * @param key - Metadata key to search
 * @param pattern - Regex pattern to match
 * @param caseSensitive - Whether regex should be case sensitive (defaults to false)
 * @param path - Optional path within the Tiled server
 * @param options - Additional search options
 * @param apiKey - Optional API key
 * @param initialPath - Optional initial path that takes priority over globalInitialPath
 * @returns Promise<TiledSearchResult[]>
 */
export const searchByRegex = async (
    baseUrl: string,
    key: string,
    pattern: string,
    caseSensitive: boolean = false,
    path: string = '',
    options: TiledSearchOptions = {},
    apiKey?: string,
    initialPath?: string
): Promise<TiledSearchResult[]> => {
    const config: TiledSearchConfig = {
        baseUrl,
        path,
        initialPath,
        filters: {
            regex: { key, pattern, caseSensitive }
        },
        options,
        apiKey
    };
    
    return searchTiled(config);
};

/**
 * Search by structure family
 * @param baseUrl - Tiled server base URL
 * @param structureFamily - Structure family to filter by
 * @param path - Optional path within the Tiled server
 * @param options - Additional search options
 * @param apiKey - Optional API key
 * @param initialPath - Optional initial path that takes priority over globalInitialPath
 * @returns Promise<TiledSearchResult[]>
 */
export const searchByStructureFamily = async (
    baseUrl: string,
    structureFamily: 'container' | 'array' | 'table' | 'awkward' | 'sparse',
    path: string = '',
    options: TiledSearchOptions = {},
    apiKey?: string,
    initialPath?: string
): Promise<TiledSearchResult[]> => {
    const config: TiledSearchConfig = {
        baseUrl,
        path,
        initialPath,
        filters: {
            structureFamily: { value: structureFamily }
        },
        options,
        apiKey
    };
    
    return searchTiled(config);
};