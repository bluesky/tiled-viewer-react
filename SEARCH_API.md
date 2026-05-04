# Tiled Search API Documentation

This document describes the comprehensive search functionality for the Tiled API client.

## Overview

The Tiled search system provides type-safe, flexible search capabilities for querying Tiled servers. It supports all filter types and options available in the Tiled API specification.

## Architecture

The search system consists of three main files:

1. **`apiTypes.ts`** - Type definitions for all search parameters and filters
2. **`apiUtils.ts`** - Helper functions for URL parameter construction
3. **`apiClient.ts`** - Main search functions and convenience methods

## Core Search Function

### `searchTiled(config: TiledSearchConfig): Promise<TiledSearchResult[]>`

The primary search function that accepts a comprehensive configuration object:

```typescript
import { searchTiled } from '@blueskyproject/tiled';

const results = await searchTiled({
  baseUrl: 'https://your-tiled-server.com',
  path: 'optional/path',
  initialPath: 'beamline531',  // Optional initial path override
  filters: {
    specs: { 
      include: ['BlueskyRun'], 
      exclude: [] 
    },
    fulltext: { 
      text: 'sample search' 
    }
  },
  options: {
    pageLimit: 50,
    sort: 'created_time'
  },
  apiKey: 'optional-api-key'
});
```

## Initial Path Configuration

You can specify an initial path that gets prepended to all search paths in three ways:

1. **Global Initial Path** - Set once for all subsequent calls:
   ```typescript
   import { setInitialPath } from '@blueskyproject/tiled';
   setInitialPath('beamline531');
   ```

2. **Config-level Initial Path** - Override the global path for specific searches:
   ```typescript
   const results = await searchTiled({
     baseUrl: 'https://your-server.com',
     path: 'experiments/2024',
     initialPath: 'beamline532',  // Takes priority over global setting
     filters: { /* ... */ }
   });
   ```

3. **Function-level Initial Path** - Available in all convenience functions:
   ```typescript
   const results = await searchBySpecs(
     'https://your-server.com',
     ['BlueskyRun'],
     [],
     'experiments/2024',
     {},
     'api-key',
     'beamline531'  // Initial path parameter
   );
   ```

**Priority Order:** Function parameter > Config initialPath > Global setInitialPath()

## Convenience Search Functions

### Specs-based Search

```typescript
import { searchBySpecs } from '@blueskyproject/tiled';

const results = await searchBySpecs(
  'https://your-tiled-server.com',
  ['BlueskyRun'],        // include
  [],                    // exclude
  'experiments',         // path
  { pageLimit: 25 },     // options
  'api-key',             // apiKey
  'beamline531'          // initialPath (optional)
);
```

### Fulltext Search

```typescript
import { searchByFulltext } from '@blueskyproject/tiled';

const results = await searchByFulltext(
  'https://your-tiled-server.com',
  'detector scan',
  '',
  { sort: 'created_time' }
);
```

### Metadata Equality Search

```typescript
import { searchByMetadataEquals } from '@blueskyproject/tiled';

const results = await searchByMetadataEquals(
  'https://your-tiled-server.com',
  'plan_name',
  'count'
);
```

### Metadata Comparison Search

```typescript
import { searchByMetadataComparison } from '@blueskyproject/tiled';

const results = await searchByMetadataComparison(
  'https://your-tiled-server.com',
  'num_points',
  'gt',     // 'gt', 'gte', 'lt', 'lte'
  100
);
```

### Regex Search

```typescript
import { searchByRegex } from '@blueskyproject/tiled';

const results = await searchByRegex(
  'https://your-tiled-server.com',
  'sample_name',
  '^test_.*',
  false     // case sensitive
);
```

### Structure Family Search

```typescript
import { searchByStructureFamily } from '@blueskyproject/tiled';

const results = await searchByStructureFamily(
  'https://your-tiled-server.com',
  'table'   // 'container', 'array', 'table', 'awkward', 'sparse'
);
```

## Available Filters

### Full Filter Types

