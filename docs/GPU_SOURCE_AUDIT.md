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
| [Hardwareluxx EVGA XC Gaming PCB/cooler review](https://www.hardwareluxx.com/index.php/artikel/hardware/grafikkarten/51282-test-und-review-evga-geforce-rtx-3060-xc-gaming-kompakt-und-schnell.html?start=2) | PCB/cooler analysis; reports five-phase power delivery for XC Gaming | XC Gaming, not confirmed exact XC BLACK; do not transfer board-specific claims without verification |
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
