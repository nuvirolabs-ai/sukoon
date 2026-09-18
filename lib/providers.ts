import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { localStorageRoot } from "@/lib/server-store";
import { assertErasureReady, erasureObjectWrite } from "@/lib/erasure-gate";

export type AdapterEnvironment = "local" | "test" | "sandbox" | "remote" | "unconfigured";
export type ProviderOutcome = "available" | "sandbox" | "unavailable";

export type ProviderResult<T> =
  | { outcome: "available"; value: T }
  | { outcome: "sandbox"; value: T; note: string }
  | { outcome: "unavailable"; reason: string };

export type ObjectToStore = { storageKey: string; bytes: Uint8Array; contentType: string };
export type ParsedTextChunk = { page: number | null; text: string };
export type AiFieldProposal = { fieldName: string; value: string; sourcePage?: number; sourceChunk?: string; extractionMethod: "fixture_ai" | "remote_ai" };

export function validateAiExtractionResponse(value: unknown): AiFieldProposal[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { proposals?: unknown }).proposals)) throw new Error("AI_RESPONSE_INVALID");
  const proposals = (value as { proposals: unknown[] }).proposals;
  return proposals.map((proposal) => {
    if (!proposal || typeof proposal !== "object") throw new Error("AI_RESPONSE_INVALID");
    const item = proposal as Record<string, unknown>;
    if (typeof item.fieldName !== "string" || !item.fieldName.trim() || typeof item.value !== "string" || !item.value.trim() || (item.extractionMethod !== "fixture_ai" && item.extractionMethod !== "remote_ai")) throw new Error("AI_RESPONSE_INVALID");
    if (item.sourcePage !== undefined && (!Number.isInteger(item.sourcePage) || Number(item.sourcePage) < 1)) throw new Error("AI_RESPONSE_INVALID");
    return { fieldName: item.fieldName.trim(), value: item.value.trim(), sourcePage: item.sourcePage as number | undefined, sourceChunk: typeof item.sourceChunk === "string" ? item.sourceChunk.slice(0, 240) : undefined, extractionMethod: item.extractionMethod };
  });
}

export interface ObjectStoragePort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  put(object: ObjectToStore): Promise<ProviderResult<{ storageKey: string }>>;
  get(storageKey: string): Promise<ProviderResult<{ bytes: Uint8Array; contentType: string }>>;
  delete(storageKey: string): Promise<ProviderResult<{ storageKey: string }>>;
}

/** Explicit partial-staging adapter. It never writes local files or claims availability. */
export class UnavailableObjectStorageAdapter implements ObjectStoragePort {
  readonly id = "staging-document-storage-unavailable";
  readonly environment: AdapterEnvironment = "unconfigured";

  async put(): Promise<ProviderResult<{ storageKey: string }>> {
    return { outcome: "unavailable", reason: "DOCUMENT_STORAGE_DISABLED" };
  }

  async get(): Promise<ProviderResult<{ bytes: Uint8Array; contentType: string }>> {
    return { outcome: "unavailable", reason: "DOCUMENT_STORAGE_DISABLED" };
  }

  async delete(): Promise<ProviderResult<{ storageKey: string }>> {
    return { outcome: "unavailable", reason: "DOCUMENT_STORAGE_DISABLED" };
  }

  async probe() {
    return { ready: false as const, reason: "DOCUMENT_STORAGE_DISABLED" };
  }
}

export interface MalwareScanPort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  scan(input: ScanInput): Promise<ScanResult>;
}

export type ScanInput = { storageKey: string; contentType: string; sizeBytes: number; documentVersionId: string; sha256: string };
export type ScanEvidence = {
  implementation: string; engineVersion: string | null; signatureVersion: string | null;
  signatureDate: string | null; scannedAt: string; documentVersionId: string; sha256: string;
  verdict: "clean" | "rejected" | "unavailable"; reason: string | null;
};
export type ScanResult = ProviderResult<{ verdict: "clean" | "rejected" }> & { evidence?: ScanEvidence };

