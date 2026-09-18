import "dotenv/config";
import { spawnSync } from "node:child_process";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  console.error("Integration tests blocked: TEST_DATABASE_URL is not configured.");
  process.exit(2);
}

let databaseName;
try {
  databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.slice(1));
} catch {
  console.error("Integration tests blocked: TEST_DATABASE_URL is not a valid PostgreSQL URL.");
  process.exit(2);
}

if (!/^sukoon_s02_test_[a-zA-Z0-9_-]+$/.test(databaseName)) {
  console.error(`Integration tests blocked: refusing database ${databaseName || "<empty>"}. The test database must be an isolated sukoon_s02_test_* database.`);
  process.exit(2);
}

const env = { ...process.env, APP_ENV: "test", NODE_ENV: "test", DATABASE_URL: testDatabaseUrl };
const migration = spawnSync("npx", ["prisma", "migrate", "deploy"], { env, stdio: "inherit" });
if (migration.status !== 0) process.exit(migration.status ?? 1);

const files = process.argv.slice(2);
const test = spawnSync("npx", ["vitest", "run", ...(files.length ? files : ["tests/integration"])], { env, stdio: "inherit" });
process.exit(test.status ?? 1);
