# RTX 3060 XC BLACK — deep component atlas tranche

Target: EVGA GeForce RTX 3060 XC BLACK GAMING 12GB
Retail part number: 12G-P5-3655-KR
Development branch: feat/rtx3060-deep-component-atlas
Geometry class: illustrative_proxy_not_cad
Status: engineering increment; not a complete card reconstruction

## What this tranche adds

The canonical model package and Blender GLB gain matching stable component IDs for the GA106 silicon die proxy; thermal-interface parent group, GPU compound marker, memory pads and power-stage pad group; four photo-positioned exact-SKU GPU-area screw meshes plus four exact-SKU rear-area screw nodes whose individual positions are not mapped; PCI Express edge interface with representative segmented contacts; two independent fan-cable header nodes; three DisplayPort and one HDMI receptacle nodes; selectable shunt-resistor area and generic passive group; and PCB airflow-cutout marker.

The package adds source-backed relations and claims where evidence exists, and keeps all component names and descriptions bilingual. The Blender scene uses matching sbs_component_id values and preserves the hierarchy declared in components.json.

## Evidence interpretation

| Area | Current status | What is not claimed |
|---|---|---|
| GPU die | visual proxy | exact die outline, dimensions, substrate stack |
| Thermal compound/pads | teardown-supported presence | brand, thickness, hardness, precise coverage |
| Cooler fasteners | eight exact-SKU screws reported (four around GPU, four near far/rear end); only four GPU-area centres are photo-positioned, rear four are logical-only | exact head/thread/driver/spring, rear coordinates, torque, reassembly order |
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
5. Review the complete exact-model teardown before authoring a complete service/removal sequence; the current three steps are explicitly partial observations only.
6. Add evidence-backed electrical and thermal diagrams; keep CFD, thermal FEA and SPICE as separate numerical projects.
7. Obtain asset reuse rights, then perform visual acceptance on the generated blend, glb and sbsmodel.

No exact board revision, undocumented value, repair procedure or physical simulation is invented in this tranche.


## Additional verified specification and board-photo tranche

The package now carries exact-SKU manufacturer claims for the 15,000 MHz effective memory clock, 550 W recommended system PSU, dual-slot width, 7680 × 4320 maximum digital resolution, and DisplayPort 1.4a / HDMI 2.1 output versions. The 170 W TGP claim is sourced to the Neoseeker review sample explicitly identified as 12G-P5-3655-KR. A PSU recommendation must not be confused with the card's own board power.

The component atlas also adds separate, individually selectable photo-estimated groups for two inductor candidates, capacitor packages, switching-device packages and a controller-IC candidate. They are visual navigation aids derived from PCB reference photographs; no phase topology, MOSFET model, controller part number, inductance, capacitance, voltage rating, PWM mapping or net routing is inferred. Their candidate status is deliberately weaker than an exact-revision BOM or BoardView identification.


## Fine-grained cooling decomposition

The canonical package now exposes **307 semantic components, 303 typed relationships, 96 claims and 14 registered sources**. This includes individually selectable fan frames, hubs and seven illustrative blade proxies per fan; 24 separate illustrative heatsink-fin proxies; six selectable heatpipe-route proxies grouped as four main GPU-contact pipes plus two side pipes; six memory-side thermal-pad proxies; and a VRM-side thermal-pad strip proxy.

These are independently selectable teaching meshes, not a claim that the exact hardware has seven blades per fan or 24 fins. The count and shapes are explicitly identified as proxy geometry. Thermal-pad position proxies are aligned to the six identified GDDR6 package positions; pad thickness, material, hardness and service dimensions remain unverified. Heatpipe paths and cross-sections likewise remain illustrative.


## Source-backed partial teardown sequence

The assembly evidence panel contains **three partial actions** grounded in exact-SKU-linked sources: (1) remove eight cooler/shroud retention screws reported by Tom's Hardware on the review sample whose rear-PCB identity photograph reads P/N 12G-P5-3655-KR (four around GPU and four near the far end; only the four GPU-area centres are photo-positioned in 3D); (2) disconnect both fan leads before separating the cooler, as shown in the exact-model Gamers Nexus teardown; and (3) remove three retaining screws from each independently replaceable fan, also shown in the Gamers Nexus teardown. The sequence remains `partial_observed_sequence` and `complete_sequence: false`. Four rear-area cooler screws and six fan screws preserve verified counts as `logical_only`; their individual coordinates are not invented. No driver size, torque, exact thread or reassembly procedure is inferred.


## Reversible exploded-assembly animation

A second package-authored animation clip, `clip.exploded-cooler-overview`, now moves the shroud, full cooling assembly, PCB/electronics assembly and connector assembly into separated display positions. It uses the generic `AnimationPlayer`, easing, seek, playback, stop/reset and the localized clip description. The clip is tagged `educational_approximation`; offsets are presentation coordinates and do not assert physical service clearances or a screw-by-screw removal order. A unit test checks every target's final transform and restoration, and the browser test selects, seeks and resets the clip.


