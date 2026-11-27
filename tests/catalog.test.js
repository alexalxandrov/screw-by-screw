import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogAdapter } from "../src/data/catalog.js";

function sampleCatalog() {
  return {
    schema_version: "1.0.0",
    title: { en: "Model library", ru: "Библиотека моделей" },
    categories: [{ id: "graphics_cards", label: { en: "Graphics cards", ru: "Видеокарты" } }],
    models: [{
      id: "gpu.vendor.part-001",
      manufacturer: "Vendor",
      name: { en: "Test GPU", ru: "Тестовая видеокарта" },
      part_number: "PART-001",
      category_id: "graphics_cards",
      summary: { en: "Test description", ru: "Описание теста" },
      tags: ["GPU", "test"],
      status: "research_blockout",
      geometry_status: "illustrative_proxy_not_cad",
      package_version: "0.1.0",
      package_path: "models/test.sbsmodel"
    }]
  };
}

test("normalizes bilingual entries and preserves the internal package model ID", () => {
  const data = sampleCatalog();
  data.models[0].published = true;
  data.models[0].default_package = true;
  data.models[0].package_model_id = "internal.package.id";
  const catalog = createCatalogAdapter(data, { defaultPackageModelId: "internal.package.id" });
  assert.equal(catalog.models.length, 1);
  assert.equal(catalog.models[0].name.ru, "Тестовая видеокарта");
  assert.equal(catalog.models[0].packagePath, "models/test.sbsmodel");
  assert.equal(catalog.models[0].packageModelId, "internal.package.id");
  assert.equal(catalog.models[0].defaultPackage, true);
  assert.equal(catalog.models[0].published, true);
  assert.equal(catalog.models[0].category.en, "Graphics cards");
});

test("preserves only explicit publication flags and defaults missing flags to unpublished", () => {
  const published = sampleCatalog();
  published.models[0].published = true;
  assert.equal(createCatalogAdapter(published).models[0].published, true);

  const archived = sampleCatalog();
  archived.models[0].published = false;
  assert.equal(createCatalogAdapter(archived).models[0].published, false);

  const unspecified = sampleCatalog();
  assert.equal(createCatalogAdapter(unspecified).models[0].published, false);

  const invalid = sampleCatalog();
  invalid.models[0].published = "false";
  assert.throws(() => createCatalogAdapter(invalid), /published must be a boolean/);
});

test("uses the application model ID for a default package without an explicit package binding", () => {
  const data = sampleCatalog();
  data.models[0].default_package = true;
  const catalog = createCatalogAdapter(data, { defaultPackageModelId: "internal.package.id" });
  assert.equal(catalog.models[0].packageModelId, "internal.package.id");
});

test("rejects duplicate catalogue IDs and duplicate exact manufacturer SKUs", () => {
  const duplicateSku = sampleCatalog();
  duplicateSku.models.push({ ...duplicateSku.models[0], id: "gpu.vendor.part-002" });
  assert.throws(() => createCatalogAdapter(duplicateSku), /duplicate manufacturer\/part number/);

  const duplicateId = sampleCatalog();
  duplicateId.models.push({ ...duplicateId.models[0] });
  assert.throws(() => createCatalogAdapter(duplicateId), /duplicate model ID/);
});

test("rejects unsafe paths, absolute paths and URL-based package references", () => {
  for (const package_path of [
    "../outside.sbsmodel",
    "/tmp/device.sbsmodel",
    "models\\device.sbsmodel",
    "https://example.invalid/device.sbsmodel",
    "models/%2e%2e/device.sbsmodel"
  ]) {
    const data = sampleCatalog();
    data.models[0].package_path = package_path;
    assert.throws(() => createCatalogAdapter(data), /safe relative/);
  }
});

test("rejects unknown categories, missing geometry evidence and unsupported schema versions", () => {
  const category = sampleCatalog();
  category.models[0].category_id = "missing";
  assert.throws(() => createCatalogAdapter(category), /unknown category/);

  const geometry = sampleCatalog();
  delete geometry.models[0].geometry_status;
  assert.throws(() => createCatalogAdapter(geometry), /geometry_status/);

  const version = sampleCatalog();
  version.schema_version = "9.0.0";
  assert.throws(() => createCatalogAdapter(version), /unsupported schema_version/);
});

test("rejects multiple default packages and a default ID that differs from the application model", () => {
  const multiple = sampleCatalog();
  multiple.models[0].default_package = true;
  multiple.models.push({
    ...multiple.models[0],
    id: "gpu.vendor.part-002",
    part_number: "PART-002",
    package_model_id: "internal.package.other"
  });
  assert.throws(() => createCatalogAdapter(multiple, { defaultPackageModelId: "internal.package.id" }), /only one default/);

  const mismatch = sampleCatalog();
  mismatch.models[0].default_package = true;
  mismatch.models[0].package_model_id = "internal.package.other";
  assert.throws(() => createCatalogAdapter(mismatch, { defaultPackageModelId: "internal.package.id" }), /does not match/);
});
