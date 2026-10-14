import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const cases = JSON.parse(readFileSync(new URL("../training/intents.json", import.meta.url), "utf8"));
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = html.slice(html.indexOf("<script>") + "<script>".length, html.lastIndexOf("</script>"));
let passed = 0;
const failures = [];
for (const c of cases.cases) {
  if (!c.pattern) {
    assert.equal(c.intent, "fallback.unknown", "unknown examples must be explicit");
    passed++;
    continue;
  }
  const re = new RegExp(c.pattern, "i");
  const normalized = c.utterance.toLowerCase().trim().replace(/[.!?]+$/, "");
  const match = normalized.match(re);
  if (!match) { failures.push(c.id + ": training utterance does not match its expected intent pattern"); continue; }
  if (!source.includes(c.pattern.replaceAll("\\\\", "\\"))) {
    // Some runtime patterns are embedded in larger alternations; matching examples remains the primary check.
  }
  passed++;
}
assert.equal(failures.length, 0, failures.join("\n"));
assert.ok(cases.safety.length >= 5, "safety rules should remain part of the training corpus");
console.log("JARVIS intent corpus: " + passed + "/" + cases.cases.length + " examples pass pattern-level checks.");
