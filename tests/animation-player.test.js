import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AnimationPlayer } from "../src/viewer/AnimationPlayer.js";

function makeScene() {
  const root = new THREE.Group();
  root.userData.sbs_component_id = "root";
  const fan = new THREE.Group();
  fan.userData.sbs_component_id = "fan";
  root.add(fan);
  return { root, fan };
}

function makeClip(overrides = {}) {
  return {
    id: "clip.test",
    title: { en: "Test motion", ru: "Тестовое движение" },
    evidence_status: "educational_approximation",
    duration_ms: 1000,
    tracks: [{
      target_id: "fan",
      property: "position",
      keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [10, 0, 0] }]
    }],
    ...overrides
  };
}

function installRaf() {
  const previousRequest = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  let nextId = 0;
  const pending = new Map();
  globalThis.requestAnimationFrame = (callback) => {
    const id = ++nextId;
    pending.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => pending.delete(id);
  return {
    frame(timestamp) {
      const current = [...pending.values()];
      pending.clear();
      current.forEach((callback) => callback(timestamp));
    },
    get pendingCount() { return pending.size; },
    restore() {
      if (previousRequest === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = previousRequest;
      if (previousCancel === undefined) delete globalThis.cancelAnimationFrame;
      else globalThis.cancelAnimationFrame = previousCancel;
    }
  };
}

test("selects a package clip and interpolates vector properties by normalized time", () => {
  const { root, fan } = makeScene();
  const player = new AnimationPlayer(root, [makeClip()]);
  assert.equal(player.selectClip("clip.test"), true);
  assert.equal(player.getSnapshot().status, "ready");
  assert.deepEqual(fan.position.toArray(), [0, 0, 0]);

  player.seek(0.25);
  assert.deepEqual(fan.position.toArray(), [7, 0, 0]);
  assert.equal(player.getSnapshot().time, 250);
  player.dispose();
});

test("playback advances by frame timestamps, can pause, resume and complete", () => {
  const raf = installRaf();
  try {
    const { root, fan } = makeScene();
    const player = new AnimationPlayer(root, [makeClip()]);
    player.selectClip("clip.test");
    player.play();
    raf.frame(0);
    raf.frame(400);
    assert.deepEqual(fan.position.toArray(), [11.2, 0, 0]);
    assert.equal(player.getSnapshot().status, "playing");

    assert.equal(player.pause(), true);
    assert.equal(raf.pendingCount, 0);
    assert.equal(player.getSnapshot().status, "paused");
    player.play();
    raf.frame(1000);
    raf.frame(1600);
    assert.deepEqual(fan.position.toArray(), [28, 0, 0]);
    assert.equal(player.getSnapshot().status, "completed");
    assert.equal(player.getSnapshot().progress, 1);
    player.dispose();
  } finally {
    raf.restore();
  }
});

test("stop restores the original component transform after partial playback", () => {
  const { root, fan } = makeScene();
  fan.position.set(1, 2, 3);
  const player = new AnimationPlayer(root, [makeClip()]);
  player.selectClip("clip.test");
  player.seek(0.8);
  assert.deepEqual(fan.position.toArray(), [22.4, 0, 0]);
  player.stop();
  assert.deepEqual(fan.position.toArray(), [1, 2, 3]);
  assert.equal(player.getSnapshot().time, 0);
  assert.equal(player.getSnapshot().status, "ready");
  player.dispose();
});

test("visibility tracks use step semantics instead of numeric interpolation", () => {
  const { root, fan } = makeScene();
  const clip = makeClip({
    tracks: [{
      target_id: "fan",
      property: "visible",
      keyframes: [{ t: 0, value: true }, { t: 1, value: false }]
    }]
  });
  const player = new AnimationPlayer(root, [clip]);
  player.selectClip(clip.id);
  player.seek(0.99);
  assert.equal(fan.visible, true);
  player.seek(1);
  assert.equal(fan.visible, false);
  player.stop();
  assert.equal(fan.visible, true);
  player.dispose();
});

test("clip switches restore the previous clip before capturing the next baseline", () => {
  const { root, fan } = makeScene();
  const second = makeClip({
    id: "clip.second",
    tracks: [{
      target_id: "fan",
      property: "scale",
      keyframes: [{ t: 0, value: [1, 1, 1] }, { t: 1, value: [2, 2, 2] }]
    }]
  });
  const player = new AnimationPlayer(root, [makeClip(), second]);
  player.selectClip("clip.test");
  player.seek(0.5);
  player.selectClip("clip.second");
  assert.deepEqual(fan.position.toArray(), [0, 0, 0]);
  player.seek(0.5);
  assert.deepEqual(fan.scale.toArray(), [1.5, 1.5, 1.5]);
  player.dispose();
});

test("exploded overview animates separate assembly groups and stop restores every baseline", () => {
  const root = new THREE.Group();
  const original = new Map();
  for (const [id, position] of [
    ["assembly.shroud", [100.9, -18, 55]],
    ["assembly.cooling", [100.9, 0, 55]],
    ["assembly.pcb.electronics", [100.9, 17.2, 55]],
    ["assembly.connectors", [0, 0, 0]]
  ]) {
    const group = new THREE.Group();
    group.userData.sbs_component_id = id;
    group.position.set(...position);
    original.set(id, position);
    root.add(group);
  }
  const clip = {
    id: "clip.exploded-cooler-overview",
    title: { en: "Exploded assembly overview", ru: "Разнесённый вид сборки" },
    evidence_status: "educational_approximation",
    duration_ms: 4200,
    easing: "ease_in_out",
    tracks: [
      { target_id: "assembly.shroud", property: "position", keyframes: [{ t: 0, value: [100.9,-18,55] }, { t: 1, value: [100.9,-42,55] }] },
      { target_id: "assembly.cooling", property: "position", keyframes: [{ t: 0, value: [100.9,0,55] }, { t: 1, value: [100.9,-24,55] }] },
      { target_id: "assembly.pcb.electronics", property: "position", keyframes: [{ t: 0, value: [100.9,17.2,55] }, { t: 1, value: [100.9,40,55] }] },
      { target_id: "assembly.connectors", property: "position", keyframes: [{ t: 0, value: [0,0,0] }, { t: 1, value: [-24,0,0] }] }
    ]
  };
  const player = new AnimationPlayer(root, [clip]);
  assert.equal(player.selectClip(clip.id), true);
  player.seek(1);
  const byId = new Map();
  root.traverse((object) => {
    if (object.userData?.sbs_component_id) byId.set(object.userData.sbs_component_id, object);
  });
  const shroudPosition = byId.get("assembly.shroud").position;
  assert.equal(shroudPosition.x, 100.9);
  assert.ok(Math.abs(shroudPosition.y - (-85.2)) < 1e-9);
  assert.equal(shroudPosition.z, 55);
  const coolingPosition = byId.get("assembly.cooling").position;
  assert.equal(coolingPosition.x, 100.9);
  assert.ok(Math.abs(coolingPosition.y - (-67.2)) < 1e-9);
  assert.equal(coolingPosition.z, 55);
  const pcbPosition = byId.get("assembly.pcb.electronics").position;
  assert.equal(pcbPosition.x, 100.9);
  assert.ok(Math.abs(pcbPosition.y - 81.04) < 1e-9);
  assert.equal(pcbPosition.z, 55);
  assert.ok(Math.abs(byId.get("assembly.connectors").position.x - (-67.2)) < 1e-9);
  assert.equal(byId.get("assembly.connectors").position.y, 0);
  assert.equal(byId.get("assembly.connectors").position.z, 0);
  player.stop();
  for (const [id, position] of original) assert.deepEqual(byId.get(id).position.toArray(), position);
  player.dispose();
});

test("supports clip-level ease-in-out and clamps playback speed", () => {
  const { root, fan } = makeScene();
  const player = new AnimationPlayer(root, [makeClip({ easing: "ease_in_out" })]);
  player.selectClip("clip.test");
  player.seek(0.25);
  assert.deepEqual(fan.position.toArray(), [4.375, 0, 0]);
  assert.equal(player.setSpeed(10), 4);
  assert.equal(player.setSpeed(-1), 0.1);
  player.dispose();
});

test("rejects missing or ambiguous component IDs when selecting a clip", () => {
  const { root } = makeScene();
  const missing = new AnimationPlayer(root, [makeClip({
    tracks: [{ target_id: "missing", property: "position", keyframes: [{ t: 0, value: [0,0,0] }, { t: 1, value: [1,1,1] }] }]
  })]);
  assert.throws(() => missing.selectClip("clip.test"), /target is missing/);
  missing.dispose();

  const duplicateRoot = new THREE.Group();
  const first = new THREE.Group();
  const second = new THREE.Group();
  first.userData.sbs_component_id = "fan";
  second.userData.sbs_component_id = "fan";
  duplicateRoot.add(first, second);
  const ambiguous = new AnimationPlayer(duplicateRoot, [makeClip()]);
  assert.throws(() => ambiguous.selectClip("clip.test"), /ID is ambiguous/);
  ambiguous.dispose();
});

test("relative position tracks animate from the actual model baseline and restore cleanly", () => {
  const { root, fan } = makeScene();
  fan.position.set(12, 4, -7);
  const player = new AnimationPlayer(root, [makeClip({
    tracks: [{
      target_id: "fan",
      property: "position",
      relative: true,
      keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [0, 0, 20] }]
    }]
  })]);
  player.selectClip("clip.test");
  player.seek(0.5);
  assert.deepEqual(fan.position.toArray(), [12, 4, 21]);
  player.stop();
  assert.deepEqual(fan.position.toArray(), [12, 4, -7]);
  player.dispose();
});


