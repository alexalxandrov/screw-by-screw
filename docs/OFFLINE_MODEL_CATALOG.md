# Offline model catalogue

The catalogue is a statically imported JSON index at `content/catalog/models.json`. `src/data/catalog.js` validates category membership, package identity, publication status and model identity scope. Exact-SKU entries require a manufacturer and part number; platform-family entries may omit a part number when none is assigned to the family. A catalogue ID and `package_model_id` remain distinct, and the latter must match the archive's internal `model_id`.

## Published catalogue

- **IBM Personal Computer 5150 (1981)** is the default published reference model. Its identity is a reference configuration for the launch-era system unit.
- **Dell OptiPlex 5060 Tower** is a published family-level reference (`platform_family`), not a claim about one installed retail sample. The v0.3 package covers 137 semantic components, 145 typed relationships, 28 source records and 34 claims. Optional hardware population remains unknown.
- **EVGA GeForce RTX 3060 XC BLACK GAMING 12GB**, SKU `12G-P5-3655-KR`, remains an unpublished research archive. It is retained in source control but excluded from the public library and standalone package embedding.

Both published models remain labelled `illustrative_proxy_not_cad`. Publication in the atlas does not assert measurement-grade geometry, a specific motherboard revision or a known installed component population.

## Hosted and offline loading

Hosted/Vite mode resolves a package through its relative path under the static public root. The standalone HTML builder reads the same catalogue and embeds only entries explicitly marked as published when their packages are staged under `public/`. It rejects unsafe paths and enforces a 512 MiB total raw-package limit for the generated launcher.

A double-click `file://` launch loads embedded packages without a server or network. If a package is not embedded, selecting it opens the file picker and verifies the selected archive's internal model ID before loading.

The browser loader supports two transports:
- ZIP-based `.sbsmodel` packages with a root `sbs-model.json` manifest.
- UTF-8 JSON envelopes prefixed with `SBSMODEL-JSON\n`, carrying a manifest and a checksummed file map. The GLB payload is base64-encoded inside the envelope.

Both transports pass through the same path, entry-count, size, SHA-256, metadata-reference, animation and GLB-binding validation. Catalogue strings are rendered as text nodes, not HTML.

## Adding another model

1. Define the model's identity scope: `exact_sku`, `platform_family`, `physical_sample` or `reference_configuration`.
2. Add and validate the package under `content/models/<model-id>/`; do not invent a part number for a platform family.
3. Stage its `.sbsmodel` under `public/models/` in the release workflow.
4. Add its category, identity scope, model kind, package version/path and geometry status to `content/catalog/models.json`.
5. Set `package_model_id` to the archive's internal model ID and explicitly set `published`.
6. Run catalog unit tests, package-loader tests, viewer browser tests, the package reproducibility workflow and the standalone build.

## Publication status

Only entries with `published: true` are part of the public model library. Entries marked `published: false` remain research archives and are excluded from public browsing and standalone embedding. The sole `default_package` remains IBM PC 5150; adding another published model does not silently change the initial model.
