import net from "node:net";
import { createHash } from "node:crypto";
import type { MalwareScanPort, ObjectStoragePort, ScanEvidence, ScanInput, ScanResult } from "@/lib/providers";

const MAX_SCAN_BYTES = 25 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;
const SIGNATURE_MAX_AGE_MS = 72 * 60 * 60 * 1000;

export type ScannerEndpoint = { host: string; port: number };

function privateIpv4(host: string) {
  const parts = host.split(".").map(Number);
  return parts.length === 4 && (parts[0] === 10 || parts[0] === 127 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168));
}

export function validatePrivateScannerEndpoint(raw: string, options?: { allowLoopbackForTest?: boolean }): ScannerEndpoint {
  let url: URL;
  try { url = new URL(raw.includes("://") ? raw : `tcp://${raw}`); } catch { throw new Error("SCANNER_ENDPOINT_INVALID"); }
  if (url.protocol !== "tcp:" || url.username || url.password || (url.pathname && url.pathname !== "/") || url.search || url.hash || !url.hostname) throw new Error("SCANNER_ENDPOINT_INVALID");
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SCANNER_ENDPOINT_INVALID");
  const addressType = net.isIP(url.hostname);
  const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  const privateHost = addressType === 4 ? privateIpv4(url.hostname) : addressType === 6 ? url.hostname.toLowerCase().startsWith("fd") || url.hostname.toLowerCase().startsWith("fe8") : loopback || url.hostname.endsWith(".internal") || url.hostname.endsWith(".local") || !url.hostname.includes(".");
  if (!privateHost || (loopback && !options?.allowLoopbackForTest)) throw new Error("SCANNER_ENDPOINT_NOT_PRIVATE");
  return { host: url.hostname.replace(/^\[|\]$/g, ""), port };
}

export function parseClamdVersion(raw: string): { engineVersion: string; signatureVersion: string; signatureDate: string } | null {
  const match = /^ClamAV\s+(\S+?)(?:\/(\d+))?(?:\/([^\r\n]+))?\s*$/.exec(raw.trim().replace(/\0/g, ""));
  if (!match?.[1] || !match[2] || !match[3]) return null;
  const timestamp = Date.parse(match[3].trim());
  if (!Number.isFinite(timestamp)) return null;
  return { engineVersion: match[1], signatureVersion: match[2], signatureDate: new Date(timestamp).toISOString() };
}

function safeKey(key: string) {
  return /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(key) && !key.split("/").includes("..");
}

function resultFor(evidence: ScanEvidence, verdict: ScanEvidence["verdict"], reason: string | null): ScanResult {
  Object.assign(evidence, { verdict, reason, scannedAt: new Date().toISOString() });
  return verdict === "unavailable" ? { outcome: "unavailable", reason: reason ?? "SCANNER_UNAVAILABLE", evidence } : { outcome: "available", value: { verdict }, evidence };
}

function responseReason(response: string) {
  if (/\bFOUND\s*$/i.test(response.trim())) return { verdict: "rejected" as const, reason: "THREAT_DETECTED" };
  if (/^stream:\s*OK$/i.test(response.trim())) return { verdict: "clean" as const, reason: null };
  return { verdict: "unavailable" as const, reason: "SCAN_RESULT_UNCONFIRMED" };
}

export class ClamdScanner implements MalwareScanPort {
  readonly id = "private-clamav-clamd";
  readonly environment = "remote" as const;
  private readonly endpoint: ScannerEndpoint;
  private readonly connectTimeoutMs: number;
  private readonly now: () => number;
  private readonly allowLoopbackForTest: boolean;

  constructor(private readonly storage: ObjectStoragePort, endpoint: string, options?: { connectTimeoutMs?: number; now?: () => number; allowLoopbackForTest?: boolean }) {
    this.allowLoopbackForTest = options?.allowLoopbackForTest ?? false;
    this.endpoint = validatePrivateScannerEndpoint(endpoint, { allowLoopbackForTest: this.allowLoopbackForTest });
    this.connectTimeoutMs = Math.max(50, Math.min(options?.connectTimeoutMs ?? 5_000, 30_000));
    this.now = options?.now ?? Date.now;
  }

