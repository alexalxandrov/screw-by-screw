import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadModelPackage } from "../src/viewer/ModelPackageLoader.js";

const packageBytes = await readFile(new URL("../public/models/dell_optiplex_5060_tower_v01.sbsmodel", import.meta.url));
const packageBuffer = packageBytes.buffer.slice(
  packageBytes.byteOffset,
  packageBytes.byteOffset + packageBytes.byteLength
);
const loaded = await loadModelPackage({
  name: "dell_optiplex_5060_tower_v01.sbsmodel",
  size: packageBytes.byteLength,
  arrayBuffer: async () => packageBuffer
});

test("OptiPlex reference package passes the production package loader and checksum verification", () => {
  assert.equal(loaded.report.modelId, "pc.dell.optiplex-5060-tower.family");
  assert.equal(loaded.report.componentCount, 67);
  assert.equal(loaded.report.relationshipCount, 68);
  assert.equal(loaded.integrityVerified, true);
  assert.equal(loaded.data.model.geometry_status, "illustrative_proxy_not_cad");
  assert.equal(loaded.data.model.specifications.physical.height_mm, 350);
  assert.equal(loaded.data.model.specifications.physical.width_mm, 154);
  assert.equal(loaded.data.model.specifications.physical.depth_mm, 274);
  assert.equal(loaded.data.components.components.filter((component) => component.category === "fastener").length, 24);
  assert.equal(loaded.data.animations.clips.length, 0);
});
