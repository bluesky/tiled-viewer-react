import type { TiledRequestOptions } from './TiledConfigApi';
import type { TiledSearchResult } from '../types';

export interface TiledSearchApi {
  getSearch(
    searchPath: string,
    config?: TiledSearchConfig,
    requestOptions?: TiledRequestOptions,
  ): Promise<TiledSearchResult>;
}

/**
 * Serializes a TiledSearchConfig into a flat params object with the
 * bracket-notation keys that the Tiled REST API expects.
 *
 * e.g. filter[fulltext][condition][text]=abc
 */
export function buildSearchParams(
  config: TiledSearchConfig = {},
): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  const { searchFilters: f, searchOptions: o } = config;

  // ── Pagination / display options ─────────────────────────────────────────
  if (o) {
    if (o.pageOffset !== undefined) params['page[offset]'] = String(o.pageOffset);
    if (o.pageLimit !== undefined) params['page[limit]'] = String(o.pageLimit);
    if (o.sort) params['sort'] = o.sort;
    if (o.selectMetadata) params['select_metadata'] = o.selectMetadata;
if (o.omitLinks !== undefined) params['omit_links'] = String(o.omitLinks);
    if (o.includeDataSources !== undefined)
      params['include_data_sources'] = String(o.includeDataSources);
    if (o.fields?.length) params['fields'] = o.fields;
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  if (!f) return params;

  if (f.fulltext)
    params['filter[fulltext][condition][text]'] = f.fulltext.text;

  if (f.lookup)
    params['filter[lookup][condition][key]'] = f.lookup.key;

  if (f.keysFilter?.keys.length)
    params['filter[keys][condition][keys][]'] = f.keysFilter.keys;

  if (f.regex) {
    params['filter[regex][condition][key]'] = f.regex.key;
    params['filter[regex][condition][pattern]'] = f.regex.pattern;
    if (f.regex.caseSensitive !== undefined)
      params['filter[regex][condition][case_sensitive]'] = String(f.regex.caseSensitive);
  }

  if (f.eq) {
    params['filter[eq][condition][key]'] = f.eq.key;
    params['filter[eq][condition][value]'] = f.eq.value;
  }

  if (f.noteq) {
    params['filter[noteq][condition][key]'] = f.noteq.key;
    params['filter[noteq][condition][value]'] = f.noteq.value;
  }

  if (f.comparison) {
    params['filter[comparison][condition][operator]'] = f.comparison.operator;
    params['filter[comparison][condition][key]'] = f.comparison.key;
    params['filter[comparison][condition][value]'] = f.comparison.value;
  }

  if (f.contains) {
    params['filter[contains][condition][key]'] = f.contains.key;
    params['filter[contains][condition][value]'] = f.contains.value;
  }

  if (f.in) {
    params['filter[in][condition][key]'] = f.in.key;
    params['filter[in][condition][value][]'] = f.in.value;
  }

  if (f.notin) {
    params['filter[notin][condition][key]'] = f.notin.key;
    params['filter[notin][condition][value][]'] = f.notin.value;
  }

  if (f.keyPresent) {
    params['filter[key_present][condition][key]'] = f.keyPresent.key;
    params['filter[key_present][condition][exists]'] = String(f.keyPresent.exists);
  }

  if (f.like) {
    params['filter[like][condition][key]'] = f.like.key;
    params['filter[like][condition][pattern]'] = f.like.pattern;
  }

  if (f.specs) {
    params['filter[specs][condition][include]'] = JSON.stringify(f.specs.include);
    params['filter[specs][condition][exclude]'] = JSON.stringify(f.specs.exclude);
  }

  if (f.accessBlob) {
    if (f.accessBlob.userId)
      params['filter[access_blob][condition][user_id]'] = f.accessBlob.userId;
    if (f.accessBlob.tags?.length)
      params['filter[access_blob][condition][tags][]'] = f.accessBlob.tags;
  }

  if (f.structureFamily)
    params['filter[structure_family][condition][value]'] = f.structureFamily.value;

  return params;
}

/**
 * Configuration object for comprehensive Tiled search functionality
 */
export interface TiledSearchConfig {
    searchFilters?: TiledSearchFilters;
    searchOptions?: TiledSearchOptions;
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
    value: string;
}

/**
 * Comparison filter (gt, gte, lt, lte)
 */
export interface TiledComparisonFilter {
    operator: 'gt' | 'gte' | 'lt' | 'lte';
    key: string;
    value: string;
}

/**
 * Contains filter
 */
export interface TiledContainsFilter {
    key: string;
    value: string;
}

/**
 * In/not in filter
 */
export interface TiledInFilter {
    key: string;
    value: string[];
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