export interface TransactionalEmailPort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  send(input: { to: string; subject: string; text: string; idempotencyKey?: string }): Promise<ProviderResult<{ messageId: string }>>;
}

export interface PushNotificationPort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  send(input: { userId: string; title: string; body: string; idempotencyKey?: string }): Promise<ProviderResult<{ messageId: string }>>;
}

export interface OcrPort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  recognize(input: { storageKey: string; mimeType: string; pageLimit: number }): Promise<ProviderResult<{ text: string; chunks: ParsedTextChunk[]; pageCount?: number }>>;
}

export interface DocumentParsingPort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  parse(input: { storageKey: string; mimeType: string; pageLimit: number }): Promise<ProviderResult<{ text: string; chunks: ParsedTextChunk[]; pageCount?: number; parserVersion: string }>>;
}

export interface AiExtractionPort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  extract(input: { text: string; chunks: ParsedTextChunk[]; documentType: string }): Promise<ProviderResult<{ proposals: AiFieldProposal[]; providerResponse?: unknown }>>;
}

export interface ExternalConnectorPort {
  readonly id: string;
  readonly environment: AdapterEnvironment;
  fetch(input: { connector: string; subject: string }): Promise<ProviderResult<{ payload: unknown }>>;
}

function localObjectPath(storageKey: string) {
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(storageKey)) return null;
  const root = path.resolve(localStorageRoot());
  const target = path.resolve(root, storageKey);
  return target === root || target.startsWith(`${root}${path.sep}`) ? target : null;
}

/** Explicit local/test adapter. It is never valid as a production provider. */
export class LocalObjectStorageAdapter implements ObjectStoragePort {
  readonly id = "local-filesystem";
  readonly environment: AdapterEnvironment;

  constructor(environment: "local" | "test" = "local") {
    this.environment = environment;
  }

  async put(object: ObjectToStore): Promise<ProviderResult<{ storageKey: string }>> {
    return erasureObjectWrite(() => this.putLeased(object));
  }
  private async putLeased(object: ObjectToStore): Promise<ProviderResult<{ storageKey: string }>> {
    assertErasureReady();
    const target = localObjectPath(object.storageKey);
    if (!target) return { outcome: "unavailable", reason: "The local storage key is unsafe." };
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, object.bytes, { mode: 0o600 });
    try { assertErasureReady(); } catch (error) { await unlink(target).catch(() => undefined); throw error; }
    return { outcome: "available", value: { storageKey: object.storageKey } };
  }

  async get(storageKey: string): Promise<ProviderResult<{ bytes: Uint8Array; contentType: string }>> {
    assertErasureReady();
    const target = localObjectPath(storageKey);
    if (!target) return { outcome: "unavailable", reason: "The local storage key is unsafe." };
    try {
      const bytes = await readFile(target); assertErasureReady();
      return { outcome: "available", value: { bytes, contentType: "application/octet-stream" } };
    } catch {
      return { outcome: "unavailable", reason: "The local object was not found." };
    }
  }

  async delete(storageKey: string): Promise<ProviderResult<{ storageKey: string }>> {
    assertErasureReady();
    const target = localObjectPath(storageKey);
    if (!target) return { outcome: "unavailable", reason: "The local storage key is unsafe." };
    try { await unlink(target); } catch (error: unknown) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) return { outcome: "unavailable", reason: "The local object could not be removed." };
    }
    return { outcome: "available", value: { storageKey } };
  }
}

/** Signature validation is not malware scanning; this adapter stays unavailable. */
export class LocalUnavailableScanner implements MalwareScanPort {
  readonly id = "local-no-scanner";
  readonly environment: AdapterEnvironment;

  constructor(environment: "local" | "test" = "local") {
    this.environment = environment;
  }

  async scan(): Promise<ProviderResult<{ verdict: "clean" | "rejected" }>> {
    return { outcome: "unavailable", reason: "No malware scanner is configured for this local adapter." };
  }
}

