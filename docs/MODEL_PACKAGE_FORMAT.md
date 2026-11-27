# SBS Model Package Format

## Purpose

A `.sbsmodel` file is a portable package that binds one self-contained GLB scene to the metadata needed by the Screw by Screw viewer. Two transports are supported: a ZIP container with a root manifest, and a checksummed UTF-8 JSON envelope for reproducible text-based packages. A plain `.glb` remains supported for geometry-only inspection.

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

## JSON-envelope transport

A text-based package starts with the exact UTF-8 prefix `SBSMODEL-JSON\n`, followed by one JSON object:

- `format`: `sbs-model-json`;
- `schema_version`: `1.0.0`;
- `manifest`: the same logical package manifest used by ZIP transport;
- `files`: a map of safe relative paths to UTF-8 sidecar strings, with `scene.glb` encoded as base64.

The browser decodes the envelope, enforces the same maximum entry count and expanded-size limits as ZIP transport, validates safe paths and verifies the manifest SHA-256 checksums before parsing the sidecars or loading the GLB. The JSON envelope does not weaken archive validation; it changes only the outer transport.

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

- ZIP transport: ZIP64 and multi-disk archives are not supported in this format version.
- JSON-envelope transport: UTF-8 JSON after the `SBSMODEL-JSON\n` prefix; GLB is base64-encoded.
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

The IBM PC 5150 reference package uses the ZIP transport. The Dell OptiPlex 5060 Tower family v0.3 package uses the checksummed JSON-envelope transport and identifies a platform family without inventing a part number. Both transports use the same browser validator. The RTX 3060 package remains a source-controlled unpublished archive.


## Catalogue package binding

A catalogue entry has its own stable catalogue ID and a `package_model_id` reference to the archive's internal `model_id`. The viewer verifies that binding before loading. The catalogue cannot bypass manifest, file-path, SHA-256, cross-reference or GLB node-binding validation.
