import net from "node:net";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { ClamdScanner, parseClamdVersion, validatePrivateScannerEndpoint } from "@/lib/clamd-scanner";
import type { ObjectStoragePort } from "@/lib/providers";

const bytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
const sha256 = createHash("sha256").update(bytes).digest("hex");
const storage: ObjectStoragePort = { id: "fake-storage", environment: "remote", put: async () => ({ outcome: "unavailable", reason: "not used" }), get: async () => ({ outcome: "available", value: { bytes, contentType: "application/pdf" } }), delete: async () => ({ outcome: "unavailable", reason: "not used" }) };
const servers: net.Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

async function fakeClamd(response: string | ((request: Buffer) => string)) {
  const server = net.createServer((socket) => {
    let request = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      request = Buffer.concat([request, chunk]);
      if (request.includes(0)) {
        const output = typeof response === "function" ? response(request) : response;
        socket.end(`${output}\0`);
      }
    });
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server did not bind");
  return `127.0.0.1:${address.port}`;
}

describe("private-network ClamAV daemon adapter", () => {
  it("parses engine/signature metadata and enforces private endpoint policy", () => {
    const parsed = parseClamdVersion("ClamAV 1.4.3/12345/Thu Sep 17 08:00:00 2026");
    if (!parsed) throw new Error("version fixture did not parse");
    expect(parsed).toMatchObject({ engineVersion: "1.4.3", signatureVersion: "12345" });
    expect(parsed.signatureDate).toBeTruthy();
    expect(validatePrivateScannerEndpoint("sukoon-clamav:3310")).toMatchObject({ host: "sukoon-clamav", port: 3310 });
    expect(() => validatePrivateScannerEndpoint("clamav.example.com:3310")).toThrow("SCANNER_ENDPOINT_NOT_PRIVATE");
  });

  it("requires an exact stream OK and current signature metadata for clean", async () => {
    const endpoint = await fakeClamd((request) => request.toString("utf8").startsWith("VERSION") ? `ClamAV 1.4.3/12345/${new Date().toUTCString()}` : "stream: OK");
    const scanner = new ClamdScanner(storage, endpoint, { allowLoopbackForTest: true });
    const result = await scanner.scan({ storageKey: "quarantine/documents/version.pdf", contentType: "application/pdf", sizeBytes: bytes.byteLength, documentVersionId: "version-clean", sha256 });
    expect(result).toMatchObject({ outcome: "available", value: { verdict: "clean" }, evidence: { verdict: "clean", documentVersionId: "version-clean", sha256, implementation: "private-clamav-clamd" } });
    expect(result.evidence?.engineVersion).toBe("1.4.3");
  });

  it("records threat detection and fails closed for malformed, stale or unavailable responses", async () => {
    const threatEndpoint = await fakeClamd((request) => request.toString("utf8").startsWith("VERSION") ? `ClamAV 1.4.3/12345/${new Date().toUTCString()}` : "stream: Win.Test.Detection FOUND");
    const threat = await new ClamdScanner(storage, threatEndpoint, { allowLoopbackForTest: true }).scan({ storageKey: "safe/doc.pdf", contentType: "application/pdf", sizeBytes: bytes.byteLength, documentVersionId: "version-threat", sha256 });
    expect(threat).toMatchObject({ outcome: "available", value: { verdict: "rejected" }, evidence: { verdict: "rejected", reason: "THREAT_DETECTED" } });

    const staleEndpoint = await fakeClamd("ClamAV 1.4.3/12345/Mon Jan 01 00:00:00 2020");
    const stale = await new ClamdScanner(storage, staleEndpoint, { allowLoopbackForTest: true }).scan({ storageKey: "safe/doc.pdf", contentType: "application/pdf", sizeBytes: bytes.byteLength, documentVersionId: "version-stale", sha256 });
    expect(stale).toMatchObject({ outcome: "unavailable", evidence: { verdict: "unavailable", reason: "SIGNATURE_DATABASE_STALE_OR_FUTURE" } });

    const malformedEndpoint = await fakeClamd("not-a-clamav-version");
    const malformed = await new ClamdScanner(storage, malformedEndpoint, { allowLoopbackForTest: true }).scan({ storageKey: "safe/doc.pdf", contentType: "application/pdf", sizeBytes: bytes.byteLength, documentVersionId: "version-malformed", sha256 });
    expect(malformed).toMatchObject({ outcome: "unavailable", evidence: { verdict: "unavailable", reason: "SIGNATURE_METADATA_UNAVAILABLE" } });
    const unavailable = await new ClamdScanner(storage, "sukoon-clamav:3310", { connectTimeoutMs: 50 }).scan({ storageKey: "safe/doc.pdf", contentType: "application/pdf", sizeBytes: bytes.byteLength, documentVersionId: "version-unavailable", sha256 });
    expect(unavailable).toMatchObject({ outcome: "unavailable", evidence: { verdict: "unavailable" } });
    expect(["SCANNER_TIMEOUT", "SCANNER_UNAVAILABLE"]).toContain(unavailable.evidence?.reason);
  });

  it("does not scan unsupported input or a hash-mismatched object", async () => {
    const endpoint = await fakeClamd("ClamAV 1.4.3/12345/Thu Sep 17 08:00:00 2026");
    const scanner = new ClamdScanner(storage, endpoint, { allowLoopbackForTest: true });
    expect(await scanner.scan({ storageKey: "safe/doc.pdf", contentType: "text/plain", sizeBytes: bytes.byteLength, documentVersionId: "version-unsupported", sha256 })).toMatchObject({ outcome: "unavailable", evidence: { reason: "UNSUPPORTED_SCAN_INPUT" } });
    expect(await scanner.scan({ storageKey: "../escape", contentType: "application/pdf", sizeBytes: bytes.byteLength, documentVersionId: "version-key", sha256 })).toMatchObject({ outcome: "unavailable", evidence: { reason: "UNSUPPORTED_SCAN_INPUT" } });
  });
});
