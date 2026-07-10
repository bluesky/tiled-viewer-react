import { useState, useRef } from 'react';
import Button from '../../Button';
import {
  getArrayAsJSON,
  getArrayAsPng,
  getArrayAsImagePath,
  getArrayAsBuffer,
  getTableAs,
  getTableAsJSON,
  getTableAsJSONSequence,
} from './defaultTiledApiClient';
import type { TiledArrayRequestOptions } from './TiledArrayApi';
import type { TiledTableRequestOptions, TiledTableReturnType } from './TiledTableApi';
import type { TiledRequestOptions, TiledPathMode } from './TiledConfigApi';

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls = 'border border-slate-400 rounded px-2 py-1 text-sm w-full';
const labelCls = 'text-xs font-medium text-slate-600';

// ─── Static (shared) request options ─────────────────────────────────────────

interface StaticOpts {
  baseUrl: string;
  initialPath: string;
  pathMode: TiledPathMode | '';
  apiKey: string;
}

const defaultStaticOpts = (): StaticOpts => ({
  baseUrl: 'http://localhost:8000/api/v1',
  initialPath: '',
  pathMode: '',
  apiKey: '',
});

function buildStaticOptions(opts: StaticOpts): Partial<TiledRequestOptions> {
  const out: Partial<TiledRequestOptions> = {};
  if (opts.baseUrl !== '') out.baseUrl = opts.baseUrl;
  if (opts.initialPath !== '') out.initialPath = opts.initialPath;
  if (opts.pathMode !== '') out.pathMode = opts.pathMode as TiledPathMode;
  if (opts.apiKey !== '') out.apiKey = opts.apiKey;
  return out;
}

