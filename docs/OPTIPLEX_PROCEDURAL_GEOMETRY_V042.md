# OptiPlex 5060 Tower — chassis geometry and unified disassembly scrubber v0.4.2

## Package baseline

The Dell package is a family-level research blockout, not an exact individual build or CAD reconstruction. The v0.4.2 package retains **137 stable semantic component IDs**, **145 typed relationships**, **30 registered source records** and **36 atomic claims**. It contains **85 geometry nodes**. Optional hardware population remains unknown unless explicitly supported by a source.

The 85 proxy geometry nodes are counted by primitive type in `release.json`:

| Primitive | Count | Use |
|---|---:|---|
| Box | 45 | Board, power, hardware and general component proxies |
| Panel | 7 | Chassis, backing and I/O panel proxies |
| Chassis frame | 1 | Open tower perimeter structure |
| Drive cage | 1 | Generic open storage carrier |
| I/O port | 25 | Selectable standard port and indicator proxies |
| Cylinder | 2 | Coin-cell battery and power button |
| Fan | 3 | CPU, system and PSU fan proxies |
| Fin stack | 1 | CPU heatsink proxy |
| **Total** | **85** | |

All geometry remains `illustrative_proxy_not_cad`. The new chassis frame is a schematic structural envelope, not measured sheet-metal CAD.

## Visible chassis geometry

The previous v0.4.1 inspection state started at 100% exploded and applied 18% material opacity to outer case pieces. That made it difficult to read the actual tower enclosure and is no longer the current default.

In v0.4.2:

- The tower opens in its **assembled, opaque** state at 0% displacement.
- `chassis.frame` now owns a generated `chassis_frame` mesh with four corner uprights, perimeter rails and rear cross-rails. The frame is visible even when the side cover is installed.
- The base and top panels retain the default panel normal.
- The removable side cover uses the X-facing panel orientation.
- The front bezel and rear panel use the Z-facing panel orientation.
- Panel proxy meshes have a visibly solid central sheet and reinforced edge lips; their scale and placement remain schematic.
- Internal semantic components remain independently selectable. Parent chassis meshes do not tint or hide nested motherboard, port or cooling nodes.

The transform metadata applies axis-specific rotations and scale permutations, so panel height, width and thickness remain on their intended world axes. Automated geometry tests check frame mesh generation, panel-axis rotations and nonuniform transform ordering.

See [external I/O evidence audit](OPTIPLEX_5060_IO_GEOMETRY_EVIDENCE.md). Dell's current front/rear guide pages are hosted under the OptiPlex 5060 URL but their embedded images visibly carry a 5070 label. Those image pixels are excluded from 5060 placement; source legends and text specifications are used for identity/count only.

## One scrubber for model motion

Dell uses one visible timeline range control, `#assembly-scrubber`, for all model motion:

| Mode | Scrubber range | Meaning |
|---|---:|---|
| Disassembly | 0–12, integer steps | 0 is assembled; 1–12 apply the ordered authored procedure steps |
| Authored animation | 0–1000 | Normalized time position within the selected clip |

Dragging across the twelve procedure steps applies the corresponding reversible scene actions and updates the current-step description. Returning to zero restores the captured assembled baseline. The slider does not claim that every logical step has physical motion: some steps are source-backed selection/highlight or conditional actions because the optional component may not be fitted.

When an authored clip is selected, that same control becomes its time scrubber. Switching from an in-progress procedure step to a clip first restores the assembled baseline; stopping the clip returns the scrubber to the disassembly mode at step zero. There is no separate explode slider or second animation-seek input for the Dell workflow. Duplicate previous/next/reset and per-card run-step controls are hidden for Dell; the component detail list remains as read-only reference material.

Other models retain their normal 0–100 exploded-view control. The single-control Dell workflow does not alter their assembly behavior.

## Interface and accessibility

The assembly scrubber has a larger thumb and track to make dragging easier. Viewer toolbar, component-tree, detail-panel, procedure and timeline typography are slightly larger. The input remains keyboard-operable and has mode-specific accessible labels. Automated browser coverage exercises the one-slider workflow and checks that the obsolete slider selectors and redundant Dell procedure controls are absent.

## Verification scope

Current test coverage includes:

- generator tests for `chassis_frame`, panel-axis orientation, geometry buffers and invalid proxy metadata;
- production-loader package validation for the v0.4.2 sidecars and regenerated GLB;
- browser tests for the assembled opaque default, visible chassis component IDs, 12-step scrubber range, representative side-cover/front-bezel/fan/board steps, return to step zero, authored clip seeking, and clip stop/reset;
- checks that the Dell UI contains one motion slider and no duplicated per-step execution controls.

These checks establish correct behavior of the schematic viewer model and its interaction state. They do not establish physical service clearances, fastener travel, exact metal folds, or removal paths beyond the service sequence documented by the source material.
