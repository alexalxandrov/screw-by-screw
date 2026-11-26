# EVGA GeForce RTX 3060 XC BLACK GAMING 12GB

**First pilot model**

- Manufacturer: EVGA
- Product: GeForce RTX 3060 XC BLACK GAMING
- Part number: 12G-P5-3655-KR
- GPU: NVIDIA GeForce RTX 3060 (Ampere / GA106 family)
- Memory: 12GB GDDR6
- Content status: source-linked v0.6 deep-atlas development branch; canonical package is maintained at [`content/models/evga-rtx3060-xc-black-12gb`](../../../../content/models/evga-rtx3060-xc-black-12gb/)
- Geometry status: Blender 4.3.2 v0.5 generator and GLB/SBS integration validated in earlier CI runs; latest HEAD is waiting for GitHub-hosted runner assignment; still illustrative proxy, not CAD
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
- [MEASUREMENTS.csv](02-CAD/MEASUREMENTS.csv) — evidence-ranked dimensions and unresolved measurements.
- [BLOCKOUT_VALIDATION.md](02-CAD/BLOCKOUT_VALIDATION.md) — independent GLB/manifest validation.
- [V04_MILESTONE.md](02-CAD/V04_MILESTONE.md) — geometry and evidence gates.
- [V05_RELEASE_HARDENING.md](02-CAD/V05_RELEASE_HARDENING.md) — validation and release hardening.
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

The current Blender generator writes versioned v0.5 artifacts:
- `rtx3060_xc_black_blockout_v05.blend`
- `rtx3060_xc_black_blockout_v05.glb`
- `rtx3060_xc_black_blockout_v05.manifest.json`

Earlier v0.1/v0.2/v0.3 outputs are retained locally for comparison. v0.5 retains the fan-frame, hub and blade-pivot transform checks. The X-axis gate no longer incorrectly treats 201.8 mm as the maximum outer-shroud length; the vertical bounds remain a proxy sanity check. Earlier CI runs validated Blender generation, GLB and manifest integrity, portable SBS packaging, browser import and the viewer test suite. The latest HEAD's Actions jobs have not started because GitHub has not assigned a hosted runner (`runner_id: 0`, no steps/logs); do not interpret those attempts as passing current-head validation. Visual fidelity still requires review against an exact physical sample or calibrated references. An independent standard-library validator is available at [validate_blockout_package.py](../../../../tools/modeling/validate_blockout_package.py); run it using the command in [BLOCKOUT_VALIDATION.md](02-CAD/BLOCKOUT_VALIDATION.md). Product geometry remains illustrative and has not passed the external-fidelity gate.

## Text-first scene inspection

After generating the Blender scene, produce a readable inventory without screenshots:

```bash
blender MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.blend --background --python tools/modeling/inspect_blend_scene.py -- --output /tmp/sbs-inspection.txt --json-output /tmp/sbs-inspection.json
```

The report includes component IDs, parent IDs, world-space positions, dimensions, bounds, mesh counts and evidence labels. It is intended for text-only review.

**Accuracy warning:** the card length and height use manufacturer-published values; fan diameters are approximate reviewer measurements. Thickness, fan centres, shroud/PCB outlines and internal placements are illustrative or unknown. This asset is not suitable for manufacturing, fitment, repair or physical simulation.

## Canonical package and remaining evidence gates

The current canonical package is linked above and contains 313 semantic components, 312 typed relationships, 110 atomic claims and 29 registered sources, plus five partial teardown observations and two educational clips. It remains a starter engineering atlas, not a complete BOM or complete service manual. Exact PCB revision, matching BoardView/schematic, component reference designators and calibrated mechanical dimensions remain unverified. Heatpipe sources use different counting conventions (six route/runs, four copper heatpipes, or two central tube paths); the unique physical closed-loop count is unresolved. Eight visible blade surfaces per fan are counted from two exact-SKU listing photographs; blade profile remains proxy geometry. Original OEM fan part number is unknown; aftermarket listings are compatibility leads only.

See [GPU source audit](../../../../docs/GPU_SOURCE_AUDIT.md) and [content pipeline](../../../../docs/CONTENT_PIPELINE.md).


### GA106 compute architecture extension

The canonical content package has 28 logical SM nodes and a calculated 14-TPC aggregate. Each SM's GA10x logical resource description is evidence-backed by NVIDIA's Ampere whitepaper; the instance numbers are navigation labels only and are not physical die coordinates. No GA106 GPC layout is inferred.
