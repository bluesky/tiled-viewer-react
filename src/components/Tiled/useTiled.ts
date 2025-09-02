import { useEffect, useState, useRef, useMemo, useCallback } from "react";

import { getSearchResults, getFirstSearchWithApiKey, setBearerToken, setReverseSort } from "./apiClient";
import { 
    TiledSearchResult, 
    TiledSearchItem, 
    Breadcrumb, 
    ArrayStructure,
    AwkwardStructure, 
    ContainerStructure, 
    TableStructure, 
    TiledStructures,
    PreviewSize, 
    isArrayStructure,
    isContainerStructure,
    isTableStructure,
    isAwkwardStructure,
    isSparseStructure,
    SparseStructure
 } from "./types";
import { getTiledStructureIcon, generateSearchPath, getLastSearchFromLocalStorage, writeSearchPathToLocalStorage} from "./utils";

export type useTiledProps = {
    url?: string,
    apiKey?: string,
    searchPath?: string,
    bearerToken?: string,
    initialSearchPath?: string,
    reverseSort?: boolean,
}
type Url = string;
export const useTiled = ({url, apiKey, searchPath, bearerToken, initialSearchPath, reverseSort}:useTiledProps) => {
    
    const [ columns, setColumns ] = useState<TiledSearchResult[]>([]);
    const [ breadcrumbs, setBreadcrumbs ] = useState<Breadcrumb[]>([]);
    const [ imageUrl, setImageUrl ] = useState<string | undefined>();
    const [ popoutUrl, setPopoutUrl ] = useState<string | undefined>();
    const [ previewSize, setPreviewSize ] = useState<PreviewSize>('hidden');
    const [ previewItem, setPreviewItem ]  = useState<TiledSearchItem<ArrayStructure> | TiledSearchItem<TableStructure> | TiledSearchItem<AwkwardStructure> | TiledSearchItem<SparseStructure> | null >(null);
    const [ warning, setWarning ] = useState<string | undefined>(undefined);
    const [ remainingHistoryArray, setRemainingHistoryArray ] = useState<string[] | null>(null);
    const ancestorStack = useRef<TiledSearchItem<TiledStructures>[]>([]);
    const currentAncestorId = useRef<number>(-1);
    
    const localStorageHistoryPath = useMemo(()=>getLastSearchFromLocalStorage(),[]);
    const preloadedColumnsPath = useMemo(() => initialSearchPath ? initialSearchPath : (localStorageHistoryPath ? localStorageHistoryPath : null), [initialSearchPath]);

    var handleLeftArrowClick:Function;
    var handleRightArrowClick:Function;
    //Update the arrow click functions so they always have the correct pathing.
    //there may be a better way to do this without relying on state updates re-running 'useTiled.ts' and
    //subsequently recreating these functions, but this does work and eleminates the <TiledHeader /> component
    //from needing to know anything related to the business logic.
    if (currentAncestorId.current > -1) {
        handleLeftArrowClick = () => {
            currentAncestorId.current = currentAncestorId.current - 1;
            if (currentAncestorId.current < 0) {
                //uesr has clicked back onto the root directory
                getSearchResults(searchPath, url, (res:TiledSearchResult) => setColumns([res]));
                setBreadcrumbs([]);
                setImageUrl('');
                setPopoutUrl('');
                setPreviewSize('hidden');
                writeSearchPathToLocalStorage('');
            } else {
                //user has clicked back onto a container.
                const item = ancestorStack.current[currentAncestorId.current]; 
                updateCurrentSelectedItem(item);
                writeSearchPathToLocalStorage(item);
            }
        };
    }

    if (currentAncestorId.current + 1 < ancestorStack.current.length) {
        handleRightArrowClick = () => {
            currentAncestorId.current = currentAncestorId.current + 1;
            const item = ancestorStack.current[currentAncestorId.current];
            updateCurrentSelectedItem(item);
            writeSearchPathToLocalStorage(item);
        }

    }

    const defaultPreviewSize = 'medium';

    const updateColumns = useCallback((clickedItem:TiledSearchItem<TiledStructures>, newColumn?:TiledSearchResult ) => {
        setColumns((prevState) => {
            const newState = prevState.slice(0, clickedItem.attributes.ancestors.length + 1);
    
            if (newColumn) {
                return [...newState, newColumn];
            }
    
            return newState;
        });
    }, []);

    const updateBreadcrumbs = useCallback((clickedItem:TiledSearchItem<TiledStructures>) => {
        //function assumes users may only click on items that exist in the current search 'stack' and cannot jump to a different branch
        setBreadcrumbs((prevState) => {
            var stateCopy = [...prevState]; //must use shallow to copy to hold function references
            const ancestors:string[] = clickedItem.attributes.ancestors;
            while (stateCopy.length  > ancestors.length) {
                stateCopy.pop();
            }
            var newBreadcrumb:Breadcrumb = {
                label: clickedItem.id,
                icon: getTiledStructureIcon(clickedItem),
                onClick: ()=>handleColumnItemClick(clickedItem)
            }
            stateCopy.push(newBreadcrumb);
            return stateCopy;
        })
    }, []);

    const closePreview = () => {
        //remove the preview component from 
        setImageUrl(undefined);
        setPopoutUrl(undefined);
        setPreviewSize('hidden');
    }

    const updateAncestorRefs = (item:TiledSearchItem<TiledStructures>) => {
        //this function is only called when the user navigates by directly clicking an item, not using the nav arrows
        currentAncestorId.current = item.attributes.ancestors.length;
        ancestorStack.current = ancestorStack.current.slice(0, currentAncestorId.current);
        ancestorStack.current = [...ancestorStack.current, item];
    }
    const handleColumnItemClick = useCallback((item:TiledSearchItem<TiledStructures>) => {
        updateAncestorRefs(item);
        updateCurrentSelectedItem(item);
        writeSearchPathToLocalStorage(item);
    }, []);

    const updateCurrentSelectedItem = (item:TiledSearchItem<TiledStructures>) => {
        if (isArrayStructure(item)) {
            handleArrayClick(item); 
          } else if (isTableStructure(item)) {
            handleTableClick(item); 
          } else if (isContainerStructure(item)) {
            handleContainerClick(item); 
          } else if (isAwkwardStructure(item)) {
            handleAwkwardClick(item);
          } else if (isSparseStructure(item)) {
            handleSparseClick(item);
          } else {
            console.error('Error: No matching structure family found for: ' + item.attributes.structure_family);
            console.log({item});
          }
    }

    const handleArrayClick = useCallback((item:TiledSearchItem<ArrayStructure>) => {
        setPreviewItem(item);
        updateBreadcrumbs(item);
        setPreviewSize(defaultPreviewSize);
        updateColumns(item);
    }, []);

    const handleTableClick = useCallback((item:TiledSearchItem<TableStructure>) => {
        setPreviewItem(item);
        updateBreadcrumbs(item);
        setPreviewSize(defaultPreviewSize);
        updateColumns(item);
    }, []);

    const handleContainerClick = (item:TiledSearchItem<ContainerStructure>) => {
        //search container, put results into column, disable preview
        setPreviewItem(null)
        const searchPath = generateSearchPath(item);
        const firstSortKey = item.attributes.sorting ? item.attributes.sorting[0].key : undefined; //sort key may be 'time' for RE data or defaults to '_'
        getSearchResults(searchPath, url, (res:TiledSearchResult) => handleSearchResponse(item, res), false, undefined, firstSortKey);
        closePreview();
    };

    const handleAwkwardClick = (item:TiledSearchItem<AwkwardStructure>) => {
        setPreviewItem(item);
        updateBreadcrumbs(item);
        setPreviewSize(defaultPreviewSize);
        updateColumns(item);
    };

    const handleSparseClick = (item:TiledSearchItem<SparseStructure>) => {
        setPreviewItem(item);
        updateBreadcrumbs(item);
        setPreviewSize(defaultPreviewSize);
        updateColumns(item);
    };

    const handleSearchResponse = useCallback((clickedItem:TiledSearchItem<TiledStructures>, res:TiledSearchResult) => {
        updateColumns(clickedItem, res);
        updateBreadcrumbs(clickedItem);
    }, []);

    const resetAllData = () => {
        setBreadcrumbs([]);
        ancestorStack.current = [];
        currentAncestorId.current = -1;
        setPreviewItem(null);
        setPreviewSize('hidden');
        getSearchResults(searchPath, url, (res:TiledSearchResult) => setColumns([res]));
    }

    const initializeData = async () => {
        //attempt to get data from base Tiled Url. Display error on UI if no data comes back
        let response = null;
        if (bearerToken) setBearerToken(bearerToken); //set the bearer token for all future requests
        setReverseSort(reverseSort); //set the reverse sort for all future requests
        if (apiKey) {
            response = await getFirstSearchWithApiKey(apiKey, searchPath, url); //only need to use apiKey once to set cookie for future requests
        } else {
            response = await getSearchResults(searchPath, url);
        }
        if (response!== null && typeof response !== 'string' && 'data' in response) {
            setColumns([response]);
        } else {
            setWarning('No data found at the provided Tiled URL. Please check the URL or API key.');
        }
    }

    const reloadLastSearch = (searchPath:string) => {
            //make a search for the searchPath id in the last column
            let lastColumn = columns[columns.length - 1];

            //columns contains an array of objects, each object has an id, if the id matches the searchPath then call handleColumnItemClick(matchingItem)
            const matchingItem = lastColumn.data.find((item: TiledSearchItem<TiledStructures>) => item.id === searchPath);
            if (matchingItem) {
                handleColumnItemClick(matchingItem);
                setRemainingHistoryArray((prev) => prev ? prev.slice(1) : null); //return the original array with the first element removed. returns empty array on last search
            } else {
                console.warn(`Attempted to load previous search, no matching item found for search path: ${searchPath} in the current page offset, initializing at root.`);
                setRemainingHistoryArray(null);
            }
    }

    const handleNewPageClick = (link:Url, columnIndex:number, nextPageIndex?:number) => {
        //in a column if results exceed page limit the left/right arrows are enabled for making subsequent requests at the same path with different page offsets
        if (!link) return; //if no link is provided, do nothing
        //we don't want to use the exact hostname in case the user has any sort of proxy setup, therefore strip off the page offset and limit as a single string
        const newPageUrl = new URL(link);
        const pageOffset = nextPageIndex ? nextPageIndex : parseInt(newPageUrl.searchParams.get('page[offset]') || '0');
        const pageLimit = parseInt(newPageUrl.searchParams.get('page[limit]') || '100');
        //use apiClient to get next page of results with pageOffset + pageLimit
        const parameters = {
            'page[offset]': pageOffset,
            'page[limit]': pageLimit
        };

        //grab the search path after /search and before the query params
        const searchPath = newPageUrl.pathname.split('/search/')[1].split('?')[0];
        getSearchResults(searchPath, url, (res: TiledSearchResult) => updateColumnWithNewPage(res, columnIndex), false, parameters);
    };

    const updateColumnWithNewPage = (newColumn:TiledSearchResult, columnIndex:number) => {
        if (newColumn === null || newColumn.data.length === 0) {
            console.warn('No data returned for the new page.');
            return;
        }
        setColumns((prevState) => {
            const newState = [...prevState];
            newState[columnIndex] = newColumn;
            return newState;
        });
    };

    useEffect(() => {
        //get first set of results from root
        try{
            initializeData();
        } catch (e) {
            console.error('error getting first tiled request: ', e);
            setWarning('Error initializing Tiled data. Please check the console for more details.');
        }

        //kick off the calls to populate the viewer from optional user defined initial path or localStorage history
        if (preloadedColumnsPath) {
            let searchArray = preloadedColumnsPath.split('/').filter(Boolean); 
            setRemainingHistoryArray(searchArray);
        }
    }, []);

    useEffect(() => {
        //keeps triggering to simulate a user clicking a column element until every subpath of preloadedColumnsPath is displayed in the viewer
        //this must be done sequentially so that various state vars can update properly before each successive search

        if (columns.length <= 0) return; //base case when this runs prior to columns initialized with data
        if (!remainingHistoryArray || remainingHistoryArray.length === 0) return; //base case when there are no more subpaths to display

        if (preloadedColumnsPath && remainingHistoryArray) {
            let fullHistoryArray = preloadedColumnsPath.split('/').filter(Boolean); 
            let currentHistoryIndex = fullHistoryArray.length - remainingHistoryArray.length; //get the column index we should be searching in
            if (columns.length === currentHistoryIndex + 1) { //only do the search if the column state is ready
                reloadLastSearch(remainingHistoryArray[0]);
            }
        }

    }
    , [remainingHistoryArray, columns]);

    return useMemo(() => ({
        columns,
        breadcrumbs,
        imageUrl,
        popoutUrl,
        previewSize,
        previewItem,
        handleColumnItemClick,
        handleLeftArrowClick,
        handleRightArrowClick,
        resetAllData,
        warning,
        handleNewPageClick
    }), [columns, breadcrumbs, imageUrl, popoutUrl, previewSize, handleColumnItemClick, warning, handleNewPageClick])
}