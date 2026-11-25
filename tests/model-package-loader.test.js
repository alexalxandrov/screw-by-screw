import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { strToU8, zipSync } from "fflate";
import { loadModelPackage, validateModelPackageData } from "../src/viewer/ModelPackageLoader.js";

const modelId = "test.device";

function makeGlb(document = { asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [] }] }) {
  const json = strToU8(JSON.stringify(document));
  const paddedLength = Math.ceil(json.length / 4) * 4;
  const buffer = new ArrayBuffer(20 + paddedLength);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(buffer, 20, json.length).set(json);
  new Uint8Array(buffer, 20 + json.length, paddedLength - json.length).fill(0x20);
  return new Uint8Array(buffer);
}

function makeData(overrides = {}) {
  return {
    model: { id: modelId, source_ids: ["src.one"] },
    components: { device_model_id: modelId, components: [
      { id: "root", parent_id: null, source_ids: ["src.one"] },
      { id: "part", parent_id: "root", source_ids: [] }
    ] },
    sources: { sources: [{ id: "src.one" }] },
    relationships: { device_model_id: modelId, relationships: [{ id: "rel.one", from: "root", to: "part", source_ids: ["src.one"] }] },
    claims: { device_model_id: modelId, claims: [{ id: "claim.one", subject_id: "part", source_ids: ["src.one"] }] },
    process_layers: { device_model_id: modelId, process_layers: [{ id: "layer.one", linked_component_ids: ["part"], source_ids: ["src.one"] }] },
    assembly_steps: { steps: [] },
    learning: { questions: [] },
    animations: { clips: [] },
    ...overrides
  };
}

function makeArchive({ data = makeData(), scene = makeGlb(), manifestOverrides = {}, extraFiles = {} } = {}) {
  const manifest = {
    format: "sbs-model",
    schema_version: "1.0.0",
    model_id: modelId,
    files: {
      model: "model.json", scene: "scene.glb", components: "components.json", sources: "sources.json",
      relationships: "relationships.json", claims: "claims.json", process_layers: "process_layers.json",
      assembly_steps: "assembly_steps.json", learning: "learning.json", animations: "animations.json"
    },
    ...manifestOverrides
  };
  const entries = {
    "sbs-model.json": strToU8(JSON.stringify(manifest)),
    "model.json": strToU8(JSON.stringify(data.model)),
    "scene.glb": scene,
    "components.json": strToU8(JSON.stringify(data.components)),
    "sources.json": strToU8(JSON.stringify(data.sources)),
    "relationships.json": strToU8(JSON.stringify(data.relationships)),
    "claims.json": strToU8(JSON.stringify(data.claims)),
    "process_layers.json": strToU8(JSON.stringify(data.process_layers)),
    "assembly_steps.json": strToU8(JSON.stringify(data.assembly_steps)),
    "learning.json": strToU8(JSON.stringify(data.learning)),
    "animations.json": strToU8(JSON.stringify(data.animations)),
    ...extraFiles
  };
  return zipSync(entries);
}

function asFile(bytes) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return { name: "test.sbsmodel", size: bytes.byteLength, arrayBuffer: async () => buffer };
}

test("validates the committed RTX 3060 model package sidecars", () => {
  const base = new URL("../content/models/evga-rtx3060-xc-black-12gb/", import.meta.url);
  const read = (name) => JSON.parse(readFileSync(new URL(name, base), "utf8"));
  const manifest = read("model-package.json");
  const data = {
    model: read("model.json"),
    components: read("components.json"),
    sources: read("sources.json"),
    relationships: read("relationships.json"),
    claims: read("claims.json"),
    process_layers: read("process_layers.json"),
    assembly_steps: read("assembly_steps.json"),
    learning: read("learning.json"),
    animations: read("animations.json")
  };
  const report = validateModelPackageData(manifest, data);
  assert.equal(report.modelId, "gpu.evga.12g-p5-3655-kr");
  assert.ok(report.componentCount >= 20);
  assert.equal(report.sourceCount, 4);
});

test("loads a valid portable model package and validates all references", async () => {
  const pkg = await loadModelPackage(asFile(makeArchive()));
  assert.equal(pkg.report.modelId, modelId);
  assert.equal(pkg.report.componentCount, 2);
  assert.equal(pkg.report.sourceCount, 1);
  assert.equal(pkg.report.relationshipCount, 1);
  assert.equal(pkg.sceneBuffer.byteLength, makeGlb().byteLength);
});

test("rejects path traversal entries before extraction", async () => {
  const bytes = makeArchive({ extraFiles: { "../outside.json": strToU8("{}") } });
  await assert.rejects(() => loadModelPackage(asFile(bytes)), /unsafe archive path/);
});

test("rejects unknown component parents", () => {
  const data = makeData();
  data.components.components[1].parent_id = "missing";
  const manifest = { format: "sbs-model", schema_version: "1.0.0", model_id: modelId, files: {} };
  assert.throws(() => validateModelPackageData(manifest, data), /unknown parent/);
});

test("rejects relationships that point outside the component inventory", () => {
  const data = makeData();
  data.relationships.relationships[0].to = "not-a-component";
  const manifest = { format: "sbs-model", schema_version: "1.0.0", model_id: modelId, files: {} };
  assert.throws(() => validateModelPackageData(manifest, data), /unknown component/);
});

test("rejects packages whose component inventory is not bound to GLB nodes", async () => {
  const scene = makeGlb({ asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [
    { name: "Root", extras: { sbs_component_id: "root" } }
  ] });
  await assert.rejects(() => loadModelPackage(asFile(makeArchive({ scene }))), /missing component nodes: part/);
});

test("rejects GLB files with external resource URIs", async () => {
  const scene = makeGlb({ asset: { version: "2.0" }, buffers: [{ uri: "https://example.invalid/mesh.bin" }] });
  await assert.rejects(() => loadModelPackage(asFile(makeArchive({ scene }))), /External resource URIs/);
});

test("rejects a package with a mismatched SHA-256 checksum", async () => {
  const bytes = makeArchive({ manifestOverrides: { sha256: { "model.json": "0".repeat(64) } } });
  await assert.rejects(() => loadModelPackage(asFile(bytes)), /SHA-256 mismatch/);
});

test("rejects unsupported package schema versions", async () => {
  const bytes = makeArchive({ manifestOverrides: { schema_version: "9.9.9" } });
  await assert.rejects(() => loadModelPackage(asFile(bytes)), /unsupported package format or schema version/);
});