All filters are typed and documented in `apiTypes.ts`:

- **`fulltext`** - Full-text search
- **`lookup`** - Metadata key lookup
- **`keysFilter`** - Filter by presence of specific keys
- **`regex`** - Regular expression matching on metadata
- **`eq`** - Equality filter
- **`noteq`** - Not equal filter
- **`comparison`** - Comparison operators (gt, gte, lt, lte)
- **`contains`** - Contains filter
- **`in`** - Value in array filter
- **`notin`** - Value not in array filter
- **`keyPresent`** - Key presence/absence filter
- **`like`** - SQL-like pattern matching
- **`specs`** - Specification include/exclude
- **`accessBlob`** - Access control filters
- **`structureFamily`** - Structure family filtering

### Search Options

Available options for pagination, sorting, and response formatting:

- **`fields`** - Fields to include in response
- **`selectMetadata`** - Metadata selection pattern
- **`pageOffset`** - Pagination offset
- **`pageLimit`** - Results per page
- **`sort`** - Sort field
- **`maxDepth`** - Maximum depth for nested structures
- **`omitLinks`** - Exclude links from response
- **`includeDataSources`** - Include data source information

## Complex Search Examples

### Multi-Filter Search

```typescript
const complexSearch = await searchTiled({
  baseUrl: 'https://your-tiled-server.com',
  filters: {
    specs: { include: ['BlueskyRun'], exclude: [] },
    comparison: { operator: 'gt', key: 'num_points', value: 50 },
    regex: { key: 'sample_name', pattern: '^sample_.*', caseSensitive: false },
    structureFamily: { value: 'table' }
  },
  options: {
    pageLimit: 100,
    sort: 'created_time',
    fields: ['id', 'metadata', 'structure_family']
  }
});
```

### Paginated Search

```typescript
const paginatedResults = await searchTiled({
  baseUrl: 'https://your-tiled-server.com',
  filters: {
    fulltext: { text: 'experiment' }
  },
  options: {
    pageOffset: 0,
    pageLimit: 25,
    sort: '-created_time'  // Descending sort
  }
});
```

## TypeScript Support

The search system provides complete TypeScript support:

```typescript
import { 
  TiledSearchConfig,
  TiledSearchFilters,
  TiledSearchOptions,
  TiledSpecsFilter
} from '@blueskyproject/tiled';

const config: TiledSearchConfig = {
  baseUrl: 'https://your-tiled-server.com',
  filters: {
    specs: { include: ['BlueskyRun'], exclude: [] }
  }
};
```

## Error Handling

All search functions throw errors that should be handled appropriately:

```typescript
try {
  const results = await searchTiled(config);
  console.log('Found', results.length, 'results');
} catch (error) {
  console.error('Search failed:', error);
}
```

## Migration from Legacy Functions

If you're using the older search functions, here's how to migrate:

### Old `getSearchResultsBySpecs`
```typescript
// Old way
const results = await getSearchResultsBySpecs(baseUrl, specs, path, reverseSort, apiKey);

// New way
const results = await searchBySpecs(baseUrl, specs, [], path, { sort: reverseSort ? '-' : undefined }, apiKey);
```

### Old `getSearchResults`
```typescript
// Old way
const results = await getSearchResults(baseUrl, path, reverseSort, apiKey);

// New way
const results = await searchTiled({
  baseUrl,
  path,
  options: { sort: reverseSort ? '-' : undefined },
  apiKey
});
```

## URL Format

The search system constructs URLs in the format:
```
{baseUrl}/api/v1/search/{path}?{parameters}
```

Parameters are properly JSON-encoded for array values and filters, ensuring compatibility with the Tiled API specification.

## Authentication

All search functions support optional API key authentication:

```typescript
const results = await searchTiled({
  baseUrl: 'https://your-tiled-server.com',
  filters: { /* ... */ },
  apiKey: 'your-api-key-here'
});
```

If no API key is provided in the function call, the system will use the global API key if one has been set via `getFirstSearchWithApiKey()`.
