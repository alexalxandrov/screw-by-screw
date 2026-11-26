# Dell OptiPlex 5060 Tower — family research package v0.2.0

## Identity and scope

- Catalogue ID: `pc.dell.optiplex-5060-tower.family`
- Identity scope: `platform_family`
- Model kind: complete desktop system
- Manufacturer part number: intentionally unset
- Release state: research blockout
- Geometry: illustrative box proxies, not CAD
- Package: `public/models/dell_optiplex_5060_tower_v02.sbsmodel`

This is a Tower-family reference assembled from Dell's published service manual and setup/specification pages. It is not tied to a service tag, motherboard assembly number, PCB revision, exact CPU, PSU OEM, storage population, or one retail order code.

## Coverage

| Layer | Current coverage |
|---|---:|
| Semantic component instances | 115 |
| Typed relationships | 123 |
| GLB box-proxy nodes | 58 |
| Individual screws / grommets | 24 |
| Dell motherboard callouts | 26 mapped semantically |
| Registered source records | 15 |
| Technical claims | 29 |
| Qualitative process layers | 6 |
| Source-backed partial system-board steps | 12 |
| Bilingual learning questions | 9 |

The 24 fastener instances remain an explicit set of modeled service-relevant instances (20 screws and four rubber grommets). They are not a claim that every retail configuration contains exactly 24 installed fasteners. Dell's screw table separately lists nine system-board screws and three PSU-to-chassis screws; other listed rows include option/module-specific fasteners.

## Motherboard and expansion map

The Dell Tower motherboard illustration has 26 numbered callouts. The package represents the labels as semantic references rather than claiming the board contains only 26 physical parts. Some callouts describe groups, such as the four DIMM slots. The source map is stored in `model.specifications.motherboard.callouts`; it contains 26 labels that resolve to 29 component references because callout 13 expands to four individual DIMM sockets.

| Dell callout | Label in the service manual | Semantic component ID(s) |
|---:|---|---|
| 1 | PCIe x16 connector wired x4 · Slot 4 | `motherboard.pcie.x16.wired_x4` |
| 2 | PCIe x1 · Slot 3 | `motherboard.pcie.x1.2` |
| 3 | PCIe x16 · Slot 2 | `motherboard.pcie.x16` |
| 4 | PCIe x1 · Slot 1 | `motherboard.pcie.x1.1` |
| 5 | Optional Type-C connector | `motherboard.typec_header.optional` |
| 6 | Optional HDMI / DP / VGA connector | `motherboard.video_header.optional` |
| 7 | Optional PS/2 / serial connector | `motherboard.ps2_serial_header.optional` |
| 8 | System fan connector | `motherboard.fan_header` |
| 9 | Intruder switch connector | `motherboard.intrusion_switch_header` |
| 10 | CPU socket connector | `motherboard.cpu_socket` |
| 11 | CPU power connector | `motherboard.cpu_power` |
| 12 | CPU cooler fan connector | `motherboard.cpu_fan_header` |
| 13 | Memory slots | `motherboard.dimm.1` … `motherboard.dimm.4` |
| 14 | SD card reader connector | `motherboard.sd_reader_header` |
| 15 | Power switch connector | `motherboard.power_switch_header` |
| 16 | M.2 SSD connector | `motherboard.m2` |
| 17 | SATA 0 · blue | `motherboard.sata.1` |
| 18 | SATA 2 · white | `motherboard.sata.2` |
| 19 | Internal speaker connector | `motherboard.speaker_header` |
| 20 | SATA 3 · black | `motherboard.sata.3` |
| 21 | SATA 1 · black | `motherboard.sata.4` |
| 22 | System power · ATX | `motherboard.system_power` |
| 23 | SATA power connector | `motherboard.sata_power_header` |
| 24 | M.2 WLAN connector | `motherboard.m2.wlan` |
| 25 | Coin-cell battery | `motherboard.coin_cell` |
| 26 | Clear CMOS / Password / Service Mode jumper | `motherboard.clear_cmos_jumper` |


The model distinguishes four PCIe positions:
- Slot 2: PCIe 3.0 x16.
- Slot 1: PCIe 3.0 x1.
- Slot 3: PCIe 3.0 x1.
- Slot 4: x16 mechanical connector, electrically PCIe 3.0 x4.

The board-side inventory also includes the CPU and system-fan headers, CPU power and main system power, intrusion-switch and power-switch headers, speaker and SD-reader connectors, SATA power, and the Clear CMOS / Password / Service Mode jumper. Optional Type-C, video, PS/2 and serial module connectors remain configuration-dependent.

## Memory, storage and processor options

Dell documents four DDR4 non-ECC UDIMM sockets, up to 64 GB total and up to 16 GB per socket. Maximum memory data rate depends on processor family (2666 MT/s for Core i5/i7; 2400 MT/s for Pentium/i3). The number, size and part numbers of DIMMs installed in any one PC remain unknown.

