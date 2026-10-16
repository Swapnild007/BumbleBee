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
assert.ok(source.includes('const appLinks=new Set(["com.google.android.youtube","com.google.android.apps.maps","com.google.android.apps.youtube.music","in.startv.hotstar","com.instagram.android"])'), "only the device-verified HTTPS app-link routes should use Android intent URLs");
assert.ok(source.includes('Web version: opening the service website. Launching this installed app requires the JARVIS Android app.'), "web-only shortcuts must clearly disclose when they open a website instead of an installed app");
assert.ok(source.includes('location.href=web[p]'), "unsupported package launches should use a direct HTTPS fallback instead of a launcher-intent redirect");
assert.ok(source.includes('S.browser_fallback_url="+encodeURIComponent(web[p])+";end'), "verified app-link intents should retain an HTTPS fallback");
assert.ok(source.includes('"com.whatsapp":"https://wa.me/"'), "WhatsApp should use its app-friendly universal link as fallback");
assert.ok(source.includes('"com.google.android.youtube":"www.youtube.com/"'), "YouTube package launch should target its matching host");
assert.ok(source.includes('"com.google.android.apps.youtube.music":"https://music.youtube.com/"'), "YouTube Music shortcut should use its service URL");
assert.ok(source.includes('"com.openai.chatgpt":"https://chatgpt.com/"'), "ChatGPT shortcut should use its service URL");
assert.ok(source.includes('"com.google.android.apps.bard":"https://gemini.google.com/app"'), "Gemini shortcut should use its service URL");
assert.ok(source.includes('"com.netflix.mediaclient":"https://www.netflix.com/browse"'), "Netflix shortcut should use its browse URL as fallback");
assert.ok(source.includes('"in.startv.hotstar":"https://www.hotstar.com/in"'), "Disney+ Hotstar shortcut should use its service URL");
assert.ok(source.includes('"com.amazon.avod.thirdpartyclient":"https://www.primevideo.com/"'), "Amazon Prime Video shortcut should use its service URL");
for (const label of ["YouTube Music","ChatGPT","Gemini","Netflix","Disney+ Hotstar","Amazon Prime"]) assert.ok(html.includes('"'+label+'"'), "missing requested app shortcut: "+label);

assert.ok(source.includes('requires the JARVIS Android app'), "native-only actions should fail honestly instead of redirecting to Play Store");
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
assert.ok(source.includes('currentPlan=commandPlan(raw);if(currentPlan.composedFromClarification)'), "commands should pass through the planner and resolve clarification context before dispatch");
assert.ok(source.includes('requiresConfirmation:needsConfirmation'), "planner should expose confirmation requirements");
assert.ok(source.includes('"phone.call","message.whatsapp","message.sms","app.open"'), "calls, messages, and app launches should be identified as consequential actions");

import { spawnSync } from "node:child_process";
const training = spawnSync(process.execPath, ["scripts/train-intents.mjs"], { encoding: "utf8" });
assert.equal(training.status, 0, training.stderr || training.stdout || "intent training corpus checks failed");
const traceTests = spawnSync(process.execPath, ["--test", "scripts/brain-traces.test.mjs"], { encoding: "utf8" });
assert.equal(traceTests.status, 0, traceTests.stderr || traceTests.stdout || "brain trace unit tests failed");

console.log("JARVIS smoke checks passed: JavaScript syntax, intent/slot evaluation, clarification and confirmation planning, AI action validation, news freshness, and voice safeguards.");

assert.ok(source.includes("async function runConfirmedCommand(t)"), "consequential web commands must have an explicit confirmation execution path");
assert.ok(source.includes("if(plan.requiresConfirmation){pend={label:\"Confirm action\",fn:()=>runConfirmedCommand(t)}"), "the command planner's confirmation flag must gate dispatch before the local handler runs");
assert.ok(source.includes("Confirm below before I continue."), "confirmation prompt must be explicit");
assert.ok(source.includes("data-b-cancel"), "pending consequential actions must have a visible cancel path");
assert.ok(source.includes("No external action was run"), "cancellation must be recorded as not executed");
assert.ok(source.includes("This browser reminder may not fire if JARVIS is closed or the device sleeps"), "browser reminder limitations must be disclosed at creation time");
assert.ok(source.includes("Browser reminders only run while JARVIS stays active"), "browser timer limitations must be disclosed at creation time");
assert.ok(source.includes("I work without an AI API key for supported tasks"), "offline brain must explain its supported capabilities without requiring a provider key");
assert.ok(source.includes("I will not require a Gemini key or invent an answer"), "unknown open-ended questions must fail honestly without requiring a Gemini key");

assert.ok(source.includes('$("#brief").addEventListener("click",()=>{'), "Executive Briefing must respond immediately with a guarded click handler");
assert.ok(source.includes('Promise.resolve().then(()=>loadHeads(true)).catch(error=>console.warn("Background headline refresh failed",error))'), "headline refresh must run in the background and not block the briefing");