/** Explicit partial-staging scanner. It never marks a document clean. */
export class UnavailableDocumentScanner implements MalwareScanPort {
  readonly id = "staging-document-scanning-unavailable";
  readonly environment: AdapterEnvironment = "unconfigured";

  async scan(): Promise<ScanResult> {
    return { outcome: "unavailable", reason: "DOCUMENT_SCANNING_DISABLED" };
  }

  async probe() {
    return { ready: false as const, reason: "DOCUMENT_SCANNING_DISABLED" };
  }
}

/** A sandbox capture is observable local test behavior, not external delivery. */
export class SandboxEmailAdapter implements TransactionalEmailPort {
  readonly id = "sandbox-mailbox";
  readonly environment: AdapterEnvironment = "sandbox";

  async send(_input: { to: string; subject: string; text: string; idempotencyKey?: string }): Promise<ProviderResult<{ messageId: string }>> {
    void _input;
    return { outcome: "sandbox", value: { messageId: "sandbox-captured" }, note: "Captured locally; no email was delivered." };
  }
}

/** Explicit partial-staging email adapter. It never claims delivery. */
export class UnavailableEmailAdapter implements TransactionalEmailPort {
  readonly id = "staging-email-unavailable";
  readonly environment: AdapterEnvironment = "unconfigured";

  async send(): Promise<ProviderResult<{ messageId: string }>> {
    return { outcome: "unavailable", reason: "EMAIL_DELIVERY_UNAVAILABLE" };
  }
}

export class UnavailablePushAdapter implements PushNotificationPort {
  readonly id = "unconfigured-push";
  readonly environment: AdapterEnvironment = "unconfigured";
  async send(_input: { userId: string; title: string; body: string; idempotencyKey?: string }): Promise<ProviderResult<{ messageId: string }>> { void _input; return { outcome: "unavailable", reason: "Push notification provider is not configured." }; }
}

/** No OCR binary/provider is configured in the local environment. */
export class UnavailableOcrAdapter implements OcrPort {
  readonly id = "unconfigured-ocr";
  readonly environment: AdapterEnvironment = "unconfigured";
  async recognize(): Promise<ProviderResult<{ text: string; chunks: ParsedTextChunk[]; pageCount?: number }>> { return { outcome: "unavailable", reason: "OCR provider is not configured." }; }
}

export class UnavailableDocumentParser implements DocumentParsingPort {
  readonly id = "unconfigured-document-parser";
  readonly environment: AdapterEnvironment = "unconfigured";
  async parse(): Promise<ProviderResult<{ text: string; chunks: ParsedTextChunk[]; pageCount?: number; parserVersion: string }>> { return { outcome: "unavailable", reason: "Document parsing provider is not configured." }; }
}

export class UnavailableAiExtraction implements AiExtractionPort {
  readonly id = "unconfigured-ai-extraction";
  readonly environment: AdapterEnvironment = "unconfigured";
  async extract(): Promise<ProviderResult<{ proposals: AiFieldProposal[]; providerResponse?: unknown }>> { return { outcome: "unavailable", reason: "AI extraction provider is not configured." }; }
}

export class UnavailableExternalConnector implements ExternalConnectorPort {
  readonly id = "unconfigured-external-connector";
  readonly environment: AdapterEnvironment = "unconfigured";
  async fetch(): Promise<ProviderResult<{ payload: unknown }>> { return { outcome: "unavailable", reason: "External connector is not configured." }; }
}

/** TEST ONLY. This adapter is opt-in and never bound by production configuration. */
export class TestMalwareScanner implements MalwareScanPort {
  readonly id = "test-only-malware-scanner";
  readonly environment: AdapterEnvironment = "test";

  constructor(private readonly result: ProviderResult<{ verdict: "clean" | "rejected" }>) {}

  async scan(): Promise<ProviderResult<{ verdict: "clean" | "rejected" }>> {
    return this.result;
  }
}

/** TEST ONLY. Deterministic proposals carry source chunks and no fabricated confidence. */
export class FixtureAiExtractionAdapter implements AiExtractionPort {
  readonly id = "test-only-fixture-ai";
  readonly environment: AdapterEnvironment = "test";

