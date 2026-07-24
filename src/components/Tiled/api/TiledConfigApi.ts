// TiledConfigApi.ts
import type { AxiosInstance } from 'axios';

export type TiledPathMode = 'relative' | 'absolute';

export interface TiledClientConfigApi {
  setBaseUrl(baseUrl: string): void;
  getBaseUrl(): string;

  setInitialPath(initialPath: string): void;
  getInitialPath(): string;

  setApiKey(apiKey: string | null): void;
  getApiKey(): string | null;

  getAxiosClient(): AxiosInstance;
}

export interface TiledClientLike extends TiledClientConfigApi, AxiosInstance {}

export interface TiledRequestOptions {
  /**
   * A fully defined Tiled client that replaces the default client.
   */
  client?: TiledClientLike;

  /**
   * The base path to the Tiled server.
   *
   * Overrides whatever is configured in the default Tiled client or the
   * client passed through `client`.
   */
  baseUrl?: string;

  /**
   * The initial path to prepend to the search path.
   *
   * Overrides the default initial path from any client.
   */
  initialPath?: string;

  /**
   * Controls how paths are resolved.
   *
   * - `relative`: prepends `initialPath`
   * - `absolute`: disregards any `initialPath`
   *
   * Defaults to `relative`.
   */
  pathMode?: TiledPathMode;

  /**
   * API key added to the request header.
   *
   * Overrides any default API key configured in any client.
   */
  apiKey?: string | null;

  /**
   * Signal from an AbortController.
   *
   * Can be used to cancel an in-flight request.
   */
  signal?: AbortSignal;
}

export type TiledClientConfig = {
  client?: AxiosInstance;
  baseUrl?: string;
  initialPath?: string;
  apiKey?: string | null;
};