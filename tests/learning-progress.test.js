import test from "node:test";
import assert from "node:assert/strict";
import { createLearningProgressStore } from "../src/data/learning-progress.js";

const questions = [
  { id: "q.one", choices: [{}, {}, {}] },
  { id: "q.two", choices: [{}, {}, {}] },
  { id: "q.three", choices: [{}, {}, {}] }
];

function createMemoryStore() {
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  return { storage, values, store: createLearningProgressStore({ storageProvider: () => storage }) };
}

test("starts with an empty progress record and marks local storage availability", () => {
  const { store } = createMemoryStore();
  assert.deepEqual(store.load("device.one", questions), {
    progress: { index: 0, score: 0, selected_index: null, answered: false, complete: false },
    resumed: false,
    available: true
  });
});

test("persists selected answer, checked answer and score for the exact model", () => {
  const { store } = createMemoryStore();
  assert.equal(store.save("device.one", questions, {
    index: 0, score: 0, selected_index: 1, answered: false, complete: false
  }), true);

  assert.deepEqual(store.load("device.one", questions), {
    progress: { index: 0, score: 0, selected_index: 1, answered: false, complete: false },
    resumed: true,
    available: true
  });

  assert.equal(store.save("device.one", questions, {
    index: 1, score: 1, selected_index: 2, answered: true, complete: false
  }), true);
  assert.deepEqual(store.load("device.one", questions).progress, {
    index: 1, score: 1, selected_index: 2, answered: true, complete: false
  });
  assert.equal(store.load("device.two", questions).resumed, false);
});

test("stores completed state and clears it on restart", () => {
  const { store } = createMemoryStore();
  assert.equal(store.save("device.one", questions, {
    index: 2, score: 2, selected_index: 1, answered: true, complete: true
  }), true);
  assert.equal(store.load("device.one", questions).progress.complete, true);
  assert.equal(store.clear("device.one"), true);
  assert.equal(store.load("device.one", questions).resumed, false);
});

test("resets stale or corrupt progress when model questions change", () => {
  const { store, storage, values } = createMemoryStore();
  store.save("device.one", questions, {
    index: 1, score: 1, selected_index: null, answered: false, complete: false
  });
  const changedQuestions = [{ ...questions[0] }, { ...questions[1], id: "q.two.revised" }, { ...questions[2] }];
  assert.equal(store.load("device.one", changedQuestions).resumed, false);
  assert.equal(values.size, 0);

  const key = "sbs:learning-progress:v1:device.one";
  storage.setItem(key, "{not-json");
  assert.equal(store.load("device.one", questions).resumed, false);
  assert.equal(values.has(key), false);
});

test("rejects invalid question/answer indices and impossible score state", () => {
  const { store, values } = createMemoryStore();
  assert.equal(store.save("device.one", questions, {
    index: 0, score: 0, selected_index: 99, answered: false, complete: false
  }), false);
  assert.equal(store.save("device.one", questions, {
    index: 0, score: 2, selected_index: 1, answered: false, complete: false
  }), false);
  assert.equal(values.size, 0);
});

test("continues the quiz when browser storage is unavailable or throws", () => {
  const unavailable = createLearningProgressStore({ storageProvider: () => null });
  assert.equal(unavailable.load("device.one", questions).available, false);
  assert.equal(unavailable.save("device.one", questions, {
    index: 0, score: 0, selected_index: 1, answered: false, complete: false
  }), false);
  const blocked = createLearningProgressStore({ storageProvider: () => { throw new Error("SecurityError"); } });
  assert.equal(blocked.load("device.one", questions).available, false);
  assert.equal(blocked.clear("device.one"), false);
});
