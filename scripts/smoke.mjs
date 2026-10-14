import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)];
assert.ok(scripts.length > 0, "index.html should contain JavaScript");
for (const [, source] of scripts) {
  assert.doesNotThrow(() => new Function(source), "embedded JavaScript must parse");
}

for (const topic of ["World", "India", "Business", "Technology", "Science", "Sports"]) {
  assert.ok(html.includes(`["${topic}",`), `missing news topic: ${topic}`);
}
assert.ok(html.includes("newsRefreshFailed"), "news refresh failure state must be tracked");
assert.ok(html.includes("Date.now()-heads.ts<36e5"), "news briefing must reject stale cache");
assert.ok(html.includes("liveNewsContext"), "fetched headlines must be passed to AI context");
assert.ok(html.includes("Do not invent facts"), "news system prompt must prohibit invented details");
assert.ok(html.includes("speechSynthesis.speak(u)"), "browser speech output must be configured");
assert.ok(!html.includes("hn.algolia.com/api/v1/search"), "technology-only fallback must not be presented as general news");

console.log("JARVIS smoke checks passed: embedded JS syntax, six news topics, freshness guard, honest failure state, grounded AI context, and voice output.");
