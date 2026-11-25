# Release roadmap and acceptance gates

## Version policy

- **0.1–0.3:** procedural blockout and owner-run Blender/GLB technical validation.
- **0.4:** photo-informed proxy geometry and improved component separation; Blender 4.3.2 generation now runs reproducibly in CI.
- **0.5:** package validation, text-first inspection, and reproducible quality gates.
- **0.6:** static web viewer prototype: GLB loading, component picking, hierarchy, isolate/show-all.
- **0.7:** exploded view and deterministic reassembly; component cards with evidence status.
- **0.8:** bilingual content package, provenance links, source-confidence display, process-layer data contract.
- **0.9:** automated content/GLB binding, SHA-256 release integrity, GLB import hardening, WCAG A/AA checks, Chromium and Firefox UI tests, and Blender-to-viewer integration; automated CI gates pass.
- **1.0:** educational release candidate only after owner visual review, local interaction review, manual accessibility/performance checks and asset-rights review.

These are capability milestones, not promises that every feature will be physically simulated. The first model remains a documented educational proxy until verified geometry is obtained.

## Release gates

| Gate | Required evidence |
|---|---|
| Build reproducibility | Documented commands, pinned supported Blender/Node versions, no hidden local inputs |
| Model package | Stable IDs, explicit units/axes, manifest and GLB validation |
| Visual integrity | Owner review against exact-SKU references; no proxy presented as measured |
| Viewer | Load, orbit, zoom, select, isolate, hierarchy, explode, reassemble |
| Content | RU/EN labels, technical cards, evidence class, source link, confidence and unknowns |
| Process layers | Typed relationships and explanatory content; no unsupported physical simulation claims |
| Quality | Automated tests, clean CI, accessibility and asset-size budget; target-hardware performance review remains |
| Rights | No unlicensed third-party media/assets committed or redistributed; publication rights still need owner review |

## Non-negotiable accuracy policy

A source-backed specification, reviewer measurement, calibrated photo estimate, physical measurement, illustrative placeholder and unknown value are different evidence classes. Never silently promote one class to another. Nominal product dimensions do not automatically define every exterior component's maximum extent.
