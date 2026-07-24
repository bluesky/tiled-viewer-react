// tiledTableApi.ts

import type { TiledRequestOptions } from './TiledConfigApi';
import type { TiledSearchItem } from '../types';
import type { TiledTableRow, TableStructure } from '../types';


/**
 * Tiled's application/json table format is usually column-oriented.
 *
 * Example:
 * {
 *   A: [0.5699, 0.1234],
 *   B: [1.1398, 0.2468],
 *   C: [1.7098, 0.3702]
 * }
 */
export type TiledTableJSONResponse = Record<string, unknown[]>;

/**
 * A Tiled search item whose structure is specifically a TableStructure.
 */
export type TiledTableItem = TiledSearchItem<TableStructure>;

export type TiledTableReturnType = 'JSON' | 'JSON_SEQ';

export type TiledTableEndpoint = 'partition' | 'full';

export type TiledTableReturnMap = {
  /**
   * Column-oriented JSON response.
   */
  JSON: TiledTableJSONResponse;

  /**
   * Row-oriented JSON sequence response.
   */
  JSON_SEQ: TiledTableRow[];
};

export interface TiledTableRequestOptions extends TiledRequestOptions {
  /**
   * The table partition to retrieve.
   *
   * Tiled partitions are 0-based.
   */
  partition?: number;

  /**
   * Table structure information from Tiled.
   *
   * Passing this can avoid a secondary structure request later.
   */
  structure?: TableStructure;

  /**
   * Full Tiled item for a table.
   */
  tableItem?: TiledTableItem;
}

export type GetTableAsOptionsMap = {
  JSON: TiledTableRequestOptions & {
    format?: 'application/json';
  };

  JSON_SEQ: TiledTableRequestOptions & {
    format?: 'application/json-seq';
  };
};

export interface TiledTableApi {
  getTableAs<T extends TiledTableReturnType>(
    tablePath: string,
    type: T,
    endpoint: TiledTableEndpoint,
    options?: GetTableAsOptionsMap[T],
  ): Promise<TiledTableReturnMap[T]>;

  getTablePartitionAsJSON(
    tablePath: string,
    options?: GetTableAsOptionsMap['JSON'],
  ): Promise<TiledTableJSONResponse>;

  getTablePartitionAsJSONSequence(
    tablePath: string,
    options?: GetTableAsOptionsMap['JSON_SEQ'],
  ): Promise<TiledTableRow[]>;

  getTableFullAsJSON(
    tablePath: string,
    options?: GetTableAsOptionsMap['JSON'],
  ): Promise<TiledTableJSONResponse>;

  getTableFullAsJSONSequence(
    tablePath: string,
    options?: GetTableAsOptionsMap['JSON_SEQ'],
  ): Promise<TiledTableRow[]>;
}

/**
 * Returns the `TableStructure` from either `options.structure` or
 * `options.tableItem.attributes.structure`, whichever is present.
 *
 * @param options - Table request options that may contain structure info.
 * @returns The resolved `TableStructure`, or `undefined` if neither is present.
 */
export function resolveTableStructure(
  options: TiledTableRequestOptions = {},
): TableStructure | undefined {
  return options.structure ?? options.tableItem?.attributes.structure;
}

/**
 * Returns `true` when the caller has already provided enough table structure
 * information (via `options.structure` or `options.tableItem`) to skip a
 * secondary metadata request.
 *
 * @param options - Table request options.
 * @returns `true` if structure info is available, `false` otherwise.
 */
export function hasTableStructure(
  options: TiledTableRequestOptions = {},
): boolean {
  return Boolean(resolveTableStructure(options));
}

/**
 * Parses Tiled's application/json-seq response.
 *
 * Depending on the server/client behavior, Axios may give you:
 * - a string containing newline-separated JSON objects
 * - a single object for one-row results
 * - an array, if something upstream already parsed it
 */
export function parseJsonSequenceTableResponse(
  data: unknown,
): TiledTableRow[] {
  if (typeof data === 'string') {
    const trimmed = data.trim();

    if (!trimmed) {
      return [];
    }

    return trimmed
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as TiledTableRow);
  }

  if (Array.isArray(data)) {
    return data as TiledTableRow[];
  }

  if (data && typeof data === 'object') {
    return [data as TiledTableRow];
  }

  throw new Error(`Could not parse JSON sequence table response.`);
}