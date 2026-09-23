import "dotenv/config";
import { runTransactionSeed } from "../lib/transaction-seed";

const operation = process.argv[2];
if (operation !== "plan" && operation !== "apply" && operation !== "verify") {
  console.error("Usage: npm run transactions:populate -- plan|apply|verify");
  process.exit(2);
}
runTransactionSeed({ operation }).then((report) => {
  console.log(JSON.stringify(report, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2));
  if (report.conflicts.length || report.checks.some((check) => check.status === "FAIL")) process.exit(1);
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "TRANSACTION_SEED_FAILED");
  process.exit(1);
});
