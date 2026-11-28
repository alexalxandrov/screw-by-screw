# OptiPlex 5060 Tower — procedural geometry v0.4.1

The package retains 137 stable semantic component IDs and 145 typed relationships. Geometry-bearing nodes increase from 58 to 84:

| Primitive | Count | Use |
|---|---:|---|
| Box | 45 | Remaining chassis, PCB, PSU and hardware proxies |
| Panel | 7 | Chassis and front/rear I/O backing groups |
| Drive cage | 1 | Generic open storage carrier |
| I/O port | 25 | Selectable standard ports, indicators and openings |
| Cylinder | 2 | Coin-cell battery and power button |
| Fan | 3 | CPU, system and PSU fans |
| Fin stack | 1 | CPU heatsink |

New generators are `panel`, `drive_cage`, `vent_grille` and profile-specific `io_port`. The grille is implemented/tested but not placed on the 5060 model. Optional modules remain unknown and are not rendered as fitted. I/O placement and dimensions are schematic. Dell's current front/rear illustrations visibly say 5070 despite being hosted under the 5060 guide URL; their image pixels were excluded from coordinate reconstruction. Whole-model fidelity remains `illustrative_proxy_not_cad`.

See [external I/O evidence audit](OPTIPLEX_5060_IO_GEOMETRY_EVIDENCE.md).

## Viewer inspection pose and component separation

The Dell OptiPlex 5060 Tower opens in a deliberately pre-disassembled inspection pose: the general exploded-view control starts at 100%, and the camera is fitted after that pose is applied. The chassis frame, top/bottom panels, side cover, front/rear panels and motherboard tray use a translucent x-ray presentation (18% material opacity); internal assemblies and connectors remain opaque so they stay legible. The user can return to the assembled pose with **Assemble** or the Explore view.

The generic exploded-view controller derives its movement factor from each loaded model's bounding-box diagonal, with a minimum clearance factor for small models. At 100%, independent semantic leaves are displaced by approximately 42% of the overall model diagonal. Package-authored illustrative position tracks and procedural removal offsets are amplified by 2.8× at runtime. Tracks/actions explicitly marked as manufacturer data are not amplified. These are presentation clearances only: they are not measured service travel, fitment tolerances or physical removal paths.

Automated coverage checks the default Dell x-ray/exploded state, responsive camera bounds, model-scaled exploded clearance, enlarged animation/procedure offsets and preservation of manufacturer-stated offsets.
