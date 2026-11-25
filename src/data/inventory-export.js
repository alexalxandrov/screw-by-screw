const FORMAT = "sbs-semantic-inventory";
const VERSION = "1.0.0";

function records(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new TypeError(field + " must be an array");
  return value;
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function csvEscape(value) {
  const text = csvValue(value);
  return /[",\r\n;]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}

export function recordsToCsv(rows, fallbackColumns = []) {
  if (!Array.isArray(rows)) throw new TypeError("CSV rows must be an array");
  const columns = [...new Set([
    ...fallbackColumns,
    ...rows.flatMap((row) => Object.keys(row ?? {}))
  ])];
  if (!columns.length) return "\uFEFF";
  const lines = [columns.map(csvEscape).join(";")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row?.[column])).join(";"));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

function localizedFields(value, prefix) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { [prefix + "_ru"]: "", [prefix + "_en"]: typeof value === "string" ? value : "" };
  }
  return {
    [prefix + "_ru"]: value.ru ?? value.en ?? "",
    [prefix + "_en"]: value.en ?? value.ru ?? ""
  };
}

/**
 * Build a semantic-only snapshot. Geometry is intentionally excluded: this
 * export is an inventory and evidence interchange format, never a BOM/CAD file.
 */
export function createSemanticInventory(packageData, { generatedAt = new Date().toISOString() } = {}) {
  if (!packageData || typeof packageData !== "object" || Array.isArray(packageData)) {
    throw new TypeError("A model package object is required");
  }
  const model = packageData.model;
  if (!model || typeof model !== "object" || typeof model.id !== "string" || !model.id) {
    throw new TypeError("The model package needs a model ID");
  }

  const components = records(packageData.components?.components, "components.components");
  const sources = records(packageData.sources?.sources, "sources.sources");
  const relationships = records(packageData.relationships?.relationships, "relationships.relationships");
  const claims = records(packageData.claims?.claims, "claims.claims");
  const processLayers = records(packageData.process_layers?.process_layers, "process_layers.process_layers");
  const assemblySteps = records(packageData.assembly_steps?.steps, "assembly_steps.steps");
  const observations = records(packageData.assembly_steps?.observations, "assembly_steps.observations");
  const questions = records(packageData.learning?.questions, "learning.questions");
  const clips = records(packageData.animations?.clips, "animations.clips");

  return {
    format: FORMAT,
    schema_version: VERSION,
    generated_at: generatedAt,
    model,
    scope: {
      type: "semantic_inventory",
      includes: [
        "model identity and specifications",
        "component inventory and evidence labels",
        "registered sources and technical claims",
        "typed relationships and process layers",
        "authored assembly steps and source observations",
        "learning questions and package-authored animations"
      ],
      excludes: ["3D scene geometry", "CAD", "BoardView", "complete physical BOM"],
      limitations: [
        "This export is not a bill of materials or a purchasing list.",
        "Candidate and illustrative components must not be treated as confirmed PCB population.",
        "Evidence classes and unknown values are preserved as authored in the package."
      ]
    },
    counts: {
      components: components.length,
      sources: sources.length,
      relationships: relationships.length,
      claims: claims.length,
      process_layers: processLayers.length,
      assembly_steps: assemblySteps.length,
      source_observations: observations.length,
      learning_questions: questions.length,
      animation_clips: clips.length
    },
    components,
    sources,
    relationships,
    claims,
    process_layers: processLayers,
    assembly_steps: { steps: assemblySteps, observations },
    learning: { questions },
    animations: { clips },
    release: packageData.release ?? null
  };
}

export function createInventoryCsvFiles(inventory) {
  if (!inventory || inventory.format !== FORMAT || inventory.schema_version !== VERSION) {
    throw new TypeError("A supported semantic inventory is required");
  }

  const components = inventory.components.map((component) => ({
    ...component,
    ...localizedFields(component.name, "name"),
    ...localizedFields(component.description, "description")
  }));
  const claims = inventory.claims;
  const relationships = inventory.relationships;
  const sources = inventory.sources;
  const processLayers = inventory.process_layers;
  const steps = inventory.assembly_steps.steps;
  const observations = inventory.assembly_steps.observations;
  const questions = inventory.learning.questions;
  const clips = inventory.animations.clips;

  return {
    "components.csv": recordsToCsv(components, [
      "id", "parent_id", "category", "name_ru", "name_en", "description_ru", "description_en",
      "evidence_status", "geometry_status", "source_ids"
    ]),
    "claims.csv": recordsToCsv(claims, ["id", "subject_id", "predicate", "value", "unit", "confidence_class", "source_ids", "notes"]),
    "relationships.csv": recordsToCsv(relationships, ["id", "from", "to", "type", "certainty", "source_ids"]),
    "sources.csv": recordsToCsv(sources, ["id", "title", "url", "publisher", "author", "published_at", "accessed_at", "license", "rights_status", "applicability"]),
    "process_layers.csv": recordsToCsv(processLayers, ["id", "type", "title", "description", "linked_component_ids", "source_ids", "assumptions"]),
    "assembly_steps.csv": recordsToCsv(steps, ["id", "sequence", "title", "action", "description", "component_ids", "prerequisite_step_ids", "tool_requirements", "safety_notes", "source_ids"]),
    "source_observations.csv": recordsToCsv(observations, ["source_id", "locator", "note"]),
    "learning_questions.csv": recordsToCsv(questions, ["id", "prompt", "choices", "correct_choice", "explanation", "component_ids", "source_ids"]),
    "animation_clips.csv": recordsToCsv(clips, ["id", "title", "duration_ms", "easing", "evidence_status", "source_ids", "tracks"])
  };
}

export const SEMANTIC_INVENTORY_FORMAT = FORMAT;
export const SEMANTIC_INVENTORY_VERSION = VERSION;
