from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "content" / "models" / "dell-optiplex-5060-mt"


class OptiPlex5060InventoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = json.loads((MODEL_DIR / "model.json").read_text(encoding="utf-8"))
        cls.components_doc = json.loads((MODEL_DIR / "components.json").read_text(encoding="utf-8"))
        cls.sources_doc = json.loads((MODEL_DIR / "sources.json").read_text(encoding="utf-8"))
        cls.claims_doc = json.loads((MODEL_DIR / "claims.json").read_text(encoding="utf-8"))
        cls.components = cls.components_doc["components"]
        cls.by_id = {item["id"]: item for item in cls.components}
        cls.source_ids = {item["id"] for item in cls.sources_doc["sources"]}
        cls.claims = {item["id"]: item for item in cls.claims_doc["claims"]}

    def test_exact_family_identity_and_non_cad_status(self):
        self.assertEqual(self.model["id"], "pc.dell.optiplex-5060-mt")
        self.assertEqual(self.model["part_number"], "D18M005")
        self.assertEqual(self.model["geometry_status"], "illustrative_proxy_not_cad")
        self.assertIn("not a unique customer order", self.model["variant_notes"])

    def test_semantic_inventory_is_unique_and_parented(self):
        self.assertGreaterEqual(len(self.components), 80)
        self.assertEqual(len(self.by_id), len(self.components))
        for item in self.components:
            parent = item.get("parent_id")
            self.assertTrue(parent is None or parent in self.by_id, item["id"])
            for source_id in item.get("source_ids", []):
                self.assertIn(source_id, self.source_ids, item["id"])
            self.assertIn("geometry_hint", item, item["id"])

    def test_documented_screw_table_and_individually_addressable_screws(self):
        screw_table = self.model["specifications"]["documented_service_fasteners"]
        table_total = sum(
            screw_table[key]["quantity"]
            for key in ("system_board", "psu", "sd_card_reader", "wlan", "m2_pcie_ssd", "typec_cable_module", "internal_antenna")
        )
        self.assertEqual(table_total, 19)
        screw_nodes = [item for item in self.components if item["id"].startswith("fastener.")]
        self.assertEqual(len(screw_nodes), 27)
        self.assertEqual(sum(1 for item in screw_nodes if item["id"].startswith("fastener.board.")), 9)
        self.assertEqual(sum(1 for item in screw_nodes if item["id"].startswith("fastener.psu.")), 3)
        self.assertEqual(sum(1 for item in screw_nodes if item["id"].startswith("fastener.cpu-fan.")), 4)
        self.assertEqual(sum(1 for item in screw_nodes if item["id"].startswith("fastener.heatsink.")), 4)

    def test_system_fan_grommets_are_not_misclassified_as_screws(self):
        grommets = [item for item in self.components if item["id"].startswith("grommet.system-fan.")]
        self.assertEqual(len(grommets), 4)
        self.assertTrue(all(item["fastener_spec"]["designation"].startswith("Rubber grommet") for item in grommets))
        self.assertEqual(self.claims["claim.system-fan.grommets"]["value"], 4)

    def test_optional_modules_are_not_claimed_as_standard_configuration(self):
        for component_id in ("module.wlan", "module.sd-reader", "module.typec", "module.internal-antenna", "storage.m2-ssd"):
            self.assertEqual(self.by_id[component_id]["configuration_status"], "optional_configuration_item")
        self.assertIsNone(self.claims["claim.system.configuration"]["value"])

    def test_unknown_dimensions_remain_unknown(self):
        self.assertIsNone(self.claims["claim.motherboard.dimensions"]["value"])


if __name__ == "__main__":
    unittest.main()