assert.ok(source.includes("if(n-r.at<864e5)fire(r)"), "reminders due after a suspended tab must still be surfaced within 24 hours");
assert.ok(source.includes('addActivity("Reminder","Missed reminder"'), "older reminders must be recorded as missed rather than silently discarded");

assert.ok(source.includes('window.addEventListener("jarvis-native-speech",event=>{'), "Android speech results must be connected to the web command brain");
assert.ok(source.includes('window.addEventListener("jarvis-native-speech-error",()=>{'), "Android speech errors must restore voice UI state and explain recovery");

assert.ok(html.includes('JARVIS BRAIN EVALUATION'), "training UI must accurately describe itself as evaluation, not model training");
assert.ok(html.includes('This measures rule-based routing; it does not train or fine-tune an AI model.'), "UI must not misrepresent a regression test as AI training");
assert.ok(source.includes('needsClarification:missing.length>0'), "brain classifier must mark commands with missing required slots for clarification");
assert.ok(source.includes('confidence:0.25,slots:{query:text},source:"offline-rule",needsClarification:true'), "unknown requests must remain low-confidence rather than being falsely classified as understood");
const traceStore = readFileSync(new URL("../brain/trace-store.js", import.meta.url), "utf8");
assert.ok(html.includes('<script src="./brain/trace-store.js"></script>'), "local trace store must load before the command brain");
assert.ok(traceStore.includes('const KEY="jv_brain_traces_v1",LIMIT=100'), "brain traces must be bounded and stored locally");
assert.ok(traceStore.includes('root.JarvisTraceStore=Object.freeze({record,rate,list,clear,summary,exportJson:'), "trace store must expose recording, explicit feedback, deletion, summary, and export");
assert.ok(source.includes("window.JarvisTraceStore.record({input:t,intent:plan.intent.id"), "each handled turn must record intent and response evidence");
assert.ok(source.includes('$("#q").addEventListener("keydown",async e=>{if(e.key==="Enter"&&e.target.value.trim()){const t=e.target.value;e.target.value="";e.target.blur();toast("…");await runCmd(t)}});'), "quick text commands must use the same brain, confirmation, history, and trace pipeline as voice commands");
assert.ok(html.includes('id="brainHelpful"') && html.includes('id="brainUnhelpful"'), "users must be able to rate the latest response");
assert.ok(html.includes('id="brainExport"'), "users must be able to export local brain traces");
assert.ok(html.includes('id="brainClear"'), "users must be able to delete local brain traces");
assert.ok(html.includes('id="gatewayPassword"') && html.includes('id="gatewayConnect"'), "System panel must expose authenticated secure gateway controls");
assert.ok(source.includes('post("/api/ai",{}, {provider:p,model,system:sysPrompt(),messages:h})'), "connected gateway mode must route AI requests through the same-origin server endpoint");
assert.ok(source.includes('S.ai.gatewayRequired&&!S.ai.gateway'), "expired secure sessions must not silently fall back to browser-stored provider keys");
assert.ok(source.includes('S.ai.gatewayRequired=true'), "successful secure gateway login must persist secure-mode preference");
assert.ok(source.includes('fetch("/api/auth",{method:"POST",credentials:"same-origin"'), "gateway login must use same-origin cookie-based authentication");
assert.ok(source.includes('window.JarvisTraceStore.clear()'), "trace deletion control must invoke the local trace-store deletion API");
assert.ok(html.includes("do not automatically train a model or upload your conversations"), "trace UI must disclose local-only storage and honest learning limits");
assert.ok(source.includes("const incomplete=["), "incomplete command prefixes must be detected before dispatch");
assert.ok(source.includes('intent.needsClarification&&intent.id!=="general.query"'), "incomplete supported commands must ask a targeted follow-up instead of falling through to unknown handling");
assert.ok(source.includes('COMMAND_CONFIRMATION_INTENTS.has(intent.id)&&!intent.needsClarification'), "incomplete consequential commands must be clarified before asking for confirmation");
assert.ok(source.includes("function composeClarificationAnswer(pending,answer)"), "brain must preserve context across follow-up answers");
assert.ok(source.includes("currentPlan.composedFromClarification"), "clarification answers must be merged before command dispatch");
assert.ok(source.includes("pendingClarification=null;delete pendMap[id]"), "cancelling an action must discard pending clarification context");
assert.ok(source.includes('if(intent.id==="command.cancel"){pendingClarification=null;pend=null;'), "spoken cancellation must clear pending clarification and confirmation state");
assert.ok(source.includes('pend={label:"Confirm AI action",fn:()=>runConfirmedAIAction(action)}'), "AI-proposed actions must wait for explicit user confirmation");
assert.ok(source.includes("function validateActionProposal(a)"), "AI action payloads must be validated before a confirmation is offered");
assert.ok(!source.includes("try{await runAction(JSON.parse(a[1]))}catch{}"), "AI action JSON must never be executed immediately from a model response");
