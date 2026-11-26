from __future__ import annotations

import hashlib
import json
import struct
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "modeling"))

import build_text_model_package as builder


def minimal_glb(number_value: int | float = 1, binary_byte: int = 0) -> bytes:
    document = {
        "asset": {"version": "2.0", "generator": "package-builder-test"},
        "scene": 0,
        "scenes": [{"nodes": [], "extras": {"number": number_value}}],
        "nodes": [],
        "buffers": [{"byteLength": 4}],
        "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": 4}],
    }
    encoded_json = json.dumps(document, separators=(",", ":")).encode("utf-8")
    encoded_json += b" " * ((-len(encoded_json)) % 4)
    binary = bytes([binary_byte, 0, 0, 0])
    total = 12 + 8 + len(encoded_json) + 8 + len(binary)
    return (
        struct.pack("<4sII", b"glTF", 2, total)
        + struct.pack("<II", len(encoded_json), 0x4E4F534A)
        + encoded_json
        + struct.pack("<II", len(binary), 0x004E4942)
        + binary
    )


def make_source_tree(root: Path, scene: bytes) -> tuple[Path, Path]:
    model_dir = root / "model"
    model_dir.mkdir()
    file_map = {
        "model": "model.json",
        "components": "components.json",
        "sources": "sources.json",
        "relationships": "relationships.json",
        "claims": "claims.json",
        "process_layers": "process_layers.json",
        "assembly_steps": "assembly_steps.json",
        "learning": "learning.json",
        "animations": "animations.json",
        "release": "release.json",
        "scene": "scene.glb",
    }
    for key, name in file_map.items():
        if key == "scene":
            continue
        (model_dir / name).write_text(
            json.dumps({"fixture": name}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    (model_dir / "model-package.json").write_text(
        json.dumps({
            "format": "sbs-model",
            "schema_version": "1.0.0",
            "model_id": "model.test",
            "package_version": "0.1.0",
            "status": "research_blockout",
            "files": file_map,
        }, indent=2) + "\n",
        encoding="utf-8",
    )
    scene_path = root / "scene.glb"
    scene_path.write_bytes(scene)
    return model_dir, scene_path


class TextModelPackageBuilderTests(unittest.TestCase):
    def test_build_and_compare_identical_envelopes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            model_dir, scene_path = make_source_tree(root, minimal_glb())
            built = root / "built.sbsmodel"
            existing = root / "existing.sbsmodel"
            built.write_text(builder.build_envelope(model_dir, scene_path), encoding="utf-8")
            existing.write_text(built.read_text(encoding="utf-8"), encoding="utf-8")
            builder.verify_envelope_equivalence(built, existing)

    def test_glb_json_number_spelling_is_compared_semantically(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            model_dir, scene_path = make_source_tree(root, minimal_glb(number_value=1))
            built = root / "built.sbsmodel"
            built.write_text(builder.build_envelope(model_dir, scene_path), encoding="utf-8")
            committed = root / "committed.sbsmodel"
            envelope = json.loads(built.read_text(encoding="utf-8")[len(builder.PREFIX):])
            envelope["files"]["scene.glb"] = builder.base64.b64encode(minimal_glb(number_value=1.0)).decode("ascii")
            envelope["manifest"]["sha256"]["scene.glb"] = hashlib.sha256(
                minimal_glb(number_value=1.0)
            ).hexdigest()
            committed.write_text(builder.PREFIX + json.dumps(envelope, separators=(",", ":")), encoding="utf-8")
            builder.verify_envelope_equivalence(built, committed)

    def test_binary_geometry_difference_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            model_dir, scene_path = make_source_tree(root, minimal_glb(binary_byte=0))
            built = root / "built.sbsmodel"
            built.write_text(builder.build_envelope(model_dir, scene_path), encoding="utf-8")
            committed = root / "committed.sbsmodel"
            envelope = json.loads(built.read_text(encoding="utf-8")[len(builder.PREFIX):])
            changed_glb = minimal_glb(binary_byte=1)
            envelope["files"]["scene.glb"] = builder.base64.b64encode(changed_glb).decode("ascii")
            envelope["manifest"]["sha256"]["scene.glb"] = __import__("hashlib").sha256(changed_glb).hexdigest()
            committed.write_text(builder.PREFIX + json.dumps(envelope, separators=(",", ":")), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "binary geometry differs"):
                builder.verify_envelope_equivalence(built, committed)

    def test_sidecar_difference_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            model_dir, scene_path = make_source_tree(root, minimal_glb())
            built = root / "built.sbsmodel"
            built.write_text(builder.build_envelope(model_dir, scene_path), encoding="utf-8")
            (model_dir / "components.json").write_text('{"fixture":"changed"}\n', encoding="utf-8")
            changed = root / "changed.sbsmodel"
            changed.write_text(builder.build_envelope(model_dir, scene_path), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "sidecar differs"):
                builder.verify_envelope_equivalence(changed, built)

    def test_unsafe_package_paths_are_rejected(self):
        for path in ("../escape.json", "/absolute.json", "a\\b.json"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                builder.safe_package_path(path)


if __name__ == "__main__":
    unittest.main()
