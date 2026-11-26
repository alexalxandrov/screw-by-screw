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
  assert.equal(loaded.data.claims.claims.length, 31);
  assert.equal(loaded.data.process_layers.process_layers.length, 6);
  assert.equal(loaded.data.assembly_steps.steps.length, 12);
  assert.equal(loaded.data.learning.questions.length, 9);
  assert.equal(loaded.data.model.specifications.motherboard.numbered_callouts, 26);
  assert.equal(loaded.data.model.specifications.motherboard.callouts.length, 26);
  assert.deepEqual(loaded.data.model.specifications.motherboard.callouts.find((entry) => entry.number === 24).component_ids, ["motherboard.m2.wlan"]);
  assert.deepEqual(loaded.data.model.specifications.motherboard.callouts.find((entry) => entry.number === 25).component_ids, ["motherboard.coin_cell"]);
  assert.equal(loaded.data.animations.clips.length, 0);
});


test("JSON model package rejects a tampered sidecar before loading", async () => {
  const prefix = "SBSMODEL-JSON\\n";
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
    /SHA-256 mismatch/
  );
});
