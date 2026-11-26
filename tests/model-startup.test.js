import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [main, modelAdapter, catalog] = await Promise.all([
  readFile(new URL("../src/main.js", import.meta.url), "utf8"),
  readFile(new URL("../src/data/model.js", import.meta.url), "utf8"),
  readFile(new URL("../content/catalog/models.json", import.meta.url), "utf8")
]);

test("viewer bootstrap resolves its initial model through the catalogue package loader", () => {
  assert.match(main, /find\(\(entry\) => entry\.default_package\)/);
  assert.match(main, /tryLoadBundledModel\(\)/);
  assert.match(main, /loadModelPackage\(file\)/);
  assert.doesNotMatch(main, /content\/models\/evga-rtx3060/);
  assert.doesNotMatch(modelAdapter, /content\/models\/evga-rtx3060/);
  assert.doesNotMatch(modelAdapter, /DEFAULT_ADAPTER/);
});

test("catalogue includes both the GPU component and the Dell desktop system family", () => {
  const data = JSON.parse(catalog);
  assert.ok(data.categories.some((item) => item.id === "graphics_cards"));
  assert.ok(data.categories.some((item) => item.id === "desktop_computers"));
  assert.ok(data.models.some((item) => item.id === "gpu.evga.12g-p5-3655-kr" && item.default_package));
  const pc = data.models.find((item) => item.id === "pc.dell.optiplex-5060-tower.family");
  assert.ok(pc);
  assert.equal(pc.model_kind, "system");
  assert.equal(pc.identity_scope, "platform_family");
  assert.equal(pc.part_number, null);
  assert.equal(pc.default_package, false);
});
