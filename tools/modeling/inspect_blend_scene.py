#!/usr/bin/env python3
"""Emit a text/JSON inspection report for the currently opened Blender scene.

Run:
  blender --background model.blend --python tools/modeling/inspect_blend_scene.py -- \
    --output /tmp/sbs-inspection.txt --json-output /tmp/sbs-inspection.json

This intentionally produces inspectable text instead of requiring screenshots.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy
from mathutils import Vector


def object_record(obj):
    bpy.context.view_layer.update()
    world_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    if world_corners:
        mins = [min(point[i] for point in world_corners) for i in range(3)]
        maxs = [max(point[i] for point in world_corners) for i in range(3)]
        bounds = {
            "min_mm": [round(float(value * 1000), 3) for value in mins],
            "max_mm": [round(float(value * 1000), 3) for value in maxs],
        }
    else:
        bounds = None
    parent = obj.parent
    return {
        "name": obj.name,
        "type": obj.type,
        "component_id": obj.get("sbs_component_id"),
        "parent_component_id": parent.get("sbs_component_id") if parent else None,
        "parent_name": parent.name if parent else None,
        "evidence_status": obj.get("sbs_evidence_status"),
        "geometry_status": obj.get("sbs_geometry_status"),
        "export_role": obj.get("sbs_export_role"),
        "location_mm": [round(float(value * 1000), 3) for value in obj.matrix_world.translation],
        "dimensions_mm": [round(float(value * 1000), 3) for value in obj.dimensions],
        "world_bounds": bounds,
        "collections": sorted(collection.name for collection in obj.users_collection),
        "mesh_vertices": len(obj.data.vertices) if obj.type == "MESH" else None,
        "mesh_polygons": len(obj.data.polygons) if obj.type == "MESH" else None,
    }


def build_report():
    objects = [object_record(obj) for obj in bpy.context.scene.objects]
    ids = [item["component_id"] for item in objects if item["component_id"]]
    missing = [item["name"] for item in objects if not item["component_id"]]
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    renderable = [item for item in objects if item["type"] == "MESH" and item["export_role"] != "reference_only"]
    points = [item["world_bounds"] for item in renderable if item["world_bounds"]]
    if points:
        mins = [min(item["min_mm"][axis] for item in points) for axis in range(3)]
        maxs = [max(item["max_mm"][axis] for item in points) for axis in range(3)]
        bounds = {"min_mm": mins, "max_mm": maxs,
                  "dimensions_mm": [round(maxs[i] - mins[i], 3) for i in range(3)]}
    else:
        bounds = None
    return {
        "scene": bpy.context.scene.name,
        "model_id": bpy.context.scene.get("sbs_model_id"),
        "asset_type": bpy.context.scene.get("sbs_asset_type"),
        "geometry_status": bpy.context.scene.get("sbs_geometry_status"),
        "object_count": len(objects),
        "mesh_count": sum(item["type"] == "MESH" for item in objects),
        "assembly_count": sum(item["type"] == "EMPTY" for item in objects),
        "objects_with_component_ids": len(ids),
        "objects_missing_component_ids": missing,
        "duplicate_component_ids": duplicates,
        "renderable_mesh_bounds": bounds,
        "objects": sorted(objects, key=lambda item: (item["component_id"] or "", item["name"])),
    }


def main():
    argv = bpy.app.argv[bpy.app.argv.index("--") + 1:] if "--" in bpy.app.argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("/tmp/sbs-inspection.txt"))
    parser.add_argument("--json-output", type=Path, default=Path("/tmp/sbs-inspection.json"))
    args = parser.parse_args(argv)
    report = build_report()
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = [
        "SCREW BY SCREW — BLENDER SCENE INSPECTION",
        f"Scene: {report['scene']}",
        f"Model ID: {report['model_id']}",
        f"Geometry status: {report['geometry_status']}",
        f"Objects: {report['object_count']} | Meshes: {report['mesh_count']} | Assemblies: {report['assembly_count']}",
        f"Objects with IDs: {report['objects_with_component_ids']}",
        f"Missing IDs: {report['objects_missing_component_ids']}",
        f"Duplicate IDs: {report['duplicate_component_ids']}",
        f"Renderable mesh bounds: {report['renderable_mesh_bounds']}",
        "",
        "COMPONENT INVENTORY",
        "ID | TYPE | PARENT | WORLD LOCATION mm | DIMENSIONS mm | EVIDENCE | NAME",
    ]
    for item in report["objects"]:
        lines.append(
            f"{item['component_id'] or 'MISSING'} | {item['type']} | "
            f"{item['parent_component_id'] or '-'} | {item['location_mm']} | "
            f"{item['dimensions_mm']} | {item['evidence_status']} | {item['name']}"
        )
    lines.extend(["", f"JSON report: {args.json_output}"])
    args.output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote text inspection: {args.output}")
    print(f"Wrote JSON inspection: {args.json_output}")
    print(f"Objects: {report['object_count']}; missing IDs: {len(missing := report['objects_missing_component_ids'])}; duplicates: {len(report['duplicate_component_ids'])}")


if __name__ == "__main__":
    main()
