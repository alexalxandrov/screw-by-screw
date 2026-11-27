# Screw by Screw — v0.6 product and engineering roadmap

**Target pilot:** EVGA RTX 3060 XC BLACK GAMING 12GB, exact retail SKU `12G-P5-3655-KR`  
**Status:** v0.6 interaction slice implemented and being hardened; deep GPU component atlas in progress  
**Geometry class:** `illustrative_proxy_not_cad`  
**Release posture:** no precision-CAD, repair-manual or numerical-simulation claim

## Product direction

Evolve the viewer from a model inspector into a local-first engineering workspace. Retain standalone HTML launch, portable model packages, stable component IDs, the source/provenance graph and exact-SKU identity.

The pilot is an evidence-linked educational model. Its component inventory deliberately includes visual proxy meshes and logical-only nodes; a larger inventory is not a claim of greater physical measurement accuracy.

## Viewer capabilities implemented

- **Camera presets:** isometric, fan side, PCB side, I/O bracket, power connector and top.
- **Section view:** reversible X/Y/Z clipping plane with position control; uncapped visual clipping, not a closed CAD section.
- **Selection and inspection:** hierarchical component selection, isolation/restoration, bilingual cards, atomic claims and typed source-linked relationships.
- **Search:** component names, stable IDs, claim values, markings and source metadata.
- **Model-space ruler:** two-point distance with visible markers, reset and keyboard exit; explicitly not a physical calibration tool.
- **Process overlays:** qualitative cooling/airflow, schematic power-path presentation, logical GA106 graphics workloads/display paths, and dedicated NVENC/NVDEC video-codec engines. These maps are not CFD, thermal FEA, SPICE, electrical net tracing, instruction timing, codec-performance simulation or telemetry.
- **Assembly evidence:** source observations are displayed separately from authored procedural steps.
- **Package-authored animation:** clip selection, play/pause, seek, speed, completion and deterministic stop/reset with transform restoration. Pilot clips are a one-turn educational rotor motion and a reversible exploded-cooler overview.
- **Standalone operation:** root `index.html` is intended to run directly from `file://`; generated model package is bundled when available at build time.

## Current RTX 3060 pilot inventory

The canonical package currently contains **325 semantic components, 324 typed relationships, 122 atomic claims and 31 registered sources**. It has five process layers, 17 bilingual learning questions and two authored animation clips.

The cooling inventory includes two fans, eight photo-counted visible blade-surface proxies per fan with low-relief E-like markers, raised hub badge proxies, simplified EVGA / GEFORCE RTX shroud wordmarks, 24 illustrative fin proxies, six selectable heatpipe run proxies and separate thermal-interface markers. Fan profile, centres, exact logo vectors, OEM fan identity, fin count/pitch, pad footprint and thickness, heatpipe loop count and routing remain unverified.

The power layer exposes an auxiliary-input current-sense shunt observed at 5 mΩ, a separate PCIe-slot shunt with unknown resistance, one teardown-observed fuse with unknown rating, a MOSFET/copper-contact region and two inductor packages discussed in a tentatively identified memory-VRM area. It does not infer controller identity, phase count, net routing or component values.

The GPU architecture layer exposes 14 logical TPC groupings, 28 SM entries and 112 processing-partition entries, alongside aggregate CUDA/Tensor/RT/TMU/ROP resources and the 192-bit GDDR6 interface. Separate logical-only nodes represent one 7th-generation NVENC and one 5th-generation NVDEC, with NVIDIA's RTX 3060 codec capability matrix. These are logical architecture hierarchies, not a physical GA106 floorplan. Six memory-interface presentation groups are not mapped one-to-one to six physical memory packages.

## Partial teardown evidence

Five observations from the exact-model Gamers Nexus teardown are separately represented:
1. Four spring-loaded GPU cooler screws.
2. A separate pair of fasteners for the fin-stack base.
3. Two narrow I/O-bracket screws with reverse-side nuts and three display-output retaining screws; the teardown uses a Phillips #0 driver for the latter.
4. Disconnect both fan leads before separating the cooler.
5. Three screws for each independently replaceable fan.

These observations are not a complete removal or reassembly procedure. Tom's Hardware separately reports an eight-screw cooler/shroud aggregate on a review sample whose rear-PCB identity photograph reads P/N `12G-P5-3655-KR`. Its overlap with the Gamers Nexus fastener groups is not established, so the counts must not be added together. Four GPU-area screw centres have photo-positioned proxies; unmapped fasteners remain logical-only. Additional shroud screws remain an uncertain 4-or-6 candidate.

## Individual screw-level inventory

