# Dell OptiPlex 5060 Tower — PC model research baseline

> **Historical baseline:** this document records the initial v0.1 family-research snapshot. The current package is v0.3.0 and its authoritative coverage, callout mapping, sources and fidelity limits are maintained in [OPTIPLEX_5060_RESEARCH.md](OPTIPLEX_5060_RESEARCH.md). The older 67-node / 68-relationship figures below describe the first snapshot, not the current package.

**Decision:** use the Dell OptiPlex 5060 Tower (MT) as the first reference desktop-computer platform for Screw by Screw.

**Research status:** documentary baseline established; exact factory configuration and physical sample are not yet frozen. This document is not a claim that every optional device is fitted to one retail unit.

## Why this platform

The official Dell service manual covers the tower chassis and a broad set of removable assemblies in one document: storage and optical-drive assemblies, M.2 SSD, SD reader, DIMMs, PCIe cards, PSU, intrusion switch, power button, speaker, coin-cell battery, CPU cooler fan, heatsink, CPU, system fan and system board. It also includes a motherboard connector map and a screw-size table.

That gives us a controlled service sequence and primary-source evidence, rather than reconstructing an arbitrary custom PC from unrelated component manuals.

## Identity boundary

| Field | Current value | Evidence |
|---|---|---|
| Product family | Dell OptiPlex 5060 Tower / MT | Official Dell service manual |
| Regulatory model | D18M | Official Dell service manual |
| Regulatory type | D18M005 | Official Dell service manual |
| Form factor | Tower / Mini Tower | Official Dell manual set |
| Platform generation | 8th-generation Intel Core / Coffee Lake family | Official service manual |
| Exact retail SKU / service tag | Not yet selected | Must be tied to one physical sample or exact configuration source |
| Motherboard assembly part number and PCB revision | Unknown | Must be captured from the exact board |
| PSU manufacturer, part number and revision | Unknown | Multiple PSU configurations may exist; identify by label on sample |
| Factory-installed RAM / drives / optical drive / options | Not fixed | Configuration-dependent |

The 5060 Tower service manual lists supported CPU options including Pentium Gold G5400/G5500, Core i3-8100/8300, Core i5-8400/8500/8600 and Core i7-8700. The first authored reference configuration should freeze one CPU and one set of installed options only after the exact configuration is chosen.

Dell's setup guide gives the MT chassis dimensions as **350 × 154 × 274 mm** (H × W × D), chassis volume **14.77 L**, and chassis weight **7.93 kg**. These are family-level published dimensions, not a substitute for measuring panel clearances and internal mounting geometry.

## Primary-source coverage

The service manual's component index contains procedures for:

- External enclosure: side cover, front bezel and front-panel door.
- Storage: 3.5-inch and 2.5-inch drive assemblies, optical drive and M.2 PCIe SSD.
- Mainboard-attached modules: SD card reader, memory modules and expansion cards.
- Power and controls: PSU, intrusion switch, power button, speaker and coin-cell battery.
- Compute and cooling: heatsink fan, heatsink, processor and system fan.
- Main assembly: system board removal and installation.

The Tower motherboard illustration has 26 numbered callouts. They identify the PCIe slots, optional Type-C/video/PS/2 headers, system-fan header, intrusion header, CPU socket and power, CPU-fan header, memory slots, SD-reader header, power-switch header, M.2 SSD and WLAN slots, four SATA data headers, SATA power, system power, speaker, coin-cell battery and clear-CMOS/service jumper.

This creates a useful functional map for the first model: mechanical enclosure, board, CPU/socket, memory, storage, power, cooling, front-panel controls and external I/O.

## Fastener inventory recorded by Dell

The official Tower service-manual screw table lists the following hardware. The quantities below are the table quantities, not a promise that all optional modules are present in every shipped configuration.

| Component / location | Dell-listed screw | Quantity |
|---|---:|---:|
| SD card reader → chassis | #6.32x3.6 | 1 |
| WLAN → system board | M2x3.5 | 1 |
| M.2 PCIe SSD → system board | M2x3.5 | 1 |
| Optional Type-C / DP / HDMI / VGA cable module → system | M3x3 | 2 |
| Internal antenna → system | M3x3 | 2 |
| System board → chassis | #6.32x1.4 | 9 |
| PSU → chassis | #6.32x1.4 | 3 |

**The screw-table quantities add up to 19.** Do not label this as the exact installed screw count for the reference build: some entries correspond to optional modules, and service procedures separately describe captive retention hardware.

The same manual also documents:
- Four captive heatsink screws, loosened in the printed sequence 1–4.
- Four screws securing the heatsink fan to the heatsink; Dell specifies using a Torx driver through the top screw holes.
- The system fan is installed using rubber mounting grommets rather than a generic four-screw assumption.

The manual recommends Phillips #0, Phillips #1 and a plastic scribe for the general procedures; the heatsink-fan procedure additionally specifies a Torx driver. Preserve each fastener as an individual component instance once its exact geometry and placement are confirmed.

## Geometry and evidence policy

