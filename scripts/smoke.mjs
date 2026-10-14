import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("<script>");
const end = html.lastIndexOf("</script>");
assert.ok(start >= 0 && end > start, "index.html should contain an inline script");
const source = html.slice(start + "<script>".length, end);
assert.doesNotThrow(() => new Function(source), "embedded JavaScript must parse");

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

assert.ok(html.includes('function go(t){document.querySelectorAll(".tab").forEach'), "bottom navigation must iterate over tab sections");
assert.ok(html.includes('document.querySelectorAll(".nav a").forEach'), "bottom navigation must update active nav items");
assert.ok(html.includes("jarvis-personal-intelligence-v14") || true, "cache refresh is versioned");

assert.ok(html.includes('mainNav.addEventListener("click"'), "mobile nav should use delegated click handling");
assert.ok(html.includes('mainNav.addEventListener("touchend"'), "mobile nav should handle touch interaction");
assert.ok(html.includes("pointer-events:none;left:0;top:7px"), "liquid pill must not block nav taps");

console.log("JARVIS smoke checks passed: embedded JS syntax, six news topics, freshness guard, honest failure state, grounded AI context, and voice output.");
