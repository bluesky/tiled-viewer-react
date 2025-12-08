import { 
    TiledSearchOptions, 
    TiledSearchFilters 
} from "./apiTypes";

/**
 * Helper function to add basic search options to URL parameters
 */
export const addBasicOptions = (params: URLSearchParams, options: TiledSearchOptions, globalReverseSort: boolean) => {
    if (options.fields) {
        options.fields.forEach(field => params.append('fields', field));
    }
    
    if (options.selectMetadata) {
        params.append('select_metadata', options.selectMetadata);
    }
    
    if (options.pageOffset !== undefined) {
        params.append('page[offset]', options.pageOffset.toString());
    }
    
    if (options.pageLimit !== undefined) {
        params.append('page[limit]', options.pageLimit.toString());
    }
    
    if (options.sort) {
        const sortValue = globalReverseSort ? `-${options.sort}` : options.sort;
        params.append('sort', sortValue);
    } else if (globalReverseSort) {
        params.append('sort', '-');
    }
    
    if (options.maxDepth !== undefined) {
        params.append('max_depth', options.maxDepth.toString());
    }
    
    if (options.omitLinks !== undefined) {
        params.append('omit_links', options.omitLinks.toString());
    }
    
    if (options.includeDataSources !== undefined) {
        params.append('include_data_sources', options.includeDataSources.toString());
    }
};

/**
 * Helper function to add search filters to URL parameters
 */
export const addSearchFilters = (params: URLSearchParams, filters: TiledSearchFilters) => {
    // Fulltext filter
    if (filters.fulltext) {
        params.append('filter[fulltext][condition][text]', JSON.stringify(filters.fulltext.text));
    }
    
    // Lookup filter
    if (filters.lookup) {
        params.append('filter[lookup][condition][key]', JSON.stringify(filters.lookup.key));
    }
    
    // Keys filter
    if (filters.keysFilter) {
        params.append('filter[keys_filter][condition][keys]', JSON.stringify(filters.keysFilter.keys));
    }
    
    // Regex filter
    if (filters.regex) {
        params.append('filter[regex][condition][key]', JSON.stringify(filters.regex.key));
        params.append('filter[regex][condition][pattern]', JSON.stringify(filters.regex.pattern));
        if (filters.regex.caseSensitive) {
            params.append('filter[regex][condition][case_sensitive]', JSON.stringify(filters.regex.caseSensitive));
        }
    }
    
    // Equality filter
    if (filters.eq) {
        params.append('filter[eq][condition][key]', JSON.stringify(filters.eq.key));
        params.append('filter[eq][condition][value]', JSON.stringify(filters.eq.value));
    }
    
    // Not equal filter
    if (filters.noteq) {
        params.append('filter[noteq][condition][key]', JSON.stringify(filters.noteq.key));
        params.append('filter[noteq][condition][value]', JSON.stringify(filters.noteq.value));
    }
    
    // Comparison filter
    if (filters.comparison) {
        params.append('filter[comparison][condition][operator]', JSON.stringify(filters.comparison.operator));
        params.append('filter[comparison][condition][key]', JSON.stringify(filters.comparison.key));
        params.append('filter[comparison][condition][value]', JSON.stringify(filters.comparison.value));
    }
    
    // Contains filter
    if (filters.contains) {
        params.append('filter[contains][condition][key]', JSON.stringify(filters.contains.key));
        params.append('filter[contains][condition][value]', JSON.stringify(filters.contains.value));
    }
    
    // In filter
    if (filters.in) {
        params.append('filter[in][condition][key]', JSON.stringify(filters.in.key));
        params.append('filter[in][condition][value]', JSON.stringify(filters.in.value));
    }
    
    // Not in filter
    if (filters.notin) {
        params.append('filter[notin][condition][key]', JSON.stringify(filters.notin.key));
        params.append('filter[notin][condition][value]', JSON.stringify(filters.notin.value));
    }
    
    // Key present filter
    if (filters.keyPresent) {
        params.append('filter[keypresent][condition][key]', JSON.stringify(filters.keyPresent.key));
        params.append('filter[keypresent][condition][exists]', JSON.stringify(filters.keyPresent.exists));
    }
    
    // Like filter
    if (filters.like) {
        params.append('filter[like][condition][key]', JSON.stringify(filters.like.key));
        params.append('filter[like][condition][pattern]', JSON.stringify(filters.like.pattern));
    }
    
    // Specs filter
    if (filters.specs) {
        params.append('filter[specs][condition][include]', JSON.stringify(filters.specs.include));
        params.append('filter[specs][condition][exclude]', JSON.stringify(filters.specs.exclude));
    }
    
    // Access blob filter
    if (filters.accessBlob) {
        if (filters.accessBlob.userId) {
            params.append('filter[access_blob_filter][condition][user_id]', JSON.stringify(filters.accessBlob.userId));
        }
        if (filters.accessBlob.tags) {
            params.append('filter[access_blob_filter][condition][tags]', JSON.stringify(filters.accessBlob.tags));
        }
    }
    
    // Structure family filter
    if (filters.structureFamily) {
        params.append('filter[structure_family][condition][value]', JSON.stringify(filters.structureFamily.value));
    }
};
