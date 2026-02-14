# Material Explorer

Welcome to Material Explorer! This application allows you to interactively create, customize, and visualize materials in 3D. Leveraging the power of React Three Fiber, it offers real-time feedback on changes to material properties such as color, metalness, and roughness. The app is designed to be responsive and user-friendly, ensuring a seamless experience across various devices and screen sizes.

## Features

- **PBR / Physical materials**: color, metalness, roughness, emissive, clearcoat, transmission/IOR, opacity
- **Texture maps**: base color, normal (+ scale), roughness, metalness, AO (+ strength), emissive, alpha (+ cutoff), plus tiling (U/V)
- **Live 3D preview**: model picker, HDRI/environment picker, zoom/grid/background toggles, reset view, PNG snapshot, A/B compare
- **Library UX**: favorites, tags, search/sort, tag filter chips, bulk actions, manual drag-to-reorder
- **Import/Export**:
  - JSON presets (single + whole library)
  - GLB export per material and GLB export of the library (grid of preview spheres)
- **Responsive layout**: mobile drawer sidebar + editor stacks preview above controls

## Prerequisites

- Node.js (version 20.x or higher)
- npm (comes with Node.js)

## Installation

To run Material Explorer locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/mikechaves/material-explorer.git
   ```

2. Navigate to the project directory:

   ```bash
   cd material-explorer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

To start the development server:

```bash
npm start
```

You can also run:

```bash
npm run dev
```

This will open the app in your default web browser at `http://localhost:3000`. The app will automatically reload if you make changes to the source code.

## Building for Production

To create a production build:

```bash
npm run build
```

This command builds the app for production to the `build` folder. The build is minified and the filenames include hashes for cache management.

## Quality Gates

Before opening a pull request, run:

```bash
npm run quality:full
```

Equivalent expanded steps:

```bash
npm run check-format
npm run lint
npm run type-check
npm run test:ci
npm run build
npm run check:bundle
npm run test:e2e
npm run security:audit
```

The repository runs these checks in GitHub Actions on pull requests and on pushes to `main`.

## Optional API Sync

Material persistence defaults to local storage. To enable backend sync with local fallback, set:

```bash
VITE_MATERIALS_API_URL=https://your-api.example.com
VITE_MATERIALS_USER_SCOPE=user-123
# optional: if your API expects bearer auth
VITE_MATERIALS_AUTH_TOKEN=token-value
```

When set, the app uses:

- `GET /materials?scope=<scope>` to hydrate the library on startup
- `PUT /materials?scope=<scope>` to persist updates

If the API is unavailable, the app continues using local storage.
The sidebar will show a non-blocking sync warning when remote sync fails while local persistence still succeeds.

Local fallback is also scope-aware:

- default key: `materials`
- scoped key: `materials:<scope>`

## Optional Observability

To forward web-vitals, unhandled errors, and sync-failure telemetry to your backend, set:

```bash
VITE_TELEMETRY_URL=https://your-observability.example.com/events
```

Telemetry is best-effort and never blocks user actions.

## Usage

### Creating a Material

- Use the editor controls to set PBR parameters and textures.
- Click **Save Material** to add it to your library.

### Editing a Material

- Click **Edit** on a card in the sidebar to load it into the editor.
- Adjust properties and click **Update Material**.

### Deleting a Material

- Click **Delete** on a card in the sidebar to remove it from your collection.

### Sharing & exporting

- **Share link**: copies a URL that encodes the material settings.
  - “Share link” excludes textures.
  - “Share + tex” attempts to include textures, but will refuse if the URL is too large.
- **Export JSON**: best for sharing materials **with textures** reliably.
- **Export GLB**: exports preview geometry with the material applied (portable glTF 2.0 binary).

### Notes / limitations

- **LocalStorage quota**: textures are stored as data URLs inside saved material JSON; large images can exceed browser storage limits.
- **GLB exports are previews**: GLB contains preview geometry (sphere/grid), not an imported user mesh.

## Technologies Used

- React 18
- Vite
- Three.js
- React Three Fiber
- TypeScript
- Tailwind CSS

## Contributing

Contributions to Material Explorer are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## License

Material Explorer is released under the MIT License. See the [LICENSE](LICENSE) file for more information.
