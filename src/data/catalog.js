const SAFE_ID = /^[a-z0-9][a-z0-9._-]{1,127}$/;
const IDENTITY_SCOPES = new Set(["exact_sku", "platform_family", "physical_sample", "reference_configuration"]);
const MODEL_KINDS = new Set(["system", "assembly", "component", "device"]);

function fail(message) {
  throw new TypeError("Invalid model catalogue: " + message);
}

function localized(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(field + " must contain localized labels");
  const en = typeof value.en === "string" ? value.en.trim() : "";
  const ru = typeof value.ru === "string" ? value.ru.trim() : "";
  if (!en && !ru) fail(field + " must contain English or Russian text");
  return { en: en || ru, ru: ru || en };
}

function safePackagePath(value) {
  if (typeof value !== "string" || !value.endsWith(".sbsmodel") ||
      value.startsWith("/") || value.includes(String.fromCharCode(92)) ||
      /^[a-z]+:/i.test(value) ||
      value.split("/").some((part) => !part || part === "." || part === ".." || part.includes("%") || part.includes("?") || part.includes("#"))) {
    fail("package_path must be a safe relative .sbsmodel path");
  }
  return value;
}

export function createCatalogAdapter(data, { defaultPackageModelId = "" } = {}) {
  if (!data || data.schema_version !== "1.0.0") fail("unsupported schema_version");
  if (!Array.isArray(data.categories) || !Array.isArray(data.models) || !data.models.length) {
    fail("categories and models must be non-empty arrays");
  }

  const categories = new Map();
  for (const category of data.categories) {
    if (!category || typeof category.id !== "string" || !SAFE_ID.test(category.id)) fail("category ID is invalid");
    if (categories.has(category.id)) fail("duplicate category ID: " + category.id);
    categories.set(category.id, { id: category.id, label: localized(category.label, "category " + category.id) });
  }

  const ids = new Set();
  const packageIds = new Set();
  const exactSkus = new Set();
  let defaultCount = 0;
  const models = data.models.map((item) => {
    if (!item || typeof item !== "object") fail("model entry must be an object");
    if (typeof item.id !== "string" || !SAFE_ID.test(item.id)) fail("model ID is invalid");
    if (ids.has(item.id)) fail("duplicate model ID: " + item.id);
    ids.add(item.id);

    const manufacturer = typeof item.manufacturer === "string" ? item.manufacturer.trim() : "";
    const partNumber = typeof item.part_number === "string" ? item.part_number.trim() : "";
    const identityScope = typeof item.identity_scope === "string" ? item.identity_scope : "exact_sku";
    const modelKind = typeof item.model_kind === "string" ? item.model_kind : "device";
    if (!manufacturer) fail("manufacturer is required for " + item.id);
    if (!IDENTITY_SCOPES.has(identityScope)) fail("identity_scope is invalid for " + item.id);
    if (!MODEL_KINDS.has(modelKind)) fail("model_kind is invalid for " + item.id);
    if (identityScope === "exact_sku" && !partNumber) {
      fail("part_number is required for exact_sku model " + item.id);
    }
    if (partNumber) {
      const sku = manufacturer.toLocaleLowerCase("en") + "|" + partNumber.toLocaleLowerCase("en");
      if (exactSkus.has(sku)) fail("duplicate manufacturer/part number: " + manufacturer + " " + partNumber);
      exactSkus.add(sku);
    }

    if (!categories.has(item.category_id)) fail("unknown category for " + item.id);
    if (typeof item.status !== "string" || !item.status.trim()) fail("status is required for " + item.id);
    if (typeof item.geometry_status !== "string" || !item.geometry_status.trim()) fail("geometry_status is required for " + item.id);
    if (typeof item.package_version !== "string" || !item.package_version.trim()) fail("package_version is required for " + item.id);
    if (!Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== "string" || !tag.trim())) fail("tags must be strings for " + item.id);

    const packageModelId = typeof item.package_model_id === "string" && item.package_model_id.trim()
      ? item.package_model_id.trim()
      : item.default_package === true ? defaultPackageModelId : item.id;
    if (!SAFE_ID.test(packageModelId)) fail("package_model_id is invalid for " + item.id);
    if (packageIds.has(packageModelId)) fail("duplicate package_model_id: " + packageModelId);
    packageIds.add(packageModelId);
    if (item.default_package === true) defaultCount += 1;

    return {
      id: item.id,
      packageModelId,
      defaultPackage: item.default_package === true,
      manufacturer,
      name: localized(item.name, "model " + item.id + " name"),
      partNumber,
      identityScope,
      modelKind,
      categoryId: item.category_id,
      category: categories.get(item.category_id).label,
      summary: localized(item.summary, "model " + item.id + " summary"),
      tags: [...new Set(item.tags.map((tag) => tag.trim()))],
      status: item.status,
      geometryStatus: item.geometry_status,
      packageVersion: item.package_version,
      packagePath: safePackagePath(item.package_path)
    };
  });

  if (defaultCount > 1) fail("only one default package may be declared");
  if (defaultCount === 1 && models.filter((item) => item.defaultPackage)[0].packageModelId !== defaultPackageModelId) {
    fail("default package model ID does not match the application model");
  }

  return { title: localized(data.title, "catalog title"), categories: [...categories.values()], models };
}
