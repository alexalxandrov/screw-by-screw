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

This is not yet a complete engineering reconstruction. The eight fasteners are candidates from a related EVGA XC teardown report, not a verified exact-revision service specification. The candidate EVGA232 REV 1.0 board marking and PG190-A02 schematic lead do not establish the physical PCB identity. No pinout, VRM phase count, component values, fan RPM, screw torque or thermal-pad thickness is inferred.
