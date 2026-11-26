import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadModelPackage } from "../src/viewer/ModelPackageLoader.js";

const packageBytes = await readFile(new URL("../public/models/dell_optiplex_5060_tower_v02.sbsmodel", import.meta.url));
const packageBuffer = packageBytes.buffer.slice(
  packageBytes.byteOffset,
  packageBytes.byteOffset + packageBytes.byteLength
);
const loaded = await loadModelPackage({
  name: "dell_optiplex_5060_tower_v02.sbsmodel",
  size: packageBytes.byteLength,
  arrayBuffer: async () => packageBuffer
});

test("OptiPlex reference package passes the production package loader and checksum verification", () => {
  assert.equal(loaded.report.modelId, "pc.dell.optiplex-5060-tower.family");
  assert.equal(loaded.report.componentCount, 127);
  assert.equal(loaded.report.relationshipCount, 135);
  assert.equal(loaded.integrityVerified, true);
  assert.equal(loaded.data.model.geometry_status, "illustrative_proxy_not_cad");
  assert.equal(loaded.data.model.specifications.physical.height_mm, 350);
  assert.equal(loaded.data.model.specifications.physical.width_mm, 154);
  assert.equal(loaded.data.model.specifications.physical.depth_mm, 274);
  assert.equal(loaded.data.components.components.filter((component) => component.category === "fastener" && component.fastener_population !== "optional_reference_not_fitted").length, 24);
  assert.equal(loaded.data.components.components.filter((component) => component.fastener_population === "optional_reference_not_fitted").length, 7);
  assert.equal(loaded.data.assembly_steps.observations.length, 14);
  assert.equal(loaded.data.model.specifications.service_hardware.optional_fastener_references, 7);
  assert.equal(loaded.data.claims.claims.find((claim) => claim.id === "claim.fasteners.optional_mounting").value.length, 5);
  assert.equal(loaded.data.model.specifications.service_hardware.physical_reference_instances, 24);
  assert.equal(loaded.data.sources.sources.length, 23);
  assert.equal(loaded.data.claims.claims.length, 31);
  assert.equal(loaded.data.process_layers.process_layers.length, 6);
  assert.equal(loaded.data.assembly_steps.steps.length, 12);
  assert.equal(loaded.data.learning.questions.length, 9);
  assert.equal(loaded.data.model.specifications.motherboard.numbered_callouts, 26);
  assert.equal(loaded.data.model.specifications.motherboard.callouts.length, 26);
  const callouts = loaded.data.model.specifications.motherboard.callouts;
  for (const component of loaded.data.components.components) {
    assert.ok(component.name?.ru, `missing Russian component name: ${component.id}`);
    assert.ok(component.description?.ru, `missing Russian component description: ${component.id}`);
    assert.match(component.description.ru, /[\\u0400-\\u04FF]/, `component description is not localized in Russian: ${component.id}`);
  }
  const componentIds = new Set(loaded.data.components.components.map((component) => component.id));
  assert.deepEqual(callouts.map((callout) => callout.number), Array.from({ length: 26 }, (_, index) => index + 1));
  assert.ok(callouts.every((callout) => callout.component_ids.length > 0 &&
    callout.component_ids.every((componentId) => componentIds.has(componentId))));
  const supportedRelationshipTypes = new Set([
    "contains", "mounted_in", "fastened_to", "connected_to", "powered_by",
    "signals_to", "cooled_by", "transfers_heat_to", "airflow_over", "depends_on"
  ]);
  assert.ok(loaded.data.relationships.relationships.every((relationship) =>
    supportedRelationshipTypes.has(relationship.type)));
  const componentIds = new Set(loaded.data.components.components.map((component) => component.id));
  const sourceIds = new Set(loaded.data.sources.sources.map((source) => source.id));
  assert.ok(sourceIds.has("src.dell.5060.m2_removal"));
  assert.ok(sourceIds.has("src.dell.5060.coin_cell_removal"));
  assert.ok(sourceIds.has("src.dell.5060.heatsink_fan_removal"));
  assert.ok(sourceIds.has("src.dell.5060.optical_drive_install"));
  assert.ok(sourceIds.has("src.dell.5060.optional_video_module"));
  const callouts = loaded.data.model.specifications.motherboard.callouts;
  assert.deepEqual(callouts.map((entry) => entry.number), Array.from({ length: 26 }, (_, index) => index + 1));
  assert.equal(callouts.reduce((count, entry) => count + entry.component_ids.length, 0), 29);
  for (const callout of callouts) {
    for (const componentId of callout.component_ids) assert.ok(componentIds.has(componentId), `unresolved callout ${callout.number}: ${componentId}`);
  }
  for (const component of loaded.data.components.components) {
    if (component.parent_id) assert.ok(componentIds.has(component.parent_id), `unresolved parent for ${component.id}`);
    for (const sourceId of component.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved source for ${component.id}`);
  }
  for (const relationship of loaded.data.relationships.relationships) {
    assert.ok(componentIds.has(relationship.from), `unresolved relationship source: ${relationship.id}`);
    assert.ok(componentIds.has(relationship.to), `unresolved relationship target: ${relationship.id}`);
    for (const sourceId of relationship.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved relationship evidence: ${relationship.id}`);
  }
  for (const layer of loaded.data.process_layers.process_layers) {
    for (const componentId of layer.linked_component_ids ?? []) assert.ok(componentIds.has(componentId), `unresolved process component: ${layer.id}`);
    for (const sourceId of layer.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved process evidence: ${layer.id}`);
  }
  const stepIds = new Set(loaded.data.assembly_steps.steps.map((step) => step.id));
  for (const step of loaded.data.assembly_steps.steps) {
    for (const componentId of step.component_ids ?? []) assert.ok(componentIds.has(componentId), `unresolved step component: ${step.id}`);
    for (const sourceId of step.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved step evidence: ${step.id}`);
    for (const prerequisite of step.prerequisite_step_ids ?? []) assert.ok(stepIds.has(prerequisite), `unresolved step prerequisite: ${step.id}`);
  }
  for (const claim of loaded.data.claims.claims) {
    assert.ok(componentIds.has(claim.subject_id) || claim.subject_id === loaded.data.model.id, `unresolved claim subject: ${claim.id}`);
    for (const sourceId of claim.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved claim evidence: ${claim.id}`);
  }
  for (const question of loaded.data.learning.questions) {
    for (const sourceId of question.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved learning evidence: ${question.id}`);
  }

  assert.deepEqual(loaded.data.model.specifications.motherboard.callouts.find((entry) => entry.number === 24).component_ids, ["motherboard.m2.wlan"]);
  assert.deepEqual(loaded.data.model.specifications.motherboard.callouts.find((entry) => entry.number === 25).component_ids, ["motherboard.coin_cell"]);
  const supportedCpus = loaded.data.model.specifications.platform.supported_processors;
  const g5400 = supportedCpus.find((cpu) => cpu.model === "Pentium Gold G5400");
  const g5500 = supportedCpus.find((cpu) => cpu.model === "Pentium Gold G5500");
  assert.equal(g5400.intel_ark_tdp_w, 58);
  assert.equal(g5400.dell_datasheet_power_rating_w, 65);
  assert.equal(g5400.integrated_graphics, "UHD Graphics 610");
  assert.equal(g5500.intel_ark_tdp_w, 54);
  assert.equal(g5500.dell_datasheet_power_rating_w, 65);
  assert.equal(g5500.integrated_graphics, "UHD Graphics 630");
  assert.ok(sourceIds.has("src.dell.5060.spec_sheet"));
  assert.ok(sourceIds.has("src.intel.g5400"));
  assert.ok(sourceIds.has("src.intel.g5500"));
  assert.equal(loaded.data.claims.claims.find((claim) => claim.id === "claim.cpu.power_rating_discrepancy").value["Pentium Gold G5500"].intel_ark_tdp_w, 54);
  assert.equal(loaded.data.animations.clips.length, 0);
});


