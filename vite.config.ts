import path from "path";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import dts from "vite-plugin-dts";
import tsConfigPaths from "vite-tsconfig-paths";
import * as packageJson from "./package.json";
/// <reference types="vitest" />

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const qserverRest = env.VITE_QSERVER_REST?.trim() || 'http://localhost:60610';
  const qserverWs = env.VITE_QSERVER_WS?.trim() || 'ws://localhost:8000/queue_server';
  const cameraWs = env.VITE_CAMERA_WS?.trim() || 'ws://localhost:8000/pvcamera';

  return {
    define: {
      'import.meta.env': {
        VITE_QSERVER_REST: JSON.stringify(qserverRest),
        VITE_QSERVER_WS: JSON.stringify(qserverWs),
        VITE_CAMERA_WS: JSON.stringify(cameraWs),
      },
    },
    plugins: [
      react(),
      tsConfigPaths(),
      dts({
        include: ['src/', 'src/vite-env.d.ts'],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      allowedHosts: ['tiled-test'],
      proxy: {
        '/api/qserver': {
          target: qserverRest,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qserver/, ''),
        },
        '/api/qserver/console': {
          target: qserverWs,
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qserver\/console/, ''),
        },
        '/api/camera': {
          target: cameraWs,
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/camera/, ''),
        },
      },
    },
    build: {
      lib: {
        entry: resolve('src', 'index.ts'),
        name: 'Tiled',
        formats: ['es', 'umd'],
        fileName: (format) => `tiled.${format}.js`,
      },
      rollupOptions: {
        // Externalize peer deps AND their subpaths. Matching only the bare
        // specifiers would bundle `react/jsx-runtime`, baking the build-time
        // React's JSX runtime — and its version-specific internals — into dist,
        // which then crashes against a consumer's other React major.
        external: (id) =>
          Object.keys(packageJson.peerDependencies).some(
            (dep) => id === dep || id.startsWith(`${dep}/`),
          ),
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
            'react/jsx-dev-runtime': 'jsxDevRuntime',
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/testing/setup.ts'],
      globals: true,
    },
  };
});
