#!/usr/bin/env python3
"""Build a self-contained GLB from semantic component visual_proxy metadata.

Supported illustrative primitives: box, cylinder, fan and fin_stack.
Stable component IDs and assembly hierarchy are preserved in glTF node extras.
All generated geometry remains an educational proxy, never measured CAD.
"""
from __future__ import annotations

import argparse
import json
import math
import struct
from pathlib import Path

MATERIALS = [
    ("Painted chassis steel proxy", (0.42, 0.45, 0.49, 1.0), 0.72, 0.42),
    ("Dark polymer proxy", (0.08, 0.10, 0.13, 1.0), 0.08, 0.64),
    ("PCB substrate proxy", (0.055, 0.22, 0.13, 1.0), 0.10, 0.76),
    ("Connector and heatsink proxy", (0.52, 0.55, 0.58, 1.0), 0.62, 0.38),
    ("Zinc fastener proxy", (0.70, 0.72, 0.74, 1.0), 0.84, 0.28),
]

FACES = [
    ((1, 0, 0), ((.5, -.5, -.5), (.5, .5, -.5), (.5, .5, .5), (.5, -.5, .5))),
    ((-1, 0, 0), ((-.5, -.5, .5), (-.5, .5, .5), (-.5, .5, -.5), (-.5, -.5, -.5))),
    ((0, 1, 0), ((-.5, .5, -.5), (-.5, .5, .5), (.5, .5, .5), (.5, .5, -.5))),
    ((0, -1, 0), ((-.5, -.5, .5), (-.5, -.5, -.5), (.5, -.5, -.5), (.5, -.5, .5))),
    ((0, 0, 1), ((.5, -.5, .5), (.5, .5, .5), (-.5, .5, .5), (-.5, -.5, .5))),
    ((0, 0, -1), ((-.5, -.5, -.5), (-.5, .5, -.5), (.5, .5, -.5), (.5, -.5, -.5))),
]

AXIS_ROTATIONS = {
    "x": ([0.0, 0.0, math.sqrt(0.5), math.sqrt(0.5)], (1, 0, 2)),
    "y": (None, (0, 1, 2)),
    "z": ([math.sqrt(0.5), 0.0, 0.0, math.sqrt(0.5)], (0, 2, 1)),
}


def align4(value: int) -> int:
    return (value + 3) & ~3


def _rotate_y(vector: tuple[float, float, float], angle: float) -> tuple[float, float, float]:
    x, y, z = vector
    cosine, sine = math.cos(angle), math.sin(angle)
    return (x * cosine + z * sine, y, -x * sine + z * cosine)


def _append_box(
    positions: list[float],
    normals: list[float],
    indices: list[int],
    *,
    center: tuple[float, float, float] = (0.0, 0.0, 0.0),
    size: tuple[float, float, float] = (1.0, 1.0, 1.0),
    rotation_y: float = 0.0,
) -> None:
    """Append a closed cuboid in normalized local coordinates."""
    base = len(positions) // 3
    for normal, vertices in FACES:
        for vertex in vertices:
            scaled = (vertex[0] * size[0], vertex[1] * size[1], vertex[2] * size[2])
            rotated = _rotate_y(scaled, rotation_y)
            positions.extend((rotated[0] + center[0], rotated[1] + center[1], rotated[2] + center[2]))
            normals.extend(_rotate_y(normal, rotation_y))
        indices.extend((base, base + 1, base + 2, base, base + 2, base + 3))
        base += 4


def _append_cylinder(
    positions: list[float],
    normals: list[float],
    indices: list[int],
    *,
    radius: float = 0.5,
    depth: float = 1.0,
    segments: int = 32,
) -> None:
    """Append a cylinder whose axis is local Y."""
    if not (math.isfinite(radius) and radius > 0 and math.isfinite(depth) and depth > 0):
        raise ValueError("cylinder radius and depth must be positive finite numbers")
    if isinstance(segments, bool) or not isinstance(segments, int) or not 8 <= segments <= 96:
        raise ValueError("cylinder segments must be an integer from 8 to 96")

    half_depth = depth / 2
    for segment in range(segments):
        a0 = 2 * math.pi * segment / segments
        a1 = 2 * math.pi * (segment + 1) / segments
        x0, z0 = radius * math.cos(a0), radius * math.sin(a0)
        x1, z1 = radius * math.cos(a1), radius * math.sin(a1)
        base = len(positions) // 3
        positions.extend((
            x0, -half_depth, z0,
            x1, -half_depth, z1,
            x1, half_depth, z1,
            x0, half_depth, z0,
        ))
        normals.extend((
            math.cos(a0), 0.0, math.sin(a0),
            math.cos(a1), 0.0, math.sin(a1),
            math.cos(a1), 0.0, math.sin(a1),
            math.cos(a0), 0.0, math.sin(a0),
        ))
        indices.extend((base, base + 2, base + 1, base, base + 3, base + 2))

        base = len(positions) // 3
        positions.extend((0.0, half_depth, 0.0, x0, half_depth, z0, x1, half_depth, z1))
        normals.extend((0.0, 1.0, 0.0) * 3)
        indices.extend((base, base + 1, base + 2))
        base = len(positions) // 3
        positions.extend((0.0, -half_depth, 0.0, x1, -half_depth, z1, x0, -half_depth, z0))
        normals.extend((0.0, -1.0, 0.0) * 3)
        indices.extend((base, base + 1, base + 2))


