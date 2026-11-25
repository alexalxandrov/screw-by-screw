const EXCLUDED_SPEC_KEYS = new Set([
  "source_ids", "sources", "notes", "license_status", "url", "author", "publisher"
]);

function assertPackage(data, side) {
  if (!data || typeof data !== "object" || !data.model || typeof data.model.id !== "string" || !data.model.id) {
    throw new TypeError(side + " model package is missing a stable model ID");
  }
  if (data.model.specifications !== undefined &&
      (!data.model.specifications || typeof data.model.specifications !== "object" || Array.isArray(data.model.specifications))) {
    throw new TypeError(side + " model package specifications are invalid");
  }
  if (!Array.isArray(data.components?.components)) throw new TypeError(side + " component inventory is invalid");
  if (!Array.isArray(data.claims?.claims)) throw new TypeError(side + " claims are invalid");
  if (!Array.isArray(data.sources?.sources)) throw new TypeError(side + " sources are invalid");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenSpecifications(value, prefix = "", output = {}) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    if (prefix) output[prefix] = value;
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    if (EXCLUDED_SPEC_KEYS.has(key) || child === undefined) continue;
    const path = prefix ? prefix + "." + key : key;
    if (isPlainObject(child)) flattenSpecifications(child, path, output);
    else output[path] = child;
  }
  return output;
}

function canonicalValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (isPlainObject(value)) {
    const sorted = Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]));
    return JSON.stringify(sorted);
  }
  return String(value);
}

function valueStatus(left, right, leftPresent = true, rightPresent = true) {
  if (!leftPresent) return "not_recorded_left";
  if (!rightPresent) return "not_recorded_right";
  const leftUnknown = left === null || left === undefined;
  const rightUnknown = right === null || right === undefined;
  if (leftUnknown && rightUnknown) return "unknown_both";
  if (leftUnknown) return "unknown_left";
  if (rightUnknown) return "unknown_right";
  return canonicalValue(left) === canonicalValue(right) ? "same" : "different";
}

function identityOf(data) {
  const model = data.model;
  const specifications = model.specifications ?? {};
  const pcbClaim = (data.claims?.claims ?? []).find((claim) => claim.predicate === "pcb_revision");
  return {
    id: model.id,
    manufacturer: model.manufacturer ?? "",
    name: model.display_name ?? model.product_name ?? model.name ?? model.id,
    part_number: model.part_number ?? "",
    geometry_status: model.geometry_status ?? "unknown",
    pcb_revision: pcbClaim?.value ?? specifications.pcb_revision ?? null
  };
}

function claimSubjectKey(claim, modelId) {
  return claim.subject_id === modelId ? "@model" : String(claim.subject_id ?? "@unknown");
}

function sourceMap(data) {
  return new Map((data.sources?.sources ?? []).map((source) => [
    source.id,
    { label: source.title ?? source.label ?? source.id, url: source.url ?? "" }
  ]));
}

function claimGroups(data) {
  const groups = new Map();
  for (const claim of data.claims?.claims ?? []) {
    const key = claimSubjectKey(claim, data.model.id) + "\u0000" + String(claim.predicate ?? "");
    const values = groups.get(key) ?? [];
    values.push(claim);
    groups.set(key, values);
  }
  for (const values of groups.values()) values.sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
  return groups;
}

function claimSources(claim, labels) {
  return (claim?.source_ids ?? []).map((id) => {
    const source = labels.get(id);
    return { id, label: source?.label ?? id, url: source?.url ?? "" };
  });
}

