#!/usr/bin/env python3
"""Generate a self-contained GLB blockout from component visual_proxy metadata.

This intentionally produces reusable box proxies, not CAD. Component identity
and hierarchy are preserved in glTF node extras for the Screw by Screw viewer.
"""
from __future__ import annotations

import argparse
import json
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


def align4(value: int) -> int:
    return (value + 3) & ~3


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

    nodes = []
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
            if proxy.get("kind") != "box":
                raise ValueError(f"unsupported proxy geometry for {component['id']}")
            material = proxy.get("material", 0)
            translation, scale = proxy.get("translation"), proxy.get("scale")
            if isinstance(material, bool) or not isinstance(material, int) or not 0 <= material < len(MATERIALS):
                raise ValueError(f"invalid proxy material for {component['id']}")
            if not (isinstance(translation, list) and len(translation) == 3 and
                    all(isinstance(v, (int, float)) for v in translation)):
                raise ValueError(f"invalid proxy translation for {component['id']}")
            if not (isinstance(scale, list) and len(scale) == 3 and
                    all(isinstance(v, (int, float)) and v > 0 for v in scale)):
                raise ValueError(f"invalid proxy scale for {component['id']}")
            node.update({"mesh": material, "translation": translation, "scale": scale})
        if children[index]:
            node["children"] = children[index]
        nodes.append(node)

    positions, normals, indices = [], [], []
    for normal, vertices in FACES:
        start = len(positions) // 3
        for vertex in vertices:
            positions.extend(vertex)
            normals.extend(normal)
        indices.extend((start, start + 1, start + 2, start, start + 2, start + 3))

    position_bytes = struct.pack("<" + "f" * len(positions), *positions)
    normal_bytes = struct.pack("<" + "f" * len(normals), *normals)
    index_bytes = struct.pack("<" + "H" * len(indices), *indices)
    index_offset = len(position_bytes) + len(normal_bytes)
    binary = position_bytes + normal_bytes + index_bytes
    binary += b"\0" * (align4(len(binary)) - len(binary))

    gltf = {
        "asset": {"version": "2.0", "generator": "Screw by Screw · generic device blockout generator"},
        "scene": 0,
        "scenes": [{"name": document.get("device_model_id", "Device reference"), "nodes": roots}],
        "nodes": nodes,
        "meshes": [
            {"name": f"Proxy cube · {material[0]}", "primitives": [{
                "attributes": {"POSITION": 0, "NORMAL": 1},
                "indices": 2, "material": index, "mode": 4
            }]} for index, material in enumerate(MATERIALS)
        ],
        "materials": [{
            "name": name,
            "pbrMetallicRoughness": {
                "baseColorFactor": list(color),
                "metallicFactor": metallic,
                "roughnessFactor": roughness
            }
        } for name, color, metallic, roughness in MATERIALS],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": 24, "type": "VEC3",
             "min": [-0.5, -0.5, -0.5], "max": [0.5, 0.5, 0.5]},
            {"bufferView": 1, "componentType": 5126, "count": 24, "type": "VEC3"},
            {"bufferView": 2, "componentType": 5123, "count": 36, "type": "SCALAR",
             "min": [0], "max": [23]},
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": len(position_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": len(position_bytes), "byteLength": len(normal_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": index_offset, "byteLength": len(index_bytes), "target": 34963},
        ],
        "buffers": [{"byteLength": len(binary)}],
    }
    json_bytes = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    json_chunk = json_bytes + b" " * (align4(len(json_bytes)) - len(json_bytes))
    total_length = 12 + 8 + len(json_chunk) + 8 + len(binary)
    return (
        struct.pack("<4sII", b"glTF", 2, total_length)
        + struct.pack("<II", len(json_chunk), 0x4E4F534A) + json_chunk
        + struct.pack("<II", len(binary), 0x004E4942) + binary
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
    print(json.dumps({
        "output": str(args.output),
        "bytes": len(result),
        "components": len(document["components"]),
        "geometry_proxies": sum(bool(item.get("visual_proxy")) for item in document["components"]),
        "identity_metadata": "glTF node extras · sbs_component_id",
        "accuracy": "illustrative proxy · not CAD",
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
