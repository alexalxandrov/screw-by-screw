# EVGA RTX 3060 XC BLACK content package

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
- Six memory package candidates are not a confirmed exact-board population.
- The 24 heatsink fins in the current model are illustrative proxies, not a measured fin count.
- Assembly steps remain intentionally empty until the teardown is reviewed in sufficient detail to support an actual sequence.
- No third-party images or video frames are redistributed in this package.


## Fan rotor animation

The content model exposes two illustrative rotor pivot components as children of the fan assemblies. The generated GLB and local fallback scene keep each annular frame and hub static while only the separate impeller node rotates. One educational clip demonstrates a single visual revolution over 3.2 seconds. The duration is a playback choice, not measured RPM; blade profile and blade count remain proxies. The package release manifest includes animations.json in its SHA-256 file set.


## Deep component atlas development tranche

The feat/rtx3060-deep-component-atlas branch expands the pilot beyond its original 24 semantic components. It adds selectable GPU-die, thermal-interface, candidate-fastener, PCIe-edge, fan-header, individual display-port, shunt-area, generic-passive and PCB-airflow-cutout entries with matching Blender scene nodes. Every new element carries English/Russian labels and an explicit evidence/geometry status.

This is not yet a complete engineering reconstruction. Four GPU-area heatsink screws are photo-positioned from the exact XC BLACK review; four additional rear fastener nodes are uninstalled logical candidates from a related XC teardown and are not asserted as installed on this SKU. The candidate EVGA232 REV 1.0 board marking and PG190-A02 schematic lead do not establish the physical PCB identity. No pinout, VRM phase count, component values, fan RPM, screw torque or thermal-pad thickness is inferred.


### Fine-grained cooling decomposition

The development branch now expands the content graph to 121 semantic components and 116 typed relationships. Fan frames, hubs and each blade proxy are separately selectable; the illustrative heatsink has 24 separately selectable fin proxies; the two reconstructed heatpipe routes are separate assembly nodes; and six memory thermal-pad proxies plus one VRM pad strip have their own IDs. No proxy blade/fin count or thermal-pad dimensions are presented as a factory specification.


### Partial teardown evidence

The interactive assembly panel has two partial exact-model steps: four heatsink mounting screws around the GPU, followed by disconnection of both fan leads before separating the cooler/shroud. The eight-screw count from a related XC teardown is explicitly excluded from the exact-SKU procedure. The sequence is not a complete service guide; screw thread, driver/bit, torque, connector release geometry, thermal-pad specifications and reassembly order remain unverified.


### Reversible exploded assembly view

A second animation separates the fan shroud, cooler, PCB/electronics and connector groups so that the card's major layers can be inspected. The animation is reversible, seekable and resettable. It is an explanatory layout, not a measured clearance or an instruction sequence.


### GA106 and GDDR6 architecture

The model package adds a separately selectable logical architecture tree: 28 SMs, aggregate CUDA/Tensor/RT/TMU/ROP units, and the published 192-bit memory interface. Six GDDR6 package positions are visible on the exact XC BLACK card, but the exact package marking is not verified. The K4ZAF325BM-HC16 identity and its catalog attributes come from a related XC teardown and a secondary catalog, so they remain candidate details rather than exact-SKU BOM facts. Six interface presentation segments are logical navigation groups only; they are not mapped to physical packages or PCB nets.


### Fastener evidence correction

The exact 12G-P5-3655-KR XC BLACK review shows four heatsink mounting screws around the GPU. Those four screw meshes are photo-positioned proxies. Four additional nodes remain only as uninstalled logical candidates from a related EVGA RTX 3060 XC teardown whose retail SKU is not established. The viewer does not present eight screws as an exact-XC-BLACK service instruction.


### GDDR6 identity and bus mapping boundary

The exact card has six visible GDDR6 package positions and a manufacturer-published 192-bit memory interface. The individual device markings and electrical mapping have not been confirmed from an exact-revision BoardView or schematic. The viewer separates the package positions from the logical interface presentation groups; no one-to-one channel mapping is claimed.


### Four visible heatpipe terminal faces

The exact XC BLACK cooler-end photograph shows four copper terminal faces. They are now separately selectable in the viewer. The four-face count must not be confused with four unique heatpipes: internal pipe paths and the number of distinct U-shaped tubes are still unverified.
