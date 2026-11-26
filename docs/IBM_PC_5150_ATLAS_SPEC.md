# IBM PC 5150 system-unit atlas — implementation specification

## Goal

Add a second deeply navigable reference device to Screw by Screw: the original IBM Personal Computer 5150 system unit, restricted to the August 1981 launch-era configuration. Keep the existing EVGA RTX 3060 as the default catalogue package.

## Data contract

- Stable model ID: `computer.ibm.5150.1981`
- Package ID: `computer.ibm.5150.1981`
- Package format: `sbs-model`, schema 1.0.0
- Draft package version: `0.1.0-draft`
- Geometry state: `illustrative_proxy_not_cad`
- 71 canonical components, 100 typed relationships, 21 source-linked claims
- Five process layers, 12 bilingual learning questions, five partial FRU procedures, two explanatory animations
- Each canonical component must resolve to one GLB anchor with `extras.sbs_component_id`; parent hierarchy must remain stable.

## Reference baseline

The original launch baseline is 16 KB RAM with no installed diskette drive. Model two empty drive positions, five empty expansion sockets and an unpopulated 8087 socket. Keep later 5150 motherboard revisions, later 220/240 Vac supply variants, and the IBM PC/XT 5160 outside this package.

The first-edition IBM technical reference is the primary authority for the hardware architecture and electrical ratings. Figure 4 (printed p. 2-13) informs relative board-component zones only; it is not a dimensioned placement drawing. The first-edition IBM Hardware Maintenance and Service manual is the primary authority for documented FRU removal. The IBM corporate history is used for the launch date and retail baseline.

## Geometry and safety

The Blender generator creates a navigable proxy blockout, not measured CAD. The approximate 8.5 × 11 inch system-board outline is source-backed. The FAU Informatics Collection catalogues one 1981 specimen at 494 × 410 × 140 mm; the pictured specimen has CGA and memory expansion, so this is a secondary reference envelope for that specimen, not an IBM-wide case specification or serial-matched launch measurement. Board placement now follows the relative zones in IBM Figure 4 (slots left/upper-left; J6/J7 upper-right; P1/P2 right; P3/P4 lower edge; ROM upper-middle; RAM lower-left; CPU/8087 right), but all coordinates, footprints and spacing remain proxies because the figure is not dimensioned. The system-board service sequence in the August 1981 IBM manual identifies one mounting screw, then a slide of approximately 1/2 inch away from the PSU to release plural standoffs from their slots. The manual does not specify the standoff count or coordinates. Four visible stand-off/slot markers in the blockout are display placeholders only. A later PCWorld report of two screws and four plastic standoffs on another used, revision-unmatched unit is not applied to this launch-era reference. Board holes, sheet-metal folds, screw head standard, dimensions, thread, torque and fastener coordinates remain proxy or unknown.

Represent the PSU as a sealed field-replaceable unit. Never model the hazardous internal mains circuitry as a user-serviceable subsystem. Procedures must be labelled partial/conditional source sequences and must not be presented as a complete teardown.

## Build and acceptance

1. Decompress the individually stored `.json.gz` content sidecars.
2. Run the IBM Blender scene generator using Blender 4.3.2.
3. Validate the semantic package, release hashes, component hierarchy, and 1:1 GLB component-anchor coverage.
4. Build the portable `.sbsmodel` package and load it through the existing `ModelPackageLoader`.
5. Verify model ID, 71 components, 100 relationships, and package integrity.
6. Include both the GPU default package and IBM reference package in the standalone offline catalogue build.

See [IBM PC 5150 fastener and board-mounting evidence audit](IBM_PC_5150_FASTENER_EVIDENCE.md) for the source-by-source screw and standoff matrix.\n\n## Explicit non-goals

No claim of exact physical restoration, no guessed screw specifications, no complete teardown ordering, no PSU repair instructions, and no redistribution of copyrighted manuals or photographs.
