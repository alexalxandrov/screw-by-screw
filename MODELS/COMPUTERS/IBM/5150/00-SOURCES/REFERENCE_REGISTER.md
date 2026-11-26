# Source register — IBM 5150 (August 1981 baseline)

| ID | Source | Type | Use in this package | Rights / reuse |
|---|---|---|---|---|
| `src.ibm.5150.technical_reference_1981` | [IBM Personal Computer Technical Reference, first edition, August 1981 (PDF)](https://ps2.infania.net/IBM_5150_Technical_Reference_6025005_AUG81.pdf) | Manufacturer technical reference | 16 KB–64 KB board family, approximate board outline, CPU/bus architecture, five expansion sockets, clock, memory map, 63.5 W four-rail PSU, 120 Vac input | Copyrighted IBM manual; link only, no redistribution |
| `src.ibm.5150.hardware_maintenance_1981` | [IBM Personal Computer Hardware Maintenance and Service, first edition, August 1981](https://manualzz.com/doc/74076016/ibm-5150-hardware-maintenance-manual) | Manufacturer service manual mirror | Printed pp. 3-98–3-99 cover, pp. 3-99–3-102 PSU, p. 3-106 speaker, pp. 3-107–3-110 system board | Copyrighted IBM manual on a third-party mirror; link only, no redistribution |
| `src.ibm.history.personal_computer_1981` | [IBM History — The IBM PC](https://www.ibm.com/history/personal-computer) | Manufacturer historical reference | 12 August 1981 unveiling, $1,565 base configuration, 16 KB RAM and no disk drive | IBM corporate page; link only |
| `src.conventionalmemory.ibm5150.service_recap` | [Conventional Memory — Recap and repair bench for the IBM 5150](https://conventionalmemory.io/recap/ibm5150/) | Secondary service recap | Cross-check of service-manual terminology and FRU procedures | Third-party material; link only, no reuse permission assumed |

## Applicability rules

- Use the August 1981 technical reference, not its revised April 1984 counterpart, for the first 16 KB–64 KB board family.
- The August 1981 first edition documents the 120 Vac PSU input. The later 220/240 Vac supply is not imported into this model.
- Do not mix in 64 KB–256 KB board data, the IBM 5160 PC/XT, aftermarket BIOS replacements, clone parts, or later PSU substitutions.
- Do not infer physical chip count, PCB component placement, copper routing, screws, sheet-metal dimensions, or torque from a logical diagram.
- The corporate-history launch configuration is a baseline template, not proof that every 1981 retail machine shipped with identical fitted options.

## Evidence classification

`manufacturer_data` is reserved for claims directly stated in the IBM references; `teardown_supported` is reserved for service-manual procedures or counts; `illustrative` identifies proxy geometry and inferred placements. Secondary sources are not used to upgrade an unsupported claim to manufacturer evidence.
