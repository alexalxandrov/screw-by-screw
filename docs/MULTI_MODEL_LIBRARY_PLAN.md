# Multi-model library — implementation and publication status

## Current state

The catalogue supports different kinds of device identity and package transport:

- **EVGA RTX 3060 XC BLACK** — exact-SKU graphics-card research archive; `published: false`.
- **IBM Personal Computer 5150 (1981)** — exact-SKU system reference; `published: true` and the only default package.
- **Dell OptiPlex 5060 Tower** — platform-family system research archive; `published: false`, no manufacturer part number or service tag is fabricated.

The public catalogue and standalone launcher use an explicit publication boundary. Missing `published` metadata is treated as unpublished; a default package must explicitly be published.

## Identity model

Every model entry has a unique catalogue ID, a separate `package_model_id` matching the package manifest, `identity_scope` (`exact_sku`, `platform_family`, `physical_sample` or `reference_configuration`), `model_kind` (`system`, `assembly`, `component` or `device`), an optional manufacturer part number (mandatory for `exact_sku`) and a publication flag independent of research status and geometry fidelity.

Family-level evidence is not a claim about one installed physical configuration. Optional equipment, service-tag variation and unknown populations remain explicit.

## OptiPlex 5060 Tower v0.3

The Dell family package is stored under `content/models/dell-optiplex-5060-tower-family/` and the text envelope at `public/models/dell_optiplex_5060_tower_v03.sbsmodel`.

- 137 semantic components and 145 typed relationships;
- 58 geometry-backed proxy nodes (box geometry; not CAD);
- 28 registered source records and 34 technical claims;
- six qualitative process layers;
- 12 partial source-backed service steps and 19 separate service observations;
- 26 numbered motherboard callouts and nine bilingual learning questions;
- 24 illustrative service-relevant screw/grommet instances and seven optional fastener references marked as not fitted.

The data models a Tower-family platform reference, not a specific service tag, board assembly, PCB revision, CPU, PSU or retail order code. Internal layout and fastener placement remain schematic. The package is deliberately not published pending further review.

## Package transport

The loader supports both the legacy ZIP `.sbsmodel` archive and a checksummed UTF-8 `SBSMODEL-JSON` envelope. Both use the same manifest, sidecar keys and SHA-256 contract. The text builder is deterministic and can compare a newly generated envelope with the committed package, including its sidecar payloads, scene graph and binary geometry.

## Validation

The dedicated OptiPlex workflow regenerates a GLB from the editable component inventory, validates semantic parent relationships and geometry-backed node bindings, builds a portable ZIP package, regenerates and compares the committed v0.3 JSON envelope, loads the committed package through the production JavaScript loader and runs text-envelope and viewer tests.

Publication is a separate manual decision. Passing package validation does not automatically change `published: false`.