1. Build the chassis envelope and major stamped-metal panels first. Use Dell's published envelope dimensions as a global constraint; use calibrated images, an actual sample or dimensioned drawings for internal features.
2. Model serviceable assemblies as separate, selectable objects: cover, bezel/door, drive cages, PSU, motherboard, CPU/cooler, system fan, speakers, controls, storage devices and fitted expansion cards.
3. Model the board as a PCB assembly with connector, socket, DIMM, slot and mounting-hole instances. Do not fabricate component-level PCB placement from the motherboard callout diagram alone.
4. Model each installed screw, captive screw, standoff, grommet and latch as its own stable component instance where visible and attributable. Group fasteners semantically, but keep their instance IDs distinct.
5. Keep optional and variant-specific hardware outside the canonical configuration until the selected sample proves it is fitted.
6. Keep hidden cable routing, exact PSU internals, component markings, board revision, screw head geometry and undocumented dimensions as unknown until observed or sourced.
7. Never copy Dell manual diagrams or third-party teardown imagery into the repository without a redistribution basis. Store source links, page/figure locators, hashes and rights status; author original geometry from evidence.

### Evidence classes to use

- `manufacturer_data`: Dell-published dimensions, connector labels and service procedures.
- `measured`: dimensions taken from the exact physical sample with tool and uncertainty recorded.
- `teardown_supported`: visible/handled parts corroborated by an exact 5060 MT teardown.
- `photo_estimate`: approximate placement inferred from a calibrated reference image.
- `illustrative`: proxy geometry used only to communicate shape or hierarchy.
- `unknown`: no reliable evidence. Do not substitute zero or a plausible guess.

## First modeling breakdown

1. Chassis and external panels: frame, side cover, front bezel, front door, feet and external openings.
2. Motherboard assembly: PCB outline, mounting positions, socket, DIMM slots, PCIe slots, M.2 slots, SATA connectors, headers and rear I/O.
3. Compute: selected CPU package and socket retention, heatsink, captive screws, fan and cable.
4. Power: exact PSU enclosure, label, fan, input/output connectors and harness; PSU internals only if an exact unit is available.
5. Cooling: system fan, grommets, airflow path and cable.
6. Storage and bays: only the selected 3.5-inch / 2.5-inch / optical-drive / M.2 configuration.
7. Controls and small devices: power button, intrusion switch, speaker, coin-cell, front I/O and fitted antennas.
8. Fastener atlas: every visible screw, standoff, captive screw, grommet and latch with dimensions, head/drive type, target parts and source.
9. Assembly sequence: translate Dell's documented service order into reversible, source-linked model steps; do not invent torque values or undocumented removal order.

## Release gate

Do not publish an exact-SKU package until one configuration is frozen and identified. Minimum identity packet: Dell service tag or exact order/configuration record (private identifiers must not be published), motherboard part number and revision, PSU label and part number, CPU, DIMM population, installed storage/optical options, fitted modules/cards and a photo set of the actual unit. A public package can use a non-sensitive internal sample ID instead of disclosing the service tag.

## Official sources

1. [Dell OptiPlex 5060 Tower Service Manual (PDF)](https://dl.dell.com/topicspdf/optiplex-5060-desktop_service-manual8_en-us.pdf) — regulatory identity, CPU options, 26-callout Tower motherboard layout, screw-size list and removal/installation procedures. See especially printed pages 1, 15–16 and 22–69.
2. [Dell OptiPlex 5060 Tower support — Manuals & Documents](https://www.dell.com/support/product-details/en-us/product/optiplex-5060-desktop/resources/manuals) — official document index for the Tower setup/specifications guide and service manual.
3. [Dell OptiPlex 5060 Tower Setup and Specifications — Physical system dimensions](https://www.dell.com/support/manuals/en-ly/optiplex-5060-desktop/optiplex_5060_mt_setup_and_specs/physical-system-dimensions?guid=guid-9a766954-743d-41f1-b3ce-8828e4297689&lang=en-us) — chassis envelope, volume and weight.

## Decision

**Proceed with Dell OptiPlex 5060 Tower (MT) as the first PC research and modeling platform.** Treat the product family as the research target, and do not register it as an exact catalogue SKU until the physical/reference configuration is frozen.


## Implemented family-level package · v0.1.0

The first package is present at `public/models/dell_optiplex_5060_tower_v01.sbsmodel` and is registered in the desktop-computer catalogue. It contains 67 stable component instances, 68 typed relationships, two primary Dell source records, manufacturer-backed dimensional claims, and a bilingual learning check. The glTF scene has 58 simple box proxies; the remaining semantic nodes preserve the assembly hierarchy without pretending that every logical or not-yet-identified item has measured geometry.

Twenty-four individual mounting instances are represented: nine system-board screws, three PSU screws, four captive heatsink screws, four heatsink-fan screws and four system-fan rubber grommets. Screw-table quantities are kept separate from the additional service-manual hardware; the 19-row-table sum is not presented as the installed screw count of every PC.

The package is family-level, not an exact-SKU or physical-sample model. The chassis envelope is based on Dell's published dimensions. Internal part locations, board outline, fastener placements, exact CPU, system-board revision, PSU identity, cable routing and optional installed devices remain schematic, unknown or explicitly unpopulated. The 3D output is a blockout proxy, never CAD.

Rebuild commands:

```bash
python tools/modeling/build_device_blockout.py \
  --components content/models/dell-optiplex-5060-tower-family/components.json \
  --output /tmp/optiplex-5060-family.glb

python tools/modeling/package_model.py \
  --model-dir content/models/dell-optiplex-5060-tower-family \
  --scene /tmp/optiplex-5060-family.glb \
  --output /tmp/optiplex-5060-family.sbsmodel
```
