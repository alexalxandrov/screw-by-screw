import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { strToU8, zipSync } from "fflate";

const modelId = "test.portable-device";

function makeGlb() {
  const document = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "Main assembly", extras: { sbs_component_id: "root" }, children: [1] },
      { name: "Fan module", extras: { sbs_component_id: "fan" } }
    ]
  };
  const json = strToU8(JSON.stringify(document));
  const padded = Math.ceil(json.length / 4) * 4;
  const bytes = new Uint8Array(20 + padded);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.byteLength, true);
  view.setUint32(12, padded, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(json, 20);
  bytes.fill(0x20, 20 + json.length);
  return bytes;
}

function makePackage({ withAnimation = false } = {}) {
  const manifest = {
    format: "sbs-model", schema_version: "1.0.0", model_id: modelId, package_version: "1.0.0",
    files: { model: "model.json", scene: "scene.glb", components: "components.json", sources: "sources.json",
      relationships: "relationships.json", claims: "claims.json", process_layers: "process_layers.json",
      assembly_steps: "assembly_steps.json", learning: "learning.json", animations: "animations.json" }
  };
  const data = {
    "model.json": { id: modelId, manufacturer: "Test Labs", product_name: "Portable test device", display_name: "Portable test device", part_number: "TEST-001", geometry_status: "illustrative_proxy_not_cad", source_ids: ["src.one"] },
    "components.json": { device_model_id: modelId, components: [
      { id: "root", parent_id: null, name: { en: "Main assembly", ru: "Главный узел" }, category: "assembly", evidence_status: "illustrative", geometry_status: "assembly_node", source_ids: [], description: { en: "Test root", ru: "Тестовый корень" } },
      { id: "fan", parent_id: "root", name: { en: "Fan module", ru: "Модуль вентилятора" }, category: "mechanical", evidence_status: "illustrative", geometry_status: "proxy", source_ids: ["src.one"], description: { en: "A test fan", ru: "Тестовый вентилятор" } }
    ] },
    "sources.json": { sources: [{ id: "src.one", title: "Test source", url: "https://example.com", publisher: "Test" }] },
    "relationships.json": { device_model_id: modelId, relationships: [{ id: "rel.one", from: "root", to: "fan", type: "contains", source_ids: ["src.one"] }] },
    "claims.json": { device_model_id: modelId, claims: [] },
    "process_layers.json": { device_model_id: modelId, process_layers: [{ id: "layer.cooling", type: "cooling", title: { en: "Cooling", ru: "Охлаждение" }, description: { en: "Air movement", ru: "Движение воздуха" }, linked_component_ids: ["fan"], source_ids: ["src.one"], assumptions: [] }] },
    "assembly_steps.json": { steps: [] },
    "learning.json": { questions: [] },
    "animations.json": { clips: withAnimation ? [{
      id: "clip.fan.rotation",
      title: { en: "Fan rotation", ru: "Вращение вентилятора" },
      duration_ms: 4000,
      easing: "linear",
      evidence_status: "educational_approximation",
      accuracy_note: { en: "Illustrative clip for a loader integration test.", ru: "Условный клип для интеграционного теста загрузчика." },
      source_ids: ["src.one"],
      tracks: [{ target_id: "fan", property: "rotation", keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [0, 0, 6.283185307179586] }] }]
    }] : [] }
  };
  const entries = { "sbs-model.json": strToU8(JSON.stringify(manifest)), "scene.glb": makeGlb() };
  for (const [name, value] of Object.entries(data)) entries[name] = strToU8(JSON.stringify(value));
  return zipSync(entries);
}

test("opens a complete .sbsmodel package and binds its metadata to the GLB scene", async ({ page }) => {
  await page.goto("/");
  const buffer = Buffer.from(makePackage());
  await page.locator("#model-file").setInputFiles({ name: "portable-test.sbsmodel", mimeType: "application/zip", buffer });
  await expect(page.locator("#model-title")).toHaveText("Portable test device", { timeout: 10000 });
  await expect(page.locator("#model-sku")).toHaveText("TEST-001");
  await expect(page.locator("#component-count")).toHaveText("2");
  await expect(page.locator("#component-tree")).toContainText("Модуль вентилятора");
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");
  await expect(page.locator(".view-tab[data-mode=\"learn\"]")).toBeDisabled();
});


test("imports an .sbsmodel file after opening the root index.html directly", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(pathToFileURL(resolve(process.cwd(), "index.html")).href);

  await page.locator("#model-file").setInputFiles({
    name: "portable-test.sbsmodel",
    mimeType: "application/zip",
    buffer: Buffer.from(makePackage())
  });
  await expect(page.locator("#model-title")).toHaveText("Portable test device", { timeout: 10000 });
  await expect(page.locator("#component-count")).toHaveText("2");
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");
  expect(pageErrors).toEqual([]);
});


test("plays and seeks validated package-authored animation clips", async ({ page }) => {
  await page.goto("/");
  await page.locator("#model-file").setInputFiles({
    name: "animated-test.sbsmodel",
    mimeType: "application/zip",
    buffer: Buffer.from(makePackage({ withAnimation: true }))
  });
  await expect(page.locator("#model-title")).toHaveText("Portable test device", { timeout: 10000 });
  await expect(page.locator("#authored-animation-panel")).toBeVisible();
  await page.locator("#authored-animation-select").selectOption("clip.fan.rotation");
  await expect(page.locator("#authored-animation-play")).toBeEnabled();
  await expect(page.locator("#authored-animation-status")).toContainText("Остановлено");
  await page.locator("#authored-animation-play").click();
  await expect(page.locator("#authored-animation-status")).toContainText("Воспроизведение");
  await page.locator("#authored-animation-pause").click();
  await expect(page.locator("#authored-animation-status")).toContainText("Пауза");
  await page.locator("#authored-animation-seek").fill("750");
  await expect(page.locator("#authored-animation-time")).toContainText("3.0 / 4.0 s");
  await page.locator("#authored-animation-stop").click();
  await expect(page.locator("#authored-animation-time")).toContainText("0.0 / 4.0 s");
});

test("hides authored animation controls for models with no authored clips", async ({ page }) => {
  await page.goto("/");
  await page.locator("#model-file").setInputFiles({
    name: "static-test.sbsmodel",
    mimeType: "application/zip",
    buffer: Buffer.from(makePackage())
  });
  await expect(page.locator("#model-title")).toHaveText("Portable test device", { timeout: 10000 });
  await expect(page.locator("#authored-animation-panel")).toBeHidden();
});
