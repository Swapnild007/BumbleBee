import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve(".");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const target = resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403).end("Forbidden"); return; }
    const filePath = target === root ? resolve(root, "index.html") : target;
    const file = await readFile(filePath);
    res.writeHead(200, { "content-type": mime[extname(filePath)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(file);
  } catch { res.writeHead(404).end("Not found"); }
});
await new Promise(resolveListen => server.listen(4173, "127.0.0.1", resolveListen));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => localStorage.setItem("jv_set", JSON.stringify({ voice: false, wake: false, haptic: false, autoloc: false, ai: { prov: "anthropic", keys: { anthropic: "test-key" }, models: {} } })));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  let aiMockHits=0;
  await page.route("**/v1/messages", route => { aiMockHits++; if(route.request().method()==="OPTIONS")return route.fulfill({status:204,headers:{"access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access"}}); return route.fulfill({ status: 200, headers: {"access-control-allow-origin":"*"}, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text: 'I can prepare that. ACTION:{"type":"task","text":"AI-proposed task"}' }] }) }); });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await page.locator("#t-home").waitFor({ state: "visible" });
  assert.ok(await page.locator("#t-home").getByText("JARVIS").count(), "home screen should render JARVIS branding");
  await page.locator("#q").fill("help");
  await page.locator("#q").press("Enter");
  await page.waitForFunction(() => (document.querySelector("#toast")?.textContent || "").trim().length > 0);

  // A blocked news feed must not block the Executive Briefing response or crash the page.
  await page.locator("#brief").click();
  await page.waitForFunction(() => /Commander/.test(document.querySelector("#toast")?.textContent || ""), { timeout: 3000 });

  await page.locator('nav a[data-t="tasks"]').click();
  await page.locator("#t-tasks").waitFor({ state: "visible" });
  await page.locator("#tkIn").fill("E2E task survives reload");
  await page.locator("#tkAdd").click();
  await page.locator("#tasks").getByText("E2E task survives reload").waitFor();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('nav a[data-t="tasks"]').click();
  await page.locator("#tasks").getByText("E2E task survives reload").waitFor();

  await page.locator("#noteIn").fill("E2E saved memory");
  await page.locator("#noteAdd").click();
  await page.locator("#notes").getByText("E2E saved memory").waitFor();

  await page.locator('nav a[data-t="sys"]').click();
  await page.locator("#runTraining").click();
  await page.locator("#trainResults").getByText(/checks passed/).waitFor({ timeout: 10000 });
  const evaluationSummary=await page.locator("#trainResults").innerText();
  const evaluationMatch=evaluationSummary.match(/(\d+)\/(\d+) checks passed/);
  assert.ok(evaluationMatch, "brain evaluation should report its check count: "+evaluationSummary);
  assert.equal(evaluationMatch[1],evaluationMatch[2], "all brain and action-schema checks must pass: "+evaluationSummary);

  await page.locator("#fab").click();
  await page.locator("#vin").fill("call");
  await page.locator("#vin").press("Enter");
  await page.locator("#vlog").getByText("Who should I call? Please give me a contact name or phone number.").waitFor();
  assert.equal(await page.locator("#vlog").getByText("Confirm below before I continue.").count(), 0, "incomplete call commands must clarify before confirmation");
  await page.locator("#vin").fill("Mom");
  await page.locator("#vin").press("Enter");
  await page.locator("#vlog").getByText("Confirm below before I continue.").waitFor();
  await page.locator("#vlog [data-b-cancel]").last().click();
  await page.locator("#vlog").getByText("Action cancelled.").waitFor();
  assert.ok(!page.url().startsWith("tel:"), "cancelling a consequential action must not launch the dialer");

  await page.locator("#vin").fill("SMS Dad");
  await page.locator("#vin").press("Enter");
  await page.locator("#vlog").getByText("What should the text to Dad say?").waitFor();
  await page.locator("#vin").fill("I will be home late");
  await page.locator("#vin").press("Enter");
  await page.locator("#vlog").getByText("Confirm below before I continue.").waitFor();
  await page.locator("#vlog [data-b-cancel]").last().click();
  await page.locator("#vlog").getByText("Action cancelled.").last().waitFor();

  await page.locator("#vin").fill("Please organize my day");
  await page.locator("#vin").press("Enter");
  try { await page.locator("#vlog").getByText("I prepared a proposed action. Confirm below before I execute it.").waitFor({ timeout: 10000 }); } catch { throw new Error("AI action confirmation missing; mock hits="+aiMockHits+"; transcript="+await page.locator("#vlog").innerText()+"; core="+await page.locator("#core").innerText()+"; page errors="+errors.join("; ")); }
  assert.ok(aiMockHits > 0, "open-ended request must exercise the mocked AI provider");
  assert.equal(await page.locator("#tasks").getByText("AI-proposed task").count(), 0, "AI-proposed task must not execute before confirmation");
  await page.locator("#vlog [data-b]").last().scrollIntoViewIfNeeded();
  await page.locator("#vlog [data-b]").last().click({ force: true });
  await page.locator("#vlog").getByText("Added the task.").waitFor();
  assert.ok(await page.locator("#tasks").getByText("AI-proposed task").count() > 0, "confirmed AI task should appear in the task list");
  assert.deepEqual(errors, [], "browser should not emit uncaught JavaScript errors");

  await context.close();
  console.log("JARVIS browser E2E passed: mobile home, command response, non-blocking executive briefing, task persistence, memory save, intent self-test, explicit action confirmation/cancel, and no uncaught page errors.");
} finally {
  if (browser) await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
