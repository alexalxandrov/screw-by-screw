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
