#!/usr/bin/env python3
"""Generate a semantic Dell OptiPlex 5060 Tower blockout from model content.

This is an illustrative proxy scene, not manufacturer CAD. Geometry hints are
entered in millimetres and converted to metres for Blender/glTF export.
"""
from __future__ import annotations

import argparse
import json
import math
import struct
import sys
from pathlib import Path
from typing import Any

import bpy

REPO_ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = REPO_ROOT / "content/models/dell-optiplex-5060-mt"
DEFAULT_OUTPUT = REPO_ROOT / "MODELS/PCS/DELL/OPTIPLEX-5060-MT/04-WORKING/generated"
MODEL_ID = "pc.dell.optiplex-5060-mt"
REGULATORY_TYPE = "D18M005"
MM = 0.001


def mm_vector(values):
    if not isinstance(values, list) or len(values) != 3:
        raise ValueError(f"Expected a 3-value millimetre vector, got {values!r}")
    return tuple(float(value) * MM for value in values)


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, default=MODEL_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--no-glb", action="store_true")
    parser.add_argument("--no-blend", action="store_true")
    blender_args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return parser.parse_args(blender_args)


def material_for(cache, rgb):
    if not isinstance(rgb, list) or len(rgb) not in (3, 4):
        rgb = [0.38, 0.40, 0.42]
    rgba = tuple(max(0.0, min(1.0, float(value))) for value in rgb)
    if len(rgba) == 3:
        rgba = (*rgba, 1.0)
    if rgba not in cache:
        material = bpy.data.materials.new(f"SBS proxy material {len(cache) + 1:02d}")
        material.diffuse_color = rgba
        material.use_nodes = True
        shader = material.node_tree.nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Base Color"].default_value = rgba
            shader.inputs["Roughness"].default_value = 0.72
        cache[rgba] = material
    return cache[rgba]


def add_box(name, position, dimensions, material):
    if len(dimensions) != 3 or any(float(value) <= 0 for value in dimensions):
        raise ValueError(f"{name}: invalid box dimensions {dimensions!r}")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=mm_vector(position))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = mm_vector(dimensions)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return obj


def add_frame(name, position, dimensions, material):
    width, depth, height = (float(value) for value in dimensions)
    thickness = max(3.0, min(5.0, min(width, depth, height) * 0.035))
    xh, yh, zh = width / 2.0, depth / 2.0, height / 2.0
    beams = []
    for x in (-xh + thickness / 2, xh - thickness / 2):
        for y in (-yh + thickness / 2, yh - thickness / 2):
            beams.append(([x, y, 0], [thickness, thickness, height]))
    for y in (-yh + thickness / 2, yh - thickness / 2):
        for z in (-zh + thickness / 2, zh - thickness / 2):
            beams.append(([0, y, z], [width, thickness, thickness]))
    for x in (-xh + thickness / 2, xh - thickness / 2):
        for z in (-zh + thickness / 2, zh - thickness / 2):
            beams.append(([x, 0, z], [thickness, depth, thickness]))
    beams.append(([0, 0, -zh + 3.0], [width - 2 * thickness, depth - 2 * thickness, 2.0]))
    pieces = []
    for offset, size in beams:
        absolute = [float(position[i]) + offset[i] for i in range(3)]
        pieces.append(add_box(f"{name}__beam_{len(pieces) + 1:02d}", absolute, size, material))
    bpy.ops.object.select_all(action="DESELECT")
    for piece in pieces:
        piece.select_set(True)
    bpy.context.view_layer.objects.active = pieces[0]
    bpy.ops.object.join()
    result = pieces[0]
    result.name = name
    return result


