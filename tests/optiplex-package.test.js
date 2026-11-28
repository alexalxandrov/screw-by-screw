import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadModelPackage } from "../src/viewer/ModelPackageLoader.js";

const packageBytes = await readFile(new URL("../public/models/dell_optiplex_5060_tower_v04.sbsmodel", import.meta.url));
const packageBuffer = packageBytes.buffer.slice(
  packageBytes.byteOffset,
  packageBytes.byteOffset + packageBytes.byteLength
);
const prefix = "SBSMODEL-JSON" + String.fromCharCode(10);

async function loadBytes(bytes, name) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return loadModelPackage({
    name,
    size: bytes.byteLength,
    arrayBuffer: async () => buffer
  });
}

const loaded = await loadBytes(packageBytes, "dell_optiplex_5060_tower_v04.sbsmodel");

test("OptiPlex v0.4 package passes the production loader and cross-file validation", () => {
  assert.equal(loaded.report.modelId, "pc.dell.optiplex-5060-tower.family");
  assert.equal(loaded.report.componentCount, 137);
  assert.equal(loaded.report.relationshipCount, 145);
  assert.equal(loaded.integrityVerified, true);
  assert.equal(loaded.data.model.geometry_status, "illustrative_proxy_not_cad");
  assert.equal(loaded.data.model.identity_scope, "platform_family");
  assert.equal(loaded.data.model.part_number, null);
  const packageVersion = loaded.data.model.release.version;
  assert.equal(packageVersion, "0.4.2");
  assert.equal(loaded.data.model.specifications.physical.height_mm, 350);
  assert.equal(loaded.data.model.specifications.physical.width_mm, 154);
  assert.equal(loaded.data.model.specifications.physical.depth_mm, 274);

  const components = loaded.data.components.components;
  const componentIds = new Set(components.map((component) => component.id));

  const proxyKinds = components.reduce((counts, component) => {
    const kind = component.visual_proxy?.kind;
    if (kind) counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
  }, {});
  const expectedProxyKinds = ["0.4.1", "0.4.2"].includes(packageVersion)
    ? {
        chassis_frame: packageVersion === "0.4.2" ? 1 : undefined,
        box: 45, panel: 7, drive_cage: 1, io_port: 25, cylinder: 2, fan: 3, fin_stack: 1
      }
    : { box: 52, cylinder: 2, fan: 3, fin_stack: 1 };
  if (packageVersion === "0.4.1") delete expectedProxyKinds.chassis_frame;
  assert.deepEqual(proxyKinds, expectedProxyKinds);
  if (packageVersion === "0.4.2") {
    assert.equal(components.find((component) => component.id === "chassis.frame").visual_proxy?.kind, "chassis_frame");
    assert.equal(components.find((component) => component.id === "chassis.side_panel").visual_proxy?.axis, "x");
    assert.equal(components.find((component) => component.id === "chassis.front_panel").visual_proxy?.axis, "z");
    assert.equal(components.find((component) => component.id === "chassis.rear_panel").visual_proxy?.axis, "z");
  }

  const sources = loaded.data.sources.sources;
  const sourceIds = new Set(sources.map((source) => source.id));
  const relationships = loaded.data.relationships.relationships;
  const claims = loaded.data.claims.claims;
  if (["0.4.1", "0.4.2"].includes(packageVersion)) {
    assert.equal(components.filter((c) => c.visual_proxy?.kind === "io_port").length, 25);
    assert.equal(components.filter((c) => c.visual_proxy?.kind === "io_port" && c.id.startsWith("front.")).length, 7);
    assert.equal(components.filter((c) => c.visual_proxy?.kind === "io_port" && c.id.startsWith("rear.")).length, 18);
    assert.equal(claims.find((c) => c.id === "claim.ports.front_standard_external_connectors").value, 5);
    assert.equal(claims.find((c) => c.id === "claim.ports.rear_standard_external_connectors").value, 10);
    for (const id of ["front.optical_drive_bay.optional", "front.sd_card_reader_slot.optional",
                      "rear.serial.optional", "rear.video_module.optional",
                      "rear.antenna.1.optional", "rear.antenna.2.optional"]) {
      const optional = components.find((c) => c.id === id);
      assert.ok(optional);
      assert.equal(optional.geometry_status, "unknown");
      assert.equal(optional.visual_proxy, undefined);
    }
  }

  const steps = loaded.data.assembly_steps.steps;
  const stepIds = new Set(steps.map((step) => step.id));
  const callouts = loaded.data.model.specifications.motherboard.callouts;

  assert.equal(components.filter((component) =>
    component.category === "fastener" &&
    component.fastener_population !== "optional_reference_not_fitted"
  ).length, 24);
  assert.equal(components.filter((component) =>
    component.fastener_population === "optional_reference_not_fitted"
  ).length, 7);
  assert.equal(sources.length, ["0.4.1", "0.4.2"].includes(packageVersion) ? 30 : 28);
  assert.equal(claims.length, ["0.4.1", "0.4.2"].includes(packageVersion) ? 36 : 34);
  assert.equal(loaded.data.process_layers.process_layers.length, 6);
  assert.equal(steps.length, 12);
  assert.equal(loaded.data.assembly_steps.observations.length, 19);
  assert.equal(loaded.data.learning.questions.length, 9);

  assert.equal(loaded.data.model.specifications.service_hardware.physical_reference_instances, 24);
  assert.equal(loaded.data.model.specifications.service_hardware.optional_fastener_references, 7);
  assert.equal(loaded.data.model.specifications.service_hardware.optional_fastener_schedule.length, 5);
  assert.equal(claims.find((claim) => claim.id === "claim.fasteners.optional_mounting").value.length, 5);

  assert.equal(loaded.data.model.specifications.motherboard.numbered_callouts, 26);
  assert.equal(callouts.length, 26);
  assert.deepEqual(callouts.map((callout) => callout.number), Array.from({ length: 26 }, (_, index) => index + 1));
  assert.equal(callouts.reduce((count, callout) => count + callout.component_ids.length, 0), 29);
  assert.deepEqual(callouts.find((entry) => entry.number === 24).component_ids, ["motherboard.m2.wlan"]);
  assert.deepEqual(callouts.find((entry) => entry.number === 25).component_ids, ["motherboard.coin_cell"]);

  // Russian localization is part of the package contract for every component.
  for (const component of components) {
    assert.ok(component.name?.ru, `missing Russian component name: ${component.id}`);
    assert.ok(component.description?.ru, `missing Russian component description: ${component.id}`);
    assert.match(component.description.ru, /[\u0400-\u04FF]/, `component description is not localized: ${component.id}`);
  }

  // Every reference in the editable semantic graph must resolve.
  for (const component of components) {
    if (component.parent_id) assert.ok(componentIds.has(component.parent_id), `unresolved parent: ${component.id}`);
    for (const sourceId of component.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved component source: ${component.id}`);
  }
  for (const relationship of relationships) {
    assert.ok(componentIds.has(relationship.from), `unresolved relationship source: ${relationship.id}`);
    assert.ok(componentIds.has(relationship.to), `unresolved relationship target: ${relationship.id}`);
    for (const sourceId of relationship.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved relationship source record: ${relationship.id}`);
  }
  for (const claim of claims) {
    assert.ok(componentIds.has(claim.subject_id) || claim.subject_id === loaded.data.model.id, `unresolved claim subject: ${claim.id}`);
    for (const sourceId of claim.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved claim evidence: ${claim.id}`);
  }
  for (const layer of loaded.data.process_layers.process_layers) {
    for (const componentId of layer.linked_component_ids ?? []) assert.ok(componentIds.has(componentId), `unresolved process component: ${layer.id}`);
    for (const sourceId of layer.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved process evidence: ${layer.id}`);
  }
  for (const step of steps) {
    for (const componentId of step.component_ids ?? []) assert.ok(componentIds.has(componentId), `unresolved step component: ${step.id}`);
    for (const sourceId of step.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved step evidence: ${step.id}`);
    for (const prerequisite of step.prerequisite_step_ids ?? []) assert.ok(stepIds.has(prerequisite), `unresolved step prerequisite: ${step.id}`);
  }
  for (const question of loaded.data.learning.questions) {
    for (const sourceId of question.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `unresolved learning evidence: ${question.id}`);
  }
  for (const callout of callouts) {
    for (const componentId of callout.component_ids) assert.ok(componentIds.has(componentId), `unresolved callout ${callout.number}: ${componentId}`);
  }

  // The HDD and optical-drive mechanics are separate optional carrier modules.
  const drive35Claim = claims.find((claim) => claim.id === "claim.storage.drive35_mechanism");
  const drive25Claim = claims.find((claim) => claim.id === "claim.storage.drive25_mechanism");
  const oddClaim = claims.find((claim) => claim.id === "claim.storage.odd_mechanism");
  assert.equal(drive35Claim.value.release, "single blue carrier tab");
  assert.equal(drive25Claim.value.release, "two blue side tabs");
  assert.equal(oddClaim.value.release, "single blue carrier tab");
  for (const id of [
    "storage.drive35.carrier.optional",
    "storage.drive35.filler_bracket.optional",
    "storage.drive35.drive_bracket.optional",
    "storage.drive35.release_tab.optional",
    "storage.drive25.carrier.optional",
    "storage.drive25.drive_bracket.optional",
    "storage.drive25.release_tab.left.optional",
    "storage.drive25.release_tab.right.optional",
    "storage.optical_drive.release_tab.optional",
    "storage.drive_cage.cable_retention_tabs"
  ]) {
    const component = components.find((entry) => entry.id === id);
    assert.ok(component, `missing storage mechanism component: ${id}`);
    assert.equal(component.geometry_status, "unknown");
    assert.equal(component.visual_proxy, undefined);
  }

  // Platform support data is not confused with the installed sample configuration.
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

  for (const sourceId of [
    "src.dell.5060.m2_removal",
    "src.dell.5060.coin_cell_removal",
    "src.dell.5060.heatsink_fan_removal",
    "src.dell.5060.optical_drive_install",
    "src.dell.5060.optional_video_module",
    "src.dell.5060.hdd35_assembly",
    "src.dell.5060.hdd35_bracket",
    "src.dell.5060.hdd25_assembly",
    "src.dell.5060.hdd25_bracket",
    "src.dell.5060.odd_removal"
  ]) assert.ok(sourceIds.has(sourceId), `missing manufacturer service source: ${sourceId}`);

  const supportedRelationshipTypes = new Set(["contains", "powered_by", "connected_to", "transfers_heat_to"]);
  assert.ok(relationships.every((relationship) => supportedRelationshipTypes.has(relationship.type)));
  assert.equal(loaded.data.animations.clips.length, 3);
  assert.deepEqual(loaded.data.animations.clips.map((clip) => clip.id), [
    "clip.optiplex.side-cover-removal",
    "clip.optiplex.cpu-cooling-removal",
    "clip.optiplex.system-board-removal"
  ]);
  for (const clip of loaded.data.animations.clips) {
    assert.ok(clip.tracks.length > 0, `animation clip has no tracks: ${clip.id}`);
    for (const track of clip.tracks) {
      assert.ok(componentIds.has(track.target_id), `unknown animation target: ${track.target_id}`);
      assert.equal(track.relative, true);
    }
  }
  const expectedWorldTracks = [
    ["chassis.side_panel", [110, 0, 0]],
    ["cooling.cpu.fan", [0, 0, 42]],
    ["cooling.cpu.heatsink", [0, 0, 62]],
    ["motherboard.assembly", [0, 0, 85]]
  ];
  for (const [targetId, expectedDelta] of expectedWorldTracks) {
    const track = loaded.data.animations.clips.flatMap((clip) => clip.tracks)
      .find((entry) => entry.target_id === targetId);
    assert.ok(track, `missing animation track: ${targetId}`);
    assert.equal(track.coordinate_space, "world", `track must be world-space: ${targetId}`);
    assert.deepEqual(track.keyframes.at(-1).value, expectedDelta);
  }
  const sceneActionCounts = steps.map((step) => (step.scene_actions ?? []).length);
  assert.deepEqual(sceneActionCounts, [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2]);
  for (const step of steps) {
    for (const action of step.scene_actions ?? []) {
      for (const componentId of action.target_component_ids ?? []) {
        assert.ok(componentIds.has(componentId), `unknown scene action target: ${step.id} -> ${componentId}`);
      }
    }
  }
});

test("JSON model package rejects a tampered sidecar before loading", async () => {
  const envelope = JSON.parse(packageBytes.toString("utf8").slice(prefix.length));
  envelope.files["model.json"] += " ";
  const tamperedBytes = Buffer.from(prefix + JSON.stringify(envelope), "utf8");
  await assert.rejects(() => loadBytes(tamperedBytes, "tampered.sbsmodel"), /SHA-256 mismatch|checksum/i);
});

test("JSON model package rejects an excessive entry count", async () => {
  const envelope = JSON.parse(packageBytes.toString("utf8").slice(prefix.length));
  for (let index = 0; index < 130; index += 1) envelope.files[`extra-${index}.json`] = "{}";
  const bytes = Buffer.from(prefix + JSON.stringify(envelope), "utf8");
  await assert.rejects(() => loadBytes(bytes, "too-many-entries.sbsmodel"), /invalid number of entries/);
});

test("JSON model package rejects unsafe envelope paths", async () => {
  const envelope = JSON.parse(packageBytes.toString("utf8").slice(prefix.length));
  envelope.files["../escape.json"] = "{}";
  const bytes = Buffer.from(prefix + JSON.stringify(envelope), "utf8");
  await assert.rejects(() => loadBytes(bytes, "unsafe-path.sbsmodel"), /unsafe package path/);
});
