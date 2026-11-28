import { Vector3 } from "three";

/**
 * Generic playback for package-authored, normalized component animation tracks.
 * Position tracks may set coordinate_space:"world" to define offsets in viewer
 * coordinates; parent transforms and scale are inverted by the player at runtime.
 * Educational position-track travel is amplified around its starting keyframe for
 * visual clearance, not metrology. Manufacturer-data tracks remain unmodified.
 * This class is intentionally independent of device-specific model content.
 */
export class AnimationPlayer {
  constructor(root, clips = [], { onChange = () => {}, reducedMotion = false, positionOffsetScale = 2.8 } = {}) {
    if (!root?.isObject3D) throw new TypeError("AnimationPlayer requires a Three.js Object3D root");
    if (!Array.isArray(clips)) throw new TypeError("Animation clips must be an array");
    this.root = root;
    this.onChange = typeof onChange === "function" ? onChange : () => {};
    this.reducedMotion = Boolean(reducedMotion);
    const requestedOffsetScale = Number(positionOffsetScale);
    this.positionOffsetScale = Number.isFinite(requestedOffsetScale)
      ? Math.max(1, requestedOffsetScale)
      : 1.8;
    this.nodesById = new Map();
    this.duplicateIds = [];
    root.traverse((object) => {
      const id = object.userData?.sbs_component_id;
      if (typeof id !== "string" || !id) return;
      if (this.nodesById.has(id)) this.duplicateIds.push(id);
      else this.nodesById.set(id, object);
    });

    this.clips = new Map();
    for (const clip of clips) {
      if (!clip || typeof clip.id !== "string" || !clip.id) throw new TypeError("Every animation clip needs an ID");
      if (this.clips.has(clip.id)) throw new Error("Duplicate animation clip ID: " + clip.id);
      this.clips.set(clip.id, clip);
    }

    this.clip = null;
    this.status = "idle";
    this.currentTime = 0;
    this.speed = 1;
    this.frameHandle = null;
    this.lastFrameTimestamp = null;
    this.snapshots = new Map();
    this._tick = this._tick.bind(this);
  }

  getSnapshot() {
    const duration = Number(this.clip?.duration_ms ?? 0);
    const tracks = this.clip?.tracks ?? [];
    const worldDeltas = tracks.filter((track) => track.property === "position").map((track) => {
      const baseline = this.snapshots.get(track.target_id + "::" + track.property);
      if (!baseline?.worldPosition) return null;
      const current = baseline.object.getWorldPosition(new Vector3());
      const delta = current.sub(baseline.worldPosition);
      return {
        targetId: track.target_id,
        delta: delta.toArray().map((value) => Math.abs(value) < 1e-8 ? 0 : Number(value.toFixed(3)))
      };
    }).filter(Boolean);
    const movedTargetIds = new Set(worldDeltas
      .filter((entry) => Math.hypot(...entry.delta) > 1e-3)
      .map((entry) => entry.targetId));
    return {
      clipId: this.clip?.id ?? null,
      status: this.status,
      time: this.currentTime,
      duration,
      progress: duration > 0 ? Math.max(0, Math.min(1, this.currentTime / duration)) : 0,
      speed: this.speed,
      targetCount: new Set(tracks.map((track) => track.target_id)).size,
      movedTargetCount: movedTargetIds.size,
      worldDeltas
    };
  }

  _publish() {
    this.onChange(this.getSnapshot());
  }

  _captureValue(object, property) {
    if (property === "visible") return object.visible;
    const value = object[property];
    if (!value || typeof value.toArray !== "function") throw new TypeError("Animation target property is not a Three.js vector");
    return value.toArray().slice(0, 3);
  }

  _restoreValue(object, property, value) {
    if (property === "visible") object.visible = value;
    else object[property].set(value[0], value[1], value[2]);
  }

  _captureClip() {
    this.snapshots.clear();
    if (!this.clip) return;
    this.root.updateWorldMatrix(true, true);
    for (const track of this.clip.tracks) {
      const object = this.nodesById.get(track.target_id);
      if (!object) throw new Error("Animation target is missing: " + track.target_id);
      if (this.duplicateIds.includes(track.target_id)) throw new Error("Animation target ID is ambiguous: " + track.target_id);
      const key = track.target_id + "::" + track.property;
      if (!this.snapshots.has(key)) {
        this.snapshots.set(key, {
          object,
          property: track.property,
          value: this._captureValue(object, track.property),
          worldPosition: track.property === "position" ? object.getWorldPosition(new Vector3()) : null
        });
      }
    }
  }

  _restoreClip() {
    for (const snapshot of this.snapshots.values()) {
      this._restoreValue(snapshot.object, snapshot.property, snapshot.value);
    }
  }

  selectClip(id) {
    const clip = this.clips.get(id);
    if (!clip) return false;
    this.stop();
    this.clip = clip;
    this.currentTime = 0;
    this.status = "ready";
    this._captureClip();
    this._applyProgress(0);
    this._publish();
    return true;
  }

  setSpeed(value) {
    const parsed = Number(value);
    this.speed = Number.isFinite(parsed) ? Math.max(0.1, Math.min(4, parsed)) : 1;
    this._publish();
    return this.speed;
  }

  setReducedMotion(enabled) {
    this.reducedMotion = Boolean(enabled);
    if (this.reducedMotion && this.status === "playing" && this.clip) {
      this._cancelFrame();
      this.currentTime = Number(this.clip.duration_ms ?? 0);
      this._applyProgress(1);
      this.status = "completed";
      this.lastFrameTimestamp = null;
      this._publish();
    }
    return this.reducedMotion;
  }

