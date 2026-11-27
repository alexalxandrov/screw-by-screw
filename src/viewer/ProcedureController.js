import * as THREE from "three";

/**
 * Executes authored, reversible visual states for a documented removal branch.
 * This only changes the educational 3D scene; it does not control physical
 * hardware and must never be presented as an automated service tool.
 */
export class ProcedureController {
  constructor(root, { steps = [], commonStepIds = [], routes = [] } = {}) {
    if (!root?.isObject3D) throw new TypeError("ProcedureController requires a Three.js Object3D root");
    if (!Array.isArray(steps) || !Array.isArray(commonStepIds) || !Array.isArray(routes)) {
      throw new TypeError("ProcedureController requires steps, commonStepIds and routes arrays");
    }
    this.root = root;
    this.steps = steps;
    this.commonStepIds = [...commonStepIds];
    this.routes = routes;
    this.stepMap = new Map();
    this.nodesById = new Map();
    this.baseline = new Map();
    this.baselineMaterials = new Map();
    this.routeId = "";
    this.routeStepIds = [...this.commonStepIds];
    this.index = -1;
    this.busy = false;
    this.disposed = false;
    this.validatePackage();
    this.captureBaseline();
  }

  validatePackage() {
    for (const step of this.steps) {
      if (!step?.id || this.stepMap.has(step.id)) throw new TypeError("Procedure step IDs must be unique");
      this.stepMap.set(step.id, step);
    }
    for (const id of this.commonStepIds) {
      if (!this.stepMap.has(id)) throw new TypeError("Unknown common procedure step: " + id);
    }
    const routeIds = new Set();
    for (const route of this.routes) {
      if (!route?.id || routeIds.has(route.id)) throw new TypeError("Procedure route IDs must be unique");
      routeIds.add(route.id);
      if (!Array.isArray(route.step_ids)) throw new TypeError("Route " + route.id + " must define step_ids");
      for (const id of route.step_ids) {
        if (!this.stepMap.has(id)) throw new TypeError("Unknown step " + id + " in route " + route.id);
      }
    }
    for (const step of this.steps) {
      for (const prerequisite of step.prerequisite_step_ids ?? []) {
        if (!this.stepMap.has(prerequisite)) throw new TypeError("Unknown prerequisite " + prerequisite + " for " + step.id);
      }
      for (const action of step.visual_actions ?? []) {
        if (!action || !["move", "hide", "show", "emphasis", "noop"].includes(action.type)) {
          throw new TypeError("Unsupported visual action in " + step.id);
        }
        if (action.type !== "noop" && !Array.isArray(action.target_ids)) {
          throw new TypeError("Visual action in " + step.id + " must define target_ids");
        }
        for (const id of action.target_ids ?? []) {
          if (typeof id !== "string" || !id.trim()) throw new TypeError("Invalid visual action target in " + step.id);
        }
        if (action.type === "move" && (!Array.isArray(action.offset) || action.offset.length !== 3 || action.offset.some((value) => !Number.isFinite(value)))) {
          throw new TypeError("Move action in " + step.id + " requires a finite 3D offset");
        }
      }
    }
  }

  captureBaseline() {
    this.root.updateMatrixWorld(true);
    this.nodesById.clear();
    this.baseline.clear();
    this.baselineMaterials.clear();
    this.root.traverse((object) => {
      const id = object.userData?.sbs_component_id;
      if (typeof id === "string" && id) {
        if (this.nodesById.has(id)) throw new TypeError("Duplicate component ID in procedure scene: " + id);
        this.nodesById.set(id, object);
      }
      this.baseline.set(object, {
        position: object.position.clone(),
        quaternion: object.quaternion.clone(),
        scale: object.scale.clone(),
        visible: object.visible
      });
      if (object.material) this.baselineMaterials.set(object, object.material);
    });

    for (const step of this.steps) {
      for (const action of step.visual_actions ?? []) {
        for (const id of action.target_ids ?? []) {
          if (!this.nodesById.has(id)) throw new TypeError("Scene target " + id + " for " + step.id + " is missing");
        }
      }
    }
  }

  getRoute(routeId = this.routeId) {
    if (!routeId) return null;
    return this.routes.find((route) => route.id === routeId) ?? null;
  }

  setBranch(routeId = "") {
    if (this.busy) throw new Error("Cannot change procedure branch during an animation");
    if (routeId && !this.getRoute(routeId)) throw new TypeError("Unknown procedure branch: " + routeId);

    // Keep completed common access steps (for example, opening the case), but
    // discard any actions from the previously selected FRU branch.
    const completedCommonCount = Math.min(
      Math.max(this.index + 1, 0),
      this.commonStepIds.length
    );
    this.restoreBaseline();
    this.routeId = routeId;
    const route = this.getRoute(routeId);
    this.routeStepIds = [...this.commonStepIds, ...(route?.step_ids ?? [])];
    this.index = completedCommonCount - 1;

    // Rebuild the common prefix from the captured baseline so the scene and
    // timeline stay in sync when a branch is selected or changed.
    for (let index = 0; index < completedCommonCount; index += 1) {
      const step = this.stepMap.get(this.commonStepIds[index]);
      for (const action of step.visual_actions ?? []) this.applyAction(action);
    }
    return this.getSnapshot();
  }

