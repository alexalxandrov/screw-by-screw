# Multi-model library — implementation plan

**Goal:** evolve Screw by Screw from a strong single-device pilot into a catalogue and viewer that can host many unrelated device models without adding model-specific branches to the application.

## Verified baseline

The following already exists:

- `content/catalog/models.json` is a data-driven bilingual catalogue with categories, model IDs, manufacturer/part-number identity, package version/path and geometry status.
- This branch adds optional, validated `identity_scope` and `model_kind` fields to the catalogue adapter. `exact_sku` requires a real part number; platform-family records can leave `part_number` empty. Existing catalogue records remain backward-compatible.
- `src/data/catalog.js` validates categories, unique catalogue IDs, duplicate manufacturer/part-number pairs, model package IDs and safe relative `.sbsmodel` paths.
- `src/viewer/ModelPackageLoader.js` validates the portable model package and its cross-file references before loading.
- `src/main.js` has `fetchCatalogPackage()`, `openCatalogEntry()` and `applyPackageData()`; selected catalogue packages can be loaded through the shared package loader.
- The catalogue UI already has category filtering and text search.

This is a useful starting point. The application is not yet fully model-agnostic at startup and in CI.

## Current blockers found in the repository

1. **Single-model startup imports:** `src/main.js` imports the RTX 3060 package JSON as the default runtime data, and `src/data/model.js` statically imports that model's JSON files. The first model is therefore still a special path even though later catalogue selection is generic.
2. **One category in production data:** `content/catalog/models.json` currently declares only `graphics_cards` and contains only the EVGA RTX 3060 entry.
3. **RTX-specific modeling validator:** `tools/modeling/validate_blockout_package.py` contains fixed RTX 3060 model-ID and part-number constants.
4. **RTX-specific Blender workflow:** `.github/workflows/blender-model-validation.yml` invokes the RTX 3060 generator and stages RTX 3060 artifacts by fixed filenames/paths.
5. **Pilot-only geometry rule:** `tools/content/validate_model_package.py` currently insists the package geometry status be `illustrative_proxy_not_cad`. That is appropriate for the current blockout, but is too restrictive as a permanent rule for every future package.
6. **No cross-package component references yet:** the package contract is self-contained. A PC package should be able to reference a separately versioned GPU/SSD/PSU package without copying its complete component graph or confusing a shared component definition with a physical instance.

## Target information architecture

The catalogue should support both whole systems and standalone devices. A practical first taxonomy:

- **Computers:** desktop PCs, workstations, laptops and servers.
- **Computer components:** GPUs, CPUs, motherboards, RAM, PSUs, coolers and storage.
- **Networking:** routers, switches, access points and network adapters.
- **Mobile and consumer electronics:** phones, tablets, cameras and audio equipment.
- **Other devices:** added only when a real model justifies the category.

Each catalogue entry should carry:
- a stable catalogue ID;
- identity scope (exact retail SKU, platform family, physical sample or authored reference configuration);
- manufacturer and product/variant name;
- part number only when it is a real manufacturer identifier;
- category and model kind (system, assembly or component);
- package version and safe package path;
- package status and geometry/evidence status;
- optional compatibility/related-model references.

Do not put a platform-family code into `part_number` and pretend it is a manufacturer SKU. The adapter on this branch represents family-level research entries honestly through `identity_scope`.

## Target package architecture

### 1. Generic startup path

- Load the catalogue first.
- Resolve the declared default model and its package by the same loader used for every other catalogue entry.
- Keep a small, explicit fallback state only for offline/file-open failure; do not keep a parallel RTX-specific runtime data path.
- Ensure model switching disposes scene, animation and selection state before the next package is applied.
- Add tests for initial load, model switching, missing package, mismatched package ID, offline embedded packages and file:// fallback.

### 2. Reusable physical components vs placed instances

A reusable definition (for example, a 120 mm axial fan or M.2 SSD) is not the same as one physical occurrence in a particular PC.

- `ComponentDefinition`: reusable type/specification.
- `ComponentInstance`: one installed occurrence with its own parent, transform, reference designator, evidence and geometry node.
- Repeated fans, DIMMs, screws and standoffs must have distinct instance IDs.
- Geometry nodes bind to component instance IDs, not only to a generic part type.

### 3. Cross-package references

The PC package should own its system-level assembly and physical installed-instance IDs. Where a fitted part has its own detailed package, the PC component instance can point to a stable external package/model/release reference. Do not duplicate the GPU's component graph into the PC package.

Define relationship types for system integration:
- mechanical: `mounted_in`, `fastened_to`, `supports`, `contains`;
- electrical: `powered_by`, `connected_to`, `signals_to`;
- thermal/airflow: `cooled_by`, `transfers_heat_to`, `airflow_over`;
- data/storage: `data_connects_to`, `stores_data_for`.

Cross-package references must be versioned, resolvable and validated. A broken or unavailable related package should not prevent the PC package itself from opening.

### 4. Evidence and geometry fidelity

Do not use one global geometry status for every package. Geometry status belongs to the relevant asset, component or release and should distinguish at least:
- manufacturer CAD;
- measured reconstruction;
- teardown-supported reconstruction;
- calibrated photo estimate;
- illustrative proxy;
- unknown.

A single model may contain a mixture of these. Claims must have per-claim provenance and applicability. Optional components and variant differences must be explicit rather than silently merged.

### 5. Catalogue UI

- Browse all models with search and category filters.
- Distinguish full systems from components in cards and detail pages.
- Show exact model identity and revision/configuration scope.
- Show content status, geometry fidelity and evidence coverage.
- Support related-model navigation and compatibility links.
- Add compare views only when models share meaningful comparable properties.
- Make the current model, category and selected component stable in URLs when practical.

### 6. Multi-model CI and content pipeline

- Split generic package validation from model-specific Blender generation.
- Validate every package discovered from a manifest/catalogue entry.
- Replace hard-coded RTX identifiers in reusable validators with CLI arguments or manifest-driven identity.
- Use per-model build definitions or a controlled CI matrix.
- Keep large binary packages as generated artifacts or in suitable asset storage; do not commit unlicensed source media or oversized working files.
- Add contract tests that load at least two unrelated packages (GPU and desktop PC) through the same viewer runtime.

## Delivery sequence

1. Stabilize current RTX 3060 work and resolve the existing PR/Actions approval state before stacking more release work.
2. Extend and test the catalogue identity-scope and model-kind schema without registering an incomplete PC package. (Implemented in this branch.)
3. Convert startup to use the same generic package-loading path as catalogue switching.
4. Generalize validators and CI so the second device does not require RTX-specific code.
5. Build the Dell OptiPlex 5060 Tower research package and staged geometry.
6. Add the completed PC package to the catalogue; link any fitted component package by versioned reference.
7. Prove model switching, offline launch, browser performance, accessibility and package integrity with both device classes.

## Acceptance criteria for the multi-model milestone

- The RTX 3060 package remains loadable without a GPU-specific special case in the viewer runtime.
- A PC package with a different component hierarchy loads through the same runtime.
- The catalogue can represent multiple categories and identity scopes without fabricated manufacturer part numbers.
- Generic validators accept valid packages with differing geometry-fidelity classes and reject invalid references/IDs.
- Component instance IDs remain unique even when multiple instances share one component definition.
- Related packages are navigable but not required for a base package to render.
- No unknown geometry, screw count, electrical path or disassembly step is silently guessed.
