import { unzipSync } from "fflate";

export const MAX_MODEL_PACKAGE_BYTES = 512 * 1024 * 1024;
export const MAX_MODEL_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;
export const MAX_MODEL_PACKAGE_ENTRIES = 128;
export const MAX_SCENE_GLB_BYTES = 256 * 1024 * 1024;

const REQUIRED_FILE_KEYS = [
  "model", "scene", "components", "sources", "relationships", "claims",
  "process_layers", "assembly_steps", "learning", "animations"
];
const ANIMATION_PROPERTIES = new Set(["position", "rotation", "scale", "visible"]);

function fail(message) { throw new Error("Invalid Screw by Screw model package: " + message); }

function isSafeArchivePath(path) {
  if (typeof path !== "string" || !path || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
  if (/^[a-zA-Z]:/.test(path)) return false;
  return path.split("/").every((part) => part && part !== "." && part !== "..");
}

function preflightZip(buffer) {
  if (!(buffer instanceof ArrayBuffer)) fail("expected an ArrayBuffer");
  if (buffer.byteLength < 22 || buffer.byteLength > MAX_MODEL_PACKAGE_BYTES) fail("archive size is outside the allowed range");
  const view = new DataView(buffer);
  const min = Math.max(0, buffer.byteLength - 65557);
  let eocd = -1;
  for (let offset = buffer.byteLength - 22; offset >= min; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) fail("ZIP end-of-central-directory record is missing");
  const disk = view.getUint16(eocd + 4, true);
  const centralDisk = view.getUint16(eocd + 6, true);
  const diskEntries = view.getUint16(eocd + 8, true);
  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  const commentLength = view.getUint16(eocd + 20, true);
  if (disk || centralDisk || diskEntries !== entryCount) fail("multi-disk ZIP archives are not supported");
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) fail("ZIP64 archives are not supported by this viewer version");
  if (entryCount < 1 || entryCount > MAX_MODEL_PACKAGE_ENTRIES) fail("archive contains too many entries");
  if (eocd + 22 + commentLength !== buffer.byteLength) fail("invalid ZIP comment length");
  if (centralOffset + centralSize > eocd) fail("central directory bounds are invalid");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const entries = [];
  const names = new Set();
  let totalUncompressed = 0;
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > centralOffset + centralSize || view.getUint32(cursor, true) !== 0x02014b50) fail("invalid central directory entry");
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const entryCommentLength = view.getUint16(cursor + 32, true);
    const diskStart = view.getUint16(cursor + 34, true);
    const externalAttributes = view.getUint32(cursor + 38, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const nameStart = cursor + 46;
    const next = nameStart + nameLength + extraLength + entryCommentLength;
    if (next > centralOffset + centralSize || diskStart !== 0) fail("invalid central directory entry bounds");
    if (flags & 0x0001) fail("encrypted ZIP entries are not allowed");
    if (method !== 0 && method !== 8) fail("only stored and deflate ZIP entries are supported");
    if (localOffset >= centralOffset) fail("local file header points outside the data section");
    if (uncompressedSize > MAX_SCENE_GLB_BYTES) fail("an archive entry exceeds the per-file size limit");
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_MODEL_UNCOMPRESSED_BYTES) fail("expanded archive exceeds the total size limit");
    if (uncompressedSize > 0 && (compressedSize === 0 || uncompressedSize / compressedSize > 500)) fail("suspicious compression ratio");
    let name;
    try { name = decoder.decode(new Uint8Array(buffer, nameStart, nameLength)); }
    catch { fail("archive filenames must be valid UTF-8"); }
    if (!name.endsWith("/") && !isSafeArchivePath(name)) fail("unsafe archive path: " + name);
    if (names.has(name)) fail("duplicate archive path: " + name);
    names.add(name);
    const unixMode = externalAttributes >>> 16;
    if ((unixMode & 0o170000) === 0o120000) fail("symbolic links are not allowed in model packages");
    entries.push({ name, uncompressedSize, directory: name.endsWith("/") });
    cursor = next;
  }
  if (cursor !== centralOffset + centralSize) fail("central directory size does not match its entries");
  return entries;
}

