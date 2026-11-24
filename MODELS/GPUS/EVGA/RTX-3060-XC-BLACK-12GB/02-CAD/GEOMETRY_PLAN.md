# Geometry Reconstruction Plan

**Target:** EVGA GeForce RTX 3060 XC BLACK GAMING, 12G-P5-3655-KR  
**Status:** procedural proxy blockout generator committed; no verified full CAD geometry.

## Modeling strategy

Build a dimensionally anchored blockout first, then replace approximations with verified geometry. Do not begin with detailed PCB components.

### Stage A — external envelope (current first pass)

A Blender Python generator now exists at [build_rtx3060_xc_black_blockout.py](../../../../tools/modeling/build_rtx3060_xc_black_blockout.py).

It creates separate collections for external structure, cooling, PCB/electronics and connectors; tags selectable objects with stable component IDs and evidence status; and writes a JSON manifest. It can save a .blend scene and export GLB.

Grounded inputs:
- Card envelope: 201.8 mm nominal length × 110 mm height.
- Dual-slot classification (not an exact thickness measurement).
- Two fans.
- Fan opening diameter approximately 90 mm and impeller diameter approximately 85 mm, as measured by the LanOC reviewer.

Unresolved/illustrative inputs:
- Overall thickness; the script currently uses a 36 mm placeholder.
- Fan centres and exact fan spacing.
- Shroud silhouette and detailed fan openings.
- PCB outline, thickness and position.
- Internal component positions and dimensions.
- Exact I/O bracket geometry.

The generated geometry is a visual proxy only. It is not CAD, not dimensionally complete, and must not be used for fitment, manufacturing, repair or physical simulation.

### Stage B — cooling assembly
- Replace the coarse heatsink block with measured fin-stack geometry.
- Confirm copper GPU contact plate shape and heatpipe count/routing.
- Replace fan proxy frames/hubs/blades with exact geometry when evidence permits.
- Thermal pads remain illustrative unless dimensions are sourced.

### Stage C — PCB blockout
- Establish PCB board number and revision from a physical sample or reliable evidence.
- Determine PCB outline and thickness from orthogonal photographs or physical measurement.
- Confirm GPU package location.
- Confirm memory-package count/location; six current candidates are not verified.
- Identify power-delivery components from exact-board evidence.
- Confirm fan headers, power connector and I/O details.

### Stage D — component-level fidelity
- Add exact package dimensions and reference designators from verified BoardView/BOM/schematic or direct inspection.
- Model fasteners only after count, location and dimensions are verified.
- Add traces, vias and solder details only if they support learning; avoid false precision.

## Coordinate and scale convention

- Units: millimetres in source CAD/Blender scene.
- Blender scene convention: X = card length, Y = thickness, Z = card height.
- Front/fan side faces -Y.
- Origin: lower-left-rear corner of the nominal envelope.
- Preserve separate source and derived scenes.
- Every selectable object receives a stable component instance ID.
- Maintain the measurement ledger at [MEASUREMENTS.csv](MEASUREMENTS.csv).

## Accuracy labels

- manufacturer_data: published by the manufacturer.
- reviewer_measurement: measured by a cited reviewer.
- measured: measured from a physical sample.
- photo_estimate: estimated from calibrated photographs.
- illustrative: visual stand-in, not exact geometry.
- unknown: no defensible value.

## First geometry acceptance gate

The external blockout must match published envelope, fan count, fan placement, shroud silhouette, exposed PCB/no-backplate configuration and port layout. Current generator is only an initial proxy: it establishes the asset hierarchy and scale convention, but the acceptance gate is not passed until fan placement, silhouette, PCB outline and bracket geometry are checked against orthogonal references or a physical sample.


## First-run technical audit — 2026-11-25

The first generated scene was run successfully by the project owner with Blender 4.3.2.

Observed v0.1 results:
- Blender scene opened and saved successfully.
- 39 mesh objects, 4 organizational collections and 39 objects carrying stable sbs_component_id properties.
- GLB v2 container and embedded glTF JSON validated; 39 nodes, 39 meshes and 10 exported materials; file length matched the GLB header.
- Manifest parsed as valid JSON and retained the SKU identity and evidence labels.
- The nominal envelope guide was slightly expanded by its applied wireframe modifier.
- The fan frame and opening guide were cylinders rather than hollow rings, so they could visually occlude the hub and blades. The blades were simple box proxies.
- The v0.1 scene had no explicit parent assembly nodes for grouped selection/exploded-view operations.
- The aggregate proxy bounds (202.53 × 44.70 × 110.46 mm) were not a card-thickness measurement. They included the guide and protruding fan/power-connector proxies.

Generator v0.2 is now committed as a refinement candidate:
- Fan frames are annular meshes; blades are swept polygon proxies rather than rectangular blocks.
- Fan assemblies and top-level subassemblies have explicit parent nodes and stable IDs.
- The envelope guide is an exact-size wire display, tagged reference_only, and excluded from GLB export.
- The manifest records derived proxy bounds separately and warns that the Y extent includes front/rear protrusions.
- GLB export requests node extras so component IDs and provenance can accompany the hierarchy.

Validation status: v0.1 was run by the project owner. v0.2 has been committed but still requires a local Blender 4.3.2 run and visual inspection. Do not treat the new fan profiles, blade count or assembly placement as exact product geometry.

- v0.2 writes version-suffixed `.blend`, `.glb` and manifest files so the validated v0.1 artifacts remain available for comparison.
