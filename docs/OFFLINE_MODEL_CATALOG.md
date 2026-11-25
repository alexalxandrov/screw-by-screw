# Offline model catalogue

The catalogue is a statically imported JSON index at `content/catalog/models.json`. `src/data/catalog.js` validates the data before the UI uses it. Catalogue IDs and exact manufacturer/part-number pairs must be unique; every entry references a declared category and includes a package version, safe relative `.sbsmodel` path, research status and geometry-evidence class.

Each entry has a catalogue ID and a separate `package_model_id` that must match the archive's internal `model_id`.

## Hosted and offline loading

Hosted/Vite mode resolves a package through its relative path under the static public root. The standalone HTML builder reads the same catalogue and embeds every staged archive found under `public/` as a data URL. It rejects unsafe paths and enforces a 512 MiB total raw-package limit for the generated launcher.

A double-click `file://` launch loads embedded packages without a server or network. If a package is not embedded, selecting it opens the file picker and verifies the selected archive's internal model ID before loading.

Every archive still passes through `loadModelPackage`: ZIP structure, path traversal, entry-size limits, checksums, metadata references, animation tracks and GLB node bindings are checked. Catalogue strings are rendered as text nodes, not HTML.

## Current entry

The index currently contains the exact EVGA GeForce RTX 3060 XC BLACK GAMING 12GB SKU `12G-P5-3655-KR`. Its status is a research blockout and its geometry is labelled `illustrative_proxy_not_cad`; the catalogue does not imply CAD accuracy.

## Adding another model

1. Add and validate the package under `content/models/<model-id>/`.
2. Stage its generated `.sbsmodel` under `public/models/` in the release workflow.
3. Add its exact SKU, category, package version/path and geometry status to `content/catalog/models.json`.
4. Set `package_model_id` to the archive's internal model ID.
5. Run catalog unit tests, viewer browser tests, package validation and the standalone build.
