# Geometry Reconstruction Plan

**Target:** EVGA GeForce RTX 3060 XC BLACK GAMING, 12G-P5-3655-KR  
**Status:** plan only; no geometry has been created.

## Modeling strategy

Build a dimensionally anchored blockout first, then replace approximations with verified geometry. Do not begin with detailed PCB components.

### Stage A — external envelope
- Card envelope: 201.8 mm nominal length × 110 mm height; dual-slot.
- PCIe edge and I/O bracket.
- Shroud outline and fan openings.
- Two fan assemblies.
- No backplate.

Keep PCB and shroud lengths separate because the shroud may overhang the PCB.

### Stage B — cooling assembly
- Aluminum fin stack.
- Copper GPU contact plate.
- Heat pipes.
- Fan frames, hubs and blades.
- Thermal pads as simplified visual elements, marked illustrative unless dimensions are sourced.

### Stage C — PCB blockout
- PCB outline and thickness from orthogonal photographs or physical measurement.
- GPU package location.
- Six memory-package candidates only after exact-board count/location confirmation.
- Power-delivery region as block geometry until components are identified.
- I/O connectors, fan headers and power connector.

### Stage D — component-level fidelity
- Add exact package dimensions and reference designators from verified BoardView/BOM/schematic or direct inspection.
- Model fasteners only after count, location and dimensions are verified.
- Add traces, vias and solder details only if they support learning; avoid false precision.

## Coordinate and scale convention

- Units: millimetres in source CAD/Blender scene.
- Define one project coordinate convention before detailed modeling.
- Preserve separate source and derived scenes.
- Every selectable object receives a stable component instance ID.
- Maintain a measurement ledger with value, source, method, uncertainty and reviewer.

## Accuracy labels

- measured: measured from physical sample.
- manufacturer_data: manufacturer-published dimension.
- reviewer_measurement: measured by a cited reviewer.
- photo_estimate: estimated from calibrated photographs.
- illustrative: visual stand-in, not exact geometry.
- unknown: no defensible value.

## First geometry acceptance gate

The external blockout must match published envelope, fan count, fan placement, shroud silhouette, exposed PCB/no-backplate configuration and port layout. It must not imply a complete internal CAD assembly.
