import { describe, expect, it } from "vitest";
import { S3ObjectStorageAdapter, validatePrivateStorageEndpoint } from "@/lib/s3-object-storage";

describe("private S3-compatible staging storage", () => {
  it("accepts a private service endpoint and rejects public or local endpoints", () => {
    expect(validatePrivateStorageEndpoint("http://sukoon-storage:8333").hostname).toBe("sukoon-storage");
    expect(validatePrivateStorageEndpoint("sukoon-storage:8333").origin).toBe("http://sukoon-storage:8333");
    expect(() => validatePrivateStorageEndpoint("https://storage.example.com")).toThrow("STORAGE_ENDPOINT_NOT_PRIVATE");
    expect(() => validatePrivateStorageEndpoint("http://127.0.0.1:8333")).toThrow("STORAGE_ENDPOINT_NOT_PRIVATE");
    expect(() => validatePrivateStorageEndpoint("http://sukoon-storage:8333/path")).toThrow("STORAGE_ENDPOINT_INVALID");
  });

  it("uses server-side path-style requests and preserves exact bytes/content type", async () => {
    const calls: Array<{ name: string; input: Record<string, unknown> }> = [];
    const adapter = new S3ObjectStorageAdapter({
      endpoint: "http://sukoon-storage:8333",
      bucket: "sukoon-demo-staging",
      accessKeyId: "server-only-access",
      secretAccessKey: "server-only-secret",
      client: { send: async (command: { constructor: { name: string }; input: Record<string, unknown> }) => {
        calls.push({ name: command.constructor.name, input: command.input });
        if (command.constructor.name === "GetObjectCommand") return { Body: new Uint8Array([37, 80, 68, 70]), ContentType: "application/pdf" };
        return {};
      } },
    });
    expect(await adapter.put({ storageKey: "quarantine/documents/version.pdf", bytes: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" })).toEqual({ outcome: "available", value: { storageKey: "quarantine/documents/version.pdf" } });
    expect(await adapter.get("quarantine/documents/version.pdf")).toEqual({ outcome: "available", value: { bytes: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" } });
    expect(await adapter.delete("quarantine/documents/version.pdf")).toEqual({ outcome: "available", value: { storageKey: "quarantine/documents/version.pdf" } });
    expect(calls.map((call) => call.name)).toEqual(["PutObjectCommand", "GetObjectCommand", "DeleteObjectCommand"]);
    expect(calls[0].input).toMatchObject({ Bucket: "sukoon-demo-staging", Key: "quarantine/documents/version.pdf", ContentType: "application/pdf", ContentLength: 4 });
    expect(JSON.stringify(calls)).not.toContain("server-only-secret");
  });

  it("rejects unsafe keys before a request and maps transport failures to bounded unavailable results", async () => {
    let calls = 0;
    const adapter = new S3ObjectStorageAdapter({ endpoint: "http://sukoon-storage:8333", bucket: "sukoon-demo-staging", accessKeyId: "a", secretAccessKey: "b", client: { send: async () => { calls += 1; throw new Error("private transport detail"); } } });
    expect(await adapter.get("../escape")).toEqual({ outcome: "unavailable", reason: "STORAGE_KEY_UNSAFE" });
    expect(calls).toBe(0);
    expect(await adapter.put({ storageKey: "safe/doc.pdf", bytes: new Uint8Array([1]), contentType: "application/pdf" })).toEqual({ outcome: "unavailable", reason: "STORAGE_REMOTE_UNAVAILABLE" });
  });
});