  async extract(input: { text: string; chunks: ParsedTextChunk[]; documentType: string }): Promise<ProviderResult<{ proposals: AiFieldProposal[]; providerResponse?: unknown }>> {
    const proposals: AiFieldProposal[] = [];
    const find = (fieldName: string, pattern: RegExp) => {
      const match = input.text.match(pattern);
      if (!match?.[1]) return;
      const value = match[1].trim();
      const source = input.chunks.find((chunk) => chunk.text.includes(value));
      proposals.push({ fieldName, value, sourcePage: source?.page ?? undefined, sourceChunk: source?.text.slice(0, 240), extractionMethod: "fixture_ai" });
    };
    find("ownerName", /owner\s*:\s*([^\n]+)/i);
    find("address", /address\s*:\s*([^\n]+)/i);
    find("identifier", /(?:survey|registration|parcel)\s*(?:no\.?|number)?\s*:\s*([^\n]+)/i);
    return { outcome: "sandbox", value: { proposals, providerResponse: { fixture: true, documentType: input.documentType } }, note: "Deterministic TEST ONLY fixture; no live AI provider was called." };
  }
}

export type ProviderCapability = "objectStorage" | "malwareScan" | "email" | "push" | "ocr" | "documentParsing" | "aiExtraction" | "externalConnector";

export type ProviderConfiguration = {
  production: boolean;
  staging: boolean;
  bindings: Record<ProviderCapability, AdapterEnvironment>;
  errors: string[];
};

function productionEnvironment(env: NodeJS.ProcessEnv) {
  return env.APP_ENV === "production" || (env.NODE_ENV === "production" && env.APP_ENV !== "staging");
}

function stagingEnvironment(env: NodeJS.ProcessEnv) {
  return env.APP_ENV === "staging" || env.SUKOON_RUNTIME_PROFILE === "STAGING";
}

