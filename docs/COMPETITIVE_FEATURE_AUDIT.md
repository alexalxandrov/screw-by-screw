# Competitive feature audit — Screw by Screw

Research snapshot: 25 November 2026. This is a feature study, not an endorsement or a claim that these products are identical.

## Reference products

| Reference | Useful pattern | Adopt for this project |
|---|---|---|
| [PC Anatomy](https://pc-anatomy.com/guide) | Nested scale tree, selectable parts, guided disassembly timeline, component explanations and source citations | Keep the assembly tree and component dossier; add guided teardown stages and per-subassembly views |
| [TEARDOWN](https://www.teardown.co.in/) | Distinct operating modes: take apart, run, break, cutaway; visible motion and flows | Run mode is the first implementation; failure and cutaway modes remain later milestones |
| [Modal GPU Glossary / GPU explorer](https://github.com/Kylejeong2/gpu) | Exterior vs architecture views, hierarchical zoom, links from parts to reference documentation | Add an architecture view for GA106, separate from the physical board model |
| [Vera Rubin 3D](https://github.com/bddicken/nvidia) | Connection tracing, colour-coded pathways, pinned selection, guided tour with camera framing | Adopt connection tracing and a guided tour, adapted to a consumer GPU |
| [GPU Doctor Boardview](https://gpudoctor.com/boardview) | Exact-board identity, reference-designator search, net tracing, top/bottom PCB layers, circuit and sequence views | Treat as a repair-grade target only after a verified PCB revision, BoardView and schematic are sourced |
| [PC Anatomy repository](https://github.com/Yoosseph/pc-anatomy) | Timeline-based automatic disassembly, component inventory and nested GPU teardown | Improve the exploded slider into named phases and a reversible timeline |

## Exact-SKU reconstruction evidence

The EVGA specification page for 12G-P5-3655-KR gives 201.8 mm length, 110 mm height, dual-slot width and one 8-pin input. The exact-SKU review by The FPS Review describes six heatpipes (four central and two lateral), an air-through PCB cutout and no backplate. The official EVGA XC / XC BLACK product overview also describes the air-through PCB design. Do not copy the metal backplate and different cooler geometry from the separate 12G-P5-3657-KR XC variant.

## Implemented in this iteration

- A true operating-mode toggle rather than only an exploded-view animation.
- Fan rotors are separated from stationary fan frames in both the procedural Blender model and fallback scene.
- The cooler now shows six photo-estimated heatpipe routes (four central, two lateral).
- The PCB has a photo-estimated rear air-through notch; its exact contour and dimensions remain unmeasured.
- A cyan path illustrates airflow toward the outlet cutout.
- Qualitative airflow particles and power-path pulses appear in their process layers and together in Run mode.
- Animation speed control (0.25×–2×).
- Reduced-motion preference support.
- Explicit metadata that overlays are educational directional cues, not CFD, a BoardView, SPICE or measured electrical paths.

## Next milestones

1. **Model fidelity:** dimensioned shroud and backplate, exact I/O bracket and connector geometry, fan frame/hub/blades, fin-stack layout, heatpipe/contact geometry, screw and standoff inventory, PCB outline and both sides.
2. **Evidence system:** source every physical claim; distinguish exact-SKU photographs, teardown observations, measured dimensions, manufacturer specifications and illustrative assumptions.
3. **Guided disassembly:** named phases, reversible timeline, camera focus and part inventory; support undo/reset and touch.
4. **Architecture view:** GA106 block diagram (not a literal die photograph), GPC/SM, RT/Tensor/CUDA cores, memory hierarchy, PCIe and display outputs.
5. **Repair view:** exact PCB revision, BoardView, net highlighting, reference designators, component values, voltage rails and power sequence. Do not synthesize these from generic RTX 3060 schematics.
6. **Operating and fault modes:** start/stop, fan stop/low/high states, heat-transfer explanation, sensor-like indicators only where a real data source exists, and staged failure lessons clearly labelled as educational.
7. **Quality:** model validation, screenshot baselines, mobile layout, accessibility, keyboard controls and performance budgets.

## Accuracy boundary

The present GPU geometry remains a reconstruction/blockout. A visual resemblance is not proof of exact dimensions or board layout. The animation is qualitative: it does not calculate RPM, airflow velocity, pressure, temperatures, current, voltage, switching waveforms or thermal resistance. A repair-grade circuit explorer requires the exact PCB revision and board-level source files.
