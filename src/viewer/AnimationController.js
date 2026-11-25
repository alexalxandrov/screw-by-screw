import * as THREE from "three";

const VECTOR_PROPERTIES = new Set(["position", "rotation", "scale"]);
const SUPPORTED_EASING = new Set(["linear", "ease_in", "ease_out", "ease_in_out"]);

function cloneProperty(object, property) {
  if (property === "visible") return Boolean(object.visible);
  const value = object[property];
  if (!value?.isVector3) throw new TypeError("Animation target property is not a Vector3: " + property);
  return value.clone();
}

function writeProperty(object, property, value) {
  if (property === "visible") {
    object.visible = Boolean(value);
    return;
  }
  if (VECTOR_PROPERTIES.has(property)) {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
      throw new TypeError("Animation vector keyframe must contain three finite numbers");
    }
    object[property].set(value[0], value[1], value[2]);
  }
}

function ease(value, mode) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  switch (mode) {
    case "ease_in": return t * t;
    case "ease_out": return 1 - (1 - t) * (1 - t);
    case "ease_in_out": return t * t * (3 - 2 * t);
    default: return t;
  }
}

function sampleTrack(track, normalizedTime, easingMode) {
  const frames = track.keyframes;
  if (normalizedTime <= frames[0].t) return frames[0].value;
  if (normalizedTime >= frames[frames.length - 1].t) return frames[frames.length - 1].value;

  for (let index = 1; index < frames.length; index += 1) {
    const right = frames[index];
    const left = frames[index - 1];
    if (normalizedTime > right.t) continue;
    if (track.property === "visible") return left.value;
    const segment = (normalizedTime - left.t) / (right.t - left.t);
    const eased = ease(segment, easingMode);
    if (typeof left.value === "number" && typeof right.value === "number") {
      return left.value + (right.value - left.value) * eased;
    }
    return left.value.map((value, axis) => value + (right.value[axis] - value) * eased);
  }
  return frames[frames.length - 1].value;
}

/**
 * Plays authored, model-package animation clips over stable component IDs.
 * It interpolates local position/rotation/scale and stepwise visibility only.
 * This is a deterministic presentation runtime, not a physics solver.
 */
export class AnimationController {
  constructor(root, clips = [], { requestFrame, cancelFrame, onUpdate = () => {} } = {}) {
    if (!root?.isObject3D) throw new TypeError("AnimationController requires a Three.js Object3D root");
    this.root = root;
    this.requestFrame = requestFrame ?? globalThis.requestAnimationFrame?.bind(globalThis);
    this.cancelFrame = cancelFrame ?? globalThis.cancelAnimationFrame?.bind(globalThis);
    this.onUpdate = typeof onUpdate === "function" ? onUpdate : () => {};
    this.nodesById = new Map();
    this.duplicateIds = [];
    this.missingTargets = [];
    this.clips = [];
    this.clipsById = new Map();
    this.baseValues = new Map();
    this.selectedClip = null;
    this.currentTimeMs = 0;
    this.playing = false;
    this.frameHandle = null;
    this.lastTimestamp = null;
    this._tick = this._tick.bind(this);

    root.traverse((object) => {
      const id = object.userData?.sbs_component_id;
      if (typeof id !== "string" || !id) return;
      if (this.nodesById.has(id)) this.duplicateIds.push(id);
      else this.nodesById.set(id, object);
    });
    this.setClips(clips);
  }

  setClips(clips) {
    if (!Array.isArray(clips)) throw new TypeError("Animation clips must be an array");
    this.reset();
    this.clips = clips.slice();
    this.clipsById = new Map(this.clips.map((clip) => [clip.id, clip]));
    this.missingTargets = [];
    this.baseValues.clear();

    for (const clip of this.clips) {
      for (const track of clip.tracks ?? []) {
        const object = this.nodesById.get(track.target_id);
        if (!object) {
          this.missingTargets.push(track.target_id);
          continue;
        }
        let properties = this.baseValues.get(object);
        if (!properties) {
          properties = new Map();
          this.baseValues.set(object, properties);
        }
        if (!properties.has(track.property)) {
          properties.set(track.property, cloneProperty(object, track.property));
        }
      }
    }
    this._emit();
  }

  get selectedClipId() { return this.selectedClip?.id ?? ""; }
  get durationMs() { return this.selectedClip?.duration_ms ?? 0; }
  get elapsedMs() { return this.currentTimeMs; }
  get progress() { return this.durationMs > 0 ? THREE.MathUtils.clamp(this.currentTimeMs / this.durationMs, 0, 1) : 0; }

