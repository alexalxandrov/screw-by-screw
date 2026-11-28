# OptiPlex 5060 Tower — procedural geometry v0.4

## Scope

The v0.4.0 package upgrades the GLB generator from one reusable cube mesh per material to one generated mesh per component proxy. It preserves all 137 semantic component IDs and the 145 typed relationships.

The current 58 geometry-bearing nodes are generated as:

| Primitive | Count | Use |
|---|---:|---|
| Box | 52 | Chassis panels, PCB, sockets, memory slots, PSU, fasteners and other proxy parts |
| Cylinder | 2 | Coin-cell battery and front power button |
| Fan | 3 | CPU cooler fan, system fan and PSU fan |
| Fin stack | 1 | CPU heatsink |

## Geometry contract

- **Box:** closed cuboid proxy.
- **Cylinder:** local-Y cylinder with selectable X/Y/Z axis orientation.
- **Fan:** segmented perimeter frame, generic swept blades and central hub.
- **Fin stack:** repeated parallel plates inside the existing illustrative component envelope.
- Every generated mesh remains attached to its original stable semantic component node through an untagged visual-proxy child. The helper carries the proxy mesh and its transform; semantic nodes retain identity transforms and the documented component hierarchy.
- Proxy translations and dimensions continue to use the existing model-space envelope. Keeping these transforms on visual children prevents parent transforms from being applied again to nested components. No source-backed fastener positions or unmeasured optional hardware were added.

Fan blade count and heatsink fin spacing are purely visual rendering parameters. They are not claims about the actual factory fan blade count, fin count, pitch, or exact heatsink construction.

## Validation

The OptiPlex workflow now runs dedicated Python tests for all primitive kinds, axis rotations, mesh/accessor bounds and rejection of invalid shape parameters. It then regenerates the GLB, checks semantic node bindings, builds the v0.4 portable package, verifies it with the production loader, and runs browser tests.

## Next geometry passes

1. Replace the remaining large box-only assemblies with evidence-bounded panel, grille, drive-cage and connector shapes.
2. Improve rear I/O openings and front-panel port geometry from the manufacturer callout/layout references.
3. Add individual storage carrier and latch meshes only where the family reference supports them.
4. Add a physical-sample configuration overlay only after a specific OptiPlex 5060 Tower configuration is identified.
5. Keep exact board revision, cable routing, optional population and all unmeasured dimensions explicitly unknown until supported.


## v0.4.1 update

The follow-on package adds generic folded-panel, drive-cage, vent-grille and typed I/O-port primitives. Dell 5060 now has selectable standard front/rear I/O proxies while preserving 137 semantic IDs and 145 typed relationships. Port counts are sourced, positions remain schematic, and optional modules remain unpopulated/unknown. See [the v0.4.1 geometry note](OPTIPLEX_PROCEDURAL_GEOMETRY_V041.md) and [the external I/O evidence audit](OPTIPLEX_5060_IO_GEOMETRY_EVIDENCE.md).
