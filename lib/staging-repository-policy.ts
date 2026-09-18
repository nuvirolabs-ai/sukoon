import path from "node:path";

export type StagingAuditViolation = { path: string; reason: string };
export type StagingPathDecision = { allowed: boolean; reason?: string };

const SAFE_TEMPLATES = new Set([".env.example", ".env.android.local.example"]);
const FORBIDDEN_PATH_RULES: Array<[RegExp, string]> = [
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

const SECRET_ASSIGNMENT = /(?:^|[\s;])(?:export\s+)?(?:const|let|var)?\s*(?:DATABASE_URL|BETTER_AUTH_SECRET|SMTP_PASSWORD|SMTP_USERNAME|SUKOON_STORAGE_SECRET_KEY|SUKOON_STORAGE_ACCESS_KEY|API_KEY|ACCESS_TOKEN)\s*[:=]\s*(?:["'`]([^"'`]+)["'`]|([^\s,;]+))/im;
const EICAR_MARKER = new RegExp(`${["EICAR", "STANDARD-ANTIVIRUS-TEST-FILE"].join("-")}|${["X5O!P%", "@AP\\[4"].join("")}`, "i");

function hasConcreteSecretAssignment(text: string) {
  const match = text.match(SECRET_ASSIGNMENT);
  const value = (match?.[1] ?? match?.[2] ?? "").toLowerCase();
  if (!value) return false;
  return !value.startsWith("<") && !value.includes("localhost") && !value.includes("127.0.0.1") && !value.includes("process.env") && !value.includes("test-only") && !value.includes("ci-only") && !value.includes("placeholder") && !value.includes("test") && !/^(?:config|url|process|env|input|value|source|restored|undefined|null)\b/.test(value);
}

function normalized(relativePath: string) {
  const value = relativePath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!value || value.startsWith("/") || value.split("/").includes("..")) return null;
  return path.posix.normalize(value);
}

export function isStagingPathAllowed(relativePath: string): StagingPathDecision {
  const value = normalized(relativePath);
  if (!value) return { allowed: false, reason: "UNSAFE_PATH" };
  if (SAFE_TEMPLATES.has(value)) return { allowed: true };
  for (const [rule, reason] of FORBIDDEN_PATH_RULES) if (rule.test(value)) return { allowed: false, reason };
  return { allowed: true };
}

export function auditStagingPaths(paths: readonly string[]): StagingAuditViolation[] {
  return paths.flatMap((candidate) => {
    const decision = isStagingPathAllowed(candidate);
    return decision.allowed ? [] : [{ path: candidate.replaceAll("\\", "/"), reason: decision.reason ?? "FORBIDDEN_PATH" }];
  });
}

export function auditStagingText(relativePath: string, text: string): StagingAuditViolation | null {
  const decision = isStagingPathAllowed(relativePath);
  if (!decision.allowed) return { path: relativePath.replaceAll("\\", "/"), reason: decision.reason ?? "FORBIDDEN_PATH" };
  if (SAFE_TEMPLATES.has(normalized(relativePath) ?? "")) return null;
  if (EICAR_MARKER.test(text)) return { path: relativePath.replaceAll("\\", "/"), reason: "MALWARE_FIXTURE" };
  if (hasConcreteSecretAssignment(text)) return { path: relativePath.replaceAll("\\", "/"), reason: "SECRET_LIKE_VALUE" };
  return null;
}
