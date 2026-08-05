
# Tiled Viewer

A React component for browsing and selecting data from a [Bluesky Tiled](https://github.com/bluesky/tiled) server. Supports multiple authentication methods (API key, bearer token, username/password, OIDC), flexible UI modes, and provides callback data when users select items for use in your main app.

## Features

- 🔐 **Multiple Authentication Methods** - API key, bearer token, OIDC, username/password
- 🎨 **Flexible UI Modes** - Normal component, button mode, popup modal
- 🔍 **Advanced Search** - Search by ID, metadata, and spec
- 🔗 **Callbacks** - Item selection data with optional auth tokens

## Installation

Install the component in your React project:

```bash
npm install @blueskyproject/tiled
```

## Basic Usage

```jsx
import { Tiled } from '@blueskyproject/tiled';
import '@blueskyproject/tiled/style.css'; // Import once in your app

function App() {
  const handleSelection = (data) => {
    console.log('Selected item:', data);
  };

  return (
    <Tiled 
      tiledBaseUrl="https://your-tiled-server.com/api/v1"
      onSelectCallback={handleSelection}
    />
  );
}
```

## Props Reference

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tiledBaseUrl` | `string` | - | Base URL for the Tiled server API |
| `onSelectCallback` | `(data: TiledItemSelectionData) => void` | - | Callback function triggered when an item is selected |

### Authentication Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | - | API key for authentication with the Tiled server |
| `bearerToken` | `string` | - | Bearer token for authentication as an alternative to API key |
| `includeAuthTokensInSelectCallback` | `boolean` | `false` | Include authentication tokens in the selection callback data |
| `oidcRedirectUrl` | `string` | - | URL to redirect to after successful OIDC authentication, requires Tiled server configuration that points to general utility site that does redirects off state param (set via the redirect_on_success field in the config.yml) |

### UI Mode Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isPopup` | `boolean` | `false` | Display component as a modal popup with overlay |
| `isButtonMode` | `boolean` | `false` | Display as a button that opens the viewer when clicked |
| `buttonModeText` | `string` | `"Select Data"` | Custom text for the button when in button mode |
| `size` | `'small' \| 'medium' \| 'large'` | - | Size preset for the component container |
| `isFullWidth` | `boolean` | `false` | Make the component take full width of its container |
| `closeOnSelect` | `boolean` | `false` | Automatically close the component after item selection |

### Layout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `singleColumnMode` | `boolean` | `false` | Display data in a single column layout instead of multi-column |
| `backgroundClassName` | `string` | - | Additional CSS classes for the background container |
| `contentClassName` | `string` | - | Additional CSS classes for the content container |

### Button Mode Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `inButtonModeShowApiKeyInput` | `boolean` | - | Show API key input field when in button mode |
| `inButtonModeShowReverseSortInput` | `boolean` | - | Show reverse sort toggle when in button mode |
| `inButtonModeShowSelectedData` | `boolean` | - | Display selected item data when in button mode |

### Navigation & Display Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialPath` | `string` | - | Initial path to navigate to when component loads, will not allow user to select previous containers and will hide them |
| `reverseSort` | `boolean` | `true` | Sort items in reverse order (newest first) |
| `pageLimit` | `number` | `25` | Number of items to display per page |
| `reloadLastItemOnStartup` | `boolean` | `false` | Automatically reload the last viewed item on startup |
| `showPlanName` | `boolean` | - | Display plan names in the item listings if it's a Bluesky Run|
| `showPlanStartTime` | `boolean` | - | Display plan start times in the item listings if it's a Bluesky Run|
| `enableStartupScreen` | `boolean` | `false` | Show the initial startup screen for URL configuration |

### TiledItemSelectionData Interface

When an item is selected, the `onSelectCallback` receives a `TiledItemSelectionData` object:

```typescript
interface TiledItemSelectionData {
  // Required item information
  id: string;
  ancestors: string[];
  
  // Item links (from TiledItemLinks)
  self: string;
  full?: string;
  block?: string;
  buffers?: string;
  partition?: string;
  search?: string;
  default?: string;
  
  // Optional authentication tokens (when includeAuthTokensInSelectCallback=true)
  refreshToken?: string | null;
  accessToken?: string | null;
  
  // Optional slice information for 3D+ arrays only
  currentSlice?: number[];
}
```

## UI Variants

### 1. Normal Component Mode

Default rendering as a standard React component:

```jsx
<Tiled tiledBaseUrl="https://localhost:8000/api/v1" />
```

### 2. Button Mode

Renders as a button that opens a full screen modal overlay when clicked:

```jsx
<Tiled 
  tiledBaseUrl="https://localhost:8000/api/v1"
  isButtonMode={true}
  buttonModeText="Browse Data" //text inside the button
  inButtonModeShowSelectedData={true} //shows selected data next to button, can be set to false
/>
```

### 3. Popup Modal Mode

Renders as a full-screen modal overlay:

```jsx
<Tiled 
  tiledBaseUrl="https://localhost:8000/api/v1"
  isPopup={true}
  closeOnSelect={true} //optionally close the modal after data is select, set as false to remain open 
/>
```

### 4. Single Column Mode

Optimized layout for searching a single column of data, immediately closes when an item is clicked:

```jsx
<Tiled 
  tiledBaseUrl="https://localhost:8000/api/v1"
  singleColumnMode={true}
/>
```

## Development Tips

- **TypeScript Intellisense**: Press `Ctrl+Space` inside the `<Tiled>` component to see all available props
- **Debugging**: Check browser console for authentication and connection error messages  
- **Styling**: Import the CSS once in your app root: `import '@blueskyproject/tiled/style.css'`
---
# Getting this to work with a Tiled server


## Bluesky Tiled Server Requirements

This component requires a [Bluesky Tiled server](https://github.com/bluesky/tiled) to be setup and reachable from your application.

### Common Connection Issues

#### 1. CORS Configuration

CORS issues are the most common problem. Configure your Tiled server with proper allowed origins:

Bash
```bash
# Starting from the command line
TILED_ALLOW_ORIGINS='["http://localhost:5174", "https://my-website.com"]' tiled serve demo
```

Tiled Config
```yml
# Using a config file
authentication:
  single_user_api_key: ${TILED_SINGLE_USER_API_KEY}
  allow_anonymous_access: true
uvicorn:
  host: 0.0.0.0
  port: 8000
allow_origins:
  - http://localhost:5173 #<- Manually add all browser clients here
  - http://123.456.789:5174
  - https://my-website.com
trees:
...

```

⚠️ **Important**: You cannot use wildcards (`*`) in CORS allowed origins if your Tiled server requires authentication.

#### 2. Authentication Setup

If you get past CORS but receive authorization errors:

- **API Key**: Add `apiKey` prop to the component
- **Bearer Token**: Use `bearerToken` prop for token-based auth  

```jsx
// API Key authentication
<Tiled 
  tiledBaseUrl="https://localhost:8000/api/v1"
  apiKey="your-static-api-key"
/>

// Bearer token authentication  
<Tiled 
  tiledBaseUrl="https://localhost:8000/api/v1"
  bearerToken="your-bearer-token"
/>
```

---

# Development & Contributing

## Local Development Setup

For development or to run the project locally without creating your own React app:

### Prerequisites
- [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed

### Clone and Install

```bash
git clone https://github.com/bluesky/tiled-viewer-react.git
cd tiled-viewer-react
npm install
```

### Development Servers

**React Development Server:**
```bash
npm run dev
```
Visit [localhost:5173](http://localhost:5173)

**Storybook Development:**
```bash
npm run storybook  
```
Visit [localhost:6006](http://localhost:6006)

## Tarball Smoke Test (before publishing)

`npm pack` produces the exact artifact `npm publish` would upload, so you can install
and run the package in a throwaway app without touching the npm registry. Do this
before any release that changes the build, the dependencies, or the supported React
range — the in-repo tests exercise `src/`, but this exercises `dist/` the way a
consumer actually receives it.

### 1. Build and pack

```bash
npm run build   # required: only dist/ ships, and there is no prepublishOnly hook
npm pack        # -> blueskyproject-tiled-<version>.tgz
```

Sanity-check that no React internals got bundled — `dist` must *import* the JSX
runtime from the consumer's React, never inline the build-time one:

```bash
grep -c "recentlyCreatedOwnerStacks\|__CLIENT_INTERNALS" dist/tiled.es.js  # -> 0
grep -o 'from "react/jsx-runtime"' dist/tiled.es.js                        # -> present
```

If the first command is non-zero, `react/jsx-runtime` is being bundled and the package
will crash against any React major other than the one it was built with. Check
`build.rollupOptions.external` in `vite.config.ts` — it must match peer-dependency
subpaths, not just the bare `react` / `react-dom` specifiers.

### 2. Create a scratch app

Keep it outside this repo so it never pollutes the working tree:

```bash
mkdir -p ~/Repos/tiled-scratch && cd ~/Repos/tiled-scratch
npm create vite@latest react19 -- --template react-ts
cd react19
npm install
npm install ~/Repos/tiled-viewer-react/blueskyproject-tiled-<version>.tgz
```

Install the **tarball**, not `npm link` or `file:../tiled-viewer-react`. Those symlink
into this repo, so the app ends up with two copies of React and throws
"invalid hook call" — a bug that does not exist in the published package.

### 3. Render the component

Replace `src/App.tsx` with:

```tsx
import { useState, version as reactVersion } from 'react';
import { Tiled } from '@blueskyproject/tiled';
import type { TiledProps } from '@blueskyproject/tiled';
import '@blueskyproject/tiled/style.css';

type SelectionData = Parameters<NonNullable<TiledProps['onSelectCallback']>>[0];

export default function App() {
  const [selected, setSelected] = useState<SelectionData | null>(null);
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <p>React {reactVersion}</p>
      {/* No tiledBaseUrl: falls back to <protocol>//<hostname>:8000/api/v1 */}
      <Tiled onSelectCallback={setSelected} />
      <pre>{selected ? JSON.stringify(selected, null, 2) : 'nothing selected yet'}</pre>
    </main>
  );
}
```

Then start a local Tiled server on port 8000 (see
[Getting this to work with a Tiled server](#getting-this-to-work-with-a-tiled-server),
and make sure its CORS config allows `http://localhost:5173`) and run:

```bash
npx tsc -b --noEmit   # typechecks your app against the shipped .d.ts files
npm run build         # proves the package resolves in a production build
npm run dev           # http://localhost:5173
```

If you would rather point at the public demo server than run one locally, pass the URL
explicitly: `<Tiled tiledBaseUrl="https://tiled-demo.blueskyproject.io/api/v1" />`.

### 4. Repeat against the other supported React version

The package supports React 18 and 19, so check both. Copy the app, swap the React
version, reinstall the tarball, and run it on a second port:

```bash
cd ~/Repos/tiled-scratch
cp -R react19 react18 && cd react18
rm -rf node_modules dist package-lock.json
npm install
npm install react@^18.3.1 react-dom@^18.3.1
npm install -D @types/react@^18.3.17 @types/react-dom@^18.3.5
npm install ~/Repos/tiled-viewer-react/blueskyproject-tiled-<version>.tgz
npx tsc -b --noEmit && npm run dev -- --port 5174
```

The typecheck is the important half here: it is what catches React types that only
exist in one major version (for example the global `JSX` namespace, dropped in React
19, or `React.RefObject<T>`, whose shape differs between 18 and 19).

### 5. What to check in the browser

- The viewer renders and lists containers from the Tiled server
- Navigating into a container and previewing an array / table works
- Selecting an item fires `onSelectCallback` and the payload appears
- The browser console is free of React errors — especially "invalid hook call"
  (duplicate React) and missing-stylesheet layout breakage

### 6. Clean up

```bash
rm ~/Repos/tiled-viewer-react/blueskyproject-tiled-<version>.tgz
rm -rf ~/Repos/tiled-scratch
```

To inspect what would ship without building a whole app, use `npm pack --dry-run`,
or trigger the `Publish package on npm` workflow via `workflow_dispatch` — that runs
lint, tests, build, and `npm pack --dry-run`, and skips publishing entirely.

## Publishing Updates

For maintainers publishing to npm:

1. **Ensure passing tests:**
   ```bash
   npm run test # Should pass
   ```

2. **Ensure clean working tree:**
   ```bash
   git status  # Should be clean
   ```

3. **Version bump and push tag:**
   ```bash
   npm version patch  # or minor/major
   git push origin main --follow-tags  # Pushes the version commit and tag
   ```

4. **Create GitHub release:**
   - Go to [GitHub Releases](https://github.com/bluesky/tiled-viewer-react/releases)
   - Click "Create a new release"
   - Use the version number from step 3 as the tag (e.g., `v1.2.3`)
   - Add release notes describing the changes
   - Click "Publish release"

5. **Automated publishing:**
   The GitHub Actions workflow will automatically:
   - Build the package
   - Run tests and linting
   - Publish to npm with provenance information
   - Use OIDC authentication (no tokens needed)

6. **Verify publication:**
   Check [npmjs.com/package/@blueskyproject/tiled](https://www.npmjs.com/package/@blueskyproject/tiled)

**Note:** `npm version patch` creates both a commit and an annotated git tag. The `--follow-tags` flag ensures both are pushed together. The workflow only runs on published releases, so ensure you use "Publish release" (not "Save draft") to trigger the npm publication. You can also manually trigger the workflow from the Actions tab if needed for testing.

## Project Structure

- `/src/components/Tiled/` - Main component source code
- `/src/stories/` - Storybook stories and documentation
- `/src/testing/` - Test files and mock data
- `/dist/` - Built package output (generated)

---

## License & Support

This project is part of the [Bluesky Project](https://github.com/bluesky) ecosystem.

- **Issues**: [GitHub Issues](https://github.com/bluesky/tiled-viewer-react/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bluesky/tiled-viewer-react/discussions)
- **Documentation**: [Tiled Documentation](https://blueskyproject.io/tiled/)


