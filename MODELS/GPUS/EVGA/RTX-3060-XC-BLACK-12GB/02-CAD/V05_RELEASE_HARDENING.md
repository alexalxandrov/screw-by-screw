# v0.5 — release hardening and text-first inspection

**Branch:** `work/release-hardening-v05`  
**Base generator:** v0.5 candidate  
**Release status:** engineering candidate; not a public 1.0 release

## Changes

- Hardened GLB parsing: chunk alignment, exact JSON-chunk count, BIN-chunk position/count, root JSON type and container boundaries.
- Hardened glTF graph validation: child/root/mesh index bounds, integer-only indices, duplicate children/roots, multiple parents and cycles.
- Hardened manifest validation: malformed object entries now produce explicit validation errors rather than incidental Python exceptions.
- Added a Blender-side text/JSON inspector for component IDs, hierarchy, evidence labels, world transforms, mesh counts and derived bounds.
- Added CI compilation of both modeling utilities and expanded unit tests.
- Fixed the model README's literal escaped-newline defect.
- Corrected the geometry sanity gate: the 201.8 mm manufacturer value is a nominal length, not a confirmed maximum outer-shroud extent. The generator no longer rejects positive X overhang solely for exceeding 201.8 mm.

## v0.4 geometry candidate

The generator now uses separately selectable fin-plate proxies rather than one solid heatsink block. Their count, pitch and dimensions are illustrative. They must not be represented as a confirmed physical fin count or as measured CAD.

No arbitrary shroud overhang has been invented. LanOC reports that the shroud extends slightly beyond the nominal 201.8 mm length but does not quantify the overhang. The overall outer length remains unknown until calibrated image measurement or a physical sample is available.

## Automated checks

GitHub Actions compiles:
- `tools/modeling/validate_blockout_package.py`
- `tools/modeling/inspect_blend_scene.py`

It runs:
- `python -m unittest discover -s tests -v`

The validator tests are independent of Blender. The scene inspector requires Blender and is compiled in CI but still requires a local Blender run against the generated .blend file.

## Owner-side acceptance commands

From the repository root:

```bash
python -m py_compile tools/modeling/validate_blockout_package.py tools/modeling/inspect_blend_scene.py
python -m unittest discover -s tests -v

blender --background --python tools/modeling/build_rtx3060_xc_black_blockout.py

blender MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.blend --background --python tools/modeling/inspect_blend_scene.py -- --output /tmp/sbs-inspection.txt --json-output /tmp/sbs-inspection.json

python tools/modeling/validate_blockout_package.py \
  --manifest MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.manifest.json \
  --glb MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.glb
```

The inspection report must show no missing or duplicate component IDs. The package validator must return `RESULT: PASS`. The output must still be labelled `illustrative_proxy_not_cad`.

## v0.5 process and geometry additions

- Added a selectable heatpipe assembly. Its presence is teardown-supported, while the generated count, path and diameter remain illustrative.
- Added a selectable power-conversion zone made of unnumbered proxy objects. It must not be read as an exact VRM phase layout.
- Repositioned the six Samsung K4ZAF325BM-HC16 memory packages around the GPU based on exact-model teardown photography. Locations are image-estimated, not measured.
- Expanded the copper contact proxy to visually cover the GPU and memory area, matching the reviewed cooler construction; exact plate dimensions are still unmeasured.
- Added a viewer-only operating state: fan rotation plus qualitative airflow and power-path particles, with a speed control and reduced-motion handling.
- All moving paths are explicitly schematic; no CFD, SPICE, pin mapping or measured fan rpm is claimed.
- v0.5 exports 84 Blender objects: 74 meshes and 10 assembly nodes. All 83 non-reference GLB nodes have unique IDs; 22 are canonical content components and the remaining IDs label unverified proxy geometry.

## Remaining release blockers

1. Run v0.5 in Blender 4.3.2 and return the text inspection output.
2. Review the generated GLB visually in the browser or Blender; structural validation is not visual validation.
3. Measure fan centres, shroud outline, PCB outline, bracket openings and cooling details from calibrated exact-SKU views or a physical card.
4. Identify the PCB silkscreen/revision before adding board-specific IC locations, reference designators or electrical traces.
5. Build the actual interactive viewer and validate picking, exploded view, reassembly and bilingual component cards.
6. Add package schemas, source/provenance validation, accessibility and browser performance checks.

## 1.0 release rule

Do not mark 1.0 because the version string says 1.0. Release 1.0 only when the model package is reproducible, the viewer's core interactions pass, all visible claims have provenance/confidence labels, automated checks pass, and the remaining limitations are explicitly documented. Manufacturing or repair accuracy is out of scope unless a measured/verified CAD source and separate engineering validation are obtained.
