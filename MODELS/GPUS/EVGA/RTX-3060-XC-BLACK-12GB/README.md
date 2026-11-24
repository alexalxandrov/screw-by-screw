- [BLOCKOUT_VALIDATION.md](02-CAD/BLOCKOUT_VALIDATION.md) — independent GLB/manifest validation.
- [V04_MILESTONE.md](02-CAD/V04_MILESTONE.md) — geometry and evidence gates.
# EVGA GeForce RTX 3060 XC BLACK GAMING 12GB

**First pilot model**

- Manufacturer: EVGA
- Product: GeForce RTX 3060 XC BLACK GAMING
- Part number: 12G-P5-3655-KR
- GPU: NVIDIA GeForce RTX 3060 (Ampere / GA106 family)
- Memory: 12GB GDDR6
- Content status: research / blockout pipeline
- Geometry status: v0.3 technically accepted; v0.4 candidate pending local Blender run; not CAD
- Rights status: not cleared for third-party media/assets

This package is specific to the XC BLACK SKU. Do not merge data from the distinct EVGA XC Gaming SKU (12G-P5-3657-KR) or other RTX 3060 boards without evidence of equivalence.

## Directory map

- 00-SOURCES/ — source register and rights notes.
- 01-REFERENCES/ — visual reference inventory; no copied media by default.
- 02-CAD/ — original CAD and imported assembly files, only when permitted; includes measurement ledger and geometry plan.
- 03-BOARDVIEW/ — BoardView, schematic and PCB evidence.
- 04-WORKING/ — editable Blender/FreeCAD working files.
- 05-EXPORT/ — optimized GLB and published data package.

## Current research and modeling package

- [model.json](model.json) — source-backed model identity and high-level specifications.
- [components.json](components.json) — preliminary component inventory; not a complete BOM.
- [sources.json](00-SOURCES/sources.json) — structured source and rights register.
- [REFERENCE_LOG.md](01-REFERENCES/REFERENCE_LOG.md) — visual observations and open questions.
- [GEOMETRY_PLAN.md](02-CAD/GEOMETRY_PLAN.md) — staged reconstruction plan.
- [Blockout generator](../../../../tools/modeling/build_rtx3060_xc_black_blockout.py) — procedural Blender scene generator.

## Generate the first blockout

From the repository root, with Blender installed:

```bash
blender --background --python tools/modeling/build_rtx3060_xc_black_blockout.py
```

By default, generated local artifacts are written to:
`MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/`

Optional arguments are passed after Blender's `--` separator:

```bash
blender --background --python tools/modeling/build_rtx3060_xc_black_blockout.py -- --output-dir /path/to/output
blender --background --python tools/modeling/build_rtx3060_xc_black_blockout.py -- --no-glb
```

The script produces a Blender scene, GLB export and JSON manifest unless disabled. Generated binaries are local working artifacts and are not committed by this script.

The current generator candidate is v0.4 and writes versioned artifacts:
- `rtx3060_xc_black_blockout_v04.blend`
- `rtx3060_xc_black_blockout_v03.glb`
- `rtx3060_xc_black_blockout_v03.manifest.json`

Earlier v0.1/v0.2/v0.3 outputs are retained locally for comparison. v0.4 retains a pre-export transform-integrity check for fan frames, hubs, blade pivots and the nominal X/Z footprint. The v0.3 baseline passed local generation and transform-integrity checks in Blender 4.3.2. The v0.4 candidate must be run locally before acceptance. An independent standard-library validator is available at [validate_blockout_package.py](../../../../tools/modeling/validate_blockout_package.py); run it using the command in [BLOCKOUT_VALIDATION.md](02-CAD/BLOCKOUT_VALIDATION.md). Product geometry remains illustrative and has not passed the external-fidelity gate.

## Text-first scene inspection

After generating the Blender scene, produce a readable inventory without screenshots:

```bash
blender MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v04.blend --background --python tools/modeling/inspect_blend_scene.py -- --output /tmp/sbs-inspection.txt --json-output /tmp/sbs-inspection.json
```

The report includes component IDs, parent IDs, world-space positions, dimensions, bounds, mesh counts and evidence labels. It is intended for text-only review.

**Accuracy warning:** the card length and height use manufacturer-published values; fan diameters are approximate reviewer measurements. Thickness, fan centres, shroud/PCB outlines and internal placements are illustrative or unknown. This asset is not suitable for manufacturing, fitment, repair or physical simulation.

## Required package files (future)

model.json, components.json, relationships.json, sources.json, assembly_steps.json, process_layers.json, and a release manifest.

See [GPU source audit](../../../../docs/GPU_SOURCE_AUDIT.md) and [content pipeline](../../../../docs/CONTENT_PIPELINE.md).
