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
- Six Samsung K4ZAF325BM-HC16 GDDR6 packages are identified in the Tom's Hardware teardown; the rear-PCB photo on the same review page reads P/N 12G-P5-3655-KR. Package centres remain photo-estimated. The 16-Gbit density, 512M × 32 organisation and 180-FBGA package type are secondary-catalog attributes, not primary Samsung datasheet values; they use the separate `secondary_catalog_data` evidence class.
- The 24 heatsink fins in the current model are illustrative proxies, not a measured fin count.
- The assembly panel contains three source-backed partial actions: (1) eight cooler/shroud retention screws (four around GPU and four near the far end; only the GPU-area four have photo-positioned proxies); (2) disconnect both fan leads before separating the cooler; and (3) remove three retaining screws from each replaceable fan (six total, individual positions unmapped). This is not a complete service procedure; driver size, torque, thread details, rear screw coordinates and reassembly order remain unverified.
- No third-party images or video frames are redistributed in this package.


## Fan rotor animation

The content model exposes two illustrative rotor pivot components as children of the fan assemblies. The generated GLB and local fallback scene keep each annular frame and hub static while only the separate impeller node rotates. One educational clip demonstrates a single visual revolution over 3.2 seconds. The duration is a playback choice, not measured RPM; blade profile and blade count remain proxies. The package release manifest includes animations.json in its SHA-256 file set.


## Deep component atlas development tranche

The feat/rtx3060-deep-component-atlas branch expands the pilot beyond its original 24 semantic components. It adds selectable GPU-die, thermal-interface, candidate-fastener, PCIe-edge, fan-header, individual display-port, shunt-area, generic-passive and PCB-airflow-cutout entries with matching Blender scene nodes. Every new element carries English/Russian labels and an explicit evidence/geometry status.

This is not yet a complete engineering reconstruction. Eight cooler/shroud retention screws are reported for the exact 12G-P5-3655-KR sample: four around GPU and four near the far end. Only four GPU-area centres are photo-positioned; four additional rear-area nodes are exact-SKU semantic items with `geometry_status: logical_only` until their individual coordinates can be calibrated. The candidate EVGA232 REV 1.0 board marking and PG190-A02 schematic lead do not establish the physical PCB identity. No pinout, VRM phase count, component values, fan RPM, screw torque or thermal-pad thickness is inferred.


### Fine-grained cooling decomposition

The development branch now expands the content graph to **167 semantic components, 163 typed relationships, 74 claims and 13 sources**. Fan frames, hubs and each blade proxy are separately selectable; the illustrative heatsink has 24 separately selectable fin proxies; six separate heatpipe route proxies are grouped as four main GPU-contact pipes plus two side pipes; and six memory thermal-pad proxies plus one VRM pad strip have their own IDs. No proxy blade/fin count or thermal-pad dimensions are presented as a factory specification.


### Partial teardown evidence

The interactive assembly panel has three partial exact-model actions: eight cooler/shroud retention screws (four around the GPU and four near the far end) according to the Tom's Hardware sample whose rear-PCB label identifies P/N 12G-P5-3655-KR; disconnection of both fan leads before separating the cooler/shroud; and removal of three retaining screws from each replaceable fan. The six fan screws remain logical-only because individual positions are not mapped. The sequence is not a complete service guide; screw thread, driver/bit, torque, connector release geometry, thermal-pad specifications and reassembly order remain unverified.


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


### Exact-SKU heatpipe count

The FPS Review explicitly identifies its sample as 12G-P5-3655-KR and describes four central GPU-contact heatpipes plus two side heatpipes. All six are now separately selectable in the cooling hierarchy. The generated 3D paths remain illustrative, not dimensionally verified. Four visible copper terminal faces in the LanOC cooler-end image are recorded separately from the six unique heatpipes described by The FPS Review.


### Fan fastener evidence

Gamers Nexus' exact-model teardown shows three retaining screws per independently replaceable fan. The model represents six fan-mount fasteners as separate semantic nodes with `geometry_status: logical_only`; their centres, thread, head, length and torque remain unknown. These are separate from the eight cooler/shroud retention screws. The new third assembly action records this limited observation without presenting a complete fan or cooler service procedure.


### GA10x logical SM hierarchy

The architecture tree now exposes 28 separately selectable logical SM entries beneath a TPC aggregate and an aggregate of 14 PolyMorph Engines. NVIDIA's GA10x whitepaper supplies per-SM counts and TPC composition: 128 CUDA, four Tensor, four texture, one RT, 256 KB register file and 128 KB L1/shared memory per SM; two SMs and one PolyMorph Engine per TPC. Fourteen TPCs is calculated from 28 configured SMs. None of these nodes has a physical die position or implies a recovered GA106 floorplan/GPC arrangement.
