#!/usr/bin/env python3
"""Validate a Screw by Screw Blender blockout manifest and GLB export.

Uses only the Python standard library. This checks package structure and stable
component identity, not geometric fidelity to a physical device.
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
    """Raised when a model package violates a structural invariant."""


def read_glb(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValidationError("GLB is shorter than its header and first chunk header")
    magic, version, declared_length = struct.unpack_from("<4sII", data, 0)
    if magic != GLB_MAGIC:
        raise ValidationError(f"Bad GLB magic: {magic!r}")
    if version != GLB_VERSION:
        raise ValidationError(f"Unsupported GLB version: {version}")
    if declared_length != len(data):
        raise ValidationError(
            f"Declared GLB length {declared_length} != actual length {len(data)}"
        )

    chunks: list[tuple[int, bytes]] = []
    offset = 12
    while offset < len(data):
        if offset + 8 > len(data):
            raise ValidationError("Truncated GLB chunk header")
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        if chunk_length % 4:
            raise ValidationError(f"GLB chunk length is not 4-byte aligned: {chunk_length}")
        end = offset + chunk_length
        if end > len(data):
            raise ValidationError("GLB chunk extends beyond file length")
        chunks.append((chunk_type, data[offset:end]))
        offset = end

    if not chunks or chunks[0][0] != JSON_CHUNK:
        raise ValidationError("First GLB chunk is not JSON")
    if sum(kind == JSON_CHUNK for kind, _ in chunks) != 1:
        raise ValidationError("GLB must contain exactly one JSON chunk")
    bin_positions = [i for i, (kind, _) in enumerate(chunks) if kind == BIN_CHUNK]
    if len(bin_positions) > 1:
        raise ValidationError("More than one BIN chunk found")
    if bin_positions and bin_positions[0] != 1:
        raise ValidationError("GLB BIN chunk, when present, must follow the JSON chunk")

    try:
        gltf = json.loads(chunks[0][1].decode("utf-8").rstrip(" \t\r\n\0"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValidationError(f"Invalid embedded glTF JSON: {exc}") from exc
    if not isinstance(gltf, dict):
        raise ValidationError("Embedded glTF root must be a JSON object")
    return gltf


def _require_index(value: object, upper_bound: int, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValidationError(f"{label} must be an integer index")
    if value < 0 or value >= upper_bound:
        raise ValidationError(f"{label} is out of range: {value}")
    return value


def _validate_node_graph(gltf: dict, nodes: list[dict], scenes: list[dict],
                         scene_index: int) -> list[str]:
    node_count = len(nodes)
    parent_of: dict[int, int] = {}
    graph: dict[int, list[int]] = {}

    for parent_index, node in enumerate(nodes):
        children = node.get("children", [])
        if not isinstance(children, list):
            raise ValidationError(f"Node {parent_index} children must be an array")
        checked_children = [
            _require_index(child, node_count, f"Node {parent_index} child")
            for child in children
        ]
        if len(checked_children) != len(set(checked_children)):
            raise ValidationError(f"Node {parent_index} has duplicate child indices")
        graph[parent_index] = checked_children
        for child in checked_children:
            if child in parent_of:
                raise ValidationError(
                    f"Node {child} has multiple parents: {parent_of[child]} and {parent_index}"
                )
            parent_of[child] = parent_index

        if "mesh" in node:
            meshes = gltf.get("meshes", [])
            if not isinstance(meshes, list):
                raise ValidationError("glTF meshes must be an array")
            _require_index(node["mesh"], len(meshes), f"Node {parent_index} mesh")

    scene = scenes[scene_index]
    if not isinstance(scene, dict):
        raise ValidationError(f"Scene {scene_index} must be an object")
    roots = scene.get("nodes", [])
    if not isinstance(roots, list):
        raise ValidationError(f"Scene {scene_index} nodes must be an array")
    checked_roots = [
        _require_index(root, node_count, f"Scene {scene_index} root")
        for root in roots
    ]
    if len(checked_roots) != len(set(checked_roots)):
        raise ValidationError(f"Scene {scene_index} has duplicate root nodes")
    for root in checked_roots:
        if root in parent_of:
            raise ValidationError(f"Scene root node {root} also has a parent")

    # Detect cycles even when a cyclic node is not reachable from the default scene.
    state = [0] * node_count  # 0=unvisited, 1=active, 2=complete

    def visit(index: int) -> None:
        if state[index] == 1:
            raise ValidationError(f"Cycle detected in node hierarchy at node {index}")
        if state[index] == 2:
            return
        state[index] = 1
        for child in graph[index]:
            visit(child)
        state[index] = 2

    for index in range(node_count):
        visit(index)
    return ["GLB node references and hierarchy: PASS"]


def validate(manifest: dict, gltf: dict) -> list[str]:
    if not isinstance(manifest, dict):
        raise ValidationError("Manifest root must be a JSON object")
    if not isinstance(gltf, dict):
        raise ValidationError("glTF root must be a JSON object")
    checks: list[str] = []

    if manifest.get("model_id") != EXPECTED_MODEL_ID:
        raise ValidationError(f"Unexpected model_id: {manifest.get('model_id')!r}")
    if manifest.get("part_number") != EXPECTED_PART_NUMBER:
        raise ValidationError(f"Unexpected part number: {manifest.get('part_number')!r}")
    checks.append("Exact SKU identity: PASS")

    objects = manifest.get("objects")
    if not isinstance(objects, list) or not objects:
        raise ValidationError("Manifest objects must be a non-empty array")
    ids: list[str] = []
    export_ids: set[str] = set()
    reference_ids: set[str] = set()
    for index, obj in enumerate(objects):
        if not isinstance(obj, dict):
            raise ValidationError(f"Manifest object {index} must be an object")
        value = obj.get("component_id")
        if not isinstance(value, str) or not value:
            raise ValidationError(f"Manifest object {index} has no valid component_id")
        ids.append(value)
        if obj.get("export_role") == "reference_only":
            reference_ids.add(value)
        else:
            export_ids.add(value)
    if len(ids) != len(set(ids)):
        duplicates = sorted({value for value in ids if ids.count(value) > 1})
        raise ValidationError(f"Duplicate manifest component IDs: {duplicates}")
    checks.append(f"Manifest IDs unique: PASS ({len(ids)} objects)")

    nodes = gltf.get("nodes")
    if not isinstance(nodes, list) or not all(isinstance(node, dict) for node in nodes):
        raise ValidationError("glTF nodes must be an array of objects")
    node_ids: list[str | None] = []
    for index, node in enumerate(nodes):
        extras = node.get("extras") or {}
        if not isinstance(extras, dict):
            raise ValidationError(f"Node {index} extras must be an object")
        value = extras.get("sbs_component_id")
        node_ids.append(value if isinstance(value, str) and value else None)
    if any(value is None for value in node_ids):
        missing_names = [
            nodes[i].get("name", f"node[{i}]")
            for i, value in enumerate(node_ids) if value is None
        ]
        raise ValidationError(
            f"Exported nodes missing sbs_component_id extras: {missing_names}"
        )
    concrete_ids = [value for value in node_ids if value is not None]
    if len(concrete_ids) != len(set(concrete_ids)):
        raise ValidationError("Duplicate component IDs in GLB nodes")
    actual_ids = set(concrete_ids)
    leaked_references = sorted(actual_ids & reference_ids)
    if leaked_references:
        raise ValidationError(
            f"Reference-only objects leaked into GLB: {leaked_references}"
        )
    missing = sorted(export_ids - actual_ids)
    unexpected = sorted(actual_ids - export_ids)
    if missing or unexpected:
        raise ValidationError(
            f"GLB/manifest ID mismatch; missing={missing}, unexpected={unexpected}"
        )
    checks.append(f"GLB component IDs match manifest: PASS ({len(actual_ids)} nodes)")

    asset = gltf.get("asset")
    if not isinstance(asset, dict) or asset.get("version") != "2.0":
        version = asset.get("version") if isinstance(asset, dict) else None
        raise ValidationError(f"Expected glTF asset version 2.0, got {version!r}")
    checks.append("glTF 2.0 asset metadata: PASS")

    scenes = gltf.get("scenes")
    if not isinstance(scenes, list) or not scenes or not all(
        isinstance(scene, dict) for scene in scenes
    ):
        raise ValidationError("glTF scenes must be a non-empty array of objects")
    scene_index = gltf.get("scene", 0)
    scene_index = _require_index(scene_index, len(scenes), "Default scene")
    checks.extend(_validate_node_graph(gltf, nodes, scenes, scene_index))

    if manifest.get("geometry_status") != "illustrative_proxy_not_cad":
        raise ValidationError(
            "Manifest geometry_status must explicitly identify proxy geometry"
        )
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