Storage topology is represented as:
- one M.2 SSD socket, form factor 2230/2280, supporting SATA or PCIe;
- a separate M.2 2230 WLAN socket;
- four SATA data headers: one Gen2 path assigned to ODD and three Gen3 headers;
- optional 2.5-inch / 3.5-inch SATA drives, slim optical drive and SD-reader module, explicitly not populated in this reference.

The supported processor options are listed as a platform capability only: Pentium Gold G5400/G5500, Core i3-8100/i3-8300, Core i5-8400/i5-8500/i5-8600 and Core i7-8700. No single processor is assigned as installed. Dell's service-manual and setup/specification tables differ on some thermal-power values; the model records that discrepancy and does not infer an exact configuration.

## Power supply

Dell's setup specification lists alternative 260 W EPA Bronze and 260 W EPA Platinum PSU configurations, with 100–240 V AC input, up to 3.2 A and 50–60 Hz. These are platform alternatives, not two simultaneous power supplies. The fitted PSU manufacturer, Dell part number, efficiency option and revision are unknown.

## External I/O

The front inventory covers two USB 2.0 Type-A ports (one PowerShare), one USB 3.1 Gen 1 Type-A, one USB 3.1 Gen 2 Type-C PowerShare and a universal audio jack, plus optional SD-reader and optical-drive openings.

The rear inventory covers two standard DisplayPort outputs, four USB 3.1 Gen 1 Type-A, two USB 2.0 SmartPower On, Gigabit Ethernet RJ-45 and line-out. Optional third-video-output, serial and antenna modules are recorded as alternatives / optional configuration items, not as guaranteed fitted ports.

## Service procedure represented

The 12-step sequence is a partial Dell-documented system-board removal procedure:
1. Side cover.
2. Front bezel.
3. Front panel door.
4. CPU heatsink fan.
5. Four captive heatsink screws loosened in Dell's 1–4 order; lift heatsink.
6. Release and remove processor.
7. Remove fitted expansion cards, if any.
8. Remove PCIe SSD, if fitted.
9. Remove SD card reader, if fitted.
10. Remove installed memory modules.
11. Disconnect the documented board-side power, storage, speaker and related cables.
12. Remove the nine system-board screws and lift the board out.

This is not a complete teardown or a reassembly guide. Dell's system-fan and PSU removal operations remain separate service procedures. Safety notes and prerequisites are retained on each step. The model does not invent screw coordinates, tightening torque, pinouts, a cable harness route or motherboard-hole geometry.

## Source register

All sources below are Dell Technologies' manufacturer service-manual or setup/specification pages.

| Source ID | Evidence used |
|---|---|
| `src.dell.5060.service` | Tower family service-manual baseline |
| `src.dell.5060.setup` | Platform setup/specification baseline |
| `src.dell.5060.boardlayout` | Numbered motherboard layout (1–26) |
| `src.dell.5060.board_removal` | System-board prerequisite and removal sequence |
| `src.dell.5060.processors` | Supported processor option table |
| `src.dell.5060.memory` | DIMM type, slot count, capacity and data rates |
| `src.dell.5060.storage` | M.2/SATA/drive options and combinations |
| `src.dell.5060.board_connectors` | M.2, SATA, WLAN and PCIe connector capabilities |
| `src.dell.5060.ports` | Front/rear port inventory and optional modules |
| `src.dell.5060.power` | PSU options and AC input requirements |
| `src.dell.5060.screw_table` | Screw types and location-specific quantities |
| `src.dell.5060.heatsink` | Four captive heatsink screws and release order |
| `src.dell.5060.cpu_removal` | CPU socket release / removal procedure |
| `src.dell.5060.system_fan` | Fan cable, intrusion-switch cable and rubber grommet removal |
| `src.dell.5060.psu_removal` | Separate PSU removal procedure |

Canonical URLs are retained in `sources.json` and included in the package's provenance records.

## Known unknowns and fidelity limits

- System-board assembly number, PCB revision, exact outline, mounting-hole coordinates and copper/stack-up geometry.
- Exact fitted CPU, BIOS revision, installed DIMM count/capacity/ranks and actual memory timings.
- Exact fitted PSU OEM, part number, revision and harness topology.
- Installed 2.5-inch / 3.5-inch / M.2 / ODD drive population.
- Optional rear module selection (serial/video/Type-C/PS2), WLAN module and antenna population.
- Exact cable routing, connector pinouts, electrical signal flow, thermal performance and fan curves.
- Exact locations, dimensions, torque values and head geometry for all fasteners.

Unknown or optional items are marked accordingly. A connector's presence or platform support is not evidence that an optional module is installed. The GLB remains a source-linked schematic blockout with box geometry and stable component IDs; it is not measured CAD, a manufacturing drawing or a photo-accurate reconstruction.
