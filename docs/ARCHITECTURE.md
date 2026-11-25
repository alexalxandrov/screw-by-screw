# Technical Architecture

**Status:** v0.9 static Three.js viewer implemented; reusable engine extraction in progress
**Pilot:** EVGA GeForce RTX 3060 XC BLACK GAMING 12GB

## Goals

- Separate reusable application code from device-specific content.
- Keep geometry independent from semantic component data.
- Support versioned model packages.
- Validate content before publication.
- Start locally and inexpensively; avoid infrastructure that does not validate the MVP.

## Proposed stack

| Layer | Candidate | Responsibility |
|---|---|---|
| Web client | Vanilla JavaScript + Vite (current); React + TypeScript optional later | Application shell and navigation |
| 3D runtime | Three.js 0.187.0 (current) | GLB rendering, picking, transforms, layers and animation |
| Content package | GLB + JSON | Geometry and device-specific data |
| Content tools | Python + Blender Python + FreeCAD | Import, cleanup, metadata, export, validation |
| API | FastAPI, optional for static MVP | Model catalogue and content delivery |
| Metadata store | SQLite initially; PostgreSQL only when justified | Device/source metadata and future authoring |
| Asset storage | Filesystem initially | GLB, images, documents, thumbnails |
| Version control | Git | Code, schemas, docs, manifests, small cleared assets |

The first viewer can load a static versioned package directly. Do not add a backend merely to serve one static model without a real requirement.

## Repository boundaries

- src/: application code (future).
- docs/: product, data, pipeline, architecture, research.
- MODELS/: device-specific content packages and source registers.
- tools/: import/export/validation scripts (future).
- schemas/: JSON Schema and shared content contracts (future).
- tests/: automated validation and viewer tests (future).

## Device package contract

Each model package should contain model identity, components, relationships, sources, assembly steps, optional process layers, optimized GLB, and a release manifest. Large/restricted source files must not be committed; retain metadata, hashes, and lawful retrieval instructions.

## Runtime flow

1. Catalogue returns a device model and release.
2. Client loads release manifest.
3. Client loads GLB and JSON resources.
4. GLB node extras/names or a stable mapping table resolve geometry nodes to component instance IDs.
5. Selection updates component tree, card, and relationship highlighting.
6. Viewer uses authored base/exploded transforms.
7. Process layers toggle overlays and linked-component highlighting.
8. UI displays provenance and confidence information.

## Constraints

Stable IDs, explicit units and coordinate system, semantic selection preserved when instancing/merging, avoid destructive decimation of small parts, measure browser performance before splitting/compressing assets, GLB is delivery format not sole editable source, validate all paths and JSON references.

## Implemented technical baseline

The current browser pilot uses Three.js + Vite, loads self-contained GLB files locally, maps stable component IDs to an assembly tree, and supports orbit controls, component selection, isolation, wireframe, reversible exploded view, qualitative process layers and a bilingual learning panel. The shared SceneController is being extracted from the GPU-specific UI so other model packages can reuse the same scene operations.

## First technical spike

Before the full application: create a test scene with 10–20 independently selectable parts; export GLB from Blender; load it in a minimal Three.js page; verify node names, transforms, picking, ID mapping, exploded interpolation and reassembly; measure load time and memory in a desktop browser. Resolve these integration risks before building the larger UI.


## Implemented static device catalogue

The viewer includes a statically imported bilingual index at `content/catalog/models.json`. It records exact manufacturer part number, category, package version/path and geometry-evidence class. It does not need a catalogue API. Hosted builds resolve staged `.sbsmodel` archives by relative URL. The standalone HTML build embeds packages staged under `public/` as data URLs so the same catalogue works through `file://`. Every selection uses the standard package loader and package model-ID comparison.