function parseJsonFile(files, path, label) {
  const bytes = files[path];
  if (!bytes) fail("required file is missing: " + path);
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { fail("could not parse " + label + " JSON"); }
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(label + " must be a non-empty string");
}

function assertStringArray(value, label, allowed) {
  if (value === undefined || value === null) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || (allowed && !allowed.has(item)))) fail(label + " contains an invalid reference");
}

function validateAnimationPackage(animations, componentIds, sourceIds) {
  if (!animations || !Array.isArray(animations.clips)) fail("animations.clips must be an array");
  const clipIds = new Set();
  for (const clip of animations.clips) {
    assertString(clip.id, "animation clip id");
    if (clipIds.has(clip.id)) fail("duplicate animation clip id: " + clip.id);
    clipIds.add(clip.id);

    const title = clip.title;
    if (!(typeof title === "string" && title.trim()) &&
        !(title && typeof title === "object" && !Array.isArray(title) &&
          ["en", "ru"].some((language) => typeof title[language] === "string" && title[language].trim()))) {
      fail("animation clip title must contain readable text");
    }
    assertString(clip.evidence_status, "animation clip evidence_status");
    assertStringArray(clip.source_ids, "animation clip source_ids", sourceIds);
    if (!(clip.source_ids?.length) && !["illustrative", "educational_approximation"].includes(clip.evidence_status)) {
      fail("non-illustrative animation clips require registered source provenance");
    }
    if (!Number.isFinite(clip.duration_ms) || clip.duration_ms <= 0 || clip.duration_ms > 600000) fail("animation duration is invalid");
    if (clip.easing !== undefined && !["linear", "ease_in_out"].includes(clip.easing)) fail("unsupported animation easing");
    if (!Array.isArray(clip.tracks) || clip.tracks.length === 0) fail("animation clip needs at least one track");

    const trackKeys = new Set();
    for (const track of clip.tracks) {
      assertString(track.target_id, "animation target ID");
      if (!componentIds.has(track.target_id)) fail("animation references unknown component: " + track.target_id);
      if (!ANIMATION_PROPERTIES.has(track.property)) fail("unsupported animation property: " + track.property);
      const trackKey = track.target_id + "::" + track.property;
      if (trackKeys.has(trackKey)) fail("duplicate animation track for target/property: " + trackKey);
      trackKeys.add(trackKey);
      if (!Array.isArray(track.keyframes) || track.keyframes.length < 2) fail("animation track needs at least two keyframes");
      let previous = -1;
      for (const keyframe of track.keyframes) {
        if (!Number.isFinite(keyframe.t) || keyframe.t < 0 || keyframe.t > 1 || keyframe.t <= previous) fail("animation keyframe times must increase from 0 to 1");
        previous = keyframe.t;
        const value = keyframe.value;
        if (track.property === "visible") {
          if (typeof value !== "boolean") fail("visibility keyframes must be boolean");
        } else if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
          fail("vector animation keyframe values must be three finite numbers");
        }
      }
      if (track.keyframes[0].t !== 0 || track.keyframes[track.keyframes.length - 1].t !== 1) fail("animation tracks must cover normalized time 0..1");
    }
  }
}

