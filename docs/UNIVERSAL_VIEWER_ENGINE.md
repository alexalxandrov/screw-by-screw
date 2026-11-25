# Universal Viewer Engine — v1.0 foundation

## Purpose

The browser viewer is a reusable runtime, not a GPU-specific page. It loads a self-contained GLB plus a versioned Screw by Screw model package. Device-specific names, evidence, sources, assembly steps, process layers and animation tracks belong to the package. Rendering, camera control, component picking, visibility, transforms and playback belong to the viewer engine.

## Current baseline

The merged v0.9 application is a working Three.js vertical slice. It supports orbit/zoom/pan, GLB import, component tree, selection, evidence cards, isolate, wireframe, reversible exploded view, qualitative process layers and a bilingual learning panel. The v1.0 foundation extracts generic transforms into src/viewer/SceneController.js. GPU metadata remains supplied by a package adapter, while the scene controller has no GPU-specific dependencies.

## Target package contract

A published model release should contain:

- model.json: identity, units, axis convention, geometry/evidence status and release metadata.
- scene.glb: self-contained geometry with stable sbs_component_id extras.
- components.json: stable IDs, parent IDs, localized labels/descriptions, categories, source IDs and evidence/geometry status.
- relationships.json: typed links between components.
- assembly_steps.json: authored, ordered disassembly/reassembly steps. Empty means no verified sequence exists.
- process_layers.json: explanatory layers and linked component IDs.
- animations.json: named, authored animation clips with target component IDs, property tracks, keyframes, duration, easing and explicit evidence/accuracy notes.
- sources.json: source register and rights/provenance metadata.
- release.json: schema version, file list, byte sizes and SHA-256 hashes.

The viewer must treat package data as untrusted input. Validate schema versions, IDs, parent/relationship references, clip target IDs, numeric ranges, file size and GLB container before applying content.

## Engine responsibilities

1. Load and validate a self-contained GLB; never fetch external URIs embedded in an imported file.
2. Build an ID index from node extras; warn on missing/duplicate IDs and preserve unknown nodes for visual inspection.
3. Capture base transforms and model bounds once after load.
4. Support camera orbit, zoom, pan, fit-to-model and named camera presets.
5. Support selection, hierarchy, isolate/restore and material-safe highlighting.
6. Apply deterministic exploded transforms from authored vectors where available; otherwise use a labelled generic radial fallback.
7. Play, pause, seek and cancel authored animation clips; provide deterministic reassembly.
8. Render model-specific component cards and process/learning data through a package adapter.
9. Dispose old model resources and animation handles when changing files.

## Animation policy

Animation is not synonymous with physics simulation. The viewer may animate authored mechanical motion, fan rotation, exploded views and assembly steps. Each clip must identify its source or state that it is illustrative. Do not infer real fan RPM, airflow, thermal behavior, electrical waveforms or removal order from decorative motion.

An animation clip uses normalized time and contains an ID, localized title, duration, evidence status and tracks. Each track targets a stable component ID, names a property and contains ordered keyframes with normalized time and values. Initial properties: position, rotation, scale and visible. Numeric properties interpolate; visibility uses step semantics. Quaternion interpolation can be added when needed.

## Component transform policy

Exploded-view transforms must be reversible and deterministic. The engine captures base transforms and never accumulates offsets. A node with tagged descendants is treated as an assembly container; independently movable leaves receive offsets. Packages may later supply explicit explode vectors and order. Visibility isolation stores and restores original visibility instead of blindly setting every node visible.

## Viewer integration milestones

- Engine foundation: implemented reusable component indexing, reversible explode/reassemble, visibility-safe isolation, reset and generic rotation/explode animation primitives; Five Node unit tests cover deterministic transforms, isolation and duplicate-ID reporting.
- Package loader: next; move GLB and JSON validation into a reusable package loader and verify cross-file references before rendering.
- Animation runtime: current UI demonstrates a reversible explode animation; package-authored clips, pause, seek and animation-track validation remain next.
- Model catalogue: discover packages through a static catalogue manifest first; no backend is required for a local-first viewer.
- Site integration: mount the same viewer runtime in a model detail route; do not duplicate Three.js scene logic in the catalogue UI.

## Non-goals for this foundation

No server-side file upload, accounts, analytics, cloud conversion, Blender replacement or CAD authoring. Blender remains the editable source for the pilot model; GLB is the browser delivery format.
