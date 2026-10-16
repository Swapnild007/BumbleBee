import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const cases = JSON.parse(readFileSync(new URL("../training/intents.json", import.meta.url), "utf8"));
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = html.slice(html.indexOf("<script>") + "<script>".length, html.lastIndexOf("</script>"));
const start = source.indexOf("/* ===== offline intent understanding v1 ===== */");
const end = source.indexOf("/* ===== command brain: local intents first (instant, offline, then AI) ===== */");
assert.ok(start >= 0, "offline intent classifier must exist");
const marker = "/* ===== command brain: local intents first (instant, offline), then AI ===== */";
const endAt = source.indexOf(marker, start);
assert.ok(endAt > start, "classifier block must end before command handler");
const classifierSource = source.slice(start, endAt);
const { classifyIntent, commandPlan, composeClarificationAnswer } = new Function(classifierSource + "\nreturn { classifyIntent, commandPlan, composeClarificationAnswer };")();
const validationStart = source.indexOf("function validateActionProposal(a)");
const validationEnd = source.indexOf("async function runAction(a)", validationStart);
assert.ok(validationStart >= 0 && validationEnd > validationStart, "AI action validator must exist");
const validateActionProposal = new Function(source.slice(validationStart, validationEnd) + "\nreturn validateActionProposal;")();

const failures = [];
for (const c of cases.cases) {
  const got = classifyIntent(c.utterance);
  if (c.intent === "fallback.unknown") {
    if (got.id !== "general.query") failures.push(c.id + ": expected general.query, got " + got.id);
    continue;
  }
  if (got.id !== c.intent) failures.push(c.id + ": expected " + c.intent + ", got " + got.id);
  if (c.needsClarification !== undefined && got.needsClarification !== c.needsClarification) failures.push(c.id + ": expected needsClarification=" + c.needsClarification + ", got " + got.needsClarification);
  if (c.missingSlots !== undefined && JSON.stringify(got.missingSlots || []) !== JSON.stringify(c.missingSlots)) failures.push(c.id + ": expected missingSlots=" + JSON.stringify(c.missingSlots) + ", got " + JSON.stringify(got.missingSlots || []));
  if (got.needsClarification && !(got.confidence < 0.5)) failures.push(c.id + ": clarification cases must have low confidence, got " + got.confidence);
  for (const key of ["text", "query", "contact", "target", "kind", "when"]) {
    if (c.expected[key] !== undefined && got.slots[key] !== c.expected[key]) {
      failures.push(c.id + ": expected " + key + "=" + JSON.stringify(c.expected[key]) + ", got " + JSON.stringify(got.slots[key]));
    }
  }
}
assert.equal(failures.length, 0, failures.join("\n"));
assert.equal(commandPlan("call").requiresConfirmation, false, "incomplete calls must clarify before confirmation");
assert.equal(commandPlan("call Mom").requiresConfirmation, true, "complete calls must require confirmation");
assert.equal(commandPlan("SMS Dad").requiresConfirmation, false, "incomplete messages must clarify before confirmation");
assert.equal(commandPlan("SMS Dad saying I will be home late").requiresConfirmation, true, "complete messages must require confirmation");
assert.equal(commandPlan("Explain quantum physics").requiresConfirmation, false, "unknown questions must not trigger external-action confirmation");
assert.equal(composeClarificationAnswer({ intentId: "phone.call", slots: {} }, "Mom"), "call Mom", "call follow-up should fill the contact slot");
assert.equal(composeClarificationAnswer({ intentId: "message.sms", slots: { contact: "Dad" } }, "I will be home late"), "sms Dad saying I will be home late", "message follow-up should preserve recipient and fill body");
assert.equal(composeClarificationAnswer({ intentId: "message.sms", slots: {} }, "Dad"), "sms Dad", "recipient follow-up should support staged clarification");
for (const c of cases.actionCases || []) assert.equal(!validateActionProposal(c.action), c.valid, c.id + ": action validation result did not match fixture");
assert.ok((cases.actionCases || []).length >= 8, "action validation fixtures should remain in the evaluation corpus");
assert.ok(cases.safety.length >= 5, "safety rules should remain part of the training corpus");
console.log("JARVIS intent evaluation: " + (cases.cases.length - failures.length) + "/" + cases.cases.length + " cases passed.");
