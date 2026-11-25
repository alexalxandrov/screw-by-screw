import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from tools.modeling.package_model import build_package


def make_glb(document=None):
    import struct
    document = document or {"asset": {"version": "2.0"}, "scene": 0, "scenes": [{"nodes": []}]}
    raw = json.dumps(document, separators=(",", ":")).encode("utf-8")
    raw += b" " * ((-len(raw)) % 4)
    return struct.pack("<III", 0x46546C67, 2, 20 + len(raw)) + struct.pack("<II", len(raw), 0x4E4F534A) + raw


class PackageModelTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.model_dir = self.root / "model"
        self.model_dir.mkdir()
        self.scene = self.root / "scene.glb"
        self.scene.write_bytes(make_glb())
        files = {
            "model": "model.json", "scene": "scene.glb", "components": "components.json",
            "sources": "sources.json", "relationships": "relationships.json", "claims": "claims.json",
            "process_layers": "process_layers.json", "assembly_steps": "assembly_steps.json",
            "learning": "learning.json", "animations": "animations.json", "release": "release.json"
        }
        (self.model_dir / "model-package.json").write_text(json.dumps({
            "format": "sbs-model", "schema_version": "1.0.0", "model_id": "test.device", "files": files
        }), encoding="utf-8")
        (self.model_dir / "model.json").write_text(json.dumps({"id": "test.device"}), encoding="utf-8")
        for key, name in files.items():
            if key in ("model", "scene"):
                continue
            (self.model_dir / name).write_text("{}", encoding="utf-8")
        self.output = self.root / "test.sbsmodel"

    def tearDown(self):
        self.temp.cleanup()

    def test_builds_deterministic_portable_archive_with_hashes(self):
        result = build_package(self.model_dir, self.scene, self.output)
        self.assertTrue(self.output.exists())
        self.assertGreater(result["files"], 1)
        with zipfile.ZipFile(self.output) as archive:
            manifest = json.loads(archive.read("sbs-model.json"))
            self.assertIn("scene.glb", manifest["sha256"])
            self.assertEqual(archive.read("scene.glb"), self.scene.read_bytes())

    def test_rejects_external_glb_resources(self):
        self.scene.write_bytes(make_glb({"asset": {"version": "2.0"}, "buffers": [{"uri": "https://example.invalid/b.bin"}]}))
        with self.assertRaisesRegex(ValueError, "external GLB resource"):
            build_package(self.model_dir, self.scene, self.output)

    def test_rejects_path_traversal_in_manifest(self):
        manifest_path = self.model_dir / "model-package.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["files"]["components"] = "../outside.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "unsafe package path"):
            build_package(self.model_dir, self.scene, self.output)

    def test_rejects_duplicate_archive_paths(self):
        manifest_path = self.model_dir / "model-package.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["files"]["components"] = "model.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "duplicate package archive path"):
            build_package(self.model_dir, self.scene, self.output)

    def test_rejects_mismatched_model_id(self):
        (self.model_dir / "model.json").write_text(json.dumps({"id": "wrong.device"}), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "model ID does not match"):
            build_package(self.model_dir, self.scene, self.output)


if __name__ == "__main__":
    unittest.main()
