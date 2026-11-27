import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync(new URL("../content/catalog/models.json", import.meta.url), "utf8"));
const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

test("IBM remains the only default while Dell is published and RTX remains archived", () => {
  const defaults = catalog.models.filter((entry) => entry.default_package === true);
  assert.equal(defaults.length, 1);
  assert.equal(defaults[0].id, "computer.ibm.5150.1981");

  const ibm = catalog.models.find((entry) => entry.id === "computer.ibm.5150.1981");
  const dell = catalog.models.find((entry) => entry.id === "pc.dell.optiplex-5060-tower.family");
  const gpu = catalog.models.find((entry) => entry.id === "gpu.evga.12g-p5-3655-kr");
  assert.equal(ibm.published, true);
  assert.equal(dell.published, true);
  assert.equal(dell.default_package, false);
  assert.equal(dell.identity_scope, "platform_family");
  assert.equal(dell.model_kind, "system");
  assert.equal(dell.part_number, null);
  assert.equal(gpu.published, false);
  assert.equal(gpu.model_kind, "device");
  assert.equal(gpu.default_package, false);
});

test("default startup and catalogue selection share the validated package-loading path", () => {
  assert.match(mainSource, /const defaultEntry = MODEL_CATALOG\.models\.find\(\(entry\) => entry\.defaultPackage\)/);
  assert.match(mainSource, /const loaded = await fetchCatalogPackage\(defaultEntry\)/);
  assert.match(mainSource, /const modelPackage = await loadModelPackage\(file\)/);
  assert.match(mainSource, /modelPackage\.report\.modelId !== entry\.packageModelId/);
});