  getSnapshot() {
    return {
      clipId: this.selectedClipId,
      playing: this.playing,
      elapsedMs: this.elapsedMs,
      durationMs: this.durationMs,
      progress: this.progress
    };
  }

  select(clipId) {
    const clip = this.clipsById.get(clipId);
    if (!clip) return false;
    this._cancelFrame();
    this._restoreBaseValues();
    this.selectedClip = clip;
    this.currentTimeMs = 0;
    this.lastTimestamp = null;
    this.playing = false;
    this._applyCurrentTime();
    this._emit();
    return true;
  }

  play(clipId = this.selectedClipId) {
    if (clipId && clipId !== this.selectedClipId && !this.select(clipId)) return false;
    if (!this.selectedClip || this.durationMs <= 0) return false;
    if (typeof this.requestFrame !== "function" || typeof this.cancelFrame !== "function") {
      throw new Error("Animation playback requires requestAnimationFrame and cancelAnimationFrame");
    }
    if (this.currentTimeMs >= this.durationMs) {
      this.currentTimeMs = 0;
      this._applyCurrentTime();
    }
    if (this.playing) return true;
    this.playing = true;
    this.lastTimestamp = null;
    this._schedule();
    this._emit();
    return true;
  }

  pause() {
    if (!this.playing) return false;
    this.playing = false;
    this.lastTimestamp = null;
    this._cancelFrame();
    this._emit();
    return true;
  }

  seek(normalizedTime) {
    if (!this.selectedClip) return false;
    const normalized = THREE.MathUtils.clamp(Number(normalizedTime) || 0, 0, 1);
    this.currentTimeMs = normalized * this.durationMs;
    this._applyCurrentTime();
    if (this.playing) {
      this._cancelFrame();
      this.lastTimestamp = null;
      this._schedule();
    }
    this._emit();
    return true;
  }

  stop() {
    this._cancelFrame();
    this.playing = false;
    this.lastTimestamp = null;
    if (!this.selectedClip) {
      this.currentTimeMs = 0;
      this._emit();
      return false;
    }
    this.currentTimeMs = 0;
    this._applyCurrentTime();
    this._emit();
    return true;
  }

  reset() {
    this._cancelFrame();
    this.playing = false;
    this.lastTimestamp = null;
    this.currentTimeMs = 0;
    this.selectedClip = null;
    this._restoreBaseValues();
    this._emit();
  }

  dispose() {
    this.reset();
    this.clips = [];
    this.clipsById.clear();
    this.baseValues.clear();
    this.nodesById.clear();
  }

  _schedule() {
    if (this.playing && this.frameHandle === null) {
      this.frameHandle = this.requestFrame(this._tick);
    }
  }

  _cancelFrame() {
    if (this.frameHandle !== null && typeof this.cancelFrame === "function") {
      this.cancelFrame(this.frameHandle);
    }
    this.frameHandle = null;
  }

  _tick(timestamp) {
    this.frameHandle = null;
    if (!this.playing || !this.selectedClip) return;
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    } else {
      const delta = Math.max(0, timestamp - this.lastTimestamp);
      this.lastTimestamp = timestamp;
      this.currentTimeMs = Math.min(this.durationMs, this.currentTimeMs + delta);
    }

    this._applyCurrentTime();
    this._emit();
    if (this.currentTimeMs >= this.durationMs) {
      this.playing = false;
      this.lastTimestamp = null;
      this._emit();
      return;
    }
    this._schedule();
  }

  _applyCurrentTime() {
    if (!this.selectedClip) return;
    const normalized = this.progress;
    const easingMode = SUPPORTED_EASING.has(this.selectedClip.easing) ? this.selectedClip.easing : "linear";
    for (const track of this.selectedClip.tracks ?? []) {
      const object = this.nodesById.get(track.target_id);
      if (!object) continue;
      writeProperty(object, track.property, sampleTrack(track, normalized, easingMode));
    }
    this.root.updateMatrixWorld(true);
  }

  _restoreBaseValues() {
    for (const [object, properties] of this.baseValues) {
      for (const [property, value] of properties) {
        if (property === "visible") object.visible = value;
        else object[property].copy(value);
      }
    }
    this.root.updateMatrixWorld(true);
  }

  _emit() {
    this.onUpdate(this.getSnapshot());
  }
}