## GA106 compute and GDDR6 architecture tranche

The semantic package now contains **307 components, 303 typed relationships, 96 claims and 14 registered sources**. Thirteen logical-only nodes represent the 28-SM GA106 cluster, its CUDA/Tensor/RT/TMU/ROP aggregates, a 192-bit GDDR6 interface and six logical interface presentation groups. Six Samsung K4ZAF325BM-HC16 GDDR6 package positions are separately selectable from exact-SKU-linked teardown/review material; no one-to-one mapping between package positions and interface presentation segments is asserted. The logical nodes carry `geometry_status: logical_only`: no physical die floorplan, shader wiring or PCB trace routing is drawn.

A third process layer, `gpu_compute`, exposes this architecture map in the viewer. Claims cover the published 28 SM / 112 Tensor / 28 RT / 112 TMU / 48 ROP configuration, 276 mm² and 12-billion-transistor GA106 die figures, Samsung 8N, and exact-SKU-linked memory package identity. Tom's Hardware identifies six Samsung K4ZAF325BM-HC16 devices on the 12G-P5-3655-KR sample; 16-Gbit density, 512M × 32 organisation and 180-FBGA package type remain secondary-catalog device attributes, not primary Samsung-datasheet claims. The viewer labels this as a logical map, not an architecture simulation.


## 13. Exact-SKU fastener evidence reconciliation

The LanOC review explicitly identifies **four heatsink mounting screws around the GPU** on the 12G-P5-3655-KR XC BLACK sample and shows the exposed PCB without a backplate. The first four screw meshes are now placed approximately from that exact-model photo and are tagged `visible_exact_model` / `illustrative_proxy`. Their head, thread, spring and torque remain unmeasured.

Tom's Hardware's eight-screw description is tied to the exact retail SKU by the rear-PCB identity photograph on the same review page, which reads P/N 12G-P5-3655-KR. Four screws are located around the GPU and four near the far end. The first four have photo-estimated positions; four additional rear-area screw nodes are exact-SKU semantic entries with `geometry_status: logical_only` until individual centres can be calibrated.

The disassembly panel now contains three exact-model partial actions: eight cooler/shroud retention screws (four around GPU and four near the far end), disconnecting both fan leads before cooler separation, and removing three retaining screws from each replaceable fan. Fan-screw positions are not mapped. The steps remain partial and are not a complete service manual.


## 14. GDDR6 package identity and mapping boundary

The Tom's Hardware teardown identifies six Samsung K4ZAF325BM-HC16 GDDR6 packages on the sample whose rear-PCB photo reads P/N 12G-P5-3655-KR. The part number is therefore exact-SKU-linked. The 16-Gbit density, 512M × 32 organisation and 180-FBGA package are transcribed from a secondary catalog and labelled `secondary_catalog_data`; the 16-Gbps rating is independently stated in the teardown. It is a device rating, distinct from the EVGA board's stock 15,000-MHz effective memory clock.

The EVGA 192-bit GDDR6 bus remains an exact-SKU manufacturer specification. Six interface presentation groups remain in the architecture tree, but they are not confirmed hardware channels and are no longer connected to the six package nodes. The exact electrical partition and BoardView mapping remain unknown.


## 15. Interactive thermal-path diagram

The cooling process layer now exposes a four-stage clickable diagram: heat source/contact interfaces, heat transport, fin-stack rejection, and airflow/mechanical envelope. Its 32 nodes reuse the canonical component IDs and link directly to the component detail pane. The diagram records the approximate reviewer measurements for the fan opening and impeller but labels the 3D fan centres, blade meshes, six heatpipe route proxies grouped four main plus two side, fin count, pad dimensions and outer shroud contour as illustrative or unknown. It does not calculate CFD, junction temperature, thermal resistance, fan curves, RPM, acoustics or heat-transfer performance.


## 16. Four visible copper heatpipe terminal faces

The exact XC BLACK cooler-end photograph in LanOC's review shows four separate copper terminal faces. Four individually selectable markers now exist under `cooling.heatpipes`. Their generated positions and disc dimensions are photo-estimated proxies. The claim deliberately counts **visible terminal faces**, not unique U-shaped heatpipes: two pipes can have four ends. The exact-SKU six-pipe count is established separately by The FPS Review (four main plus two side); 3D route centrelines, bends and terminal-face-to-pipe mapping remain illustrative.


## 17. Six heatpipes confirmed for the exact retail SKU

The FPS Review identifies its sample explicitly as EVGA GeForce RTX 3060 XC BLACK GAMING, part number `12G-P5-3655-KR`. Its cooler description states four main central heatpipes that contact the GPU, plus two additional side heatpipes that move heat toward the side of the heatsink. The model package now separates these into six selectable semantic route nodes grouped as four main and two side paths. Their 3D centrelines, tube diameters, bend radii and flattened sections are still illustrative photo-estimated geometry, not manufacturing CAD. The four terminal faces from the LanOC cooler-end photograph remain a separate visual observation and are not confused with the six-tube count.

