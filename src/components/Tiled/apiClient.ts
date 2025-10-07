import axios from "axios";
axios.defaults.withCredentials = true; // ensure cookies are sent with requests

import { sampleTiledSearchData } from "./sampleData";
import { isValidTiledInfoResponse, TiledInfoResponse, TiledSearchResult } from "./types";
import { getApiKeyFromLocalStorage, getAuthFromLocalStorage, clearAuthFromLocalStorage, saveAuthToLocalStorage } from "./utils";

//if user calls getFirstSearchWithApiKey, it will set this variable and all subsequent calls to getSearchResults, getTabledata, and image paths will use this apikey
var globalApiKey:string | null = null;

var globalReverseSort:boolean = false;

// Add a callback function type
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
            authErrorCallback && authErrorCallback(null);
        }
      } catch (refreshError) {
        // Clear tokens and call the error callback
        clearAuthFromLocalStorage();        
        authErrorCallback && authErrorCallback(null);
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
export const getSearchResults = async (searchPath?:string, url?:string, cb?:(res:TiledSearchResult)=>void, mock?:boolean, parameters?:any, sortingKey?:string):Promise<TiledSearchResult | null> => {
    if (mock) {
        cb && cb(sampleTiledSearchData);
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
                params.append(key, parameters[key]);
            });
        }
        
        const queryString = params.toString();
        const fullUrl = baseUrl + '/search/' + (searchPath ? searchPath : '') + (queryString ? '?' + queryString : '');
        
        const response = await axios.get(fullUrl);
        cb && cb(response.data as TiledSearchResult);
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
        cb && cb(sampleTiledSearchData);
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
        const fullUrl = baseUrl + '/search/' + (searchPath ? searchPath : '') + '?' + queryString;
        
        const response = await axios.get(fullUrl);
        return response.data;
    } catch (error) {
        console.error('Error searching path: ', error);
        console.log('If you are getting a CORS error, make sure to start tiled with the TILED_ALLOW_ORIGINS environment variable set to your frontend URL');
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
 * const tableData = await getTableData('my-table', 0);
 * // Returns: [{ A: 0.5699, B: 1.1398, C: 1.7098 }, ...]
 * ```
 */
export const getTableData = async(searchPath:string, partition:number, url?:string, cb?:(parsedData:any)=>void) => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const response = await axios.get(baseUrl + '/table/partition/' + searchPath + '?partition=' + partition + '&format=application/json-seq' + (globalApiKey ? '&api_key=' + globalApiKey : ''));
        //the data comes as a long string that unfortunately does not comply with JSON.parse(data)
        const parsedData = response.data
            .trim() // Remove any extra newlines at start or end
            .split("\n") // Split by line
            .map((line:any) => JSON.parse(line)); // Parse each line as JSON

        //console.log(parsedData); // Now it's an array of objects
        // [{ A: 0.5699, B: 1.1398, C: 1.7098 }, ...]
        cb && cb(parsedData)
        return parsedData;
    } catch (error) {
        console.error('Error searching table data: ', error);
        return null;
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
export const getStructuredArrayData = async(searchPath: string, block: number, url?: string, cb?: (parsedData: any) => void) => {
    try {
        const baseUrl = url ? url : defaultTiledUrl;
        const params = new URLSearchParams();
        params.append('block', block.toString());
        
        if (globalApiKey) {
            params.append('api_key', globalApiKey);
        }
        
        const queryString = params.toString();
        const fullUrl = `${baseUrl}/array/block/${searchPath}?${queryString}`;
        
        const response = await axios.get(fullUrl);
        
        // The response data should be the structured array data
        const parsedData = response.data;
        
        cb && cb(parsedData);
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
    const fullUrl = `${baseUrl}/array/full/${searchPath}?${queryString}`;
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


const sampleJsonRequestForXarray = "http://localhost:8000/api/v1/array/full/structured_data/xarray_dataset/time?format=application/json&slice=0:3"

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
export const getXArrayData = async(searchPath: string, stack:number[], url?: string, cb?: (parsedData: any) => void) => {
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
        const fullUrl = `${baseUrl}/array/full/${searchPath}?${queryString}`;
        
        const response = await axios.get(fullUrl);
        
        // The response data should be the structured array data
        const parsedData = response.data;
        
        cb && cb(parsedData);
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
export const getServerInfo = async(url?:string):Promise<{[key:string]: any} | null> => {
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
 * @returns Promise that resolves to authentication tokens or null if login fails
 * @example
 * ```typescript
 * const authResult = await loginUser('myusername', 'mypassword');
 * if (authResult) {
 *   console.log('Login successful:', authResult.access_token);
 * }
 * ```
 */
export const loginUser = async(username: string, password: string, url?: string): Promise<{access_token: string, refresh_token: string} | null> => {
    try {
        const serverInfo = await getServerInfo(url);
        
        if (!serverInfo || !serverInfo.authentication || !serverInfo.authentication.providers) {
            console.error('No authentication providers found in server info');
            return null;
        }
        
        // Find the first provider with mode=password, there could be multiple, add ability select later
        const passwordProvider = serverInfo.authentication.providers.find((provider: any) => 
            provider.mode === 'password' || provider.mode === 'internal'
        );
        
        if (!passwordProvider || !passwordProvider.links || !passwordProvider.links.auth_endpoint) {
            console.error('No password authentication provider found');
            return null;
        }

        //TODO - create separate function to handle oauth
        
        //TODO - move this username/password logic into a separate function
        const authEndpoint = passwordProvider.links.auth_endpoint;
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
        
    } catch (error: any) {
        console.error('Login failed:', error);
        
        if (error.response?.status === 401) {
            console.error('Invalid username or password');
        } else if (error.response?.status) {
            console.error(`Server error: ${error.response.status}`);
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