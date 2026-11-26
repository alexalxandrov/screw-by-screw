# Screw by Screw — v0.6 product and engineering roadmap

**Base:** RTX 3060 XC BLACK v0.5.  
**Status:** v0.6 interaction slice implemented on the RTX 3060 pilot; visual owner acceptance remains pending. No precision-CAD or numerical-simulation claim.

## Product direction

Evolve the current viewer from a model inspector into a small engineering workspace. Retain the local-first standalone HTML launch, stable model packages, source/provenance graph and exact-SKU identity.

## Delivered in the current v0.6 interaction slice

- **Camera presets:** isometric, fan side, PCB side, I/O bracket, power connector and top. Presets work on imported model scenes and preserve the current model/selection.
- **Section view:** global Three.js clipping plane with X/Y/Z axis and 0–100% position controls. The cut is intentionally uncapped; it is a visual section, not a closed CAD section.
- **Operating animation:** two independently selectable fan impeller pivots, directional airflow and schematic power pulses; a package-authored educational one-turn rotor clip is available alongside the separate procedural Power On effect. The clip is explicitly not an RPM or physical-simulation claim.
- **Standalone operation:** the root `index.html` is rebuilt with the bundled v0.5 GLB and the new viewer controls; direct `file://` launch is part of browser testing.

## Newly added viewer capability

- **Typed component relationships:** the component inspector shows incoming and outgoing graph edges, localized relationship semantics, linked-component navigation, certainty labels and registered source links. Relationships without a source are explicitly marked as such.

- **Source-backed claim cards:** component and device cards display atomic specification claims with their value, evidence class, explicit unknown state, notes and direct source links. Claims are filtered by the selected component instance; model-level claims appear on the top-level device.

- **Model-space ruler:** two-click point-to-point measurement with visible markers and a connecting line, unit labels from package metadata, reset, keyboard exit and an explicit warning that proxy dimensions are not verified physical dimensions. The tool does not calibrate or persist measurements.

## Remaining v0.6 priorities

1. **Complete teardown evidence:** extend the three existing partial source-backed actions only after reviewing the complete exact-model teardown and mapping each additional fastener, connector, prerequisite and safety constraint. Current evidence is not a complete removal or reassembly procedure.
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


## Assembly evidence and step authoring

The viewer has a model-package-driven disassembly evidence panel. It displays authored, source-backed assembly steps separately from source observations. The RTX 3060 pilot now contains three source-backed partial actions: remove eight cooler/shroud retention screws (four GPU-area and four far-end, with only the first four photo-positioned); disconnect both fan leads before separating the cooler; and remove three screws from each replaceable fan. Six fan screws and four far-end cooler screws remain logical-only because individual coordinates are unmapped. This is not a complete service order or reassembly guide. The loader enforces unique step IDs and sequence numbers, valid component/source references, resolvable prerequisites and explicit source provenance.


## Package-authored animation playback

The generic runtime now reads validated clips from animations.json and provides clip selection, play/pause, normalized seek, speed control, completion and deterministic stop/reset. The runtime is independent of GPU-specific content. The pilot package now contains two authored clips: an educational one-turn rotor motion and a reversible exploded-cooler overview. The first does not represent measured RPM; the second is presentation spacing, not a service order or measured physical clearance. Existing airflow/power effects remain separate viewer-generated educational overlays.


- **Stable impeller subassemblies:** both Blender and fallback scenes expose a separate child component ID for each rotor. Only the impeller group rotates; the static frame and hub remain outside the pivot.


## Deep component atlas tranche (in development)

The RTX 3060 pilot is being expanded from assembly-level blocks into separately selectable teaching components: GPU die proxy, thermal interface groups, fastener candidates, PCIe edge interface, fan cable headers, individual rear I/O receptacles, shunt area, unidentified passives and PCB airflow-cutout marker. This is a geometry/content integration tranche; it does not close the precision-CAD or exact-board evidence gates.

The apparent EVGA232 REV 1.0 silkscreen and community-indexed PG190-A02 schematic are tracked as unverified leads only. Exact board identity, schematic applicability and rights must be resolved before any board-level electrical topology is authored.


### Detailed cooling graph (in progress)

The current RTX 3060 XC BLACK package contains **307 semantic components, 303 typed relationships, 95 atomic claims and 13 registered sources**. It includes fan-frame/hub/blade nodes, 24 individually selectable illustrative fin proxies, six heatpipe-route proxies (four main GPU-contact plus two side), six memory-pad proxies, a VRM pad strip, separately selectable fastener nodes, 14 logical TPC instances, 28 GA106 SM instances, 112 logical four-way SM processing partitions and 14 PolyMorph Engine instances. These mesh dimensions, positions and counts remain proxies where no exact drawing or metrology exists; all service-critical unknowns remain explicit.
