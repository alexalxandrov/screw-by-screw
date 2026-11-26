# Offline model catalogue

The catalogue is a statically imported JSON index at `content/catalog/models.json`. `src/data/catalog.js` validates the data before the UI uses it. Catalogue IDs and supplied manufacturer/part-number pairs must be unique; every entry references a declared category and includes a package version, safe relative `.sbsmodel` path, research status and geometry-evidence class. Each entry also declares `identity_scope` (`exact_sku`, `platform_family`, `physical_sample` or `reference_configuration`) and `model_kind` (`system`, `assembly`, `component` or `device`). A real manufacturer part number is required for `exact_sku`; family-level entries may leave it null rather than inventing a SKU.

Each entry has a catalogue ID and a separate `package_model_id` that must match the archive's internal `model_id`.

## Hosted and offline loading

Hosted/Vite mode resolves a package through its relative path under the static public root. The standalone HTML builder reads the same catalogue and embeds every staged archive found under `public/` as a data URL. It rejects unsafe paths and enforces a 512 MiB total raw-package limit for the generated launcher.

A double-click `file://` launch loads embedded packages without a server or network. If a package is not embedded, selecting it opens the file picker and verifies the selected archive's internal model ID before loading.

Every archive still passes through `loadModelPackage`: ZIP structure, path traversal, entry-size limits, checksums, metadata references, animation tracks and GLB node bindings are checked. Catalogue strings are rendered as text nodes, not HTML.

## Current entries

The catalogue contains two model classes:

- **EVGA GeForce RTX 3060 XC BLACK GAMING 12GB**, exact SKU `12G-P5-3655-KR`, in `graphics_cards`. This remains the default package.
- **Dell OptiPlex 5060 Tower**, `platform_family` system reference in `desktop_computers`. It is packaged as `models/dell_optiplex_5060_tower_v01.sbsmodel` and is explicitly labelled `illustrative_proxy_not_cad`.

The OptiPlex family package contains 67 stable component nodes, 68 typed relationships, 58 box-proxy meshes and 24 separate screw/grommet instances. Its outer dimensions are manufacturer-published; internal layout and fastener placement are schematic. The two entries use the same catalogue adapter and package loader.

## Adding another model

1. Add and validate the package under `content/models/<model-id>/`.
2. Stage its generated `.sbsmodel` under `public/models/` in the release workflow.
3. Add its identity scope, model kind, category, package version/path and geometry status to `content/catalog/models.json`. Use `exact_sku` only when the manufacturer part number is known.
4. Set `package_model_id` to the archive's internal model ID.
5. Run catalog unit tests, viewer browser tests, package validation and the standalone build.
