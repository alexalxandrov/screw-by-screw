import { test, expect } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

function makeGlb() {
  const json = strToU8(JSON.stringify({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "Comparison root", extras: { sbs_component_id: "root" }, children: [1] },
      { name: "Memory block", extras: { sbs_component_id: "memory" } }
    ]
  }));
  const paddedLength = Math.ceil(json.length / 4) * 4;
  const buffer = new ArrayBuffer(20 + paddedLength);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(buffer, 20, json.length).set(json);
  new Uint8Array(buffer, 20 + json.length, paddedLength - json.length).fill(0x20);
  return new Uint8Array(buffer);
}

function makeComparisonPackage() {
  const modelId = "gpu.example.comparison-candidate";
  const manifest = {
    format: "sbs-model",
    schema_version: "1.0.0",
    model_id: modelId,
    files: {
      model: "model.json", scene: "scene.glb", components: "components.json", sources: "sources.json",
      relationships: "relationships.json", claims: "claims.json", process_layers: "process_layers.json",
      assembly_steps: "assembly_steps.json", learning: "learning.json", animations: "animations.json"
    }
  };
  const data = {
    model: {
      id: modelId,
      manufacturer: "Example Hardware",
      product_name: "Comparison Candidate GPU",
      part_number: "EXAMPLE-8GB-001",
      geometry_status: "illustrative_proxy_not_cad",
      coordinate_system: { units: "mm" },
      specifications: {
        memory: { capacity_gb: 8, type: "GDDR6" },
        cooling: { fan_count: 2 }
      },
      source_ids: ["src.comparison.spec"]
    },
    components: {
      device_model_id: modelId,
      components: [
        { id: "root", parent_id: null, source_ids: ["src.comparison.spec"] },
        { id: "memory", parent_id: "root", source_ids: [] }
      ]
    },
    sources: {
      sources: [{
        id: "src.comparison.spec",
        title: "Candidate specification sheet",
        url: "https://example.invalid/candidate-spec"
      }]
    },
    relationships: { device_model_id: modelId, relationships: [] },
    claims: {
      device_model_id: modelId,
      claims: [{
        id: "claim.comparison.memory",
        subject_id: modelId,
        predicate: "memory_capacity",
        value: 8,
        unit: "GB",
        confidence_class: "manufacturer_data",
        source_ids: ["src.comparison.spec"]
      }]
    },
    process_layers: { device_model_id: modelId, process_layers: [] },
    assembly_steps: { steps: [], observations: [] },
    learning: { questions: [] },
    animations: { clips: [] }
  };
  const entries = {
    "sbs-model.json": strToU8(JSON.stringify(manifest)),
    "model.json": strToU8(JSON.stringify(data.model)),
    "scene.glb": makeGlb(),
    "components.json": strToU8(JSON.stringify(data.components)),
    "sources.json": strToU8(JSON.stringify(data.sources)),
    "relationships.json": strToU8(JSON.stringify(data.relationships)),
    "claims.json": strToU8(JSON.stringify(data.claims)),
    "process_layers.json": strToU8(JSON.stringify(data.process_layers)),
    "assembly_steps.json": strToU8(JSON.stringify(data.assembly_steps)),
    "learning.json": strToU8(JSON.stringify(data.learning)),
    "animations.json": strToU8(JSON.stringify(data.animations))
  };
  return zipSync(entries, { level: 6 });
}

test("compares a second validated package without replacing the active 3D model", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  const originalComponentCount = (await page.locator("#component-count").textContent())?.trim();
  const originalSku = (await page.locator("#model-sku").textContent())?.trim();
  expect(originalComponentCount).toBeTruthy();

  await page.locator('.view-tab[data-mode="compare"]').click();
  await expect(page.locator("#comparison-panel")).toBeVisible();
  await expect(page.locator('.comparison-identity-card[data-side="a"]')).toBeVisible();

  const archive = makeComparisonPackage();
  await page.locator("#comparison-file").setInputFiles({
    name: "example-comparison.sbsmodel",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(archive)
  });

  await expect(page.locator("#comparison-status")).toContainText("example-comparison.sbsmodel");
  await expect(page.locator("#comparison-identities")).toContainText("EXAMPLE-8GB-001");
  await expect(page.locator("#comparison-identities")).toContainText("Comparison Candidate GPU");

  const capacity = page.locator('#comparison-specification-list [data-comparison-key="memory.capacity_gb"]');
  await expect(capacity).toContainText("12");
  await expect(capacity).toContainText("8");
  await expect(capacity.locator(".comparison-status")).toHaveAttribute("data-status", "different");

  const claim = page.locator('#comparison-claim-list [data-comparison-key="memory_capacity"]');
  await expect(claim).toContainText("manufacturer_data");
  await expect(claim).toContainText("Candidate specification sheet");
  await expect(claim.locator(".comparison-sources")).toHaveCount(2);
  await expect(claim.locator(".comparison-sources").first()).toBeVisible();

  await expect(page.locator("#comparison-coverage .comparison-summary-item")).toHaveCount(3);
  await expect(page.locator("#model-sku")).toHaveText(originalSku ?? "");
  await expect(page.locator("#component-count")).toHaveText(originalComponentCount ?? "");

  await page.locator("#compare-clear-model").click();
  await expect(page.locator("#comparison-status")).toContainText(/Загрузите проверенный пакет|Load a validated/);
  await expect(page.locator("#comparison-claim-list")).toBeEmpty();
});
