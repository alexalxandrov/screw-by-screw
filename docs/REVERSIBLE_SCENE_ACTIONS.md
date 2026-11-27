# Reversible 3D scene actions

## Purpose

A package-authored scene action is a visual state transition attached to a source-backed assembly step. It connects a procedural instruction to a real semantic node in the imported GLB, while keeping measured manufacturer data separate from illustrative motion.

Scene actions are not a physics simulation, not CAD, and not a substitute for the source manual.

## Action contract

Each action is stored under an assembly step as `scene_action`:

- `step_id`: stable ID of the containing procedure step.
- `type`: `hide`, `translate`, `select`, or `conditional`.
- `target_component_ids`: stable semantic component IDs that change state.
- `direction`: where relevant, one of `away_from_component`, `frontward`, `up`, or `outward_from_case`.
- `reference_component_id`: required when the direction is relational (for example, board away from PSU).
- `distance` and `unit`: only populated when the source specifies travel.
- `distance_mode`: `visual_clearance` when a demonstrative offset is calculated from model bounds instead of a manufacturer dimension.
- `evidence_class`: provenance category for the effect.
- `note`: RU/EN explanation visible in the inspector.
- `reversible`: whether the Viewer can restore the previous state by replaying an earlier timeline position.

## Implemented action types

| Type | Viewer behaviour | Evidence boundary |
|---|---|---|
| `hide` | Hides the named fastener or connector mesh after the operation. | `teardown_supported`; the hidden mesh is a didactic state, not a simulated threaded or electrical mechanism. |
| `translate` | Moves the named semantic assembly in a source-defined or explicitly illustrative direction. | `manufacturer_data` only when the source states a travel distance; otherwise `illustrative`. |
| `select` | Selects the affected semantic component when no separate moving mesh exists. | No geometry or distance is inferred. |
| `conditional` | Records an explicit no-op for absent optional hardware. | Conditional on the fitted configuration; not an omitted or failed operation. |

## IBM PC 5150 launch-baseline example

The system-board release uses `direction: away_from_component`, `reference_component_id` pointing to the power supply, and `distance: 12.7`, `unit: mm`. At runtime the Viewer calculates the direction from the two component centers in the 3D scene and converts the world-space displacement into the board node's parent-local coordinates.

The IBM manual states the approximately 1/2-inch (12.7 mm) slide away from the PSU. This is the only numeric board-release travel asserted as manufacturer data. The subsequent lift is an illustrative visual clearance, because IBM does not dimension the lift path or standoff coordinates.

The PSU's forward 12.7 mm slide is likewise stored as manufacturer-stated. Lifts, lateral extraction, cover clearance and speaker removal use model-relative visual offsets and remain illustrative.

## Timeline and reversal

The Viewer captures the baseline position and visibility state of each semantic node when a model is installed. When a user chooses a step, the runtime restores that baseline, applies all prior actions in package order, and animates the final action. Previous replays the preceding prefix; Next advances; Reset restores the baseline. This avoids accumulated floating-point drift and makes the demonstration reversible.

A step card may jump directly to that step in the full package sequence. The component links remain navigable. Conditional and select-only steps are preserved in the timeline even if they do not move geometry.

## Limits

- A hidden screw does not simulate thread rotation, loosening torque, or the real screw's extraction path.
- A hidden connector does not assert plug friction, pin geometry, or a specific pull vector.
- A translation whose distance is derived from model bounds is an educational clearance, not a physical dimension.
- The 3D geometry remains `illustrative_proxy_not_cad`; no action upgrades a proxy mesh to measured CAD.
- The four textual replacement fragments remain partial. Reverse navigation restores a demonstration state; it is not a complete end-to-end installation procedure.
- Unspecified directions, screw parameters, cable routing, clearance and torque remain unknown.

## Validation

The IBM browser integration test loads the actual `.sbsmodel` package, checks the full procedure timeline, moves forward and backward, confirms Reset, and verifies the board's source-backed 12.7 mm slide action is exposed in the scene state. The Blender CI rebuilds the GLB and portable model package before running this test.
