# Multi-model library architecture

The catalogue is the index; each physical device family or exact SKU is a separately versioned `.sbsmodel` content package.

## Current content classes

- Graphics cards: exact EVGA GeForce RTX 3060 XC BLACK GAMING 12GB SKU.
- Desktop computers: Dell OptiPlex 5060 Tower family-level service-manual reconstruction.

## Separation of concerns

1. **Catalogue entry** — stable catalogue ID, category, manufacturer, searchable names/tags, package version and relative package path.
2. **Device package** — identity, variant scope, units, sources, claims, component instances, relationships, process layers, assembly steps and lessons.
3. **Reusable viewer** — GLB loading, camera, selection, component hierarchy, evidence cards, exploded view, measurements and interaction runtime.
4. **Geometry assets** — generated independently per package and linked to semantic components by stable IDs.

The catalog adapter and package loader already accept multiple categories and versioned packages. A model switch is performed through the generic catalogue/package-loading path. Device-specific imports remain only as the initial fallback package; they are not the model-selection contract.

## Rules for scaling

- Never reuse a device instance ID for a different product or revision.
- Distinguish a reusable component definition from each physical instance, especially repeated screws, fans, DIMMs and drives.
- Optional modules must carry a configuration status and cannot silently become standard equipment.
- Cross-package components should be referenced by stable model/package IDs; do not duplicate a complete GPU package inside a future PC package.
- A relationship such as `powered_by`, `connected_to`, `mounted_in` or `fastened_to` must describe the actual endpoints and cite evidence where available.
- Keep exact geometry fidelity separate from semantic completeness. A 90-node blockout does not imply 90 measured CAD parts.
- Use evidence states consistently: manufacturer documentation, teardown-supported, visible exact model, measured, illustrative proxy or unknown.

## Next scaling gates

1. Verify that the PC `.sbsmodel` loads through the same package loader as the GPU.
2. Exercise category filtering and switching between device classes.
3. Add a second desktop configuration without duplicating the viewer engine.
4. Add a shared component-definition registry only when at least two real packages reuse the same component families.
5. Consider a library landing page and richer filters after the catalogue contains enough models to justify them.
