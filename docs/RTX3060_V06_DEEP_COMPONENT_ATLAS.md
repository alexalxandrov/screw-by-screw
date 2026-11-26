# RTX 3060 XC BLACK — deep component atlas tranche

Target: EVGA GeForce RTX 3060 XC BLACK GAMING 12GB
Retail part number: 12G-P5-3655-KR
Development branch: feat/rtx3060-deep-component-atlas
Geometry class: illustrative_proxy_not_cad
Status: engineering increment; not a complete card reconstruction

## What this tranche adds

The canonical model package and Blender GLB gain matching stable component IDs for the GA106 silicon die proxy; thermal-interface parent group, GPU compound marker, memory pads and power-stage pad group; four photo-positioned exact-SKU GPU-area screw meshes plus four uninstalled logical candidates from a related XC teardown; PCI Express edge interface with representative segmented contacts; two independent fan-cable header nodes; three DisplayPort and one HDMI receptacle nodes; selectable shunt-resistor area and generic passive group; and PCB airflow-cutout marker.

The package adds source-backed relations and claims where evidence exists, and keeps all component names and descriptions bilingual. The Blender scene uses matching sbs_component_id values and preserves the hierarchy declared in components.json.

## Evidence interpretation

| Area | Current status | What is not claimed |
|---|---|---|
| GPU die | visual proxy | exact die outline, dimensions, substrate stack |
| Thermal compound/pads | teardown-supported presence | brand, thickness, hardness, precise coverage |
| Eight cooler screws | candidate count from a related EVGA XC teardown | exact-SKU count, locations, thread, torque, order |
| PCIe edge | manufacturer interface claim / visual proxy | measured pin field, signal map, lane routing |
| Fan headers | two teardown-visible connections | pinout, voltage, PWM/tach mapping |
| Display ports | three DP + one HDMI from SKU specification | manufacturing shell geometry |
| Shunt area | exact-model teardown discussion | resistance, reference designators, electrical topology |
| Power passives | visual grouping only | MOSFET identity, phase count, values, controller |
| PCB cutout | visible in exact-model review | calibrated contour or measured dimensions |
| PCB revision | unknown | EVGA232 REV 1.0 is only a candidate photo observation |

## Reproducible validation

From repository root, regenerate and validate the semantic package using:
python tools/content/build_release_manifest.py content/models/evga-rtx3060-xc-black-12gb
python tools/content/validate_model_package.py content/models/evga-rtx3060-xc-black-12gb

Blender generation and GLB binding are exercised by the Blender blockout generation GitHub Actions workflow after the branch is pushed. Browser tests then open the generated GLB/package and validate the generic viewer.

## Remaining work before a detailed GPU model can be called complete

1. Identify the exact physical PCB revision and reconcile the apparent EVGA232 REV 1.0 image lead.
2. Obtain and legally validate a BoardView and schematic for that exact revision.
3. Verify the full BOM, reference designators, VRM topology, MOSFETs, controller, shunts, passive values and connector pinouts.
4. Replace proxy dimensions with calibrated measurement or licensed CAD for shroud, PCB, heatsink, heatpipes, fans, fasteners and all connectors.
5. Review the complete exact-model teardown before authoring any service/removal sequence.
6. Add evidence-backed electrical and thermal diagrams; keep CFD, thermal FEA and SPICE as separate numerical projects.
7. Obtain asset reuse rights, then perform visual acceptance on the generated blend, glb and sbsmodel.

No exact board revision, undocumented value, repair procedure or physical simulation is invented in this tranche.


## Additional verified specification and board-photo tranche

The package now carries exact-SKU manufacturer claims for the 15,000 MHz effective memory clock, 550 W recommended system PSU, dual-slot width, 7680 × 4320 maximum digital resolution, and DisplayPort 1.4a / HDMI 2.1 output versions. The 170 W TGP claim is sourced to the Neoseeker review sample explicitly identified as 12G-P5-3655-KR. A PSU recommendation must not be confused with the card's own board power.

The component atlas also adds separate, individually selectable photo-estimated groups for two inductor candidates, capacitor packages, switching-device packages and a controller-IC candidate. They are visual navigation aids derived from PCB reference photographs; no phase topology, MOSFET model, controller part number, inductance, capacitance, voltage rating, PWM mapping or net routing is inferred. Their candidate status is deliberately weaker than an exact-revision BOM or BoardView identification.


## Fine-grained cooling decomposition

The canonical package now exposes 104 semantic components and 99 typed relationships. This includes individually selectable fan frames, hubs and seven blade proxies per fan; 24 separate heatsink-fin proxies; two selectable heatpipe-route assemblies; six memory-side thermal-pad proxies; and a VRM-side thermal-pad strip proxy.

These are independently selectable teaching meshes, not a claim that the exact hardware has seven blades per fan or 24 fins. The count and shapes are explicitly identified as proxy geometry. Thermal-pad positions are aligned to the six memory-package candidates only; pad thickness, material, hardness and service dimensions remain unverified. Heatpipe paths and cross-sections likewise remain illustrative.


## Source-backed partial teardown sequence

