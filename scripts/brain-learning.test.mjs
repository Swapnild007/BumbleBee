import test from "node:test";
import assert from "node:assert/strict";

const data = new Map();
globalThis.window = {
  localStorage: {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  }
};
await import("../brain/feedback-learning.js");

const learner = globalThis.window.JarvisBrainLearning;

test("learns exact normalized phrases locally and returns the chosen intent", () => {
  learner.clear();
  const saved = learner.teach("  Call Mum!  ", "phone.call");
  assert.equal(saved.ok, true);
  assert.deepEqual(learner.lookup("call mum"), { intent: "phone.call", phrase: "call mum" });
  assert.deepEqual(learner.lookup("call my mum"), null, "learning must not generalize beyond the exact phrase");
});

test("re-teaching a phrase replaces its previous intent without duplicate entries", () => {
  learner.clear();
  assert.equal(learner.teach("time please", "time.current").ok, true);
  assert.equal(learner.teach("Time please!", "weather.current").ok, true);
  assert.equal(learner.list().length, 1);
  assert.equal(learner.lookup("time please").intent, "weather.current");
});

test("rejects empty phrases and malformed intent identifiers", () => {
  learner.clear();
  assert.equal(learner.teach("", "phone.call").ok, false);
  assert.equal(learner.teach("hello", "../phone.call").ok, false);
  assert.equal(learner.list().length, 0);
});

test("keeps a bounded set of the latest 100 learned phrases", () => {
  learner.clear();
  for (let i = 0; i < 105; i++) assert.equal(learner.teach("phrase " + i, "general.query").ok, true);
  assert.equal(learner.list().length, 100);
  assert.equal(learner.lookup("phrase 0"), null);
  assert.equal(learner.lookup("phrase 104").intent, "general.query");
});

test("clears learned phrases explicitly", () => {
  learner.teach("remember this", "memory.save");
  assert.equal(learner.clear(), true);
  assert.equal(learner.list().length, 0);
});


test("planner accepts a bounded valid multi-step plan without executing it", () => {
  const planner = globalThis.window.JarvisToolPlanner;
  const result = planner.validatePlan([
    { type: "weather" },
    { type: "reminder", minutes: 30, text: "Take an umbrella" },
    { type: "task", text: "Pack charger" }
  ], step => {
    if ((step.type === "reminder" || step.type === "timer") &&
        (!Number.isFinite(step.minutes) || step.minutes < 1 || step.minutes > 1440)) {
      return "Minutes must be between 1 and 1440.";
    }
    return "";
  });
  assert.equal(result.ok, true);
  assert.equal(result.requiresConfirmation, true);
  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[1].text, "Take an umbrella");
});

test("planner rejects unsupported, empty, oversized, and incomplete plans", () => {
  const planner = globalThis.window.JarvisToolPlanner;
  const validate = () => "";
  assert.equal(planner.validatePlan([], validate).ok, false);
  assert.equal(planner.validatePlan([{ type: "shell", command: "rm -rf" }], validate).ok, false);
  assert.equal(planner.validatePlan(Array.from({ length: 5 }, () => ({ type: "weather" })), validate).ok, false);
  const missingText = planner.validatePlan([{ type: "reminder", minutes: 15 }], validate);
  assert.equal(missingText.ok, false);
  assert.match(missingText.error, /reminder text is required/i);
});

test("planner rejects invalid durations and freezes validated steps", () => {
  const planner = globalThis.window.JarvisToolPlanner;
  const validate = step => step.type === "timer" && (!Number.isFinite(step.minutes) || step.minutes < 1)
    ? "Timer duration is invalid."
    : "";
  assert.equal(planner.validatePlan([{ type: "timer", minutes: 0 }], validate).ok, false);
  const valid = planner.validatePlan([{ type: "timer", minutes: 5 }], validate);
  assert.equal(valid.ok, true);
  assert.equal(Object.isFrozen(valid.steps), true);
  assert.equal(Object.isFrozen(valid.steps[0]), true);
});
