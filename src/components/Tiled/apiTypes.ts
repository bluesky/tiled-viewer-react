import { TiledSearchResult } from './types';

/**
 * Configuration object for comprehensive Tiled search functionality
 */
export interface TiledSearchConfig {
    baseUrl: string;
    path?: string;
    initialPath?: string;
    filters?: TiledSearchFilters;
    options?: TiledSearchOptions;
    apiKey?: string;
}

/**
 * Options for search requests (pagination, sorting, field selection, etc.)
 */
export interface TiledSearchOptions {
    /** Fields to include in response */
    fields?: string[];
    /** Metadata selection pattern */
    selectMetadata?: string;
    /** Page offset for pagination */
    pageOffset?: number;
    /** Page limit for pagination */
    pageLimit?: number;
    /** Sort field */
    sort?: string;
    /** Maximum depth for nested structures */
    maxDepth?: number;
    /** Whether to omit links in response */
    omitLinks?: boolean;
    /** Whether to include data sources */
    includeDataSources?: boolean;
}

/**
 * All available search filters for Tiled API
 */
export interface TiledSearchFilters {
    /** Full-text search filter */
    fulltext?: TiledFulltextFilter;
    /** Lookup filter for metadata keys */
    lookup?: TiledLookupFilter;
    /** Keys filter */
    keysFilter?: TiledKeysFilter;
    /** Regular expression filter */
    regex?: TiledRegexFilter;
    /** Equality filter */
    eq?: TiledEqualityFilter;
    /** Not equal filter */
    noteq?: TiledEqualityFilter;
    /** Comparison filter */
    comparison?: TiledComparisonFilter;
    /** Contains filter */
    contains?: TiledContainsFilter;
    /** In filter */
    in?: TiledInFilter;
    /** Not in filter */
    notin?: TiledInFilter;
    /** Key present filter */
    keyPresent?: TiledKeyPresentFilter;
    /** Like filter */
    like?: TiledLikeFilter;
    /** Specs filter */
    specs?: TiledSpecsFilter;
    /** Access blob filter */
    accessBlob?: TiledAccessBlobFilter;
    /** Structure family filter */
    structureFamily?: TiledStructureFamilyFilter;
}

/**
 * Full-text search filter
 */
export interface TiledFulltextFilter {
    text: string;
}

/**
 * Lookup filter for metadata keys
 */
export interface TiledLookupFilter {
    key: string;
}

/**
 * Keys filter
 */
export interface TiledKeysFilter {
    keys: string[];
}

/**
 * Regular expression filter
 */
export interface TiledRegexFilter {
    key: string;
    pattern: string;
    caseSensitive?: boolean;
}

/**
 * Equality filter (eq/noteq)
 */
export interface TiledEqualityFilter {
    key: string;
    value: any;
}

/**
 * Comparison filter (gt, gte, lt, lte)
 */
export interface TiledComparisonFilter {
    operator: 'gt' | 'gte' | 'lt' | 'lte';
    key: string;
    value: any;
}

/**
 * Contains filter
 */
export interface TiledContainsFilter {
    key: string;
    value: any;
}

/**
 * In/not in filter
 */
export interface TiledInFilter {
    key: string;
    value: any[];
}

/**
 * Key present filter
 */
export interface TiledKeyPresentFilter {
    key: string;
    exists: boolean;
}

/**
 * Like filter
 */
export interface TiledLikeFilter {
    key: string;
    pattern: string;
}

/**
 * Specs filter with include/exclude arrays
 */
export interface TiledSpecsFilter {
    include: string[];
    exclude: string[];
}

/**
 * Access blob filter
 */
export interface TiledAccessBlobFilter {
    userId?: string;
    tags?: string[];
}

/**
 * Structure family filter
 */
export interface TiledStructureFamilyFilter {
    value: 'container' | 'array' | 'table' | 'awkward' | 'sparse';
}