def _build_proxy_geometry(proxy: dict) -> tuple[list[float], list[float], list[int]]:
    kind = proxy.get("kind")
    positions: list[float] = []
    normals: list[float] = []
    indices: list[int] = []

    if kind == "box":
        _append_box(positions, normals, indices)

    elif kind == "cylinder":
        _append_cylinder(positions, normals, indices, segments=proxy.get("segments", 32))

    elif kind == "fan":
        blade_count = proxy.get("blade_count", 7)
        if isinstance(blade_count, bool) or not isinstance(blade_count, int) or not 3 <= blade_count <= 24:
            raise ValueError("fan blade_count must be an integer from 3 to 24")

        # Segmented perimeter frame, generic swept blades and a central hub.
        # Blade count is a rendering choice, not a sourced hardware specification.
        for segment in range(28):
            angle = 2 * math.pi * segment / 28
            center = (0.43 * math.cos(angle), 0.0, 0.43 * math.sin(angle))
            _append_box(
                positions, normals, indices,
                center=center, size=(0.10, 0.12, 0.055), rotation_y=-angle,
            )
        for blade in range(blade_count):
            angle = 2 * math.pi * blade / blade_count
            center = (0.25 * math.cos(angle), 0.0, 0.25 * math.sin(angle))
            _append_box(
                positions, normals, indices,
                center=center, size=(0.28, 0.045, 0.07), rotation_y=-angle - 0.34,
            )
        _append_cylinder(positions, normals, indices, radius=0.14, depth=0.14, segments=32)

    elif kind == "fin_stack":
        fin_count = proxy.get("fin_count", 14)
        if isinstance(fin_count, bool) or not isinstance(fin_count, int) or not 4 <= fin_count <= 40:
            raise ValueError("fin_stack fin_count must be an integer from 4 to 40")
        for fin in range(fin_count):
            y = -0.43 + (0.86 * fin / max(1, fin_count - 1))
            _append_box(
                positions, normals, indices,
                center=(0.0, y, 0.0), size=(0.92, 0.035, 0.94),
            )
        _append_box(
            positions, normals, indices,
            center=(0.0, -0.465, 0.0), size=(0.96, 0.045, 0.96),
        )

    else:
        raise ValueError(f"unsupported proxy geometry kind: {kind!r}")

    return positions, normals, indices


def _validate_proxy(component: dict, proxy: dict):
    component_id = component["id"]
    material = proxy.get("material", 0)
    if isinstance(material, bool) or not isinstance(material, int) or not 0 <= material < len(MATERIALS):
        raise ValueError(f"invalid proxy material for {component_id}")

    translation, scale = proxy.get("translation"), proxy.get("scale")
    for field, value in (("translation", translation), ("scale", scale)):
        if not (
            isinstance(value, list) and len(value) == 3
            and all(isinstance(number, (int, float)) and not isinstance(number, bool) and math.isfinite(number) for number in value)
        ):
            raise ValueError(f"invalid proxy {field} for {component_id}")
    if any(value <= 0 for value in scale):
        raise ValueError(f"proxy scale must be positive for {component_id}")

    kind = proxy.get("kind")
    transformed_scale = list(scale)
    rotation = None
    if kind in {"cylinder", "fan"}:
        axis = proxy.get("axis", "y")
        if axis not in AXIS_ROTATIONS:
            raise ValueError(f"invalid proxy axis for {component_id}: {axis!r}")
        rotation, order = AXIS_ROTATIONS[axis]
        transformed_scale = [scale[index] for index in order]

    positions, normals, indices = _build_proxy_geometry(proxy)
    if not positions or not indices or len(positions) % 3 or len(normals) != len(positions):
        raise ValueError(f"proxy generator produced invalid geometry for {component_id}")
    return material, transformed_scale, positions, normals, indices, rotation


