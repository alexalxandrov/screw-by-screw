import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AnimationPlayer } from "../src/viewer/AnimationPlayer.js";
import { ProcedureController } from "../src/viewer/ProcedureController.js";
import { SceneController } from "../src/viewer/SceneController.js";

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
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(timestamp));
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

function makeScene() {
  const root = new THREE.Group();
  root.userData.sbs_component_id = "root";
  const component = new THREE.Group();
  component.userData.sbs_component_id = "component";
  root.add(component);
  return { root, component };
}

function makeClip() {
  return {
    id: "clip.reduced-motion",
    title: { en: "Reduced motion test", ru: "Проверка ограниченного движения" },
    evidence_status: "educational_approximation",
    duration_ms: 1000,
    tracks: [{
      target_id: "component",
      property: "position",
      keyframes: [{ t: 0, value: [0, 0, 0] }, { t: 1, value: [10, 0, 0] }]
    }]
  };
}

function makeProcedure(root) {
  return new ProcedureController(root, {
    steps: [
      { id: "access", prerequisite_step_ids: [], visual_actions: [] },
      { id: "move", prerequisite_step_ids: ["access"], visual_actions: [
        { type: "move", target_ids: ["component"], offset: [0, 12, 0], duration_ms: 100 }
      ]}
    ],
    commonStepIds: ["access", "move"],
    routes: []
  });
}

test("AnimationPlayer plays immediately under reduced motion and keeps seek available", () => {
  const raf = installRaf();
  try {
    const { root, component } = makeScene();
    const player = new AnimationPlayer(root, [makeClip()], { reducedMotion: true });
    player.selectClip("clip.reduced-motion");
    assert.equal(player.play(), true);
    assert.deepEqual(component.position.toArray(), [18, 0, 0]);
    assert.equal(player.getSnapshot().status, "completed");
    assert.equal(raf.pendingCount, 0);
    player.seek(0.5);
    assert.deepEqual(component.position.toArray(), [9, 0, 0]);
    assert.equal(player.getSnapshot().status, "paused");
    player.dispose();
  } finally {
    raf.restore();
  }
});

test("AnimationPlayer completes in-progress playback when reduced motion is enabled", () => {
  const raf = installRaf();
  try {
    const { root, component } = makeScene();
    const player = new AnimationPlayer(root, [makeClip()]);
    player.selectClip("clip.reduced-motion");
    player.play();
    raf.frame(0);
    raf.frame(250);
    assert.deepEqual(component.position.toArray(), [4.5, 0, 0]);
    assert.equal(player.getSnapshot().status, "playing");
    player.setReducedMotion(true);
    assert.deepEqual(component.position.toArray(), [10, 0, 0]);
    assert.equal(player.getSnapshot().status, "completed");
    assert.equal(raf.pendingCount, 0);
    player.dispose();
  } finally {
    raf.restore();
  }
});

test("ProcedureController applies final step transforms immediately under reduced motion", async () => {
  const { root, component } = makeScene();
  const controller = new ProcedureController(root, {
    steps: [
      { id: "access", prerequisite_step_ids: [], visual_actions: [] },
      { id: "move", prerequisite_step_ids: ["access"], visual_actions: [
        { type: "move", target_ids: ["component"], offset: [0, 12, 0], duration_ms: 100 }
      ]}
    ],
    commonStepIds: ["access", "move"],
    routes: [],
    reducedMotion: true
  });
  await controller.advance();
  const result = await controller.advance();
  assert.equal(result.ok, true);
  assert.deepEqual(component.position.toArray(), [0, 21.6, 0]);
  assert.equal(controller.getSnapshot().busy, false);
});

test("ProcedureController finishes an active step when reduced motion is enabled", async () => {
  const raf = installRaf();
  try {
    const { root, component } = makeScene();
    const controller = makeProcedure(root);
    await controller.advance({ animate: false });
    const advancing = controller.advance();
    assert.equal(raf.pendingCount, 1);
    raf.frame(0);
    raf.frame(25);
    assert.notDeepEqual(component.position.toArray(), [0, 0, 0]);
    controller.setReducedMotion(true);
    const result = await advancing;
    assert.equal(result.ok, true);
    assert.deepEqual(component.position.toArray(), [0, 21.6, 0]);
    assert.equal(controller.getSnapshot().busy, false);
    assert.equal(raf.pendingCount, 0);
  } finally {
    raf.restore();
  }
});

test("SceneController applies exploded view immediately under reduced motion", async () => {
  const raf = installRaf();
  try {
    const { root, component } = makeScene();
    component.position.set(10, 0, 0);
    const start = component.position.clone();
    const controller = new SceneController(root, { reducedMotion: true });
    assert.equal(await controller.animateExplode(100, 100), true);
    assert.equal(controller.explodeProgress, 100);
    assert.notDeepEqual(component.position.toArray(), start.toArray());
    assert.equal(raf.pendingCount, 0);
    const beforeRotation = component.rotation.y;
    assert.equal(await controller.animateRotation("component"), true);
    assert.equal(component.rotation.y, beforeRotation);
  } finally {
    raf.restore();
  }
});

test("SceneController completes an active explosion when reduced motion is enabled", async () => {
  const raf = installRaf();
  try {
    const { root, component } = makeScene();
    component.position.set(10, 0, 0);
    const controller = new SceneController(root);
    const animating = controller.animateExplode(100, 100);
    raf.frame(0);
    raf.frame(25);
    assert.ok(controller.explodeProgress > 0 && controller.explodeProgress < 100);
    controller.setReducedMotion(true);
    assert.equal(await animating, true);
    assert.equal(controller.explodeProgress, 100);
    assert.equal(raf.pendingCount, 0);
  } finally {
    raf.restore();
  }
});
