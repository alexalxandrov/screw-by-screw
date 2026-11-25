# SBS Model Package Format

## Purpose

A `.sbsmodel` file is a portable ZIP container that binds one self-contained GLB scene to the metadata needed by the Screw by Screw viewer. It is the normal interchange format for a complete interactive device model. A plain `.glb` remains supported for geometry-only inspection.

## Archive layout

```text
device.sbsmodel
├── sbs-model.json       # archive manifest, schema version and SHA-256 checksums
├── scene.glb            # self-contained glTF 2.0 binary scene
├── model.json           # device identity, units, geometry/evidence status
├── model-package.json   # source package manifest
├── components.json      # stable component IDs, hierarchy and localized labels
├── sources.json         # evidence/source register
├── relationships.json  # typed component relationships
├── claims.json          # source-backed factual claims
├── process_layers.json  # qualitative or measured system layers
├── assembly_steps.json  # reviewed disassembly/reassembly procedure
├── learning.json        # lessons and quiz questions
├── animations.json      # authored motion clips
└── release.json         # release metadata and included file list
```

The archive root manifest uses format `sbs-model`, schema version `1.0.0`, a stable `model_id`, a file map and SHA-256 hashes. Sidecars reference one another only through stable IDs. Component IDs in the GLB are stored in node extras as `sbs_component_id`.

## Open in the browser

1. Open the Screw by Screw site.
2. Choose **Open model**.
3. Select a `.sbsmodel` archive.
4. The viewer checks the ZIP directory, archive paths, file sizes, checksums, JSON schemas and cross-file references before loading the GLB.

Plain `.glb` files can also be opened. They are treated as geometry-only imports: no model-specific component cards, source links, process layers or lessons are inferred from a filename.

## Build a package locally

After generating the Blender GLB, run from the repository root:

```bash
python tools/modeling/package_model.py \
  --model-dir content/models/evga-rtx3060-xc-black-12gb \
  --scene MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v04.glb \
  --output /tmp/rtx3060_xc_black_v04.sbsmodel
```

The packager writes a deterministic archive, includes the source manifest and release metadata, and calculates SHA-256 hashes for every payload file. It rejects an invalid or externally linked GLB.

## Security and resource limits

- ZIP only; ZIP64 and multi-disk archives are not supported in this format version.
- Maximum compressed package: 512 MiB.
- Maximum expanded package: 512 MiB.
- Maximum individual entry / GLB: 256 MiB.
- Maximum entries: 128.
- No encrypted entries, symbolic links, duplicate paths, path traversal or absolute paths.
- Only stored and deflate ZIP entries are accepted.
- External GLB buffer/image URIs are rejected; resources must be embedded.
- SHA-256 checksums are verified with Web Crypto when present in the archive manifest.
- Package JSON is untrusted input and is validated before model metadata is applied.

## Accuracy policy

Geometry fidelity and evidence status are explicit package data. A visually smooth model is not automatically CAD-accurate. Unknown dimensions, PCB revisions, component populations and mechanical procedures must remain unknown until supported by a source or measurement. Viewer explode animation is a presentation control, not an asserted physical removal sequence.

## Current status

The first package manifest is authored for EVGA GeForce RTX 3060 XC BLACK GAMING 12GB, part number `12G-P5-3655-KR`. The browser loader and package builder are implemented; automated tests cover archive validation and import. The generated `.sbsmodel` artifact is produced by the Blender CI workflow.


## Catalogue package binding

A catalogue entry has its own stable catalogue ID and a `package_model_id` reference to the archive's internal `model_id`. The viewer verifies that binding before loading. The catalogue cannot bypass manifest, file-path, SHA-256, cross-reference or GLB node-binding validation.
