import { describe, expect, it } from "vitest";
import { classifyClamOutput, ClamAvScanner, signatureSnapshot } from "@/lib/clamav-scanner";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { LocalObjectStorageAdapter } from "@/lib/providers";

// Protocol fixtures, NOT proof of running ClamAV or scanned browser bytes.
describe("ClamAV protocol fail-closed policy (mock output)", () => {
  const clean = "stdin: OK\nKnown viruses: 1234\nScanned files: 1\nInfected files: 0\n";
  it("requires positive per-stream and summary evidence", () => {
    expect(classifyClamOutput({ code: 0, output: clean }).verdict).toBe("clean");
  });
  it.each([
    { code: 0, output: "" },
    { code: 0, output: "stdin: OK" },
    { code: 0, output: clean.replace("Scanned files: 1", "Scanned files: 0") },
    { code: 0, output: clean.replace("Known viruses: 1234", "Known viruses: 0") },
    { code: 0, output: clean + "WARNING: skipped content" },
    { code: 2, output: clean },
    { code: 1, output: "stdin: Heuristics.Encrypted.PDF FOUND" },
    { code: 1, output: "stdin: Heuristics.Limits.Exceeded.MaxScanSize FOUND" },
    { code: null, output: clean, failed: "SCANNER_TIMEOUT" },
    { code: null, output: clean, failed: "SCANNER_UNAVAILABLE" },
  ])("does not release incomplete result %j", result => {
    expect(classifyClamOutput(result).verdict).toBe("unavailable");
  });
  it("recognizes explicit detection (protocol fixture only)", () => {
    expect(classifyClamOutput({ code: 1, output: "stdin: Win.Test.EICAR_HDB-1 FOUND\n" })).toEqual({ verdict: "rejected", reason: "THREAT_DETECTED" });
  });
  it("rejects missing source and records exact version/hash without invoking a process", async () => {
    const scanner = new ClamAvScanner(new LocalObjectStorageAdapter("test"), "/missing/clamscan", "/missing/signatures", async () => { throw new Error("must not run"); });
    const input = { storageKey: "../escape", contentType: "application/pdf", sizeBytes: 8, documentVersionId: "synthetic-version", sha256: "a".repeat(64) };
    expect(await scanner.scan(input)).toMatchObject({ outcome: "unavailable", evidence: { documentVersionId: input.documentVersionId, sha256: input.sha256, verdict: "unavailable", reason: "SCAN_OBJECT_UNAVAILABLE" } });
  });
  it.each([0, -73 * 3600, 3600])("enforces daily signature timestamp policy, delta %i seconds (header fixture only)", async delta => {
    const directory = await mkdtemp(path.join(tmpdir(), "sukoon-test-signatures-"));
    const now = 1_800_000_000_000;
    try {
      const date = new Date(now + delta * 1000).toISOString();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const headerDate = `${date.slice(8, 10)} ${months[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)} ${date.slice(11, 13)}-${date.slice(14, 16)} +0000`;
      for (const name of ["main", "daily", "bytecode"]) await writeFile(path.join(directory, `${name}.cvd`), `ClamAV-VDB:${headerDate}:123:10:90:hash:signature`.padEnd(512));
      if (delta === 0) expect((await signatureSnapshot(directory, now)).version).toContain("daily.cvd:123");
      else await expect(signatureSnapshot(directory, now)).rejects.toThrow("SIGNATURE_DATABASE_STALE_OR_FUTURE");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("rejects absent signature databases", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "sukoon-test-empty-signatures-"));
    try { await expect(signatureSnapshot(directory)).rejects.toThrow("SIGNATURE_DATABASE_MISSING_OR_AMBIGUOUS"); }
    finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("does not invoke scanner for a content hash mismatch", async () => {
    const storage = new LocalObjectStorageAdapter("test");
    storage.get = async () => ({ outcome: "available", value: { bytes: Buffer.from("%PDF-1.4"), contentType: "application/pdf" } });
    const scanner = new ClamAvScanner(storage, "/unused/clamscan", "/unused/signatures", async () => { throw new Error("must not invoke scanner"); });
    expect(await scanner.scan({ storageKey: "synthetic/file.pdf", contentType: "application/pdf", sizeBytes: 8, sha256: "a".repeat(64), documentVersionId: "test-v2" })).toMatchObject({ outcome: "unavailable", evidence: { reason: "SCAN_HASH_MISMATCH", documentVersionId: "test-v2" } });
  });
});
