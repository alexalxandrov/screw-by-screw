from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import validate_model_package as validator


def sample_package():
    return {
        "model": {"id": "model.demo", "geometry_status": "illustrative_proxy_not_cad",
                  "source_ids": ["src.demo"]},
        "sources": {"sources": [{"id": "src.demo"}]},
        "components": {"components": [
            {"id": "assembly.root", "parent_id": None, "name": {"en": "Root", "ru": "Корень"},
             "evidence_status": "illustrative", "source_ids": ["src.demo"]},
            {"id": "part.one", "parent_id": "assembly.root", "name": {"en": "Part", "ru": "Деталь"},
             "evidence_status": "visible_exact_model", "source_ids": ["src.demo"]}
        ]},
        "relationships": {"relationships": [
            {"id": "rel.one", "from": "assembly.root", "to": "part.one",
             "type": "contains", "source_ids": ["src.demo"]}
        ]},
        "process_layers": {"process_layers": [
            {"id": "layer.one", "mode": "qualitative", "linked_component_ids": ["part.one"],
             "source_ids": ["src.demo"]}
        ]},
        "assembly_steps": {"status": "not_authored", "steps": []},
        "learning": {"questions": [
            {"id": "q.one", "prompt": {"en": "Question?", "ru": "Вопрос?"},
             "choices": [{"en": "A", "ru": "А"}, {"en": "B", "ru": "Б"}],
             "correct_index": 1, "source_ids": ["src.demo"]}
        ]}
    }


class ContentPackageTests(unittest.TestCase):
    def test_valid_package_passes(self):
        report = validator.validate_package(sample_package())
        self.assertIn("Bilingual labels and semantic references: PASS", report)

    def test_unknown_parent_fails(self):
        package = sample_package()
        package["components"]["components"][1]["parent_id"] = "missing"
        with self.assertRaisesRegex(validator.PackageError, "unknown parent_id"):
            validator.validate_package(package)

    def test_dangling_relationship_fails(self):
        package = sample_package()
        package["relationships"]["relationships"][0]["to"] = "missing"
        with self.assertRaisesRegex(validator.PackageError, "unknown to component"):
            validator.validate_package(package)

    def test_unknown_source_fails(self):
        package = sample_package()
        package["components"]["components"][1]["source_ids"] = ["not-a-source"]
        with self.assertRaisesRegex(validator.PackageError, "unknown sources"):
            validator.validate_package(package)

    def test_invalid_answer_index_fails(self):
        package = sample_package()
        package["learning"]["questions"][0]["correct_index"] = 8
        with self.assertRaisesRegex(validator.PackageError, "invalid correct_index"):
            validator.validate_package(package)

    def test_untranslated_component_fails(self):
        package = sample_package()
        package["components"]["components"][1]["name"].pop("ru")
        with self.assertRaisesRegex(validator.PackageError, "en/ru names"):
            validator.validate_package(package)

    def test_not_authored_steps_cannot_contain_steps(self):
        package = sample_package()
        package["assembly_steps"]["steps"] = [{"id": "step.one", "target_component_ids": [],
                                                 "source_ids": ["src.demo"]}]
        with self.assertRaisesRegex(validator.PackageError, "marked not_authored"):
            validator.validate_package(package)

    def test_directory_loader_requires_all_files(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(validator.PackageError, "Required package file is missing"):
                validator.load_package(Path(temp))


if __name__ == "__main__":
    unittest.main()
