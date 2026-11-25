# RTX 3060 XC BLACK — deep component atlas tranche

Target: EVGA GeForce RTX 3060 XC BLACK GAMING 12GB
Retail part number: 12G-P5-3655-KR
Development branch: feat/rtx3060-deep-component-atlas
Geometry class: illustrative_proxy_not_cad
Status: engineering increment; not a complete card reconstruction

## What this tranche adds

The canonical model package and Blender GLB gain matching stable component IDs for the GA106 silicon die proxy; thermal-interface parent group, GPU compound marker, memory pads and power-stage pad group; candidate cooler fastener set and eight individually selectable screw placeholders; PCI Express edge interface with representative segmented contacts; two independent fan-cable header nodes; three DisplayPort and one HDMI receptacle nodes; selectable shunt-resistor area and generic passive group; and PCB airflow-cutout marker.

The package adds source-backed relations and claims where evidence exists, and keeps all component names and descriptions bilingual. The Blender scene uses matching sbs_component_id values and preserves the hierarchy declared in components.json.

## Evidence interpretation

| Area | Current status | What is not claimed |
|---|---|---|
| GPU die | visual proxy | exact die outline, dimensions, substrate stack |
| Thermal compound/pads | teardown-supported presence | brand, thickness, hardness, precise coverage |
| Eight cooler screws | candidate count from a related EVGA XC teardown | exact-SKU count, locations, thread, torque, order |
| PCIe edge | manufacturer interface claim / visual proxy | measured pin field, signal map, lane routing |
| Fan headers | two teardown-visible connections | pinout, voltage, PWM/tach mapping |
| Display ports | three DP + one HDMI from SKU specification | manufacturing shell geometry |
| Shunt area | exact-model teardown discussion | resistance, reference designators, electrical topology |
| Power passives | visual grouping only | MOSFET identity, phase count, values, controller |
| PCB cutout | visible in exact-model review | calibrated contour or measured dimensions |
| PCB revision | unknown | EVGA232 REV 1.0 is only a candidate photo observation |

## Reproducible validation

From repository root, regenerate and validate the semantic package using:
python tools/content/build_release_manifest.py content/models/evga-rtx3060-xc-black-12gb
python tools/content/validate_model_package.py content/models/evga-rtx3060-xc-black-12gb

Blender generation and GLB binding are exercised by the Blender blockout generation GitHub Actions workflow after the branch is pushed. Browser tests then open the generated GLB/package and validate the generic viewer.

## Remaining work before a detailed GPU model can be called complete

1. Identify the exact physical PCB revision and reconcile the apparent EVGA232 REV 1.0 image lead.
2. Obtain and legally validate a BoardView and schematic for that exact revision.
3. Verify the full BOM, reference designators, VRM topology, MOSFETs, controller, shunts, passive values and connector pinouts.
4. Replace proxy dimensions with calibrated measurement or licensed CAD for shroud, PCB, heatsink, heatpipes, fans, fasteners and all connectors.
5. Review the complete exact-model teardown before authoring any service/removal sequence.
6. Add evidence-backed electrical and thermal diagrams; keep CFD, thermal FEA and SPICE as separate numerical projects.
7. Obtain asset reuse rights, then perform visual acceptance on the generated blend, glb and sbsmodel.

No exact board revision, undocumented value, repair procedure or physical simulation is invented in this tranche.
