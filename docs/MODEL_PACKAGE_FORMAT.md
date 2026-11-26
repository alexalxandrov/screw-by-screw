# SBS Model Package Format

## Purpose

A `.sbsmodel` file is a portable, versioned container that binds one self-contained GLB scene to the metadata needed by the Screw by Screw viewer. Two transport encodings are supported: the legacy ZIP container and the UTF-8 `SBSMODEL-JSON` envelope. Both resolve to the same manifest, payload file map and SHA-256 integrity contract. A plain `.glb` remains supported for geometry-only inspection.

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

The ZIP archive root manifest uses format `sbs-model`, schema version `1.0.0`, a stable `model_id`, a file map and SHA-256 hashes. Sidecars reference one another only through stable IDs. Component IDs in the GLB are stored in node extras as `sbs_component_id`.

### UTF-8 JSON envelope

The JSON transport starts with the exact ASCII prefix `SBSMODEL-JSON` followed by a newline. The remainder is one UTF-8 JSON object:

```json
{
  "format": "sbs-model-json",
  "schema_version": "1.0.0",
  "manifest": {
    "format": "sbs-model",
    "schema_version": "1.0.0",
    "model_id": "example.device",
    "package_version": "0.1.0",
    "status": "research_blockout",
    "files": {
      "model": "model.json",
      "scene": "scene.glb",
      "components": "components.json",
      "sources": "sources.json",
      "relationships": "relationships.json",
      "claims": "claims.json",
      "process_layers": "process_layers.json",
      "assembly_steps": "assembly_steps.json",
      "learning": "learning.json",
      "animations": "animations.json",
      "release": "release.json"
    },
    "sha256": {
      "model.json": "<64 lowercase hexadecimal characters>",
      "scene.glb": "<64 lowercase hexadecimal characters>"
    }
  },
  "files": {
    "model.json": "{\\n  ...\\n}\\n",
    "components.json": "{\\n  ...\\n}\\n",
    "scene.glb": "<base64-encoded GLB bytes>"
  }
}
```

The example abbreviates the `files` and `sha256` maps; production packages include every path referenced by `manifest.files`, and a checksum for every payload. Sidecar values are their original UTF-8 text, preserved exactly. Only `scene.glb` is base64-encoded; its SHA-256 is calculated over the decoded GLB bytes, not the base64 text. The `manifest.files` map is the same logical map used by the ZIP root manifest. There is no separate `sbs-model.json` entry in the JSON envelope because its contents are carried in `manifest`.

The JSON envelope is useful for text-only repositories and APIs that do not preserve binary attachments cleanly. It does not change model semantics, IDs, sidecar schemas or loader validation.

## Open in the browser

1. Open the Screw by Screw site.
2. Choose **Open model**.
3. Select a `.sbsmodel` archive.
4. The viewer identifies the transport encoding, then checks archive/envelope paths, entry count, size limits, checksums, JSON schemas and cross-file references before loading the GLB.

Plain `.glb` files can also be opened. They are treated as geometry-only imports: no model-specific component cards, source links, process layers or lessons are inferred from a filename.

## Build a package locally

After generating the Blender GLB, run from the repository root:

```bash
python tools/modeling/package_model.py \
  --model-dir content/models/evga-rtx3060-xc-black-12gb \
  --scene MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB/04-WORKING/generated/rtx3060_xc_black_blockout_v04.glb \
  --output /tmp/rtx3060_xc_black_v04.sbsmodel
```

The ZIP packager writes a deterministic archive, includes release metadata and calculates SHA-256 hashes for every payload file. It rejects an invalid or externally linked GLB.

To generate the text envelope from the same sidecars and a regenerated GLB, use:

```bash
python tools/modeling/build_text_model_package.py \\
  --model-dir content/models/dell-optiplex-5060-tower-family \\
  --scene /tmp/optiplex-5060-family.glb \\
  --output /tmp/optiplex-5060-family.sbsmodel
```

For reproducibility checks, add `--compare-existing path/to/committed.sbsmodel`. The comparison requires exact UTF-8 sidecar content and SHA-256 matches, structurally equal GLB JSON scene graphs, byte-identical GLB binary geometry chunks, and valid full-GLB checksums. Equivalent JSON number spellings such as `1` and `1.0` are intentionally treated as the same scene graph.

## Security and resource limits

- Maximum raw `.sbsmodel` input: 512 MiB for either transport.
- Maximum combined decoded/expanded payload: 512 MiB.
- Maximum GLB: 256 MiB; JSON-envelope base64 length is checked before decoding.
- Maximum payload entries: 128.
- ZIP transport: ZIP64 and multi-disk archives are not supported; only stored and deflate entries are accepted.
- No encrypted ZIP entries, symbolic links, duplicate paths, path traversal, drive-letter paths or absolute paths.
- ZIP sidecar paths and text-builder source paths are validated; the text builder rejects symlink escapes from the model directory.
- External GLB buffer/image URIs are rejected; resources must be embedded.
- SHA-256 checksums are verified with Web Crypto against decoded payload bytes.
- Package JSON is untrusted input and is validated before model metadata is applied.

## Accuracy policy

Geometry fidelity and evidence status are explicit package data. A visually smooth model is not automatically CAD-accurate. Unknown dimensions, PCB revisions, component populations and mechanical procedures must remain unknown until supported by a source or measurement. Viewer explode animation is a presentation control, not an asserted physical removal sequence.

## Current status

The first package manifest is authored for EVGA GeForce RTX 3060 XC BLACK GAMING 12GB, part number `12G-P5-3655-KR`. The browser loader and package builder are implemented; automated tests cover archive validation and import. The generated `.sbsmodel` artifact is produced by the Blender CI workflow.


## Catalogue package binding

A catalogue entry has its own stable catalogue ID and a `package_model_id` reference to the archive's internal `model_id`. The viewer verifies that binding before loading. The catalogue cannot bypass manifest, file-path, SHA-256, cross-reference or GLB node-binding validation.