def build_glb(document: dict) -> bytes:
    components = document.get("components")
    if not isinstance(components, list) or not components:
        raise ValueError("components.json must contain a non-empty components array")

    ids: dict[str, int] = {}
    for index, component in enumerate(components):
        component_id = component.get("id")
        if not isinstance(component_id, str) or not component_id:
            raise ValueError(f"component {index} has no stable ID")
        if component_id in ids:
            raise ValueError(f"duplicate component ID: {component_id}")
        ids[component_id] = index

    children: list[list[int]] = [[] for _ in components]
    roots = []
    for index, component in enumerate(components):
        parent_id = component.get("parent_id")
        if parent_id is None:
            roots.append(index)
        elif parent_id not in ids:
            raise ValueError(f"unknown parent {parent_id!r} for {component['id']}")
        else:
            children[ids[parent_id]].append(index)
    if len(roots) != 1:
        raise ValueError(f"expected one system root, found {len(roots)}")

    nodes, meshes, accessors, buffer_views = [], [], [], []
    geometry_counts: dict[str, int] = {}
    binary = bytearray()

    def add_buffer_view(raw: bytes, target: int) -> int:
        while len(binary) % 4:
            binary.append(0)
        offset = len(binary)
        binary.extend(raw)
        buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(raw), "target": target})
        return len(buffer_views) - 1

    for index, component in enumerate(components):
        node = {
            "name": component["id"],
            "extras": {
                "sbs_component_id": component["id"],
                "evidence_status": component.get("evidence_status", "unknown"),
                "geometry_status": component.get("geometry_status", "unknown"),
            },
        }
        proxy = component.get("visual_proxy")
        if proxy:
            if not isinstance(proxy, dict):
                raise ValueError(f"visual_proxy must be an object for {component['id']}")
            material, node_scale, positions, normals, indices, rotation = _validate_proxy(component, proxy)
            kind = proxy["kind"]
            geometry_counts[kind] = geometry_counts.get(kind, 0) + 1
            if max(indices) > 65535:
                raise ValueError(f"proxy geometry has too many vertices for 16-bit indices: {component['id']}")

            position_bytes = struct.pack("<" + "f" * len(positions), *positions)
            normal_bytes = struct.pack("<" + "f" * len(normals), *normals)
            index_bytes = struct.pack("<" + "H" * len(indices), *indices)
            position_view = add_buffer_view(position_bytes, 34962)
            normal_view = add_buffer_view(normal_bytes, 34962)
            index_view = add_buffer_view(index_bytes, 34963)

            vectors = list(zip(positions[0::3], positions[1::3], positions[2::3]))
            position_accessor = len(accessors)
            accessors.append({
                "bufferView": position_view, "componentType": 5126,
                "count": len(positions) // 3, "type": "VEC3",
                "min": [min(vector[axis] for vector in vectors) for axis in range(3)],
                "max": [max(vector[axis] for vector in vectors) for axis in range(3)],
            })
            normal_accessor = len(accessors)
            accessors.append({"bufferView": normal_view, "componentType": 5126, "count": len(normals) // 3, "type": "VEC3"})
            index_accessor = len(accessors)
            accessors.append({
                "bufferView": index_view, "componentType": 5123,
                "count": len(indices), "type": "SCALAR",
                "min": [min(indices)], "max": [max(indices)],
            })

            mesh_index = len(meshes)
            meshes.append({
                "name": f"{kind} proxy · {component['id']}",
                "primitives": [{
                    "attributes": {"POSITION": position_accessor, "NORMAL": normal_accessor},
                    "indices": index_accessor, "material": material, "mode": 4,
                }],
            })
            node.update({"mesh": mesh_index, "translation": proxy["translation"], "scale": node_scale})
            if rotation:
                node["rotation"] = rotation

        if children[index]:
            node["children"] = children[index]
        nodes.append(node)

    gltf = {
        "asset": {"version": "2.0", "generator": "Screw by Screw · procedural illustrative proxy generator v0.4"},
        "scene": 0,
        "scenes": [{"name": document.get("device_model_id", "Device reference"), "nodes": roots}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": [{
            "name": name,
            "pbrMetallicRoughness": {
                "baseColorFactor": list(color), "metallicFactor": metallic, "roughnessFactor": roughness,
            },
        } for name, color, metallic, roughness in MATERIALS],
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(binary)}],
    }

    json_bytes = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    json_chunk = json_bytes + b" " * (align4(len(json_bytes)) - len(json_bytes))
    binary_chunk = bytes(binary) + b"\0" * (align4(len(binary)) - len(binary))
    total_length = 12 + 8 + len(json_chunk) + 8 + len(binary_chunk)
    return (
        struct.pack("<4sII", b"glTF", 2, total_length)
        + struct.pack("<II", len(json_chunk), 0x4E4F534A) + json_chunk
        + struct.pack("<II", len(binary_chunk), 0x004E4942) + binary_chunk
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--components", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    document = json.loads(args.components.read_text(encoding="utf-8"))
    result = build_glb(document)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(result)
    counts: dict[str, int] = {}
    for component in document["components"]:
        proxy = component.get("visual_proxy")
        if proxy:
            counts[proxy["kind"]] = counts.get(proxy["kind"], 0) + 1
    print(json.dumps({
        "output": str(args.output), "bytes": len(result),
        "components": len(document["components"]),
        "geometry_nodes": sum(counts.values()), "geometry_primitives": counts,
        "identity_metadata": "glTF node extras · sbs_component_id",
        "accuracy": "illustrative proxy · not CAD",
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
