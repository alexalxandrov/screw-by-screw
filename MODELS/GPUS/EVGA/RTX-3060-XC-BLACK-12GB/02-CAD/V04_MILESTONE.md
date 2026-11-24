# v0.4 milestone — validation and evidence gates

**Current source generator:** v0.3  
**v0.3 status:** owner-run technical acceptance reported on 2026-11-25  
**v0.4 focus:** reproducible package validation and photo-informed geometry preparation

## Accepted in v0.3

The owner supplied Blender 4.3.2 inspection output confirming:

- 44 scene objects, 37 meshes and 7 assembly empties;
- 44 unique IDs in the Blender scene;
- both fan frames, hubs and all blade pivots at configured world-space centres;
- proxy X/Z bounds within the nominal envelope;
- valid manifest JSON with SKU 12G-P5-3655-KR;
- valid GLB 2.0 with a JSON chunk and exact declared file length;
- 43 exported nodes with IDs matching the 43 non-reference manifest objects;
- expected assembly hierarchy retained in the export.

The optional Draco compression warning was non-fatal. The exported GLB was validated without Draco compression.

## New independent validator

Run `tools/modeling/validate_blockout_package.py` after each generation. It checks GLB container/chunk integrity, manifest identity, ID uniqueness and parity, scene metadata, and hierarchy index validity. See [BLOCKOUT_VALIDATION.md](BLOCKOUT_VALIDATION.md).

The validator is a structural gate only. It cannot replace visual review or physical measurements.

## Geometry priorities for v0.4

1. **External silhouette:** replace the five-rail shroud proxy with a contour reconstructed from permitted, near-orthogonal exact-SKU views. Keep the current proxy as a fallback.
2. **Fan placement:** measure fan centres from calibrated images using the known 201.8 mm card length as a scale reference. Record image, crop, calibration endpoints, pixel-to-mm ratio and uncertainty for each estimate.
3. **PCB outline:** reconstruct only the visible outline from exact-SKU rear/PCB views. Do not borrow the layout from 12G-P5-3657-KR or generic RTX 3060 boards.
4. **I/O bracket:** separate the bracket silhouette, port apertures and retention tab only when their locations are visible in reliable references.
5. **Cooling assembly:** model heatpipes and fin-stack shape only where the exact teardown supports their topology. Avoid invented pipe counts/routes.
6. **Fasteners:** inventory teardown-visible fasteners and removal order; add individual screw geometry only after count, head type and position are supported.
7. **PCB population:** retain GPU/memory/power blocks as candidates until exact-board evidence confirms package locations and identities.

## Evidence record required for every photo estimate

- exact SKU applicability;
- source URL and author/publisher;
- image/frame identifier or video timestamp;
- original image dimensions and crop coordinates;
- scale reference and calibration calculation;
- estimated dimension/coordinate and uncertainty;
- reviewer and review date;
- rights status; no copied source image in the repository unless cleared.

## Do not do yet

- Do not label the blockout CAD.
- Do not claim an exact board revision.
- Do not claim six memory packages or their locations as confirmed for this PCB.
- Do not model exact screw sequence or internal traces without evidence.
- Do not publish third-party photos/video frames without permission.
- Do not infer official thickness from the dual-slot label.

## Exit criteria

v0.4 is ready for a visual-fidelity review when the external contour, fan centres, PCB outline and I/O bracket are based on documented measurements/photo estimates with uncertainty, and every changed mesh retains stable component IDs. It is not ready for a manufacturing claim; that would require native/verified CAD or a fully measured physical sample and a separate engineering validation process.
