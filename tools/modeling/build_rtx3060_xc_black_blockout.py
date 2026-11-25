"""
Screw by Screw — EVGA RTX 3060 XC BLACK reconstruction blockout generator v0.5 candidate.

Run from repository root:
  blender --background --python tools/modeling/build_rtx3060_xc_black_blockout.py

Optional arguments after Blender's --:
  --output-dir PATH
  --no-glb
  --no-blend

All geometry is proxy/blockout geometry. Manufacturer dimensions and reviewer
fan diameters are provenance-labelled. Fan blade count/profile, fan positions,
card thickness, shroud, PCB and component positions remain illustrative.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

REPO_ROOT = Path(__file__).resolve().parents[2]
MODEL_ROOT = REPO_ROOT / "MODELS/GPUS/EVGA/RTX-3060-XC-BLACK-12GB"
DEFAULT_OUTPUT = MODEL_ROOT / "04-WORKING/generated"

# All coordinates and dimensions are millimetres (scene scale_length = 0.001).
CARD_LENGTH = 201.8       # manufacturer-published nominal length
CARD_HEIGHT = 110.0       # manufacturer-published nominal height
FAN_OPENING_DIA = 90.0    # approximate reviewer measurement
FAN_IMPELLER_DIA = 85.0   # approximate reviewer measurement

# Illustrative placeholders only — replace when measured from a sample or calibrated views.
CARD_THICKNESS = 36.0
FAN_CENTERS_X = (55.0, 146.0)
FAN_CENTER_Z = 56.0
FAN_BLADE_COUNT = 7       # illustrative; exact blade count not confirmed
SHROUD_THICKNESS = 5.0
PCB_THICKNESS = 1.6
HEATSINK_THICKNESS = 13.0
FAN_FRAME_DEPTH = 3.0
FAN_HUB_RADIUS = 13.0
FAN_BLADE_DEPTH = 1.8

STATUS = {
    "manufacturer_data": "manufacturer_data",
    "reviewer_measurement": "reviewer_measurement",
    "illustrative": "illustrative",
    "photo_estimate": "photo_estimate",
}

manifest = {
    "schema_version": "0.5.0",
    "model_id": "gpu.evga.12g-p5-3655-kr",
    "model": "EVGA GeForce RTX 3060 XC BLACK GAMING 12GB",
    "part_number": "12G-P5-3655-KR",
    "asset_type": "blockout",
    "generator_version": "0.5.0",
    "geometry_status": "illustrative_proxy_not_cad",
    "units": "mm",
    "dimensions": {
        "card_length": {
            "value": CARD_LENGTH,
            "status": STATUS["manufacturer_data"],
        },
        "card_height": {
            "value": CARD_HEIGHT,
            "status": STATUS["manufacturer_data"],
        },
        "card_thickness": {
            "value": CARD_THICKNESS,
            "status": STATUS["illustrative"],
            "note": "Unverified placeholder; not a published SKU measurement.",
        },
        "fan_opening_diameter": {
            "value": FAN_OPENING_DIA,
            "status": STATUS["reviewer_measurement"],
        },
        "fan_impeller_diameter": {
            "value": FAN_IMPELLER_DIA,
            "status": STATUS["reviewer_measurement"],
        },
        "fan_blade_count": {
            "value": FAN_BLADE_COUNT,
            "status": STATUS["illustrative"],
            "note": "Visual proxy count; exact blade count not confirmed.",
        },
    },
    "objects": [],
    "warnings": [
        "This is a visual blockout, not dimensionally complete CAD.",
        "Fan centres, blade count/profile, shroud outline, PCB outline, thickness and internal positions are illustrative.",
        "Fan ring diameters use approximate reviewer measurements as a visual guide, not a verified fan manufacturer drawing.",
        "Computed geometry bounds include protruding proxy components and must not be treated as the card's official thickness.",
        "No PCB revision, BoardView, schematic or exact mechanical CAD has been confirmed.",
        "Heatpipe routing and power-stage locations are reconstruction placeholders; do not use them as service or electrical instructions.",
        "Do not use this asset for manufacturing, fitment, repair or thermal simulation.",
    ],
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
    "heatpipe": material("Proxy | heatpipe copper", (0.68, 0.31, 0.12)),
    "power_stage": material("Proxy | power stage", (0.34, 0.37, 0.40)),
}


def tag(obj, component_id, evidence, geometry="proxy", export_role="component"):
    obj["sbs_component_id"] = component_id
    obj["sbs_evidence_status"] = evidence
    obj["sbs_geometry_status"] = geometry
    obj["sbs_model_id"] = manifest["model_id"]
    obj["sbs_export_role"] = export_role

    record = {
        "name": obj.name,
        "component_id": component_id,
        "node_type": "assembly" if obj.type == "EMPTY" else "mesh",
        "evidence_status": evidence,
        "geometry_status": geometry,
        "export_role": export_role,
        "dimensions_mm": [round(float(v), 3) for v in obj.dimensions],
        "location_mm": [round(float(v), 3) for v in obj.location],
    }
    manifest["objects"].append(record)
    return obj


def set_parent_keep_world(child, parent):
    """
    Parent without changing the child's generated world-space placement.

    Newly linked data-block objects may have a stale identity matrix_world.
    Preserve their explicit transform basis and cancel the parent's initial
    world transform with matrix_parent_inverse.
    """
    bpy.context.view_layer.update()
    parent_world = parent.matrix_world.copy()
    child_basis = child.matrix_basis.copy()

    child.parent = parent
    child.matrix_parent_inverse = parent_world.inverted()
    child.matrix_basis = child_basis

    bpy.context.view_layer.update()

    parent_id = parent.get("sbs_component_id")
    if parent_id:
        child["sbs_parent_component_id"] = parent_id
        for record in manifest["objects"]:
            if record["component_id"] == child.get("sbs_component_id"):
                record["parent_component_id"] = parent_id
                break


def move_to_collection(obj, collection):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)


def make_assembly(name, component_id, location, collection, parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 6.0
    obj.location = location
    collection.objects.link(obj)
    tag(obj, component_id, STATUS["illustrative"], geometry="assembly_node",
        export_role="assembly")
    if parent is not None:
        set_parent_keep_world(obj, parent)
    return obj


def cube(name, component_id, location, dimensions, mat, collection,
         evidence=STATUS["illustrative"], export_role="component"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    return tag(obj, component_id, evidence, export_role=export_role)


def cylinder(name, component_id, location, radius, depth, mat, collection,
             evidence=STATUS["illustrative"], vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=(math.radians(90), 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    return tag(obj, component_id, evidence)


def annular_ring(name, component_id, location, outer_radius, inner_radius,
                 depth, mat, collection, segments=96):
    """Create a hollow ring in the XZ plane; Y is the card-thickness axis."""
    if not (outer_radius > inner_radius > 0):
        raise ValueError("Ring radii must satisfy outer_radius > inner_radius > 0")

    verts = []
    y_front = -depth / 2
    y_back = depth / 2

    for y in (y_front, y_back):
        for radius in (outer_radius, inner_radius):
            for i in range(segments):
                angle = 2.0 * math.pi * i / segments
                verts.append((
                    radius * math.cos(angle),
                    y,
                    radius * math.sin(angle),
                ))

    def idx(side, ring, i):
        return side * 2 * segments + ring * segments + (i % segments)

    faces = []
    for i in range(segments):
        j = (i + 1) % segments
        # Front annulus, rear annulus, outer wall, inner wall.
        faces.append((idx(0, 0, i), idx(0, 0, j),
                      idx(0, 1, j), idx(0, 1, i)))
        faces.append((idx(1, 0, j), idx(1, 0, i),
                      idx(1, 1, i), idx(1, 1, j)))
        faces.append((idx(0, 0, i), idx(1, 0, i),
                      idx(1, 0, j), idx(0, 0, j)))
        faces.append((idx(0, 1, j), idx(1, 1, j),
                      idx(1, 1, i), idx(0, 1, i)))

    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj["sbs_outer_diameter_mm"] = round(outer_radius * 2, 3)
    obj["sbs_inner_diameter_mm"] = round(inner_radius * 2, 3)
    return tag(obj, component_id, STATUS["reviewer_measurement"])


def cylinder_between(name, start, end, radius, mat, collection, parent):
    """Create an untagged mesh segment between two points; source route is illustrative."""
    start_v, end_v = Vector(start), Vector(end)
    direction = end_v - start_v
    if direction.length < 0.01:
        raise ValueError("Cylinder segment endpoints are too close")
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=direction.length,
        location=(start_v + end_v) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    set_parent_keep_world(obj, parent)
    return obj


def curved_fan_blade(index, blade_index, count, center, base_y, collection):
    """Illustrative swept blade surface, extruded along Y."""
    # (radius, sweep angle in degrees, half-width in mm); entirely illustrative.
    profile = (
        (13.5, -5.0, 2.8),
        (22.0, 1.0, 4.2),
        (32.0, 11.0, 4.0),
        (41.0, 20.0, 2.4),
    )
    base_angle = 2.0 * math.pi * blade_index / count
    side_a = []
    side_b = []

    for radius, sweep_deg, half_width in profile:
        angle = base_angle + math.radians(sweep_deg)
        radial_x = math.cos(angle)
        radial_z = math.sin(angle)
        tangent_x = -radial_z
        tangent_z = radial_x
        cx = radius * radial_x
        cz = radius * radial_z
        side_a.append((
            cx - half_width * tangent_x,
            cz - half_width * tangent_z,
        ))
        side_b.append((
            cx + half_width * tangent_x,
            cz + half_width * tangent_z,
        ))

    outline = side_a + list(reversed(side_b))
    n = len(outline)
    y_front = -FAN_BLADE_DEPTH / 2
    y_back = FAN_BLADE_DEPTH / 2
    verts = (
        [(x, y_front, z) for x, z in outline]
        + [(x, y_back, z) for x, z in outline]
    )

    faces = [
        tuple(range(n)),
        tuple(reversed(range(n, 2 * n))),
    ]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))

    name = f"Fan {index} | blade {blade_index + 1}"
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = (center[0], base_y, center[2])
    collection.objects.link(obj)
    obj.data.materials.append(MAT["fan"])
    return tag(
        obj,
        f"fan.{index}.blade.{blade_index + 1}",
        STATUS["illustrative"],
    )


def make_fan(index, x, z, y, collection, cooling_parent):
    assembly = make_assembly(
        f"Fan {index} assembly",
        f"assembly.fan.{index}",
        (x, y, z),
        collection,
        parent=cooling_parent,
    )

    # The ring is hollow: blades and hub remain visible instead of being hidden
    # behind a solid cylinder. Measured diameters remain approximate guides.
    frame = annular_ring(
        f"Fan {index} | annular frame",
        f"fan.{index}.frame",
        (x, y, z),
        FAN_OPENING_DIA / 2,
        FAN_IMPELLER_DIA / 2,
        FAN_FRAME_DEPTH,
        MAT["fan"],
        collection,
    )
    set_parent_keep_world(frame, assembly)

    hub = cylinder(
        f"Fan {index} | hub",
        f"fan.{index}.hub",
        (x, y - 2.2, z),
        FAN_HUB_RADIUS,
        4.0,
        MAT["connector"],
        collection,
        vertices=64,
    )
    set_parent_keep_world(hub, assembly)

    for blade in range(FAN_BLADE_COUNT):
        obj = curved_fan_blade(
            index, blade, FAN_BLADE_COUNT, (x, y, z),
            y - 1.5, collection,
        )
        set_parent_keep_world(obj, assembly)


def validate_scene_transform_integrity():
    """Fail generation if parent assignment moves geometry away from its centres."""
    bpy.context.view_layer.update()
    failures = []

    for index, x in enumerate(FAN_CENTERS_X, start=1):
        expected_frame = Vector((x, -CARD_THICKNESS / 2 - 1.5, FAN_CENTER_Z))
        expected_hub = Vector((x, -CARD_THICKNESS / 2 - 1.5 - 2.2, FAN_CENTER_Z))
        expected_blades = Vector((
            x,
            -CARD_THICKNESS / 2 - 1.5 - 1.5,
            FAN_CENTER_Z,
        ))

        frame = bpy.data.objects.get(f"Fan {index} | annular frame")
        hub = bpy.data.objects.get(f"Fan {index} | hub")
        if frame is None or hub is None:
            failures.append(f"Fan {index}: frame or hub object missing")
            continue

        checks = [
            (f"Fan {index} frame", frame, expected_frame),
            (f"Fan {index} hub", hub, expected_hub),
        ]
        for blade_index in range(1, FAN_BLADE_COUNT + 1):
            blade = bpy.data.objects.get(f"Fan {index} | blade {blade_index}")
            if blade is None:
                failures.append(f"Fan {index}: blade {blade_index} missing")
            else:
                checks.append((
                    f"Fan {index} blade {blade_index}",
                    blade,
                    expected_blades,
                ))

        for label, obj, expected in checks:
            actual = obj.matrix_world.translation
            if (actual - expected).length > 0.01:
                failures.append(
                    f"{label} displaced: expected "
                    f"{tuple(round(v, 3) for v in expected)}, got "
                    f"{tuple(round(v, 3) for v in actual)}"
                )

    # Renderable geometry must stay near the card's nominal X/Z footprint.
    corners = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.get("sbs_export_role") == "reference_only":
            continue
        for corner in obj.bound_box:
            corners.append(obj.matrix_world @ Vector(corner))

    if corners:
        mins = [min(v[i] for v in corners) for i in range(3)]
        maxs = [max(v[i] for v in corners) for i in range(3)]
        # 201.8 mm is the manufacturer's nominal length, not a verified
        # maximum exterior shroud extent. LanOC reports a small shroud
        # overhang but does not quantify it. Keep only the negative-origin
        # transform sanity check; report the positive extent without clamping.
        if mins[0] < -1.0:
            failures.append(
                f"Unexpected negative X bounds: {mins[0]:.3f} mm"
            )
        if mins[2] < -1.0 or maxs[2] > CARD_HEIGHT + 1.0:
            failures.append(
                f"Unexpected Z bounds: {mins[2]:.3f} .. {maxs[2]:.3f} mm"
            )

    if failures:
        print("TRANSFORM INTEGRITY CHECK: FAILED")
        for failure in failures:
            print(" -", failure)
        raise RuntimeError(
            "Scene transform validation failed; refusing to save/export v0.5."
        )

    print("TRANSFORM INTEGRITY CHECK: PASS")
    print("Both fan frames, hubs and all blade pivots match expected centres.")
    if corners:
        print(
            "Proxy X bounds:",
            round(mins[0], 3), "..", round(maxs[0], 3), "mm"
        )
        print(
            "Proxy Z bounds:",
            round(mins[2], 3), "..", round(maxs[2], 3), "mm"
        )


def set_manifest_bounds():
    corners = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.get("sbs_export_role") == "reference_only":
            continue
        for corner in obj.bound_box:
            corners.append(obj.matrix_world @ Vector(corner))

    if not corners:
        return

    mins = [min(v[i] for v in corners) for i in range(3)]
    maxs = [max(v[i] for v in corners) for i in range(3)]
    manifest["generated_geometry_bounds"] = {
        "units": "mm",
        "status": "derived_from_proxy_meshes",
        "includes_reference_guides": False,
        "min": [round(v, 3) for v in mins],
        "max": [round(v, 3) for v in maxs],
        "dimensions": [
            round(maxs[i] - mins[i], 3) for i in range(3)
        ],
        "axis_meaning": {
            "x": "nominal card-length axis; exterior shroud may overhang",
            "y": "thickness axis; includes front/rear proxy protrusions",
            "z": "card height",
        },
    }


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
    for name in (
        "01_External",
        "02_Cooling",
        "03_PCB_And_Electronics",
        "04_Connectors",
    ):
        col = bpy.data.collections.new(name)
        root.children.link(col)
        groups[name] = col

    # Coordinate convention: X = card length, Y = thickness, Z = card height.
    # Front/fan side faces -Y. Origin is the lower-left-rear corner
    # of the nominal envelope.
    half_y = CARD_THICKNESS / 2
    ext = groups["01_External"]
    cool = groups["02_Cooling"]
    pcbcol = groups["03_PCB_And_Electronics"]
    conn = groups["04_Connectors"]

    card_root = make_assembly(
        "Graphics card assembly",
        "assembly.card.root",
        (CARD_LENGTH / 2, 0, CARD_HEIGHT / 2),
        ext,
    )

    shroud_group = make_assembly(
        "Shroud assembly",
        "assembly.shroud",
        (CARD_LENGTH / 2, -half_y, CARD_HEIGHT / 2),
        ext,
        parent=card_root,
    )

    cooling_group = make_assembly(
        "Cooling assembly",
        "assembly.cooling",
        (CARD_LENGTH / 2, 0, CARD_HEIGHT / 2),
        cool,
        parent=card_root,
    )

    pcb_group = make_assembly(
        "PCB and electronics assembly",
        "assembly.pcb.electronics",
        (CARD_LENGTH / 2, half_y - PCB_THICKNESS / 2, CARD_HEIGHT / 2),
        pcbcol,
        parent=card_root,
    )

    connector_group = make_assembly(
        "I/O and power connectors assembly",
        "assembly.connectors",
        (0, 0, 0),
        conn,
        parent=card_root,
    )

    # Reference-only nominal envelope. It is an exact-size wire display,
    # not a thickened mesh, and is deliberately excluded from the GLB.
    envelope = cube(
        "Envelope guide | overall card",
        "assembly.card.envelope",
        (CARD_LENGTH / 2, 0, CARD_HEIGHT / 2),
        (CARD_LENGTH, CARD_THICKNESS, CARD_HEIGHT),
        MAT["metal"],
        ext,
        export_role="reference_only",
    )
    envelope.display_type = "WIRE"
    envelope.show_in_front = True

    # Shroud fascia is built from rails/bridges so fan rings remain open.
    fascia_y = -half_y + SHROUD_THICKNESS / 2
    shroud_parts = [
        cube(
            "Shroud proxy | top rail",
            "assembly.shroud.top",
            (CARD_LENGTH / 2, fascia_y, CARD_HEIGHT - 4.0),
            (CARD_LENGTH, SHROUD_THICKNESS, 8.0),
            MAT["shroud"], ext,
        ),
        cube(
            "Shroud proxy | bottom rail",
            "assembly.shroud.bottom",
            (CARD_LENGTH / 2, fascia_y, 4.0),
            (CARD_LENGTH, SHROUD_THICKNESS, 8.0),
            MAT["shroud"], ext,
        ),
        cube(
            "Shroud proxy | left rail",
            "assembly.shroud.left",
            (4.0, fascia_y, CARD_HEIGHT / 2),
            (8.0, SHROUD_THICKNESS, CARD_HEIGHT - 16.0),
            MAT["shroud"], ext,
        ),
        cube(
            "Shroud proxy | right rail",
            "assembly.shroud.right",
            (CARD_LENGTH - 4.0, fascia_y, CARD_HEIGHT / 2),
            (8.0, SHROUD_THICKNESS, CARD_HEIGHT - 16.0),
            MAT["shroud"], ext,
        ),
        cube(
            "Shroud proxy | centre bridge",
            "assembly.shroud.bridge",
            ((FAN_CENTERS_X[0] + FAN_CENTERS_X[1]) / 2,
             fascia_y, FAN_CENTER_Z),
            (3.0, SHROUD_THICKNESS, 12.0),
            MAT["shroud"], ext,
        ),
    ]
    for part in shroud_parts:
        set_parent_keep_world(part, shroud_group)

    for i, x in enumerate(FAN_CENTERS_X, start=1):
        make_fan(i, x, FAN_CENTER_Z, -half_y - 1.5, cool, cooling_group)

    # Heatsink parent node is a stable selectable assembly in the content model.
    # The fin count, pitch and dimensions below remain visual placeholders.
    heatsink_group = make_assembly(
        "Heatsink fin stack",
        "cooling.heatsink",
        (CARD_LENGTH / 2, 0, CARD_HEIGHT / 2),
        cool,
        parent=cooling_group,
    )
    fin_span = CARD_LENGTH * 0.72
    fin_start_x = (CARD_LENGTH - fin_span) / 2
    for fin_index in range(24):
        fin_x = fin_start_x + fin_index * fin_span / 23
        fin = cube(
            f"Heatsink fin proxy {fin_index + 1:02d}",
            f"cooling.heatsink.fin.{fin_index + 1:02d}",
            (fin_x, 0, CARD_HEIGHT / 2),
            (1.0, HEATSINK_THICKNESS, CARD_HEIGHT * 0.48),
            MAT["heatsink"], cool,
            evidence=STATUS["illustrative"],
        )
        set_parent_keep_world(fin, heatsink_group)

    contact = cube(
        "GPU contact proxy | copper",
        "cooling.gpu_contact",
        (CARD_LENGTH * 0.48, -3.0, CARD_HEIGHT * 0.52),
        (48.0, 3.0, 42.0),
        MAT["copper"], cool,
    )
    set_parent_keep_world(contact, cooling_group)

    # Teardown-supported heat pipes are present, but their exact count, routing,
    # diameter and contact geometry are unknown. Two visual paths are proxies only.
    heatpipes_group = make_assembly("Heatpipe group | reconstructed routes", "cooling.heatpipes",
        (CARD_LENGTH / 2, 0, CARD_HEIGHT / 2), cool, parent=cooling_group)
    heatpipe_paths = (
        ((76, -4.4, 57), (67, -3.6, 59), (57, -2.1, 62), (47, -0.8, 65), (39, 0.0, 66)),
        ((118, -4.4, 57), (128, -3.6, 59), (139, -2.1, 62), (150, -0.8, 65), (160, 0.0, 66)),
    )
    for pipe_index, path in enumerate(heatpipe_paths, start=1):
        for segment_index, (start, end) in enumerate(zip(path, path[1:]), start=1):
            cylinder_between(f"Heatpipe proxy {pipe_index} segment {segment_index}",
                start, end, 1.6, MAT["heatpipe"], cool, heatpipes_group)

    # Rear-side exposed PCB proxy: exact outline and position remain unknown.
    pcb = cube(
        "PCB proxy | exposed rear",
        "assembly.pcb.board",
        (CARD_LENGTH / 2, half_y - 2.0, CARD_HEIGHT / 2),
        (CARD_LENGTH * 0.88, PCB_THICKNESS, CARD_HEIGHT * 0.78),
        MAT["pcb"], pcbcol,
    )
    set_parent_keep_world(pcb, pcb_group)

    # GPU package and memory candidates are generic proxy blocks.
    gpu_package = cube(
        "GPU package proxy | GA106",
        "chip.gpu.ga106",
        (CARD_LENGTH * 0.48, half_y - 4.0, CARD_HEIGHT * 0.52),
        (40.0, 5.0, 40.0),
        MAT["gpu"], pcbcol,
    )
    set_parent_keep_world(gpu_package, pcb_group)

    # Selectable group for the power-conversion zone. Individual components are
    # deliberately unnumbered placeholders pending exact PCB revision evidence.
    power_stage_group = make_assembly("Power conversion zone | unverified proxy",
        "assembly.power_stage", (CARD_LENGTH * 0.69, half_y - 3.0, CARD_HEIGHT * 0.70),
        pcbcol, parent=pcb_group)
    stage_origin = (CARD_LENGTH * 0.69, half_y - 3.0, CARD_HEIGHT * 0.70)
    stage_blocks = (
        ((0, 0, 0), (7.0, 5.0, 8.0)), ((10, 0, 0), (7.0, 5.0, 8.0)),
        ((20, 0, 0), (7.0, 5.0, 8.0)), ((4, -0.5, 11), (4.0, 5.0, 5.0)),
        ((13, -0.5, 11), (4.0, 5.0, 5.0)), ((22, -0.5, 11), (4.0, 5.0, 5.0)),
    )
    for index, (offset, size) in enumerate(stage_blocks, start=1):
        world_position = tuple(stage_origin[axis] + offset[axis] for axis in range(3))
        block = cube(f"Unidentified power-stage proxy {index}", f"power_stage.proxy.{index}",
            world_position, size, MAT["power_stage"], pcbcol, evidence=STATUS["illustrative"])
        set_parent_keep_world(block, power_stage_group)

    for i in range(6):
        x = CARD_LENGTH * 0.25 + i * 16.0
        memory = cube(
            f"GDDR6 candidate {i + 1}",
            f"chip.memory.candidate.{i + 1}",
            (x, half_y - 4.0, CARD_HEIGHT * 0.52),
            (14.0, 4.0, 12.0),
            MAT["memory"], pcbcol,
        )
        set_parent_keep_world(memory, pcb_group)

    # Single 8-pin connector and bracket/port area are symbolic, not measured.
    power = cube(
        "8-pin power connector proxy",
        "connector.power.8pin",
        (CARD_LENGTH * 0.72, half_y - 1.0, CARD_HEIGHT - 5.0),
        (22.0, 8.0, 10.0),
        MAT["connector"], conn,
    )
    set_parent_keep_world(power, connector_group)

    bracket = cube(
        "I/O bracket proxy",
        "connector.io.bracket",
        (2.0, 0, CARD_HEIGHT / 2),
        (2.0, CARD_THICKNESS, CARD_HEIGHT),
        MAT["metal"], conn,
    )
    set_parent_keep_world(bracket, connector_group)

    display_panel = cube(
        "Display output panel proxy",
        "connector.io.panel",
        (1.0, 0, CARD_HEIGHT * 0.48),
        (3.0, CARD_THICKNESS * 0.8, 48.0),
        MAT["connector"], conn,
    )
    set_parent_keep_world(display_panel, connector_group)

    # Scene-level provenance metadata.
    scene["sbs_model_id"] = manifest["model_id"]
    scene["sbs_asset_type"] = "blockout"
    scene["sbs_geometry_status"] = "illustrative_proxy_not_cad"
    scene["sbs_coordinate_convention"] = (
        "X=length, Y=thickness, Z=height; units=mm"
    )

    # Useful initial view.
    bpy.ops.object.select_all(action="DESELECT")
    for area in bpy.context.screen.areas if bpy.context.screen else []:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_distance = 330
            area.spaces.active.region_3d.view_location = (
                CARD_LENGTH / 2, 0, CARD_HEIGHT / 2
            )

    validate_scene_transform_integrity()
    set_manifest_bounds()
    manifest_path = out_dir / "rtx3060_xc_black_blockout_v05.manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    if not args.no_blend:
        blend_path = out_dir / "rtx3060_xc_black_blockout_v05.blend"
        bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
        print(f"Saved Blender scene: {blend_path}")

    if not args.no_glb:
        glb_path = out_dir / "rtx3060_xc_black_blockout_v05.glb"
        if hasattr(bpy.ops.export_scene, "gltf"):
            # Export renderable parts and assembly empties; omit the reference
            # envelope so it cannot inflate browser-model bounds or obscure parts.
            bpy.ops.object.select_all(action="DESELECT")
            export_objects = [
                obj for obj in bpy.context.scene.objects
                if obj.get("sbs_export_role") != "reference_only"
            ]
            for obj in export_objects:
                obj.select_set(True)

            bpy.context.view_layer.objects.active = card_root
            bpy.ops.export_scene.gltf(
                filepath=str(glb_path),
                export_format="GLB",
                export_apply=True,
                export_yup=True,
                export_extras=True,
                use_selection=True,
            )
            bpy.ops.object.select_all(action="DESELECT")
            print(f"Exported GLB: {glb_path}")
        else:
            print("GLB export skipped: Blender glTF exporter is unavailable.")
            print("Enable the glTF 2.0 exporter, then rerun without --no-glb.")

    print(f"Saved manifest: {manifest_path}")
    print("WARNING: illustrative blockout only; not CAD or manufacturing geometry.")


if __name__ == "__main__":
    main()