function compareClaims(leftData, rightData) {
  const leftGroups = claimGroups(leftData);
  const rightGroups = claimGroups(rightData);
  const leftSources = sourceMap(leftData);
  const rightSources = sourceMap(rightData);
  const keys = [...new Set([...leftGroups.keys(), ...rightGroups.keys()])].sort();
  const result = [];

  for (const key of keys) {
    const left = leftGroups.get(key) ?? [];
    const right = rightGroups.get(key) ?? [];
    const count = Math.max(left.length, right.length);
    for (let index = 0; index < count; index += 1) {
      const a = left[index] ?? null;
      const b = right[index] ?? null;
      const predicate = a?.predicate ?? b?.predicate ?? "";
      const subject = a?.subject_id ?? b?.subject_id ?? "";
      result.push({
        key: key + ":" + index,
        id_left: a?.id ?? null,
        id_right: b?.id ?? null,
        subject_id_left: a?.subject_id ?? null,
        subject_id_right: b?.subject_id ?? null,
        predicate,
        value_left: a?.value ?? null,
        value_right: b?.value ?? null,
        unit_left: a?.unit ?? null,
        unit_right: b?.unit ?? null,
        evidence_left: a?.confidence_class ?? "not_recorded",
        evidence_right: b?.confidence_class ?? "not_recorded",
        notes_left: a?.notes ?? null,
        notes_right: b?.notes ?? null,
        sources_left: claimSources(a, leftSources),
        sources_right: claimSources(b, rightSources),
        status: valueStatus(a?.value, b?.value, Boolean(a), Boolean(b)),
        subject_key: subject
      });
    }
  }
  return result;
}

function componentCoverage(leftData, rightData) {
  const left = new Set(leftData.components.components.map((component) => component.id));
  const right = new Set(rightData.components.components.map((component) => component.id));
  return {
    shared_count: [...left].filter((id) => right.has(id)).length,
    left_only_ids: [...left].filter((id) => !right.has(id)).sort(),
    right_only_ids: [...right].filter((id) => !left.has(id)).sort(),
    left_count: left.size,
    right_count: right.size,
    interpretation: "Differences describe package inventory coverage only. They do not prove a physical component is absent from either device."
  };
}

/**
 * Compare only source-backed semantic package data. Geometry, meshes, transforms
 * and physical absence are deliberately outside this report.
 */
export function compareModelPackages(leftData, rightData) {
  assertPackage(leftData, "Left");
  assertPackage(rightData, "Right");

  const leftSpecifications = flattenSpecifications(leftData.model.specifications ?? {});
  const rightSpecifications = flattenSpecifications(rightData.model.specifications ?? {});
  const specificationPaths = [...new Set([
    ...Object.keys(leftSpecifications),
    ...Object.keys(rightSpecifications)
  ])].sort();

  const specifications = specificationPaths.map((path) => {
    const leftPresent = Object.hasOwn(leftSpecifications, path);
    const rightPresent = Object.hasOwn(rightSpecifications, path);
    const leftValue = leftPresent ? leftSpecifications[path] : null;
    const rightValue = rightPresent ? rightSpecifications[path] : null;
    return {
      path,
      left: leftPresent ? leftValue : null,
      right: rightPresent ? rightValue : null,
      status: valueStatus(leftValue, rightValue, leftPresent, rightPresent)
    };
  });

  const claims = compareClaims(leftData, rightData);
  const countStatuses = (rows, status) => rows.filter((row) => row.status === status).length;

  return {
    format: "sbs-model-comparison",
    schema_version: "1.0.0",
    comparison_scope: "semantic_package_metadata_only",
    left: identityOf(leftData),
    right: identityOf(rightData),
    specifications,
    claims,
    component_coverage: componentCoverage(leftData, rightData),
    summary: {
      specifications_same: countStatuses(specifications, "same"),
      specifications_different: countStatuses(specifications, "different"),
      specifications_unknown: specifications.filter((row) => row.status.startsWith("unknown")).length,
      specifications_not_recorded: countStatuses(specifications, "not_recorded_left") + countStatuses(specifications, "not_recorded_right"),
      claims_same: countStatuses(claims, "same"),
      claims_different: countStatuses(claims, "different"),
      claims_unknown: claims.filter((row) => row.status.startsWith("unknown")).length,
      claims_not_recorded: claims.filter((row) => row.status.startsWith("not_recorded")).length
    },
    limitations: [
      "Comparison is limited to the two validated semantic packages; it is not a hardware inspection.",
      "Unknown values remain unknown and are not inferred from another SKU or PCB revision.",
      "A value missing from one package means not recorded in that package, not physically absent from the device.",
      "Component inventory differences describe package coverage only, not confirmed physical additions or removals.",
      "3D geometry, CAD, BoardView, PCB routing and physical fitment are not compared."
    ]
  };
}

export const MODEL_COMPARISON_FORMAT = "sbs-model-comparison";