test("manufacturer-stated world position offsets are not presentation-scaled", () => {
  const wrapper = new THREE.Group();
  const { root, fan } = makeScene();
  wrapper.add(root);
  const player = new AnimationPlayer(wrapper, [makeClip({
    evidence_status: "manufacturer_data",
    tracks: [{
      target_id: "fan",
      property: "position",
      relative: true,
      coordinate_space: "world",
      keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [0, 0, 20] }]
    }]
  })]);
  player.selectClip("clip.test");
  player.seek(1);
  const worldPosition = fan.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(worldPosition.z - 20) < 1e-6);
  player.dispose();
});

test("relative local-Y lift tracks move upward in world Z under the viewer's Y-up to Z-up wrapper", () => {
  const wrapper = new THREE.Group();
  wrapper.rotation.x = Math.PI / 2;
  const { root, fan } = makeScene();
  wrapper.add(root);
  const player = new AnimationPlayer(wrapper, [makeClip({
    tracks: [{
      target_id: "fan",
      property: "position",
      relative: true,
      keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [0, 20, 0] }]
    }]
  })]);

  player.selectClip("clip.test");
  player.seek(1);
  const worldPosition = fan.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(worldPosition.x) < 1e-6);
  assert.ok(Math.abs(worldPosition.y) < 1e-6);
  assert.ok(Math.abs(worldPosition.z - 56) < 1e-6);
  assert.deepEqual(player.getSnapshot().worldDeltas[0].delta, [0, 0, 56]);

  player.stop();
  assert.deepEqual(fan.position.toArray(), [0, 0, 0]);
  player.dispose();
});


