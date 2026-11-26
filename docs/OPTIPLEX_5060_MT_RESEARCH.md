# Dell OptiPlex 5060 Tower — research and modelling brief

**Selected platform:** Dell OptiPlex 5060 Tower / Mini Tower  
**Regulatory family markers:** D18M / D18M005  
**Package ID:** `pc.dell.optiplex-5060-mt`  
**Geometry classification:** `illustrative_proxy_not_cad`

## Why this platform

Dell publishes a Tower-specific service manual with a motherboard layout, a screw-size table, procedures for removable assemblies and a Mini Tower customer-replaceable-unit teardown guide. The sources are substantially better suited to a serviceable, fastener-aware reconstruction than an arbitrary custom PC build.

## Documented motherboard layout

The Tower layout legend identifies 26 numbered locations. These include four PCIe slots (x16 wired as x4, x1, x16, x1), the CPU socket and power/fan headers, memory slots, SD-reader header, power-button header, M.2 SSD and WLAN connectors, four SATA connectors, speaker, ATX system power, SATA power, coin-cell battery and CMOS/service jumper. Optional Type-C, video and PS/2/serial modules are also identified.

The package records the connectors and option positions as semantic nodes. Their blockout geometry is not a measured PCB placement.

## Documented screw inventory

| Assembly | Dell designation | Quantity | Configuration note |
|---|---:|---:|---|
| System board | #6-32 × 1.4 | 9 | Tower screw table |
| PSU | #6-32 × 1.4 | 3 | Tower screw table |
| SD card reader | #6-32 × 3.6 | 1 | Optional module |
| WLAN | M2 × 3.5 | 1 | Optional module |
| M.2 PCIe SSD | M2 × 3.5 | 1 | Optional drive |
| Type-C cable module | M3 × 3 | 2 | Optional module |
| Internal antenna | M3 × 3 | 2 | Optional antenna |
| **Table subtotal** |  | **19** | Includes option-dependent entries |
| CPU heat sink | 4 captive screws | 4 | Dell removal procedure gives numbered 1–4 order; thread/size not stated in the table |
| CPU heat-sink fan | Torx screws | 4 | Dell installation procedure explicitly states four; thread/length not stated |
| Chassis system fan | Rubber grommets | 4 | Not screws; lower two installed first |

The 19-screw table subtotal is not a universal count for every physical PC. Adding the separately documented four heat-sink captive screws and four fan-to-heatsink screws gives 27 documented screw positions in this reconstructed inventory, before resolving any other configuration-specific hardware. The four system-fan grommets are non-metallic retainers and are kept separate.

## Service sequence coverage

The package includes a partial sequence based on the manual: side cover, bezel/front door, expansion card, M.2 SSD, memory, SD reader, drive assemblies, CPU fan, heat sink, processor, system fan, PSU and system board. It is not presented as a universal repair recipe; the exact prerequisites depend on the installed options and the source's full diagrams.

## Explicitly unknown / not yet established

- Exact customer order code and installed bill of materials.
- Motherboard PCB part number and revision.
- Exact CPU SKU, DIMM count/capacity/vendor, drive SKUs and optical-drive presence.
- PSU wattage/part number for a specific unit.
- Chassis, panel, PCB and bracket dimensions to metrology-grade accuracy.
- Screw thread/length for the heat-sink captive screws and CPU-fan Torx screws.
- Other fastener details not explicitly quantified by the cited sources.
- Exact hidden cable routing, wire lengths and internal harness part numbers.

Do not import dimensions or geometry from OptiPlex 5060 SFF or Micro variants. They are separate chassis configurations.

## Source register

All source URLs are stored in `content/models/dell-optiplex-5060-mt/sources.json`. Primary sources are Dell:
- Tower service manual and system-board removal procedure.
- Tower screw-size table.
- Tower motherboard layout.
- Heat-sink, heat-sink-fan and system-fan procedures.
- OptiPlex 5060 MT CRU teardown guide.
- Dell support manuals index.

Dell documentation is linked for reference. Copyrighted manuals and image assets are not copied into the model package or repository.
