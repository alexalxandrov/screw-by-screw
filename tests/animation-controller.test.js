import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AnimationController } from "../src/viewer/AnimationController.js";

function makeScheduler() {
  let now = 0;
  let nextId = 1;
  const callbacks = new Map();
  return {
    requestFrame(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancelFrame(id) { callbacks.delete(id); },
    step(milliseconds) {
      now += milliseconds;
      const frame = [...callbacks.values()];
      callbacks.clear();
      frame.forEach((callback) => callback(now));
    },
    get pending() { return callbacks.size; }
  };
}

function createRoot() {
  const root = new THREE.Group();
  const part = new THREE.Group();
  part.name = "Animated part";
  part.userData.sbs_component_id = "part.one";
  root.add(part);
  return { root, part };
}

const slideClip = {
  id: "clip.slide",
  title: { en: "Slide", ru: "Сдвиг" },
  duration_ms: 1000,
  easing: "linear",
  evidence_status: "educational_approximation",
  accuracy_note: { en: "Illustrative animation", ru: "Условная анимация" },
  tracks: [{
    target_id: "part.one",
    property: "position",
    keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [10, 0, 0] }]
  }]
};

test("plays authored local transforms and exposes normalized progress", () => {
  const { root, part } = createRoot();
  const scheduler = makeScheduler();
  const snapshots = [];
  const controller = new AnimationController(root, [slideClip], {
    requestFrame: scheduler.requestFrame,
    cancelFrame: scheduler.cancelFrame,
    onUpdate: (snapshot) => snapshots.push(snapshot)
  });

  assert.equal(controller.select("clip.slide"), true);
  assert.equal(part.position.x, 0);
  assert.equal(controller.play(), true);
  scheduler.step(0);
  scheduler.step(500);
  assert.equal(part.position.x, 5);
  assert.equal(controller.progress, 0.5);
  assert.equal(controller.playing, true);
  scheduler.step(500);
  assert.equal(part.position.x, 10);
  assert.equal(controller.progress, 1);
  assert.equal(controller.playing, false);
  assert.equal(scheduler.pending, 0);
  assert.ok(snapshots.length > 0);
  controller.dispose();
});

test("pause preserves the current frame, seek is reversible, and stop returns to clip start", () => {
  const { root, part } = createRoot();
  const scheduler = makeScheduler();
  const controller = new AnimationController(root, [slideClip], scheduler);

  controller.select("clip.slide");
  controller.play();
  scheduler.step(0);
  scheduler.step(400);
  assert.equal(part.position.x, 4);
  assert.equal(controller.pause(), true);
  scheduler.step(300);
  assert.equal(part.position.x, 4);
  assert.equal(controller.seek(0.75), true);
  assert.equal(part.position.x, 7.5);
  assert.equal(controller.progress, 0.75);
  controller.stop();
  assert.equal(part.position.x, 0);
  assert.equal(controller.progress, 0);
  controller.dispose();
});

test("switching clips restores the captured base state before applying the next clip", () => {
  const { root, part } = createRoot();
  const second = {
    ...slideClip,
    id: "clip.scale",
    tracks: [{
      target_id: "part.one",
      property: "scale",
      keyframes: [{ t: 0, value: [1, 1, 1] }, { t: 1, value: [2, 2, 2] }]
    }]
  };
  const controller = new AnimationController(root, [slideClip, second]);
  controller.select("clip.slide");
  controller.seek(1);
  assert.equal(part.position.x, 10);
  controller.select("clip.scale");
  assert.equal(part.position.x, 0);
  assert.equal(part.scale.x, 1);
  controller.seek(0.5);
  assert.equal(part.scale.x, 1.5);
  controller.reset();
  assert.equal(part.position.x, 0);
  assert.equal(part.scale.x, 1);
  controller.dispose();
});

test("visibility keyframes use discrete transitions and easing affects vector interpolation", () => {
  const { root, part } = createRoot();
  const scheduler = makeScheduler();
  const visibility = {
    id: "clip.visibility",
    duration_ms: 100,
    easing: "ease_in_out",
    tracks: [
      { target_id: "part.one", property: "position", keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [10, 0, 0] }] },
      { target_id: "part.one", property: "visible", keyframes: [{ t: 0, value: true }, { t: 0.5, value: false }, { t: 1, value: true }] }
    ]
  };
  const controller = new AnimationController(root, [visibility], scheduler);
  controller.select("clip.visibility");
  controller.seek(0.25);
  assert.equal(part.position.x, 1.5625);
  assert.equal(part.visible, true);
  controller.seek(0.5);
  assert.equal(part.position.x, 5);
  assert.equal(part.visible, false);
  controller.seek(0.75);
  assert.equal(part.visible, false);
  controller.seek(1);
  assert.equal(part.visible, true);
  controller.dispose();
});

test("missing nodes are reported and cannot crash playback", () => {
  const { root } = createRoot();
  const clip = {
    ...slideClip,
    id: "clip.missing",
    tracks: [{ ...slideClip.tracks[0], target_id: "missing.node" }]
  };
  const controller = new AnimationController(root, [clip]);
  assert.deepEqual(controller.missingTargets, ["missing.node"]);
  assert.equal(controller.select("clip.missing"), true);
  assert.equal(controller.play(), false);
  controller.dispose();
});

test("invalid clip IDs cannot be selected", () => {
  const { root } = createRoot();
  const controller = new AnimationController(root, [slideClip]);
  assert.equal(controller.select("not.here"), false);
  assert.equal(controller.play("not.here"), false);
  controller.dispose();
});


test("rotation tracks interpolate Euler radians and restore their original orientation", () => {
  const { root, part } = createRoot();
  const clip = {
    id: "clip.rotation",
    duration_ms: 100,
    tracks: [{
      target_id: "part.one",
      property: "rotation",
      keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [0, 0, Math.PI] }]
    }]
  };
  const controller = new AnimationController(root, [clip]);
  controller.select("clip.rotation");
  controller.seek(0.5);
  assert.ok(Math.abs(part.rotation.z - Math.PI / 2) < 1e-9);
  controller.reset();
  assert.equal(part.rotation.z, 0);
  controller.dispose();
});
