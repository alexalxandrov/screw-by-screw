# Multi-model library — implementation plan and status

**Goal:** evolve Screw by Screw from the RTX 3060 component pilot into a catalogue and viewer for unrelated devices, from individual components to complete systems.

## Implemented in this branch

- The catalogue is bilingual and data-driven, with two categories: `graphics_cards` and `desktop_computers`.
- It has two entries: EVGA GeForce RTX 3060 XC BLACK GAMING 12GB (exact SKU) and Dell OptiPlex 5060 Tower (platform-family system).
- Identity scope and model kind are explicit; the OptiPlex is not assigned a fabricated part number.
- Runtime startup now resolves the default entry from `content/catalog/models.json`. The RTX 3060 is still the default, but `src/main.js` and `src/data/model.js` no longer import its sidecar JSON as a special startup path.
- Startup and later catalogue switching use the same `.sbsmodel` loader.
- The OptiPlex package is stored at `public/models/dell_optiplex_5060_tower_v01.sbsmodel`; editable source data lives in `content/models/dell-optiplex-5060-tower-family/`.
- The OptiPlex package has 67 stable component nodes, 68 typed relationships, 58 box-proxy geometry nodes and 24 individual screw/grommet instances.
- Its scene can be regenerated from per-component `visual_proxy` metadata by `tools/modeling/build_device_blockout.py`; a dedicated workflow rebuilds the scene and package and tests the production package loader with checksums.
- The catalogue UI already supports category filters, text search, model identity, package version and geometry status.

## Current limitations and remaining engineering work

1. **Legacy RTX-specific tooling remains.** The RTX blockout generator and its CI workflow still use fixed model paths and RTX-specific assumptions. Reusable validators should become manifest-driven; the legacy RTX pipeline still has a known GLB binding discrepancy for some logical/abstract components.
2. **The viewer's broader browser suite remains a gate.** Unit tests and the dedicated OptiPlex package workflow are separate from browser interaction tests. Catalogue switching, persistence and visual states must pass browser tests before a release.
3. **Standalone distribution needs a final release check.** `npm run build` embeds all staged catalogue packages in root `index.html`. The standalone output should be inspected to confirm both entries can be opened without a server.
4. **No cross-package component references yet.** The PC package can define a physical instance and eventually reference a GPU, RAM module, SSD or PSU package by stable versioned ID. The current v0.1 package keeps unknown/optional installed parts unpopulated rather than inventing their exact identity.
5. **The OptiPlex is not a physical-sample reconstruction.** Exact system-board assembly number/revision, CPU, PSU, drive population, internal cable routing, board hole coordinates and detailed fastener positions remain unknown. Its GLB uses schematic box proxies, never CAD.

## Information architecture

- **Computer systems:** desktops, workstations, laptops and servers.
- **Computer components:** GPUs, CPUs, motherboards, RAM, PSUs, coolers and storage.
- **Networking:** routers, switches, access points and adapters.
- **Mobile and consumer electronics:** phones, tablets, cameras and audio equipment.
- **Other devices:** added only when supported by an actual model.

Each entry carries:
- stable catalogue ID;
- identity scope (`exact_sku`, `platform_family`, `physical_sample` or `reference_configuration`);
- manufacturer and product/variant name;
- manufacturer part number only when one is established;
- category and model kind (`system`, `assembly`, `component` or `device`);
- package version/path and model status;
- geometry/evidence class and source-backed technical claims.

## Package and instance architecture

A reusable component definition is not the same as a physical occurrence inside one PC. Repeated screws, DIMMs, fans and M.2 devices must have unique instance IDs and individual transforms. The current OptiPlex package demonstrates stable per-instance IDs for its repeated fasteners and grommets.

Cross-package references should later let a PC instance point to a separately versioned GPU/SSD/PSU package. They must be optional and validated; an unavailable related package must not prevent the base PC model from opening.

Relationship vocabulary should cover:
- mechanical: `mounted_in`, `fastened_to`, `supports`, `contains`;
- electrical: `powered_by`, `connected_to`, `signals_to`;
- thermal/airflow: `cooled_by`, `transfers_heat_to`, `airflow_over`;
- data/storage: `data_connects_to`, `stores_data_for`.

## Evidence and geometry fidelity

Do not use one package-wide accuracy label to imply every part has equal certainty. Components and claims must retain their own provenance. Distinguish manufacturer CAD, measured reconstruction, teardown-supported reconstruction, photo estimate, illustrative proxy and unknown. Optional installed devices must be clearly marked as optional/unpopulated.

## Delivery sequence

1. **Done:** add identity scope/model kind and a multi-category catalogue.
2. **Done:** remove RTX-specific sidecar imports from viewer startup.
3. **Done:** register a second system-level model and create its portable package.
4. **Done:** add a reproducible GLB generator and dedicated package-validation workflow.
5. **In progress:** finish the viewer browser suite and verify standalone offline opening of both model packages.
6. Generalize the legacy RTX-specific Blender/build/validation pipeline.
7. Add versioned cross-package component references.
8. Replace schematic PC geometry with a calibrated reconstruction from an identified physical OptiPlex 5060 Tower configuration; record board and PSU revisions, dimensions, screw locations and fitted options.

## Acceptance criteria

- Both catalogue entries validate and remain independently selectable.
- The default RTX package opens through the same generic loader as the PC.
- The PC package passes package loader, SHA-256, GLB node-ID and ancestry checks.
- The catalogue supports multiple categories and identity scopes without fabricated manufacturer IDs.
- Each repeated physical occurrence has a unique component-instance ID.
- Missing/optional parts and unknown data remain explicit.
- Standalone `file://` mode embeds the staged model packages and can open both models.
- No unverified CAD accuracy, installed screw count, electrical path or teardown sequence is claimed.
