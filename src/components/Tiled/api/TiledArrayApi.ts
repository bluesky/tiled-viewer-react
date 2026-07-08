// TiledArrayApi.ts

import type { TiledRequestOptions } from './TiledConfigApi';
import type { ArrayStructure, TiledSearchItem } from '../types';

/**
 * A Tiled search item whose structure is specifically an ArrayStructure.
 */
export type TiledArrayItem = TiledSearchItem<ArrayStructure>;

/**
 * The supported output types for array reads.
 *
 * These describe the JavaScript return type, not necessarily the Tiled endpoint.
 */
export type TiledArrayReturnType = 'JSON' | 'PNG' | 'BUFFER' | 'IMAGE_PATH';

/**
 * Maps each array output type to its TypeScript return type.
 */
export type TiledArrayReturnMap = {
  JSON: number[][];
  PNG: Blob;
  BUFFER: ArrayBuffer;
  IMAGE_PATH: string;
};

/**
 * Shared options available to all Tiled array API calls.
 */
export interface TiledArrayRequestOptions extends TiledRequestOptions {
  /**
   * A simple ratio used to downsample the image.
   *
   * Example:
   * - 1 = no downsampling
   * - 2 = every other pixel
   * - 4 = every fourth pixel
   */
  downSampleRatio?: number;

  /**
   * Maximum number of bytes allowed for the returned image/array payload.
   *
   * If provided, Finch computes an appropriate downsample ratio using
   * array structure information such as shape and dtype item size.
   */
  maxBytesAllowed?: number;

  /**
   * The stack/frame index to grab from a higher-dimensional array.
   *
   * Example:
   * For an array shaped like [frames, height, width],
   * stack: [5] means "grab frame 5".
   */
  stack?: number[];

  /**
   * Array structure information from Tiled.
   *
   * This usually comes from:
   *
   * arrayItem.attributes.structure
   *
   * Passing this avoids a secondary metadata/structure request.
   */
  structure?: ArrayStructure;

  /**
   * Full Tiled item for an array.
   *
   * Passing this can avoid a secondary metadata/structure request and also
   * gives access to item-level attributes, links, specs, metadata, etc.
   */
  arrayItem?: TiledArrayItem;

  /**
   * Use this when the image should be treated as RGB even though it is stored
   * as a 3D array in Tiled.
   *
   * Example:
   * [height, width, 3] should be treated as one RGB image, not as a stack
   * of grayscale frames.
   */
  isRGB?: boolean;
}

/**
 * Format-specific options for getArrayAs(...).
 */
export type GetArrayAsOptionsMap = {
  JSON: TiledArrayRequestOptions & {
    format?: 'application/json';
  };

  PNG: TiledArrayRequestOptions & {
    format?: 'image/png';
  };

  BUFFER: TiledArrayRequestOptions & {
    format?: 'application/octet-stream';
  };

  IMAGE_PATH: TiledArrayRequestOptions & {
    format?: 'image/png' | 'image/tiff';
  };
};

/**
 * Main array API interface.
 *
 * TiledApiClient should implement this.
 * Tests can also mock this interface directly.
 */
export interface TiledArrayApi {
  getArrayAs<T extends TiledArrayReturnType>(
    arrayPath: string,
    type: T,
    options?: GetArrayAsOptionsMap[T],
  ): Promise<TiledArrayReturnMap[T]>;

  getArrayAsJSON<T = number[][]>(
    arrayPath: string,
    options?: GetArrayAsOptionsMap['JSON'],
  ): Promise<T>;

  getArrayAsPng(
    arrayPath: string,
    options?: GetArrayAsOptionsMap['PNG'],
  ): Promise<Blob>;

  getArrayAsBuffer(
    arrayPath: string,
    options?: GetArrayAsOptionsMap['BUFFER'],
  ): Promise<ArrayBuffer>;

  getArrayAsImagePath(
    arrayPath: string,
    options?: GetArrayAsOptionsMap['IMAGE_PATH'],
  ): string;
}

/**
 * Gets ArrayStructure from either options.structure or options.arrayItem.
 *
 * This helper is useful inside the real client implementation when deciding
 * whether a secondary structure request is needed.
 */
export function resolveArrayStructure(
  options: TiledArrayRequestOptions = {},
): ArrayStructure | undefined {
  return options.structure ?? options.arrayItem?.attributes.structure;
}

/**
 * True when the caller already provided enough array structure info for
 * downsampling decisions.
 */
export function hasArrayStructure(
  options: TiledArrayRequestOptions = {},
): boolean {
  return Boolean(resolveArrayStructure(options));
}