  private request(command: "VERSION" | "INSTREAM", bytes?: Uint8Array) {
    return new Promise<string>((resolve, reject) => {
      const socket = net.createConnection({ host: this.endpoint.host, port: this.endpoint.port });
      let output = Buffer.alloc(0);
      let settled = false;
      const timer = setTimeout(() => { socket.destroy(); if (!settled) { settled = true; reject(new Error("SCANNER_TIMEOUT")); } }, this.connectTimeoutMs);
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true; clearTimeout(timer); socket.destroy();
        if (error) reject(error); else resolve(output.toString("utf8").replace(/\0/g, "").trim());
      };
      socket.setNoDelay(true);
      socket.on("connect", () => {
        socket.write(`${command}\0`);
        if (command !== "INSTREAM" || !bytes) return;
        for (let offset = 0; offset < bytes.byteLength; offset += 8192) {
          const chunk = bytes.subarray(offset, Math.min(offset + 8192, bytes.byteLength));
          const header = Buffer.alloc(4); header.writeUInt32BE(chunk.byteLength, 0); socket.write(header); socket.write(chunk);
        }
        socket.write(Buffer.alloc(4));
      });
      socket.on("data", (chunk: Buffer) => {
        if (output.byteLength + chunk.byteLength > MAX_RESPONSE_BYTES) { finish(new Error("SCANNER_OUTPUT_LIMIT")); return; }
        output = Buffer.concat([output, chunk]);
        if (output.includes(0) || command === "VERSION" && output.includes(10)) finish();
      });
      socket.on("error", () => finish(new Error("SCANNER_UNAVAILABLE")));
      socket.on("close", () => { if (!settled) finish(); });
    });
  }

  async scan(input: ScanInput): Promise<ScanResult> {
    const evidence: ScanEvidence = { implementation: this.id, engineVersion: null, signatureVersion: null, signatureDate: null, scannedAt: new Date().toISOString(), documentVersionId: input.documentVersionId, sha256: input.sha256, verdict: "unavailable", reason: null };
    if (!safeKey(input.storageKey) || !input.documentVersionId || !/^[a-f0-9]{64}$/.test(input.sha256) || input.sizeBytes < 1 || input.sizeBytes > MAX_SCAN_BYTES || !["application/pdf", "image/jpeg", "image/png"].includes(input.contentType)) return resultFor(evidence, "unavailable", "UNSUPPORTED_SCAN_INPUT");
    const stored = await this.storage.get(input.storageKey);
    if (stored.outcome !== "available") return resultFor(evidence, "unavailable", "SCAN_OBJECT_UNAVAILABLE");
    const bytes = stored.value.bytes;
    if (bytes.byteLength !== input.sizeBytes || createHash("sha256").update(bytes).digest("hex") !== input.sha256) return resultFor(evidence, "unavailable", "SCAN_HASH_MISMATCH");
    let before: ReturnType<typeof parseClamdVersion>;
    let after: ReturnType<typeof parseClamdVersion>;
    try {
      before = parseClamdVersion(await this.request("VERSION"));
      if (!before) return resultFor(evidence, "unavailable", "SIGNATURE_METADATA_UNAVAILABLE");
      const signatureTimestamp = Date.parse(before.signatureDate);
      if (!Number.isFinite(signatureTimestamp) || signatureTimestamp > this.now() || this.now() - signatureTimestamp > SIGNATURE_MAX_AGE_MS) return resultFor(evidence, "unavailable", "SIGNATURE_DATABASE_STALE_OR_FUTURE");
      Object.assign(evidence, { engineVersion: before.engineVersion, signatureVersion: before.signatureVersion, signatureDate: before.signatureDate });
      const scan = responseReason(await this.request("INSTREAM", bytes));
      after = parseClamdVersion(await this.request("VERSION"));
      if (!after) return resultFor(evidence, "unavailable", "SIGNATURE_METADATA_UNAVAILABLE");
      if (after.engineVersion !== before.engineVersion || after.signatureVersion !== before.signatureVersion || after.signatureDate !== before.signatureDate) return resultFor(evidence, "unavailable", "SIGNATURE_DATABASE_CHANGED_DURING_SCAN");
      return resultFor(evidence, scan.verdict, scan.reason);
    } catch (error) {
      const reason = error instanceof Error && ["SCANNER_TIMEOUT", "SCANNER_OUTPUT_LIMIT", "SCANNER_UNAVAILABLE"].includes(error.message) ? error.message : "SCANNER_UNAVAILABLE";
      return resultFor(evidence, "unavailable", reason);
    }
  }

  async probe() {
    try {
      const version = parseClamdVersion(await this.request("VERSION"));
      if (!version) return { ready: false as const, reason: "SIGNATURE_METADATA_UNAVAILABLE" };
      const timestamp = Date.parse(version.signatureDate);
      if (!Number.isFinite(timestamp) || timestamp > this.now() || this.now() - timestamp > SIGNATURE_MAX_AGE_MS) return { ready: false as const, reason: "SIGNATURE_DATABASE_STALE_OR_FUTURE" };
      return { ready: true as const, engineVersion: version.engineVersion, signatureVersion: version.signatureVersion, signatureDate: version.signatureDate };
    } catch (error) {
      return { ready: false as const, reason: error instanceof Error && ["SCANNER_TIMEOUT", "SCANNER_OUTPUT_LIMIT", "SCANNER_UNAVAILABLE"].includes(error.message) ? error.message : "SCANNER_UNAVAILABLE" };
    }
  }
}
