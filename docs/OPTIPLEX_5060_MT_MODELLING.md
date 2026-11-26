# Dell OptiPlex 5060 Tower — modelling generator

The Blender blockout is generated from the canonical `components.json` inventory. Geometry hints are expressed in millimetres; the script converts them to Blender metres and exports a self-contained GLB with stable `sbs_component_id` extras.

```bash
blender --background --factory-startup --python tools/modeling/build_optiplex_5060_mt_blockout.py
python tools/content/build_release_manifest.py content/models/dell-optiplex-5060-mt
python tools/content/validate_model_package.py content/models/dell-optiplex-5060-mt
```

The generated `.blend`, `.glb` and `.sbsmodel` are CI artifacts. This first generator deliberately produces an inspectable proxy blockout, not measured CAD.
