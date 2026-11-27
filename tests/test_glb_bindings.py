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
        self.assertIn("Every geometry-backed content component ID is present exactly once: PASS", report)

    def test_missing_content_component_fails(self):
        gltf = sample_gltf()
        gltf["nodes"].pop()
        gltf["nodes"][1].pop("children")
        with self.assertRaisesRegex(validator.BindingError, "missing from GLB"):
            validator.validate_bindings(sample_components(), gltf)

    def test_parent_mismatch_fails(self):
        gltf = sample_gltf()
        gltf["nodes"][1]["children"] = []
        with self.assertRaisesRegex(validator.BindingError, "not nested under expected represented parent"):
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

    def test_declared_decorative_visual_nodes_are_allowed_but_parent_checked(self):
        components = {"components": [
            {"id": "root", "parent_id": None, "geometry_status": "measured"},
            {"id": "fastener", "parent_id": "root", "geometry_status": "illustrative_proxy"},
        ]}
        gltf = {"nodes": [
            {"name": "root", "extras": {"sbs_component_id": "root"}, "children": [1]},
            {"name": "fastener", "extras": {"sbs_component_id": "fastener"}, "children": [2]},
            {"name": "screw head", "extras": {
                "sbs_component_id": "visual.detail.screw.head",
                "sbs_export_role": "decorative_detail",
                "sbs_visual_proxy": True,
                "sbs_parent_component_id": "fastener",
            }},
        ]}
        report = validator.validate_bindings(components, gltf)
        self.assertIn("Declared decorative visual proxy nodes parent-checked: 1", report)

    def test_unknown_glb_ids_are_not_accepted_without_explicit_visual_proxy_metadata(self):
        components = {"components": [
            {"id": "root", "parent_id": None, "geometry_status": "measured"},
        ]}
        gltf = {"nodes": [
            {"name": "root", "extras": {"sbs_component_id": "root"}, "children": [1]},
            {"name": "unregistered", "extras": {"sbs_component_id": "unregistered"}},
        ]}
        with self.assertRaisesRegex(validator.BindingError, "unknown content component ID"):
            validator.validate_bindings(components, gltf)

    def test_decorative_visual_node_must_be_nested_under_declared_parent(self):
        components = {"components": [
            {"id": "root", "parent_id": None, "geometry_status": "measured"},
            {"id": "fastener", "parent_id": "root", "geometry_status": "illustrative_proxy"},
        ]}
        gltf = {"nodes": [
            {"name": "root", "extras": {"sbs_component_id": "root"}, "children": [1, 2]},
            {"name": "fastener", "extras": {"sbs_component_id": "fastener"}},
            {"name": "orphan screw head", "extras": {
                "sbs_component_id": "visual.detail.orphan",
                "sbs_export_role": "decorative_detail",
                "sbs_visual_proxy": True,
                "sbs_parent_component_id": "fastener",
            }},
        ]}
        with self.assertRaisesRegex(validator.BindingError, "not nested under declared parent"):
            validator.validate_bindings(components, gltf)

    def test_logical_only_components_need_no_glb_node(self):
        components = {"components": [
            {"id": "root", "parent_id": None, "geometry_status": "measured"},
            {"id": "logical.parent", "parent_id": "root", "geometry_status": "logical_only"},
            {"id": "logical.child", "parent_id": "logical.parent", "geometry_status": "logical_only"},
            {"id": "heatsink", "parent_id": "logical.child", "geometry_status": "photo_estimated"},
        ]}
        gltf = {"nodes": [
            {"name": "root", "extras": {"sbs_component_id": "root"}, "children": [1]},
            {"name": "heatsink", "extras": {"sbs_component_id": "heatsink"}}
        ]}
        report = validator.validate_bindings(components, gltf)
        self.assertIn("Canonical semantic components: 4", report)
        self.assertIn("Components requiring geometry binding: 2", report)
        self.assertIn("Every geometry-backed content component ID is present exactly once: PASS", report)

    def test_missing_geometry_backed_component_still_fails(self):
        components = {"components": [
            {"id": "root", "parent_id": None, "geometry_status": "measured"},
            {"id": "part", "parent_id": "root", "geometry_status": "photo_estimated"},
        ]}
        gltf = {"nodes": [
            {"name": "root", "extras": {"sbs_component_id": "root"}}
        ]}
        with self.assertRaisesRegex(validator.BindingError, "Geometry-backed content components missing from GLB"):
            validator.validate_bindings(components, gltf)

    def test_content_hierarchy_cycles_fail_even_when_nodes_are_logical_only(self):
        components = {"components": [
            {"id": "a", "parent_id": "b", "geometry_status": "logical_only"},
            {"id": "b", "parent_id": "a", "geometry_status": "logical_only"},
        ]}
        with self.assertRaisesRegex(validator.BindingError, "Cycle detected in content component ancestry"):
            validator.validate_bindings(components, {"nodes": []})


if __name__ == "__main__":
    unittest.main()
