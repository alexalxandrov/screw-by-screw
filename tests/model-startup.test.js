import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [main, modelAdapter, catalog] = await Promise.all([
  readFile(new URL("../src/main.js", import.meta.url), "utf8"),
  readFile(new URL("../src/data/model.js", import.meta.url), "utf8"),
  readFile(new URL("../content/catalog/models.json", import.meta.url), "utf8")
]);

test("viewer bootstrap resolves its published default through the catalogue package loader", () => {
  assert.match(main, /catalogDefaultPackageModelId/);
  assert.match(main, /defaultPackageModelId: catalogDefaultPackageModelId/);
  assert.match(main, /tryLoadBundledModel\(\)/);
  assert.match(main, /loadModelPackage\(file\)/);
  assert.doesNotMatch(main, /content\/models\/evga-rtx3060/);
  assert.doesNotMatch(modelAdapter, /content\/models\/evga-rtx3060/);
});

test("IBM remains the only published default while OptiPlex remains a family-level archive", () => {
  const data = JSON.parse(catalog);
  assert.ok(data.categories.some((item) => item.id === "graphics_cards"));
  assert.ok(data.categories.some((item) => item.id === "desktop_computers"));

  const gpu = data.models.find((item) => item.id === "gpu.evga.12g-p5-3655-kr");
  const ibm = data.models.find((item) => item.id === "computer.ibm.5150.1981");
  const optiplex = data.models.find((item) => item.id === "pc.dell.optiplex-5060-tower.family");

  assert.equal(gpu.published, false);
  assert.equal(gpu.default_package, false);
  assert.equal(ibm.published, true);
  assert.equal(ibm.default_package, true);
  assert.equal(optiplex.published, false);
  assert.equal(optiplex.default_package, false);
  assert.equal(optiplex.model_kind, "system");
  assert.equal(optiplex.identity_scope, "platform_family");
  assert.equal(optiplex.part_number, null);
  assert.equal(optiplex.package_version, "0.3.0");
});