The latest package turns the two fin-stack base screws, two I/O-bracket screw-and-nut fasteners, and three display-output retaining screws into seven separate stable component IDs. All seven remain logical-only because their individual positions and dimensions are not mapped. This keeps the viewer granular without inventing a physical screw map.

## Remaining v0.6 / v0.7 engineering priorities

1. **Complete teardown evidence review:** inspect all available exact-model teardown segments and link each observation to its component, source locator, uncertainty and prerequisites. Do not turn sparse observations into an invented service sequence.
2. **Mechanical reconstruction:** separate nominal card envelope from shroud overhang; improve PCB, shroud, fan, heatsink, contact plate, I/O bracket and fastener proxies using calibrated views or physical measurements.
3. **Cooling assembly:** resolve heatpipe counting conventions and distinguish full closed loops, legs, visible terminal faces and reviewer-described runs. Keep all unmeasured routing and fin geometry as proxies.
4. **Exact-board identity:** identify physical PCB silkscreen and revision from an exact retail sample; reconcile the EVGA232 REV 1.0 image lead before searching by board identifier.
5. **Board-level electrical atlas:** obtain a legally usable BoardView/schematic/BOM for the exact revision. Until then, retain the power layer at qualitative block-diagram level and do not import data from related EVGA XC variants.
6. **Thermal-pad evidence:** reconcile each visible contact patch to an identified device only when the evidence supports it; do not publish replacement thickness, hardness or material specifications from ambiguous observations.
7. **Measurement calibration:** add registered reference planes, uncertainty bounds and a provenance class for every derived measurement. The current ruler remains model-space only.
8. **Revision comparison:** semantic comparison is implemented for validated packages, covering exact model identity, nested specifications, source-backed claims and component-inventory coverage. Geometry overlays and physical revision claims remain out of scope without exact CAD/PCB evidence.
9. **Package export:** add BOM export only when a source-backed BOM exists; keep unknown reference designators and values explicit.
10. **Validation recovery:** execute all current-head CI jobs, preserve logs/artifacts, and close test failures before treating the branch as release-ready.

## Non-negotiable technical boundaries

- Airflow particles are directional educational markers, not CFD.
- Power pulses are schematic, not PCB copper routes, pin mapping, SPICE or measured amperage.
- Temperature and fan RPM are not displayed as continuous telemetry without a live sensor or source-backed measurement.
- One review operating point (fan duty/RPM, temperatures and board power) is sample/workload evidence, not the factory fan curve or universal operating specification.
- Geometry remains `illustrative_proxy_not_cad` until calibrated measurement or licensed CAD is available.
- PCB-specific VRM topology, reference designators, component values and traces require exact board revision plus matching BoardView/schematic/BOM evidence.
- External source images, video frames and CAD require documented reuse rights.

## Acceptance gate

No new feature is complete solely because a control appears. Each capability requires:
- a documented model-data contract and stable component IDs;
- a reversible state transition where applicable;
- keyboard and reduced-motion behaviour;
- unit and browser tests;
- standalone `file://` validation;
- source/evidence labels and explicit unknown values;
- current-head CI execution;
- eventual owner visual review before 1.0.

## Animation contract

The generic runtime validates clips from `animations.json` and supports clip selection, play/pause, normalized seek, playback speed, completion and deterministic stop/reset. Tracks target stable component IDs and carry evidence metadata. The rotor clip is illustrative and not measured RPM. The exploded-cooler overview uses presentation offsets, not service clearances or a removal order.


The PC Perspective review additionally reports an observed peak of **1905 MHz** in Metro Exodus at 2160/high. This is a measured XC BLACK review-sample value, not the EVGA 1777 MHz stock boost specification; the review does not state the retail `12G-P5-3655-KR` part number. The claim is deliberately marked as sample evidence, not an exact-SKU guarantee.


A Gamers Nexus verbal estimate of approximately 6 mm applies only to the two central visible heatpipe tube runs and is retained as an uncalibrated teardown observation, not a universal tube dimension.


The GDDR6 layer now separately exposes two unused memory locations described in the exact-SKU-linked teardown sample. They are not counted as populated packages, and their electrical routing, pad geometry and compatibility remain unknown.


### Evidence-bounded power layer

The power-path layer now includes a four-group selectable map of the input connectors, two current-sense shunts and fuse, observed MOSFET/copper-contact and inductor area, and GPU/GDDR6 loads. It retains the 5 mΩ value only for the auxiliary 8-pin shunt; the PCIe-slot shunt resistance remains unknown. The map is qualitative, not a VRM phase diagram or PCB netlist.
