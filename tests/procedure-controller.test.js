import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { ProcedureController } from "../src/viewer/ProcedureController.js";

function fixture() {
  const root = new THREE.Group();
  const system = new THREE.Group();
  system.userData.sbs_component_id = "assembly.system_unit";
  root.add(system);
  const cover = new THREE.Group();
  cover.userData.sbs_component_id = "assembly.cover";
  system.add(cover);
  const coverScrew = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x777777 }));
  coverScrew.userData.sbs_component_id = "fastener.cover.left";
  cover.add(coverScrew);
  const psu = new THREE.Group();
  psu.userData.sbs_component_id = "assembly.power_supply";
  system.add(psu);
  const psuScrew = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  psuScrew.userData.sbs_component_id = "fastener.psu.1";
  psu.add(psuScrew);
  const board = new THREE.Group();
  board.userData.sbs_component_id = "assembly.system_board";
  system.add(board);
  return { root, cover, coverScrew, psu, psuScrew, board };
}

function packageData() {
  const steps = [
    { id: "open", prerequisite_step_ids: [], visual_actions: [{ type: "emphasis", target_ids: ["fastener.cover.left"], color: "#d8a35c" }] },
    { id: "cover", prerequisite_step_ids: ["open"], visual_actions: [{ type: "move", target_ids: ["assembly.cover"], offset: [0, -50, 0] }] },
    { id: "psu-screws", prerequisite_step_ids: ["cover"], visual_actions: [{ type: "hide", target_ids: ["fastener.psu.1"] }] },
    { id: "psu", prerequisite_step_ids: ["psu-screws"], visual_actions: [{ type: "move", target_ids: ["assembly.power_supply"], offset: [-10, -12.7, 10] }] },
    { id: "board", prerequisite_step_ids: ["cover"], visual_actions: [{ type: "move", target_ids: ["assembly.system_board"], offset: [12.7, 0, 20] }] }
  ];
  return {
    steps,
    commonStepIds: ["open", "cover"],
    routes: [
      { id: "psu", step_ids: ["psu-screws", "psu"] },
      { id: "board", step_ids: ["board"] }
    ]
  };
}

test("common access steps apply reversible emphasis and cover movement", async () => {
  const scene = fixture();
  const originalColor = scene.coverScrew.material.color.getHex();
  const controller = new ProcedureController(scene.root, packageData());
  assert.equal((await controller.advance({ animate: false })).step.id, "open");
  assert.notEqual(scene.coverScrew.material.color.getHex(), originalColor);
  assert.equal((await controller.advance({ animate: false })).step.id, "cover");
  assert.deepEqual(scene.cover.position.toArray(), [0, -50, 0]);
  assert.equal(controller.getSnapshot().branchRequired, true);
  controller.previous();
  assert.deepEqual(scene.cover.position.toArray(), [0, 0, 0]);
  assert.notEqual(scene.coverScrew.material.color.getHex(), originalColor);
  controller.reset();
  assert.deepEqual(scene.cover.position.toArray(), [0, 0, 0]);
  assert.equal(scene.coverScrew.material.color.getHex(), originalColor);
});

test("FRU branch selection keeps procedures independent and applies reversible removals", async () => {
  const scene = fixture();
  const controller = new ProcedureController(scene.root, packageData());
  await controller.advance({ animate: false });
  await controller.advance({ animate: false });
  controller.setBranch("psu");
  await controller.advance({ animate: false });
  await controller.advance({ animate: false });
  assert.equal(scene.psuScrew.visible, false);
  assert.deepEqual(scene.psu.position.toArray(), [-10, -12.7, 10]);
  assert.equal(scene.board.position.length(), 0);
  controller.previous();
  assert.deepEqual(scene.psu.position.toArray(), [0, 0, 0]);
  assert.equal(scene.psuScrew.visible, false);
  controller.reset();
  assert.equal(scene.psuScrew.visible, true);
});

test("missing prerequisites block a branch action", async () => {
  const scene = fixture();
  const data = packageData();
  data.steps.push({
    id: "requires-unselected-branch-step",
    prerequisite_step_ids: ["psu-screws"],
    visual_actions: [{ type: "hide", target_ids: ["fastener.psu.1"] }]
  });
  data.routes.push({ id: "invalid", step_ids: ["requires-unselected-branch-step"] });
  const controller = new ProcedureController(scene.root, data);
  await controller.advance({ animate: false });
  await controller.advance({ animate: false });
  controller.setBranch("invalid");
  await controller.advance({ animate: false });
  await controller.advance({ animate: false });
  const result = await controller.advance({ animate: false });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing_prerequisites");
  assert.deepEqual(result.missing, ["psu-screws"]);
  assert.equal(scene.psuScrew.visible, true);
});

test("unselected FRU branches do not move or remove unrelated components", async () => {
  const scene = fixture();
  const controller = new ProcedureController(scene.root, packageData());
  controller.setBranch("board");
  await controller.advance({ animate: false });
  await controller.advance({ animate: false });
  await controller.advance({ animate: false });
  assert.deepEqual(scene.board.position.toArray(), [12.7, 0, 20]);
  assert.deepEqual(scene.psu.position.toArray(), [0, 0, 0]);
  assert.equal(scene.psuScrew.visible, true);
});