export function validateModelPackageData(manifest, data) {
  if (!manifest || manifest.format !== "sbs-model" || manifest.schema_version !== "1.0.0") fail("unsupported package format or schema version");
  assertString(manifest.model_id, "manifest.model_id");
  if (!manifest.files || typeof manifest.files !== "object") fail("manifest.files is missing");
  for (const key of REQUIRED_FILE_KEYS) {
    if (!isSafeArchivePath(manifest.files[key])) fail("manifest.files." + key + " must be a safe relative path");
  }
  if (data.model.id !== manifest.model_id) fail("model ID does not match manifest");
  for (const [label, value] of [["components", data.components], ["relationships", data.relationships], ["process layers", data.process_layers], ["claims", data.claims]]) {
    if (value.device_model_id && value.device_model_id !== manifest.model_id) fail(label + " belong to another model");
  }
  const sources = data.sources.sources;
  const components = data.components.components;
  if (!Array.isArray(sources) || !Array.isArray(components)) fail("sources or components collection is missing");
  const sourceIds = new Set();
  for (const source of sources) { assertString(source.id, "source id"); if (sourceIds.has(source.id)) fail("duplicate source ID: " + source.id); sourceIds.add(source.id); }
  const componentIds = new Set();
  for (const component of components) { assertString(component.id, "component id"); if (componentIds.has(component.id)) fail("duplicate component ID: " + component.id); componentIds.add(component.id); }
  for (const component of components) {
    if (component.parent_id && !componentIds.has(component.parent_id)) fail("component has unknown parent: " + component.parent_id);
    assertStringArray(component.source_ids, "component.source_ids", sourceIds);
  }
  const relationIds = new Set();
  if (!Array.isArray(data.relationships.relationships)) fail("relationships array is missing");
  for (const relation of data.relationships.relationships) {
    assertString(relation.id, "relationship id");
    if (relationIds.has(relation.id)) fail("duplicate relationship ID: " + relation.id);
    relationIds.add(relation.id);
    if (!componentIds.has(relation.from) || !componentIds.has(relation.to)) fail("relationship references an unknown component");
    assertStringArray(relation.source_ids, "relationship.source_ids", sourceIds);
  }
  if (!Array.isArray(data.process_layers.process_layers)) fail("process_layers array is missing");
  for (const layer of data.process_layers.process_layers) {
    assertString(layer.id, "process layer id");
    if (!Array.isArray(layer.linked_component_ids)) fail("process layer linked_component_ids must be an array");
    assertStringArray(layer.linked_component_ids, "process layer linked_component_ids", componentIds);
    if (!Array.isArray(layer.source_ids)) fail("process layer source_ids must be an array");
    assertStringArray(layer.source_ids, "process layer source_ids", sourceIds);
  }
  if (!Array.isArray(data.claims.claims)) fail("claims array is missing");
  for (const claim of data.claims.claims) {
    assertString(claim.id, "claim id");
    if (claim.subject_id && claim.subject_id !== manifest.model_id && !componentIds.has(claim.subject_id)) fail("claim references an unknown subject");
    assertStringArray(claim.source_ids, "claim.source_ids", sourceIds);
  }
  if (!Array.isArray(data.assembly_steps.steps)) fail("assembly_steps.steps must be an array");
  const assemblyStepIds = new Set();
  const assemblyStepById = new Map();
  const assemblySequences = new Set();
  for (const step of data.assembly_steps.steps) {
    assertString(step.id, "assembly step id");
    if (assemblyStepIds.has(step.id)) fail("duplicate assembly step ID: " + step.id);
    assemblyStepIds.add(step.id);
    assemblyStepById.set(step.id, step);
    if (!Number.isInteger(step.sequence) || step.sequence < 1 || assemblySequences.has(step.sequence)) {
      fail("assembly step sequence must be a unique positive integer");
    }
    assemblySequences.add(step.sequence);
    const action = step.action ?? step.title;
    if (!(typeof action === "string" && action.trim()) &&
        !(action && typeof action === "object" && !Array.isArray(action) &&
          ["en", "ru"].some((language) => typeof action[language] === "string" && action[language].trim()))) {
      fail("assembly step action/title must contain readable text");
    }
    if (!Array.isArray(step.component_ids) || step.component_ids.length === 0) fail("assembly step needs at least one component");
    assertStringArray(step.component_ids, "assembly step component_ids", componentIds);
    if (!Array.isArray(step.source_ids) || step.source_ids.length === 0) fail("assembly step needs at least one source");
    assertStringArray(step.source_ids, "assembly step source_ids", sourceIds);
    assertStringArray(step.prerequisite_step_ids, "assembly step prerequisite_step_ids");
    assertStringArray(step.tool_requirements, "assembly step tool_requirements");
    if (step.safety_notes !== undefined && typeof step.safety_notes !== "string" &&
        !(step.safety_notes && typeof step.safety_notes === "object" && !Array.isArray(step.safety_notes)) &&
        !Array.isArray(step.safety_notes)) fail("assembly step safety_notes has an invalid shape");
  }
  for (const step of data.assembly_steps.steps) {
    for (const prerequisiteId of step.prerequisite_step_ids ?? []) {
      const prerequisite = assemblyStepById.get(prerequisiteId);
      if (!prerequisite) fail("assembly step references an unknown prerequisite: " + prerequisiteId);
      if (prerequisite.sequence >= step.sequence) fail("assembly step prerequisite must precede its dependent step");
    }
  }
  if (data.assembly_steps.observations !== undefined && !Array.isArray(data.assembly_steps.observations)) {
    fail("assembly_steps.observations must be an array");
  }
  for (const observation of data.assembly_steps.observations ?? []) {
    assertString(observation.source_id, "assembly observation source_id");
    if (!sourceIds.has(observation.source_id)) fail("assembly observation references an unknown source");
    assertString(observation.locator, "assembly observation locator");
    const note = observation.note;
    if (typeof note === "string") assertString(note, "assembly observation note");
    else if (!note || typeof note !== "object" || Array.isArray(note) ||
      !["en", "ru"].some((language) => typeof note[language] === "string" && note[language].trim())) {
      fail("assembly observation note must contain readable text");
    }
  }
  if (!Array.isArray(data.learning.questions)) fail("learning.questions must be an array");
  validateAnimationPackage(data.animations, componentIds, sourceIds);
  assertStringArray(data.model.source_ids, "model.source_ids", sourceIds);
  return { modelId: manifest.model_id, componentCount: componentIds.size, sourceCount: sourceIds.size, relationshipCount: relationIds.size };
}

