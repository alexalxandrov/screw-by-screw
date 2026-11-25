import json
import struct
import tempfile
import unittest
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "content"))
import validate_glb_bindings as validator


def make_glb(document):
    payload = json.dumps(document, separators=(",", ":")).encode("utf-8")
    padded = payload + b" " * ((4 - len(payload) % 4) % 4)
    total = 12 + 8 + len(padded)
    return struct.pack("<III", 0x46546C67, 2, total) + struct.pack("<II", len(padded), 0x4E4F534A) + padded


def sample_components():
    return {"components": [
        {"id": "root", "parent_id": None},
        {"id": "cooling", "parent_id": "root"},
        {"id": "heatsink", "parent_id": "cooling"}
    ]}


def sample_gltf():
    return {"nodes": [
        {"name": "root", "extras": {"sbs_component_id": "root"}, "children": [1]},
        {"name": "cooling", "extras": {"sbs_component_id": "cooling"}, "children": [2]},
        {"name": "heatsink", "extras": {"sbs_component_id": "heatsink"}}
    ]}


class GlbBindingTests(unittest.TestCase):
    def test_valid_component_bindings_pass(self):
        report = validator.validate_bindings(sample_components(), sample_gltf())
        self.assertIn("Every content component ID is present exactly once: PASS", report)

    def test_missing_content_component_fails(self):
        gltf = sample_gltf()
        gltf["nodes"].pop()
        gltf["nodes"][1].pop("children")
        with self.assertRaisesRegex(validator.BindingError, "missing from GLB"):
            validator.validate_bindings(sample_components(), gltf)

    def test_parent_mismatch_fails(self):
        gltf = sample_gltf()
        gltf["nodes"][1]["children"] = []
        with self.assertRaisesRegex(validator.BindingError, "not nested under expected parent"):
            validator.validate_bindings(sample_components(), gltf)

    def test_duplicate_glb_ids_fail(self):
        gltf = sample_gltf()
        gltf["nodes"].append({"extras": {"sbs_component_id": "root"}})
        with self.assertRaisesRegex(validator.BindingError, "Duplicate GLB component ID"):
            validator.validate_bindings(sample_components(), gltf)

    def test_glb_reader_parses_json_chunk(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "sample.glb"
            path.write_bytes(make_glb(sample_gltf()))
            self.assertEqual(validator.read_glb(path)["nodes"][2]["name"], "heatsink")


if __name__ == "__main__":
    unittest.main()
