# Content Production Pipeline

**Status:** proposed workflow for the first production model
**Pilot:** EVGA GeForce RTX 3060 XC BLACK GAMING 12GB (12G-P5-3655-KR)

## Principle

Never silently convert missing evidence into invented geometry or facts. Every asset and factual claim must have provenance, applicability, confidence/status, and licensing information. Geometry, semantic structure, and technical knowledge are separate artifacts linked by stable IDs.

## Pipeline

1. **Identify exact product.** Record manufacturer, product name, part number, memory configuration, and board/cooler revision only when known and sourced.
2. **Acquire evidence.** Collect permitted CAD, teardown material, specifications, photographs, PCB/BoardView files, schematics, datasheets, manuals, and technical articles. Preserve original files unchanged.
3. **Register provenance and rights.** Record URL, author/publisher, retrieval date, hash, license/terms, attribution, modification and redistribution permissions, and exact model/revision applicability. Unknown rights means do not publish the asset.
4. **Extract structure.** Import CAD assemblies where available and preserve hierarchy/transforms. For photos/video, create a human-reviewed inventory; do not infer hidden geometry from one image.
5. **Prepare geometry.** Use FreeCAD for CAD inspection and Blender Python for cleanup, naming, stable IDs, origins, materials, LODs, authored exploded positions, and GLB export. Keep source and derived geometry separate.
6. **Build semantic data.** Create component instances, definitions, parent-child relationships, typed connections, cards, and source-backed claims. Separate card-specific implementation from generic RTX 3060 architecture.
7. **Author interactions.** Prepare reversible exploded states and assembly steps. Add power, signal, thermal, and airflow layers only when evidence supports them.
8. **Validate.** Check identity, geometry, hierarchy, IDs, transforms, links, units, source coverage, licensing, accessibility, and browser performance.
9. **Publish versioned package.** Export GLB plus JSON data and manifest. Keep editable source files and provenance records.
10. **Maintain.** Record corrections, new revisions, source changes, and deprecations without overwriting provenance.

## Free toolchain

- FreeCAD: CAD inspection/import.
- Blender: geometry preparation, animation, optimization, export.
- Blender Python and Python: repeatable processing, metadata validation, hashes, manifest generation, document extraction/OCR where lawful.
- Three.js / React Three Fiber: browser viewer.
- Git: scripts, docs, schemas, manifests, and small cleared assets. Large binaries may need Git LFS or external storage; never commit unlicensed source assets.

AI can assist with document extraction, candidate identification, translation, and draft descriptions. Human review and cited evidence remain mandatory. No local LLM is a required dependency.

## RTX 3060 pilot stages

### Evidence inventory
- Confirm exact part number 12G-P5-3655-KR.
- Record PCB revision only from a physical sample or reliable source.
- Collect exact-model teardown, product specifications, independent PCB/cooler coverage, and reference views.
- Search for STEP/assembly CAD, PCB layout, BoardView, schematic, and datasheets. Record missing items explicitly.

### Structural model
Start with high-confidence assemblies: shroud/fan assembly, heatsink, PCB, backplate if present, GPU package, memory packages, power-delivery components, connectors, and fasteners. This is a candidate inventory, not a claim that every item is present. Final structure must match the selected variant and evidence.

### Semantic model
Attach stable IDs and cards. Separate physical instances from reusable component definitions; distinguish mechanical, electrical, and thermal relationships; distinguish generic GPU architecture from EVGA board implementation.

### Interactive package
First deliverable: GLB, component tree, selection, isolation, hide/show, exploded slider, reset, and source-linked cards. Add process layers only after review.

## Validation gates

- Exact product identity established.
- Every external asset has a documented permission basis.
- Every selectable scene node maps to a stable ID or is explicitly decorative.
- Parent-child relationships are valid and acyclic.
- Component references resolve; dimensions and units are declared.
- Exploded positions are authored and reversible.
- Claims have sources or are marked unknown/illustrative.
- Export opens in target browser and meets agreed performance limits.

## Deliverables

Immutable source archive and source register; rights register; normalized component inventory; editable Blender/FreeCAD files where permitted; components, relationships, claims and source JSON; assembly steps; process layers; optimized GLB; validation report; release manifest with version and hashes.

## Non-goals

No automatic invention of complete CAD from photographs, no claim of physically correct CFD/thermal/electrical simulation, no automatic screw-removal sequence without evidence, no paid AI dependency, and no full CMS before the pilot validates the data model.
