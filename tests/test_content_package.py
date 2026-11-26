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
import build_release_manifest as manifest_builder


def sample_package():
    return {
        "model": {"id": "model.demo", "part_number": "DEMO-1", "geometry_status": "illustrative_proxy_not_cad",
                  "source_ids": ["src.demo"], "release": {"version": "0.1-draft", "status": "draft"}},
        "sources": {"sources": [{"id": "src.demo", "title": "Demo source", "publisher": "Test", "url": "https://example.test/source", "license_status": "test_only"}]},
        "components": {"components": [
            {"id": "assembly.root", "parent_id": None, "name": {"en": "Root", "ru": "Корень"},
             "evidence_status": "illustrative", "source_ids": ["src.demo"],
             "description": {"en": "Root description", "ru": "Описание корня"}},
            {"id": "part.one", "parent_id": "assembly.root", "name": {"en": "Part", "ru": "Деталь"},
             "evidence_status": "visible_exact_model", "source_ids": ["src.demo"],
             "description": {"en": "Part description", "ru": "Описание детали"}}
        ]},
        "relationships": {"relationships": [
            {"id": "rel.one", "from": "assembly.root", "to": "part.one",
             "type": "contains", "source_ids": ["src.demo"]}
        ]},
        "process_layers": {"process_layers": [
            {"id": "layer.one", "mode": "qualitative", "linked_component_ids": ["part.one"],
             "source_ids": ["src.demo"], "assumptions": [],
             "title": {"en": "Layer", "ru": "Слой"},
             "description": {"en": "Layer description", "ru": "Описание слоя"}}
        ]},
        "assembly_steps": {"status": "not_authored", "steps": []},
        "claims": {"claims": [
            {"id": "claim.demo", "subject_id": "model.demo", "predicate": "demo_value",
             "value": 1, "confidence_class": "manufacturer_data", "source_ids": ["src.demo"]}
        ]},
        "release": {"model_id": "model.demo", "part_number": "DEMO-1", "package_version": "0.1-draft",
                    "status": "draft", "geometry_status": "illustrative_proxy_not_cad", "files": []},
        "animations": {"clips": []},
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
        package["assembly_steps"]["steps"] = [{
            "id": "step.one", "sequence": 1,
            "title": {"en": "Step", "ru": "Шаг"},
            "component_ids": ["part.one"], "source_ids": ["src.demo"]
        }]
        with self.assertRaisesRegex(validator.PackageError, "marked not_authored"):
            validator.validate_package(package)

    def test_partial_observed_sequence_uses_canonical_component_ids(self):
        package = sample_package()
        package["assembly_steps"] = {
            "status": "partial_observed_sequence",
            "complete_sequence": False,
            "steps": [{
                "id": "step.one", "sequence": 1,
                "title": {"en": "Remove part", "ru": "Снять деталь"},
                "description": {"en": "Description", "ru": "Описание"},
                "component_ids": ["part.one"],
                "tool_requirements": [],
                "safety_notes": {"en": "Be careful", "ru": "Соблюдайте осторожность"},
                "prerequisite_step_ids": [],
                "source_ids": ["src.demo"]
            }]
        }
        report = validator.validate_package(package)
        self.assertIn("Assembly steps: 1 (partial_observed_sequence)", report)

    def test_assembly_step_prerequisite_must_precede_dependent_step(self):
        package = sample_package()
        base = {
            "title": {"en": "Step", "ru": "Шаг"},
            "component_ids": ["part.one"],
            "tool_requirements": [],
            "source_ids": ["src.demo"]
        }
        package["assembly_steps"] = {
            "status": "authored",
            "steps": [
                {**base, "id": "step.one", "sequence": 1, "prerequisite_step_ids": ["step.two"]},
                {**base, "id": "step.two", "sequence": 2, "prerequisite_step_ids": []}
            ]
        }
        with self.assertRaisesRegex(validator.PackageError, "prerequisite must precede it"):
            validator.validate_package(package)

    def test_unknown_claim_must_have_null_value(self):
        package = sample_package()
        package["claims"]["claims"][0]["confidence_class"] = "unknown"
        with self.assertRaisesRegex(validator.PackageError, "must have a null value"):
            validator.validate_package(package)

    def test_claim_subject_must_exist(self):
        package = sample_package()
        package["claims"]["claims"][0]["subject_id"] = "missing"
        with self.assertRaisesRegex(validator.PackageError, "unknown subject_id"):
            validator.validate_package(package)

    def test_build_manifest_hashes_all_content_files(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            package = sample_package()
            for key, value in package.items():
                if key == "release":
                    continue
                (directory / f"{key}.json").write_text(json.dumps(value), encoding="utf-8")
            release = manifest_builder.build_manifest(directory)
            self.assertEqual(len(release["files"]), len(manifest_builder.HASHED_FILES))
            loaded = validator.load_package(directory)
            report = validator.validate_package(loaded, directory)
            self.assertIn("Release manifest and SHA-256 integrity: PASS", report)

    def test_manifest_detects_tampered_content(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            package = sample_package()
            for key, value in package.items():
                if key == "release":
                    continue
                (directory / f"{key}.json").write_text(json.dumps(value), encoding="utf-8")
            manifest_builder.build_manifest(directory)
            (directory / "components.json").write_text((directory / "components.json").read_text(encoding="utf-8") + " ", encoding="utf-8")
            loaded = validator.load_package(directory)
            with self.assertRaisesRegex(validator.PackageError, "SHA-256 mismatch"):
                validator.validate_package(loaded, directory)

    def test_untranslated_component_description_fails(self):
        package = sample_package()
        package["components"]["components"][1]["description"].pop("ru")
        with self.assertRaisesRegex(validator.PackageError, "bilingual descriptions"):
            validator.validate_package(package)

    def test_untranslated_process_layer_fails(self):
        package = sample_package()
        package["process_layers"]["process_layers"][0]["description"].pop("ru")
        with self.assertRaisesRegex(validator.PackageError, "bilingual description"):
            validator.validate_package(package)

    def test_logical_architecture_process_layer_accepts_bilingual_assumptions(self):
        package = sample_package()
        layer = package["process_layers"]["process_layers"][0]
        layer["mode"] = "logical_architecture"
        layer["assumptions"] = [
            {"en": "Logical nodes are not physical layout.", "ru": "Логические узлы не являются физической компоновкой."}
        ]
        validator.validate_package(package)

    def test_process_layer_rejects_untranslated_assumption_object(self):
        package = sample_package()
        package["process_layers"]["process_layers"][0]["assumptions"] = [
            {"en": "Logical nodes are not physical layout."}
        ]
        with self.assertRaisesRegex(validator.PackageError, "bilingual objects"):
            validator.validate_package(package)

    def test_untranslated_quiz_choice_fails(self):
        package = sample_package()
        package["learning"]["questions"][0]["choices"][0].pop("ru")
        with self.assertRaisesRegex(validator.PackageError, "must be bilingual"):
            validator.validate_package(package)

    def test_directory_loader_requires_all_files(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(validator.PackageError, "Required package file is missing"):
                validator.load_package(Path(temp))



    def test_exact_sku_fastener_and_memory_evidence_is_preserved(self):
        package_dir = ROOT / "content" / "models" / "evga-rtx3060-xc-black-12gb"
        manifest_builder.build_manifest(package_dir)
        package = validator.load_package(package_dir)
        validator.validate_package(package, package_dir)
        claims = {item["id"]: item for item in package["claims"]["claims"]}
        components = {item["id"]: item for item in package["components"]["components"]}
        self.assertEqual(claims["claim.cooler.fastener.count.total"]["value"], 8)
        self.assertEqual(claims["claim.cooler.fastener.count.rear"]["value"], 4)
        self.assertEqual(claims["claim.memory.package_part_number"]["value"], "Samsung K4ZAF325BM-HC16")
        for claim_id in (
            "claim.memory.package_density",
            "claim.memory.package_organization",
            "claim.memory.package_type",
            "claim.memory.package_interface_width",
        ):
            self.assertEqual(claims[claim_id]["confidence_class"], "secondary_catalog_data")
        self.assertEqual(
            package["model"]["specifications"]["memory"]["package_identity"]["part_number"],
            "Samsung K4ZAF325BM-HC16",
        )
        self.assertEqual(
            set(package["assembly_steps"]["steps"][0]["component_ids"]),
            {"assembly.fasteners", "assembly.cooling"}
            | {f"fastener.cooler.{index:02d}" for index in range(1, 9)},
        )
        for index in range(5, 9):
            rear = components[f"fastener.cooler.{index:02d}"]
            self.assertEqual(rear["evidence_status"], "visible_exact_model")
            self.assertEqual(rear["geometry_status"], "logical_only")

    def test_candidate_pcb_marking_does_not_confirm_revision(self):
        package_dir = ROOT / "content" / "models" / "evga-rtx3060-xc-black-12gb"
        manifest_builder.build_manifest(package_dir)
        package = validator.load_package(package_dir)
        validator.validate_package(package, package_dir)
        claims = {item["id"]: item for item in package["claims"]["claims"]}
        self.assertEqual(
            claims["claim.pcb.silkscreen_marking.candidate"]["confidence_class"],
            "candidate_reference_observation",
        )
        self.assertEqual(claims["claim.pcb.silkscreen_marking.candidate"]["value"], "EVGA232 REV 1.0")
        self.assertIsNone(claims["claim.pcb.revision"]["value"])
        self.assertEqual(claims["claim.pcb.revision"]["confidence_class"], "unknown")

    def test_pilot_rotors_are_separate_proxy_components_and_animation_targets(self):
        package_dir = ROOT / "content" / "models" / "evga-rtx3060-xc-black-12gb"
        manifest = manifest_builder.build_manifest(package_dir)
        self.assertIn("animations.json", {item["path"] for item in manifest["files"]})
        package = validator.load_package(package_dir)
        report = validator.validate_package(package, package_dir)
        components = {item["id"]: item for item in package["components"]["components"]}
        relationships = {item["id"]: item for item in package["relationships"]["relationships"]}

        for fan_index in (1, 2):
            fan_id = f"assembly.fan.{fan_index}"
            rotor_id = f"{fan_id}.rotor"
            rotor = components[rotor_id]
            self.assertEqual(rotor["parent_id"], fan_id)
            self.assertEqual(rotor["evidence_status"], "illustrative")
            self.assertEqual(rotor["geometry_status"], "assembly_node")
            self.assertEqual(rotor["source_ids"], [])
            edge = relationships[f"rel.fan.{fan_index}.contains.rotor"]
            self.assertEqual(edge["from"], fan_id)
            self.assertEqual(edge["to"], rotor_id)

        self.assertIn("Components: 127", report)
        self.assertIn("Relationships: 122", report)
        self.assertIn("Animation clips: 2", report)
        self.assertEqual(len(package["claims"]["claims"]), 52)
        self.assertEqual(len(package["process_layers"]["process_layers"]), 3)
        self.assertEqual(len(package["learning"]["questions"]), 8)
        clip = package["animations"]["clips"][0]
        self.assertEqual(clip["evidence_status"], "educational_approximation")
        self.assertEqual(clip["source_ids"], [])
        self.assertEqual(
            {track["target_id"] for track in clip["tracks"]},
            {"assembly.fan.1.rotor", "assembly.fan.2.rotor"}
        )

    def test_source_free_animation_requires_explicit_educational_evidence(self):
        package = sample_package()
        package["animations"]["clips"] = [{
            "id": "clip.unverified",
            "title": {"en": "Unverified motion", "ru": "Неподтверждённое движение"},
            "evidence_status": "documented_motion",
            "source_ids": [],
            "duration_ms": 1000,
            "tracks": [{
                "target_id": "part.one",
                "property": "rotation",
                "keyframes": [{"t": 0, "value": [0, 0, 0]}, {"t": 1, "value": [0, 1, 0]}]
            }]
        }]
        with self.assertRaisesRegex(validator.PackageError, "requires source provenance"):
            validator.validate_package(package)


if __name__ == "__main__":
    unittest.main()
