# Release roadmap and acceptance gates

## Version policy

- **0.1–0.3:** procedural blockout and owner-run Blender/GLB technical validation.
- **0.4:** photo-informed proxy geometry and improved component separation; Blender 4.3.2 generation was made reproducible in CI. OptiPlex package v0.4 adds per-component box, cylinder, fan and fin-stack primitives with automated geometry tests; all remain explicitly illustrative proxies.
- **0.5:** model-package validation, text-first inspection and reproducible quality gates.
- **0.6:** viewer interaction slice: GLB loading, component picking, hierarchy, isolation, camera presets, section view, search, source claims and model-space measurement.
- **0.7:** exploded view, deterministic reassembly, source-aware assembly observations and package-authored animation runtime.
- **0.8:** bilingual content package, provenance links, confidence classes and process-layer data contract.
- **0.9:** automated content/GLB binding, SHA-256 release integrity, import hardening, accessibility automation, browser interaction and Blender-to-viewer integration. The code-bearing commit `7d26a0f` passed Viewer build (74 unit tests and 58 E2E tests) and Blender blockout generation (57 E2E tests plus GLB/SBSMODEL generation and import checks). See the exact run links and current generated-artifact HEAD interpretation below.
- **1.0:** educational release candidate only after current-head automated checks, owner visual review, local interaction review, manual accessibility/performance checks and asset-rights review.

These are capability milestones, not promises that every feature will be physically simulated. The first model remains a documented educational proxy until verified geometry is obtained.

## Current RTX 3060 pilot data scope

The current package contains **325 semantic components, 324 typed relationships, 122 atomic claims and 31 registered sources**, with five process layers, 17 bilingual learning questions and two package-authored animation clips. The component inventory includes logical-only GA106 architecture nodes and unmeasured visual proxies; its count is not a count of 313 physically reconstructed parts.

The pilot tracks five partial teardown observations, but no complete removal/reassembly sequence. The cooling model keeps six reviewer-described route/run proxies distinct from the unknown physical closed-loop count. The power model is qualitative and does not assert a verified exact-board VRM topology.

## Release gates

| Gate | Required evidence |
|---|---|
| Build reproducibility | Documented commands, pinned supported Blender/Node versions, no hidden local inputs |
| Model package | Stable IDs, explicit units/axes, manifest, GLB and portable-package validation |
| Visual integrity | Owner review against exact-SKU references; no proxy presented as measured |
| Viewer | Load, orbit, zoom, select, isolate, hierarchy, explode and reassemble |
| Content | RU/EN labels, technical cards, evidence class, source link, confidence and unknowns |
| Process layers | Typed relationships and explanatory content; no unsupported physical simulation claims |
| Quality | Automated tests, clean current-head CI, accessibility and asset-size budget; target-hardware performance review remains |
| Rights | No unlicensed third-party media/assets committed or redistributed; publication rights reviewed before release |

## CI interpretation

A historical passing run does not certify a later branch head. A job marked failed or action-required without started steps and runner logs is not a code-test result. Record the exact commit SHA and run URLs; mark the gate pending until GitHub Actions executes the workflow steps and publishes their outcomes.

### Current main verification — 2026-11-28

The current code-bearing revision is `3aa9b3acca0ad9aff567680c0fcad1b35dfb1086`.

