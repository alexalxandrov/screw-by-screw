#!/usr/bin/env python3
"""Check that every canonical content component exists in a GLB with the expected ancestry."""
from __future__ import annotations
import argparse
import json
import struct
import sys
from pathlib import Path


class BindingError(ValueError):
    pass


def read_glb(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 20:
        raise BindingError("GLB is too short")
    magic, version, declared_length = struct.unpack_from("<III", data, 0)
    if magic != 0x46546C67 or version != 2 or declared_length != len(data):
        raise BindingError("Invalid GLB 2.0 header or declared length")
    offset = 12
    document = None
    json_count = 0
    while offset < len(data):
        if offset + 8 > len(data):
            raise BindingError("Truncated GLB chunk header")
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        start = offset + 8
        end = start + chunk_length
        if end > len(data) or chunk_length % 4:
            raise BindingError("Invalid GLB chunk length or alignment")
        if chunk_type == 0x4E4F534A:
            json_count += 1
            if json_count != 1 or offset != 12:
                raise BindingError("Invalid JSON chunk order/count")
            try:
                document = json.loads(data[start:end].decode("utf-8").rstrip(" \t\r\n\0"))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise BindingError(f"Invalid GLB JSON: {exc}") from exc
        offset = end
    if offset != len(data) or json_count != 1 or not isinstance(document, dict):
        raise BindingError("Incomplete GLB JSON document")
    return document


def validate_bindings(components_doc: dict, gltf: dict) -> list[str]:
    components = components_doc.get("components")
    nodes = gltf.get("nodes")
    if not isinstance(components, list) or not isinstance(nodes, list):
        raise BindingError("components.json and GLB must contain arrays")

    component_map = {}
    for component in components:
        if not isinstance(component, dict) or not isinstance(component.get("id"), str):
            raise BindingError("Invalid component record")
        if component["id"] in component_map:
            raise BindingError(f"Duplicate content component ID: {component['id']}")
        component_map[component["id"]] = component

    # Validate semantic hierarchy separately from renderable geometry.
    # Logical-only entries are real content nodes and do not require a GLB node.
    for component_id, component in component_map.items():
        parent_id = component.get("parent_id")
        if parent_id is not None and parent_id not in component_map:
            raise BindingError(f"Component {component_id} references unknown content parent {parent_id}")
        visited = set()
        cursor = component_id
        while cursor is not None:
            if cursor in visited:
                raise BindingError(f"Cycle detected in content component ancestry at {cursor}")
            visited.add(cursor)
            cursor = component_map[cursor].get("parent_id")

    node_map = {}
    parent_indices = {}
    for index, node in enumerate(nodes):
        extras = node.get("extras") or {}
        component_id = extras.get("sbs_component_id") if isinstance(extras, dict) else None
        if not isinstance(component_id, str):
            continue
        if component_id not in component_map:
            raise BindingError(f"GLB references unknown content component ID: {component_id}")
        if component_id in node_map:
            raise BindingError(f"Duplicate GLB component ID: {component_id}")
        node_map[component_id] = index
        for child in node.get("children", []):
            if not isinstance(child, int) or child < 0 or child >= len(nodes):
                raise BindingError(f"Node {index} has invalid child index")
            if child in parent_indices:
                raise BindingError(f"GLB node {child} has multiple parents")
            parent_indices[child] = index

    required_geometry_ids = {
        component_id for component_id, component in component_map.items()
        if component.get("geometry_status") != "logical_only"
    }
    missing = sorted(required_geometry_ids - set(node_map))
    if missing:
        raise BindingError(f"Geometry-backed content components missing from GLB: {missing}")

    node_ids = {index: component_id for component_id, index in node_map.items()}
    for component_id, index in node_map.items():
        # Logical-only parents may have no glTF node. Validate against the
        # nearest semantic ancestor that is actually represented in the GLB.
        expected_parent = component_map[component_id].get("parent_id")
        while expected_parent is not None and expected_parent not in node_map:
            expected_parent = component_map[expected_parent].get("parent_id")
        if expected_parent is None:
            continue

        ancestor = parent_indices.get(index)
        ancestors = set()
        found = False
        while ancestor is not None:
            if ancestor in ancestors:
                raise BindingError("Cycle detected in GLB node ancestry")
            ancestors.add(ancestor)
            if node_ids.get(ancestor) == expected_parent:
                found = True
                break
            ancestor = parent_indices.get(ancestor)
        if not found:
            raise BindingError(
                f"Component {component_id} is not nested under expected represented parent {expected_parent}"
            )

    geometry_count = len(required_geometry_ids)
    return [
        f"Canonical semantic components: {len(component_map)}",
        f"Components requiring geometry binding: {geometry_count}",
        f"GLB nodes with stable component IDs: {len(node_map)}",
        "Every geometry-backed content component ID is present exactly once: PASS",
        "GLB ancestry preserves the nearest represented semantic ancestor: PASS",
    ]

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--components", type=Path, required=True)
    parser.add_argument("--glb", type=Path, required=True)
    args = parser.parse_args()
    try:
        components = json.loads(args.components.read_text(encoding="utf-8"))
        report = validate_bindings(components, read_glb(args.glb))
    except (OSError, json.JSONDecodeError, BindingError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print("SCREW BY SCREW GLB CONTENT BINDING VALIDATION")
    for line in report:
        print(line)
    print("RESULT: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
