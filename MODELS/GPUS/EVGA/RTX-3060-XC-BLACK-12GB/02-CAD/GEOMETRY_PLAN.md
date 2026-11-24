# Geometry Reconstruction Plan

**Target:** EVGA GeForce RTX 3060 XC BLACK GAMING, 12G-P5-3655-KR  
**Status:** v0.4 candidate prepared; v0.3 is the last owner-accepted generator; no verified full CAD geometry.

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

The external blockout must match the published nominal reference dimensions, fan count, fan placement, shroud silhouette, exposed PCB/no-backplate configuration and port layout. The shroud may overhang the nominal 201.8 mm length; do not enforce that value as the maximum exterior X extent. Current generator is only an initial proxy: it establishes the asset hierarchy and scale convention, but the acceptance gate is not passed until fan placement, silhouette, PCB outline and bracket geometry are checked against orthogonal references or a physical sample.


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


## Second-run technical audit — v0.2 — 2026-11-25

The project owner ran v0.2 with Blender 4.3.2 and reported:
- 44 scene objects: 37 meshes and 7 assembly empties.
- All 44 objects had component IDs; 42 objects had parents.
- GLB v2 container was valid: 43 nodes, 36 meshes, 9 materials; all 43 nodes retained component IDs in glTF extras.
- The explicit fan and card assembly hierarchy exported.
- However, the annular fan frames and swept blade meshes were at world origin after parenting. Their world-space origins were reported as (0, 0, 0), while the fan hubs remained at their intended positions (55, -21.7, 56) and (146, -21.7, 56).
- Consequently, the ASCII front projection and aggregate bounds exposed geometry extending to X=-45 mm and Z=-45 mm. The earlier automated checks did not test world-space placement and therefore produced false-positive PASS results.

This is a transform-preservation bug in the helper used to parent newly linked mesh data-blocks. A corrected generator candidate v0.3 now:
- updates the dependency graph before parenting;
- preserves each child's explicit transform basis;
- sets matrix_parent_inverse from the evaluated parent world matrix;
- runs a pre-export transform-integrity check for both fan frames, hubs and each blade pivot;
- rejects generation rather than saving/exporting when the fan pivots are displaced or the lower X / vertical Z sanity bounds fail; the nominal length is not a hard upper bound for all exterior geometry;
- writes version-suffixed v0.3 artifacts, retaining v0.1 and v0.2 outputs.

**Validation status:** v0.3 is committed but not yet run in the project owner's Blender environment. The owner must run the generator and inspect the new world-space checks before v0.3 can be accepted. A passing geometric validation does not establish exact real-product geometry; fan layout, blade profile/count, thickness and internal placement remain illustrative.


## Third-run technical acceptance — v0.3 — 2026-11-25

The project owner ran generator v0.3 with Blender 4.3.2 and supplied the local inspection output.

### Confirmed in Blender
- 44 scene objects: 37 mesh objects and 7 assembly empties.
- All 44 scene objects carry component IDs; 42 objects participate in parent relationships.
- Both fan frame world positions match their configured centres: (55, -19.5, 56) mm and (146, -19.5, 56) mm.
- Both fan hubs match their configured world positions: (55, -21.7, 56) mm and (146, -21.7, 56) mm.
- All 14 blade pivots match their expected fan centres.
- Renderable proxy bounds remain within the nominal X/Z envelope: X = -0.5..201.8 mm, Z = 0..110 mm.
- Manifest parses as JSON, has schema 0.3.0, correct SKU 12G-P5-3655-KR, 44 objects, 44 unique component IDs and no duplicates.

### Confirmed in exported GLB
- Valid GLB 2.0 container; declared length equals the actual 153,800-byte file length.
- First JSON chunk exists and is 36,580 bytes.
- 43 nodes, 36 meshes and 9 materials.
- All 43 exported nodes carry component IDs in glTF extras.
- Exported component IDs exactly match the 43 non-reference IDs in the manifest: no missing or unexpected IDs.
- Seven expected assembly nodes preserve their child relationships: card root, cooling, two fans, PCB/electronics, connectors and shroud.
- Reference-only envelope guide is omitted from GLB.

### Acceptance decision
**v0.3 passes the technical generation, transform-integrity, manifest and GLB-structure checks in the owner's Blender 4.3.2 environment.** This establishes a functioning source-to-GLB pipeline and stable assembly/component identity.

This does **not** mean the product geometry is accurate. Fan centres, blade shape/count, overall thickness, shroud silhouette, PCB outline and internal component placement remain illustrative or unverified. The external/product-fidelity acceptance gate remains open pending calibrated references or physical measurements.

The optional Draco compression warning is non-fatal; the produced GLB was independently parsed and validated without Draco compression.


## Next modeling milestone — v0.4 photo-informed assemblies

With v0.3 technically accepted, the next version should improve the product silhouette and cooling topology without pretending that photo-estimated values are measured CAD.

### Priority 1 — External shroud
- Replace the five skeletal rails with a continuous fascia proxy and two circular fan apertures.
- Keep the central bridge and upper/lower branding areas as separate selectable children.
- Add simplified recessed/textured side zones based on the exact XC BLACK front reference.
- Keep fan openings at approximately 90 mm and impeller visual diameter at approximately 85 mm, with reviewer-measurement provenance.
- Exact fascia outline, bevels, fan centres and branding geometry remain photo-estimates.

### Priority 2 — PCB silhouette and fastener locations
- Replace the plain rectangular PCB proxy with a shaped board outline and the large ventilation cutout visible in the exact-SKU rear photo.
- Represent the four central heatsink mounting locations as separate screw proxies, preserving the locations as photo-estimates.
- Do not invent reference designators, pad locations, board revision or component values.

### Priority 3 — Cooling assembly
- Replace the solid heatsink block with separately selectable fin plates aligned to the side-profile photograph.
- Add distinct copper heatpipe proxy paths and keep their count/routing labelled illustrative until a teardown view provides a defensible count.
- Keep the copper GPU/memory contact plate a distinct component.
- Add two fan-header/lead proxies near the side shown in the reference photograph; do not infer pinout.

### Priority 4 — I/O and power details
- Replace the flat I/O panel with a ventilated bracket proxy featuring three DisplayPort openings and one HDMI opening.
- Replace the power-port cube with a receptacle proxy exposing the 2×4 contact arrangement.
- Keep exact port cutout dimensions and connector placement as photo-estimates.

### Acceptance criteria for v0.4
- No parent operation may change a child's world-space placement.
- Every selectable part and assembly has a unique stable component ID.
- All generated renderable mesh bounds remain near the documented nominal envelope, with explicitly recorded protrusions.
- The fascia visibly has two open fan apertures; fan blades remain visible through them.
- Heatsink fins are independently selectable; heatpipe and fan-cable proxies are separate.
- PCB airflow cutout and four fastener proxies exist as separate, provenance-labelled parts.
- GLB node extras exactly match the exported manifest IDs.
- Blender 4.3.2 generation and GLB parse test must pass before accepting the version.

The v0.4 candidate retains versioned outputs and must not overwrite v0.3 artifacts. The owner must run the candidate in Blender 4.3.2 and return the text inspection report before acceptance.
