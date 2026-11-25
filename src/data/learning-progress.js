const FORMAT_VERSION = 1;
const KEY_PREFIX = "sbs:learning-progress:v1:";

function emptyProgress() {
  return { index: 0, score: 0, selected_index: null, answered: false, complete: false };
}

function questionIdsFor(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return null;
  const ids = questions.map((question) => question?.id);
  if (ids.some((id) => typeof id !== "string" || !id.trim()) || new Set(ids).size !== ids.length) return null;
  return ids;
}

function sameStringArray(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeProgress(raw, modelId, questions, questionIds) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (raw.version !== FORMAT_VERSION || raw.model_id !== modelId) return null;
  if (!sameStringArray(raw.question_ids, questionIds)) return null;

  const count = questions.length;
  if (!Number.isInteger(raw.index) || raw.index < 0 || raw.index >= count) return null;
  if (!Number.isInteger(raw.score) || raw.score < 0 || raw.score > count) return null;

  const answered = raw.answered === true;
  const complete = raw.complete === true;
  const selected = raw.selected_index === null ? null : raw.selected_index;
  const choiceCount = Array.isArray(questions[raw.index]?.choices) ? questions[raw.index].choices.length : 0;
  if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected >= choiceCount)) return null;
  if (answered && selected === null) return null;
  if (complete && (!answered || raw.index !== count - 1)) return null;
  if (raw.score > raw.index + (answered ? 1 : 0)) return null;

  return { index: raw.index, score: raw.score, selected_index: selected, answered, complete };
}

/**
 * Local-only progress storage. It stores stable question IDs and answer indices,
 * never account data, free-form input or information sent to a remote service.
 */
export function createLearningProgressStore({ storageProvider = () => globalThis.localStorage } = {}) {
  function getStorage() {
    try {
      const storage = storageProvider?.();
      if (!storage || typeof storage.getItem !== "function" ||
          typeof storage.setItem !== "function" || typeof storage.removeItem !== "function") return null;
      return storage;
    } catch {
      return null;
    }
  }

  function keyFor(modelId) {
    return KEY_PREFIX + encodeURIComponent(modelId);
  }

  function load(modelId, questions) {
    const questionIds = questionIdsFor(questions);
    const storage = getStorage();
    if (typeof modelId !== "string" || !modelId || !questionIds || !storage) {
      return { progress: emptyProgress(), resumed: false, available: Boolean(storage) };
    }

    const key = keyFor(modelId);
    let encoded;
    try {
      encoded = storage.getItem(key);
    } catch {
      return { progress: emptyProgress(), resumed: false, available: false };
    }
    if (encoded === null || encoded === undefined) {
      return { progress: emptyProgress(), resumed: false, available: true };
    }

    try {
      const parsed = JSON.parse(encoded);
      const progress = normalizeProgress(parsed, modelId, questions, questionIds);
      if (progress) return { progress, resumed: true, available: true };
    } catch {
      // Corrupt or inaccessible storage is treated as an empty session.
    }

    try { storage.removeItem(key); } catch {}
    return { progress: emptyProgress(), resumed: false, available: true };
  }

  function save(modelId, questions, progress) {
    const questionIds = questionIdsFor(questions);
    const storage = getStorage();
    if (typeof modelId !== "string" || !modelId || !questionIds || !storage) return false;
    const normalized = normalizeProgress({
      version: FORMAT_VERSION,
      model_id: modelId,
      question_ids: questionIds,
      ...progress
    }, modelId, questions, questionIds);
    if (!normalized) return false;

    try {
      storage.setItem(keyFor(modelId), JSON.stringify({
        version: FORMAT_VERSION,
        model_id: modelId,
        question_ids: questionIds,
        ...normalized
      }));
      return true;
    } catch {
      return false;
    }
  }

  function clear(modelId) {
    const storage = getStorage();
    if (typeof modelId !== "string" || !modelId || !storage) return false;
    try {
      storage.removeItem(keyFor(modelId));
      return true;
    } catch {
      return false;
    }
  }

  return { load, save, clear };
}
