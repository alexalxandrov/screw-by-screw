# Visual Reference Log

This file records observations, not copied images. Linked sources remain under their original copyright.

## LanOC — exact EVGA RTX 3060 XC Black review

Source: https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1

- Compact dual-fan design.
- Black plastic shroud; no RGB lighting reported.
- Fan openings approximately 90 mm; impellers approximately 85 mm.
- Official length cited as 201.8 mm; reviewer notes shroud overhang can make total length slightly longer.
- Height reported as 110 mm; dual-slot.
- No backplate; PCB rear is exposed.
- Cooler uses an aluminum fin stack, copper GPU contact plate and heat pipes.
- Copper contact plate is described as wide enough to cover GPU and memory thermal contact area.
- Three DisplayPort outputs and one HDMI output.
- PCB includes a large airflow cutout near one end.

Useful source-page image links: image 9–18; image 13 and image 19 include layout/PCB views. Do not copy without permission.

## Gamers Nexus teardown

Source: https://www.youtube.com/watch?v=hJFJ_clQT8U

- 01:30 disassembly begins.
- 05:33 assembly and internal view.
- 06:45 markings and cooling layout.
- 09:00 fan removal.
- 11:00 shunt resistors.

## Open questions

- Exact PCB silkscreen identifier and revision.
- Exact fan manufacturer/model and connector pinout.
- Exact fastener count, lengths, thread and removal sequence.
- Exact heatpipe count, routing and dimensions.
- Exact memory package part number on this retail SKU.
- Full component reference designators and values.


## Image-level inspection — LanOC exact XC BLACK sample — 2026-11-25

The page's original image links were opened and inspected individually. These remain remote references; no image files were copied into this repository.

- [Image 9 — front three-quarter / fan side](https://lanoc.org/images/reviews/2021/evga_rtx_3060_xc_black/image_9.jpg): shows the black dual-fan shroud, two large fan openings, central raised EVGA logo area, lower GeForce RTX marking, and textured/recessed outer zones. Treat exact contour and dimensions as photo-estimated until calibrated.
- [Image 13 — exposed PCB rear](https://lanoc.org/images/reviews/2021/evga_rtx_3060_xc_black/image_13.jpg): rear PCB is exposed with no backplate. The retail label visibly identifies the sample as 12G-P5-3655-KR. A large stylized airflow cutout is visible near one end. Multiple component and screw locations are visible, but this photograph alone is not a full BoardView.
- [Image 15 — top-edge power connector](https://lanoc.org/images/reviews/2021/evga_rtx_3060_xc_black/image_15.jpg): confirms the single 8-pin power receptacle on the top edge and shows the fin stack below the shroud. Exact connector coordinates remain unmeasured.
- [Image 16 — heatsink / heatpipe end view](https://lanoc.org/images/reviews/2021/evga_rtx_3060_xc_black/image_16.jpg): shows the black EVGA-branded shroud edge, metal heatsink body and visible copper-colored heatpipe ends. Do not infer exact pipe routing/count from this view alone.
- [Image 17 — long side profile](https://lanoc.org/images/reviews/2021/evga_rtx_3060_xc_black/image_17.jpg): shows a long fin-stack profile under the shroud and the close relationship between cooler, PCB and bracket. Supports a fin-array proxy rather than one solid heatsink block.
- [Image 18 — fan cable/header area](https://lanoc.org/images/reviews/2021/evga_rtx_3060_xc_black/image_18.jpg): shows two fan leads/connectors at the side of the cooler. Their exact electrical pinout is not established here.
- [Image 19 — I/O bracket](https://lanoc.org/images/reviews/2021/evga_rtx_3060_xc_black/image_19.jpg): confirms a ventilated hexagonal bracket pattern and three DisplayPort openings plus one HDMI opening.

Source description also states that the heatsink has vertically oriented fins, a copper contact plate wide enough to cover GPU and memory thermal-contact areas, and heatpipes carrying heat toward the ends of the fin stack. Source page: https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1

### Geometry implications

1. Replace the single heatsink block with individually selectable fin proxies aligned to the observed side-profile direction. Their count, pitch and thickness remain photo-estimates.
2. Add heatpipe proxies as separate components, but keep count and route explicitly unverified pending clearer teardown frames or direct measurement.
3. Replace the current skeletal shroud rails with a continuous front fascia containing two fan apertures, a central bridge, upper/lower branding zones and approximate recessed side regions.
4. Change the PCB proxy from a plain rectangle to a board outline with the photographed ventilation cutout. Exact board outline and notch dimensions remain photo-estimates.
5. Add a central four-fastener GPU/heatsink mounting pattern as an explicitly evidence-backed location group; individual screw dimensions and full service order remain unknown.
6. Model the I/O bracket with a hexagonal ventilation field and four port openings; port identities/count are supported, exact opening geometry is a photo-estimate.

These are the next modeling targets. None of the photo-derived geometry should be labelled measured or manufacturer CAD.