function stagingConfigurationErrors(env: NodeJS.ProcessEnv, bindings: Record<ProviderCapability, AdapterEnvironment>) {
  const errors: string[] = [];
  const documentsUnavailable = env.SUKOON_DOCUMENTS_MODE === "unavailable";
  const emailUnavailable = env.SUKOON_EMAIL_MODE === "unavailable";
  if (env.SUKOON_RUNTIME_PROFILE !== "STAGING") errors.push("Staging requires SUKOON_RUNTIME_PROFILE=STAGING.");
  for (const capability of ["objectStorage", "malwareScan", "email"] as const) {
    if ((capability === "objectStorage" || capability === "malwareScan") && documentsUnavailable) {
      if (bindings[capability] === "remote") errors.push(`${capability} must remain unconfigured while hosted documents are unavailable.`);
      continue;
    }
    if (capability === "email" && emailUnavailable) {
      if (bindings[capability] === "remote") errors.push("email must remain unconfigured while staged email delivery is unavailable.");
      continue;
    }
    if (bindings[capability] !== "remote") errors.push(`${capability} requires a remote provider in staging, received ${bindings[capability]}.`);
  }
  const required = ["DATABASE_URL", "BETTER_AUTH_URL"] as const;
  for (const name of required) if (!env[name]) errors.push(`${name} is required for staging.`);
  if (!documentsUnavailable) {
    for (const name of ["SUKOON_STORAGE_ENDPOINT", "SUKOON_STORAGE_BUCKET", "SUKOON_STORAGE_ACCESS_KEY", "SUKOON_STORAGE_SECRET_KEY", "SUKOON_CLAMAV_ENDPOINT"] as const) if (!env[name]) errors.push(`${name} is required for staging.`);
  }
  if (!emailUnavailable) {
    for (const name of ["SUKOON_SMTP_HOST", "SUKOON_SMTP_PORT", "SUKOON_SMTP_TLS_MODE", "SUKOON_SMTP_USERNAME", "SUKOON_SMTP_PASSWORD", "SUKOON_EMAIL_FROM"] as const) if (!env[name]) errors.push(`${name} is required for staging.`);
  }
  if (env.BETTER_AUTH_URL) {
    try {
      const origin = new URL(env.BETTER_AUTH_URL);
      if (origin.protocol !== "https:") errors.push("Staging Better Auth origin must use HTTPS.");
      if (origin.hostname === "localhost" || origin.hostname === "127.0.0.1") errors.push("Staging Better Auth origin must not be local.");
    } catch { errors.push("Staging Better Auth origin is invalid."); }
  }
  if (env.DATABASE_URL) {
    try {
      const database = new URL(env.DATABASE_URL);
      const databaseName = decodeURIComponent(database.pathname.slice(1));
      if (database.protocol !== "postgresql:" && database.protocol !== "postgres:") errors.push("Staging DATABASE_URL must use PostgreSQL.");
      if (["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) errors.push("Staging DATABASE_URL must not point to localhost.");
      if (databaseName !== "sukoon_demo_staging") errors.push("Staging DATABASE_URL must target the dedicated sukoon_demo_staging database.");
    } catch { errors.push("Staging DATABASE_URL is invalid."); }
  }
  return errors;
}

export function providerConfiguration(env: NodeJS.ProcessEnv = process.env): ProviderConfiguration {
  const production = productionEnvironment(env);
  const staging = stagingEnvironment(env);
  const bindings: Record<ProviderCapability, AdapterEnvironment> = {
    objectStorage: (env.SUKOON_STORAGE_PROVIDER as AdapterEnvironment | undefined) ?? "local",
    malwareScan: !staging && env.SUKOON_LOCAL_SCANNER === "clamav" ? "local" : (env.SUKOON_SCANNER_PROVIDER as AdapterEnvironment | undefined) ?? "unconfigured",
    email: env.SUKOON_EMAIL_PROVIDER ? env.SUKOON_EMAIL_PROVIDER as AdapterEnvironment : env.SUKOON_AUTH_MAILBOX === "memory" ? "sandbox" : "unconfigured",
    push: (env.SUKOON_PUSH_PROVIDER as AdapterEnvironment | undefined) ?? "unconfigured",
    ocr: (env.SUKOON_OCR_PROVIDER as AdapterEnvironment | undefined) ?? "unconfigured",
    documentParsing: (env.SUKOON_PARSER_PROVIDER as AdapterEnvironment | undefined) ?? "unconfigured",
    aiExtraction: (env.SUKOON_AI_PROVIDER as AdapterEnvironment | undefined) ?? "unconfigured",
    externalConnector: (env.SUKOON_CONNECTOR_PROVIDER as AdapterEnvironment | undefined) ?? "unconfigured",
  };
  const errors = production
    ? Object.entries(bindings).filter(([, environment]) => environment !== "remote").map(([capability, environment]) => `${capability} requires a remote provider, received ${environment}.`)
    : staging ? stagingConfigurationErrors(env, bindings) : [];
  return { production, staging, bindings, errors };
}

export function assertProviderConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const configuration = providerConfiguration(env);
  if (configuration.errors.length) throw new Error(`Provider configuration unavailable: ${configuration.errors.join(" ")}`);
  return configuration;
}

export function redactedProviderHealth(env: NodeJS.ProcessEnv = process.env) {
  const configuration = providerConfiguration(env);
  const providers = Object.fromEntries(Object.entries(configuration.bindings).map(([capability, environment]) => [capability, {
    environment,
    status: environment === "remote" || (!configuration.production && environment === "local") || (!configuration.production && environment === "sandbox") ? "configured" : "unavailable",
  }]));
  const hasUnavailableCapability = Object.values(providers).some((provider) => provider.status === "unavailable");
  return { status: configuration.errors.length ? "unavailable" : hasUnavailableCapability ? "degraded" : "ready", production: configuration.production, providers, errors: configuration.errors.map((error) => error.replace(/(received ).+\.$/, "$1redacted.")) };
}