The assembly evidence panel contains two partial steps grounded in exact-XC-BLACK sources: (1) identify/remove the four GPU-area heatsink mounting screws explicitly shown in the LanOC review, and (2) disconnect both fan leads before separating the cooler, as shown in the exact-model Gamers Nexus teardown. The sequence is explicitly marked `partial_observed_sequence` and `complete_sequence: false`. The Tom's Hardware eight-screw description is now registered only as a related EVGA RTX 3060 XC variant reference because its article does not identify the 12G-P5-3655-KR XC BLACK. Four additional rear fastener nodes remain uninstalled logical candidates; they are not in the exact-SKU screw map. No driver size, torque, exact thread or reassembly procedure is inferred.


## Reversible exploded-assembly animation

A second package-authored animation clip, `clip.exploded-cooler-overview`, now moves the shroud, full cooling assembly, PCB/electronics assembly and connector assembly into separated display positions. It uses the generic `AnimationPlayer`, easing, seek, playback, stop/reset and the localized clip description. The clip is tagged `educational_approximation`; offsets are presentation coordinates and do not assert physical service clearances or a screw-by-screw removal order. A unit test checks every target's final transform and restoration, and the browser test selects, seeks and resets the clip.


## GA106 compute and GDDR6 architecture tranche

The semantic package now contains 127 components and 122 typed relationships. Thirteen logical-only nodes represent the 28-SM GA106 cluster, its CUDA/Tensor/RT/TMU/ROP aggregates, a 192-bit GDDR6 interface and six logical interface presentation groups. Six GDDR6 package positions are separately selectable from exact-XC-BLACK review/teardown material, but no one-to-one mapping between package positions and interface segments is asserted. The logical nodes carry `geometry_status: logical_only`: no physical die floorplan, shader wiring or PCB trace routing is drawn.

A third process layer, `gpu_compute`, exposes this architecture map in the viewer. Claims cover the published 28 SM / 112 Tensor / 28 RT / 112 TMU / 48 ROP configuration, 276 mm² and 12-billion-transistor GA106 die figures, Samsung 8N, and memory device attributes where available. The memory-package details are explicitly sourced to a secondary catalog entry rather than a primary Samsung datasheet. The viewer labels this as a logical map, not an architecture simulation.


## 13. Exact-SKU fastener evidence reconciliation

The LanOC review explicitly identifies **four heatsink mounting screws around the GPU** on the 12G-P5-3655-KR XC BLACK sample and shows the exposed PCB without a backplate. The first four screw meshes are now placed approximately from that exact-model photo and are tagged `visible_exact_model` / `illustrative_proxy`. Their head, thread, spring and torque remain unmeasured.

Tom's Hardware's eight-screw description is from an EVGA GeForce RTX 3060 XC teardown that does not identify the XC BLACK retail SKU. That source is now typed as a related-model reference. Four additional screw objects remain in the semantic package only as uninstalled logical candidates with no fabricated installed geometry. They are not counted as exact-XC-BLACK GPU retention screws.

The disassembly panel now states only the four GPU-area screws and the exact-model fan-lead disconnection step. The steps remain partial and are not a complete service manual.


## 14. GDDR6 package identity and mapping boundary

The exact XC BLACK teardown/review material supports six visible GDDR6 package positions. The available exact-SKU material does not yet establish each package's full marking. K4ZAF325BM-HC16 appears in a related EVGA RTX 3060 XC teardown and a secondary catalog, so its 16-Gbit density, 512M × 32 organization, 16-Gbps data rate and 180-FBGA package are recorded only as candidate-part attributes.

The EVGA 192-bit GDDR6 bus remains an exact-SKU manufacturer specification. Six interface presentation groups remain in the architecture tree, but they are not confirmed hardware channels and are no longer connected to the six package nodes. The exact electrical partition and BoardView mapping remain unknown.


## 15. Interactive thermal-path diagram

The cooling process layer now exposes a four-stage clickable diagram: heat source/contact interfaces, heat transport, fin-stack rejection, and airflow/mechanical envelope. Its 22 nodes reuse the canonical component IDs and link directly to the component detail pane. The diagram records the approximate reviewer measurements for the fan opening and impeller but labels the 3D fan centres, blade meshes, two heatpipe paths, fin count, pad dimensions and outer shroud contour as illustrative or unknown. It does not calculate CFD, junction temperature, thermal resistance, fan curves, RPM, acoustics or heat-transfer performance.


## 16. Four visible copper heatpipe terminal faces

The exact XC BLACK cooler-end photograph in LanOC's review shows four separate copper terminal faces. Four individually selectable markers now exist under `cooling.heatpipes`. Their generated positions and disc dimensions are photo-estimated proxies. The claim deliberately counts **visible terminal faces**, not unique U-shaped heatpipes: two pipes can have four ends. The model's two illustrative route candidates remain unverified internal routing and are not promoted to an exact pipe-count or manufacturing specification.


## 17. Six heatpipes confirmed for the exact retail SKU

The FPS Review identifies its sample explicitly as EVGA GeForce RTX 3060 XC BLACK GAMING, part number `12G-P5-3655-KR`. Its cooler description states four main central heatpipes that contact the GPU, plus two additional side heatpipes that move heat toward the side of the heatsink. The model package now separates these into six selectable semantic route nodes grouped as four main and two side paths. Their 3D centrelines, tube diameters, bend radii and flattened sections are still illustrative photo-estimated geometry, not manufacturing CAD. The four terminal faces from the LanOC cooler-end photograph remain a separate visual observation and are not confused with the six-tube count.

Source: https://www.thefpsreview.com/2021/03/03/evga-geforce-rtx-3060-xc-black-gaming-review/2/
