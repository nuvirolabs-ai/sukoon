import "dotenv/config";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Database command blocked: DATABASE_URL is not configured.");
  process.exit(2);
}

let databaseName;
try {
  databaseName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
} catch {
  console.error("Database command blocked: DATABASE_URL is not a valid PostgreSQL URL.");
  process.exit(2);
}

const staging = process.env.APP_ENV === "staging" && process.env.SUKOON_RUNTIME_PROFILE === "STAGING" && process.env.NODE_ENV === "production";
if ((process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") && !staging) {
  console.error("Database command blocked: production environments require an approved release procedure.");
  process.exit(2);
}
if (staging && databaseName !== "sukoon_demo_staging") {
  console.error("Database command blocked: staging migrations require the dedicated sukoon_demo_staging database.");
  process.exit(2);
}
if (staging && (args[0] !== "migrate" || args[1] !== "deploy")) {
  console.error("Database command blocked: staging exposes only the web pre-deploy migration command.");
  process.exit(2);
}
if (!staging && !/^sukoon_s02_(local|test)_[a-zA-Z0-9_-]+$/.test(databaseName)) {
  console.error(`Database command blocked: refusing database ${databaseName || "<empty>"}. Use an isolated sukoon_s02_local_* or sukoon_s02_test_* database.`);
  process.exit(2);
}
if (args.includes("reset")) {
  console.error("Database command blocked: destructive migration reset is not part of the Sukoon workflow.");
  process.exit(2);
}

const result = spawnSync("npx", ["prisma", ...args], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
