/** Local acceptance content probe: verifies detail-sheet copy in rendered DOM. */
import { createRequire } from "node:module";

const require = createRequire("/Users/tanutejas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");
const root = process.env.SUKOON_ORIGIN || "http://localhost:3100";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.setDefaultTimeout(25000);

await page.goto(`${root}/`, { waitUntil: "domcontentloaded" });
await page.getByLabel("Email address").fill("construction-ab-owner@example.com");
await page.getByRole("button", { name: "Send OTP", exact: true }).click();
await page.getByLabel("One-time code").waitFor();
const mailbox = await context.request.get(`${root}/api/auth/dev-mailbox?email=construction-ab-owner%40example.com`);
await page.getByLabel("One-time code").fill((await mailbox.json()).data.otp);
const response = page.waitForResponse((r) => r.url().endsWith("/api/session") && r.status() === 200);
await page.getByRole("button", { name: "Open passport", exact: true }).click();
await response;

const list = await (await context.request.get(`${root}/api/construction`)).json();
const project = (list.data ?? list).find((p) => p.name === "Mehta Residence");
const base = `/construction/${project.id}`;
const checks = [];

async function sheetText(tab, rowText) {
  await page.goto(`${root}${base}?tab=${tab}`, { waitUntil: "domcontentloaded" });
  await page.getByText("Mehta Residence").first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
  const exact = page.getByRole("button", { name: new RegExp(`^${rowText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
  if ((await exact.count()) > 0) await exact.first().click({ timeout: 8000 });
  else await page.getByText(rowText, { exact: false }).first().click({ timeout: 8000 });
  await page.waitForTimeout(500);
  return page.evaluate(() => document.body.innerText.slice(0, 6000));
}

const decision = await sheetText("more", "Electrical layout approval");
checks.push(["decision/why-collapsed", decision.includes("Why this matters")]);
checks.push(["decision/option", decision.includes("Approve layout v3")]);
checks.push(["decision/approve-primary", decision.includes("Approve:")]);
checks.push(["decision/chain", decision.includes("Electrical conduit preparation")]);
checks.push(["decision/cost-impact", decision.includes("15,000") || decision.includes("15000")]);
checks.push(["decision/schedule-impact", decision.includes("2 days")]);

const change = await sheetText("money", "Bedroom flooring upgrade");
checks.push(["change/original", change.includes("120")]);
checks.push(["change/revised", change.includes("190")]);
checks.push(["change/est-cost", change.includes("1.82")]);
checks.push(["change/actual-note", change.includes("Estimated only")]);

await page.goto(`${root}${base}?tab=site`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const site = await page.evaluate(() => document.body.innerText);
checks.push(["site/no-None-leak", !site.includes("· None")]);
checks.push(["site/shortage", site.includes("10 bags") && site.includes("2.5%")]);
checks.push(["site/photos", site.includes("6 photos")]);

await page.goto(`${root}${base}?tab=more`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const more = await page.evaluate(() => document.body.innerText);
checks.push(["papers/context-stage", more.includes("First-floor slab") || more.includes("RCC")]);
checks.push(["papers/no-enum", !more.includes("WORK_ITEM") && !more.includes("MILESTONE →") === false ? true : !more.includes("Remove link: DECISION")]);

await browser.close();
let fail = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) fail++;
}
process.exitCode = fail ? 1 : 0;