def add_cylinder(name, hint, material):
    size = hint.get("size_mm", [4, 4, 4])
    if len(size) != 3 or any(float(value) <= 0 for value in size):
        raise ValueError(f"{name}: invalid cylinder dimensions {size!r}")
    depth = float(size[0]) * MM
    radius = max(float(size[1]), float(size[2])) * MM / 2.0
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=radius, depth=depth,
        location=mm_vector(hint.get("position_mm", [0, 0, 0]))
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def add_torus(name, hint, material):
    size = hint.get("size_mm", [7, 7, 7])
    outer = max(float(value) for value in size) * MM / 2.0
    bpy.ops.mesh.primitive_torus_add(
        major_segments=20, minor_segments=10,
        major_radius=max(outer * 0.72, 0.0015),
        minor_radius=max(outer * 0.22, 0.0005),
        location=mm_vector(hint.get("position_mm", [0, 0, 0]))
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def create_component(component, materials):
    component_id = component["id"]
    hint = component.get("geometry_hint") or {"shape": "empty"}
    shape = hint.get("shape", "empty")
    name = component_id
    material = material_for(materials, hint.get("color", [0.38, 0.40, 0.42]))
    if shape == "empty":
        obj = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(obj)
        obj.empty_display_type = "PLAIN_AXES"
        obj.empty_display_size = 0.006
        obj.location = mm_vector(hint.get("position_mm", [0, 0, 0]))
    elif shape == "box":
        obj = add_box(name, hint.get("position_mm", [0, 0, 0]), hint["size_mm"], material)
    elif shape == "frame":
        obj = add_frame(name, hint.get("position_mm", [0, 0, 0]), hint["size_mm"], material)
    elif shape == "cylinder":
        obj = add_cylinder(name, hint, material)
    elif shape == "torus":
        obj = add_torus(name, hint, material)
    else:
        raise ValueError(f"{component_id}: unsupported geometry shape {shape!r}")
    rotation = hint.get("rotation_deg", [0, 0, 0])
    if not isinstance(rotation, list) or len(rotation) != 3:
        raise ValueError(f"{component_id}: rotation_deg must contain three values")
    obj.rotation_euler = tuple(math.radians(float(value)) for value in rotation)
    obj["sbs_component_id"] = component_id
    obj["sbs_model_id"] = MODEL_ID
    obj["sbs_evidence_status"] = component.get("evidence_status", "unknown")
    obj["sbs_geometry_status"] = component.get("geometry_status", "illustrative_proxy")
    obj["sbs_configuration_status"] = component.get("configuration_status", "family_level_reference")
    fastener = component.get("fastener_spec")
    if isinstance(fastener, dict):
        obj["sbs_fastener_designation"] = str(fastener.get("designation", ""))
    return obj


def parent_keep_world(child, parent):
    bpy.context.view_layer.update()
    world_matrix = child.matrix_world.copy()
    parent_matrix = parent.matrix_world.copy()
    child.parent = parent
    child.matrix_parent_inverse = parent_matrix.inverted()
    child.matrix_world = world_matrix
    bpy.context.view_layer.update()


def verify_glb(path, expected_ids):
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError("Generated GLB is too short")
    magic, version, total_length = struct.unpack_from("<III", data, 0)
    if magic != 0x46546C67 or version != 2 or total_length != len(data):
        raise ValueError("Generated GLB has an invalid header")
    json_length, json_type = struct.unpack_from("<II", data, 12)
    if json_type != 0x4E4F534A or 20 + json_length > len(data):
        raise ValueError("Generated GLB has an invalid JSON chunk")
    document = json.loads(data[20:20 + json_length].decode("utf-8").rstrip(" \t\r\n\0"))
    node_ids = {
        node.get("extras", {}).get("sbs_component_id")
        for node in document.get("nodes", [])
        if isinstance(node.get("extras"), dict)
    }
    missing = sorted(expected_ids - node_ids)
    if missing:
        raise ValueError(f"Generated GLB is missing component IDs: {missing[:12]}")
    resources = list(document.get("buffers", [])) + list(document.get("images", []))
    if any(isinstance(item, dict) and isinstance(item.get("uri"), str) and not item["uri"].startswith("data:") for item in resources):
        raise ValueError("Generated GLB contains an external resource URI")
    return {
        "node_count": len(document.get("nodes", [])),
        "component_node_count": len(node_ids),
        "component_ids_missing": missing,
        "bytes": len(data)
    }


def main():
    args = parse_args()
    model_dir = args.model_dir.resolve(strict=True)
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    model = json.loads((model_dir / "model.json").read_text(encoding="utf-8"))
    package = json.loads((model_dir / "components.json").read_text(encoding="utf-8"))
    components = package.get("components")
    if model.get("id") != MODEL_ID or model.get("part_number") != REGULATORY_TYPE:
        raise ValueError("Model identity does not match the OptiPlex 5060 Tower generator")
    if model.get("geometry_status") != "illustrative_proxy_not_cad":
        raise ValueError("The PC blockout must remain explicitly labelled as non-CAD")
    if not isinstance(components, list) or not components:
        raise ValueError("components.json must contain a non-empty component list")
    ids = [item.get("id") for item in components]
    if any(not isinstance(value, str) or not value for value in ids) or len(ids) != len(set(ids)):
        raise ValueError("Component IDs must be non-empty and unique")
    component_map = {item["id"]: item for item in components}
    for item in components:
        parent_id = item.get("parent_id")
        if parent_id is not None and parent_id not in component_map:
            raise ValueError(f"{item['id']}: unknown parent {parent_id}")

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.fps = 30
    materials = {}
    objects = {}
    for item in components:
        objects[item["id"]] = create_component(item, materials)
    for item in components:
        parent_id = item.get("parent_id")
        if parent_id:
            parent_keep_world(objects[item["id"]], objects[parent_id])
    bpy.context.view_layer.update()

    blend_path = output_dir / "optiplex_5060_mt_blockout_v01.blend"
    glb_path = output_dir / "optiplex_5060_mt_blockout_v01.glb"
    report_path = output_dir / "optiplex_5060_mt_blockout_v01.manifest.json"
    if not args.no_blend:
        bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    if args.no_glb:
        glb_report = {
            "node_count": 0, "component_node_count": 0,
            "component_ids_missing": ids, "bytes": 0
        }
    else:
        bpy.ops.object.select_all(action="DESELECT")
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path), export_format="GLB",
            export_extras=True, export_apply=True, export_yup=True,
            use_selection=False
        )
        glb_report = verify_glb(glb_path, set(ids))

    report = {
        "schema_version": "0.1.0",
        "model_id": MODEL_ID,
        "part_number": REGULATORY_TYPE,
        "asset_type": "illustrative_semantic_blockout",
        "geometry_status": "illustrative_proxy_not_cad",
        "generator": "tools/modeling/build_optiplex_5060_mt_blockout.py",
        "coordinate_system": {
            "authoring_units": "m", "authoring_up_axis": "Z", "glb_up_axis": "Y"
        },
        "component_count": len(components),
        "scene_report": glb_report,
        "warnings": [
            "This scene is an illustrative proxy blockout, not manufacturer CAD.",
            "Geometry hint positions and dimensions are draft placements, not measured chassis or PCB dimensions.",
            "Optional WLAN, Type-C, antenna, storage and optical-drive items are option references, not an asserted installed bill of materials.",
            "Fastener coordinates are diagrammatic placeholders; only documented counts and some types/procedures are source-backed.",
            "Do not use this asset for manufacturing, fitment, repair instructions, airflow simulation or electrical simulation."
        ]
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "blend": None if args.no_blend else str(blend_path),
        "glb": None if args.no_glb else str(glb_path),
        "manifest": str(report_path),
        "components": len(components),
        "scene": glb_report
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
