/**
 * Consumer visual audit. Uses local OTP + demo-owner dataset. No production data.
 * Usage: node scripts/ui-visual-audit.mjs
 */
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const require = createRequire("/Users/tanutejas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");

const root = process.env.SUKOON_ORIGIN || "http://localhost:3100";
const out = "output/ui-visual-audit";
const marker = JSON.parse(await readFile(".data/synthetic-demo/dataset-v1.json", "utf8"));
const results = [];
const errors = [];

await mkdir(`${out}/owner`, { recursive: true });
await mkdir(`${out}/lawyer`, { recursive: true });
await mkdir(`${out}/architect`, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const page = await context.newPage();
page.setDefaultTimeout(25000);
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`); });

async function login(email) {
  await page.goto(`${root}/`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await page.getByLabel("One-time code").waitFor();
  const mailbox = await context.request.get(`${root}/api/auth/dev-mailbox?email=${encodeURIComponent(email)}`);
  if (!mailbox.ok()) throw new Error(`mailbox ${email}: ${mailbox.status()}`);
  await page.getByLabel("One-time code").fill((await mailbox.json()).data.otp);
  const response = page.waitForResponse((r) => r.url().endsWith("/api/session") && r.status() === 200);
  await page.getByRole("button", { name: "Open passport", exact: true }).click();
  await response;
  await page.getByLabel("Email address").waitFor({ state: "hidden" });
}

async function signOut() {
  await context.request.post(`${root}/api/auth/sign-out`, { headers: { origin: root }, data: {} });
}

async function inspect() {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(150);
  return page.evaluate(() => {
    const nav = document.querySelector(".bottom-navigation");
    const navTop = nav ? nav.getBoundingClientRect().top : Infinity;
    const actionable = [...document.querySelectorAll("a, button, [role='button'], .list-row, .primary-disclosure")].filter((el) => {
      if (nav && nav.contains(el)) return false;
      if (el.classList.contains("skip-link")) return false;
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.position === "sticky") return false;
      const rect = el.getBoundingClientRect();
      return rect.height > 0 && rect.width > 0;
    });
    const last = actionable.sort((a, b) => a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom).at(-1);
    const lastBottom = last ? last.getBoundingClientRect().bottom : 0;
    const inViewport = lastBottom > 0 && lastBottom <= window.innerHeight + 8;
    const navObstruction = Boolean(nav && window.innerWidth < 1000 && last && inViewport && lastBottom > navTop + 4);
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    const bits = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest("input, textarea, select, option, script, style, .bottom-navigation")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) bits.push(walker.currentNode.textContent || "");
    const text = bits.join(" ");
    const isoDate = /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/.test(text);
    const rawEnum = /\b[A-Z]{3,}(?:_[A-Z0-9]+){1,}\b/.test(text);
    const dummyLanguage = /\b(dummy|synthetic|mock data|sample data|test user)\b/i.test(text);
    const clippedTitle = [...document.querySelectorAll(".row-title")].some((el) => {
      const style = getComputedStyle(el);
      return style.whiteSpace === "nowrap" && el.scrollWidth > el.clientWidth + 2;
    });
    return { overflow, dummyLanguage, isoDate, rawEnum, clippedTitle, navObstruction, lastBottom, navTop };
  });
}

async function capture(folder, name, path, width, options = {}) {
  await page.setViewportSize({ width, height: width >= 1280 ? 1000 : 844 });
  await page.goto(`${root}${path}`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("h1, .page-title, .home-greeting, .brand-wordmark", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  if (options.scroll) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
  }
  if (options.click) {
    const locator = page.getByText(options.click, { exact: false }).first();
    await locator.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  const flags = await inspect();
  const file = `${out}/${folder}/${name}-${width}.png`;
  await page.screenshot({ path: file, fullPage: true });
  const row = { folder, name, width, path, file, ...flags, consoleErrors: errors.length };
  results.push(row);
  for (const key of ["overflow", "dummyLanguage", "isoDate", "rawEnum", "clippedTitle", "navObstruction"]) {
    if (row[key]) console.error(`${key.toUpperCase()} ${folder}/${name} @${width}`);
  }
}

try {
  await login("demo-owner@sukoon.local");
  const state = await (await context.request.get(`${root}/api/state`)).json();
  const docs = state.data?.state?.docs ?? [];
  const propertyId = marker.properties[0];
  const documentId = docs.find((doc) => doc.propertyId === propertyId && !doc.deletedAt && !doc.archivedAt)?.id;
  const obligations = await (await context.request.get(`${root}/api/obligations?propertyId=${propertyId}&view=all`)).json();
  const obligationId = obligations.data?.obligations?.[0]?.id;
  const purchaseId = marker.purchaseCandidateId;

  const ownerRoutes = [
    ["home", "/"],
    ["properties", "/properties"],
    ["property", `/property/${propertyId}`],
    ["vault-tab", `/property/${propertyId}?tab=vault`],
    ["bills-tab", `/property/${propertyId}?tab=bills`],
    ["maintenance", `/property/${propertyId}?tab=maint`],
    ["timeline", `/property/${propertyId}?tab=timeline`],
    ["sharing", `/property/${propertyId}?tab=share`],
    ["vault", "/vault"],
    ["bills", "/bills"],
    ["construction-overview", `/construction/${marker.activeProject}`],
    ["construction-plan", `/construction/${marker.activeProject}?tab=plan`],
    ["construction-budget", `/construction/${marker.activeProject}?tab=budget`],
    ["materials", `/construction/${marker.activeProject}?tab=materials`],
    ["construction-docs", `/construction/${marker.activeProject}?tab=documents`],
    ["purchases", "/buy-sell/purchases"],
    ["purchase-overview", `/buy-sell/purchases/${purchaseId}`],
    ["purchase-documents", `/buy-sell/purchases/${purchaseId}/documents`],
    ["purchase-questions", `/buy-sell/purchases/${purchaseId}/questions`],
    ["buy-sell", "/buy-sell"],
    ["search", "/search"],
    ["updates", "/updates"],
    ["profile", "/profile"],
    ["more", "/more"],
    ["property-new", "/property/new"],
    ["construction-new", "/construction/new"],
    ["reminders", "/reminders"],
    ["design-system", "/more/design-system"],
  ];
  if (documentId) ownerRoutes.push(["document-detail", `/property/${propertyId}/documents/${documentId}`]);
  if (obligationId) ownerRoutes.push(["payment-detail", `/property/${propertyId}/bills/${obligationId}`]);

  for (const [name, path] of ownerRoutes) {
    await capture("owner", name, path, 390);
  }
  await capture("owner", "updates-bottom", "/updates", 390, { scroll: true });
  await capture("owner", "construction-plan-bottom", `/construction/${marker.activeProject}?tab=plan`, 390, { scroll: true });
  await capture("owner", "budget-category-detail", `/construction/${marker.activeProject}?tab=budget`, 390, { click: "Civil" });
  await capture("owner", "vault-long-title", `/property/${propertyId}?tab=vault`, 390);

  for (const name of ["home", "document-detail", "purchase-overview", "construction-budget", "purchases"]) {
    const path = ownerRoutes.find((row) => row[0] === name)?.[1];
    if (!path) continue;
    await capture("owner", name, path, 430);
  }
  for (const name of ["purchase-overview", "construction-overview", "construction-budget"]) {
    const path = ownerRoutes.find((row) => row[0] === name)?.[1];
    if (!path) continue;
    await capture("owner", name, path, 1280);
  }

  await signOut();
  await login("demo-lawyer@sukoon.local");
  await capture("lawyer", "shared", "/shared", 390);
  await capture("lawyer", "shared-property", `/shared/${marker.properties[0]}`, 390);

  await signOut();
  await login("demo-architect@sukoon.local");
  await capture("architect", "shared", "/shared", 390);
  await capture("architect", "shared-construction", `/construction/${marker.activeProject}`, 390);

  const report = {
    origin: root,
    capturedAt: new Date().toISOString(),
    overflowCount: results.filter((r) => r.overflow).length,
    dummyCount: results.filter((r) => r.dummyLanguage).length,
    isoDateCount: results.filter((r) => r.isoDate).length,
    rawEnumCount: results.filter((r) => r.rawEnum).length,
    clippedTitleCount: results.filter((r) => r.clippedTitle).length,
    navObstructionCount: results.filter((r) => r.navObstruction).length,
    consoleErrors: errors,
    results,
  };
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    overflowCount: report.overflowCount,
    dummyCount: report.dummyCount,
    isoDateCount: report.isoDateCount,
    rawEnumCount: report.rawEnumCount,
    clippedTitleCount: report.clippedTitleCount,
    navObstructionCount: report.navObstructionCount,
    shots: results.length,
    errors: errors.length,
  }, null, 2));
  if (report.overflowCount || report.navObstructionCount) process.exitCode = 1;
} finally {
  await browser.close();
}
