# Screw by Screw — v0.6 product and engineering roadmap

**Base:** RTX 3060 XC BLACK v0.5.  
**Status:** proposed next iteration; no precision-CAD or numerical-simulation claim.

## Product direction

Evolve the current viewer from a model inspector into a small engineering workspace. Retain the local-first standalone HTML launch, stable model packages, source/provenance graph and exact-SKU identity.

## v0.6 interaction priorities

1. **Camera presets:** front/fan side, rear/PCB side, I/O bracket edge, connector edge, top and isometric. Each preset must preserve the current model and selection.
2. **Section view:** adjustable X/Y/Z clipping plane and position control. Distinguish a visual section from a physically closed CAD section; do not fabricate cap surfaces through incomplete meshes.
3. **Exploded timeline:** authored, reversible steps with target component IDs, camera focus and explanatory text. No repair/disassembly step until the full exact-model teardown sequence is reviewed.
4. **Measurement and calibration:** on-screen point-to-point measurements in model units, calibrated photo references, and an evidence class for every derived measurement.
5. **Component and source search:** search by name, stable ID, package marking, claim, source and reference designator when verified.
6. **Revision comparison:** compare exact SKUs and PCB revisions without merging geometry or claims between them.
7. **Thermal visualization:** optional educational gradient or numeric field only when its input assumptions are visible. Separate measured sensor values, calculated estimates and illustrative gradients.
8. **Package and data export:** canonical component inventory and BOM export only where a source-backed BOM exists.

## Competitor-derived interaction patterns

- PC Anatomy: component-card context, layered hardware inspection and step-by-step assembly guide.
- Airframe: fan controls, section maps, thermal/pressure presentations, editable conditions and local export.
- Branch Education: research-led storyboard, synchronized 3D explanations and visual accuracy review.
- EmuPath: model-level teardown catalogue, search and consistent interactive 3D experiences.
- iFixit: evidence-backed disassembly sequence and fastener/access detail.

Screw by Screw should combine the useful patterns around a single provenance model rather than recreate separate feature silos.

## Non-negotiable technical boundaries

- Airflow particles remain a directional teaching overlay, not CFD.
- Current pulses remain schematic, not PCB copper routes, pin mapping, SPICE or measured amperage.
- Temperature is not displayed as measured without actual telemetry or a source-backed test.
- Geometry stays labelled `illustrative_proxy_not_cad` until measured or licensed CAD is available.
- PCB-specific VRM topology, reference designators and traces require the exact PCB revision plus BoardView/schematic/BOM evidence.
- External source images, video frames and CAD require documented reuse rights.

## Acceptance gate

No feature is marked complete only because its control appears. Each new interaction needs:
- a documented model-data contract;
- a reversible state transition;
- keyboard and reduced-motion behaviour;
- browser tests;
- standalone `file://` validation;
- an owner visual review on the generated v0.6 model.
