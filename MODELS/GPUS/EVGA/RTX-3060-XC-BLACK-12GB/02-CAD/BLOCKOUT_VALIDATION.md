# Blockout package validation

**Target:** EVGA GeForce RTX 3060 XC BLACK GAMING 12GB  
**SKU:** 12G-P5-3655-KR  
**Validator:** `tools/modeling/validate_blockout_package.py`

## Purpose

The validator independently parses the exported GLB container and embedded glTF JSON, then compares exported node IDs with the Blender generator's manifest. It is deliberately separate from Blender, so it can run on a machine that has Python but does not have Blender installed.

It checks:

- GLB magic, version, declared byte length and chunk boundaries;
- presence and validity of the first JSON chunk;
- glTF 2.0 asset metadata and default scene;
- stable component IDs on every exported node;
- exact equality between exported IDs and non-reference manifest IDs;
- uniqueness of IDs and validity of child-node indices;
- explicit non-CAD / illustrative geometry status.

## Run

After generating v0.3 with Blender:

```bash
python tools/modeling/validate_blockout_package.py \
  --manifest MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v03.manifest.json \
  --glb MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v03.glb
```

The script uses only the Python standard library. A non-zero exit status means a structural check failed.

## Validation boundaries

A PASS means the package is internally consistent. It does **not** verify:

- visual resemblance to the physical card;
- fan centre positions or blade profile against photographs;
- dimensions beyond the values explicitly recorded in the manifest;
- PCB outline, component placement, screw locations or hidden geometry;
- physical fit, manufacturability, thermal performance or electrical correctness.

Visual inspection against permitted exact-SKU references and physical measurements remain separate acceptance gates. Never promote illustrative geometry to measured geometry solely because this validator passes.
