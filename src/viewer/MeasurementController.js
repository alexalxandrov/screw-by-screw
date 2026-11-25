import * as THREE from "three";

/**
 * Draws two-point measurements in world/model coordinates.
 * It intentionally does not claim that imported proxy geometry matches a
 * physical object. Unit metadata is a label, not a calibration certificate.
 */
export class MeasurementController {
  constructor(scene, { markerRadius = 1.5, unit = null } = {}) {
    if (!scene?.isObject3D) throw new TypeError("MeasurementController requires a Three.js scene or group");
    if (!Number.isFinite(markerRadius) || markerRadius <= 0) {
      throw new TypeError("markerRadius must be a positive finite number");
    }
    this.scene = scene;
    this.markerRadius = markerRadius;
    this.unit = typeof unit === "string" && unit.trim() ? unit.trim() : null;
    this.points = [];
    this.group = new THREE.Group();
    this.group.name = "SBS model-space measurement overlay";
    this.group.userData.sbs_overlay = "measurement";
    this.scene.add(this.group);
  }

  setUnit(unit) {
    this.unit = typeof unit === "string" && unit.trim() ? unit.trim() : null;
  }

  addPoint(point) {
    if (!point?.isVector3 || ![point.x, point.y, point.z].every(Number.isFinite)) {
      throw new TypeError("Measurement point must be a finite THREE.Vector3");
    }
    if (this.points.length >= 2) this.clear();
    this.points.push(point.clone());
    this.render();
    return {
      pointCount: this.points.length,
      distance: this.getDistance(),
      unit: this.unit
    };
  }

  getDistance() {
    return this.points.length === 2 ? this.points[0].distanceTo(this.points[1]) : null;
  }

  clear() {
    this.points = [];
    this.clearVisuals();
  }

  render() {
    this.clearVisuals();
    const markerGeometry = new THREE.SphereGeometry(this.markerRadius, 16, 12);
    const first = new THREE.Mesh(
      markerGeometry,
      new THREE.MeshBasicMaterial({ color: 0xc3e86d, depthTest: false, depthWrite: false })
    );
    first.position.copy(this.points[0]);
    first.renderOrder = 1000;
    first.name = "Measurement point 1";
    this.group.add(first);

    if (this.points.length < 2) return;

    const second = new THREE.Mesh(
      markerGeometry.clone(),
      new THREE.MeshBasicMaterial({ color: 0xe9b96a, depthTest: false, depthWrite: false })
    );
    second.position.copy(this.points[1]);
    second.renderOrder = 1000;
    second.name = "Measurement point 2";
    this.group.add(second);

    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(this.points),
      new THREE.LineBasicMaterial({ color: 0xe6ebf0, depthTest: false, depthWrite: false })
    );
    line.renderOrder = 999;
    line.name = "Measurement distance line";
    this.group.add(line);
  }

  clearVisuals() {
    for (const object of [...this.group.children]) {
      this.group.remove(object);
      object.traverse((child) => {
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach((material) => material.dispose());
      });
    }
  }

  dispose() {
    this.clear();
    this.scene.remove(this.group);
  }
}