  play() {
    if (!this.clip) return false;
    if (this.status === "playing") return true;
    if (this.reducedMotion) {
      this._cancelFrame();
      this.currentTime = Number(this.clip.duration_ms ?? 0);
      this._applyProgress(1);
      this.status = "completed";
      this.lastFrameTimestamp = null;
      this._publish();
      return true;
    }
    if (this.status === "completed") {
      this.currentTime = 0;
      this._applyProgress(0);
    }
    this.status = "playing";
    this.lastFrameTimestamp = null;
    this._scheduleFrame();
    this._publish();
    return true;
  }

  pause() {
    if (this.status !== "playing") return false;
    this._cancelFrame();
    this.status = "paused";
    this._publish();
    return true;
  }

  seek(progress) {
    if (!this.clip) return false;
    const normalized = Number.isFinite(Number(progress)) ? Math.max(0, Math.min(1, Number(progress))) : 0;
    this.currentTime = normalized * this.clip.duration_ms;
    this._applyProgress(normalized);
    if (this.status === "completed" && normalized < 1) this.status = "paused";
    else if (this.status === "ready" && normalized > 0) this.status = "paused";
    this.lastFrameTimestamp = null;
    this._publish();
    return true;
  }

  stop() {
    this._cancelFrame();
    this.lastFrameTimestamp = null;
    this.currentTime = 0;
    if (this.snapshots.size) this._restoreClip();
    this.status = this.clip ? "ready" : "idle";
    this._publish();
    return true;
  }

  cancel() {
    return this.stop();
  }

  _scheduleFrame() {
    if (this.frameHandle !== null) return;
    if (typeof globalThis.requestAnimationFrame !== "function") {
      throw new Error("requestAnimationFrame is unavailable");
    }
    this.frameHandle = globalThis.requestAnimationFrame(this._tick);
  }

  _cancelFrame() {
    if (this.frameHandle !== null && typeof globalThis.cancelAnimationFrame === "function") {
      globalThis.cancelAnimationFrame(this.frameHandle);
    }
    this.frameHandle = null;
  }

  _tick(timestamp) {
    this.frameHandle = null;
    if (this.status !== "playing" || !this.clip) return;
    if (this.lastFrameTimestamp === null) this.lastFrameTimestamp = timestamp;
    else {
      const delta = Math.max(0, timestamp - this.lastFrameTimestamp);
      this.lastFrameTimestamp = timestamp;
      this.currentTime = Math.min(this.clip.duration_ms, this.currentTime + delta * this.speed);
    }
    const progress = this.currentTime / this.clip.duration_ms;
    this._applyProgress(progress);
    if (progress >= 1) {
      this.status = "completed";
      this.lastFrameTimestamp = null;
    } else {
      this._scheduleFrame();
    }
    this._publish();
  }

  _applyProgress(progress) {
    if (!this.clip) return;
    let eased = progress;
    if (this.clip.easing === "ease_in_out") eased = progress * progress * (3 - 2 * progress);

    for (const track of this.clip.tracks) {
      const object = this.nodesById.get(track.target_id);
      if (!object) continue;
      const frames = track.keyframes;
      let left = frames[0];
      let right = frames[frames.length - 1];
      for (let index = 1; index < frames.length; index += 1) {
        if (eased <= frames[index].t) {
          right = frames[index];
          left = frames[index - 1];
          break;
        }
      }
      const span = right.t - left.t;
      const amount = span > 0 ? Math.max(0, Math.min(1, (eased - left.t) / span)) : 1;
      let value;
      if (track.property === "visible") {
        value = eased >= right.t ? right.value : left.value;
      } else {
        value = left.value.map((entry, index) => entry + (right.value[index] - entry) * amount);
      }
      // Educational position tracks are presentation motion, whether authored
      // as offsets from the baseline or as absolute local keyframes. Scale their
      // travel while preserving the authored starting pose. Manufacturer data
      // is never altered.
      const isManufacturerPosition = track.evidence_class === "manufacturer_data" ||
        this.clip.evidence_status === "manufacturer_data";
      if (track.property === "position" && !isManufacturerPosition) {
        if (track.relative === true || track.coordinate_space === "world") {
          value = value.map((entry) => entry * this.positionOffsetScale);
        } else {
          const origin = Array.isArray(frames[0]?.value)
            ? frames[0].value
            : (this.snapshots.get(track.target_id + "::" + track.property)?.value ?? value);
          value = value.map((entry, index) =>
            origin[index] + (entry - origin[index]) * this.positionOffsetScale
          );
        }
      }
      if (track.coordinate_space === "world" && track.property === "position") {
        const baseline = this.snapshots.get(track.target_id + "::" + track.property)?.worldPosition;
        if (!baseline) throw new Error("World-space animation target has no captured position: " + track.target_id);
        const desiredWorldPosition = baseline.clone().add(new Vector3(value[0], value[1], value[2]));
        if (object.parent) {
          object.parent.updateWorldMatrix(true, false);
          object.position.copy(object.parent.worldToLocal(desiredWorldPosition));
        } else {
          object.position.copy(desiredWorldPosition);
        }
      } else {
        if (track.relative === true && track.property !== "visible") {
          const baseline = this.snapshots.get(track.target_id + "::" + track.property)?.value;
          if (baseline) value = value.map((entry, index) => baseline[index] + entry);
        }
        this._restoreValue(object, track.property, value);
      }
    }
  }

  dispose() {
    this.stop();
    this.clip = null;
    this.clips.clear();
    this.nodesById.clear();
    this.snapshots.clear();
    this.status = "idle";
    this._publish();
    this.root = null;
  }
}
