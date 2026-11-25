import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { SceneController } from "../src/viewer/SceneController.js";

function makeScene() {
  const root = new THREE.Group();
  root.userData.sbs_component_id = "assembly.root";
  const assembly = new THREE.Group();
  assembly.userData.sbs_component_id = "assembly.cooling";
  root.add(assembly);
  const fan = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
  fan.userData.sbs_component_id = "fan.1";
  fan.position.set(10, 0, 0);
  assembly.add(fan);
  const board = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 2), new THREE.MeshBasicMaterial());
  board.userData.sbs_component_id = "board";
  board.position.set(-10, 0, 0);
  root.add(board);
  return { root, assembly, fan, board };
}

test("indexes stable IDs and identifies independently movable leaves", () => {
  const { root } = makeScene();
  const controller = new SceneController(root);
  assert.equal(controller.getNode("fan.1")?.userData.sbs_component_id, "fan.1");
  assert.equal(controller.nodesById.size, 4);
  assert.equal(controller.explodable.length, 2);
});

test("exploded view is reversible and preserves nested hierarchy", () => {
  const { root, fan, board } = makeScene();
  const controller = new SceneController(root);
  const fanStart = fan.position.clone();
  const boardStart = board.position.clone();
  controller.setExplode(100);
  assert.notDeepEqual(fan.position.toArray(), fanStart.toArray());
  assert.notDeepEqual(board.position.toArray(), boardStart.toArray());
  controller.setExplode(0);
  assert.deepEqual(fan.position.toArray(), fanStart.toArray());
  assert.deepEqual(board.position.toArray(), boardStart.toArray());
});

test("isolation restores original visibility state", () => {
  const { root, assembly, fan, board } = makeScene();
  board.visible = false;
  const controller = new SceneController(root);
  controller.setIsolated(fan, true);
  assert.equal(fan.visible, true);
  assert.equal(assembly.visible, true);
  assert.equal(board.visible, false);
  controller.setIsolated(fan, false);
  assert.equal(board.visible, false);
  assert.equal(fan.visible, true);
  assert.equal(root.visible, true);
});

test("reset restores exploded transforms and visibility", () => {
  const { root, fan } = makeScene();
  const start = fan.position.clone();
  const controller = new SceneController(root);
  controller.setExplode(75);
  controller.setIsolated(fan, true);
  controller.reset();
  assert.equal(controller.explodeProgress, 0);
  assert.deepEqual(fan.position.toArray(), start.toArray());
});
