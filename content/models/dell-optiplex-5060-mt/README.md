# Dell OptiPlex 5060 Tower — family-level model package

**Model ID:** `pc.dell.optiplex-5060-mt`  
**Regulatory type:** D18M005  
**Geometry status:** `illustrative_proxy_not_cad`  
**Package status:** research blockout

This package models the Dell OptiPlex 5060 Mini Tower family from the Tower service manual. It is deliberately **not** a customer-specific bill of materials. CPU, memory population, storage part numbers, WLAN options, optical drive and PSU variant remain configuration-dependent unless a source proves the exact option.

## Evidence policy

- Manufacturer service procedures and the screw table are recorded in `sources.json`.
- Fastener components represent individually addressable positions, not a claim that every optional screw is installed in every machine.
- Proxy geometry is a blockout for browser interaction. It is not CAD and must not be used for manufacturing, fitment or repair.
- Unknown dimensions, board revision and customer configuration remain unknown.
- Dell documents may be linked and cited; their manuals and illustrations are not copied into this repository.

## Build

```bash
blender --background --python tools/modeling/build_optiplex_5060_mt_blockout.py
python tools/content/validate_model_package.py content/models/dell-optiplex-5060-mt
python tools/content/build_release_manifest.py content/models/dell-optiplex-5060-mt
python tools/content/validate_model_package.py content/models/dell-optiplex-5060-mt
```

The Blender workflow creates the GLB and a `.sbsmodel` archive for viewer validation.
