# Local model assets

The generated Blender scene, GLB and portable `.sbsmodel` archive are build artifacts and are intentionally not committed by default.

The catalogue entry expects this exact package path:

`public/models/rtx3060_xc_black_v05.sbsmodel`

The release workflow creates that archive from the current Blender scene, validates its GLB node/component bindings, refreshes the content SHA-256 manifest, and stages the archive before building the standalone viewer. The standalone HTML builder then embeds any staged catalogue package as a data URL, so `index.html` can open it with `file://` and no server.

## Rebuild locally

Run these commands from the repository root with Blender 4.3.2, Python and the locked Node dependencies installed:

```bash
blender --background --factory-startup --python-exit-code 1 --python tools/modeling/build_rtx3060_xc_black_blockout.py

python tools/modeling/validate_blockout_package.py \
  --manifest MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.manifest.json \
  --glb MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.glb

python tools/content/validate_glb_bindings.py \
  --components content/models/evga-rtx3060-xc-black-12gb/components.json \
  --glb MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.glb

python tools/content/build_release_manifest.py content/models/evga-rtx3060-xc-black-12gb

mkdir -p public/models
python tools/modeling/package_model.py \
  --model-dir content/models/evga-rtx3060-xc-black-12gb \
  --scene MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v05.glb \
  --output public/models/rtx3060_xc_black_v05.sbsmodel

npm ci
npm run build
```

The resulting root `index.html` is self-contained and embeds the staged archive. Do not substitute the old v0.4 GLB path: the current catalogue entry resolves the v0.5 `.sbsmodel` package.

All geometry remains labelled `illustrative_proxy_not_cad`; the package is an educational research blockout, not manufacturing or repair CAD.
