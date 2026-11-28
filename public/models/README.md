# Published local model packages

The public model library currently contains two validated packages:

| Catalogue model | Package | Model ID |
| --- | --- | --- |
| IBM Personal Computer 5150 (1981) | `ibm_pc_5150_1981.sbsmodel` | `computer.ibm.5150.1981` |
| Dell OptiPlex 5060 Tower family | `dell_optiplex_5060_tower_v04.sbsmodel` | `pc.dell.optiplex-5060-tower.family` |

Both packages are loaded by the same production `ModelPackageLoader`. The standalone `index.html` embeds every catalogue entry marked `published: true`, so quick model switching works in the browser and when the HTML file is opened directly with `file://`.

## IBM PC 5150 package

The IBM content sidecars and Blender generator are stored compressed in the source tree. The Blender blockout workflow restores them, generates the scene and GLB, validates semantic bindings and SHA-256 integrity, builds the portable package, runs browser tests, and commits the resulting package here. The workflow keeps the published IBM and Dell packages while removing temporary research build outputs.

The reference is scoped to the August 1981 launch-era system unit. It contains 71 semantic components and 100 relationships. Its geometry is explicitly `illustrative_proxy_not_cad`; it is not measured CAD. The service sequence is a source-backed branching FRU graph, not one universal linear teardown. The PSU is a sealed FRU, not a user-serviceable mains assembly. See `content/models/ibm-pc-5150-1981/README.md` and `docs/IBM_PC_5150_DISASSEMBLY_SEQUENCE.md`.

## Dell OptiPlex 5060 package

The family-level reference is packaged as a self-contained JSON-envelope `.sbsmodel`. It contains 137 semantic nodes and 145 relationships. The v0.4 scene uses 58 per-component meshes: 52 box proxies, two cylinders, three fan assemblies and one fin stack. Fan blade count and fin spacing are rendering choices, not sourced hardware specifications. Geometry remains illustrative, not CAD; the model identity is a platform family rather than a single SKU. See `content/models/dell-optiplex-5060-tower-family/`.

## Research archive

The EVGA RTX 3060 XC BLACK package remains in `content/models/evga-rtx3060-xc-black-12gb/` as an unpublished research archive. It is intentionally excluded from the public selector and standalone launcher until its exact PCB revision and physical service sequence meet the publication criteria in the catalogue.

## Build contract

The standalone builder fails when a catalogue entry marked `published: true` has no package under `public/models/`. This prevents a successful build from silently shipping a catalogue with missing offline models. Do not mark an entry as published until its package has passed the production loader and browser tests.