test("world-space position tracks follow the requested vector through nested rotation and scale", () => {
  const wrapper = new THREE.Group();
  wrapper.rotation.set(Math.PI / 2, 0.1, -0.2);
  wrapper.scale.set(0.8, 1.4, 2.1);

  const gltfParent = new THREE.Group();
  gltfParent.position.set(11, -7, 5);
  gltfParent.rotation.set(0.35, -0.6, 0.8);
  gltfParent.scale.set(2.2, 0.45, 1.7);
  wrapper.add(gltfParent);

  const { root, fan } = makeScene();
  root.position.set(-4, 8, 2);
  gltfParent.add(root);
  fan.position.set(3, -6, 9);

  wrapper.updateWorldMatrix(true, true);
  const baselineWorld = fan.getWorldPosition(new THREE.Vector3());
  const player = new AnimationPlayer(wrapper, [makeClip({
    tracks: [{
      target_id: "fan",
      property: "position",
      relative: true,
      coordinate_space: "world",
      keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [0, 0, 20] }]
    }]
  })]);

  player.selectClip("clip.test");
  player.seek(1);
  const movedWorld = fan.getWorldPosition(new THREE.Vector3());
  const actualDelta = movedWorld.sub(baselineWorld);
  assert.ok(Math.abs(actualDelta.x) < 1e-5);
  assert.ok(Math.abs(actualDelta.y) < 1e-5);
  assert.ok(Math.abs(actualDelta.z - 56) < 1e-5);
  assert.deepEqual(player.getSnapshot().worldDeltas[0].delta, [0, 0, 56]);

  player.stop();
  assert.deepEqual(fan.position.toArray(), [3, -6, 9]);
  player.dispose();
});
