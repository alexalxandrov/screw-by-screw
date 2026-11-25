import test from "node:test";
import assert from "node:assert/strict";
import { compareModelPackages } from "../src/data/model-comparison.js";

function packageData({
  id = "device.left",
  part = "LEFT-001",
  specifications = {},
  components = ["root", "cooling", "fan"],
  claims = [],
  sources = []
} = {}) {
  return {
    model: {
      id,
      manufacturer: "Example",
      product_name: "Example Device",
      part_number: part,
      geometry_status: "illustrative_proxy_not_cad",
      specifications
    },
    components: { components: components.map((componentId) => ({ id: componentId })) },
    claims: { claims },
    sources: { sources },
    relationships: { relationships: [] },
    process_layers: { process_layers: [] },
    assembly_steps: { steps: [], observations: [] },
    learning: { questions: [] },
    animations: { clips: [] }
  };
}

test("compares nested specifications and preserves unknown versus not-recorded states", () => {
  const left = packageData({
    specifications: {
      memory: { capacity_gb: 12, type: "GDDR6", pcb_revision: null },
      cooling: { fan_count: 2, fan_diameter_mm: 85 }
    }
  });
  const right = packageData({
    id: "device.right",
    part: "RIGHT-002",
    specifications: {
      memory: { capacity_gb: 8, type: "GDDR6", pcb_revision: null },
      cooling: { fan_count: 2 }
    }
  });
  const report = compareModelPackages(left, right);
  const byPath = new Map(report.specifications.map((row) => [row.path, row]));
  assert.equal(byPath.get("memory.capacity_gb").status, "different");
  assert.equal(byPath.get("memory.type").status, "same");
  assert.equal(byPath.get("memory.pcb_revision").status, "unknown_both");
  assert.equal(byPath.get("cooling.fan_diameter_mm").status, "not_recorded_right");
  assert.equal(report.left.part_number, "LEFT-001");
  assert.equal(report.right.part_number, "RIGHT-002");
  assert.equal(report.left.geometry_status, "illustrative_proxy_not_cad");
});

test("correlates model-level claims without merging source evidence", () => {
  const left = packageData({
    id: "device.left",
    claims: [{
      id: "left.memory.capacity",
      subject_id: "device.left",
      predicate: "memory_capacity",
      value: 12,
      unit: "GB",
      confidence_class: "manufacturer_data",
      source_ids: ["left.source"]
    }],
    sources: [{ id: "left.source", title: "Left manufacturer sheet", url: "https://left.invalid" }]
  });
  const right = packageData({
    id: "device.right",
    claims: [{
      id: "right.memory.capacity",
      subject_id: "device.right",
      predicate: "memory_capacity",
      value: 8,
      unit: "GB",
      confidence_class: "independently_verified",
      source_ids: ["right.source"]
    }],
    sources: [{ id: "right.source", title: "Right teardown", url: "https://right.invalid" }]
  });
  const report = compareModelPackages(left, right);
  const claim = report.claims.find((row) => row.predicate === "memory_capacity");
  assert.equal(claim.status, "different");
  assert.deepEqual(claim.sources_left, [{ id: "left.source", label: "Left manufacturer sheet", url: "https://left.invalid" }]);
  assert.deepEqual(claim.sources_right, [{ id: "right.source", label: "Right teardown", url: "https://right.invalid" }]);
  assert.equal(claim.evidence_left, "manufacturer_data");
  assert.equal(claim.evidence_right, "independently_verified");
});

test("never equates a component missing from a package with a physical absence", () => {
  const left = packageData({ components: ["root", "cooling", "fan"] });
  const right = packageData({ id: "device.right", components: ["root", "cooling", "pump"] });
  const coverage = compareModelPackages(left, right).component_coverage;
  assert.equal(coverage.shared_count, 2);
  assert.deepEqual(coverage.left_only_ids, ["fan"]);
  assert.deepEqual(coverage.right_only_ids, ["pump"]);
  assert.match(coverage.interpretation, /package inventory coverage only/i);
  assert.match(coverage.interpretation, /do not prove a physical component is absent/i);
});

test("does not compare geometry and allows a plain GLB semantic shell with no specifications", () => {
  const left = packageData({ specifications: { performance: { tdp_w: 170 } } });
  const right = packageData({ id: "device.right", specifications: { performance: { tdp_w: 180 } } });
  const report = compareModelPackages(left, right);
  assert.equal("geometry" in report, false);
  assert.equal("scene" in report, false);
  assert.match(report.limitations.join(" "), /3D geometry, CAD, BoardView/i);
  assert.equal(report.specifications.find((row) => row.path === "performance.tdp_w").status, "different");
  const geometryOnly = packageData({ id: "geometry.only", specifications: undefined });
  assert.doesNotThrow(() => compareModelPackages(geometryOnly, right));
  assert.equal(compareModelPackages(geometryOnly, right).specifications[0].status, "not_recorded_left");
});

test("rejects invalid package inputs", () => {
  assert.throws(() => compareModelPackages(null, packageData()), /Left model package/);
  assert.throws(() => compareModelPackages(packageData(), { model: {}, components: {}, claims: {}, sources: {} }), /Right model package/);
});
