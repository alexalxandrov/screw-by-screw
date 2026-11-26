# IBM Personal Computer 5150 — 1981 system-unit package

Canonical model ID: `computer.ibm.5150.1981`  
Package version: `0.1.0-draft`  
Geometry: `illustrative_proxy_not_cad`

This is an educational reference package for the original IBM 5150 system unit, using the August 1981 launch-era baseline: 16 KB RAM, no fitted diskette drive, and the first 16–64 KB system-board family. The display, keyboard, printer, external cassette recorder, and optional adapter cards are outside the package. It is not a later 5150 board revision or an IBM PC/XT 5160.

## Package inventory

- 71 semantic components with stable IDs and bilingual descriptions.
- 100 typed component relationships.
- 21 source-linked technical claims.
- 5 functional layers and 12 bilingual learning questions.
- 14 granular, source-linked disassembly actions in 7 presentation groups, arranged as a branching FRU dependency graph rather than one universal linear teardown.
- 4 source-bounded replacement fragments (cover, option adapter, PSU and system board); they are not a complete end-to-end reassembly.
- 5 educational animation clips (overview, cover, PSU, speaker and system-board motion); all are educational approximations, not physical simulations.
- 6 registered sources, led by the two August 1981 IBM manuals and IBM corporate history, plus specimen-specific FAU and PCWorld comparison records.

## Evidence boundaries

The August 1981 technical reference is the authority for the initial board family, the 8-bit I/O channel, system timing, interfaces, and 63.5 W / 120 Vac power supply. Later 220/240 Vac variants are excluded. The launch baseline is documented as 16 KB RAM with no disk drive. The service manual documents individual FRU removal and replacement procedures, but not one universal screw-by-screw sequence for every option configuration. The atlas encodes 14 actions in seven named groups with explicit prerequisites: common opening, conditional option adapters, shared connector preparation, PSU FRU, shared speaker connector, speaker FRU and system-board FRU. After the cover is off, PSU, speaker and board removal are independent branches; the board branch does not require removing the PSU or the speaker assembly. The board branch does require releasing P1/P2, the speaker connector and any fitted adapter/diskette leads. For the system board, its August 1981 first-edition procedure specifies one retaining screw followed by an approximately 1/2-inch slide away from the PSU. It mentions standoffs and slots but does not state their count or metric placement. Four visible standoff/slot markers are illustrative placeholders only. A PCWorld used specimen with two board screws and four standoffs is revision-unmatched and is not used to redefine this baseline.

The case envelope follows one 1981 FAU museum specimen catalogued at 494 × 410 × 140 mm (L × W × H). That specimen has CGA and memory expansion; these dimensions are secondary specimen-specific evidence, not an IBM-wide specification or a serial-matched launch measurement. Relative board-component zones follow IBM Technical Reference Fig. 4 (printed p. 2-13), but the figure is not dimensioned. Exact component XY coordinates, sheet-metal folds, board-hole pattern, screw coordinates and fastener dimensions remain visual proxies or unknown. Four replacement fragments preserve only the steps explicitly covered by IBM (cover, option adapter, PSU and system board). The manual has no separately headed speaker replacement procedure, so no such sequence is invented. The 14-step graph and fragment limits are documented in [IBM PC 5150 disassembly sequence](../../../docs/IBM_PC_5150_DISASSEMBLY_SEQUENCE.md). The PSU is represented as a sealed FRU. Disconnect mains power before opening the system unit; do not open or probe the PSU.

See the [fastener and board-mounting evidence audit](../../../docs/IBM_PC_5150_FASTENER_EVIDENCE.md), [model research and geometry notes](../../../MODELS/COMPUTERS/IBM/5150/README.md), [atlas implementation specification](../../../docs/IBM_PC_5150_ATLAS_SPEC.md), and the [source register](../../../MODELS/COMPUTERS/IBM/5150/00-SOURCES/REFERENCE_REGISTER.md).
