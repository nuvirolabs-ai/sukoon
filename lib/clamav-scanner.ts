import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, open, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { MalwareScanPort, ObjectStoragePort, ScanEvidence, ScanInput, ScanResult } from "@/lib/providers";

export type CommandResult = { code: number | null; output: string; failed?: string };
export type ScanCommand = (binary: string, args: string[], bytes?: Uint8Array) => Promise<CommandResult>;

/** No shell, no pathname from the upload, bounded output and wall time. */
export const runScanCommand: ScanCommand = (binary, args, bytes) => new Promise((resolve) => {
  const child = spawn(binary, args, { shell: false, env: { ...process.env, LC_ALL: "C", TZ: "UTC" }, stdio: ["pipe", "pipe", "pipe"] });
  let output = "", failed: string | undefined;
  const timer = setTimeout(() => { failed = "SCANNER_TIMEOUT"; child.kill("SIGKILL"); }, 45_000);
  const collect = (chunk: Buffer) => {
    if (output.length + chunk.length > 65536) { failed = "SCANNER_OUTPUT_LIMIT"; child.kill("SIGKILL"); }
    else output += chunk.toString("utf8");
  };
  child.stdout.on("data", collect); child.stderr.on("data", collect);
  child.stdin.on("error", () => { failed ??= "SCANNER_INPUT_ERROR"; });
  child.on("error", () => { clearTimeout(timer); resolve({ code: null, output: "", failed: "SCANNER_UNAVAILABLE" }); });
  child.on("close", (code) => { clearTimeout(timer); resolve({ code, output, failed }); });
  child.stdin.end(bytes);
});

export function classifyClamOutput(result: CommandResult): { verdict: ScanEvidence["verdict"]; reason: string | null } {
  if (result.failed) return { verdict: "unavailable", reason: result.failed };
  if (/Heuristics\.(?:Limits|Encrypted|Broken)|\b(?:WARNING|ERROR|skipped|unsupported|encrypted|limit exceeded)\b/i.test(result.output)) return { verdict: "unavailable", reason: "SCAN_INCOMPLETE" };
  if (result.code === 1 && /^stdin: [^\r\n]+ FOUND\s*$/m.test(result.output)) return { verdict: "rejected", reason: "THREAT_DETECTED" };
  if (result.code === 0 && /^stdin: OK\s*$/m.test(result.output) && /^Scanned files:\s+[1-9]\d*\s*$/m.test(result.output) && /^Infected files:\s+0\s*$/m.test(result.output) && /^Known viruses:\s+[1-9]\d*\s*$/m.test(result.output)) return { verdict: "clean", reason: null };
  return { verdict: "unavailable", reason: "SCAN_RESULT_UNCONFIRMED" };
}

export async function signatureSnapshot(directory: string, now = Date.now()) {
  const names = (await readdir(directory)).filter(n => /\.(?:cvd|cld)$/.test(n)).sort();
  for (const required of ["main", "daily", "bytecode"]) if (names.filter(n => n === `${required}.cvd` || n === `${required}.cld`).length !== 1) throw new Error("SIGNATURE_DATABASE_MISSING_OR_AMBIGUOUS");
  if (names.length !== 3) throw new Error("UNEXPECTED_SIGNATURE_DATABASE");
  const records = await Promise.all(names.map(async name => {
    const handle = await open(path.join(directory, name), "r");
    try {
      const header = Buffer.alloc(512); await handle.read(header, 0, 512, 0);
      const fields = header.toString("ascii").trim().split(":");
      const info = await handle.stat();
      if (fields[0] !== "ClamAV-VDB" || !/^\d+$/.test(fields[2]) || !/^\d+$/.test(fields[3]) || !info.isFile()) throw new Error("SIGNATURE_HEADER_INVALID");
      const headerDate = fields[1]?.replace(/^(\d{1,2} [A-Za-z]{3} \d{4} \d{2})-(\d{2}) ([+-]\d{4})$/, "$1:$2 $3");
      const date = Date.parse(headerDate ?? "");
      if (!Number.isFinite(date)) throw new Error("SIGNATURE_HEADER_INVALID");
      return { name, version: fields[2], date, size: info.size, mtime: info.mtimeMs, ino: info.ino };
    } finally { await handle.close(); }
  }));
  const daily = records.find(r => r.name.startsWith("daily."))!;
  if (!Number.isFinite(daily.date) || daily.date > now || now - daily.date > 72 * 3600_000) throw new Error("SIGNATURE_DATABASE_STALE_OR_FUTURE");
  return { version: records.map(r => `${r.name}:${r.version}`).join(","), date: new Date(daily.date).toISOString(), fingerprint: JSON.stringify(records) };
}