export function validateSelfContainedGlb(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 20 || buffer.byteLength > MAX_SCENE_GLB_BYTES) throw new Error("Invalid GLB: file size is outside the allowed range");
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength) throw new Error("Invalid GLB header");
  let offset = 12;
  let jsonCount = 0;
  let binCount = 0;
  let document = null;
  while (offset < buffer.byteLength) {
    if (offset + 8 > buffer.byteLength) throw new Error("Invalid GLB chunk header");
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > buffer.byteLength || chunkLength % 4 !== 0) throw new Error("Invalid GLB chunk bounds or alignment");
    if (chunkType === 0x4e4f534a) {
      jsonCount += 1;
      if (jsonCount > 1 || offset !== 12) throw new Error("Invalid GLB JSON chunk order");
      try { document = JSON.parse(new TextDecoder().decode(buffer.slice(chunkStart, chunkEnd)).trimEnd()); }
      catch { throw new Error("Invalid GLB JSON document"); }
    } else if (chunkType === 0x004e4942) {
      binCount += 1;
      if (binCount > 1) throw new Error("Multiple GLB BIN chunks are not supported");
    }
    offset = chunkEnd;
  }
  if (offset !== buffer.byteLength || jsonCount !== 1 || !document || typeof document !== "object") throw new Error("Incomplete GLB container");
  const resources = [...(Array.isArray(document.buffers) ? document.buffers : []), ...(Array.isArray(document.images) ? document.images : [])];
  if (resources.some((resource) => resource && typeof resource.uri === "string" && !resource.uri.startsWith("data:"))) throw new Error("External resource URIs are not allowed");
  return document;
}

