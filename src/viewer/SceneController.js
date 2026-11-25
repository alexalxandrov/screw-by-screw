import * as THREE from "three";

/** Device-agnostic scene controls shared by every Screw by Screw model. */
export class SceneController {
  constructor(root, { explodeDistanceFactor = 0.42 } = {}) {
    if (!root?.isObject3D) throw new TypeError("SceneController requires a Three.js Object3D root");
    this.root = root;
    this.explodeDistanceFactor = explodeDistanceFactor;
    this.explodeProgress = 0;
    this.explodable = [];
    this.nodesById = new Map();
    this.duplicateIds = [];
    this.visibilitySnapshot = null;
    this.animationFrame = null;
    this.animationTimeout = null;
    this.animationResolve = null;
    this.capture();
  }

  capture() {
    this.root.updateMatrixWorld(true);
    this.nodesById.clear();
    this.duplicateIds = [];
    const tagged = [];
    this.root.traverse((object) => {
      const id = object.userData?.sbs_component_id;
      if (typeof id !== "string" || !id) return;
      if (!this.nodesById.has(id)) this.nodesById.set(id, object);
      else this.duplicateIds.push(id);
      tagged.push(object);
    });
    const center = new THREE.Box3().setFromObject(this.root).getCenter(new THREE.Vector3());
    this.explodable = tagged.filter((object) => {
      let hasTaggedDescendant = false;
      object.traverse((child) => {
        if (child !== object && child.userData?.sbs_component_id) hasTaggedDescendant = true;
      });
      return !hasTaggedDescendant;
    }).map((object) => {
      const worldPosition = object.getWorldPosition(new THREE.Vector3());
      const direction = worldPosition.clone().sub(center);
      if (direction.lengthSq() < 1e-8) {
        const hash = [...(object.userData.sbs_component_id || object.uuid)]
          .reduce((sum, char) => sum + char.charCodeAt(0), 0);
        direction.set(Math.cos(hash), Math.sin(hash), 0.35);
      }
      direction.normalize();
      return { object, baseLocalPosition: object.position.clone(), baseWorldPosition: worldPosition, direction };
    });
    this.applyExplode(0);
    return { nodes: this.nodesById.size, explodable: this.explodable.length };
  }

  getNode(id) { return this.nodesById.get(id) ?? null; }

  setExplode(value) { this.cancelAnimation(); return this.applyExplode(value); }

  applyExplode(value) {
    this.explodeProgress = THREE.MathUtils.clamp(Number(value) || 0, 0, 100);
    const distance = this.explodeProgress * this.explodeDistanceFactor;
    this.root.updateMatrixWorld(true);
    for (const record of this.explodable) {
      const targetWorld = record.baseWorldPosition.clone().addScaledVector(record.direction, distance);
      const parent = record.object.parent;
      if (parent) {
        parent.updateWorldMatrix(true, false);
        record.object.position.copy(parent.worldToLocal(targetWorld));
      } else record.object.position.copy(targetWorld);
    }
    this.root.updateMatrixWorld(true);
    return this.explodeProgress;
  }

  animateExplode(target = 100, duration = 900, onUpdate = () => {}) {
    this.cancelAnimation();
    const from = this.explodeProgress;
    const to = THREE.MathUtils.clamp(Number(target) || 0, 0, 100);
    let start = null;
    const total = Math.max(1, Number(duration) || 1);
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (success) => {
        if (settled) return;
        settled = true;
        if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        if (this.animationTimeout !== null) clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
        this.animationResolve = null;
        resolve(success);
      };
      const fail = (error) => {
        if (settled) return;
        settled = true;
        if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        if (this.animationTimeout !== null) clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
        this.animationResolve = null;
        reject(error);
      };
      this.animationResolve = resolve;
      const tick = (now) => {
        if (settled) return;
        try {
          if (start === null) start = now;
          const linear = THREE.MathUtils.clamp((now - start) / total, 0, 1);
          const eased = linear * linear * (3 - 2 * linear);
          this.applyExplode(from + (to - from) * eased);
          onUpdate(this.explodeProgress);
          if (linear >= 1) { object.rotation[axis] = startRotation; finish(true); }
          else this.animationFrame = requestAnimationFrame(tick);
        } catch (error) {
          fail(error);
        }
      };
      // The timeout is a completion guard for throttled/background tabs.
      this.animationTimeout = setTimeout(() => {
        try {
          this.applyExplode(to);
          onUpdate(this.explodeProgress);
          finish(true);
        } catch (error) {
          fail(error);
        }
      }, total + 250);
      this.animationFrame = requestAnimationFrame(tick);
    });
  }

  animateRotation(id, { axis = "y", turns = 1, duration = 1200, onUpdate = () => {} } = {}) {
    const object = this.getNode(id);
    if (!object) return Promise.resolve(false);
    if (!["x", "y", "z"].includes(axis)) throw new TypeError("Rotation axis must be x, y or z");
    this.cancelAnimation();
    const startRotation = object.rotation[axis];
    const targetRotation = startRotation + Math.PI * 2 * Number(turns || 1);
    let start = null;
    const total = Math.max(1, Number(duration) || 1);
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (success) => {
        if (settled) return;
        settled = true;
        if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        if (this.animationTimeout !== null) clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
        this.animationResolve = null;
        resolve(success);
      };
      const fail = (error) => {
        if (settled) return;
        settled = true;
        if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        if (this.animationTimeout !== null) clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
        this.animationResolve = null;
        reject(error);
      };
      this.animationResolve = resolve;
      const tick = (now) => {
        if (settled) return;
        try {
          if (start === null) start = now;
          const linear = THREE.MathUtils.clamp((now - start) / total, 0, 1);
          const eased = linear * linear * (3 - 2 * linear);
          object.rotation[axis] = startRotation + (targetRotation - startRotation) * eased;
          onUpdate(linear);
          if (linear >= 1) finish(true);
          else this.animationFrame = requestAnimationFrame(tick);
        } catch (error) {
          fail(error);
        }
      };
      this.animationTimeout = setTimeout(() => {
        try {
          object.rotation[axis] = startRotation;
          onUpdate(1);
          finish(true);
        } catch (error) {
          fail(error);
        }
      }, total + 250);
      this.animationFrame = requestAnimationFrame(tick);
    });
  }

  cancelAnimation() {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    if (this.animationTimeout !== null) clearTimeout(this.animationTimeout);
    this.animationTimeout = null;
    if (this.animationResolve) this.animationResolve(false);
    this.animationResolve = null;
  }

  setIsolated(target, isolate = true) {
    if (!target) return false;
    if (!isolate) { this.restoreVisibility(); return true; }
    this.restoreVisibility();
    this.visibilitySnapshot = new Map();
    const keep = new Set();
    let current = target;
    while (current) { keep.add(current); current = current.parent; }
    target.traverse((object) => keep.add(object));
    this.root.traverse((object) => {
      if (object === this.root) return;
      this.visibilitySnapshot.set(object, object.visible);
      object.visible = keep.has(object);
    });
    return true;
  }

  restoreVisibility() {
    if (!this.visibilitySnapshot) return;
    for (const [object, visible] of this.visibilitySnapshot) object.visible = visible;
    this.visibilitySnapshot = null;
  }

  reset() { this.cancelAnimation(); this.restoreVisibility(); this.applyExplode(0); }
}
