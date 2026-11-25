from __future__ import annotations

import json
import struct
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "modeling"))

import validate_blockout_package as validator


def make_glb(gltf: dict, *, magic: bytes = b"glTF") -> bytes:
    payload = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    payload += b" " * ((4 - len(payload) % 4) % 4)
    total = 12 + 8 + len(payload)
    return struct.pack("<4sII", magic, 2, total) + struct.pack(
        "<II", len(payload), 0x4E4F534A
    ) + payload


def sample_manifest() -> dict:
    return {
        "model_id": validator.EXPECTED_MODEL_ID,
        "part_number": validator.EXPECTED_PART_NUMBER,
        "geometry_status": "illustrative_proxy_not_cad",
        "objects": [
            {"component_id": "assembly.card.root", "export_role": "assembly"},
            {"component_id": "mesh.pcb", "export_role": "component"},
            {"component_id": "guide.envelope", "export_role": "reference_only"},
        ],
    }


def sample_gltf() -> dict:
    return {
        "asset": {"version": "2.0", "generator": "unit-test"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [
            {"name": "Card root", "extras": {"sbs_component_id": "assembly.card.root"}, "children": [1]},
            {"name": "PCB", "extras": {"sbs_component_id": "mesh.pcb"}},
        ],
        "meshes": [{"primitives": []}],
    }


class BlockoutValidatorTests(unittest.TestCase):
    def test_valid_manifest_and_gltf_pass(self):
        checks = validator.validate(sample_manifest(), sample_gltf())
        self.assertEqual(len(checks), 6)

    def test_duplicate_manifest_ids_fail(self):
        manifest = sample_manifest()
        manifest["objects"].append({"component_id": "mesh.pcb", "export_role": "component"})
        with self.assertRaisesRegex(validator.ValidationError, "Duplicate manifest"):
            validator.validate(manifest, sample_gltf())

    def test_missing_exported_id_fails(self):
        gltf = sample_gltf()
        gltf["nodes"][1]["extras"] = {}
        with self.assertRaisesRegex(validator.ValidationError, "missing sbs_component_id"):
            validator.validate(sample_manifest(), gltf)

    def test_reference_only_node_leak_fails(self):
        gltf = sample_gltf()
        gltf["nodes"].append({
            "name": "Envelope",
            "extras": {"sbs_component_id": "guide.envelope"},
        })
        with self.assertRaisesRegex(validator.ValidationError, "Reference-only"):
            validator.validate(sample_manifest(), gltf)

    def test_invalid_child_index_fails(self):
        gltf = sample_gltf()
        gltf["nodes"][0]["children"] = [99]
        with self.assertRaisesRegex(validator.ValidationError, "invalid child"):
            validator.validate(sample_manifest(), gltf)

    def test_glb_header_and_json_chunk_parse(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "sample.glb"
            path.write_bytes(make_glb(sample_gltf()))
            parsed = validator.read_glb(path)
            self.assertEqual(parsed["asset"]["version"], "2.0")

    def test_bad_glb_magic_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "bad.glb"
            path.write_bytes(make_glb(sample_gltf(), magic=b"NOPE"))
            with self.assertRaisesRegex(validator.ValidationError, "Bad GLB magic"):
                validator.read_glb(path)


if __name__ == "__main__":
    unittest.main()
