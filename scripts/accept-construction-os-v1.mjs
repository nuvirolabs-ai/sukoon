/**
 * Construction OS V1 owner acceptance capture. Local only, synthetic AB data.
 * Logs in as the CONSTRUCTION_AB_V1 owner, captures NOW/Journey/Money/Site/
 * More at phone + desktop widths, and runs static quality checks per screen
 * (overflow, raw enums, ISO dates, clipped titles, nav obstruction).
 */
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire("/Users/tanutejas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");

const root = process.env.SUKOON_ORIGIN || "http://localhost:3100";
const out = "output/construction-os-v1";
const results = [];
const errors = [];

await mkdir(`${out}/390`, { recursive: true });
await mkdir(`${out}/430`, { recursive: true });
await mkdir(`${out}/1280`, { recursive: true });

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

function inspect() {
  return page.evaluate(() => {
    const nav = document.querySelector(".bottom-navigation");
    const actionable = [...document.querySelectorAll("a, button, [role='button'], .list-row, .primary-disclosure")].filter((el) => {
      if (nav && nav.contains(el)) return false;
      if (el.classList.contains("skip-link")) return false;
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.position === "sticky") return false;
      const rect = el.getBoundingClientRect();
      return rect.height > 0 && rect.width > 0;
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest("input, textarea, select, option, script, style, .bottom-navigation")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const bits = [];
    while (walker.nextNode()) bits.push(walker.currentNode.textContent || "");
    const text = bits.join(" ");
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      dummyLanguage: /\b(dummy|mock data|sample data|test user)\b/i.test(text),
      isoDate: /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/.test(text),
      rawEnum: /\b[A-Z]{3,}(?:_[A-Z0-9]+){1,}\b/.test(text),
      clippedTitle: [...document.querySelectorAll(".row-title")].some((el) => {
        const style = getComputedStyle(el);
        return style.whiteSpace === "nowrap" && el.scrollWidth > el.clientWidth + 2;
      }),
      actionables: actionable.length,
    };
  });
}

async function capture(width, name, path, options = {}) {
  const started = Date.now();
  await page.setViewportSize({ width, height: width >= 1280 ? 1000 : 844 });
  await page.goto(`${root}${path}`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.getByText("Mehta Residence").first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
  if (options.click) {
    await page.getByText(options.click, { exact: false }).first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  if (options.scroll) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
  }
  const flags = await inspect();
  const file = `${out}/${width}/${name}-${width}.png`;
  await page.screenshot({ path: file, fullPage: true });
  const ms = Date.now() - started;
  const row = { name, width, path, file, ms, ...flags, consoleErrors: errors.length };
  results.push(row);
  console.log(`${ms}ms ${file} overflow=${flags.overflow} rawEnum=${flags.rawEnum} isoDate=${flags.isoDate} clipped=${flags.clippedTitle} actionables=${flags.actionables}`);
  for (const key of ["overflow", "dummyLanguage", "isoDate", "rawEnum", "clippedTitle"]) {
    if (row[key]) console.error(`FLAG ${key.toUpperCase()} ${name} @${width}`);
  }
}

await login("construction-ab-owner@example.com");
const list = await (await context.request.get(`${root}/api/construction`)).json();
const project = (list.data ?? list).find((p) => p.name === "Mehta Residence") ?? (list.data ?? list)[0];
if (!project) throw new Error("AB project not found");
const base = `/construction/${project.id}`;

for (const width of [390, 430, 1280]) {
  await capture(width, "now", `${base}?tab=now`);
  await capture(width, "journey", `${base}?tab=journey`);
  await capture(width, "money", `${base}?tab=money`);
  await capture(width, "money-scrolled", `${base}?tab=money`, { scroll: true });
  await capture(width, "site", `${base}?tab=site`);
  await capture(width, "more", `${base}?tab=more`);
  await capture(width, "more-decisions", `${base}?tab=more`, { click: "Request a decision" });
}
await capture(390, "decision-detail", `${base}?tab=more`, { click: "Electrical layout approval" });
await capture(390, "change-detail", `${base}?tab=money`, { click: "Bedroom flooring upgrade" });

await browser.close();
const flagged = results.filter((r) => r.overflow || r.dummyLanguage || r.isoDate || r.rawEnum || r.clippedTitle);
console.log(JSON.stringify({ captures: results.length, flagged: flagged.map((r) => `${r.name}@${r.width}`), consoleErrors: errors.slice(0, 10) }, null, 2));
if (flagged.length) process.exitCode = 2;
