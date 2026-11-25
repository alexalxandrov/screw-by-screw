# Competitor benchmark — interactive hardware and engineering explainers

**Research date:** 2026-11-25.  
**Scope:** product interaction patterns; not a legal or license review.

| Reference | Observed pattern | What Screw by Screw should adapt | Boundary |
|---|---|---|---|
| [PC Anatomy](https://github.com/brickshow/pc-anatomy) | Interactive 3D explorer, component cards, CPU layer explosion, assembly guide and hardware learning pages | Persistent component graph linking tree, selection, power path and airflow | Its GPU architecture and assembly views are not a verified board-level PCB netlist |
| [Airframe / PC Cooling Simulation](https://github.com/deviverr/pc-cooling-simulation) | Editable 3D fan positions/orientations, three-plane airflow maps, relative pressure/velocity/heat maps, thermal estimates, PSU and cable planner | Process layers, playback controls, section view and later qualitative thermal fields | Airframe itself describes a coarse pressure projection and separate simplified thermal estimates; Screw by Screw overlays must remain qualitative until calibrated |
| [Branch Education](https://www.branch.education/how) | Exploded views, staged explanation and educational narrative | Explain input → conversion → GPU load → heat generation → heat rejection | Narrative animation is not a specification or measurement |
| [EmuPath Hardware Lab](https://emupath.com/hardware-lab) | Hardware catalogue with model-specific 3D teardown experiences | Treat exact SKU/revision as first-class identity; link detail cards and evidence | Catalogue breadth does not guarantee PCB fidelity |
| [GPU Explainer](https://github.com/podocarp/gpu-explainer) | Multi-level GPU exploration, exploded states, slice plane and power explanation | Exterior, cooler, PCB, process flows and later die/architecture layers | Architecture diagrams must not be mistaken for PCB circuitry |
| [iFixit Teardowns](https://www.ifixit.com/Teardown) | Service sequences, fastener identification and access order | Add a sourced disassembly timeline after reviewing the full exact-SKU teardown | Do not infer removal steps or copy protected images |

## Feature roadmap

### Delivered in this pass
- Power On / Power Off state and fan animation.
- Directional airflow and schematic power-path overlays.
- Adjustable animation speed and reduced-motion support.
- Selectable heatpipe group and power-conversion zone.
- Explicit evidence and simulation-limit labels.

### Next engineering passes
- Camera presets: exterior front/rear, fan plane, PCB face and connector edge.
- Adjustable slice plane with capped intersections where mesh topology permits.
- Reversible step timeline with component focus.
- Exact-SKU / revision comparison.
- Measurement and image calibration tools.
- Search over part name, ID, claim, source and reference designator.
- Thermal overlay separating measured data, calculated fields and illustrative gradients.
- BOM export only after a source-backed BOM is available.

## Product principle
The differentiator is the traceable chain:
**device identity → component instance → geometry node → physical/electrical/thermal relationship → explanation → evidence and uncertainty**.

This combines patterns observed in the listed products; it does not claim that any one interaction is unique.
