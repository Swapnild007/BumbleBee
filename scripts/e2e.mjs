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
  await context.addInitScript(() => localStorage.setItem("jv_set", JSON.stringify({ voice: false, wake: false, haptic: false, autoloc: false, ai: { prov: "anthropic", keys: {}, models: {} } })));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
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
  await page.locator("#trainResults").getByText(/\d+\/\d+ examples passed/).waitFor({ timeout: 10000 });

  await page.locator("#fab").click();
  await page.locator("#vin").fill("call 1234567890");
  await page.locator("#vin").press("Enter");
  await page.locator("#vlog").getByText("Confirm below before I continue.").waitFor();
  await page.locator("#vlog [data-b-cancel]").last().click();
  await page.locator("#vlog").getByText("Action cancelled.").waitFor();
  assert.ok(!page.url().startsWith("tel:"), "cancelling a consequential action must not launch the dialer");
  assert.deepEqual(errors, [], "browser should not emit uncaught JavaScript errors");

  await context.close();
  console.log("JARVIS browser E2E passed: mobile home, command response, non-blocking executive briefing, task persistence, memory save, intent self-test, explicit action confirmation/cancel, and no uncaught page errors.");
} finally {
  if (browser) await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
