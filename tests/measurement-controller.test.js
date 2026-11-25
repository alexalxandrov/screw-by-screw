import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { MeasurementController } from "../src/viewer/MeasurementController.js";

test("records two model-space points and computes Euclidean distance", () => {
  const scene = new THREE.Scene();
  const measurement = new MeasurementController(scene, { unit: "mm" });
  assert.equal(scene.children.includes(measurement.group), true);

  const first = measurement.addPoint(new THREE.Vector3(0, 0, 0));
  assert.deepEqual(first, { pointCount: 1, distance: null, unit: "mm" });
  const second = measurement.addPoint(new THREE.Vector3(3, 4, 0));
  assert.equal(second.pointCount, 2);
  assert.equal(second.distance, 5);
  assert.equal(second.unit, "mm");
  assert.equal(measurement.group.children.length, 3);

  measurement.dispose();
  assert.equal(scene.children.includes(measurement.group), false);
});

test("the third point starts a new measurement instead of accumulating old geometry", () => {
  const measurement = new MeasurementController(new THREE.Scene());
  measurement.addPoint(new THREE.Vector3(0, 0, 0));
  measurement.addPoint(new THREE.Vector3(1, 0, 0));
  const third = measurement.addPoint(new THREE.Vector3(10, 0, 0));
  assert.equal(third.pointCount, 1);
  assert.equal(third.distance, null);
  assert.equal(measurement.group.children.length, 1);
  measurement.dispose();
});

test("clearing removes the visible overlay and resets the distance", () => {
  const measurement = new MeasurementController(new THREE.Scene());
  measurement.addPoint(new THREE.Vector3(1, 2, 3));
  measurement.addPoint(new THREE.Vector3(4, 6, 3));
  measurement.clear();
  assert.equal(measurement.points.length, 0);
  assert.equal(measurement.group.children.length, 0);
  assert.equal(measurement.getDistance(), null);
  measurement.dispose();
});

test("rejects non-finite or non-Vector3 measurement points", () => {
  const measurement = new MeasurementController(new THREE.Scene());
  assert.throws(() => measurement.addPoint({ x: 1, y: 2, z: 3 }), /THREE.Vector3/);
  assert.throws(() => measurement.addPoint(new THREE.Vector3(Number.NaN, 0, 0)), /finite/);
  measurement.dispose();
});