/** Opt-in local scanner only. Installation and signature updates are operator-approved, separate operations. */
export class ClamAvScanner implements MalwareScanPort {
  readonly id = "local-clamav-clamscan";
  readonly environment = "local" as const;
  constructor(private storage: ObjectStoragePort, private binary: string, private database: string, private command: ScanCommand = runScanCommand) {}
  async scan(input: ScanInput): Promise<ScanResult> {
    const evidence: ScanEvidence = { implementation: this.id, engineVersion: null, signatureVersion: null, signatureDate: null, scannedAt: new Date().toISOString(), documentVersionId: input.documentVersionId, sha256: input.sha256, verdict: "unavailable", reason: null };
    let temp: string | undefined;
    const finish = (verdict: ScanEvidence["verdict"], reason: string | null): ScanResult => {
      Object.assign(evidence, { verdict, reason, scannedAt: new Date().toISOString() });
      return verdict === "unavailable" ? { outcome: "unavailable", reason: reason!, evidence } : { outcome: "available", value: { verdict }, evidence };
    };
    try {
      if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production" || (process.env.APP_ENV !== "local" && process.env.NODE_ENV !== "test")) return finish("unavailable", "LOCAL_SCANNER_DISABLED");
      if (!path.isAbsolute(this.binary) || !path.isAbsolute(this.database)) return finish("unavailable", "SCANNER_CONFIGURATION_INVALID");
      if (!input.documentVersionId || !/^[a-f0-9]{64}$/.test(input.sha256) || input.sizeBytes < 1 || input.sizeBytes > 25 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(input.contentType)) return finish("unavailable", "UNSUPPORTED_SCAN_INPUT");
      const stored = await this.storage.get(input.storageKey);
      if (stored.outcome !== "available") return finish("unavailable", "SCAN_OBJECT_UNAVAILABLE");
      const bytes = stored.value.bytes;
      if (bytes.length !== input.sizeBytes || createHash("sha256").update(bytes).digest("hex") !== input.sha256) return finish("unavailable", "SCAN_HASH_MISMATCH");
      const before = await signatureSnapshot(this.database);
      evidence.signatureVersion = before.version; evidence.signatureDate = before.date;
      const version = await this.command(this.binary, ["--version"]);
      const match = /^ClamAV (\d+\.\d+\.\d+(?:[^\s/]*)?)(?:\/[^\r\n]+)?\s*$/.exec(version.output.trim());
      if (version.code !== 0 || version.failed || !match) return finish("unavailable", "SCANNER_VERSION_UNAVAILABLE");
      evidence.engineVersion = match[1];
      temp = await mkdtemp(path.join(tmpdir(), "sukoon-scan-"));
      const result = await this.command(this.binary, [
        `--database=${this.database}`, `--tempdir=${temp}`, "--official-db-only=yes", "--fail-if-cvd-older-than=3",
        "--alert-exceeds-max=yes", "--alert-encrypted=yes", "--alert-broken=yes", "--scan-pdf=yes", "--scan-image=yes",
        "--max-filesize=25M", "--max-scansize=100M", "--max-files=1000", "--max-recursion=16", "--max-scantime=30000",
        "--follow-dir-symlinks=0", "--follow-file-symlinks=0", "-",
      ], bytes);
      const after = await signatureSnapshot(this.database);
      if (after.fingerprint !== before.fingerprint) return finish("unavailable", "SIGNATURE_DATABASE_CHANGED_DURING_SCAN");
      const outcome = classifyClamOutput(result);
      return finish(outcome.verdict, outcome.reason);
    } catch (error) {
      const code = error instanceof Error && /^SIGNATURE_[A-Z_]+$/.test(error.message) ? error.message : "SCANNER_UNAVAILABLE";
      return finish("unavailable", code);
    } finally {
      if (temp && (await stat(temp).catch(() => null))?.isDirectory()) await rm(temp, { recursive: true, force: true });
    }
  }
}