Source: https://www.thefpsreview.com/2021/03/03/evga-geforce-rtx-3060-xc-black-gaming-review/2/


## 18. Fan-retention fasteners and three-step partial teardown

The exact-model Gamers Nexus teardown shows each independently replaceable fan retained by three screws, for six fan-to-frame screws total. The package adds six separate semantic fastener nodes, all `geometry_status: logical_only`, because the individual screw centres, head profile, thread, length and torque are not measured. These six screws are distinct from the eight cooler/shroud retention screws.

The assembly panel now records a third partial action after both fan leads are disconnected: remove three screws from each fan. This extends the evidence-backed observations but does not create a complete shroud-removal or reassembly procedure. The sequence remains `partial_observed_sequence` with `complete_sequence: false`.


## 19. GA10x TPC and individual SM architecture hierarchy

The NVIDIA Ampere GA10x architecture whitepaper specifies 128 CUDA cores, four third-generation Tensor Cores, four texture units, one second-generation RT Core, a 256 KB register file and 128 KB configurable L1/shared memory per SM. It also describes two SMs and one PolyMorph Engine per TPC. The RTX 3060 configuration's 28 SMs therefore imply 14 TPCs as a calculated logical grouping (28 / 2), not as a recovered physical floorplan.

The package exposes 14 numbered logical TPCs, each with two SM entries and one PolyMorph Engine; the 28 SMs each contain four separately selectable processing-partition nodes (112 total). TPC/SM/partition suffixes are navigation identifiers; no SM/TPC coordinates, GPC membership, disabled-unit placement, or GPC count is inferred. The process layer now links 191 components and has a 29-node diagram; it remains explicitly logical and not a cycle-accurate architecture simulation.

Source: NVIDIA, *Ampere GA10x GPU Architecture*, Figure 2 and page 10 (official PDF): https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf


## 20. Four processing partitions per GA10x SM

NVIDIA's official GA10x whitepaper describes each SM as four processing partitions (Figure 3, printed page 10). Each partition has an L0 instruction cache, one warp scheduler, one dispatch unit (32 threads per clock), a 16,384 × 32-bit register file (64 KiB), two FP32 datapaths, one third-generation Tensor Core, four LD/ST units and one SFU. The first datapath has 16 FP32 CUDA cores; the second has 16 FP32 CUDA cores and 16 INT32 lanes that may execute either FP32 or INT32. Therefore each partition can issue 32 FP32 operations per clock, or 16 FP32 plus 16 INT32 operations per clock. Four partitions yield 128 FP32 CUDA cores per SM.

The content hierarchy now models all 112 logical partitions individually under their respective SM nodes. Their IDs are stable inventory handles, not coordinates. The Blender generator exports them as logical-only assembly nodes, not as physical circuit geometry. Together with 14 logical TPC nodes, 14 PolyMorph Engine instances and 28 SM nodes, the architecture inventory remains explicitly distinct from a physical die reconstruction.


## 21. Expanded learning module

The bilingual package quiz now contains 12 questions. Four newly added questions cover the GA10x TPC composition (two SMs + one PolyMorph Engine), the four-way SM partition structure, the 64 KiB register file per partition (16,384 × 32-bit), and one third-generation Tensor Core per partition. They are source-linked to NVIDIA's architecture whitepaper and keep the distinction between a logical architecture model and a physical die layout.


## 22. Exact-SKU CAD catalogue lead — not yet an asset

The WIN SOURCE product page identifies EVGA `12G-P5-3655-KR` and displays an “Ultra Librarian 3D Model” label. However, the captured HTML contains no actionable `href`, file URL or download endpoint for the model. The main product image is a generic placeholder, and the page explicitly warns that product images are for reference only. The source is therefore registered as `unverified_cad_asset_lead`; no CAD file was retrieved, imported, redistributed or used to generate geometry. Exact card/PCB geometry remains unverified.

Source: https://win-source.net/products/detail/evga/12g-p5-3655-kr.html


## 23. Exterior materials, airflow cutout and I/O detail

The exact-XC-BLACK LanOC review describes a black plastic shroud with a lightly textured upper zone and dotted recess areas around the fans, no RGB lighting, an aluminium vertical-fin heatsink, and a copper contact plate broad enough to cover the GPU and memory. It also describes a large through-PCB cutout near the card end/left side that lets air from the front fan pass through the board area. The model now records these as source-backed claims and expands component descriptions; the mesh contours, wall thickness, fin pitch/count, plate outline and cutout dimensions remain proxy/unknown.

Neoseeker identifies its review sample as `12G-P5-3655-KR` and documents three DisplayPort 1.4a outputs plus one HDMI 2.1 output. These connector versions and counts are added as explicit claims. LanOC also notes raised EVGA E-logo bumps on the fan blades with a golf-ball-like texture; these details are documented but not yet reconstructed in the proxy mesh.
