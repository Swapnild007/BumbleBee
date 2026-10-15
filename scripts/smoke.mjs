import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("<script>");
const end = html.lastIndexOf("</script>");
assert.ok(start >= 0 && end > start, "index.html should contain an inline script");
const source = html.slice(start + "<script>".length, end);
assert.doesNotThrow(() => new Function(source), "embedded JavaScript must parse");
assert.equal((source.match(/(?<!\$)\$\([^)]*\)\.(?:forEach|map|filter)\(/g)||[]).length, 0, "DOM collection operations must use $()/querySelectorAll, not the single-element $() helper");
assert.ok(source.includes('const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)]'), "single-element and collection DOM helpers must be distinct");
assert.ok(!source.includes("$".repeat(3)), "undefined triple-dollar selector calls must not abort script initialization");
assert.ok(source.includes('"com.google.android.youtube":"https://www.youtube.com/"'), "YouTube web fallback should use its HTTPS app link, not Play Store intent");
assert.ok(source.includes('"com.whatsapp":"https://www.whatsapp.com/"'), "WhatsApp web fallback should use its HTTPS app link, not Play Store intent");
assert.ok(source.includes('if(web[p]){location.href=web[p];return}'), "web app shortcuts should use safe HTTPS fallbacks");
assert.ok(source.includes('requires the JARVIS Android app'), "native-only actions should fail honestly instead of redirecting to Play Store");
assert.ok(!source.includes('intent://launch/#Intent;package='), "package intent fallback must not regress");
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
assert.ok(html.includes('id="mcpLearningLab"'), "System tab should expose the MCP learning lab");
assert.ok(html.includes("local demo plus an opt-in loopback MCP connection"), "MCP UI must distinguish the browser demo from the real local connection");
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
assert.ok(html.includes('id="activityLog"') && html.includes('id="activityQ"'), "Activity Log UI and search should exist");
assert.ok(source.includes('store.get("jv_activity",[])'), "activity log should load from local storage");
assert.ok(source.includes('store.set("jv_activity",activity)'), "activity log should persist locally");
assert.ok(source.includes("activity=activity.slice(0,100)"), "activity log should be bounded to the latest 100 events");
assert.ok(source.includes("data-edit-note"), "saved memories should be editable");
assert.ok(source.includes("data-delete-note"), "saved memories should be deletable");
assert.ok(source.includes("function renderActivity()"), "activity log renderer should exist");
assert.ok(source.includes('addActivity("Command","Command received"'), "voice/text commands should be recorded in activity history");




assert.ok(html.includes("Safe visual refresh: Phone tab only"), "Phone refresh must remain explicitly scoped");
assert.ok(html.includes("#t-phone #cTo") && html.includes("#t-phone #cMsg"), "Phone compose controls should receive scoped styling");
assert.ok(html.includes("#t-phone #apps .app"), "Phone app shortcuts should receive scoped styling");
for (const id of ["cTo", "cMsg", "cCall", "cWa", "cSms", "ctPick", "ctAdd", "smsLoad", "apps"]) {
  assert.ok(html.includes('id="'+id+'"'), "Phone interaction element must be preserved: "+id);
}

assert.ok(source.includes("function commandPlan(raw)"), "Phase 03 structured command planner should exist");
assert.ok(source.includes("const COMMAND_CONFIRMATION_INTENTS=new Set(["), "external-action intents should be explicitly listed for confirmation");
assert.ok(source.includes('currentPlan=commandPlan(raw);currentIntent=currentPlan.intent'), "commands should pass through the planner before dispatch");
assert.ok(source.includes('requiresConfirmation:needsConfirmation'), "planner should expose confirmation requirements");
assert.ok(source.includes('"phone.call","message.whatsapp","message.sms","app.open"'), "calls, messages, and app launches should be identified as consequential actions");

import { spawnSync } from "node:child_process";
const training = spawnSync(process.execPath, ["scripts/train-intents.mjs"], { encoding: "utf8" });
assert.equal(training.status, 0, training.stderr || training.stdout || "intent training corpus checks failed");

console.log("JARVIS smoke checks passed: embedded JS syntax, news/voice regressions, local MCP UI/bridge safety, personal-only scope, and training corpus.");
