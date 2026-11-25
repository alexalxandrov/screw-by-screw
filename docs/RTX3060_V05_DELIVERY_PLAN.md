# EVGA RTX 3060 XC BLACK — v0.5 scope and acceptance

**Exact target:** EVGA GeForce RTX 3060 XC BLACK GAMING 12GB  
**SKU:** `12G-P5-3655-KR`  
**Geometry class:** `illustrative_proxy_not_cad` — unchanged.

## v0.5 changes
- Add a selectable heatpipe assembly. Existence is teardown-supported; generated count, route and diameter remain illustrative.
- Add one selectable power-conversion zone with unnumbered placeholder geometry. It is not a verified VRM phase layout.
- Add Power On / Off state, fan rotation and directional airflow / power pulses.
- Keep process overlays independent of model meshes, so component selection remains available.
- Add animation-speed control and respect `prefers-reduced-motion`; static paths remain visible.
- Keep root `index.html` as the no-server launch target.

## Evidence boundary
| Subject | Supported now | Not established |
|---|---|---|
| Dual fans | Exact-model visual / teardown | Exact centres, RPM curve, blade profile |
| Heatpipes / copper contact | Exact-model review and teardown | Pipe count, routing, diameter and material specification |
| PCB power conversion | Conceptual architecture only | Exact PCB revision, phase topology, component locations, values and nets |
| Airflow animation | Qualitative visual path | CFD, velocity, pressure, recirculation or fan curve |
| Current animation | Schematic directional path | Pin-level traces, amps, ripple, switching waveform or SPICE |
| Geometry | Nominal manufacturer dimensions and reviewer observations | Complete native CAD or metrology-grade measurements |

## Acceptance gates
1. Blender v0.5 generates a valid GLB with every canonical content ID exactly once.
2. The heatpipe and power-stage groups are selectable, searchable and linked to canonical relationships.
3. Browser tests verify Power On / Off, speed control and both overlays while powered.
4. Chromium, Firefox smoke, accessibility and standalone `file://` launch checks pass.
5. Root HTML embeds the latest v0.5 GLB and has no external runtime CSS/JS.
6. No interface or document describes the overlays as CFD, actual circuit traces or repair instructions.
7. Owner visual review remains mandatory before calling the geometry complete.

## Remaining requirements for a physically complete model
- Calibrated front/rear/edge photographs or physical sample of exact `12G-P5-3655-KR`.
- Readable PCB silkscreen and revision.
- Orthogonal measurements for shroud, PCB, fans, bracket, fasteners and cooler.
- Exact-board BoardView / schematic and a verified BOM before naming or routing individual power-stage components.
- Full exact-SKU teardown review before authoring screw-by-screw removal steps.
- Publication rights for every external CAD, image, drawing and manual.

An educational proxy can be a useful interactive learning object. It is not an accurate CAD assembly until the missing dimensional and board-identity evidence is obtained.
