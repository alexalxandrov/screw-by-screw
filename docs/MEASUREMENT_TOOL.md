# Model-space measurement tool

## Purpose

The ruler lets a user select two points on the currently loaded 3D surface and inspect their straight-line separation. It is a viewer interaction aid, not a metrology tool.

## Interaction

1. Enable Measure in the process panel.
2. Click a visible point on the model surface.
3. Click a second visible point. The viewer draws two endpoint markers and a connecting line.
4. The readout reports the Euclidean distance in the model package's declared coordinate units.
5. A third point starts a new two-point measurement. Clear removes the markers and line. Escape exits measurement mode.

While measurement mode is active, surface clicks are captured by the ruler and do not change component selection. Disable the tool to resume ordinary component selection.

## Units and accuracy

- A complete .sbsmodel can declare model.coordinate_system.units; the viewer displays that label.
- A plain GLB has no trusted unit metadata in this viewer contract, so it is labelled model units.
- The number is calculated from transformed 3D coordinates in the loaded scene.
- The tool does not calibrate the model against photographs, manufacturer dimensions or physical measurements.
- A measurement on illustrative_proxy_not_cad geometry is only a measurement of that proxy. It must not be presented as a verified dimension of the real device.
- No measurement is uploaded or persisted; all state remains in the current browser page.

## Implementation

MeasurementController owns the temporary overlay and the two selected world-space points. It is independent of device-specific content and is tested separately from the RTX 3060 pilot.