function StaticOptsPanel({
  opts,
  onChange,
}: {
  opts: StaticOpts;
  onChange: (next: StaticOpts) => void;
}) {
  return (
    <div className="border border-sky-200 bg-sky-50 rounded-lg p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-sky-800 uppercase tracking-wide">
        Static Request Options
      </h3>
      <p className="text-xs text-sky-700">
        Applied to every request below. Leave a field blank to use the default client value.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>baseUrl</label>
          <input
            type="text"
            className={inputCls}
            placeholder="http://localhost:8000/api/v1"
            value={opts.baseUrl}
            onChange={(e) => onChange({ ...opts, baseUrl: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>initialPath</label>
          <input
            type="text"
            className={inputCls}
            placeholder="/beamlines/..."
            value={opts.initialPath}
            onChange={(e) => onChange({ ...opts, initialPath: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>pathMode</label>
          <select
            className={inputCls}
            value={opts.pathMode}
            onChange={(e) => onChange({ ...opts, pathMode: e.target.value as TiledPathMode | '' })}
          >
            <option value="">(default)</option>
            <option value="relative">relative</option>
            <option value="absolute">absolute</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>apiKey</label>
          <input
            type="text"
            className={inputCls}
            placeholder="api key"
            value={opts.apiKey}
            onChange={(e) => onChange({ ...opts, apiKey: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Array options state ──────────────────────────────────────────────────────

interface ArrayOpts {
  downSampleRatio: string;
  maxBytesAllowed: string;
  stack: string;
  isRGB: boolean;
  format: string;
}

const defaultArrayOpts = (): ArrayOpts => ({
  downSampleRatio: '',
  maxBytesAllowed: '',
  stack: '',
  isRGB: false,
  format: '',
});

function buildArrayOptions(opts: ArrayOpts): TiledArrayRequestOptions & { format?: string } {
  const out: TiledArrayRequestOptions & { format?: string } = {};
  if (opts.downSampleRatio !== '') out.downSampleRatio = Number(opts.downSampleRatio);
  if (opts.maxBytesAllowed !== '') out.maxBytesAllowed = Number(opts.maxBytesAllowed);
  if (opts.stack.trim() !== '')
    out.stack = opts.stack
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);
  if (opts.isRGB) out.isRGB = true;
  if (opts.format !== '') out.format = opts.format;
  return out;
}

// ─── Table options state ──────────────────────────────────────────────────────

interface TableOpts {
  partition: string;
  format: string;
}

const defaultTableOpts = (): TableOpts => ({ partition: '', format: '' });

function buildTableOptions(opts: TableOpts): TiledTableRequestOptions & { format?: string } {
  const out: TiledTableRequestOptions & { format?: string } = {};
  if (opts.partition !== '') out.partition = Number(opts.partition);
  if (opts.format !== '') out.format = opts.format;
  return out;
}

// ─── Row state ────────────────────────────────────────────────────────────────

interface RowState<O> {
  path: string;
  opts: O;
  result: unknown;
  error: string | null;
  loading: boolean;
}

// ─── Array options inputs ─────────────────────────────────────────────────────

function ArrayOptsInputs({
  opts,
  onChange,
  formatPlaceholder,
}: {
  opts: ArrayOpts;
  onChange: (next: ArrayOpts) => void;
  formatPlaceholder?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <div className="flex flex-col gap-1">
        <label className={labelCls}>downSampleRatio</label>
        <input
          type="number"
          className={inputCls}
          placeholder="e.g. 2"
          value={opts.downSampleRatio}
          onChange={(e) => onChange({ ...opts, downSampleRatio: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>maxBytesAllowed</label>
        <input
          type="number"
          className={inputCls}
          placeholder="e.g. 1000000"
          value={opts.maxBytesAllowed}
          onChange={(e) => onChange({ ...opts, maxBytesAllowed: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>stack (comma-separated)</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. 5,0"
          value={opts.stack}
          onChange={(e) => onChange({ ...opts, stack: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>format</label>
        <input
          type="text"
          className={inputCls}
          placeholder={formatPlaceholder ?? 'e.g. application/json'}
          value={opts.format}
          onChange={(e) => onChange({ ...opts, format: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2 pt-4">
        <input
          type="checkbox"
          id={`isRGB-${formatPlaceholder}`}
          checked={opts.isRGB}
          onChange={(e) => onChange({ ...opts, isRGB: e.target.checked })}
        />
        <label htmlFor={`isRGB-${formatPlaceholder}`} className={labelCls}>
          isRGB
        </label>
      </div>
    </div>
  );
}

// ─── Table options inputs ─────────────────────────────────────────────────────

function TableOptsInputs({
  opts,
  onChange,
}: {
  opts: TableOpts;
  onChange: (next: TableOpts) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1">
        <label className={labelCls}>partition</label>
        <input
          type="number"
          className={inputCls}
          placeholder="e.g. 0"
          value={opts.partition}
          onChange={(e) => onChange({ ...opts, partition: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>format</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. application/json"
          value={opts.format}
          onChange={(e) => onChange({ ...opts, format: e.target.value })}
        />
      </div>
    </div>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function ResultDisplay({ result }: { result: unknown }) {
  if (result === null || result === undefined) return null;

  if (result instanceof Blob) {
    const url = URL.createObjectURL(result);
    return (
      <div className="mt-2">
        <img src={url} alt="result" className="max-h-64 border rounded" />
      </div>
    );
  }

  if (result instanceof ArrayBuffer) {
    return (
      <pre className="bg-slate-50 rounded p-2 text-xs font-mono overflow-auto max-h-64 mt-2">
        ArrayBuffer: {result.byteLength} bytes
      </pre>
    );
  }

  // image path or plain string
  if (typeof result === 'string') {
    return (
      <div className="mt-2 flex flex-col gap-1">
        <img src={result} alt="result" className="max-h-64 border rounded" />
        <p className="text-xs text-slate-500 font-mono break-all">{result}</p>
      </div>
    );
  }

  return (
    <pre className="bg-slate-50 rounded p-2 text-xs font-mono overflow-auto max-h-64 mt-2">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

// ─── ArrayFunctionRow ─────────────────────────────────────────────────────────

function ArrayFunctionRow({
  label,
  formatPlaceholder,
  onExecute,
}: {
  label: string;
  formatPlaceholder?: string;
  onExecute: (path: string, opts: TiledArrayRequestOptions & { format?: string }) => Promise<unknown> | unknown;
}) {
  const [state, setState] = useState<RowState<ArrayOpts>>({
    path: '',
    opts: defaultArrayOpts(),
    result: null,
    error: null,
    loading: false,
  });

  const blobUrlRef = useRef<string | null>(null);

  async function handleExecute() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setState((s) => ({ ...s, loading: true, error: null, result: null }));
    try {
      const result = await Promise.resolve(onExecute(state.path, buildArrayOptions(state.opts)));
      setState((s) => ({ ...s, loading: false, result }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <h3 className="font-mono text-sm font-semibold text-slate-800">{label}</h3>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>path</label>
        <input
          type="text"
          className={inputCls}
          placeholder="array path"
          value={state.path}
          onChange={(e) => setState((s) => ({ ...s, path: e.target.value }))}
        />
      </div>

      <ArrayOptsInputs
        opts={state.opts}
        onChange={(opts) => setState((s) => ({ ...s, opts }))}
        formatPlaceholder={formatPlaceholder}
      />

      <div>
        <Button
          text={state.loading ? 'Loading…' : 'Execute'}
          disabled={state.loading || state.path.trim() === ''}
          cb={() => { void handleExecute(); }}
          size="small"
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-600 font-mono">{state.error}</p>
      )}

      <ResultDisplay result={state.result} />
    </div>
  );
}

// ─── TableFunctionRow ─────────────────────────────────────────────────────────

function TableFunctionRow({
  label,
  showTypeSelector,
  onExecute,
}: {
  label: string;
  showTypeSelector?: boolean;
  onExecute: (
    path: string,
    opts: TiledTableRequestOptions & { format?: string },
    type?: TiledTableReturnType,
  ) => Promise<unknown>;
}) {
  const [state, setState] = useState<RowState<TableOpts>>({
    path: '',
    opts: defaultTableOpts(),
    result: null,
    error: null,
    loading: false,
  });
  const [tableType, setTableType] = useState<TiledTableReturnType>('JSON');

  async function handleExecute() {
    setState((s) => ({ ...s, loading: true, error: null, result: null }));
    try {
      const result = await onExecute(
        state.path,
        buildTableOptions(state.opts),
        showTypeSelector ? tableType : undefined,
      );
      setState((s) => ({ ...s, loading: false, result }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <h3 className="font-mono text-sm font-semibold text-slate-800">{label}</h3>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>path</label>
        <input
          type="text"
          className={inputCls}
          placeholder="table path"
          value={state.path}
          onChange={(e) => setState((s) => ({ ...s, path: e.target.value }))}
        />
      </div>

      <TableOptsInputs
        opts={state.opts}
        onChange={(opts) => setState((s) => ({ ...s, opts }))}
      />

      {showTypeSelector && (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>type</label>
          <select
            className={inputCls}
            value={tableType}
            onChange={(e) => setTableType(e.target.value as TiledTableReturnType)}
          >
            <option value="JSON">JSON</option>
            <option value="JSON_SEQ">JSON_SEQ</option>
          </select>
        </div>
      )}

      <div>
        <Button
          text={state.loading ? 'Loading…' : 'Execute'}
          disabled={state.loading || state.path.trim() === ''}
          cb={() => { void handleExecute(); }}
          size="small"
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-600 font-mono">{state.error}</p>
      )}

      <ResultDisplay result={state.result} />
    </div>
  );
}

// ─── TiledClientTest ──────────────────────────────────────────────────────────

export default function TiledClientTest() {
  const [staticOpts, setStaticOpts] = useState<StaticOpts>(defaultStaticOpts);

  function mergeStatic<T extends object>(rowOpts: T): T {
    return { ...buildStaticOptions(staticOpts), ...rowOpts };
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl">
      <h2 className="text-lg font-semibold text-slate-800">Tiled Client Test</h2>

      <StaticOptsPanel opts={staticOpts} onChange={setStaticOpts} />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Array Functions
        </h3>

        <ArrayFunctionRow
          label="getArrayAsJSON"
          formatPlaceholder="application/json"
          onExecute={(path, opts) => getArrayAsJSON(path, mergeStatic(opts) as never)}
        />

        <ArrayFunctionRow
          label="getArrayAsPng"
          formatPlaceholder="image/png"
          onExecute={(path, opts) => getArrayAsPng(path, mergeStatic(opts) as never)}
        />

        <ArrayFunctionRow
          label="getArrayAsBuffer"
          formatPlaceholder="application/octet-stream"
          onExecute={(path, opts) => getArrayAsBuffer(path, mergeStatic(opts) as never)}
        />

        <ArrayFunctionRow
          label="getArrayAsImagePath"
          formatPlaceholder="image/png or image/tiff"
          onExecute={(path, opts) => Promise.resolve(getArrayAsImagePath(path, mergeStatic(opts) as never))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Table Functions
        </h3>

        <TableFunctionRow
          label="getTableAs"
          showTypeSelector
          onExecute={(path, opts, type) =>
            getTableAs(path, (type ?? 'JSON') as TiledTableReturnType, mergeStatic(opts) as never)
          }
        />

        <TableFunctionRow
          label="getTableAsJSON"
          onExecute={(path, opts) => getTableAsJSON(path, mergeStatic(opts) as never)}
        />

        <TableFunctionRow
          label="getTableAsJSONSequence"
          onExecute={(path, opts) => getTableAsJSONSequence(path, mergeStatic(opts) as never)}
        />
      </section>
    </div>
  );
}
