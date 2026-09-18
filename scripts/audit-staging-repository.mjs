import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const safeTemplates = new Set([
  ".env.example",
  ".env.android.local.example",
  ".env.client-review.example",
  ".env.android.client-review.example",
]);
const pathRules = [
  [/^\.env(?:\.|$)/i, "ENVIRONMENT_SECRET_FILE"],
  [/(^|\/)\.data(?:\/|$)/i, "LOCAL_RUNTIME_STATE"],
  [/(^|\/)(?:output|artifacts|tmp)(?:\/|$)/i, "TEMPORARY_ACCEPTANCE_ARTIFACT"],
  [/(^|\/)(?:private|secrets?)(?:\/|$)/i, "PRIVATE_OR_SECRET_PATH"],
  [/(^|\/)(?:eicar|malware|virus)(?:[._/-]|$)/i, "MALWARE_FIXTURE"],
  [/(^|\/)(?:node_modules|\.next|\.gradle|\.jdk)(?:\/|$)/i, "GENERATED_RUNTIME_OUTPUT"],
  [/(^|\/)android\/app\/build(?:\/|$)/i, "ANDROID_BUILD_OUTPUT"],
  [/(^|\/)(?:.*\.(?:sqlite|sqlite3|db|pem|key|crt|p12|pfx|apk|aab|zip))$/i, "PRIVATE_OR_GENERATED_FILE"],
  [/(^|\/).*\.(?:pdf|docx?)$/i, "DOCUMENT_ARTIFACT"],
];
const secretAssignment = /(?:^|[\s;])(?:export\s+)?(?:const|let|var)?\s*(?:DATABASE_URL|BETTER_AUTH_SECRET|SMTP_PASSWORD|SMTP_USERNAME|SUKOON_STORAGE_SECRET_KEY|SUKOON_STORAGE_ACCESS_KEY|API_KEY|ACCESS_TOKEN)\s*[:=]\s*(?:["'`]([^"'`]+)["'`]|([^\s,;]+))/im;
const eicarMarker = new RegExp(`${["EICAR", "STANDARD-ANTIVIRUS-TEST-FILE"].join("-")}|${["X5O!P%", "@AP\\[4"].join("")}`, "i");

function hasConcreteSecretAssignment(text) {
  const match = text.match(secretAssignment);
  const value = (match?.[1] ?? match?.[2] ?? "").toLowerCase();
  if (!value) return false;
  return !value.startsWith("<") && !value.includes("localhost") && !value.includes("127.0.0.1") && !value.includes("process.env") && !value.includes("test-only") && !value.includes("ci-only") && !value.includes("placeholder") && !value.includes("test") && !/^(?:config|url|process|env|input|value|source|restored|undefined|null)\b/.test(value);
}

function checkPath(relativePath) {
  const value = relativePath.replaceAll("\\", "/");
  if (!value || value.startsWith("/") || value.split("/").includes("..")) return "UNSAFE_PATH";
  if (safeTemplates.has(value)) return null;
  for (const [rule, reason] of pathRules) if (rule.test(value)) return reason;
  return null;
}

function checkText(relativePath, text) {
  if (safeTemplates.has(relativePath)) return null;
  if (eicarMarker.test(text)) return "MALWARE_FIXTURE";
  if (hasConcreteSecretAssignment(text)) return "SECRET_LIKE_VALUE";
  return null;
}

const raw = execFileSync("git", ["-C", root, "ls-files", "-co", "--exclude-standard", "-z"], { encoding: "utf8" });
const paths = raw.split("\0").filter(Boolean).map((value) => value.replaceAll("\\", "/"));
const violations = [];
for (const relativePath of paths) {
  const pathReason = checkPath(relativePath);
  if (pathReason) { violations.push({ path: relativePath, reason: pathReason }); continue; }
  try {
    const contents = readFileSync(path.join(root, relativePath));
    if (contents.byteLength > 2_000_000) continue;
    const text = contents.toString("utf8");
    const textReason = checkText(relativePath, text);
    if (textReason) violations.push({ path: relativePath, reason: textReason });
  } catch {
    violations.push({ path: relativePath, reason: "FILE_UNREADABLE" });
  }
}

if (violations.length) {
  for (const violation of violations) console.error(`${violation.reason}: ${violation.path}`);
  process.exitCode = 1;
} else {
  console.log(`Staging publication audit passed for ${paths.length} non-ignored paths; no private values were printed.`);
}
