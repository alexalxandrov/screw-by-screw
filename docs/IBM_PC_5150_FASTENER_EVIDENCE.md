# IBM PC 5150 — fastener and board-mounting evidence audit

## Scope

This note applies to the reference package `computer.ibm.5150.1981`: the August 1981 launch-era 16 KB system-unit baseline and the first 16–64 KB system-board family. It is not a teardown guide for every 5150 revision or a serial-specific machine.

The controlling service source is the **IBM Personal Computer Hardware Maintenance and Service, first edition, August 1981**, especially the printed pages listed below. The manual mirror is linked for reference only; the copyrighted manual is not redistributed.

## What the first-edition IBM service procedure actually establishes

| Area | Documented observation | Treatment in the atlas |
|---|---|---|
| System-unit cover | Two rear retaining screws are loosened as part of cover removal; they are not necessarily removed completely (printed pp. 3-98–3-99). | Two separate screw anchors. Position, head profile, dimensions and thread remain proxies/unknown. |
| Power supply | Four PSU mounting screws are removed during FRU removal (printed pp. 3-99–3-102). | Four separate screw anchors. PSU remains a sealed FRU; no internal mains service geometry or procedure. |
| Speaker | Two speaker mounting screws are used for speaker removal (printed p. 3-106). | Two separate screw anchors; exact screw geometry unknown. |
| System board | The first-edition procedure identifies **one** system-board mounting screw (printed pp. 3-107–3-110). | One semantic fastener and one visible screw proxy. Do not increase this to two for the launch-era reference. |
| Board supports | IBM describes plural standoffs and matching mounting slots. The cited procedure does **not** state their count, exact shape, spacing, or metric coordinates. | Four support and slot markers are shown solely as illustrative placeholders. The actual count and placement are marked unknown. |
| Board release motion | After removing the board screw and disconnecting the relevant leads, slide the board approximately **1/2 inch (12.7 mm) away from the PSU** until the standoffs clear their slots. | Preserved in the partial service step as a manual-backed release motion. This is not a measured animation path or a complete teardown sequence. |

Primary reference: [IBM Personal Computer Hardware Maintenance and Service — first edition, August 1981](https://manualzz.com/doc/74076016/ibm-5150-hardware-maintenance-manual).

## Why some photographs show a different arrangement

A later PCWorld photographic inspection of one used, revision-unmatched IBM 5150 describes **two motherboard screws and four plastic standoffs**. The article does not establish that the photographed board is the first 16–64 KB board documented in the August 1981 manual, or that its fasteners match the launch baseline.

Reference: [PCWorld — Inside the IBM PC 5150: The first-ever IBM PC](https://www.pcworld.com/article/416011/inside-the-ibm-pc-5150-the-first-ever-ibm-pc.html).

This is recorded as specimen variance, not as a conflicting manufacturer specification. The atlas keeps the primary manual's one-screw procedure for the selected launch-era package and does not promote the PCWorld specimen to a general 5150 fastener layout.

## What is still unknown

The available evidence does not establish the exact coordinates of every fastener or standoff, hole/slot dimensions, sheet-metal thickness, screw head standard, drive type, thread pitch, screw length, material grade, torque, or the exact number of board standoffs in the chosen launch-era baseline.

The visible slotted-head marks in the Blender model are only neutral visual proxies. They do **not** identify a slotted, Phillips, Pozidriv, or other standardized drive, and they do not imply a real fastener size or torque value. The model uses `illustrative_proxy_not_cad` geometry throughout.

## Geometry updates

The Blender blockout now:
- uses a 494 × 410 × 140 mm outer envelope only as a reference to one FAU 1981 museum specimen (not an IBM-wide specification);
- depicts the board as one IBM-documented retaining screw;
- shows polymer-looking standoff markers and matching PCB slot marks, explicitly labelled as illustrative placeholders with unknown count/coordinates;
- adds simple visual slits to fastener proxies without asserting a drive standard;
- keeps PSU internals out of the model and preserves the sealed-FRU boundary.

Museum reference: [FAU Informatics Collection — IBM PC specimen, 1981](https://www.iser.fau.de/2025/04/25/neuzugang-ibm-pc-mit-monitor/).

## Service and safety boundary

The five included service operations are partial, source-bounded FRU operations. They are not a universal screw-by-screw teardown order for every option configuration. Disconnect the system unit from mains before opening it. Do not open or probe the PSU; no PSU internal repair steps are included.
