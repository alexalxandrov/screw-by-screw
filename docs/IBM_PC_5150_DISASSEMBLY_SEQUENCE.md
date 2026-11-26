# IBM PC 5150 — documented disassembly branches and service-motion clips

## Scope and interpretation

This sequence graph applies to the IBM Personal Computer 5150 launch-era reference package `computer.ibm.5150.1981`, restricted to the first 16–64 KB system-board family documented in the **first-edition IBM Hardware Maintenance and Service manual, August 1981** (archival document 6025072).

The package records 14 granular actions in seven display groups. It is **not one universal linear teardown**. The common opening steps establish a safe access state; after that, the power supply, speaker and system board are separate field-replaceable-unit (FRU) branches. A branch can share connector-preparation actions without requiring the other FRU to be physically removed.

Sequence numbers are editorial display order. The `prerequisite_step_ids` fields are the procedural dependency graph. The Viewer labels each branch and displays the prerequisite list on the individual action card.

## Common access state

1. Switch the System Unit off, disconnect the mains cord at the wall and at the rear of the computer, and disconnect rear-panel cables.
2. Loosen the two rear cover-retaining screws. IBM says to loosen them; it does not require fully extracting them.
3. Slide the cover toward the front until it clears the chassis.

The first three actions apply before any of the FRU operations below. IBM's printed procedure locators are pp. 3-98–3-99.

## Optional adapter branch

- If an adapter is fitted, remove its retaining screw, grasp the top corners and lift it straight up from its expansion slot.
- The modeled August 1981 launch baseline has five empty expansion slots; the step is a conditional no-op for that baseline.

Source locator: IBM printed pp. 3-95–3-97.

## Power-supply FRU branch

1. Disconnect both system-board power connectors P1 and P2. Grip the connector bodies; do not pull the wires.
2. Only if diskette drives are fitted, disconnect their power and signal leads. Reposition the signal cable so it will not obstruct the PSU's forward slide.
3. Remove the four PSU mounting screws.
4. Push the PSU forward approximately **1/2 inch (12.7 mm)**, lift it, then slide it left to remove it.

Source locator: IBM printed pp. 3-99–3-102. The forward slide distance is specified; the manual does not dimension the lift clearance or lateral travel. The launch baseline has no installed diskette drive, so its drive-lead check is a no-op.

The PSU is modeled as a sealed FRU. This package does not describe opening the PSU or servicing internal mains circuitry.

## Speaker FRU branch

1. Disconnect the speaker leads from system-board connector P3.
2. Remove the two speaker mounting screws.
3. Remove the speaker.

Source locator: IBM printed p. 3-106. The manual does not dimension the speaker extraction path; the Viewer lift is an educational illustration only.

## System-board FRU branch

The system board can be removed without first extracting the PSU or the speaker assembly. Before the board itself is lifted:

1. Remove all fitted option adapters (the launch baseline has none).
2. Disconnect P1 and P2 from the board.
3. If diskette drives are fitted, disconnect their power and signal connectors.
4. Disconnect the speaker connector P3. This is a shared connector-preparation action; it does **not** require removing the speaker assembly.
5. Remove the single system-board retaining screw documented by the August 1981 first-edition procedure.
6. Slide the board approximately **1/2 inch (12.7 mm) away from the PSU** until the standoffs clear their mounting slots.
7. Lift the released board up and out.

Source locator: IBM printed pp. 3-107–3-108. The manual confirms plural standoffs and slots but does not state their number, dimensions or coordinates. The four visible support markers in Blender remain illustrative placeholders.

A different used, revision-unmatched specimen described by PCWorld has two board screws and four plastic standoffs. That observation is recorded as sample variance only and is not applied to the first-board launch reference.

## Replacement fragments — not a complete rebuild

The package records four source-bounded replacement fragments from the IBM manual:

- **Cover** (printed p. 3-98): slide the cover rearward, align the two retaining screws with their threaded tabs, tighten them, then reconnect external cables.
- **Option adapter** (printed p. 3-97): insert the card into the slot, press it firmly to seat the connector, then install its retaining screw.
- **Power supply** (printed p. 3-102): position the PSU about 1/2 inch from the rear plate, slide it into place, align the holes and replace four screws; reconnect drive leads only if drives are fitted, then reconnect board power.
- **System board** (printed pp. 3-109–3-110): align standoffs with slots, slide the board toward the PSU until its screw hole aligns, install the single screw, reconnect the speaker, reinstall adapters and fitted-drive cables, then reinstall the cover.

The manual does not supply a separately headed speaker-replacement procedure. The four fragments are therefore not merged into a single end-to-end reassembly sequence. Unspecified cable routing, connector force and fastener torque remain unknown.

## Motion clips

The package retains the cover slide demo and adds three separate service-motion clips:

- PSU: forward 12.7 mm, followed by illustrative lift and leftward travel.
- Speaker: illustrative lift only; no path dimension is given by IBM.
- System board: 12.7 mm away-from-PSU release slide, followed by an illustrative lift.

All clip evidence states are `educational_approximation`. The explicit 1/2-inch slide distances are manufacturer-stated; no unmeasured clearance vector or animation duration is represented as measured motion.

## Safety and unresolved geometry

Disconnect mains power before opening the case. Do not open or probe the PSU. Do not force a board that does not slide freely; check for a remaining connector or fitted adapter. Exact screw drive standards, dimensions, lengths, thread pitch, materials and torque are not supplied by the cited removal procedures. Standoff count and PCB slot coordinates remain unknown.
