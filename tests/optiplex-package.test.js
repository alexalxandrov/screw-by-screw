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
  assert.equal(loaded.report.componentCount, 115);
  assert.equal(loaded.report.relationshipCount, 123);
  assert.equal(loaded.integrityVerified, true);
  assert.equal(loaded.data.model.geometry_status, "illustrative_proxy_not_cad");
  assert.equal(loaded.data.model.specifications.physical.height_mm, 350);
  assert.equal(loaded.data.model.specifications.physical.width_mm, 154);
  assert.equal(loaded.data.model.specifications.physical.depth_mm, 274);
  assert.equal(loaded.data.components.components.filter((component) => component.category === "fastener").length, 24);
  assert.equal(loaded.data.sources.sources.length, 15);
  assert.equal(loaded.data.claims.claims.length, 29);
  assert.equal(loaded.data.process_layers.process_layers.length, 6);
  assert.equal(loaded.data.assembly_steps.steps.length, 12);
  assert.equal(loaded.data.learning.questions.length, 9);
  assert.equal(loaded.data.model.specifications.motherboard.numbered_callouts, 26);
  assert.equal(loaded.data.model.specifications.motherboard.callouts.length, 26);
  const callouts = loaded.data.model.specifications.motherboard.callouts;
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
  assert.deepEqual(loaded.data.model.specifications.motherboard.callouts.find((entry) => entry.number === 24).component_ids, ["motherboard.m2.wlan"]);
  assert.deepEqual(loaded.data.model.specifications.motherboard.callouts.find((entry) => entry.number === 25).component_ids, ["motherboard.coin_cell"]);
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
