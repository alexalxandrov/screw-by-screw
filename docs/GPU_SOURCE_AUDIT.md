# GPU Source Audit — EVGA RTX 3060 XC BLACK GAMING 12GB

**Status:** updated source audit; exact-SKU evidence improved, but not complete asset/license clearance  
**Selected variant:** EVGA GeForce RTX 3060 XC BLACK GAMING 12GB  
**Manufacturer part number:** 12G-P5-3655-KR  
**GPU family:** NVIDIA GeForce RTX 3060 / Ampere  
**Memory:** 12GB GDDR6

## 1. Identity lock

The pilot is the EVGA XC BLACK variant, not a generic RTX 3060, not an RTX 3060 Ti, and not the distinct EVGA XC Gaming SKU. Product references identify XC BLACK as 12G-P5-3655-KR.

A closely related EVGA RTX 3060 XC Gaming SKU 12G-P5-3657-KR also appears in sources. Do not mix its specifications, photographs, PCB details, or geometry into this model unless equivalence is independently established. Refurbished suffixes such as -KRR are not the selected retail part number.

## 2. Sources located

| Source | Contribution | Applicability / limitation |
|---|---|---|
| [EVGA specification PDF](https://sg-repo-production-photos.s3.eu-central-1.amazonaws.com/aikido/cache/70b60b3a1a7bbeaced972a5b6905797f.pdf) | Product identity and published specifications for 12G-P5-3655-KR | Strong primary product source; verify original official hosting and redistribution rights |
| [NVIDIA Ampere GA10x architecture whitepaper](https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf) | GA10x per-SM resources and TPC composition | Architecture-common data only; GA102 floorplan/GPC layout is not transferred |
| [Gamers Nexus exact-model teardown](https://www.youtube.com/watch?v=hJFJ_clQT8U) | Explicit EVGA RTX 3060 XC Black disassembly; cooler, fans, PCB, thermal pads, shunt resistors and internal views | High-value visual evidence; video/images remain copyrighted unless permission/license permits reuse |
| [Tom's Hardware RTX 3060 teardown](https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review/2) and [main review identity photo](https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review) | Eight cooler/shroud screws, two fan connections, six Samsung K4ZAF325BM-HC16 packages at 16 Gbps; the same review sample's rear-PCB sticker reads P/N 12G-P5-3655-KR | Exact-SKU-linked sample evidence; does not establish PCB revision, component coordinates or electrical nets |
| [Hardwareluxx EVGA XC Gaming PCB/cooler review](https://www.hardwareluxx.ru/index.php/artikel/hardware/grafikkarten/51282-test-i-obzor-evga-geforce-rtx-3060-xc-gaming-kompaktnaya-i-bystraya-videokarta.html?start=2) | PCB/cooler analysis; reports five-phase power delivery for XC Gaming | XC Gaming, not confirmed exact XC BLACK; do not transfer board-specific claims without verification |
| [Hardware Asylum EVGA RTX 3060 teardown](https://www.hardwareasylum.com/reviews/video/evga_rtx3060/page3.aspx) | PCB and cooler removal observations; visible board population differences | Exact SKU/revision needs verification |
| [The FPS Review — exact XC BLACK](https://www.thefpsreview.com/2021/03/03/evga-geforce-rtx-3060-xc-black-gaming-review/2/) | Explicit 12G-P5-3655-KR identity; four central GPU-contact plus two side route/runs | Exact-SKU cooler description; counting convention and internal route geometry are not resolved |
| [LanOC — exact XC BLACK](https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1) | Four GPU-area heatsink screws, no backplate, 90 mm fan openings / ~85 mm impellers, black plastic no-RGB shroud, vertical aluminium fin stack, copper plate covering GPU and memory, PCB airflow cutout | Exact variant visual evidence; photos are not reusable without permission |
| [Neoseeker — exact SKU 12G-P5-3655-KR](https://www.neoseeker.com/Articles/Hardware/Reviews/evga-geforce-rtx-3060-xc-black-gaming/) | Exact sample P/N; 201.8 × 110 mm dual-slot card, exposed PCB rear, three DisplayPort 1.4a and one HDMI 2.1 | Exact review sample identification; no board revision or internal PCB net layout established |
| [Scan UK product listing](https://www.scan.co.uk/products/evga-nvidia-geforce-rtx-3060-12gb-xc-black-gaming-ampere-graphics-card-3584-core-1320mhz) | Manufacturer part number 12G-P5-3655-KR and marketed name | Secondary identity source |
| [Micro Center refurbished listing](https://www.microcenter.com/product/678083/evga-nvidia-geforce-rtx-3060-xc-black-gaming-dual-fan-12gb-gddr6-pcie-40-graphics-card-%28refurbished%29) | Identifies XC Black and suffix variant 12G-P5-3655-KRR | Refurbished suffix; not exact selected retail part number |

## 3. Preliminary facts with source support

- Selected part number: 12G-P5-3655-KR.
- Product is an EVGA dual-fan RTX 3060 XC BLACK with 12GB GDDR6.
- EVGA's specification lists 3,584 CUDA cores, 192-bit memory interface, 15,000 MHz effective memory clock, PCIe 4.0, and 1777 MHz boost clock for this SKU.
- Gamers Nexus has a teardown explicitly titled for the EVGA RTX 3060 XC Black and documents internal cooler/PCB layout.
- Tom's Hardware's main review contains a rear-PCB identity photograph reading `P/N: 12G-P5-3655-KR`; the page-2 teardown is part of the same review sample. Its eight cooler/shroud screw count and six Samsung K4ZAF325BM-HC16 packages are therefore treated as exact-SKU-linked observations, but not as proof of PCB revision, coordinates or net mapping.
- The FPS Review independently identifies the exact part number and describes four central GPU-contact plus two side heatpipe runs. The model records this as six described route/runs, not six independently verified closed tube loops; other exact-product sources use different counting conventions.

Store these as individual source-backed claims, not as unqualified global properties.

## 4. Important missing items

Not yet located and cleared:
- complete native STEP/IGES assembly for exact 12G-P5-3655-KR;
- official 3D CAD of shroud, heatsink, PCB and fasteners;
- verified BoardView for exact PCB revision;
- verified schematic for exact PCB revision;
- authoritative PCB revision identification;
- complete BOM with reference designators and component values;
- original high-resolution photographs with reusable license;
- permission to reuse third-party teardown frames or article images.

Absence from this audit does not prove these files do not exist. It means they are not verified inputs yet.

## 5. Acquisition strategy

1. Check EVGA support/product archives for official specifications and manuals.
2. Search repair communities and BoardView/schematic indexes by exact part number and PCB silkscreen/revision; verify board identity before accepting a match.
3. Use teardown footage as a visual research index; record timecodes and observations without copying frames.
4. If native CAD is unavailable, create a clearly labeled reconstruction from permitted references. Use physical measurements or multiple views; mark hidden/unknown geometry approximate or omit it.
5. Consider a physical sample only if available at no cost; purchase is not a prerequisite for architecture work.
6. Record license and redistribution permissions separately for geometry, photos, diagrams, manuals, and text.

## 6. Rights and publication

A publicly viewable teardown, review, product PDF, BoardView, or schematic is not automatically public domain or freely redistributable. Until license/permission is confirmed:
- store source URL, metadata, notes and hashes where lawful;
- link to the original;
- do not commit copies of images, video, PDFs, CAD or BoardView files;
- do not embed third-party content in a published package without a valid permission basis.

## 7. Audit status

| Area | Status |
|---|---|
| Exact marketed variant / part number | Identified |
| Official specification source | Located; rights review pending |
| Exact-model teardown | Located |
| Independent teardown/review | Multiple exact-SKU reviews and sample-identity cross-checks located; PCB revision remains unverified |
| Native CAD | Not located |
| BoardView | Not verified |
| Schematic | Not verified |
| Complete BOM | Not located |
| Asset reuse rights | Not cleared |
| Ready for 3D content production | No — evidence acquisition and rights review remain |

## 8. Source links

- [EVGA specification PDF](https://sg-repo-production-photos.s3.eu-central-1.amazonaws.com/aikido/cache/70b60b3a1a7bbeaced972a5b6905797f.pdf)
- [Gamers Nexus exact-model teardown](https://www.youtube.com/watch?v=hJFJ_clQT8U)
- [Tom's Hardware RTX 3060 teardown](https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review/2)
- [Hardwareluxx EVGA XC Gaming PCB/cooler review](https://www.hardwareluxx.com/index.php/artikel/hardware/grafikkarten/51282-test-und-review-evga-geforce-rtx-3060-xc-gaming-kompakt-und-schnell.html?start=2)
- [Hardware Asylum EVGA RTX 3060 teardown](https://www.hardwareasylum.com/reviews/video/evga_rtx3060/page3.aspx)


## 9. Follow-up search findings

### Exact-SKU sources

- [Neoseeker review — exact sample 12G-P5-3655-KR](https://www.neoseeker.com/Articles/Hardware/Reviews/evga-geforce-rtx-3060-xc-black-gaming/): explicitly states the review sample part number and distinguishes the XC Gaming 12G-P5-3657-KR. Useful for external dimensions and visual reference; reuse rights for images/text are not established.
- [Gamers Nexus teardown](https://www.youtube.com/watch?v=hJFJ_clQT8U): exact XC Black disassembly. Indexed description gives timestamps for teardown (01:30), assembly/internal view (05:33), markings/cooling layout (06:45), fan removal (09:00), and shunt resistors (11:00). Use as a research/observation source; do not extract and republish frames without permission.
- [Win Source part record](https://win-source.net/products/detail/evga/12g-p5-3655-kr.html): product page labels an “Ultra Librarian 3D Model” and ECAD module for this part number. This is only an unverified lead. It may refer to a symbolic/footprint/package-level ECAD representation or catalog metadata, not a complete graphics-card assembly. No model has been downloaded or inspected; do not treat it as GPU geometry.
- [Tom's Hardware teardown](https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review/2): useful independent internal reference, but the article title identifies the broader EVGA RTX 3060 XC. Confirm exact SKU/revision before applying detailed PCB claims.
- [EVGA specification PDF](https://sg-repo-production-photos.s3.eu-central-1.amazonaws.com/aikido/cache/70b60b3a1a7bbeaced972a5b6905797f.pdf): exact SKU, dimensions, memory and published specifications.

### CAD / BoardView / schematic result

Searches for the exact part number combined with STEP, STP, CAD, BoardView, board view, schematic, PCB layout and repair terms did not surface a verifiable complete card CAD assembly, exact-revision BoardView, or exact-revision schematic.

This is a search result, not proof that the files do not exist. The next useful discriminator is the PCB silkscreen/revision from an exact physical sample or high-resolution teardown image. Then search by the board number/revision rather than only the retail SKU.

### Confidential thermal document — do not use as a project asset

A document titled “EVGA RTX 3060 series Black GAMING Thermal Strategy & Simulation” was found at:
https://corner-stone.com.tw/wp-content/uploads/2022/11/EVGA-RTX-3060-series-Black-GAMING-Thermal-Strategy-and-Simulation.pdf

The fetched document contains prominent “CornerStone Confidential” / “CONFIDENTIAL” markings and includes renderings that appear to depict different cooler configurations (including triple-fan imagery) rather than an unambiguous exact 12G-P5-3655-KR assembly. It is **not** a cleared public source. Do not copy, redistribute, embed, or rely on its proprietary simulation values. At most, retain the URL in this audit as a lead that must not be used without explicit authorization and exact-model verification.

### Current conclusion

The strongest route is still:
1. Use exact-SKU teardown and review material as linked research evidence.
2. Determine PCB silkscreen/revision.
3. Search for BoardView/schematic by that board identifier.
4. If no licensed CAD appears, build a project-owned reconstruction from permitted views, measurements and explicitly labeled approximations.
5. Keep electrical details at block-diagram level until a trustworthy schematic/BOM is available.

No third-party CAD, BoardView, schematic, images, or confidential PDF have been added to the repository.


## 10. Exact-model visual geometry evidence

A useful additional exact-XC-Black source is [LanOC Reviews — EVGA RTX 3060 XC Black](https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1). The article contains multiple views of the card and PCB layout. It describes:
- compact dual-fan shroud;
- no backplate and exposed rear PCB;
- nominal length 201.8 mm and height 110 mm, dual-slot;
- fan openings approximately 90 mm and impellers approximately 85 mm (reviewer measurements);
- aluminum heatsink, copper GPU contact plate and heat pipes;
- one 8-pin power connection and three DisplayPort plus one HDMI outputs;
- PCB airflow cutout near one end.

This is enough to anchor a first external blockout and document approximate fan geometry. It is not permission to reuse the article's photographs.

### Ultra Librarian lead — downgraded

The WIN SOURCE page shows a catalog field labelled “Ultra Librarian 3D Model” and an ECAD module label for the retail graphics-card part number. It does not expose evidence that a complete card-level mechanical model is downloadable. The lead is therefore classified as **unverified catalog metadata**, not a found CAD asset. It must not be used as geometry until the actual file is obtained, inspected and its scope/licence verified.

### PCB identity status

The follow-up search did not identify a reliable PCB silkscreen number or revision for the exact 12G-P5-3655-KR. The teardown video has a “Markings & Cooling Layout” segment at 06:45, but indexed text alone does not reveal a readable board identifier. A screenshot/frame inspection or physical sample is required. No boardview/schematic search can be considered exact-board until this identifier is established.

### Modeling decision

Proceed with an evidence-backed external blockout and coarse internal assembly. Do not wait for a full BoardView to build the first viewer prototype. Keep the PCB as a simplified reconstructed outline and component groups as clearly labeled blocks until exact-board evidence arrives.

## 11. External-length qualification and v0.4 correction

The exact-model [LanOC card-layout review](https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1) states that the card's fan shroud overhangs the nominal 201.8 mm length and that the reviewer's own measurement was slightly longer. The article does not provide a precise overhang value in the indexed text.

Consequences for the blockout:

- EVGA's 201.8 mm value remains the manufacturer-published nominal length and must remain in the specification record.
- It must **not** be treated as a confirmed maximum X extent for every external part.
- The v0.3 X-bound check only proves that proxy geometry fits the generator's chosen envelope; it is not a product-fidelity check.
- v0.4 must separate the nominal board/reference envelope from the measured outer shroud envelope. Until a calibrated view or physical measurement establishes the latter, overall shroud length remains unknown.
- Do not simply increase the model length by an arbitrary number. Record the overhang as an unresolved measurement.

LanOC also documents the dual-fan shroud, exposed rear PCB/no backplate, vertical heatsink fin orientation, copper GPU/memory contact plate, heatpipes, 8-pin power connector, and 3 DisplayPort + 1 HDMI output layout. These are useful exact-XC-Black topology cues, but the article's photographs remain copyrighted and are not automatically reusable.

A separate [TweakTown XC BLACK review](https://www.tweaktown.com/reviews/9754/evga-geforce-rtx-3060-xc-black-gaming/index.html) provides another exact-model visual reference set (59-image gallery according to the indexed page). Its images are research references only until reuse rights are cleared.

 
## 12. PCB marking and schematic leads — candidate only

A TechPowerUp image on the EVGA RTX 3060 XC BLACK product page appears to show the board silkscreen **EVGA232 REV 1.0**. This is a useful discriminator for further research, but the image's sample-to-retail-SKU provenance and the exact board revision of the selected 12G-P5-3655-KR have not been independently verified. The package therefore keeps pcb_revision unknown. The observation is registered as a candidate source, not promoted to a board identity claim.

A separately indexed document title includes **EVGA232 / PG190-A02 / GA104-GA106**. Follow-up catalog checks found the same named 12.2 MB schematic in RM Schematics, alongside the earlier i2mx index and repair-forum listings. The RM entry classifies the file as a **schematic** (not a BoardView), says it is delivered through a Telegram post, and does not name the EVGA XC BLACK retail part number **12G-P5-3655-KR**. These are multiple catalogue references to one candidate document, not independent confirmation that it matches this retail SKU.

It remains an unverified schematic lead. The TechPowerUp reference image's apparent **EVGA232 REV 1.0** silkscreen and the document's **EVGA232 / PG190-A02** title are suggestive family-level clues, but no inspected primary schematic title block or exact-board sample establishes that PG190-A02 is the PCB in the selected XC BLACK retail card. The marking **EVGA232 REV 1.0** must not be conflated with schematic identifier **PG190-A02**; these may describe different identifier systems. No board-level topology, phase counts, component values, power routes, pin maps or PCB geometry is derived from this candidate. The schematic and any service-file mirrors must not be redistributed from this repository.

### Deep-detail geometry tranche

The v0.6 development branch adds selectable visual placeholders for the GA106 die area, thermal-interface groups, candidate cooler fasteners, PCIe edge interface, two fan headers, individual display receptacles, shunt-resistor area, generic passives and the review-described PCB airflow-cutout area. The additions remain illustrative_proxy_not_cad. Candidate screw count and positions are not an exact-SKU service specification; memory/VRM pad dimensions, fan header pinout, PCIe contact field, port shell geometry and cutout boundary are not metrology data.

No complete BoardView, exact-revision schematic, BOM, native STEP assembly or measured board coordinates have been obtained. The new geometry is for interactive education and navigation only.


## 13. Exact XC BLACK fastener count and location confidence

The main Tom's Hardware RTX 3060 review contains a rear-PCB photograph whose product sticker reads **P/N 12G-P5-3655-KR**. The corresponding teardown on page 2 describes eight cooler/shroud retention screws: four around the GPU and four near the far end of the card. The photographed sample is therefore tied to the exact XC BLACK retail SKU, despite the article's shorter prose label "EVGA GeForce RTX 3060 XC". LanOC's exact XC BLACK review independently documents the four central GPU-area screws as a visible subset.

The model now records **eight exact-SKU retention screws**. Four GPU-area fasteners are separate photo-positioned visual proxies. The four rear-area screws are separate semantic nodes with `geometry_status: logical_only`: their count and general area are documented, but exact individual centres have not been measured or mapped. The first partial assembly observation now references all eight, with source and location limitations explicit. This is not a full service procedure.

The article does not supply screw-head profile, driver size, thread, length, spring specification, calibrated coordinate map or torque. No values are inferred. The absence of a complete screw map and reassembly sequence remains explicit.

Sources:
- Tom's Hardware main review with sample identity photo: https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review
- Tom's Hardware exact-SKU-linked teardown: https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review/2
- LanOC exact XC BLACK card layout and photographs: https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1


## 14. Exact-SKU GDDR6 package identification and bus mapping

The Tom's Hardware teardown identifies **six Samsung K4ZAF325BM-HC16 GDDR6 packages** on the sample. Its main-review rear-PCB photo identifies that same reviewed card as **P/N 12G-P5-3655-KR**, connecting the package marking to the exact XC BLACK retail SKU. The six individual package positions are also visible in exact-model review/teardown material. Their 3D centres remain photo-estimated, not BoardView measurements.

The device is specified in the teardown at **16 Gbps per pin**. Do not confuse this device rating with the EVGA card's stock effective memory clock of **15,000 MHz**. The package identity is sourced to the exact-SKU-linked teardown; 16-Gbit density, 512M × 32 organisation, 180-FBGA package and 32-bit device interface are transcribed from a secondary catalog, not a primary Samsung datasheet. Six 16-Gbit devices total 96 Gbit (12 GB); the capacity multiplication is a derived consistency check, not an independent manufacturer specification.

The EVGA-published **192-bit** memory interface remains the exact-SKU board claim. Six viewer interface presentation segments are logical navigation groups only. No package-to-controller net mapping, chip-select mapping, controller partition, channel assignment or PCB trace routing is inferred without an exact-revision BoardView/schematic.


## 15. Cooler-end heatpipe terminal evidence

LanOC's exact XC BLACK cooler-end photograph (image 16) shows four copper terminal faces. The model adds four separately selectable visual markers under the heatpipe assembly. Their locations are approximate photo-derived points. They are a terminal-face count, not a count of unique U-shaped tubes. Six heatpipe route proxies are now separately selectable (four main plus two side) based on The FPS Review's exact-SKU description; their centrelines, bends and diameter remain illustrative rather than a verified internal routing drawing.


## 16. Exact-SKU heatpipe route/run description and counting boundary

The FPS Review article identifies the tested card as EVGA GeForce RTX 3060 XC BLACK GAMING, part number 12G-P5-3655-KR. Its page 2 cooler description specifies four main central GPU-contact route/runs and two additional side runs (six described runs). This is now recorded as the FPS Review's route/run description, not as a verified count of six independent closed U-shaped tubes. PCWorld's review explicitly names the tested product XC Black Gaming but gives a four-copper-heatpipe overview; Gamers Nexus narrates two central tube paths through the GPU contact plate. These statements are retained as source-specific observations because publications may be counting tube legs, pipes or closed loops differently. The unique physical loop count remains unknown until a calibrated cooler drawing or direct sample inspection reconciles the geometry.

The four copper circular terminal faces in LanOC image 16 remain a distinct visual-face count; they are not used as the unique pipe count. Six 3D paths have been created as selectable educational proxies, but their individual coordinates, diameter, flattened areas and bends are not measured.


### 12.1. Additional EVGA232 catalogue cross-check

The RM Schematics catalogue lists exactly one EVGA232 schematic with original filename `EVGA232 RTX 2070 - RTX3060 - PG190-A02 - GA104-GA106.pdf`, 12.2 MB, and a Telegram delivery reference. It labels the item as **Schematic**. Its overview also lists a separate `Files` item for the same name, but does not identify that archive as a BoardView or state that it contains board-coordinate data. The catalogue's model tags are EVGA232, RTX3060 and PG190-A02; it does not name 12G-P5-3655-KR, XC BLACK, or a confirmed EVGA232 REV 1.0 to PG190-A02 correlation.

A second directory index labels a file `EVGA RTX 3060 12 GB BIOS (XC)` and a separate schematic PDF, but that does not establish that the BIOS archive contains BoardView data. This pilot therefore records an independently indexed *schematic lead*, not a usable verified boardview/CAD asset. The actual document has not been inspected or incorporated; the third-party service file is not copied into the repository.


## 17. Tom's Hardware sample identity cross-check

The Tom's Hardware review is no longer treated as a generic/related RTX 3060 XC variant source. The main review's rear-PCB label is legible as `P/N: 12G-P5-3655-KR`. The teardown discussion and images on page 2 belong to the same review sample. This is the provenance link used for the eight-screw cooler-retention count and Samsung K4ZAF325BM-HC16 package identity. It does not automatically establish the exact PCB revision, individual component coordinates or electrical nets.

The source registry records the main-page identity photo URL and the direct image locator. The image itself is not copied or redistributed; the repository stores only attribution, source URL and the observed part-number text.


### 12.2. Direct PDF text-layer audit: reference-board boundary

The indexed PDF was opened directly and its text layer parsed. The internal title block identifies an NVIDIA drawing `600-1G190-BASE-A02`, `PCB REV PG190-A02`, `BOM REV A`, dated **12 June 2020**. It is a 50-page NVIDIA reference-design schematic. The file name supplied by the third-party directory includes "EVGA232 RTX 2070 RTX3060", but the document body/title block does **not** mention `EVGA232` or retail part number `12G-P5-3655-KR`.

The page-2 text-layer block diagram names `NVVDD-PH1` through `NVVDD-PH8` and `FBVDDQ-PH1` / `FBVDDQ-PH2`. Those are phases in the PG190-A02 reference design, **not an established phase count for the EVGA XC BLACK card**. This distinction is particularly important because published reviews of different EVGA RTX 3060 XC variants describe differing PCB/cooler configurations. No exact-SKU VRM claim, net, component placement, controller, MOSFET identity, or BOM is derived from this file.

The web PDF text extraction succeeded, but the screenshot endpoint returned a cache miss for the requested pages. Therefore no page artwork, exact component value, trace path, or symbol-to-footprint interpretation was extracted. No BoardView is listed in the independent catalogue entry, and no BoardView file was verified. The PDF is not redistributed from this repository.


## 18. GA10x SM and TPC architecture evidence

NVIDIA's official Ampere GA10x whitepaper states that each GA10x SM contains 128 CUDA cores, four third-generation Tensor Cores, four texture units, one second-generation RT Core, a 256 KB register file and 128 KB of configurable L1/shared memory. It also describes each TPC as containing two SMs and one PolyMorph Engine. Applied to the RTX 3060's published 28-SM configuration, the package calculates 14 logical TPCs and 14 PolyMorph Engines.

The new 28 SM entries are individually selectable logical inventory nodes; their numeric suffixes are navigation indices only. No TPC/SM physical coordinates, GA106 GPC count or GPC distribution, disabled-block placement, or GA102 die layout is asserted. The diagram is an architecture map, not a silicon floorplan.

Source: https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf (Figure 2 and printed page 10).


## 19. Partition-level GA10x architecture

The official NVIDIA GA10x architecture whitepaper (Figure 3, printed page 10) specifies four processing partitions per SM. Each partition contains an L0 instruction cache, warp scheduler, dispatch unit, 16,384 × 32-bit register file, two FP32 datapaths, one third-generation Tensor Core, four LD/ST units and one SFU. The text explains that one datapath contains 16 FP32 CUDA cores and the other contains 16 FP32 CUDA cores plus 16 INT32 lanes that are selectable between FP32 and INT32 work.

The model represents 112 partitions as four logical entries under each of 28 SMs. It separately models 14 TPC instances, each pairing two SMs and one PolyMorph Engine. All these nodes are `logical_only`; partition/TPC numbering is an inventory index, not physical layout. The paper's GA102 die diagram, GPC count and physical GPC assignment are not applied to GA106.


## 21. Shroud, fin-stack, contact-plate and I/O details

LanOC describes the exact XC BLACK as having a black plastic shroud without RGB, a vertically oriented aluminium fin stack, a copper heat plate over the GPU wide enough to cover memory, a large PCB airflow cutout, and visible EVGA E-logo bumps on the fan blades. The listed observations are now represented as claims and component descriptions, not as calibrated physical geometry.

Neoseeker explicitly identifies its sample as `12G-P5-3655-KR` and specifies three DisplayPort 1.4a outputs plus one HDMI 2.1 output. It also documents the exposed PCB rear and a ventilation cutout. Neither source establishes component values, exact PCB revision or electrical nets.


## 22. Heatpipe counting convention and aftermarket fan catalog leads

The exact-model cooler sources do not currently support a single unambiguous count of unique closed heatpipe loops:

- The FPS Review identifies the exact retail SKU `12G-P5-3655-KR` and describes four central GPU-contact heatpipe runs plus two side runs. This is retained as **six described route/run positions**, not six independently verified U-shaped tube loops.
- PCWorld explicitly names the tested model as EVGA GeForce RTX 3060 XC Black Gaming but its overview describes four copper heatpipes. The accessible text does not provide the retail part number, so it is useful as an exact-product-name summary, not as an exact-PCB or calibrated cooler drawing.
- Gamers Nexus' exact-model teardown narration identifies two central tube paths passing through the GPU contact plate and estimates their diameter at approximately 6 mm. This is a separate observation and is not mechanically identical to a full loop count.
- LanOC's exact XC BLACK cooler-end image shows four copper terminal faces. Four visible faces do not independently establish the number of full tubes or loops.

The data model therefore preserves the FPS Review's 4 + 2 route/run description, the PCWorld four-heatpipe overview, the Gamers Nexus two central paths and LanOC's four visible terminal faces as separate claims. The six route meshes are selectable educational proxies only. The unique physical closed-loop count and exact routing remain unknown. Do not use the six proxies as a service, fitment, thermal or manufacturing specification.

### Aftermarket fan listings — leads, not OEM identification

Two aftermarket sellers advertise replacement fans for broad EVGA RTX 3050/3060/3060 Ti XC families and include XC BLACK in compatibility text. One listing associates PLA09215S12H with approximately 90 mm, 12 V, 0.55 A, 4-pin and 42 mm mounting-spacing claims. Another gives approximately 87 mm and 15 mm / 20 mm depth variants with similar electrical and mounting claims. These catalogue values are inconsistent on basic dimensions and are not an original fan label, manufacturer datasheet or exact-sample measurement.

The repository registers both as aftermarket compatibility leads only. The original fan manufacturer part number, exact frame diameter/depth, pinout, current, speed and replacement fitment remain **unknown** until the installed fan label and a physical sample are inspected. No seller product image or asset is redistributed.


## 23. Exact-SKU fan blade visual count

Newegg's retail gallery title and model field identify `12G-P5-3655-KR`. Two front-view product images show eight visible blade surfaces on each fan. The package records this as a **photo-observed visible count**, not as a manufacturer mechanical specification or examination of the installed sample. The Blender proxy and component graph now contain eight individually selectable blade meshes under each independent rotor. Blade camber, pitch, cross-section, thickness, depth, exact contour, embossed-E dimensions, RPM and OEM fan manufacturer/part number remain unverified. The retailer photographs are linked for attribution only and are not copied into the repository.


## 24. Thermal-pad guide conflict and exclusion

A search for additional pad dimensions surfaced a ThermalPad.eu guide titled for the EVGA RTX 3060 XC family. It attributes two 40 × 15 × 2 mm three-module strips and an additional 25 × 15 × 2 mm two-module strip to the RTX 3060 XC. Its own cited Reddit discussion, however, is titled around **3060 Ti XC** pad sizing. Commenters correct the model mix-up: the Gamers Nexus teardown is the RTX 3060 XC, with two banks of three VRAM packages; the 3060 Ti XC is described as adding a further two-module group. The page's mapping is therefore internally contradicted by its cited discussion and cannot safely be assigned to retail SKU **12G-P5-3655-KR**.

Decision: all ThermalPad.eu thickness/footprint values are excluded from the target model. They have not been used to alter memory-pad or VRM-pad geometry, claims or replacement guidance. The exact-model Gamers Nexus teardown's two approximate thickness observations (~2.0 mm and a less certain ~1.5 mm) remain separate, with their contact locations unresolved. The thermal-pad guide and the Reddit correction are registered for audit traceability, not as accepted pad specifications.

Sources:
- ThermalPad.eu family guide: https://thermalpad.eu/thermal-pad-sizes/evga-geforce-rtx-3060-xc-gaming-12gb-gddr6
- Linked r/TEAMEVGA discussion: https://www.reddit.com/r/TEAMEVGA/comments/ptbynd/does-anyone-know-what-is-the-thickness-of-thermal/
- Exact-model Gamers Nexus teardown: https://www.youtube.com/watch?v=hJFJ_clQT8U

## 25. Related XC board analysis and BoardView search boundary

Two additional technical references were examined but are not used as exact-SKU evidence. Hardware Asylum's teardown is labelled EVGA RTX 3060 XC Gaming and describes a pair of U-shaped heatpipes plus VRM cooling details; it does not correlate its sample to **12G-P5-3655-KR**. TechPowerUp's circuit-board analysis is likewise for EVGA GeForce RTX 3060 XC, without a verified XC BLACK sample identity. It lists a 5-phase GPU rail (uPI uP9512R / Alpha & Omega DrMOS) and a two-phase memory rail (uPI uP1666Q / M3828N MOSFETs). Those identifiers are retained only as family-variant leads and have not been transferred into the exact-SKU component inventory or VRM layer.

Public catalogue checks at GPU Doctor and the Badcaps RTX 3060 discussion did not reveal an exact EVGA **12G-P5-3655-KR** BoardView or a file correlated to a readable target PCB silkscreen/revision. This is a bounded search result, not proof that no file exists elsewhere. The EVGA232 / PG190-A02 lead remains uncorrelated: no exact sample photo, exact title block or primary source ties it to this retail board. Consequently, the bare-PCB outline, component coordinates, electrical nets, controller/MOSFET identities and VRM phase topology stay unresolved.

Sources:
- Hardware Asylum related XC teardown: https://www.hardwareasylum.com/reviews/video/evga_rtx3060/page3.aspx
- TechPowerUp related XC board analysis: https://www.techpowerup.com/review/evga-geforce-rtx-3060-xc/4.html
- GPU Doctor catalogue: https://gpudoctor.com/boardview/catalogue
- Badcaps RTX 3060 service-file discussion: https://www.badcaps.net/forum/document-software-archive/schematics-and-boardviews/3474108-nvidia-geforce-rtx-3060-schematic-board-view
- EVGA official 12G-P5-3655-KR specifications: https://www.evga.com/products/Specs/GPU.aspx?pn=fc6cb106-6765-4840-b472-9dba159cdc30

EVGA's official page identifies 12G-P5-3655-KR and states **whole-card** dimensions of 201.8 × 110 mm and dual-slot width. Those values are not bare-PCB measurements, and they provide no component coordinate system or service drawing.


## 26. Exact-model mechanical fastener groups — no false aggregate

The full Gamers Nexus transcript distinguishes several mechanical groups that were previously too coarsely described: (1) four spring-loaded GPU cooler screws passing through the PCB around the die; (2) a separate pair of screws retaining the fin-stack base to the board; (3) two narrower I/O-plate screws with nuts on the reverse side; (4) three smaller display-output retaining screws, for which the presenter selects a Phillips #0 driver; and (5) three mounting screws per independently replaceable fan. The video also points out extra shroud screws but the presenter is uncertain whether there are four or six, so the shroud count remains a logical candidate without a numeric value.

These observations must not be added into one grand screw count. Tom's Hardware separately reports eight cooler/shroud retention screws on the exact-SKU-linked sample (four around the GPU and four near the far end). The available material does not establish which of the fin-stack-base and I/O groups overlap with that aggregate. The model now separates the four GPU screws from the fin-stack-base pair, the I/O screw/nut pair and the three display-output screws. Only the four GPU screw positions have photo-positioned visual proxies; all other new groups are logical-only. The complete service sequence, all shroud screw positions, screw threads, lengths, head profiles and torque values remain unknown.

Source: Gamers Nexus exact-model teardown, especially 01:30–05:33 and 09:00: https://www.youtube.com/watch?v=hJFJ_clQT8U


## 27. Exact-product thermal/acoustic operating-point observation

PC Perspective's review explicitly names the sample **EVGA GeForce RTX 3060 12GB XC BLACK** and reports a Metro Exodus 2160/high observation in an open case at approximately **24 °C ambient**: GPU temperature **68.1 °C**, hotspot **80.5 °C**, fans at **73% / approximately 2030 RPM**, and board power peaking at **172.4 W**. This source does not publish the retail part number, so these are tagged as exact-product-name review measurements rather than exact part-number identity evidence. They represent one workload/sample operating point; do not use 2030 RPM as fan maximum or OEM rating, infer a fan curve from one duty point, or replace EVGA's published 170 W product rating with the single observed 172.4 W reading. The model keeps these as separate atomic measurements and leaves ambient/test context in the claim provenance.

Source: PC Perspective, 25 February 2021: https://pcper.com/2021/02/nvidia-geforce-rtx-3060-review-evga-xc-black-tested/


## 28. Power-process graph expanded from exact teardown observations

The qualitative power layer now exposes the individual nodes already documented by the exact-model teardown: auxiliary 8-pin input, its 5 mΩ current-sense shunt, the separate PCIe-slot 12 V current-sense shunt with unknown resistance, an input fuse, two inductor packages, a MOSFET row and its copper cooling contact. The two inductors are left in a tentative functional area; the reviewer's “memory VRM” interpretation is not promoted to a confirmed rail. The layer deliberately excludes the uPI controller and phase counts from the related non-BLACK XC PCB review. Directional animation remains an educational block diagram only, with no inferred nets, pinout or switching behavior.


## 22. OEM fan part-number research — conflicting aftermarket codes only

The original fan manufacturer part number for retail SKU `12G-P5-3655-KR` remains **unknown**. Additional marketplace research found a listing titled “Graphics Card Fan PLD09220S12HH For EVGA RTX3060 3060ti XC BLACK”, while aftermarket specialist catalogues advertise `PLA09215S12H` for a broad RTX 3050 / RTX 3060 / RTX 3060 Ti XC family. These codes are not interchangeable and the sellers' compatibility labels span multiple XC and XC BLACK variants. A Newegg listing for `PLD09220S12HH` describes broad RTX 3060 Ti / RTX 3070 / RTX 3080 XC3-family use and asks buyers to verify their removed fan's physical dimensions before purchase. These records are replacement-market claims only; none shows an OEM label from the exact retail sample or an EVGA service part record.

The conflict is useful negative evidence: neither `PLA09215S12H` nor `PLD09220S12HH` may be entered as the installed OEM fan identity. Published aftermarket dimensions also disagree (87 mm vs 90 mm, with 15 mm / 20 mm depth variants). The model therefore keeps `claim.fan.oem_part_identity` unknown and does not use either code to size the 3D fan. Required evidence to close this item is a legible sticker on a fan physically removed from an exact `12G-P5-3655-KR` sample, or an EVGA parts/service document that explicitly cross-references the retail SKU and fan assembly.

Sources:
- eBay marketplace listing for `PLD09220S12HH`: https://www.ebay.at/itm/227569888383
- GPU Fan Replacement listing for `PLA09215S12H`: https://www.gpufanreplacement.com/products/evga-geforce-rtx-3060-xc-gaming-fan-replacement
- GPUConnect listing for `PLA09215S12H` and 15 mm / 20 mm replacement variants: https://gpuconnect.com/products/evga-rtx-3050-3060-ti-xc-gaming-black-replacement-fans-15mm
- Newegg listing for `PLD09220S12HH` and broad XC3/XC family compatibility: https://www.newegg.com/p/0SS-0236-015R9

No seller image is copied into the repository. No third-party fan CAD, photograph or replacement part number is promoted to the target card's native hardware specification.


## 24. Conflicting XC BLACK-named review samples — backplate and fan size

Two further review pages use the XC BLACK product name but do not expose retail part number `12G-P5-3655-KR` in the accessible text. They are recorded as sample/variant references rather than exact-SKU evidence.

**HotHardware** describes a dual-fan angular shroud, E-logo blade markings, an anodized aluminium heatsink, copper heatpipes that extend over the GPU and back above the VRM, two-slot width, and a stylized rear backplate with hexagonal ventilation cut-outs. The rear-backplate statement conflicts with the LanOC review of the target XC BLACK sample, which shows an exposed PCB and explicitly describes no backplate. Without the HotHardware sample's P/N, the apparent backplate and VRM heatpipe arrangement must not be applied to 12G-P5-3655-KR. Its reported 7.5-inch PCB length and just-under-8-inch card length are also not promoted to exact-SKU measurements.

**PC Master Race Latinoamérica** describes two 80 mm fans on an XC BLACK Gaming sample. This differs from LanOC's approximate 90 mm opening / 85 mm impeller measurement on the exact XC BLACK review. These values may reflect different nominal/clear-opening/impeller conventions or a sample/variant difference; the source does not identify the retail P/N. Retain 85 mm only as LanOC's approximate reviewer measurement and flag the 80 mm statement as conflicting reference data, not as an OEM fan-size specification.

The current model therefore preserves two evidence classes: exact-SKU-linked observations and XC BLACK-named but P/N-unverified review descriptions. No new backplate geometry, VRM heatpipe route, PCB length or 80 mm fan dimension is inferred from the latter.

Sources:
- HotHardware, EVGA GeForce RTX 3060 XC Black Gaming overview: https://hothardware.com/reviews/nvidia-geforce-rtx-3060-gpu-review-evga
- PC Master Race Latinoamérica, EVGA GeForce RTX 3060 XC BLACK GAMING review: https://www.pcmrace.com/2021/04/05/evga-geforce-rtx-3060-xc-black-gaming-review/
- LanOC, exact XC BLACK layout/measurement and exposed rear PCB: https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1
