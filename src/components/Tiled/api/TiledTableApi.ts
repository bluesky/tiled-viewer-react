// tiledTableApi.ts

import type { TiledRequestOptions } from './TiledConfigApi';
import type { TiledSearchItem } from '../types';

/**
 * A single row returned from a Tiled table.
 *
 * Example:
 * { A: 0.5699, B: 1.1398, C: 1.7098 }
 */
export type TiledTableRow = Record<string, unknown>;

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
 * If you already have a TableStructure type elsewhere, import it and replace
 * this interface with that imported type.
 */
export interface TableStructure {
  npartitions?: number;
  columns?: string[];
  resizable?: boolean;
  [key: string]: unknown;
}

/**
 * A Tiled search item whose structure is specifically a TableStructure.
 */
export type TiledTableItem = TiledSearchItem<TableStructure>;

export type TiledTableReturnType = 'JSON' | 'JSON_SEQ';

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
    options?: GetTableAsOptionsMap[T],
  ): Promise<TiledTableReturnMap[T]>;

  getTableAsJSON(
    tablePath: string,
    options?: GetTableAsOptionsMap['JSON'],
  ): Promise<TiledTableJSONResponse>;

  getTableAsJSONSequence(
    tablePath: string,
    options?: GetTableAsOptionsMap['JSON_SEQ'],
  ): Promise<TiledTableRow[]>;
}

export function resolveTableStructure(
  options: TiledTableRequestOptions = {},
): TableStructure | undefined {
  return options.structure ?? options.tableItem?.attributes.structure;
}

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