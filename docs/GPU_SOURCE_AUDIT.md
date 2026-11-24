# GPU Source Audit — EVGA RTX 3060 XC BLACK GAMING 12GB

**Status:** initial source inventory; not complete asset/license clearance  
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
| [Gamers Nexus exact-model teardown](https://www.youtube.com/watch?v=hJFJ_clQT8U) | Explicit EVGA RTX 3060 XC Black disassembly; cooler, fans, PCB, thermal pads, shunt resistors and internal views | High-value visual evidence; video/images remain copyrighted unless permission/license permits reuse |
| [Tom's Hardware RTX 3060 teardown](https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review/2) | EVGA RTX 3060 teardown details, screw layout, fan connectors, Samsung GDDR6 package marking | Exact board/SKU matching must be checked before treating as XC BLACK-specific |
| [Hardwareluxx EVGA XC Gaming PCB/cooler review](https://www.hardwareluxx.ru/index.php/artikel/hardware/grafikkarten/51282-test-i-obzor-evga-geforce-rtx-3060-xc-gaming-kompaktnaya-i-bystraya-videokarta.html?start=2) | PCB/cooler analysis; reports five-phase power delivery for XC Gaming | XC Gaming, not confirmed exact XC BLACK; do not transfer board-specific claims without verification |
| [Hardware Asylum EVGA RTX 3060 teardown](https://www.hardwareasylum.com/reviews/video/evga_rtx3060/page3.aspx) | PCB and cooler removal observations; visible board population differences | Exact SKU/revision needs verification |
| [Scan UK product listing](https://www.scan.co.uk/products/evga-nvidia-geforce-rtx-3060-12gb-xc-black-gaming-ampere-graphics-card-3584-core-1320mhz) | Manufacturer part number 12G-P5-3655-KR and marketed name | Secondary identity source |
| [Micro Center refurbished listing](https://www.microcenter.com/product/678083/evga-nvidia-geforce-rtx-3060-xc-black-gaming-dual-fan-12gb-gddr6-pcie-40-graphics-card-%28refurbished%29) | Identifies XC Black and suffix variant 12G-P5-3655-KRR | Refurbished suffix; not exact selected retail part number |

## 3. Preliminary facts with source support

- Selected part number: 12G-P5-3655-KR.
- Product is an EVGA dual-fan RTX 3060 XC BLACK with 12GB GDDR6.
- EVGA's specification lists 3,584 CUDA cores, 192-bit memory interface, 15,000 MHz effective memory clock, PCIe 4.0, and 1777 MHz boost clock for this SKU.
- Gamers Nexus has a teardown explicitly titled for the EVGA RTX 3060 XC Black and documents internal cooler/PCB layout.
- Tom's Hardware reports eight rear screws for its EVGA RTX 3060 XC teardown and identifies six Samsung GDDR6 packages, marking K4ZAF325BM-HC16. Treat this as a cross-check until exact board matching is confirmed.

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
| Independent teardown/review | Located; variant matching pending |
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
