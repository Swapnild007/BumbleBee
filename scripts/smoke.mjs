import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("<script>");
const end = html.lastIndexOf("</script>");
assert.ok(start >= 0 && end > start, "index.html should contain an inline script");
const source = html.slice(start + "<script>".length, end);
assert.doesNotThrow(() => new Function(source), "embedded JavaScript must parse");
assert.equal((source.match(/(?<!\$)\$\([^)]*\)\.(?:forEach|map|filter)\(/g)||[]).length, 0, "DOM collection operations must use $()/querySelectorAll, not the single-element $() helper");
assert.ok(source.includes('const $=s=>document.querySelector(s),$=s=>[...document.querySelectorAll(s)]'), "single-element and collection DOM helpers must be distinct");
assert.ok(!source.includes("$$"), "undefined triple-dollar selector calls must not abort script initialization");
for (const id of ["cCall", "cWa", "cSms", "ctPick", "ctAdd", "smsLoad", "apps", "fab", "refresh"]) {
  assert.ok(html.includes('id="'+id+'"'), "missing core interaction: "+id);
}
assert.ok(source.includes('mainNav.addEventListener("click"'), "mobile nav must have a delegated click handler");

for (const topic of ["World", "India", "Business", "Technology", "Science", "Sports"]) {
  assert.ok(html.includes(`["${topic}",`), `missing news topic: ${topic}`);
}
assert.ok(html.includes("newsRefreshFailed"), "news refresh failure state must be tracked");
assert.ok(html.includes("Date.now()-heads.ts<36e5"), "news briefing must reject stale cache");
assert.ok(html.includes("liveNewsContext"), "fetched headlines must be passed to AI context");
assert.ok(html.includes("Do not invent facts"), "news system prompt must prohibit invented details");
assert.ok(html.includes("speechSynthesis.speak(u)"), "browser speech output must be configured");
assert.ok(html.includes("Checking the latest headlines now."), "news requests should receive an immediate spoken acknowledgement");
assert.ok(html.includes("stop speaking|stop talking|be quiet|quiet|cancel speech|silence"), "speech interruption command must be available");
assert.ok(!html.includes("hn.algolia.com/api/v1/search"), "technology-only fallback must not be presented as general news");
assert.equal((html.match(/:\["\d+,\d+,\d+","[^"]+","[^"]+","[^"]+"\]/g)||[]).length,16,"JARVIS should offer 16 color themes");
assert.ok(html.includes("aria-pressed"), "theme swatches should expose accessible selected state");
assert.ok(html.includes('id="trainingLab"'), "System tab should expose the training self-test panel");
assert.ok(html.includes("async function runTrainingLab()"), "in-app self-test runner should exist");
assert.ok(html.includes('fetch("./training/intents.json"'), "self-test should load the shared training corpus");

assert.ok(html.includes('function go(t){document.querySelectorAll(".tab").forEach'), "bottom navigation must iterate over tab sections");
assert.ok(html.includes('document.querySelectorAll(".nav a").forEach'), "bottom navigation must update active nav items");


assert.ok(html.includes('mainNav.addEventListener("click"'), "mobile nav should use delegated click handling");
assert.ok(html.includes('mainNav.addEventListener("touchend"'), "mobile nav should handle touch interaction");
assert.ok(html.includes("pointer-events:none;left:0;top:7px"), "liquid pill must not block nav taps");

import { spawnSync } from "node:child_process";
const training = spawnSync(process.execPath, ["scripts/train-intents.mjs"], { encoding: "utf8" });
assert.equal(training.status, 0, training.stderr || training.stdout || "intent training corpus checks failed");

console.log("JARVIS smoke checks passed: embedded JS syntax, six news topics, freshness guard, honest failure state, grounded AI context, and voice output.");
