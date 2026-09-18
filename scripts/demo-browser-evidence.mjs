// Synthetic demo acceptance. Uses ordinary local OTP/mailbox auth and the normal browser routes.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const require = createRequire("/Users/tanutejas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");

const root = "http://localhost:3100";
const out = "output/synthetic-demo";
const dataset = { screenshots: [], checks: [], failures: [] };
const marker = JSON.parse(await readFile(".data/synthetic-demo/dataset-v1.json", "utf8"));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", (error) => dataset.failures.push(`pageerror: ${error.message}`));

async function shot(name) {
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, timeout: 30000 });
  dataset.screenshots.push(`${out}/${name}.png`);
}

async function login(email) {
  await page.goto(`${root}/`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await page.getByLabel("One-time code").waitFor();
  const mailbox = await context.request.get(`${root}/api/auth/dev-mailbox?email=${encodeURIComponent(email)}`);
  if (!mailbox.ok()) throw new Error(`mailbox ${email}: ${mailbox.status()}`);
  await page.getByLabel("One-time code").fill((await mailbox.json()).data.otp);
  await page.getByRole("button", { name: "Open passport", exact: true }).click();
  await page.waitForTimeout(1000);
}

async function signOut() {
  await context.request.post(`${root}/api/auth/sign-out`, { headers: { origin: root }, data: {} });
  await page.goto(`${root}/`, { waitUntil: "domcontentloaded" });
}

try {
  await mkdir(out, { recursive: true });
  await login("demo-owner@sukoon.local");
  await page.getByText("PORTFOLIO • 3 properties", { exact: true }).waitFor();
  await shot("01-home-owner");

  await page.goto(`${root}/properties`, { waitUntil: "domcontentloaded" });
  await page.getByText("Vijay Nagar House", { exact: true }).waitFor();
  await shot("02-properties-three-passports");

  await page.goto(`${root}/property/${marker.properties[0]}?tab=vault`, { waitUntil: "domcontentloaded" });
  await page.getByText("Demo Registry — Vijay Nagar", { exact: true }).waitFor();
  const documentCards = await page.locator("div.rounded-2xl.border.border-line.bg-white.p-3").evaluateAll((cards) => cards.map((card) => ({ text: card.textContent || "", href: card.querySelector('a[href^="/api/documents/"]')?.getAttribute("href") || null })));
  const unselectedDocumentPath = documentCards.find((card) => card.text.includes("Demo Registry — Vijay Nagar"))?.href;
  if (!unselectedDocumentPath) throw new Error("could not locate the unselected registry preview link");
  await shot("03-vault-reviewed-documents");

  await page.goto(`${root}/construction/${marker.activeProject}`, { waitUntil: "domcontentloaded" });
  await page.getByText("Mehta Residence", { exact: true }).waitFor();
  await shot("04-construction-dashboard");

  await page.goto(`${root}/buy-sell/purchases`, { waitUntil: "domcontentloaded" });
  await page.getByText("Riverfront Residency", { exact: false }).first().waitFor();
  await shot("05-purchase-workspace");

  await page.goto(`${root}/updates`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Updates", exact: true }).waitFor();
  await shot("06-updates");
  dataset.checks.push("Owner OTP, Home, three passports, Vault, Construction, Purchase and Updates rendered through normal routes");

  await signOut();
  await login("demo-architect@sukoon.local");
  await page.goto(`${root}/shared`, { waitUntil: "domcontentloaded" });
  await page.getByText("Vijay Nagar House", { exact: true }).waitFor();
  await page.getByRole("link", { name: /Vijay Nagar House/ }).click();
  await page.getByText("Demo Sanction Map — Vijay Nagar", { exact: false }).waitFor();
  await shot("07-architect-shared-property");
  const visibleText = await page.locator("body").innerText();
  if (visibleText.includes("Demo Registry — Vijay Nagar") || visibleText.includes("Property Tax")) throw new Error("architect scope leaked an unselected document or bill");
  dataset.checks.push("Architect signed-in shared view showed the selected synthetic document and did not show unselected documents or bills");

  const denial = await context.request.get(`${root}${unselectedDocumentPath}`);
  if (![403, 404].includes(denial.status())) throw new Error(`architect unselected document status ${denial.status()}`);
  dataset.checks.push(`Architect direct unselected-document request denied with ${denial.status()}`);
  await writeFile(`${out}/evidence.json`, JSON.stringify(dataset, null, 2));
  console.log(JSON.stringify(dataset));
} catch (error) {
  dataset.failures.push(error instanceof Error ? error.message : String(error));
  await writeFile(`${out}/evidence.json`, JSON.stringify(dataset, null, 2));
  console.error(JSON.stringify(dataset));
  process.exitCode = 1;
} finally {
  await browser.close();
}
