import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { isIP } from "node:net";
import { randomUUID } from "node:crypto";
import { assertErasureReady, erasureObjectWrite } from "@/lib/erasure-gate";
import type { AdapterEnvironment, ObjectStoragePort, ObjectToStore, ProviderResult } from "@/lib/providers";

type S3Command = { input: Record<string, unknown> };
export type S3CompatibleClient = { send(command: S3Command): Promise<unknown> };

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split(".").map(Number);
  return octets.length === 4 && (octets[0] === 10 || octets[0] === 127 || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168));
}

export function validatePrivateStorageEndpoint(raw: string) {
  let endpoint: URL;
  try { endpoint = new URL(raw.includes("://") ? raw : `http://${raw}`); } catch { throw new Error("STORAGE_ENDPOINT_INVALID"); }
  if (!(["http:", "https:"].includes(endpoint.protocol)) || endpoint.username || endpoint.password || endpoint.pathname !== "/" || endpoint.search || endpoint.hash || !endpoint.hostname) throw new Error("STORAGE_ENDPOINT_INVALID");
  const addressType = isIP(endpoint.hostname);
  const privateHost = addressType === 4 ? isPrivateIpv4(endpoint.hostname) : addressType === 6 ? endpoint.hostname.startsWith("fd") || endpoint.hostname.startsWith("fe8") : endpoint.hostname === "localhost" || endpoint.hostname.endsWith(".internal") || endpoint.hostname.endsWith(".local") || !endpoint.hostname.includes(".");
  if (!privateHost || endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1") throw new Error("STORAGE_ENDPOINT_NOT_PRIVATE");
  return endpoint;
}

function safeStorageKey(storageKey: string) {
  return /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(storageKey) && !storageKey.split("/").includes("..");
}

async function bodyBytes(body: unknown): Promise<Uint8Array | null> {
  if (body instanceof Uint8Array) return body;
  if (typeof body === "string") return new TextEncoder().encode(body);
  if (body && typeof body === "object" && "transformToByteArray" in body && typeof body.transformToByteArray === "function") {
    const bytes = await body.transformToByteArray();
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  }
  if (body && typeof body === "object" && Symbol.asyncIterator in body) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array | string>) chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk);
    const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
    return result;
  }
  return null;
}

function unavailable(reason: string): ProviderResult<never> {
  return { outcome: "unavailable", reason };
}

export class S3ObjectStorageAdapter implements ObjectStoragePort {
  readonly id = "seaweedfs-s3";
  readonly environment: AdapterEnvironment = "remote";
  private readonly bucket: string;
  private readonly client: S3CompatibleClient;

  constructor(options: { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string; region?: string; client?: S3CompatibleClient }) {
    const endpoint = validatePrivateStorageEndpoint(options.endpoint);
    if (!/^[a-z0-9][a-z0-9.-]{2,62}$/.test(options.bucket) || !options.accessKeyId || !options.secretAccessKey) throw new Error("STORAGE_CONFIGURATION_INCOMPLETE");
    this.bucket = options.bucket;
    this.client = options.client ?? (new S3Client({ endpoint: endpoint.origin, region: options.region ?? "us-east-1", forcePathStyle: true, credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey } }) as unknown as S3CompatibleClient);
  }

  async put(object: ObjectToStore): Promise<ProviderResult<{ storageKey: string }>> {
    return erasureObjectWrite(async () => {
      assertErasureReady();
      if (!safeStorageKey(object.storageKey)) return unavailable("STORAGE_KEY_UNSAFE");
      try {
        await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: object.storageKey, Body: Buffer.from(object.bytes), ContentType: object.contentType, ContentLength: object.bytes.byteLength }) as unknown as S3Command);
      } catch { return unavailable("STORAGE_REMOTE_UNAVAILABLE"); }
      assertErasureReady();
      return { outcome: "available", value: { storageKey: object.storageKey } };
    });
  }

  async get(storageKey: string): Promise<ProviderResult<{ bytes: Uint8Array; contentType: string }>> {
    assertErasureReady();
    if (!safeStorageKey(storageKey)) return unavailable("STORAGE_KEY_UNSAFE");
    let response: unknown;
    try { response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }) as unknown as S3Command); } catch { return unavailable("STORAGE_REMOTE_UNAVAILABLE"); }
    const output = response as { Body?: unknown; ContentType?: string };
    const bytes = await bodyBytes(output.Body).catch(() => null);
    if (!bytes) return unavailable("STORAGE_RESPONSE_INVALID");
    assertErasureReady();
    return { outcome: "available", value: { bytes, contentType: output.ContentType || "application/octet-stream" } };
  }

  async delete(storageKey: string): Promise<ProviderResult<{ storageKey: string }>> {
    assertErasureReady();
    if (!safeStorageKey(storageKey)) return unavailable("STORAGE_KEY_UNSAFE");
    try { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }) as unknown as S3Command); } catch { return unavailable("STORAGE_REMOTE_UNAVAILABLE"); }
    assertErasureReady();
    return { outcome: "available", value: { storageKey } };
  }

  async probe() {
    const key = `health/probe-${randomUUID()}.bin`;
    const put = await this.put({ storageKey: key, bytes: new Uint8Array([115, 117, 107, 111, 111, 110]), contentType: "application/octet-stream" });
    if (put.outcome !== "available") return { ready: false as const, reason: put.outcome === "unavailable" ? put.reason : "STORAGE_PROBE_UNAVAILABLE" };
    const read = await this.get(key);
    const deleted = await this.delete(key);
    if (read.outcome !== "available" || read.value.bytes.length !== 6 || deleted.outcome !== "available") return { ready: false as const, reason: "STORAGE_PROBE_FAILED" };
    return { ready: true as const };
  }
}
