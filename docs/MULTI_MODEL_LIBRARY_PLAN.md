# Multi-model library integration plan

## Published model set

| Catalogue entry | Identity scope | Publication | Default |
|---|---|---|---|
| IBM Personal Computer 5150 (1981) | `reference_configuration` | Published | Yes |
| Dell OptiPlex 5060 Tower | `platform_family` | Published | No |
| EVGA GeForce RTX 3060 XC BLACK GAMING 12GB | `exact_sku` | Unpublished research archive | No |

IBM remains the sole startup default. Adding a model never silently changes the default package.

## Identity model

- `exact_sku`: a manufacturer and actual part number are required.
- `platform_family`: a product family may be represented without inventing a part number or asserting one installed configuration.
- `reference_configuration`: a deliberately bounded historical or reference configuration.
- `physical_sample`: reserved for an identified inspected physical unit.

A missing part number on a family-level entry is displayed as an explicit family identity, not as an empty SKU.

## Package transports

The loader accepts ZIP-based `.sbsmodel` packages with a root manifest and checksummed UTF-8 JSON-envelope packages prefixed by `SBSMODEL-JSON\\n`. Both transports use the same size, path, entry-count, SHA-256, semantic-reference and GLB validation. The OptiPlex v0.3 package uses the JSON envelope so its content can be reproduced from text sidecars and generated geometry.

## OptiPlex 5060 Tower v0.3

The current family-level package records 137 semantic component nodes, 145 typed relationships, 28 source records, 34 technical claims, six process layers, 12 partial service steps, 19 service observations and nine learning questions. Twenty-four service-relevant screw/grommet instances are distinguished from seven optional fastener references. All 26 motherboard callouts map to stable component IDs; optional population remains unknown.

The generated scene is an illustrative blockout, not CAD. Unknown motherboard revision, CPU/PSU installation, DIMM/storage population, routing and exact fastener coordinates remain explicitly unknown.

## Release gates

CI must:
1. Rebuild the GLB from canonical component metadata.
2. Validate semantic IDs and geometry bindings.
3. Rebuild the JSON-envelope package and compare sidecars, GLB scene graph and binary geometry with the committed v0.3 artifact.
4. Load the committed package through the production browser loader.
5. Verify standalone embedding includes Dell and excludes the unpublished RTX archive, while IBM remains the sole default.
6. Exercise catalogue search and browser loading of the Dell family package.

The 1.0 release still requires owner visual acceptance, representative-hardware performance review, keyboard/manual accessibility checks and publication-rights review.
