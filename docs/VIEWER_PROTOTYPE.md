# Viewer prototype v0.6

## Purpose

A static, local-first Three.js viewer for the EVGA GeForce RTX 3060 XC BLACK pilot. It is a vertical-slice prototype, not the finished atlas.

## Requirements

- Node.js 22.12 or newer.
- npm.
- A current desktop browser with WebGL support.

The frontend uses Three.js 0.187.0 and Vite 8.3.8. These are pinned in `package.json`.

## Start locally

```bash
npm install
npm run dev
```

Open the loopback URL printed by Vite (default `http://127.0.0.1:5173`).

Build and preview:

```bash
npm run build
npm run preview
```

## Load the GPU model

The viewer starts with an explicitly illustrative fallback scene. It does not silently pretend that this fallback is the accepted physical geometry.

To load the Blender export automatically, copy:

`rtx3060_xc_black_blockout_v04.glb`

to:

`public/models/rtx3060_xc_black_blockout_v04.glb`

Or use **Open GLB** to load a local GLB file in the browser. Generated model binaries are ignored by Git by default.

## Implemented interactions

- Orbit, zoom, pan and camera reset.
- Component tree and synchronized selection.
- Component details with Russian/English labels and evidence status.
- Isolate selected component and restore visibility.
- Global exploded-view slider with reassembly.
- Wireframe toggle.
- Qualitative cooling and power-delivery layers with explanations, linked components, assumptions and source links.
- Local GLB import (256 MiB limit), GLB 2.0 container checks, external-resource URI rejection and fallback scene.
- Duplicate component-ID warnings for imported GLB files.

## Coordinate convention

The Blender source scene uses X = card length, Y = thickness, Z = height. The Blender exporter writes a Y-up glTF asset. The viewer converts imported GLB content back to the atlas Z-up convention at the model wrapper. The fallback scene is authored directly in Z-up coordinates.

## Automated browser tests

The five-test Playwright suite runs in headless Chromium with SwiftShader WebGL. It covers fallback scene rendering, component selection, process-layer explanations, the bilingual quiz and explode/reassemble interaction:

```bash
npx playwright install chromium
npm run test:e2e
```

## Known limitations

- The 24 heatsink fin proxies, fan centres, blade profiles, thickness, PCB outline, shroud contour and internal component positions remain illustrative or unknown.
- Imported nodes without component metadata can render but cannot receive a meaningful technical card.
- The component inventory is a starter set, not a complete BOM.
- Exploded view is a reversible visual separation, not a verified physical removal sequence.
- Cooling and power layers are qualitative highlighting, not CFD, thermal analysis or circuit simulation.
- The learning quiz is a small source-backed starter set, not a complete course or assessment system.
- The viewer has not yet passed local browser testing against the owner's generated v0.4 GLB.
- The content package and viewer are being unified around JSON source-of-truth files; local review is still required.
- No model editing, user accounts, backend, telemetry or publishing workflow is included.

## Next gate

Run the app locally, load the v0.4 GLB, and verify orbit, picking, component IDs, hierarchy, isolate/restore, exploded/reassembled transforms, and RU/EN card rendering. Record browser and console output before accepting v0.6.
