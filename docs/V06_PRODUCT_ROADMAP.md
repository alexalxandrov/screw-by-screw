# Screw by Screw — v0.6 product and engineering roadmap

**Base:** RTX 3060 XC BLACK v0.5.  
**Status:** v0.6 interaction slice implemented on the RTX 3060 pilot; visual owner acceptance remains pending. No precision-CAD or numerical-simulation claim.

## Product direction

Evolve the current viewer from a model inspector into a small engineering workspace. Retain the local-first standalone HTML launch, stable model packages, source/provenance graph and exact-SKU identity.

## Delivered in the current v0.6 interaction slice

- **Camera presets:** isometric, fan side, PCB side, I/O bracket, power connector and top. Presets work on imported model scenes and preserve the current model/selection.
- **Section view:** global Three.js clipping plane with X/Y/Z axis and 0–100% position controls. The cut is intentionally uncapped; it is a visual section, not a closed CAD section.
- **Operating animation:** two independently rotating fan impellers, directional airflow and schematic power pulses; animation speed and reduced-motion handling are tested.
- **Standalone operation:** the root `index.html` is rebuilt with the bundled v0.5 GLB and the new viewer controls; direct `file://` launch is part of browser testing.

## Newly added viewer capability

- **Model-space ruler:** two-click point-to-point measurement with visible markers and a connecting line, unit labels from package metadata, reset, keyboard exit and an explicit warning that proxy dimensions are not verified physical dimensions. The tool does not calibrate or persist measurements.

## Remaining v0.6 priorities

1. **Exploded timeline:** authored, reversible steps with target component IDs, camera focus and explanatory text. No repair/disassembly step until the full exact-model teardown sequence is reviewed.
2. **Measurement calibration:** calibrated photo references, registered reference planes, uncertainty bounds, and an evidence class for every derived measurement. The current ruler reports model-space distances only.
3. **Component and source search:** search by name, stable ID, package marking, claim, source and reference designator when verified.
4. **Revision comparison:** compare exact SKUs and PCB revisions without merging geometry or claims between them.
5. **Thermal visualization:** optional educational gradient or numeric field only when its input assumptions are visible. Separate measured sensor values, calculated estimates and illustrative gradients.
6. **Package and data export:** canonical component inventory and BOM export only where a source-backed BOM exists.

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
