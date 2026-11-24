"""
Screw by Screw — EVGA RTX 3060 XC BLACK blockout generator.

Run from the repository root:
  blender --background --python tools/modeling/build_rtx3060_xc_black_blockout.py

Optional arguments (after Blender's --):
  --output-dir PATH
  --no-glb
  --no-blend

All geometry is proxy/blockout geometry. Only the card envelope is manufacturer-published.
Fan dimensions are reviewer measurements; component placement and thickness are illustrative
until confirmed from an orthogonal reference or a physical sample.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy

REPO_ROOT = Path(__file__).resolve().parents[2]
MODEL_ROOT = REPO_ROOT / "MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB"
DEFAULT_OUTPUT = MODEL_ROOT / "04-WORKING/generated"

# All coordinates and dimensions below are millimetres (scene scale_length = 0.001).
CARD_LENGTH = 201.8       # manufacturer-published nominal length
CARD_HEIGHT = 110.0       # manufacturer-published nominal height
FAN_OPENING_DIA = 90.0    # reviewer measurement, approximate
FAN_IMPELLER_DIA = 85.0   # reviewer measurement, approximate

# Illustrative placeholders only — replace when measured from a sample or calibrated views.
CARD_THICKNESS = 36.0
FAN_CENTERS_X = (55.0, 146.0)
FAN_CENTER_Z = 56.0
SHROUD_THICKNESS = 5.0
PCB_THICKNESS = 1.6
HEATSINK_THICKNESS = 13.0

STATUS = {
    "manufacturer_data": "manufacturer_data",
    "reviewer_measurement": "reviewer_measurement",
    "illustrative": "illustrative",
    "photo_estimate": "photo_estimate",
}

def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--no-glb", action="store_true")
    parser.add_argument("--no-blend", action="store_true")
    return parser.parse_args(argv)

def material(name, color, roughness=0.65):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.roughness = roughness
    return mat

MAT = {
    "shroud": material("Proxy | shroud", (0.075, 0.085, 0.10)),
    "fan": material("Proxy | fan", (0.18, 0.19, 0.21)),
    "pcb": material("Proxy | exposed PCB", (0.025, 0.16, 0.095)),
    "heatsink": material("Proxy | heatsink", (0.48, 0.50, 0.53)),
    "copper": material("Proxy | copper contact", (0.65, 0.30, 0.12)),
    "metal": material("Proxy | metal bracket", (0.55, 0.57, 0.60)),
    "connector": material("Proxy | connector", (0.08, 0.08, 0.085)),
    "gpu": material("Proxy | GPU package", (0.16, 0.16, 0.17)),
    "memory": material("Proxy | memory package", (0.12, 0.12, 0.13)),
    "accent": material("Proxy | illustrative labels", (0.8, 0.55, 0.12)),
}

manifest = {
    "schema_version": "0.1.0",
    "model_id": "gpu.evga.12g-p5-3655-kr",
    "model": "EVGA GeForce RTX 3060 XC BLACK GAMING 12GB",
    "part_number": "12G-P5-3655-KR",
    "asset_type": "blockout",
    "geometry_status": "illustrative_proxy_not_cad",
    "units": "mm",
    "dimensions": {
        "card_length": {"value": CARD_LENGTH, "status": STATUS["manufacturer_data"]},
        "card_height": {"value": CARD_HEIGHT, "status": STATUS["manufacturer_data"]},
        "card_thickness": {"value": CARD_THICKNESS, "status": STATUS["illustrative"],
                           "note": "Unverified placeholder; not a published SKU measurement."},
        "fan_opening_diameter": {"value": FAN_OPENING_DIA, "status": STATUS["reviewer_measurement"]},
        "fan_impeller_diameter": {"value": FAN_IMPELLER_DIA, "status": STATUS["reviewer_measurement"]},
    },
    "objects": [],
    "warnings": [
        "This is a visual blockout, not a dimensionally complete CAD model.",
        "Fan centres, shroud outline, PCB outline, thickness and internal component positions are illustrative.",
        "No PCB revision, BoardView, schematic or exact mechanical CAD has been confirmed.",
        "Do not use this asset for manufacturing, fitment, repair or thermal simulation.",
    ],
}

def tag(obj, component_id, evidence, geometry="proxy"):
    obj["sbs_component_id"] = component_id
    obj["sbs_evidence_status"] = evidence
    obj["sbs_geometry_status"] = geometry
    obj["sbs_model_id"] = manifest["model_id"]
    manifest["objects"].append({
        "name": obj.name,
        "component_id": component_id,
        "evidence_status": evidence,
        "geometry_status": geometry,
        "dimensions_mm": [round(float(v), 3) for v in obj.dimensions],
        "location_mm": [round(float(v), 3) for v in obj.location],
    })
    return obj

def move_to_collection(obj, collection):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)

def cube(name, component_id, location, dimensions, mat, collection, evidence=STATUS["illustrative"]):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    return tag(obj, component_id, evidence)

def cylinder(name, component_id, location, radius, depth, mat, collection, evidence=STATUS["illustrative"], vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth,
        location=location, rotation=(math.radians(90), 0, 0)
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    return tag(obj, component_id, evidence)

def make_fan(index, x, z, y, collection):
    prefix = f"FAN-{index:02d}"
    # Outer ring, hub and four simple blade proxies. Placement is illustrative.
    cylinder(f"Fan {index} | frame", f"fan.{index}.frame", (x, y, z),
             FAN_OPENING_DIA / 2, 3.0, MAT["fan"], collection)
    cylinder(f"Fan {index} | hub", f"fan.{index}.hub", (x, y - 2.2, z),
             13.0, 4.0, MAT["connector"], collection)
    for blade in range(7):
        angle = 2 * math.pi * blade / 7
        bx = x + math.cos(angle) * 23.0
        bz = z + math.sin(angle) * 23.0
        obj = cube(f"Fan {index} | blade {blade+1}", f"fan.{index}.blade.{blade+1}",
                   (bx, y - 1.5, bz), (25.0, 1.8, 7.0), MAT["fan"], collection)
        obj.rotation_euler[1] = -angle
    return prefix

def main():
    args = parse_args()
    out_dir = Path(args.output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.name != bpy.context.scene.collection.name:
            bpy.data.collections.remove(collection, do_unlink=True)

    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.001
    scene.unit_settings.length_unit = "MILLIMETERS"

    root = scene.collection
    groups = {}
    for name in ("01_External", "02_Cooling", "03_PCB_And_Electronics", "04_Connectors"):
        col = bpy.data.collections.new(name)
        root.children.link(col)
        groups[name] = col

    # Coordinate convention: X = card length, Y = thickness, Z = card height.
    # Front/fan side faces -Y. Origin is the lower-left-rear corner of the envelope.
    half_y = CARD_THICKNESS / 2
    ext = groups["01_External"]
    cool = groups["02_Cooling"]
    pcbcol = groups["03_PCB_And_Electronics"]
    conn = groups["04_Connectors"]

    envelope = cube("Envelope guide | overall card", "assembly.card.envelope",
                    (CARD_LENGTH/2, 0, CARD_HEIGHT/2),
                    (CARD_LENGTH, CARD_THICKNESS, CARD_HEIGHT), MAT["metal"], ext)
    # Wireframe keeps the nominal envelope visible without occluding internal proxy parts.
    wire = envelope.modifiers.new("Envelope outline only", "WIREFRAME")
    wire.thickness = 0.8
    wire.use_replace = True
    bpy.context.view_layer.objects.active = envelope
    bpy.ops.object.modifier_apply(modifier=wire.name)

    # Shroud fascia is built from rails/bridges so fan openings remain visibly open.
    fascia_y = -half_y + SHROUD_THICKNESS/2
    cube("Shroud proxy | top rail", "assembly.shroud.top",
         (CARD_LENGTH/2, fascia_y, CARD_HEIGHT - 4.0),
         (CARD_LENGTH, SHROUD_THICKNESS, 8.0), MAT["shroud"], ext)
    cube("Shroud proxy | bottom rail", "assembly.shroud.bottom",
         (CARD_LENGTH/2, fascia_y, 4.0),
         (CARD_LENGTH, SHROUD_THICKNESS, 8.0), MAT["shroud"], ext)
    cube("Shroud proxy | left rail", "assembly.shroud.left",
         (4.0, fascia_y, CARD_HEIGHT/2),
         (8.0, SHROUD_THICKNESS, CARD_HEIGHT - 16.0), MAT["shroud"], ext)
    cube("Shroud proxy | right rail", "assembly.shroud.right",
         (CARD_LENGTH - 4.0, fascia_y, CARD_HEIGHT/2),
         (8.0, SHROUD_THICKNESS, CARD_HEIGHT - 16.0), MAT["shroud"], ext)
    cube("Shroud proxy | centre bridge", "assembly.shroud.bridge",
         ((FAN_CENTERS_X[0] + FAN_CENTERS_X[1])/2, fascia_y, FAN_CENTER_Z),
         (3.0, SHROUD_THICKNESS, 12.0), MAT["shroud"], ext)

    for i, x in enumerate(FAN_CENTERS_X, start=1):
        make_fan(i, x, FAN_CENTER_Z, -half_y - 1.5, cool)
        # Accent ring is a visual guide for the measured opening diameter.
        cylinder(f"Fan {i} | opening guide", f"fan.{i}.opening_guide",
                 (x, -half_y - 3.2, FAN_CENTER_Z), FAN_OPENING_DIA/2, 0.8,
                 MAT["accent"], ext)

    # Rear-side exposed PCB proxy: exact outline and position are not yet measured.
    cube("PCB proxy | exposed rear", "assembly.pcb",
         (CARD_LENGTH/2, half_y - 2.0, CARD_HEIGHT/2),
         (CARD_LENGTH * 0.88, PCB_THICKNESS, CARD_HEIGHT * 0.78),
         MAT["pcb"], pcbcol)

    # Cooling stack: coarse blocks only, not fin-by-fin geometry.
    cube("Heatsink proxy | fin stack", "cooling.heatsink",
         (CARD_LENGTH/2, 0, CARD_HEIGHT/2),
         (CARD_LENGTH * 0.72, HEATSINK_THICKNESS, CARD_HEIGHT * 0.48),
         MAT["heatsink"], cool)
    cube("GPU contact proxy | copper", "cooling.gpu_contact",
         (CARD_LENGTH*0.48, -3.0, CARD_HEIGHT*0.52),
         (48.0, 3.0, 42.0), MAT["copper"], cool)

    # GPU package and memory candidates are deliberately generic proxy blocks.
    cube("GPU package proxy | GA106", "chip.gpu.ga106",
         (CARD_LENGTH*0.48, half_y - 4.0, CARD_HEIGHT*0.52),
         (40.0, 5.0, 40.0), MAT["gpu"], pcbcol)
    for i in range(6):
        x = CARD_LENGTH*0.25 + i * 16.0
        cube(f"GDDR6 candidate {i+1}", f"chip.memory.candidate.{i+1}",
             (x, half_y - 4.0, CARD_HEIGHT*0.52),
             (14.0, 4.0, 12.0), MAT["memory"], pcbcol)

    # Single 8-pin connector and bracket/port area are symbolic, not measured geometry.
    cube("8-pin power connector proxy", "connector.power.8pin",
         (CARD_LENGTH*0.72, half_y - 1.0, CARD_HEIGHT - 5.0),
         (22.0, 8.0, 10.0), MAT["connector"], conn)
    cube("I/O bracket proxy", "connector.io.bracket",
         (2.0, 0, CARD_HEIGHT/2), (2.0, CARD_THICKNESS, CARD_HEIGHT),
         MAT["metal"], conn)
    cube("Display output panel proxy", "connector.io.panel",
         (1.0, 0, CARD_HEIGHT*0.48), (3.0, CARD_THICKNESS*0.8, 48.0),
         MAT["connector"], conn)

    # Scene-level provenance metadata.
    scene["sbs_model_id"] = manifest["model_id"]
    scene["sbs_asset_type"] = "blockout"
    scene["sbs_geometry_status"] = "illustrative_proxy_not_cad"
    scene["sbs_coordinate_convention"] = "X=length, Y=thickness, Z=height; units=mm"

    # Set a useful default view and deselect all objects.
    bpy.ops.object.select_all(action="DESELECT")
    for area in bpy.context.screen.areas if bpy.context.screen else []:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_distance = 330
            area.spaces.active.region_3d.view_location = (CARD_LENGTH/2, 0, CARD_HEIGHT/2)

    manifest_path = out_dir / "rtx3060_xc_black_blockout.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    if not args.no_blend:
        blend_path = out_dir / "rtx3060_xc_black_blockout.blend"
        bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
        print(f"Saved Blender scene: {blend_path}")

    if not args.no_glb:
        glb_path = out_dir / "rtx3060_xc_black_blockout.glb"
        if hasattr(bpy.ops.export_scene, "gltf"):
            bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB",
                                      export_apply=True, export_yup=True, export_extras=True)
            print(f"Exported GLB: {glb_path}")
        else:
            print("GLB export skipped: Blender glTF exporter is not available in this installation.")
            print("Enable/install the glTF 2.0 exporter, then rerun without --no-glb.")

    print(f"Saved manifest: {manifest_path}")
    print("WARNING: illustrative blockout only; not CAD or manufacturing geometry.")

if __name__ == "__main__":
    main()
