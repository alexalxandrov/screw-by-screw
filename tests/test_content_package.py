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


    def test_package_supports_mixed_geometry_fidelity_classes(self):
        package = sample_package()
        package["model"]["geometry_status"] = "mixed"
        package["release"]["geometry_status"] = "mixed"
        report = validator.validate_package(package)
        self.assertIn("Geometry fidelity: mixed", report)

        invalid = sample_package()
        invalid["model"]["geometry_status"] = "physically_perfect"
        invalid["release"]["geometry_status"] = "physically_perfect"
        with self.assertRaisesRegex(validator.PackageError, "model.geometry_status must be one of"):
            validator.validate_package(invalid)


    def test_platform_family_identity_can_omit_part_number(self):
        package = sample_package()
        package["model"]["identity_scope"] = "platform_family"
        package["model"]["part_number"] = None
        package["release"]["part_number"] = None
        package["release"]["status"] = "research_blockout"
        report = validator.validate_package(package)
        self.assertIn("Geometry fidelity: illustrative_proxy_not_cad", report)

        invalid = sample_package()
        invalid["model"]["identity_scope"] = "exact_sku"
        invalid["model"]["part_number"] = None
        invalid["release"]["part_number"] = None
        with self.assertRaisesRegex(validator.PackageError, "Exact-SKU models must define a part_number"):
            validator.validate_package(invalid)

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
        self.assertEqual(claims["claim.memory.unpopulated_location_count"]["value"], 2)
        self.assertEqual(components["pcb.memory.unpopulated.01"]["geometry_status"], "logical_only")
        self.assertEqual(components["pcb.memory.unpopulated.02"]["geometry_status"], "logical_only")
        self.assertEqual(components["pcb.memory.unpopulated.01"]["parent_id"], "pcb.memory.unpopulated.locations")
        self.assertIn("src.tomshardware.teardown", claims["claim.memory.unpopulated_location_count"]["source_ids"])
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
            | {f"fastener.cooler.{index:02d}" for index in range(1, 5)},
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
        claims = {item["id"]: item for item in package["claims"]["claims"]}

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

            blade_ids = [f"fan.{fan_index}.blade.{index}" for index in range(1, 9)]
            self.assertTrue(all(blade_id in components for blade_id in blade_ids))
            self.assertEqual(
                relationships[f"rel.detail.contains.fan-{fan_index}-blade-8"]["to"],
                f"fan.{fan_index}.blade.8",
            )
            self.assertIn("src.newegg.exact_sku.product_photo", components[blade_ids[-1]]["source_ids"])

        self.assertIn("Components: 325", report)
        self.assertIn("Relationships: 324", report)
        self.assertIn("Animation clips: 2", report)
        self.assertEqual(len(package["claims"]["claims"]), 122)
        self.assertEqual(len(package["process_layers"]["process_layers"]), 5)
        power_layer = next(layer for layer in package["process_layers"]["process_layers"] if layer["id"] == "process.power.qualitative")
        self.assertEqual(len(power_layer["linked_component_ids"]), 17)
        self.assertIn("src.gamersnexus.teardown", power_layer["source_ids"])
        self.assertEqual(len(power_layer["visualization"]["diagram"]["groups"]), 4)
        power_node_ids = {
            node["component_id"]
            for group in power_layer["visualization"]["diagram"]["groups"]
            for node in group["nodes"]
        }
        self.assertEqual(power_node_ids, set(power_layer["linked_component_ids"]))
        self.assertTrue(power_node_ids <= set(components))
        self.assertIn("power.shunt.8pin", power_node_ids)
        self.assertIn("power.shunt.pcie_slot", power_node_ids)
        self.assertIn("power.fuse.input", power_node_ids)
        self.assertIn("chip.memory.gddr6.bus", power_node_ids)
        self.assertIn("5 mΩ current-sense shunt", power_layer["description"]["en"])
        graphics_layer = next(layer for layer in package["process_layers"]["process_layers"] if layer["type"] == "graphics_pipeline")
        self.assertEqual(graphics_layer["mode"], "logical_architecture")
        self.assertEqual(len(graphics_layer["visualization"]["diagram"]["groups"]), 5)
        graphics_node_ids = {
            node["component_id"]
            for group in graphics_layer["visualization"]["diagram"]["groups"]
            for node in group["nodes"]
        }
        self.assertEqual(graphics_node_ids, set(graphics_layer["linked_component_ids"]))
        self.assertTrue(graphics_node_ids <= set(components))
        self.assertIn("chip.gpu.rop.array", graphics_node_ids)
        self.assertIn("chip.memory.gddr6.bus", graphics_node_ids)
        self.assertIn("connector.displayport.3", graphics_node_ids)
        self.assertIn("connector.hdmi.1", graphics_node_ids)
        self.assertIn("src.nvidia.ampere.whitepaper", graphics_layer["source_ids"])
        self.assertIn("src.neoseeker.review", graphics_layer["source_ids"])
        self.assertIn("not a fixed", graphics_layer["description"]["en"])
        video_layer = next(layer for layer in package["process_layers"]["process_layers"] if layer["type"] == "video_codec")
        self.assertEqual(video_layer["mode"], "logical_architecture")
        self.assertEqual(len(video_layer["visualization"]["diagram"]["groups"]), 3)
        self.assertEqual(set(video_layer["linked_component_ids"]), {
            "pcb.connector.pcie", "chip.gpu.ga106", "chip.gpu.nvdec",
            "chip.memory.gddr6.bus", "chip.gpu.sm.cluster", "chip.gpu.nvenc"
        })
        self.assertEqual(components["chip.gpu.nvenc"]["geometry_status"], "logical_only")
        self.assertEqual(components["chip.gpu.nvdec"]["geometry_status"], "logical_only")
        media_claims = {item["id"]: item for item in package["claims"]["claims"]}
        self.assertEqual(media_claims["claim.gpu.nvenc.count"]["value"], 1)
        self.assertEqual(media_claims["claim.gpu.nvenc.generation"]["value"], "7th Generation")
        self.assertFalse(media_claims["claim.gpu.nvenc.av1_encode"]["value"])
        self.assertEqual(media_claims["claim.gpu.nvdec.count"]["value"], 1)
        self.assertEqual(media_claims["claim.gpu.nvdec.generation"]["value"], "5th Generation")
        self.assertTrue(media_claims["claim.gpu.nvdec.av1_decode"]["value"])
        media_source_ids = {item["id"] for item in package["sources"]["sources"]}
        self.assertIn("src.nvidia.video_encode_decode_matrix", media_source_ids)
        media_questions = {item["id"]: item for item in package["learning"]["questions"]}
        self.assertEqual(media_questions["quiz.video.nvdec.role"]["correct_index"], 1)
        self.assertEqual(media_questions["quiz.video.nvenc.generation"]["correct_index"], 0)
        self.assertEqual(media_questions["quiz.video.av1.encode"]["correct_index"], 1)
        self.assertEqual(media_questions["quiz.video.av1.decode"]["correct_index"], 0)
        self.assertTrue(all("src.nvidia.video_encode_decode_matrix" in item["source_ids"] for item in media_questions.values() if item["id"].startswith("quiz.video.")))
        self.assertEqual(len(package["learning"]["questions"]), 17)
        self.assertEqual(len(package["assembly_steps"]["steps"]), 5)
        self.assertEqual(claims["claim.cooler.fin_stack_base.screw_count"]["value"], 2)
        self.assertEqual(claims["claim.io.bracket.mount_screw_count"]["value"], 2)
        self.assertEqual(claims["claim.io.display_output.screw_count"]["value"], 3)
        self.assertEqual(claims["claim.io.display_output.driver_size"]["value"], "Phillips #0")
        individual_fastener_groups = {
            "fastener.cooler.fin_stack_base": 2,
            "fastener.io.bracket.mount": 2,
            "fastener.io.display.output": 3,
        }
        for group_id, count in individual_fastener_groups.items():
            for index in range(1, count + 1):
                child_id = f"{group_id}.{index:02d}"
                self.assertEqual(components[child_id]["parent_id"], group_id)
                self.assertEqual(components[child_id]["geometry_status"], "logical_only")
                relation = relationships[f"rel.contains.{child_id}"]
                self.assertEqual(relation["from"], group_id)
                self.assertEqual(relation["to"], child_id)
                self.assertIn("src.gamersnexus.teardown", relation["source_ids"])
        self.assertEqual(components["fastener.shroud.candidate"]["geometry_status"], "logical_only")
        self.assertEqual(claims["claim.power.current_sense_shunt.pcie_slot.resistance"]["value"], None)
        self.assertEqual(claims["claim.cooling.fan.rpm.sample_operating_point"]["value"], 2030)
        self.assertEqual(claims["claim.cooling.fan.pwm.sample_operating_point"]["value"], 73)
        self.assertEqual(claims["claim.gpu.temperature.edge.sample_operating_point"]["value"], 68.1)
        self.assertEqual(claims["claim.gpu.temperature.hotspot.sample_operating_point"]["value"], 80.5)
        self.assertEqual(claims["claim.gpu.frequency.peak.sample_operating_point"]["value"], 1905)
        self.assertEqual(claims["claim.cooling.heatpipe.diameter.observed_estimate"]["value"], 6)
        self.assertEqual(claims["claim.cooling.heatpipe.diameter.observed_estimate"]["confidence_class"], "teardown_supported")
        self.assertNotIn("claim.cooling.heatpipe.nominal_diameter", claims)
        self.assertEqual(relationships["rel.cooling.airflow.fan2"]["from"], "assembly.fan.2")
        self.assertEqual(relationships["rel.cooling.airflow.fan2"]["to"], "cooling.heatsink")
        self.assertEqual(relationships["rel.cooling.airflow.fan2"]["certainty"], "qualitative")
        self.assertEqual(claims["claim.gpu.frequency.peak.sample_operating_point"]["confidence_class"], "measured")
        self.assertEqual(claims["claim.power.board_power.sample_operating_point"]["value"], 172.4)

        sm_instances = [item for item in components.values() if item["id"].startswith("chip.gpu.sm.") and item["id"] != "chip.gpu.sm.cluster" and item["id"].count(".") == 3]
        self.assertEqual(len(sm_instances), 28)
        self.assertEqual(components["chip.gpu.tpc.cluster"]["geometry_status"], "logical_only")
        self.assertEqual(components["chip.gpu.polymorph.array"]["geometry_status"], "logical_only")
        tpc_instances = [item for item in components.values() if item["id"].startswith("chip.gpu.tpc.") and item["id"] != "chip.gpu.tpc.cluster" and not item["id"].endswith(".polymorph")]
        polymorph_instances = [item for item in components.values() if item["id"].startswith("chip.gpu.tpc.") and item["id"].endswith(".polymorph")]
        partitions = [item for item in components.values() if ".partition." in item["id"]]
        self.assertEqual(len(tpc_instances), 14)
        self.assertEqual(len(polymorph_instances), 14)
        self.assertEqual(len(partitions), 112)
        self.assertTrue(all(item["parent_id"] == "chip.gpu.tpc.cluster" for item in tpc_instances))
        for tpc_index, tpc in enumerate(sorted(tpc_instances, key=lambda item: item["id"]), start=1):
            expected_sms = {f"chip.gpu.sm.{(tpc_index - 1) * 2 + slot:02d}" for slot in (1, 2)}
            self.assertEqual({item["id"] for item in sm_instances if item["parent_id"] == tpc["id"]}, expected_sms)
            self.assertEqual(len([item for item in partitions if item["parent_id"] in expected_sms]), 8)
        for sm in sm_instances:
            self.assertEqual(len([item for item in partitions if item["parent_id"] == sm["id"]]), 4)
        self.assertEqual(claims["claim.gpu.tpc_count"]["value"], 14)
        self.assertEqual(claims["claim.gpu.tpc_count"]["confidence_class"], "calculated")
        self.assertEqual(claims["claim.gpu.sm_partition_count"]["value"], 112)
        self.assertEqual(claims["claim.gpu.sm_partitions_per_sm"]["value"], 4)
        self.assertEqual(claims["claim.gpu.register_file_per_partition"]["value"], 64)
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
