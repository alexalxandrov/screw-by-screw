# Offline model catalogue

The catalogue is a statically imported JSON index at `content/catalog/models.json`. `src/data/catalog.js` validates catalogue identity, category, package binding, geometry status and publication metadata before the UI uses an entry.

Each entry has a stable catalogue ID and a separate `package_model_id` that must match the internal `model_id` of its `.sbsmodel` package. Identity is explicit:

- `identity_scope`: `exact_sku`, `platform_family`, `physical_sample` or `reference_configuration`.
- `model_kind`: `system`, `assembly`, `component` or `device`.

An `exact_sku` entry requires a manufacturer part number. A family-level entry may leave `part_number` null; it must not invent a retail SKU, service tag or board assembly number.

## Publication policy

Only entries explicitly marked `published: true` are shown in the user-facing catalogue. An entry with `published: false` (or no explicit publication flag) is treated as an archive and hidden. Only explicitly published packages are embedded in the standalone root `index.html`. A default package must also be explicitly published.

The current public reference is **IBM Personal Computer 5150 (1981)**. It is the sole `published: true` and `default_package: true` entry.

The repository also retains two unpublished research packages:

- **EVGA GeForce RTX 3060 XC BLACK GAMING 12GB**, exact SKU `12G-P5-3655-KR`. It remains a GPU research archive pending confirmation of the exact PCB revision and complete service evidence.
- **Dell OptiPlex 5060 Tower**, family-level system reference (`platform_family`, no manufacturer part number assigned). Its v0.3 package has 137 semantic components, 145 typed relationships, 28 sources, 34 claims and a partial source-backed service sequence. Its geometry is explicitly `illustrative_proxy_not_cad`; the family entry is not tied to one service tag or one installed configuration.

## Hosted and offline loading

Hosted/Vite mode resolves a package through its relative path under `public/`. The standalone `index.html` embeds only packages explicitly marked as published. An archive package is not reachable through the user-facing catalogue.

The same package loader supports both the legacy ZIP `.sbsmodel` transport and the UTF-8 `SBSMODEL-JSON` envelope. Both are subject to path validation, entry and size limits, SHA-256 checks, metadata cross-reference validation, animation checks and GLB component binding checks. Catalogue text is rendered as text, not HTML.

## Adding another model

1. Add editable sidecars under `content/models/<model-id>/`.
2. Validate package integrity, semantic references and geometry bindings.
3. Stage the generated package under `public/models/`.
4. Add its identity scope, model kind, category, package version/path and geometry status to `content/catalog/models.json`.
5. Set `published: false` until a source-based review approves publication. Use `published: true` only after the review gates pass.
6. Set `package_model_id` to the package's internal model ID.
7. Run package validation, viewer/browser tests and the standalone build.

Unknown configuration, dimensions, geometry and service steps remain unknown; family support data is not evidence of the fitted configuration of a physical sample.