  getSnapshot() {
    const currentStepId = this.index >= 0 ? this.routeStepIds[this.index] ?? null : null;
    const currentStep = currentStepId ? this.stepMap.get(currentStepId) ?? null : null;
    const commonComplete = this.index >= this.commonStepIds.length - 1;
    const branchRequired = commonComplete && !this.routeId && this.routes.length > 0;
    const isComplete = this.index >= 0 && this.index >= this.routeStepIds.length - 1 && Boolean(this.routeId);
    return {
      branchId: this.routeId,
      stepIndex: this.index,
      stepCount: this.routeStepIds.length,
      currentStepId,
      currentStep,
      completedStepIds: this.routeStepIds.slice(0, this.index + 1),
      canGoPrevious: this.index >= 0 && !this.busy,
      canGoNext: this.index + 1 < this.routeStepIds.length && !this.busy && !branchRequired,
      branchRequired,
      isComplete,
      busy: this.busy,
      route: this.getRoute()
    };
  }

  prerequisitesFor(step) {
    const completed = new Set(this.routeStepIds.slice(0, this.index + 1));
    return (step.prerequisite_step_ids ?? []).filter((id) => !completed.has(id));
  }

  async advance({ animate = true } = {}) {
    if (this.disposed) return { ok: false, reason: "disposed" };
    if (this.busy) return { ok: false, reason: "busy" };
    const nextIndex = this.index + 1;
    if (nextIndex >= this.routeStepIds.length) {
      return { ok: false, reason: this.routeId ? "complete" : "branch_required", snapshot: this.getSnapshot() };
    }
    const step = this.stepMap.get(this.routeStepIds[nextIndex]);
    const missing = this.prerequisitesFor(step);
    if (missing.length) return { ok: false, reason: "missing_prerequisites", missing, step, snapshot: this.getSnapshot() };

    this.busy = true;
    try {
      for (const action of step.visual_actions ?? []) {
        if (action.type === "move" && animate) await this.animateMove(action);
        else this.applyAction(action);
      }
      this.index = nextIndex;
      return { ok: true, step, snapshot: this.getSnapshot() };
    } finally {
      this.busy = false;
    }
  }

  previous() {
    if (this.busy) throw new Error("Cannot rewind procedure during an animation");
    if (this.index < 0) return this.getSnapshot();
    this.index -= 1;
    this.restoreBaseline();
    for (let index = 0; index <= this.index; index += 1) {
      const step = this.stepMap.get(this.routeStepIds[index]);
      for (const action of step.visual_actions ?? []) this.applyAction(action);
    }
    return this.getSnapshot();
  }

  reset() {
    if (this.busy) throw new Error("Cannot reset procedure during an animation");
    this.restoreBaseline();
    this.routeId = "";
    this.routeStepIds = [...this.commonStepIds];
    this.index = -1;
    return this.getSnapshot();
  }

  restoreBaseline() {
    for (const [object, original] of this.baseline) {
      object.position.copy(original.position);
      object.quaternion.copy(original.quaternion);
      object.scale.copy(original.scale);
      object.visible = original.visible;
    }
    for (const [object, material] of this.baselineMaterials) object.material = material;
    this.root.updateMatrixWorld(true);
  }

  applyAction(action) {
    if (action.type === "noop") return;
    const targets = (action.target_ids ?? []).map((id) => this.nodesById.get(id));
    if (targets.some((node) => !node)) throw new Error("A documented procedure target disappeared from the scene");

    if (action.type === "move") {
      const offset = new THREE.Vector3(...action.offset);
      for (const node of targets) node.position.add(offset);
    } else if (action.type === "hide" || action.type === "show") {
      for (const node of targets) node.visible = action.type === "show";
    } else if (action.type === "emphasis") {
      const color = action.color ?? "#d2a45e";
      for (const node of targets) {
        node.traverse((object) => {
          if (!object.isMesh || !object.material) return;
          const cloneOne = (material) => {
            const clone = material.clone();
            if (clone.color?.set) clone.color.set(color);
            if (clone.emissive?.set) {
              clone.emissive.set(color);
              clone.emissiveIntensity = Math.max(Number(clone.emissiveIntensity) || 0, 0.16);
            }
            return clone;
          };
          object.material = Array.isArray(object.material)
            ? object.material.map(cloneOne)
            : cloneOne(object.material);
        });
      }
    }
    this.root.updateMatrixWorld(true);
  }

  animateMove(action) {
    const targets = (action.target_ids ?? []).map((id) => this.nodesById.get(id));
    if (targets.some((node) => !node)) return Promise.reject(new Error("A procedure movement target is missing"));
    const starts = targets.map((node) => node.position.clone());
    const ends = starts.map((start) => start.clone().add(new THREE.Vector3(...action.offset)));
    const duration = Math.max(1, Number(action.duration_ms) || 700);
    if (typeof requestAnimationFrame !== "function") {
      targets.forEach((node, index) => node.position.copy(ends[index]));
      this.root.updateMatrixWorld(true);
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      let startTime = null;
      const tick = (time) => {
        if (startTime === null) startTime = time;
        const progress = THREE.MathUtils.clamp((time - startTime) / duration, 0, 1);
        const eased = progress * progress * (3 - 2 * progress);
        targets.forEach((node, index) => node.position.lerpVectors(starts[index], ends[index], eased));
        this.root.updateMatrixWorld(true);
        if (progress >= 1) resolve(true);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  dispose() {
    if (this.disposed || this.busy) return;
    this.restoreBaseline();
    this.disposed = true;
  }
}
