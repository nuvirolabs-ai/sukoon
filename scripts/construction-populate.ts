import "dotenv/config";
import { runConstructionPopulate } from "../lib/construction-populate";

const operation = process.argv[2];
if (operation !== "plan" && operation !== "apply" && operation !== "verify") {
  console.error("Usage: npm run construction:populate -- plan|apply|verify");
  process.exit(2);
}

runConstructionPopulate({ operation }).then((report) => {
  console.log(JSON.stringify(report, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2));
  if (report.conflicts.length && operation !== "plan") process.exit(1);
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "CONSTRUCTION_POPULATE_FAILED");
  process.exit(1);
});
