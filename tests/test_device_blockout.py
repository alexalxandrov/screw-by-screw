import json
import struct
import unittest

from tools.modeling.build_device_blockout import build_glb


def make_document(proxies):
    components = [{
        "id": "test.root",
        "parent_id": None,
        "evidence_status": "illustrative",
        "geometry_status": "assembly_node",
    }]
    for index, proxy in enumerate(proxies):
        components.append({
            "id": f"test.part.{index}",
            "parent_id": "test.root",
            "evidence_status": "illustrative",
            "geometry_status": "illustrative_proxy",
            "visual_proxy": {
                "translation": [0, 0, 0],
                "scale": [10, 10, 10],
                "material": 1,
                **proxy,
            },
        })
    return {"device_model_id": "test.device", "components": components}


def parse_glb(data):
    magic, version, total_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total_length != len(data):
        raise AssertionError("invalid GLB header")
    json_length, json_type = struct.unpack_from("<II", data, 12)
    if json_type != 0x4E4F534A:
        raise AssertionError("missing GLB JSON chunk")
    document = json.loads(data[20:20 + json_length].decode("utf-8").rstrip())
    return document


class DeviceBlockoutGeometryTests(unittest.TestCase):
    def test_all_primitive_kinds_preserve_semantic_nodes_and_ids(self):
        proxies = [
            {"kind": "box"},
            {"kind": "cylinder", "axis": "x"},
            {"kind": "fan", "axis": "x", "blade_count": 7},
            {"kind": "fin_stack", "fin_count": 14},
        ]
        gltf = parse_glb(build_glb(make_document(proxies)))
        self.assertEqual(len(gltf["nodes"]), 9)
        self.assertEqual(len(gltf["meshes"]), 4)
        semantic_nodes = gltf["nodes"][:5]
        proxy_nodes = gltf["nodes"][5:]
        self.assertEqual(
            [node["extras"]["sbs_component_id"] for node in semantic_nodes],
            ["test.root", "test.part.0", "test.part.1", "test.part.2", "test.part.3"],
        )
        self.assertEqual(len(proxy_nodes), 4)
        for index, proxy_node in enumerate(proxy_nodes):
            self.assertTrue(proxy_node["extras"]["sbs_visual_proxy"])
            self.assertEqual(proxy_node["extras"]["sbs_export_role"], "decorative_detail")
            self.assertEqual(proxy_node["extras"]["sbs_parent_component_id"], f"test.part.{index}")
            self.assertNotIn("translation", semantic_nodes[index + 1])
            self.assertNotIn("scale", semantic_nodes[index + 1])
            self.assertNotIn("mesh", semantic_nodes[index + 1])
        self.assertEqual(semantic_nodes[1]["children"], [5])
        self.assertEqual(gltf["nodes"][6]["rotation"], [0.0, 0.0, 2 ** -0.5, 2 ** -0.5])
        self.assertEqual(gltf["nodes"][6]["scale"], [10, 10, 10])

    def test_fan_and_fin_stack_generate_more_surface_geometry_than_a_box(self):
        gltf = parse_glb(build_glb(make_document([
            {"kind": "box"},
            {"kind": "fan", "blade_count": 9},
            {"kind": "fin_stack", "fin_count": 18},
        ])))
        vertex_counts = [
            gltf["accessors"][mesh["primitives"][0]["attributes"]["POSITION"]]["count"]
            for mesh in gltf["meshes"]
        ]
        self.assertGreater(vertex_counts[1], vertex_counts[0] * 4)
        self.assertGreater(vertex_counts[2], vertex_counts[0] * 10)

    def test_generated_buffer_views_and_accessors_are_in_bounds(self):
        gltf = parse_glb(build_glb(make_document([
            {"kind": "cylinder", "segments": 48},
            {"kind": "fan", "blade_count": 12},
            {"kind": "fin_stack", "fin_count": 24},
        ])))
        buffer_length = gltf["buffers"][0]["byteLength"]
        for view in gltf["bufferViews"]:
            self.assertGreater(view["byteLength"], 0)
            self.assertGreaterEqual(view["byteOffset"], 0)
            self.assertLessEqual(view["byteOffset"] + view["byteLength"], buffer_length)
            self.assertEqual(view["byteOffset"] % 4, 0)
        for accessor in gltf["accessors"]:
            view = gltf["bufferViews"][accessor["bufferView"]]
            component_bytes = 2 if accessor["componentType"] == 5123 else 4
            components = 3 if accessor["type"] == "VEC3" else 1
            self.assertLessEqual(accessor["count"] * component_bytes * components, view["byteLength"])

    def test_invalid_geometry_kind_and_parameters_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "unsupported proxy geometry kind"):
            build_glb(make_document([{"kind": "sphere"}]))
        with self.assertRaisesRegex(ValueError, "blade_count"):
            build_glb(make_document([{"kind": "fan", "blade_count": 2}]))
        with self.assertRaisesRegex(ValueError, "fin_count"):
            build_glb(make_document([{"kind": "fin_stack", "fin_count": 3}]))
        with self.assertRaisesRegex(ValueError, "segments"):
            build_glb(make_document([{"kind": "cylinder", "segments": 4}]))


    def test_cylinder_side_winding_faces_outward(self):
        from tools.modeling.build_device_blockout import _append_cylinder
        positions, normals, indices = [], [], []
        _append_cylinder(positions, normals, indices, radius=0.5, depth=1.0, segments=12)
        a, b, c = [indices[index] for index in range(3)]
        points = [positions[index * 3:index * 3 + 3] for index in (a, b, c)]
        first = [points[1][i] - points[0][i] for i in range(3)]
        second = [points[2][i] - points[0][i] for i in range(3)]
        face_normal = [
            first[1] * second[2] - first[2] * second[1],
            first[2] * second[0] - first[0] * second[2],
            first[0] * second[1] - first[1] * second[0],
        ]
        average_normal = [
            sum(normals[index * 3 + axis] for index in (a, b, c)) / 3
            for axis in range(3)
        ]
        self.assertGreater(sum(face_normal[i] * average_normal[i] for i in range(3)), 0)

    def test_axis_rotation_is_applied_without_changing_global_envelope(self):
        gltf = parse_glb(build_glb(make_document([{"kind": "cylinder", "axis": "z"}])))
        node = gltf["nodes"][2]
        self.assertEqual(node["extras"]["sbs_parent_component_id"], "test.part.0")
        self.assertEqual(node["rotation"], [2 ** -0.5, 0.0, 0.0, 2 ** -0.5])
        self.assertEqual(node["scale"], [10, 10, 10])


    def test_nested_model_space_proxy_transforms_are_not_parent_local(self):
            document = {
                "device_model_id": "test.nested",
                "components": [
                    {"id": "test.root", "parent_id": None, "geometry_status": "assembly_node"},
                    {
                        "id": "test.parent",
                        "parent_id": "test.root",
                        "geometry_status": "illustrative_proxy",
                        "visual_proxy": {
                            "kind": "box", "translation": [-72, 165, 0],
                            "scale": [3, 230, 230], "material": 0,
                        },
                    },
                    {
                        "id": "test.child",
                        "parent_id": "test.parent",
                        "geometry_status": "illustrative_proxy",
                        "visual_proxy": {
                            "kind": "box", "translation": [-55, 165, 0],
                            "scale": [3, 220, 196], "material": 2,
                        },
                    },
                ],
            }
            gltf = parse_glb(build_glb(document))
            root, parent, child, parent_proxy, child_proxy = gltf["nodes"]
            self.assertEqual(root["children"], [1])
            self.assertEqual(parent["children"], [2, 3])
            self.assertEqual(child["children"], [4])
            for semantic in (root, parent, child):
                self.assertNotIn("translation", semantic)
                self.assertNotIn("scale", semantic)
                self.assertNotIn("mesh", semantic)
            self.assertEqual(parent_proxy["translation"], [-72, 165, 0])
            self.assertEqual(child_proxy["translation"], [-55, 165, 0])
            self.assertEqual(parent_proxy["scale"], [3, 230, 230])
            self.assertEqual(child_proxy["scale"], [3, 220, 196])
            self.assertEqual(parent_proxy["extras"]["sbs_parent_component_id"], "test.parent")
            self.assertEqual(child_proxy["extras"]["sbs_parent_component_id"], "test.child")

if __name__ == "__main__":
    unittest.main()