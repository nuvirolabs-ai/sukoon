/** Interaction recording: story → decision → back → journey → money → site. */
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire("/Users/tanutejas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");
const root = process.env.SUKOON_ORIGIN || "http://localhost:3100";

await mkdir("output/construction-visual-v1-2", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  recordVideo: { dir: "output/construction-visual-v1-2", size: { width: 390, height: 844 } },
});
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
const base = `/construction/${project.id}?tab=now`;

// Story: pause, open the electrical decision sheet, close it, go back.
await page.goto(`${root}${base}`, { waitUntil: "domcontentloaded" });
await page.getByText("Mehta Residence").first().waitFor({ timeout: 15000 }).catch(() => {});
await page.waitForTimeout(900);
await page.getByText("Electrical layout approval", { exact: false }).first().click();
await page.waitForTimeout(900);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await page.goBack();
await page.waitForTimeout(700);
// Journey → Money → Site.
await page.goto(`${root}/construction/${project.id}?tab=journey`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await page.goto(`${root}/construction/${project.id}?tab=money`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await page.goto(`${root}/construction/${project.id}?tab=site`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await context.close();
await browser.close();
console.log("recording saved to output/construction-visual-v1-2");
