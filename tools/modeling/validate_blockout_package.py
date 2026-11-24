#!/usr/bin/env python3
"""Validate a Screw by Screw Blender blockout manifest and GLB export.

Uses only the Python standard library. It validates package structure and stable
component identity; it cannot determine whether proxy geometry matches a real
device. Run:
  python tools/modeling/validate_blockout_package.py --manifest PATH --glb PATH
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path

EXPECTED_MODEL_ID = "gpu.evga.12g-p5-3655-kr"
EXPECTED_PART_NUMBER = "12G-P5-3655-KR"
GLB_MAGIC = b"glTF"
GLB_VERSION = 2
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


class ValidationError(Exception):
    pass


def read_glb(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValidationError("GLB is shorter than its 12-byte header plus JSON chunk header")
    magic, version, declared_length = struct.unpack_from("<4sII", data, 0)
    if magic != GLB_MAGIC:
        raise ValidationError(f"Bad GLB magic: {magic!r}")
    if version != GLB_VERSION:
        raise ValidationError(f"Unsupported GLB version: {version}")
    if declared_length != len(data):
        raise ValidationError(
            f"Declared GLB length {declared_length} != actual length {len(data)}"
        )

    offset = 12
    chunks = []
    while offset < len(data):
        if offset + 8 > len(data):
            raise ValidationError("Truncated GLB chunk header")
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        end = offset + chunk_length
        if end > len(data):
            raise ValidationError("GLB chunk extends beyond file length")
        chunks.append((chunk_type, data[offset:end]))
        offset = end

    if not chunks or chunks[0][0] != JSON_CHUNK:
        raise ValidationError("First GLB chunk is not JSON")
    try:
        gltf = json.loads(chunks[0][1].decode("utf-8").rstrip(" \\t\\r\\n\\0"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValidationError(f"Invalid embedded glTF JSON: {exc}") from exc
    if any(kind == JSON_CHUNK for kind, _ in chunks[1:]):
        raise ValidationError("Unexpected additional JSON chunk")
    if len([1 for kind, _ in chunks if kind == BIN_CHUNK]) > 1:
        raise ValidationError("More than one BIN chunk found")
    return gltf


def component_id(node: dict) -> str | None:
    extras = node.get("extras") or {}
    value = extras.get("sbs_component_id")
    return value if isinstance(value, str) and value else None


def validate(manifest: dict, gltf: dict) -> list[str]:
    checks: list[str] = []

    if manifest.get("model_id") != EXPECTED_MODEL_ID:
        raise ValidationError(f"Unexpected model_id: {manifest.get('model_id')!r}")
    if manifest.get("part_number") != EXPECTED_PART_NUMBER:
        raise ValidationError(f"Unexpected part number: {manifest.get('part_number')!r}")
    checks.append("Exact SKU identity: PASS")

    objects = manifest.get("objects")
    if not isinstance(objects, list) or not objects:
        raise ValidationError("Manifest objects must be a non-empty array")
    ids = [o.get("component_id") for o in objects]
    if any(not isinstance(value, str) or not value for value in ids):
        raise ValidationError("Manifest contains an object without component_id")
    if len(ids) != len(set(ids)):
        duplicates = sorted({value for value in ids if ids.count(value) > 1})
        raise ValidationError(f"Duplicate manifest component IDs: {duplicates}")
    checks.append(f"Manifest IDs unique: PASS ({len(ids)} objects)")

    export_ids = {
        o["component_id"] for o in objects
        if o.get("export_role") != "reference_only"
    }
    reference_ids = {
        o["component_id"] for o in objects
        if o.get("export_role") == "reference_only"
    }

    nodes = gltf.get("nodes")
    if not isinstance(nodes, list):
        raise ValidationError("glTF nodes array is missing")
    node_ids = [component_id(node) for node in nodes]
    if any(value is None for value in node_ids):
        missing_names = [
            node.get("name", f"node[{i}]")
            for i, (node, value) in enumerate(zip(nodes, node_ids))
            if value is None
        ]
        raise ValidationError(f"Exported nodes missing sbs_component_id extras: {missing_names}")
    if len(node_ids) != len(set(node_ids)):
        raise ValidationError("Duplicate component IDs in GLB nodes")
    actual_ids = set(node_ids)
    missing = sorted(export_ids - actual_ids)
    unexpected = sorted(actual_ids - export_ids)
    if missing or unexpected:
        raise ValidationError(
            f"GLB/manifest ID mismatch; missing={missing}, unexpected={unexpected}"
        )
    if actual_ids & reference_ids:
        raise ValidationError(
            f"Reference-only objects leaked into GLB: {sorted(actual_ids & reference_ids)}"
        )
    checks.append(f"GLB component IDs match manifest: PASS ({len(actual_ids)} nodes)")

    scene_index = gltf.get("scene", 0)
    scenes = gltf.get("scenes") or []
    if not scenes or not isinstance(scene_index, int) or scene_index >= len(scenes):
        raise ValidationError("glTF default scene is missing or invalid")
    node_count = len(nodes)
    for parent_index, node in enumerate(nodes):
        children = node.get("children", [])
        if not isinstance(children, list):
            raise ValidationError(f"Node {parent_index} children must be an array")
        if len(children) != len(set(children)):
            raise ValidationError(f"Node {parent_index} has duplicate child indices")
        for child in children:
            if not isinstance(child, int) or child < 0 or child >= node_count:
                raise ValidationError(f"Node {parent_index} has invalid child index {child!r}")
    checks.append("GLB node hierarchy indices: PASS")

    asset = gltf.get("asset") or {}
    if asset.get("version") != "2.0":
        raise ValidationError(f"Expected glTF asset version 2.0, got {asset.get('version')!r}")
    checks.append("glTF 2.0 asset metadata: PASS")

    if manifest.get("geometry_status") != "illustrative_proxy_not_cad":
        raise ValidationError("Manifest geometry_status must explicitly identify proxy geometry")
    checks.append("Non-CAD accuracy label: PASS")
    return checks


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--glb", required=True, type=Path)
    args = parser.parse_args()

    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
        gltf = read_glb(args.glb)
        checks = validate(manifest, gltf)
    except (OSError, json.JSONDecodeError, ValidationError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1

    print("SCREW BY SCREW BLOCKOUT PACKAGE VALIDATION")
    print(f"Manifest: {args.manifest}")
    print(f"GLB:      {args.glb}")
    print(f"Nodes:    {len(gltf.get('nodes', []))}")
    print(f"Meshes:   {len(gltf.get('meshes', []))}")
    for check in checks:
        print(check)
    print("RESULT: PASS")
    print("Scope: structural validation only; no visual/product-fidelity claim.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
