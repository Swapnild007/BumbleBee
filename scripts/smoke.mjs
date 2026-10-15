import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("<script>");
const end = html.lastIndexOf("</script>");
assert.ok(start >= 0 && end > start, "index.html should contain an inline script");
const source = html.slice(start + "<script>".length, end);
assert.doesNotThrow(() => new Function(source), "embedded JavaScript must parse");
assert.equal((source.match(/\$\(\s*[A-Za-z_$][\w$]*\s*=>/g)||[]).length, 0, "DOM collection handlers must use $()/querySelectorAll, not the single-element $() helper");

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
assert.ok(html.includes('id="mcpLearningLab"'), "System tab should expose the MCP learning lab");
assert.ok(html.includes("local demo, deliberately not a remote MCP connection"), "MCP browser demo must not claim a live server connection");
assert.ok(html.includes('id="mcpCalculate"'), "MCP calculator exercise should be interactive");
const mcpServer = readFileSync(new URL("../mcp_server/server.py", import.meta.url), "utf8");
const mcpCalculator = readFileSync(new URL("../mcp_server/calculator.py", import.meta.url), "utf8");
const mcpTests = readFileSync(new URL("../mcp_server/test_calculator.py", import.meta.url), "utf8");
assert.ok(mcpServer.includes("@mcp.tool()") && mcpServer.includes("jarvis_calculate_total"), "real MCP calculator tool should be defined");
assert.ok(mcpServer.includes("explain_mcp_basics"), "MCP learning tool should be defined");
assert.ok(mcpCalculator.includes("quantity > 1_000_000"), "MCP calculator must bound quantity");
assert.ok(mcpTests.includes("test_rejects_negative_price"), "MCP server should include input-validation tests");
const mcpGateway = readFileSync(new URL("../mcp_server/gateway.py", import.meta.url), "utf8");
const gatewayTests = readFileSync(new URL("../mcp_server/test_gateway.py", import.meta.url), "utf8");
const mcpIntegration = readFileSync(new URL("../mcp_server/test_mcp_integration.py", import.meta.url), "utf8");
const mcpReadme = readFileSync(new URL("../mcp_server/README.md", import.meta.url), "utf8");
assert.ok(html.includes('id="mcpConnect"') && html.includes('id="mcpRunReal"'), "MCP lab should offer real local connection and tool invocation");
assert.ok(html.includes('fetch(bridge+path'), "MCP UI should call the local bridge explicitly");
assert.ok(mcpGateway.includes('HOST = "127.0.0.1"'), "MCP bridge must bind only to loopback");
assert.ok(mcpGateway.includes("hmac.compare_digest"), "MCP bridge must validate its one-run token");
assert.ok(mcpGateway.includes("ALLOWED_TOOLS"), "MCP bridge must use a tool allowlist");
assert.ok(gatewayTests.includes("test_only_local_development_origins_are_allowed"), "MCP gateway origin restrictions need tests");
assert.ok(mcpIntegration.includes("test_real_mcp_client_discovers_and_calls_tools"), "real MCP client integration test should exist");
assert.ok(mcpReadme.includes("Do not add an employer/work profile"), "JARVIS must preserve personal-assistant-only scope");
assert.ok(html.includes("The token is kept only in this page's memory") || html.includes("token is held only"), "MCP token handling must be documented as non-persistent");
assert.ok(html.includes('fetch("./training/intents.json"'), "self-test should load the shared training corpus");

assert.ok(html.includes('function go(t){document.querySelectorAll(".tab").forEach'), "bottom navigation must iterate over tab sections");
assert.ok(html.includes('document.querySelectorAll(".nav a").forEach'), "bottom navigation must update active nav items");


assert.ok(html.includes('mainNav.addEventListener("click"'), "mobile nav should use delegated click handling");
assert.ok(html.includes('mainNav.addEventListener("touchend"'), "mobile nav should handle touch interaction");
assert.ok(html.includes("pointer-events:none;left:0;top:7px"), "liquid pill must not block nav taps");

import { spawnSync } from "node:child_process";
const training = spawnSync(process.execPath, ["scripts/train-intents.mjs"], { encoding: "utf8" });
assert.equal(training.status, 0, training.stderr || training.stdout || "intent training corpus checks failed");

console.log("JARVIS smoke checks passed: embedded JS syntax, news/voice regressions, local MCP UI/bridge safety, personal-only scope, and training corpus.");