test("JSON model package rejects a tampered sidecar before loading", async () => {
  const prefix = "SBSMODEL-JSON\n";
  const envelope = JSON.parse(packageBytes.toString("utf8").slice(prefix.length));
  envelope.files["model.json"] += " ";
  const tamperedBytes = Buffer.from(prefix + JSON.stringify(envelope), "utf8");
  const tamperedBuffer = tamperedBytes.buffer.slice(
    tamperedBytes.byteOffset,
    tamperedBytes.byteOffset + tamperedBytes.byteLength
  );

  await assert.rejects(
    () => loadModelPackage({
      name: "tampered.sbsmodel",
      size: tamperedBytes.byteLength,
      arrayBuffer: async () => tamperedBuffer
    }),
    /SHA-256 mismatch|checksum/i
  );
});


test("JSON model package rejects an excessive entry count", async () => {
  const prefix = "SBSMODEL-JSON\\n";
  const envelope = JSON.parse(packageBytes.toString("utf8").slice(prefix.length));
  for (let index = 0; index < 130; index += 1) envelope.files[`extra-${index}.json`] = "{}";
  const oversizedBytes = Buffer.from(prefix + JSON.stringify(envelope), "utf8");
  const oversizedBuffer = oversizedBytes.buffer.slice(
    oversizedBytes.byteOffset,
    oversizedBytes.byteOffset + oversizedBytes.byteLength
  );
  await assert.rejects(
    () => loadModelPackage({
      name: "too-many-entries.sbsmodel",
      size: oversizedBytes.byteLength,
      arrayBuffer: async () => oversizedBuffer
    }),
    /invalid number of entries/
  );
});

test("JSON model package rejects unsafe envelope paths", async () => {
  const prefix = "SBSMODEL-JSON\\n";
  const envelope = JSON.parse(packageBytes.toString("utf8").slice(prefix.length));
  envelope.files["../escape.json"] = "{}";
  const unsafeBytes = Buffer.from(prefix + JSON.stringify(envelope), "utf8");
  const unsafeBuffer = unsafeBytes.buffer.slice(
    unsafeBytes.byteOffset,
    unsafeBytes.byteOffset + unsafeBytes.byteLength
  );
  await assert.rejects(
    () => loadModelPackage({
      name: "unsafe-path.sbsmodel",
      size: unsafeBytes.byteLength,
      arrayBuffer: async () => unsafeBuffer
    }),
    /unsafe package path/
  );
});