async function verifyPackageChecksums(archive, manifest) {
  if (!manifest.sha256) return false;
  if (!manifest.sha256 || typeof manifest.sha256 !== "object" || Array.isArray(manifest.sha256)) fail("sha256 must be an object");
  if (!globalThis.crypto?.subtle) fail("Web Crypto is required to verify package integrity");
  for (const [path, expected] of Object.entries(manifest.sha256)) {
    if (!isSafeArchivePath(path) || !archive[path]) fail("checksum references a missing or unsafe file");
    if (typeof expected !== "string" || !/^[a-f0-9]{64}$/i.test(expected)) fail("invalid SHA-256 checksum");
    const bytes = archive[path];
    const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", view));
    const actual = [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
    if (actual.toLowerCase() !== expected.toLowerCase()) fail("SHA-256 mismatch for " + path);
  }
  for (const key of REQUIRED_FILE_KEYS) {
    if (!manifest.sha256[manifest.files[key]]) fail("SHA-256 checksum is missing for " + key);
  }
  return true;
}

export async function loadModelPackage(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new TypeError("A local .sbsmodel file is required");
  if (file.size > MAX_MODEL_PACKAGE_BYTES) fail("archive exceeds the 512 MiB package limit");
  const buffer = await file.arrayBuffer();
  const entries = preflightZip(buffer);
  let archive;
  try { archive = unzipSync(new Uint8Array(buffer)); }
  catch { fail("ZIP decompression failed"); }
  for (const entry of entries) {
    if (entry.directory) continue;
    const bytes = archive[entry.name];
    if (!bytes || bytes.byteLength !== entry.uncompressedSize) fail("expanded entry size mismatch: " + entry.name);
  }
  const manifest = parseJsonFile(archive, "sbs-model.json", "package manifest");
  if (!manifest.files || typeof manifest.files !== "object") fail("manifest file map is missing");
  const integrityVerified = await verifyPackageChecksums(archive, manifest);
  const paths = {};
  const mappedPaths = new Set();
  for (const key of REQUIRED_FILE_KEYS) {
    const path = manifest.files[key];
    if (!isSafeArchivePath(path) || !archive[path]) fail("manifest references a missing or unsafe file: " + key);
    if (mappedPaths.has(path)) fail("multiple manifest keys point to the same archive file: " + path);
    mappedPaths.add(path);
    paths[key] = path;
  }
  let release = null;
  if (manifest.files.release !== undefined) {
    if (!isSafeArchivePath(manifest.files.release) || !archive[manifest.files.release]) fail("manifest references a missing or unsafe release file");
    if (mappedPaths.has(manifest.files.release)) fail("release file duplicates another manifest path");
    release = parseJsonFile(archive, manifest.files.release, "release");
  }
  const data = {
    model: parseJsonFile(archive, paths.model, "model"),
    components: parseJsonFile(archive, paths.components, "components"),
    sources: parseJsonFile(archive, paths.sources, "sources"),
    relationships: parseJsonFile(archive, paths.relationships, "relationships"),
    claims: parseJsonFile(archive, paths.claims, "claims"),
    process_layers: parseJsonFile(archive, paths.process_layers, "process layers"),
    assembly_steps: parseJsonFile(archive, paths.assembly_steps, "assembly steps"),
    learning: parseJsonFile(archive, paths.learning, "learning"),
    animations: parseJsonFile(archive, paths.animations, "animations"),
    release
  };
  const report = validateModelPackageData(manifest, data);
  const sceneBytes = archive[paths.scene];
  if (!sceneBytes || sceneBytes.byteLength > MAX_SCENE_GLB_BYTES) fail("scene GLB is missing or too large");
  const sceneBuffer = sceneBytes.buffer.slice(sceneBytes.byteOffset, sceneBytes.byteOffset + sceneBytes.byteLength);
  const glbDocument = validateSelfContainedGlb(sceneBuffer);
  const sceneComponentIds = new Set((glbDocument.nodes ?? [])
    .map((node) => node.extras?.sbs_component_id)
    .filter((id) => typeof id === "string"));
  const missingComponents = data.components.components
    .filter((component) => !sceneComponentIds.has(component.id))
    .map((component) => component.id);
  if (missingComponents.length) fail("scene GLB is missing component nodes: " + missingComponents.slice(0, 8).join(", "));
  return { manifest, data, sceneBuffer, report, integrityVerified, filename: file.name || "model.sbsmodel" };
}
