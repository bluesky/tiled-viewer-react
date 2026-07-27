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

  /**
   * When isRGB is true and the channel dimension is the first axis rather than
   * the last. Use for arrays shaped like [3, height, width] or [3, frames, height, width].
   *
   * When false (default), channel is assumed to be the last dimension: [height, width, 3].
   */
  channelFirst?: boolean;
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

/**
 * Computes the display dimensions (height, width, channels) for an array.
 *
 * For RGB arrays (`isRGB: true`), the last three dimensions are interpreted as
 * `[height, width, channels]`. For all other arrays the last two dimensions are
 * `[height, width]` with `channels = 1`.
 *
 * @param structure - The `ArrayStructure` from Tiled metadata.
 * @param options - Array request options; `isRGB` affects channel interpretation.
 * @returns An object with `height`, `width`, and `channels` numbers.
 */
export function getDisplayShape(
  structure: ArrayStructure,
  options: TiledArrayRequestOptions = {},
): {
  height: number;
  width: number;
  channels: number;
} {
  const shape = structure.shape;

  if (shape.length < 2) {
    return {
      height: 1,
      width: shape[0] ?? 1,
      channels: 1,
    };
  }

  if (options.isRGB && options.channelFirst && shape.length >= 3 && shape[0] === 3) {
    return {
      height: shape[1],
      width: shape[2],
      channels: 3,
    };
  }

  if (options.isRGB && shape.length >= 3 && shape[shape.length - 1] === 3) {
    return {
      height: shape[shape.length - 3],
      width: shape[shape.length - 2],
      channels: 3,
    };
  }

  return {
    height: shape[shape.length - 2],
    width: shape[shape.length - 1],
    channels: 1,
  };
}

/**
 * Callback used to fetch an ArrayStructure for a given path when none is
 * available in options. Passed by TiledApiClient so TiledArrayApi stays
 * free of import cycles.
 */
export type StructureFetcher = (path: string) => Promise<ArrayStructure | undefined>;

const numpyKindSizeBytes: Record<string, number> = {
  b: 1,
  i: 4,
  u: 4,
  f: 8,
  c: 16,
  m: 8,
  M: 8,
};

function getBytesPerElement(structure: ArrayStructure): number {
  const itemsize = structure.data_type?.itemsize;
  if (typeof itemsize === 'number' && itemsize > 0) return itemsize;
  const kind = structure.data_type?.kind?.[0];
  if (kind && numpyKindSizeBytes[kind]) return numpyKindSizeBytes[kind];
  return 1;
}

function computeSteps(
  structure: ArrayStructure | undefined,
  options: TiledArrayRequestOptions,
): { stepX: number; stepY: number } {
  if (options.downSampleRatio && options.downSampleRatio > 1) {
    const step = Math.ceil(options.downSampleRatio);
    return { stepX: step, stepY: step };
  }

  if (!structure) {
    return { stepX: 1, stepY: 1 };
  }

  const { width, height, channels } = getDisplayShape(structure, options);
  const DEFAULT_MAX_BYTES_ALLOWED = 1_000_000;
  const bytesPerElement = getBytesPerElement(structure);
  const maxBytes = options.maxBytesAllowed ?? DEFAULT_MAX_BYTES_ALLOWED;
  const totalImageSizeBytes = width * height * channels * bytesPerElement;

  if (totalImageSizeBytes <= maxBytes) {
    return { stepX: 1, stepY: 1 };
  }

  const ratio = totalImageSizeBytes / maxBytes;
  const squareStep = Math.ceil(Math.sqrt(ratio));
  return { stepX: squareStep, stepY: squareStep };
}

function formatSlice(
  options: TiledArrayRequestOptions,
  steps: { stepX: number; stepY: number },
): string {
  const { stepX, stepY } = steps;
  const stack = options.stack ?? [];
  const stackPrefix = stack.length > 0 ? `${stack.join(',')},` : '';
  if (options.isRGB && options.channelFirst) {
    return `:,${stackPrefix}::${stepY},::${stepX}`;
  }
  if (options.isRGB) {
    return `${stackPrefix}::${stepY},::${stepX},:`;
  }
  return `${stackPrefix}::${stepY},::${stepX}`;
}

/**
 * Computes downsample step sizes synchronously using any structure already
 * present in `options`. Used by `getArrayAsImagePath` which cannot be async.
 *
 * When neither `downSampleRatio` nor array structure is available, returns
 * `{ stepX: 1, stepY: 1 }` (no downsampling).
 *
 * @param options - Array request options, optionally containing structure info.
 * @returns An object with integer `stepX` and `stepY` downsample steps.
 */
export function generateStepsForArray(
  options: TiledArrayRequestOptions = {},
): { stepX: number; stepY: number } {
  return computeSteps(resolveArrayStructure(options), options);
}

/**
 * Computes downsample step sizes, fetching array structure from the server
 * when it is not already available in `options`.
 *
 * @param arrayPath - Tiled path to the array (used for the structure fetch).
 * @param options - Array request options, optionally containing structure info.
 * @param fetchStructure - Callback that fetches `ArrayStructure` for a path. If
 *   omitted or if the fetch throws, step sizes default to `{ stepX: 1, stepY: 1 }`.
 * @returns A promise resolving to integer `stepX` and `stepY` downsample steps.
 */
export async function generateStepsForArrayAsync(
  arrayPath: string,
  options: TiledArrayRequestOptions = {},
  fetchStructure?: StructureFetcher,
): Promise<{ stepX: number; stepY: number }> {
  let structure = resolveArrayStructure(options);

  if (!structure && fetchStructure) {
    try {
      structure = await fetchStructure(arrayPath);
    } catch {
      // fall back to 1,1 if fetch fails
    }
  }

  return computeSteps(structure, options);
}

/**
 * Builds the Tiled `slice` query-string parameter synchronously.
 *
 * Uses structure already present in `options`; does not fetch from the server.
 * Prefer `buildTiledArraySliceAsync` when the caller can be async.
 *
 * @param options - Array request options used to compute step sizes and format the slice.
 * @returns A slice string such as `"::2,::2"` or `"0,::4,::4"`.
 */
export function buildTiledArraySlice(
  options: TiledArrayRequestOptions = {},
): string {
  return formatSlice(options, generateStepsForArray(options));
}

/**
 * Builds the Tiled `slice` query-string parameter, fetching array structure
 * from the server when it is not already in `options`.
 *
 * Used by `getArrayAsJSON`, `getArrayAsPng`, and `getArrayAsBuffer` inside
 * `TiledApiClient` where async calls are fine.
 *
 * @param arrayPath - Tiled path to the array (used for the structure fetch).
 * @param options - Array request options.
 * @param fetchStructure - Optional callback to retrieve `ArrayStructure`.
 * @returns A promise resolving to a slice string such as `"::2,::2"`.
 */
export async function buildTiledArraySliceAsync(
  arrayPath: string,
  options: TiledArrayRequestOptions = {},
  fetchStructure?: StructureFetcher,
): Promise<string> {
  const steps = await generateStepsForArrayAsync(arrayPath, options, fetchStructure);
  return formatSlice(options, steps);
}