# EVGA RTX 3060 XC BLACK content package

> **Publication status: research archive.** This package is excluded from the public model catalogue and is not currently an approved reference model. Exact PCB revision, complete fastener map and a fully reconciled source-backed removal sequence remain unverified. The research data is retained for future review; do not present its proxy geometry or partial teardown observations as a complete service atlas.

**Exact SKU:** `12G-P5-3655-KR`  
**Status:** draft / educational proxy  
**Geometry:** `illustrative_proxy_not_cad`

This package separates device identity, component instances, relationships, process layers, source provenance, assembly observations and learning prompts.

## Validate

```bash
python tools/content/build_release_manifest.py content/models/evga-rtx3060-xc-black-12gb
python tools/content/validate_model_package.py content/models/evga-rtx3060-xc-black-12gb
```

The manifest builder hashes every JSON content file. The validator checks SHA-256 integrity, bilingual component names, unique IDs, acyclic parent references, relationship endpoints, atomic claim provenance, source references, process-layer links, teardown observations and quiz answer indices.

## Evidence rules

- Manufacturer specifications, reviewer observations, teardown evidence, illustrative geometry and unknowns remain separate evidence classes.
- The 201.8 mm length is a nominal published value; it is not treated as the maximum outer-shroud extent.
- Six Samsung K4ZAF325BM-HC16 GDDR6 packages are identified in the Tom's Hardware teardown; the rear-PCB photo on the same review page reads P/N 12G-P5-3655-KR. Package centres remain photo-estimated. The 16-Gbit density, 512M × 32 organisation and 180-FBGA package type are secondary-catalog attributes, not primary Samsung datasheet values; they use the separate `secondary_catalog_data` evidence class.
- The 24 heatsink fins in the current model are illustrative proxies, not a measured fin count.
- The assembly panel contains five partial exact-model teardown observations: (1) four spring-loaded GPU cooler screws; (2) a separate pair retaining the fin-stack base; (3) two narrow I/O-bracket screws with reverse-side nuts plus three display-output retaining screws (the teardown uses a Phillips #0 driver for the latter); (4) disconnect both fan leads before separating the cooler; and (5) remove three retaining screws from each replaceable fan. These observations are not a complete service procedure. Tom's Hardware separately reports an eight-screw cooler/shroud aggregate on a sample whose rear-PCB label reads P/N 12G-P5-3655-KR; its overlap with the Gamers Nexus groups is unresolved, so counts are not added together. Unmapped positions remain logical-only; driver size outside the documented display-output screws, torque, thread details, thermal-pad replacement dimensions and reassembly order remain unverified.
- No third-party images or video frames are redistributed in this package.


## Fan rotor animation

The content model exposes two illustrative rotor pivot components as children of the fan assemblies. The generated GLB and local fallback scene keep each annular frame and hub static while only the separate impeller node rotates. One educational clip demonstrates a single visual revolution over 3.2 seconds. The duration is a playback choice, not measured RPM; blade profile and blade count remain proxies. The package release manifest includes animations.json in its SHA-256 file set.


## Deep component atlas development tranche

The feat/rtx3060-deep-component-atlas branch expands the pilot beyond its original 24 semantic components. It adds selectable GPU-die, thermal-interface, candidate-fastener, PCIe-edge, fan-header, individual display-port, shunt-area, generic-passive and PCB-airflow-cutout entries with matching Blender scene nodes. Every new element carries English/Russian labels and an explicit evidence/geometry status.

This is not yet a complete engineering reconstruction. Eight cooler/shroud retention screws are reported for the exact 12G-P5-3655-KR sample: four around GPU and four near the far end. Only four GPU-area centres are photo-positioned; four additional rear-area nodes are exact-SKU semantic items with `geometry_status: logical_only` until their individual coordinates can be calibrated. The candidate EVGA232 REV 1.0 board marking and PG190-A02 schematic lead do not establish the physical PCB identity. No pinout, VRM phase count, component values, fan RPM, screw torque or thermal-pad thickness is inferred.


### Fine-grained cooling decomposition

The development branch now expands the content graph to **325 semantic components, 324 typed relationships, 122 atomic claims and 31 sources**. Fan frames, hubs and eight photo-counted blade proxies per fan are separately selectable; the illustrative heatsink has 24 separately selectable fin proxies; six separate heatpipe route proxies record The FPS Review's four central plus two side runs; they do not establish six separate closed U-shaped tube loops; and six memory thermal-pad proxies plus one VRM pad strip have their own IDs. The eight-blade count is a retail-photo observation for this exact SKU, not a factory drawing; blade shape and all fin/thermal-pad dimensions remain proxies or unknown.


### Partial teardown evidence

The interactive assembly panel contains five partial exact-model teardown observations: (1) four spring-loaded GPU cooler screws; (2) a separate pair retaining the fin-stack base; (3) two narrow I/O-bracket screws with reverse-side nuts plus three display-output retaining screws (the teardown uses a Phillips #0 driver for the latter); (4) disconnect both fan leads before separating the cooler; and (5) remove three retaining screws from each replaceable fan. These observations are not a complete service procedure. Tom's Hardware separately reports an eight-screw cooler/shroud aggregate on a sample whose rear-PCB label reads P/N 12G-P5-3655-KR; its overlap with the Gamers Nexus groups is unresolved, so counts are not added together. Unmapped screw positions remain logical-only; driver size outside the documented display-output screws, torque, thread details, thermal-pad replacement dimensions and reassembly order remain unverified.


### Reversible exploded assembly view

A second animation separates the fan shroud, cooler, PCB/electronics and connector groups so that the card's major layers can be inspected. The animation is reversible, seekable and resettable. It is an explanatory layout, not a measured clearance or an instruction sequence.


### GA106 and GDDR6 architecture

The model package adds a separately selectable logical architecture tree: 28 SMs, aggregate CUDA/Tensor/RT/TMU/ROP units, and the published 192-bit memory interface. The exact-SKU-linked Tom's Hardware teardown identifies six Samsung K4ZAF325BM-HC16 GDDR6 packages. The 16-Gbit density, 512M × 32 organisation and 180-FBGA package attributes come from a secondary catalog and use `secondary_catalog_data`, not manufacturer-data confidence. Six interface presentation segments are logical navigation groups only; they are not mapped to physical packages or PCB nets.


### Fastener evidence correction

The exact-SKU-linked Tom's Hardware teardown reports eight cooler/shroud retention screws on the sample whose rear-PCB label reads P/N 12G-P5-3655-KR: four around the GPU and four near the far end. The LanOC exact-XC-BLACK review shows the central four-screw subset. Those four meshes are photo-positioned proxies; four additional rear-area nodes preserve the exact-SKU count as `logical_only` entries because their individual coordinates are not mapped.


### GDDR6 identity and bus mapping boundary

The exact-SKU-linked Tom's Hardware teardown identifies six Samsung K4ZAF325BM-HC16 GDDR6 packages and states a 16-Gbps device rating. A secondary catalog supplies 16-Gbit density, 512M × 32 organisation and 180-FBGA package details. The EVGA-published 192-bit interface remains separate from the six logical presentation groups; no package-to-controller net or channel mapping is claimed.


### Four visible heatpipe terminal faces

The exact XC BLACK cooler-end photograph shows four copper terminal faces. They are now separately selectable in the viewer. The four-face count is distinct from the exact-SKU six-pipe count supported by The FPS Review (four central GPU-contact pipes plus two side pipes). Four visible terminal faces do not imply four unique pipes; route geometry remains illustrative.


### Exact-SKU heatpipe route/run descriptions

The FPS Review explicitly identifies its sample as 12G-P5-3655-KR and describes four central GPU-contact runs plus two side runs. These six selectable route proxies do not establish six independent closed U-shaped tubes. PCWorld names the XC Black Gaming sample but describes four copper heatpipes; Gamers Nexus narrates two central tube paths through the GPU contact plate. These may reflect different counting conventions. The unique physical loop count remains unknown. Four visible copper terminal faces in the LanOC cooler-end image are recorded as a separate observation. OEM fan part identity remains unknown; aftermarket compatibility listings disagree on dimensions.


### Fan fastener evidence

Gamers Nexus' exact-model teardown shows three retaining screws per independently replaceable fan. The model represents six fan-mount fasteners as separate semantic nodes with `geometry_status: logical_only`; their centres, thread, head, length and torque remain unknown. These are separate from the eight cooler/shroud retention screws. The fifth partial assembly observation records this limited observation without presenting a complete fan or cooler service procedure.


### GA10x logical SM hierarchy

The architecture tree now exposes 14 logical TPC instances, each with two SMs and one PolyMorph Engine; all 28 SMs expand into four processing partitions each, for 112 individually selectable partition nodes. NVIDIA's GA10x whitepaper supplies per-SM counts and TPC composition: 128 CUDA, four Tensor, four texture, one RT, 256 KB register file and 128 KB L1/shared memory per SM; two SMs and one PolyMorph Engine per TPC. Fourteen TPCs is calculated from 28 configured SMs. None of these nodes has a physical die position or implies a recovered GA106 floorplan/GPC arrangement.


### Learning module

The bilingual learning quiz contains 17 source-linked questions, including the new TPC and per-SM processing-partition structure, datapath resources and register-file organization documented by NVIDIA's GA10x architecture whitepaper.


### Exterior and airflow observations

The exact-SKU review documents the black plastic no-RGB shroud, vertical aluminium fin stack, copper plate broad enough to cover GPU and memory, and large through-PCB airflow cutout. Neoseeker's exact sample identifies three DisplayPort 1.4a ports and one HDMI 2.1 port. These are source-backed descriptions only; model contours and dimensions are not a manufacturing CAD reconstruction.


The PCB airflow cutout is now a Boolean through-hole proxy rather than an overlay marker. Its 18 × 22 mm rounded-rectangle dimensions and centre remain illustrative, not measured; they are not manufacturing or BoardView data.


A separate source-backed claim records PC Perspective's 1905 MHz transient peak during Metro Exodus at 2160/high. The review identifies an EVGA RTX 3060 12GB XC BLACK sample but does not disclose its retail part number; the value is therefore a measured product-family sample observation, not a guaranteed frequency or a replacement for the 1777 MHz EVGA boost specification.


The model also exposes Gamers Nexus' rough approximately 6 mm estimate for two central heatpipe tube runs as a teardown observation only. It is not calibrated and is not applied to every route proxy.


### Unpopulated PCB memory locations

Tom's Hardware reports two unused memory locations on the teardown PCB sample linked to P/N 12G-P5-3655-KR by the rear-PCB identity photograph. The package represents these as a parent group with two separate logical-only positions, distinct from the six fitted Samsung GDDR6 packages. Their pad geometry, individual coordinates, electrical routing, compatibility and population potential are unknown; this is not a memory-upgrade claim.


### Dedicated NVENC / NVDEC media engines

The canonical graph adds one logical-only NVENC node and one logical-only NVDEC node beneath the GA106 die, supported by NVIDIA's GeForce RTX 3060 desktop Video Encode and Decode Support Matrix and Video Codec SDK documentation. The matrix lists one 7th-generation NVENC and one 5th-generation NVDEC for this GPU family: H.264/HEVC encode and decode, AV1 decode, and no AV1 encode for this generation. Codec profile, chroma-format and bit-depth limits remain those in NVIDIA's matrix columns.

A fifth selectable process layer presents the media-engine path from the host-facing PCIe endpoint through NVDEC, frame surfaces/GDDR6 and optional shader processing to NVENC. It is a logical architectural teaching map, not an EVGA PCB schematic or performance simulation. No physical die placement, cache path, memory-copy topology, bitrate, throughput, latency, concurrent-session limit, power or thermal behaviour is inferred.


## Publication and evidence status

This package is retained as a research archive and is excluded from the public catalogue and standalone package embeds. The exact PCB revision, complete fastener inventory and one reconciled full service sequence are not established. Existing claims and partial teardown observations remain useful research data, but they do not meet the current publication gate. No geometry or service order should be presented as a confirmed physical specimen without revision-matched primary evidence.
