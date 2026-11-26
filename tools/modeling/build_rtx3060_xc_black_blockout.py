"""
Screw by Screw — EVGA RTX 3060 XC BLACK reconstruction blockout generator v0.5 candidate.

Run from repository root:
  blender --background --python tools/modeling/build_rtx3060_xc_black_blockout.py

Optional arguments after Blender's --:
  --output-dir PATH
  --no-glb
  --no-blend

All geometry is proxy/blockout geometry. Manufacturer dimensions, reviewer fan diameters and the photo-observed blade
count are provenance-labelled. Blade profile, fan positions, card thickness,
shroud, PCB and component positions remain illustrative.
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
FAN_BLADE_COUNT = 8       # photo-observed in exact-SKU retail listing; detailed geometry remains proxy
SHROUD_THICKNESS = 5.0
PCB_THICKNESS = 1.6
HEATSINK_THICKNESS = 13.0
FAN_FRAME_DEPTH = 3.0
FAN_HUB_RADIUS = 13.0
FAN_BLADE_DEPTH = 1.8
PCB_CUTOUT_PROXY_SIZE = (18.0, 22.0)  # illustrative through-hole blockout; not measured
PCB_CUTOUT_PROXY_CENTER = (176.0, 58.0)  # visual estimate only; not a BoardView coordinate

STATUS = {
    "manufacturer_data": "manufacturer_data",
    "reviewer_measurement": "reviewer_measurement",
    "teardown_supported": "teardown_supported",
    "illustrative": "illustrative",
    "photo_estimate": "photo_estimate",
    "visible_exact_model": "visible_exact_model",
    "candidate_count_requires_exact_board_confirmation": "candidate_count_requires_exact_board_confirmation",
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
            "status": STATUS["visible_exact_model"],
            "note": "Eight visible blade surfaces per fan are counted from two Newegg product photos whose listing identifies SKU 12G-P5-3655-KR. Blade pitch, camber, thickness, profile and depth remain unmeasured.",
        },
        "pcb_airflow_cutout_proxy": {
            "value": {"length": PCB_CUTOUT_PROXY_SIZE[0], "height": PCB_CUTOUT_PROXY_SIZE[1]},
            "status": STATUS["illustrative"],
            "note": "Rounded rectangular Boolean through-hole placeholder. Dimensions and centre are modeling estimates only, not measurements or BoardView coordinates.",
        },
    },
    "objects": [],
    "warnings": [
        "This is a visual blockout, not dimensionally complete CAD.",
        "Eight visible blade surfaces per fan are photo-observed in the exact-SKU retail listing; blade profile/pitch/camber/thickness, fan centres and all internal mechanical positions remain illustrative.",
        "The PCB airflow cutout is a rounded-rectangle through-hole proxy; its 18 x 22 mm blockout and centre are not measured and must not be treated as a PCB drawing.",
        "Fan ring diameters use approximate reviewer measurements as a visual guide, not a verified fan manufacturer drawing.",
        "Raised E-like fan-blade embossments and simplified EVGA / GEFORCE RTX wordmarks are photo-informed visual interpretations; logo vectors, relief height, font, and manufacturing geometry are not measured.",
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
    surface_detail = obj.get("sbs_surface_detail")
    if surface_detail:
        record["surface_detail"] = surface_detail
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


def make_assembly(name, component_id, location, collection, parent=None,
                  evidence=STATUS["illustrative"], geometry="assembly_node"):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 6.0
    obj.location = location
    collection.objects.link(obj)
    tag(obj, component_id, evidence, geometry=geometry, export_role="assembly")
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


def _append_prism(verts, faces, center_x, center_z, axis_x, axis_z,
                  length, thickness, y_front, y_back):
    """Append one closed rectangular stroke in the XZ plane."""
    axis_len = math.hypot(axis_x, axis_z)
    if axis_len < 1e-8:
        raise ValueError("Prism axis must be non-zero")
    ux, uz = axis_x / axis_len, axis_z / axis_len
    px, pz = -uz, ux
    half_l, half_t = length / 2, thickness / 2
    outline = (
        (center_x - ux * half_l - px * half_t, center_z - uz * half_l - pz * half_t),
        (center_x + ux * half_l - px * half_t, center_z + uz * half_l - pz * half_t),
        (center_x + ux * half_l + px * half_t, center_z + uz * half_l + pz * half_t),
        (center_x - ux * half_l + px * half_t, center_z - uz * half_l + pz * half_t),
    )
    base = len(verts)
    verts.extend((x, y_front, z) for x, z in outline)
    verts.extend((x, y_back, z) for x, z in outline)
    faces.extend((
        (base, base + 1, base + 2, base + 3),
        (base + 7, base + 6, base + 5, base + 4),
        (base, base + 4, base + 5, base + 1),
        (base + 1, base + 5, base + 6, base + 2),
        (base + 2, base + 6, base + 7, base + 3),
        (base + 3, base + 7, base + 4, base),
    ))


def _append_prism_xy(verts, faces, center_x, center_y, axis_x, axis_y,
                     length, thickness, z_front, z_back):
    """Append one closed rectangular stroke in the local XY plane."""
    axis_len = math.hypot(axis_x, axis_y)
    if axis_len < 1e-8:
        raise ValueError("Prism axis must be non-zero")
    ux, uy = axis_x / axis_len, axis_y / axis_len
    px, py = -uy, ux
    half_l, half_t = length / 2, thickness / 2
    outline = (
        (center_x - ux * half_l - px * half_t, center_y - uy * half_l - py * half_t),
        (center_x + ux * half_l - px * half_t, center_y + uy * half_l - py * half_t),
        (center_x + ux * half_l + px * half_t, center_y + uy * half_l + py * half_t),
        (center_x - ux * half_l + px * half_t, center_y - uy * half_l + py * half_t),
    )
    base = len(verts)
    verts.extend((x, y, z_front) for x, y in outline)
    verts.extend((x, y, z_back) for x, y in outline)
    faces.extend((
        (base, base + 1, base + 2, base + 3),
        (base + 7, base + 6, base + 5, base + 4),
        (base, base + 4, base + 5, base + 1),
        (base + 1, base + 5, base + 6, base + 2),
        (base + 2, base + 6, base + 7, base + 3),
        (base + 3, base + 7, base + 4, base),
    ))


def _append_mesh_detail(obj, detail_verts, detail_faces, detail_material=None):
    """Merge local-space relief geometry into an existing tagged mesh."""
    if not detail_verts or not detail_faces:
        return obj
    old_mesh = obj.data
    old_verts = [tuple(vertex.co) for vertex in old_mesh.vertices]
    old_faces = [tuple(poly.vertices) for poly in old_mesh.polygons]
    old_materials = list(old_mesh.materials)
    detail_material_index = 0
    if detail_material is not None:
        detail_material_index = next(
            (index for index, material in enumerate(old_materials)
             if material.name == detail_material.name),
            -1,
        )
        if detail_material_index < 0:
            old_materials.append(detail_material)
            detail_material_index = len(old_materials) - 1
    offset = len(old_verts)
    faces = old_faces + [
        tuple(offset + index for index in face) for face in detail_faces
    ]
    mesh = bpy.data.meshes.new(obj.name + " | detailed mesh")
    mesh.from_pydata(old_verts + detail_verts, [], faces)
    for existing_material in old_materials:
        mesh.materials.append(existing_material)
    for polygon in list(mesh.polygons)[len(old_faces):]:
        polygon.material_index = detail_material_index
    mesh.validate()
    mesh.update()
    obj.data = mesh
    if old_mesh.users == 0:
        bpy.data.meshes.remove(old_mesh)
    bpy.context.view_layer.update()
    component_id = obj.get("sbs_component_id")
    for record in manifest["objects"]:
        if record["component_id"] == component_id:
            record["dimensions_mm"] = [round(float(v), 3) for v in obj.dimensions]
            record["location_mm"] = [round(float(v), 3) for v in obj.location]
            surface_detail = obj.get("sbs_surface_detail")
            if surface_detail:
                record["surface_detail"] = surface_detail
            break
    return obj


def add_hub_emblem(hub):
    """Add a small raised E-like badge mark to the front of the hub proxy."""
    verts, faces = [], []
    z_front, z_back = 2.16, 1.94
    _append_prism_xy(verts, faces, 0.0, 0.0, 0.0, 1.0, 4.2, 0.48, z_front, z_back)
    for y_offset, bar_length in ((1.45, 3.35), (0.0, 2.85), (-1.45, 3.35)):
        _append_prism_xy(
            verts, faces, 0.0, y_offset, 1.0, 0.0,
            bar_length, 0.42, z_front, z_back,
        )
    hub["sbs_surface_detail"] = "raised_E_hub_badge_proxy"
    return _append_mesh_detail(hub, verts, faces, detail_material=MAT["metal"])


FONT_STROKES = {
    "A": (((0, 0), (0, 5)), ((0, 5), (2.5, 6)), ((2.5, 6), (5, 5)),
          ((5, 5), (5, 0)), ((0, 3), (5, 3))),
    "C": (((5, 6), (0, 6)), ((0, 6), (0, 0)), ((0, 0), (5, 0))),
    "E": (((0, 0), (0, 6)), ((0, 6), (5, 6)), ((0, 3), (4, 3)),
          ((0, 0), (5, 0))),
    "F": (((0, 0), (0, 6)), ((0, 6), (5, 6)), ((0, 3), (4, 3))),
    "G": (((5, 5), (5, 6)), ((5, 6), (0, 6)), ((0, 6), (0, 0)),
          ((0, 0), (5, 0)), ((5, 0), (5, 3)), ((5, 3), (2.5, 3))),
    "O": (((0, 0), (0, 6)), ((0, 6), (5, 6)), ((5, 6), (5, 0)),
          ((5, 0), (0, 0))),
    "R": (((0, 0), (0, 6)), ((0, 6), (5, 6)), ((5, 6), (5, 3)),
          ((5, 3), (0, 3)), ((2.5, 3), (5, 0))),
    "T": (((0, 6), (5, 6)), ((2.5, 6), (2.5, 0))),
    "V": (((0, 6), (2.5, 0)), ((2.5, 0), (5, 6))),
    "X": (((0, 6), (5, 0)), ((0, 0), (5, 6))),
}


def add_stroke_wordmark(obj, text, height, stroke_width=0.22):
    """Add simplified raised lettering to the front of a shroud rail."""
    scale = height / 6.0
    gap_units = 1.1
    widths = [2.5 if char == " " else 5.0 for char in text]
    total_units = sum(widths) + gap_units * max(0, len(text) - 1)
    cursor = -total_units * scale / 2
    y_front = -SHROUD_THICKNESS / 2 - 0.30
    y_back = -SHROUD_THICKNESS / 2 + 0.05
    detail_verts, detail_faces = [], []

    for char, glyph_width in zip(text, widths):
        for start, end in FONT_STROKES.get(char, ()):
            x1 = cursor + start[0] * scale
            z1 = (start[1] - 3.0) * scale
            x2 = cursor + end[0] * scale
            z2 = (end[1] - 3.0) * scale
            dx, dz = x2 - x1, z2 - z1
            _append_prism(
                detail_verts, detail_faces,
                (x1 + x2) / 2, (z1 + z2) / 2,
                dx, dz, math.hypot(dx, dz), stroke_width,
                y_front, y_back,
            )
        cursor += (glyph_width + gap_units) * scale

    obj["sbs_surface_detail"] = "simplified_raised_wordmark_proxy"
    return _append_mesh_detail(obj, detail_verts, detail_faces)


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


def cylinder_between(name, component_id, start, end, radius, mat, collection, parent):
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
    tagged = tag(obj, component_id, STATUS["illustrative"],
                 geometry="illustrative_proxy")
    set_parent_keep_world(tagged, parent)
    return tagged


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

    # LanOC describes raised EVGA E-logo bumps on the blade surfaces, like
    # golf-ball dimples. Model a restrained four-stroke E relief on each
    # blade: its size/shape is a visual interpretation, not measured CAD.
    mark_angle = base_angle + math.radians(6.0)
    radial = (math.cos(mark_angle), math.sin(mark_angle))
    tangent = (-radial[1], radial[0])
    mark_radius = 27.0
    mark_center = (mark_radius * radial[0], mark_radius * radial[1])
    emboss_front = -FAN_BLADE_DEPTH / 2 - 0.18
    emboss_back = -FAN_BLADE_DEPTH / 2 + 0.05
    _append_prism(
        verts, faces, mark_center[0], mark_center[1],
        radial[0], radial[1], 4.2, 0.42, emboss_front, emboss_back,
    )
    for radial_offset, bar_length in ((1.45, 3.35), (0.0, 2.85), (-1.45, 3.35)):
        _append_prism(
            verts, faces,
            mark_center[0] + radial[0] * radial_offset,
            mark_center[1] + radial[1] * radial_offset,
            tangent[0], tangent[1], bar_length, 0.42,
            emboss_front, emboss_back,
        )

    name = f"Fan {index} | blade {blade_index + 1}"
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = (center[0], base_y, center[2])
    collection.objects.link(obj)
    obj.data.materials.append(MAT["fan"])
    obj["sbs_surface_detail"] = "stylized_raised_E_mark_proxy"
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

    # The ring and hub are static parts of the fan assembly.
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
    add_hub_emblem(hub)
    set_parent_keep_world(hub, assembly)

    # A dedicated stable pivot lets the viewer animate only the impeller.
    # Its local Y axis is the fan axle; geometry remains illustrative proxy.
    rotor = make_assembly(
        f"Fan {index} impeller rotor",
        f"assembly.fan.{index}.rotor",
        (x, y - 1.5, z),
        collection,
        parent=assembly,
    )
    rotor["sbs_fan_rotor"] = True
    rotor["sbs_fan_axis"] = "y"

    for blade in range(FAN_BLADE_COUNT):
        obj = curved_fan_blade(
            index, blade, FAN_BLADE_COUNT, (x, y, z),
            y - 1.5, collection,
        )
        set_parent_keep_world(obj, rotor)

    # The exact teardown counts three mounting screws on each independently
    # replaceable fan. Individual screw centres are not mapped, so keep nodes logical-only.
    for screw_index in range(1, 4):
        make_assembly(
            f"Fan {index} mounting screw {screw_index} | location unmapped",
            f"fastener.fan.{index}.{screw_index:02d}",
            (x, y, z), collection, parent=assembly,
            evidence=STATUS["visible_exact_model"], geometry="logical_only",
        )


def validate_scene_transform_integrity():
    """Fail generation if parent assignment moves geometry away from its centres."""
    bpy.context.view_layer.update()
    failures = []

    for index, x in enumerate(FAN_CENTERS_X, start=1):
        expected_frame = Vector((x, -CARD_THICKNESS / 2 - 1.5, FAN_CENTER_Z))
        expected_hub = Vector((x, -CARD_THICKNESS / 2 - 1.5 - 2.2, FAN_CENTER_Z))
        expected_rotor = Vector((x, -CARD_THICKNESS / 2 - 1.5 - 1.5, FAN_CENTER_Z))

        frame = bpy.data.objects.get(f"Fan {index} | annular frame")
        hub = bpy.data.objects.get(f"Fan {index} | hub")
        rotor = bpy.data.objects.get(f"Fan {index} impeller rotor")
        if frame is None or hub is None or rotor is None:
            failures.append(f"Fan {index}: frame, hub or rotor pivot missing")
            continue
        if rotor.get("sbs_component_id") != f"assembly.fan.{index}.rotor":
            failures.append(f"Fan {index}: rotor stable component ID missing")
        if rotor.get("sbs_fan_axis") != "y":
            failures.append(f"Fan {index}: rotor axis metadata is not Y")
        if rotor.parent != bpy.data.objects.get(f"Fan {index} assembly"):
            failures.append(f"Fan {index}: rotor is not a child of the fan assembly")
        if frame.parent != rotor.parent or hub.parent != rotor.parent:
            failures.append(f"Fan {index}: static frame/hub must stay outside the rotor pivot")

        checks = [
            (f"Fan {index} frame", frame, expected_frame),
            (f"Fan {index} hub", hub, expected_hub),
            (f"Fan {index} rotor pivot", rotor, expected_rotor),
        ]
        for blade_index in range(1, FAN_BLADE_COUNT + 1):
            blade = bpy.data.objects.get(f"Fan {index} | blade {blade_index}")
            if blade is None:
                failures.append(f"Fan {index}: blade {blade_index} missing")
            else:
                if blade.parent != rotor:
                    failures.append(f"Fan {index}: blade {blade_index} is not parented to rotor pivot")
                checks.append((
                    f"Fan {index} blade {blade_index}",
                    blade,
                    expected_rotor,
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
    print("Both fan frames, hubs and dedicated impeller pivots match expected centres.")
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
    # Exact-model photos show EVGA branding at the top centre and
    # GEFORCE RTX lettering along the lower edge. These raised stroke-font
    # marks are readability proxies, not exact vector logos or dimensions.
    add_stroke_wordmark(shroud_parts[0], "EVGA", height=3.0, stroke_width=0.24)
    add_stroke_wordmark(shroud_parts[1], "GEFORCE RTX", height=2.45, stroke_width=0.20)
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

    # Exact-model review shows the copper contact plate spans GPU and memory;
    # its full dimensions and contact geometry remain an illustrative proxy.
    contact = cube(
        "GPU and memory contact proxy | copper",
        "cooling.gpu_contact",
        (CARD_LENGTH * 0.54, -3.0, CARD_HEIGHT * 0.52),
        (100.0, 3.0, 78.0),
        MAT["copper"], cool,
    )
    set_parent_keep_world(contact, cooling_group)

    # Exact-SKU review states four central GPU-contact heatpipes plus two side heatpipes.
    # Route geometry below is independently selectable but remains a photo-estimated proxy.
    heatpipes_group = make_assembly(
        "Heatpipe assembly | six reviewed pipes",
        "cooling.heatpipes",
        (CARD_LENGTH / 2, 0, CARD_HEIGHT / 2),
        cool, parent=cooling_group,
        evidence=STATUS["teardown_supported"], geometry="assembly_node",
    )
    main_pipe_group = make_assembly(
        "Four central GPU-contact heatpipes",
        "cooling.heatpipe.candidate.1",
        (CARD_LENGTH * 0.48, -2.0, CARD_HEIGHT * 0.55),
        cool, parent=heatpipes_group,
        evidence=STATUS["teardown_supported"], geometry="assembly_node",
    )
    side_pipe_group = make_assembly(
        "Two side heatpipes",
        "cooling.heatpipe.candidate.2",
        (CARD_LENGTH * 0.5, -2.0, CARD_HEIGHT * 0.42),
        cool, parent=heatpipes_group,
        evidence=STATUS["teardown_supported"], geometry="assembly_node",
    )
    heatpipe_routes = (
        ("cooling.heatpipe.main.01", "Main GPU-contact heatpipe 01", main_pipe_group,
         ((82, -4.4, 50), (75, -3.2, 54), (66, -1.8, 58), (55, -0.7, 63), (45, 0.0, 66))),
        ("cooling.heatpipe.main.02", "Main GPU-contact heatpipe 02", main_pipe_group,
         ((88, -4.4, 56), (82, -3.2, 60), (74, -1.8, 64), (64, -0.7, 68), (53, 0.0, 70))),
        ("cooling.heatpipe.main.03", "Main GPU-contact heatpipe 03", main_pipe_group,
         ((106, -4.4, 50), (113, -3.2, 54), (122, -1.8, 58), (133, -0.7, 63), (145, 0.0, 66))),
        ("cooling.heatpipe.main.04", "Main GPU-contact heatpipe 04", main_pipe_group,
         ((112, -4.4, 56), (119, -3.2, 60), (127, -1.8, 64), (138, -0.7, 68), (150, 0.0, 70))),
        ("cooling.heatpipe.side.01", "Side heatpipe 01", side_pipe_group,
         ((76, -4.2, 44), (65, -3.3, 42), (50, -1.9, 41), (32, -0.7, 43), (18, 0.0, 45))),
        ("cooling.heatpipe.side.02", "Side heatpipe 02", side_pipe_group,
         ((124, -4.2, 44), (137, -3.3, 42), (153, -1.9, 41), (171, -0.7, 43), (186, 0.0, 45))),
    )
    heatpipe_paths = tuple(route[3] for route in heatpipe_routes)
    for route_id, route_name, route_parent, route_points in heatpipe_routes:
        pipe_group = make_assembly(
            route_name, route_id, route_points[0], cool, parent=route_parent,
            evidence=STATUS["teardown_supported"], geometry="illustrative_proxy",
        )
        route_slug = route_id.replace("cooling.heatpipe.", "")
        for segment_index, (start, end) in enumerate(zip(route_points, route_points[1:]), start=1):
            cylinder_between(
                "{} segment {}".format(route_name, segment_index),
                "visual.detail.heatpipe.{}.segment.{:02d}".format(route_slug, segment_index),
                start, end, 1.35, MAT["heatpipe"], cool, pipe_group,
            )

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

    # Exact-SKU-linked teardown identifies six Samsung K4ZAF325BM-HC16 packages.
    # The same review's PCB identity photo reads P/N 12G-P5-3655-KR.
    # Device rating is 16 Gbps/pin; 16 Gbit, 512M x 32 and 180-FBGA
    # attributes are transcribed from a secondary catalog, not a primary datasheet.
    # Centres below remain photo-estimated; no BoardView coordinates or net map exist.
    memory_centres = (
        (134.0, 78.0), (154.0, 58.0), (134.0, 40.0),
        (75.0, 25.0), (100.0, 22.0), (125.0, 25.0),
    )
    for i, (x, z) in enumerate(memory_centres, start=1):
        memory = cube(
            f"Samsung K4ZAF325BM-HC16 GDDR6 package {i}",
            f"chip.memory.candidate.{i}",
            (x, half_y - 4.0, z),
            (14.0, 4.0, 12.0),
            MAT["memory"], pcbcol,
            evidence=STATUS["visible_exact_model"],
        )
        memory["sbs_position_status"] = "image_estimated_not_measured"
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

    # Deep component atlas tranche: individually selectable interfaces and service details.
    # All dimensions and locations below are deliberately proxy geometry unless separately sourced.
    def make_detail_box(name, position, dimensions, mat, parent, collection):
        bpy.ops.mesh.primitive_cube_add(size=1, location=position)
        obj = bpy.context.object
        obj.name = name
        obj.dimensions = dimensions
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.data.materials.append(mat)
        move_to_collection(obj, collection)
        slug = "".join(ch.lower() if ch.isalnum() else "." for ch in obj.name)
        while ".." in slug:
            slug = slug.replace("..", ".")
        tag(
            obj,
            "visual.detail." + slug.strip("."),
            STATUS["illustrative"],
            geometry="illustrative_proxy",
            export_role="decorative_detail",
        )
        set_parent_keep_world(obj, parent)
        obj["sbs_visual_proxy"] = True
        return obj

    def make_detail_cylinder(name, position, radius, depth, mat, parent, collection, vertices=32):
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=vertices, radius=radius, depth=depth, location=position,
            rotation=(math.radians(90), 0, 0),
        )
        obj = bpy.context.object
        obj.name = name
        obj.data.materials.append(mat)
        move_to_collection(obj, collection)
        slug = "".join(ch.lower() if ch.isalnum() else "." for ch in obj.name)
        while ".." in slug:
            slug = slug.replace("..", ".")
        tag(
            obj,
            "visual.detail." + slug.strip("."),
            STATUS["illustrative"],
            geometry="illustrative_proxy",
            export_role="decorative_detail",
        )
        set_parent_keep_world(obj, parent)
        obj["sbs_visual_proxy"] = True
        return obj

    # Four copper terminal faces are visible at the cooler end in the exact XC BLACK review.
    # The face count is not a claim of four unique pipes; positions are photo-estimated.
    heatpipe_end_positions = (
        heatpipe_paths[0][0], heatpipe_paths[0][-1],
        heatpipe_paths[1][0], heatpipe_paths[1][-1],
    )
    for end_index, end_position in enumerate(heatpipe_end_positions, start=1):
        end_id = "cooling.heatpipe.end.{:02d}".format(end_index)
        end_group = make_assembly(
            "Visible copper heatpipe terminal {:02d}".format(end_index),
            end_id, end_position, cool, parent=heatpipes_group,
            evidence=STATUS["visible_exact_model"], geometry="illustrative_proxy",
        )
        make_detail_cylinder(
            "Copper terminal face proxy {:02d}".format(end_index),
            end_position, 2.2, 0.55, MAT["copper"], end_group, cool, vertices=32,
        )

    # A separate die node is nested under the already selectable GA106 package.
    die_group = make_assembly(
        "GA106 silicon die | illustrative proxy", "chip.gpu.die",
        (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
        pcbcol, parent=gpu_package,
    )
    make_detail_box(
        "GA106 die surface proxy",
        (CARD_LENGTH * 0.48, half_y - 7.4, CARD_HEIGHT * 0.52),
        (15.0, 0.8, 15.0), MAT["gpu"], die_group, pcbcol,
    )

    # Logical architecture hierarchy: exportable EMPTY nodes only.
    # No physical die floorplan, silicon block coordinates or shader wiring is inferred.
    sm_cluster = make_assembly(
        "GA106 SM cluster | logical architecture",
        "chip.gpu.sm.cluster",
        (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
        pcbcol, parent=die_group,
        evidence=STATUS["manufacturer_data"], geometry="logical_only",
    )
    for logical_id, logical_name in (
        ("chip.gpu.cuda_core.array", "CUDA core array · 3,584"),
        ("chip.gpu.tensor_core.array", "Tensor Core array · 112 · generation 3"),
        ("chip.gpu.rt_core.array", "RT Core array · 28 · generation 2"),
        ("chip.gpu.tmu.array", "Texture mapping units · 112"),
        ("chip.gpu.rop.array", "Raster operations units · 48"),
    ):
        make_assembly(
            logical_name, logical_id,
            (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
            pcbcol, parent=sm_cluster,
            evidence=STATUS["manufacturer_data"], geometry="logical_only",
        )

    # GA10x hierarchy: one logical TPC aggregate and individually selectable SM nodes.
    # Two SMs and one PolyMorph Engine belong to each TPC. Fourteen TPCs are derived
    # from the RTX 3060's 28 configured SMs; no GPC/floorplan locations are asserted.
    tpc_cluster = make_assembly(
        "GA10x TPC aggregate | 14 logical TPCs",
        "chip.gpu.tpc.cluster",
        (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
        pcbcol, parent=sm_cluster,
        evidence=STATUS["manufacturer_data"], geometry="logical_only",
    )
    for tpc_index in range(1, 15):
        tpc_number = "{:02d}".format(tpc_index)
        tpc_node = make_assembly(
            "GA10x TPC {} | logical instance".format(tpc_number),
            "chip.gpu.tpc." + tpc_number,
            (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
            pcbcol, parent=tpc_cluster,
            evidence=STATUS["manufacturer_data"], geometry="logical_only",
        )
        make_assembly(
            "PolyMorph Engine | TPC {}".format(tpc_number),
            "chip.gpu.tpc." + tpc_number + ".polymorph",
            (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
            pcbcol, parent=tpc_node,
            evidence=STATUS["manufacturer_data"], geometry="logical_only",
        )
        for sm_slot in range(1, 3):
            sm_index = (tpc_index - 1) * 2 + sm_slot
            sm_number = "{:02d}".format(sm_index)
            sm_node = make_assembly(
                "GA106 SM {} | logical instance".format(sm_number),
                "chip.gpu.sm." + sm_number,
                (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
                pcbcol, parent=tpc_node,
                evidence=STATUS["manufacturer_data"], geometry="logical_only",
            )
            for partition_index in range(1, 5):
                partition_number = "{:02d}".format(partition_index)
                make_assembly(
                    "GA10x SM {} processing partition {}".format(sm_number, partition_number),
                    "chip.gpu.sm." + sm_number + ".partition." + partition_number,
                    (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
                    pcbcol, parent=sm_node,
                    evidence=STATUS["manufacturer_data"], geometry="logical_only",
                )
    make_assembly(
        "GA10x PolyMorph Engine array | 14 logical engines",
        "chip.gpu.polymorph.array",
        (CARD_LENGTH * 0.48, half_y - 7.0, CARD_HEIGHT * 0.52),
        pcbcol, parent=tpc_cluster,
        evidence=STATUS["manufacturer_data"], geometry="logical_only",
    )

    # Memory subsystem and six logical presentation segments; no package/channel map is asserted.
    memory_bus = make_assembly(
        "GDDR6 memory interface · 192-bit logical node",
        "chip.memory.gddr6.bus",
        (CARD_LENGTH * 0.5, half_y - PCB_THICKNESS / 2, CARD_HEIGHT * 0.5),
        pcbcol, parent=pcb_group,
        evidence=STATUS["manufacturer_data"], geometry="logical_only",
    )
    for channel_index, (memory_x, memory_z) in enumerate(memory_centres, start=1):
        channel_id = "chip.memory.channel.{:02d}".format(channel_index)
        make_assembly(
            "GDDR6 interface presentation segment {:02d} · logical only".format(channel_index),
            channel_id,
            (memory_x, half_y - PCB_THICKNESS / 2, memory_z),
            pcbcol, parent=memory_bus,
            evidence=STATUS["manufacturer_data"], geometry="logical_only",
        )


    # Thermal interfaces are selectable independently from the heatsink and GPU.
    thermal_group = make_assembly(
        "Thermal interface materials | proxy", "cooling.thermal_interface",
        (CARD_LENGTH / 2, -6.0, CARD_HEIGHT / 2), cool, parent=cooling_group,
    )
    paste = cube(
        "GPU thermal compound proxy", "cooling.thermal_paste.gpu",
        (CARD_LENGTH * 0.48, -5.0, CARD_HEIGHT * 0.52),
        (19.0, 0.35, 19.0), MAT["copper"], cool,
    )
    set_parent_keep_world(paste, thermal_group)

    memory_pad_group = make_assembly(
        "Memory thermal pad group | proxy", "cooling.thermal_pad.memory",
        (CARD_LENGTH * 0.55, -5.8, CARD_HEIGHT * 0.52),
        cool, parent=thermal_group,
    )
    for pad_index, (pad_x, pad_z) in enumerate(memory_centres, start=1):
        pad_id = "cooling.thermal_pad.memory.{:02d}".format(pad_index)
        pad = cube(
            "Memory thermal pad proxy {}".format(pad_index),
            pad_id,
            (pad_x, -5.6, pad_z), (15.0, 0.65, 13.0),
            MAT["heatsink"], cool,
            evidence=STATUS["illustrative"],
        )
        set_parent_keep_world(pad, memory_pad_group)

    vrm_pad_group = make_assembly(
        "Power-stage thermal pad group | proxy", "cooling.thermal_pad.vrm",
        (stage_origin[0], -5.8, stage_origin[2]), cool, parent=thermal_group,
    )
    vrm_pad = cube(
        "Power-stage thermal pad strip proxy",
        "cooling.thermal_pad.vrm.01",
        (stage_origin[0] + 9.0, -5.6, stage_origin[2] + 4.0),
        (34.0, 0.65, 18.0), MAT["heatsink"], cool,
        evidence=STATUS["illustrative"],
    )
    set_parent_keep_world(vrm_pad, vrm_pad_group)

    vrm_copper_contact = make_assembly(
        "Copper plate contacting MOSFET row | proxy",
        "cooling.vrm.copper_contact",
        (stage_origin[0] + 2.0, -4.6, stage_origin[2] - 13.0),
        cool, parent=thermal_group,
        evidence=STATUS["teardown_supported"], geometry="illustrative_proxy",
    )
    make_detail_box(
        "VRM copper contact plate proxy",
        (stage_origin[0] + 2.0, -4.6, stage_origin[2] - 13.0),
        (38.0, 1.0, 17.0), MAT["copper"], vrm_copper_contact, cool,
    )

    # The exact-SKU-linked Tom's Hardware teardown reports eight cooler/shroud
    # retention screws: four around the GPU and four near the far/rear end.
    # LanOC independently shows the four GPU-area subset; only those four positions
    # are photo-estimated and rendered. The rear four are count-confirmed logical nodes.
    fasteners_group = make_assembly(
        "Cooler fastener set | 8 exact-SKU screws; rear positions unmapped", "assembly.fasteners",
        (CARD_LENGTH / 2, half_y + 0.5, CARD_HEIGHT / 2),
        ext, parent=card_root,
    )
    screw_positions = (
        (59.0, 27.0), (108.0, 27.0),
        (56.0, 62.0), (108.0, 62.0),
    )
    for screw_index, (sx, sz) in enumerate(screw_positions, start=1):
        screw_id = "fastener.cooler.{:02d}".format(screw_index)
        screw_group = make_assembly(
            "GPU heatsink mounting screw {:02d}".format(screw_index), screw_id,
            (sx, half_y + 0.45, sz), ext, parent=fasteners_group,
            evidence=STATUS["visible_exact_model"], geometry="illustrative_proxy",
        )
        make_detail_cylinder(
            "GPU screw head proxy {:02d}".format(screw_index),
            (sx, half_y + 0.65, sz), 2.1, 0.7,
            MAT["metal"], screw_group, ext, vertices=24,
        )
        make_detail_box(
            "GPU screw slot proxy {:02d}".format(screw_index),
            (sx, half_y + 1.02, sz), (1.7, 0.16, 0.35),
            MAT["connector"], screw_group, ext,
        )

    for rear_index in range(5, 9):
        screw_id = "fastener.cooler.{:02d}".format(rear_index)
        make_assembly(
            "Rear-area cooler retention screw {:02d} | position unmapped".format(rear_index - 4),
            screw_id,
            (0.0, half_y + 0.45, 0.0), ext, parent=fasteners_group,
            evidence=STATUS["visible_exact_model"],
            geometry="logical_only",
        )

    # PCIe edge contact field: representative segmented pads, not a pin-count drawing.
    pcie_group = make_assembly(
        "PCI Express edge connector | proxy", "pcb.connector.pcie",
        (CARD_LENGTH / 2, half_y - 2.0, 4.0), pcbcol, parent=pcb,
    )
    make_detail_box(
        "PCIe connector dielectric proxy",
        (104.0, half_y - 2.0, 4.0), (116.0, 1.0, 8.0),
        MAT["connector"], pcie_group, pcbcol,
    )
    for pad_index in range(64):
        pad_x = 48.0 + pad_index * 1.75
        for side, pad_y in (("front", half_y - 2.72), ("rear", half_y - 1.28)):
            make_detail_box(
                "PCIe {} contact proxy {:02d}".format(side, pad_index + 1),
                (pad_x, pad_y, 4.2), (0.95, 0.16, 5.6),
                MAT["copper"], pcie_group, pcbcol,
            )

    # Two independently selectable fan cable headers; pinout is intentionally absent.
    header_positions = ((166.0, 15.0, 88.0), (176.0, 15.0, 88.0))
    for header_index, (hx, hy, hz) in enumerate(header_positions, start=1):
        header_group = make_assembly(
            "Fan header {} | proxy".format(header_index),
            "connector.fan.header.{}".format(header_index),
            (hx, hy, hz), pcbcol, parent=pcb_group,
        )
        make_detail_box(
            "Fan header {} socket proxy".format(header_index),
            (hx, hy - 0.7, hz), (5.0, 2.2, 4.5),
            MAT["connector"], header_group, pcbcol,
        )
        make_detail_box(
            "Fan header {} cable shroud proxy".format(header_index),
            (hx, hy - 1.8, hz), (5.8, 0.7, 5.2),
            MAT["metal"], header_group, pcbcol,
        )

    # Individual rear I/O receptacles. Apertures are visual proxies, not fitment CAD.
    port_specs = (
        ("connector.displayport.1", "DisplayPort receptacle 1", -12.0, 6.8),
        ("connector.displayport.2", "DisplayPort receptacle 2", -4.0, 6.8),
        ("connector.displayport.3", "DisplayPort receptacle 3", 4.0, 6.8),
        ("connector.hdmi.1", "HDMI receptacle 1", 12.0, 5.5),
    )
    for port_id, port_name, port_y, width in port_specs:
        port_group = make_assembly(
            "{} | proxy".format(port_name), port_id,
            (1.2, port_y, 55.0), conn, parent=bracket,
        )
        make_detail_box(
            "{} metal shell proxy".format(port_name),
            (1.15, port_y, 55.0), (3.0, width, 12.0),
            MAT["metal"], port_group, conn,
        )
        make_detail_box(
            "{} aperture proxy".format(port_name),
            (0.65, port_y, 55.0), (0.5, width * 0.68, 7.0),
            MAT["connector"], port_group, conn,
        )

    # Expose the shunt discussion and generic passives without inventing a VRM topology.
    shunt_group = make_assembly(
        "Shunt resistor area | visual proxy", "power.shunt.cluster",
        (stage_origin[0] - 16.0, half_y - 2.0, stage_origin[2] - 15.0),
        pcbcol, parent=power_stage_group,
    )
    shunt_8pin = make_assembly(
        "Auxiliary 8-pin input shunt | 5 milliohms stated in teardown",
        "power.shunt.8pin",
        (stage_origin[0] - 18.0, half_y - 2.0, stage_origin[2] - 15.0),
        pcbcol, parent=shunt_group,
        evidence=STATUS["teardown_supported"], geometry="illustrative_proxy",
    )
    make_detail_box(
        "Auxiliary 8-pin shunt body proxy",
        (stage_origin[0] - 18.0, half_y - 2.0, stage_origin[2] - 15.0),
        (3.0, 1.2, 2.0), MAT["power_stage"], shunt_8pin, pcbcol,
    )
    shunt_pcie = make_assembly(
        "PCIe-slot 12V shunt | resistance unknown",
        "power.shunt.pcie_slot",
        (stage_origin[0] - 10.0, half_y - 2.0, stage_origin[2] - 15.0),
        pcbcol, parent=shunt_group,
        evidence=STATUS["teardown_supported"], geometry="logical_only",
    )

    fuse_group = make_assembly(
        "Input protection fuse | rating unknown",
        "power.fuse.input",
        (stage_origin[0] + 22.0, half_y - 2.0, stage_origin[2] + 12.0),
        pcbcol, parent=power_stage_group,
        evidence=STATUS["teardown_supported"], geometry="logical_only",
    )

    passives_group = make_assembly(
        "Unidentified power passives | visual proxy", "power.passives.cluster",
        (stage_origin[0] + 15.0, half_y - 2.0, stage_origin[2] + 14.0),
        pcbcol, parent=power_stage_group,
    )
    for passive_index in range(6):
        make_detail_box(
            "Unidentified passive proxy {}".format(passive_index + 1),
            (stage_origin[0] + 8.0 + passive_index * 4.5, half_y - 2.0, stage_origin[2] + 14.0),
            (2.4, 1.2, 2.2), MAT["power_stage"], passives_group, pcbcol,
        )

    # Photo-based VRM detail atlas. These groups deliberately carry no phase,
    # part-number, electrical-net, component-value or exact-coordinate claim.
    vrm_inductor_1 = make_assembly(
        "Inductor candidate 1 | photo-estimated", "power.inductor.candidate.1",
        (stage_origin[0] - 4.0, half_y - 2.5, stage_origin[2] - 5.0),
        pcbcol, parent=power_stage_group,
    )
    make_detail_box(
        "Inductor candidate 1 body proxy",
        (stage_origin[0] - 4.0, half_y - 2.2, stage_origin[2] - 5.0),
        (11.0, 3.0, 11.0), MAT["power_stage"], vrm_inductor_1, pcbcol,
    )
    make_detail_box(
        "Inductor candidate 1 top marking proxy",
        (stage_origin[0] - 4.0, half_y - 0.55, stage_origin[2] - 5.0),
        (7.0, 0.25, 4.0), MAT["metal"], vrm_inductor_1, pcbcol,
    )

    vrm_inductor_2 = make_assembly(
        "Inductor candidate 2 | photo-estimated", "power.inductor.candidate.2",
        (stage_origin[0] + 12.0, half_y - 2.5, stage_origin[2] + 8.0),
        pcbcol, parent=power_stage_group,
    )
    make_detail_box(
        "Inductor candidate 2 body proxy",
        (stage_origin[0] + 12.0, half_y - 2.2, stage_origin[2] + 8.0),
        (11.0, 3.0, 11.0), MAT["power_stage"], vrm_inductor_2, pcbcol,
    )
    make_detail_box(
        "Inductor candidate 2 top marking proxy",
        (stage_origin[0] + 12.0, half_y - 0.55, stage_origin[2] + 8.0),
        (7.0, 0.25, 4.0), MAT["metal"], vrm_inductor_2, pcbcol,
    )

    capacitor_group = make_assembly(
        "Power-stage capacitor cluster | photo-estimated",
        "power.capacitor.cluster",
        (stage_origin[0] - 11.0, half_y - 2.0, stage_origin[2] + 14.0),
        pcbcol, parent=power_stage_group,
    )
    capacitor_positions = (
        (stage_origin[0] - 12.0, stage_origin[2] + 13.0),
        (stage_origin[0] - 5.0, stage_origin[2] + 17.0),
        (stage_origin[0] + 3.0, stage_origin[2] + 17.0),
        (stage_origin[0] + 10.0, stage_origin[2] + 17.0),
    )
    for capacitor_index, (cx, cz) in enumerate(capacitor_positions, start=1):
        make_detail_cylinder(
            "Power capacitor candidate {}".format(capacitor_index),
            (cx, half_y - 1.7, cz), 2.4, 3.8,
            MAT["metal"], capacitor_group, pcbcol, vertices=24,
        )

    switching_group = make_assembly(
        "MOSFET row | copper plate contact observed",
        "power.switching_device.cluster",
        (stage_origin[0] + 2.0, half_y - 2.4, stage_origin[2] - 13.0),
        pcbcol, parent=power_stage_group,
    )
    for switch_index in range(6):
        sx = stage_origin[0] - 9.0 + switch_index * 5.0
        make_detail_box(
            "Unidentified switching package proxy {}".format(switch_index + 1),
            (sx, half_y - 2.0, stage_origin[2] - 13.0),
            (3.5, 2.0, 4.0), MAT["connector"], switching_group, pcbcol,
        )

    controller_group = make_assembly(
        "Power controller IC candidate | photo-estimated",
        "power.controller.candidate",
        (stage_origin[0] + 25.0, half_y - 2.0, stage_origin[2] - 12.0),
        pcbcol, parent=power_stage_group,
    )
    make_detail_box(
        "Unidentified controller package proxy",
        (stage_origin[0] + 25.0, half_y - 2.1, stage_origin[2] - 12.0),
        (5.0, 1.5, 5.0), MAT["connector"], controller_group, pcbcol,
    )

    # LanOC describes a large PCB airflow cutout near the fan/card-end area.
    # This Boolean aperture is a rounded-rectangle VISUAL PLACEHOLDER only.
    # Its centre and 18 x 22 mm blockout dimensions are not measured and are not
    # taken from a BoardView. The exact aperture boundary remains unknown.
    cutout_center = (PCB_CUTOUT_PROXY_CENTER[0], half_y - PCB_THICKNESS / 2,
                     PCB_CUTOUT_PROXY_CENTER[1])
    bpy.ops.mesh.primitive_cube_add(size=1, location=cutout_center)
    cutout_cutter = bpy.context.object
    cutout_cutter.name = "TEMP | PCB airflow cutout Boolean cutter"
    cutout_cutter.dimensions = (
        PCB_CUTOUT_PROXY_SIZE[0],
        PCB_THICKNESS + 2.0,
        PCB_CUTOUT_PROXY_SIZE[1],
    )
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = cutout_cutter.modifiers.new("Rounded proxy corners", "BEVEL")
    bevel.width = 2.5
    bevel.segments = 5
    bpy.context.view_layer.objects.active = cutout_cutter
    bpy.ops.object.modifier_apply(modifier=bevel.name)

    boolean = pcb.modifiers.new("Illustrative PCB airflow aperture", "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.solver = "EXACT"
    boolean.object = cutout_cutter
    bpy.ops.object.select_all(action="DESELECT")
    pcb.select_set(True)
    bpy.context.view_layer.objects.active = pcb
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    pcb["sbs_airflow_cutout_boolean_applied"] = True
    bpy.data.objects.remove(cutout_cutter, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")

    # Stable selection node for the cutout; geometry lives in the PCB mesh above.
    cutout_group = make_assembly(
        "PCB airflow aperture | rounded proxy; size unmeasured", "pcb.airflow.cutout",
        cutout_center, pcbcol, parent=pcb,
        evidence=STATUS["teardown_supported"], geometry="illustrative_proxy",
    )
    cutout_group["sbs_proxy_aperture_size_mm"] = list(PCB_CUTOUT_PROXY_SIZE)
    cutout_group["sbs_proxy_aperture_dimensions_measured"] = False

    # Eight socket recesses are shown as a generic 8-pin connector teaching aid.
    # This does not document pin assignment, current rating or electrical routing.
    for socket_index in range(8):
        socket_x = CARD_LENGTH * 0.72 - 7.5 + (socket_index % 4) * 5.0
        socket_z = CARD_HEIGHT - 5.0 + (socket_index // 4) * 2.2 - 1.1
        make_detail_box(
            "8-pin socket cavity proxy {}".format(socket_index + 1),
            (socket_x, half_y - 5.25, socket_z), (2.6, 0.35, 1.5),
            MAT["connector"], power, conn,
        )

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
