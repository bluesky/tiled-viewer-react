
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