- [Viewer build — run 46176218986](https://github.com/alexalxandrov/screw-by-screw/actions/runs/46176218986): **success**. Unit tests and build passed; the browser suite completed with 65 passing tests; the strict-CSP production runtime test completed with 1 passing test.
- [OptiPlex 5060 package validation — run 46176218976](https://github.com/alexalxandrov/screw-by-screw/actions/runs/46176218976): **success**. Geometry generation, semantic GLB bindings, package validation and browser loading passed.
- [Blender blockout generation — run 46176219012](https://github.com/alexalxandrov/screw-by-screw/actions/runs/46176219012): Blender 4.3.2 scene/GLB generation, release-manifest validation, IBM and Dell package builds, and browser package-loader integration passed. The final viewer/accessibility suite is still running.
- [Model package validation — run 46174036357](https://github.com/alexalxandrov/screw-by-screw/actions/runs/46174036357): latest successful run is on `75fd7bae3374950b00d5167ec02d4341c35a5967`. It was not triggered on `3aa9b3a` because that commit contains no model-package/content changes covered by its path filters.

PR #44 (procedural OptiPlex geometry v0.4) is merged into `main`. The automated Viewer and OptiPlex gates are green. The Blender job's final suite is pending; do not describe the full workflow set as green until it completes. Owner visual review, manual accessibility, target-hardware performance and asset-rights review remain open. Release 1.0 is not approved.

## Non-negotiable accuracy policy

A manufacturer specification, reviewer measurement, sample operating point, calibrated photo estimate, physical measurement, illustrative placeholder and unknown value are different evidence classes. Never silently promote one class to another. Nominal product dimensions do not automatically define every exterior component's maximum extent.

## Viewer capabilities

The viewer includes:
- a two-point model-space ruler with explicit non-metrology warnings;
- component/source search, source-backed claim cards and typed relationship navigation;
- an assembly evidence panel separating source observations from authored disassembly steps;
- startup protection so a late optional bundled-model response cannot replace a scene after user interaction;
- camera presets and reversible uncapped visual section clipping;
- package-authored animation playback with play/pause, normalized seek, speed and reset;
- system `prefers-reduced-motion` support across package clips, procedural disassembly, exploded-view transitions and UI CSS motion. Under reduced motion, timed transitions resolve directly to their final state; manual animation seeking remains available.

These capabilities do not increase the physical fidelity of the RTX 3060 proxy. Owner visual acceptance, rights review and target-hardware performance testing remain required before 1.0.

## Package-authored animation runtime

The generic runtime supports clip selection, play, pause, normalized seek, playback speed, completion and stop/reset with deterministic restoration of starting transforms. System reduced-motion preferences are applied at startup and observed live: timed playback and procedural transitions finish immediately rather than interpolating, while users retain manual timeline seeking and inspection. Animation tracks target stable component IDs and carry explicit evidence metadata. The RTX 3060 pilot includes an educational visual rotor-turn clip bound to two stable impeller pivots (not measured RPM) and a reversible exploded-cooler overview (presentation offsets, not service clearances or removal order). Procedural airflow and power effects remain separate viewer-generated educational overlays.


The PC Perspective review also reports a momentary frequency peak of **1905 MHz** during Metro Exodus at 2160/high. It is attached to the GPU as a measured review-sample observation, explicitly distinct from EVGA's published 1777 MHz boost clock; the article does not disclose the reviewed card's retail part number, so this is XC BLACK model evidence rather than an exact-P/N claim.


The Gamers Nexus exact-model teardown also gives a rough verbal estimate of approximately **6 mm** for the two central heatpipe tube runs visible through the GPU contact plate. The package stores this as a teardown-supported estimate with a note that it is not calibrated and must not be applied to every route proxy.


## Dedicated video codec engines

The RTX 3060 pilot records NVIDIA's listed single 7th-generation NVENC encoder and single 5th-generation NVDEC decoder as separate logical-only components. Codec capabilities are transcribed from NVIDIA's GeForce RTX 3060 desktop support-matrix row; profile, chroma-format and bit-depth restrictions remain source-defined. The viewer's video-codec layer is an architecture map, not a measured throughput, latency, concurrency, thermal or EVGA PCB-routing model.


## 2026-11-28 — cross-model engineering pass

The Dell viewer now opens the OptiPlex 5060 Tower as an exploded inspection model with a translucent chassis shell and board tray. The common exploded-view clearance scales with the loaded model's bounding-box diagonal. Illustrative package-animation and procedure offsets use a 2.8× presentation multiplier; manufacturer-data offsets remain unchanged. This improves visibility only and does not convert proxy motion into measured service geometry.


Dell OptiPlex 5060 Tower family package v0.4.1 adds generic panel/drive-cage proxies and separately selectable standard front/rear I/O proxies. The semantic inventory remains 137 stable component IDs and 145 typed relationships. Two atomic claims record five standard front external connectors and ten standard rear data/audio/network connectors; the PSU AC inlet is counted separately. Optional SD, optical, serial, third-video and antenna populations remain unknown/unpopulated.

Evidence caveat: the current official Dell front/rear guide pages are hosted under the OptiPlex 5060 guide URL, but their embedded images visibly carry a 5070 label. Their image pixels are excluded from 5060 geometry placement. Text legends and the port specification are used for identity/count only. Marker dimensions and positions remain schematic.

The Viewer pauses its WebGL loop while mobile Structure/Details panels or a background tab are active, caps mobile DPR at 1.5, and expands responsive tests to 320/375/390/768/820 CSS pixels. Current-head CI is green on `b87f172`; Release 1.0 remains not approved pending owner physical-device visual review, manual accessibility, target-hardware performance and asset-rights acceptance.
