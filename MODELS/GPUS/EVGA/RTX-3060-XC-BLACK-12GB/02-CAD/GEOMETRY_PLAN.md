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
