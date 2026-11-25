import test from "node:test";
import assert from "node:assert/strict";
import {
  createInventoryCsvFiles,
  createSemanticInventory,
  recordsToCsv,
  SEMANTIC_INVENTORY_FORMAT
} from "../src/data/inventory-export.js";

function samplePackage() {
  return {
    model: {
      id: "device.sample",
      manufacturer: "Example",
      name: "Test device",
      geometry_status: "illustrative_proxy_not_cad",
      specifications: { pcb_revision: null }
    },
    components: { components: [
      { id: "board", parent_id: null, name: { ru: "Плата", en: "Board" }, evidence_status: "visible_exact_model", source_ids: ["src.one"] },
      { id: "candidate", parent_id: "board", name: { ru: "Кандидат, условный", en: "Illustrative candidate" }, evidence_status: "candidate", source_ids: [] }
    ] },
    sources: { sources: [{ id: "src.one", title: "Source", url: "https://example.invalid" }] },
    relationships: { relationships: [{ id: "rel.one", from: "board", to: "candidate", type: "contains", source_ids: ["src.one"] }] },
    claims: { claims: [{ id: "claim.one", subject_id: "candidate", predicate: "population", value: null, confidence_class: "unknown", source_ids: [] }] },
    process_layers: { process_layers: [{ id: "layer.one", type: "cooling", linked_component_ids: ["board"] }] },
    assembly_steps: { steps: [], observations: [{ source_id: "src.one", locator: "01:30", note: { ru: "Наблюдение", en: "Observation" } }] },
    learning: { questions: [{ id: "q.one", prompt: { ru: "Вопрос?", en: "Question?" } }] },
    animations: { clips: [{ id: "clip.one", duration_ms: 500, evidence_status: "educational_approximation" }] },
    release: { version: "0.1.0", status: "draft" }
  };
}

test("creates a semantic inventory while retaining unknowns and evidence classes", () => {
  const inventory = createSemanticInventory(samplePackage(), { generatedAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(inventory.format, SEMANTIC_INVENTORY_FORMAT);
  assert.equal(inventory.model.specifications.pcb_revision, null);
  assert.equal(inventory.components[1].evidence_status, "candidate");
  assert.equal(inventory.claims[0].value, null);
  assert.equal(inventory.counts.components, 2);
  assert.equal(inventory.counts.source_observations, 1);
  assert.equal(inventory.generated_at, "2026-01-01T00:00:00.000Z");
  assert.equal("scene" in inventory, false);
  assert.equal("geometry" in inventory, false);
  assert.match(inventory.scope.limitations[0], /not a bill of materials/i);
});

test("exports separate CSV tables with UTF-8 BOM and localized component labels", () => {
  const inventory = createSemanticInventory(samplePackage());
  const files = createInventoryCsvFiles(inventory);
  assert.deepEqual(Object.keys(files), [
    "components.csv", "claims.csv", "relationships.csv", "sources.csv", "process_layers.csv",
    "assembly_steps.csv", "source_observations.csv", "learning_questions.csv", "animation_clips.csv"
  ]);
  assert.ok(files["components.csv"].startsWith("\uFEFF"));
  assert.match(files["components.csv"], /Плата/);
  assert.match(files["components.csv"], /Illustrative candidate/);
  assert.match(files["claims.csv"], /unknown/);
  assert.match(files["source_observations.csv"], /01:30/);
});

test("CSV escaping preserves delimiters, quotes and line breaks", () => {
  const csv = recordsToCsv([{ label: 'Part; "A"\nsecond line' }]);
  assert.equal(csv, '\uFEFFlabel\r\n"Part; ""A""\nsecond line"\r\n');
});

test("rejects incomplete package data and unsupported inventory input", () => {
  assert.throws(() => createSemanticInventory(null), /model package object/);
  assert.throws(() => createSemanticInventory({ model: {} }), /model ID/);
  assert.throws(() => createInventoryCsvFiles({ format: "other", schema_version: "1.0.0" }), /supported semantic inventory/);
});
