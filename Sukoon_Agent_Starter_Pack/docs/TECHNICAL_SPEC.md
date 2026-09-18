# SUKOON — Technical Implementation Specification

All implementation detail in this document is a proposed engineering default unless explicitly labelled SOURCE. Inspect existing code before adopting it. The PDF does not prescribe a stack, table schema, API shape or deployment provider.

## 1. Proposed greenfield stack

| Component | Default | Reason / boundary |
|---|---|---|
| Mobile | Expo + React Native + Expo Router + TypeScript | One native iOS/Android product; not a screenshot or WebView wrapper. |
| API | Node.js supported LTS, Express, TypeScript, schema validation | A single modular backend; business rules are not duplicated in clients. |
| Web | Next.js + TypeScript | Operator admin and small approved public/help pages. Consumer web parity is optional future scope. |
| Data | PostgreSQL + Prisma migrations | Persistent relational records, transactions, constraints and tenant isolation. |
| Authentication | Better Auth with its maintained Prisma and Expo integrations | Email OTP default; verify installed-version plugin support. Do not implement custom authentication. |
| Documents | Private S3-compatible object storage | Quarantine and clean namespaces; replaceable provider; no public ACL. |
| Background work | Separate Node worker + PostgreSQL-backed durable queue (pg-boss default) | Extraction, scans, reminders and exports survive process restarts without another queue server. |
| AI | Provider-neutral adapter with one explicitly approved provider | Structured extraction and scoped Q&A. Server-side secrets, consent, budgets and actual integration tests. |
| Tests | Domain/unit + real-Postgres integration + API + mobile flow + web E2E | Choose maintained compatible runners during S01, normally Vitest, Playwright and a mobile flow runner. |

Use one workspace manager and lockfile. Default npm workspaces; preserve an existing working alternative. Expo controls its compatible React/React Native versions; do not force the web app's React dependency onto mobile. Pin resolved versions and record them in an architecture decision. Re-check official documentation at implementation time, especially auth adapter imports and generated schemas.

These choices are not cloud purchasing instructions. No hosting plan, provider price or free-tier durability is assumed.

Official technical references checked for this pack:
- Expo project tooling: https://docs.expo.dev/more/create-expo/ — default template includes Router and TypeScript.
- Next.js installation: https://nextjs.org/docs/app/getting-started/installation — run lint separately from build.
- Better Auth mobile integration: https://better-auth.com/docs/integrations/expo — use maintained native integration and secure session storage.
- Better Auth Prisma integration: https://better-auth.com/docs/adapters/prisma — generate schema for the selected configuration; review migrations.
- Better Auth email OTP: https://better-auth.com/docs/plugins/email-otp — use the maintained plugin and a real mail delivery hook.
- Better Auth Express: https://better-auth.com/docs/integrations/express — use ESM, version-compatible route matching and correct middleware order.
- pg-boss: https://github.com/timgit/pg-boss — PostgreSQL-backed job processing. External effects still require application-level idempotency.

The links are integration references, not a frozen promise that today's package examples work unchanged with future versions.

## 2. Repository layout and scripts

Proposed structure:

```text
apps/
  mobile/             # Expo UI, native routing, access-aware client cache
  api/                # Express HTTP boundary, auth and application modules
  worker/             # persistent jobs and outbox consumers
  web/                # admin, help and approved educational pages
packages/
  contracts/          # validated requests, responses, public enums, generated API client
  domain/             # pure policy, ledger/date/health functions; no client secrets
  db/                 # Prisma schema, migrations, connection lifecycle
  providers/          # auth-email, storage, malware, AI, push, future connector ports
  config/             # validated server configuration and public capabilities
  design-tokens/      # shared colors, spacing, typography roles
  test-support/       # synthetic factories; never production seeds by default
scripts/              # doctor, migrate, verify, release preflight, seed dev
artifacts/            # local test evidence; redact and apply .gitignore where needed
docs/                 # pack specs and evolving decisions/status/runbooks
references/           # private development references; never web public assets
```

Implement and document these actual root commands in S01 rather than merely listing imaginary scripts: `dev`, `dev:mobile`, `dev:api`, `dev:worker`, `dev:web`, `lint`, `typecheck`, `test:unit`, `test:integration`, `test:e2e:web`, `test:e2e:mobile`, `build`, `db:migrate`, `db:seed:dev`, `doctor`, `verify`, `release:check`.

`verify` runs deterministic local gates; provider/device checks that need external resources are separate named checks with explicit NOT_RUN states. A skipped mobile test must not silently make the full release green. `db:seed:dev` refuses production; migrations never wipe a database to make tests pass.

Support native local PostgreSQL when available; Docker is optional, not assumed installed. Local auth mail/storage/AI doubles must be unmistakably development-only and refused by production configuration. Development endpoints must not be reachable in a production build.

### Authentication implementation guardrails

For the selected maintained email-OTP plugin, explicitly select hashed verification-code storage (or its maintained secure equivalent), bounded attempts and expiry; do not retain a plaintext default simply because an example uses it. Apply recipient/IP/device abuse controls and generic responses to reduce account enumeration. OTPs are never diagnostic log fields. Email identity changes require existing-account reauthentication and verification of the new address.

Mount the auth handler according to the installed Express/auth versions before incompatible body parsing; use explicit trusted web origins and native schemes. Development wildcard origins never enter production. Native requests use the maintained Expo auth transport; browser sessions use appropriate secure cookie/CSRF protections. Sensitive export, deletion and access-grant changes require recent authentication. Operator second-factor/passkey configuration must use maintained supported flows and be tested before production.

## 3. Model conventions

Server generates opaque IDs. Mutable rows include createdAt, updatedAt, version and creation actor; timestamps are UTC. Obligations also store date-only due dates and IANA timezone. Use integer paise for INR, explicit currency, and decimal storage for measurements. Return large monetary values safely without JS precision loss.

Property-owned tables include propertyId and workspaceId. Use composite keys/foreign keys or equivalent enforced validation to prevent cross-workspace parent-child relationships. Object keys are server-generated and bind to a document version, not a user-provided path. Record historical filenames only as sanitized display metadata.

A Property Passport is canonical **within its authorized application scope**. Do not globally merge records because an address matches. External identifiers are typed (municipal ID, parcel ID, registration number) with jurisdiction and source; ambiguous matches remain suggestions.

### Core models

| Model | Essential fields / constraints |
|---|---|
| User / Session / AuthAccount / Verification | Use auth-library schema. Add app profile and timezone preferences separately; do not fork crypto logic. |
| Workspace | id, ownerUserId, name, status. Personal owner workspace by default. |
| Property | workspaceId, displayName, type, country/state/city/locality/address, status ACTIVE/ARCHIVED, version. |
| PropertyArea | propertyId, areaType PLOT/CARPET/BUILT_UP/OTHER, decimal value, unit, sourceFactId. No silent area-type conversion. |
| OwnershipAssertion | propertyId, declared party name, optional linked user, claimed share, acquisition date, evidence reference, review status. Not an access grant. |
| PropertyIdentifier | propertyId, kind, jurisdiction, value, sourceFactId; no universal uniqueness of raw numbers. |
| EvidenceFact | propertyId, fieldPath, typed value, sourceType, sourceReference, sourceVersion, anchor/page, capturedAt, confirmationActor/time, supersedesId. |
| PropertyAccessGrant | propertyId, principalUserId, capabilities, allowed categories/documents/fields, expiry, revokedAt, grantorId. |
| Invitation | target identity, propertyId, proposed scope, hashed token, expiresAt, acceptedAt; token single-use and scope previewed. |
| Document | propertyId, category, sanitized name, currentVersionId, lifecycle state; metadata itself is access-controlled. |
| DocumentVersion | documentId, immutable object key, MIME, hash, size, page count, upload actor, scan status, extraction status; unique version number. |
| ExtractionRun | versionId, provider/model, schema version, processing consent ID, state, output proposal reference, error code, usage cost. |
| ExtractionProposal | runId, fieldPath, proposed value, source anchor, uncertainty flags, review action and actor. |
| Obligation | propertyId, category, direction PAYABLE/RECEIVABLE/NONFINANCIAL, optional expected amount, recurrence, timezone, account reference, status. |
| BillOccurrence | obligationId, unique cycleKey, dueDate, amountPaise/currency optional, sourceFactId, status/version. Amountless reminders cannot have a monetary paid state. |
| PaymentRecord | occurrenceId, amountPaise > 0, currency, paidAt, method, externalReference optional, receiptDocumentId, reporting actor; corrections via linked reversal. |
| ExpenseRecord | propertyId, category, date, amount, source/payment reference, maintenanceIssueId optional; unique linkage prevents double counting. |
| Reminder | propertyId, target occurrence/event, triggerAt, timezone, scheduleVersion, channel, status, deduplicationKey. |
| Notification | recipient, minimal safe text, related resource, readAt; no sensitive lock-screen content by default. |
| NotificationAttempt | notificationId, provider message ID, retry count, delivered/failed state, typed error. |
| MaintenanceIssue | propertyId, title/category, description, reportedAt, status, optional vendor/estimate, resolvedAt, version. |
| MaintenanceAttachment | issueId, documentVersionId, role INVOICE/WARRANTY/PHOTO/OTHER; matching property constraint. |
| PropertyEvent | propertyId, type, actorId, occurredAt, recordedAt, source references, correctionOf; safe payload only. |
| AuditEvent | actor/session, action, resource reference, correlationId, decision result, redacted metadata; restricted visibility. |
| ChecklistTemplate / Version | title, jurisdiction/type predicates, scope, validity, sources, reviewer, publication state. |
| ChecklistItem / Assessment | stable item ID, applicability/result/evidence, rationale, checkedAt, template version. |
| HealthSnapshot | propertyId, algorithm/template versions, assessedAt, counts, optional score, confidence/coverage wording, evidence references. |
| ContentArticle / Version | scope/jurisdiction, source list, content, review/publication/expiry states, authoredBy/reviewedBy. |
| ConsentRecord | user, purpose, policy/provider version, grantedAt, withdrawnAt; no pre-ticked AI consent. |
| AssistantSession / Answer | principal, property, authorized source IDs, citations, provider, usage, retention metadata; avoid unnecessary raw document storage. |
| ExportJob / Artifact | requester, allowed source versions, state, object key, expiresAt; reauthorize before fulfillment/download. |
| DataRequest | requester, type EXPORT/DELETE, scope, status, verification and retention resolution. |
| ProviderConnection | provider, enabled/capability state, environment, encrypted secret reference, last health result; never raw secrets in UI. |
| IdempotencyRecord / OutboxEvent | principal/action/resource/payload-hash key; durable event created atomically with mutation. |

Implement only models needed by an eligible Phase 1 task; the table is a design map, not a command to generate an enterprise schema before a working slice. Use join tables for scopes where they improve constraints/audit; avoid unsafe arbitrary JSON ACL logic.

Indexes start with access/filter patterns: workspaceId/propertyId, propertyId + createdAt, occurrence dueDate/status, documentId + version, grant principal/expiry and queue scheduling fields. Add uniqueness for bill cycle generation, payment-effect idempotency and notification deduplication.

## 4. Authorization and privacy

Central function: `authorize(principal, action, resource, context)` returns an allow decision and an explicit allowed field/resource scope. Every API, file preview/download, search query, job and assistant retrieval uses it.

Workspace ownership grants application administration, not legal ownership. A property-only delegate does not acquire workspace membership or access to other properties.

| Capability | Record administrator | Scoped family delegate | Scoped lawyer/CA | Operator |
|---|---|---|---|---|
| View property summary | Own scope | Granted fields | Granted fields | Operational metadata only |
| Read originals/extracted text | Own records | Explicit grant | Explicit documents/categories | No by default |
| Edit property/document facts | Yes | Explicit grant | Explicit grant, not default | No |
| Manage bills | Yes | Explicit grant | Finance scope only | No |
| Invite/revoke | Yes | Not by default | No | No |
| Ask assistant | Own sources | Only own grant scope | Only own grant scope | No private context |
| Export | Own sources | Explicit capability | Explicit capability | No |
| Publish help/legal content | No implicit role | No | No | Separate approved publisher role |
| Resolve job failure | N/A | N/A | N/A | Redacted diagnostic access |

Check authorization before returning whether another user's resource exists. List counts, document filenames, extracted owner names, thumbnails and search snippets also leak data; they must be filtered, not just detail endpoints.

Admin access requires strong authentication and a separate capability catalog. Private-record support access, if implemented later, needs explicit user authorization, expiry, purpose and audit. No universal support “view all documents” button.

Treat revoked grants as immediately invalid for new server requests. Direct object URLs, if used, must be short-lived and their residual lifetime documented; for delegated originals default to an authenticated download proxy so revocation gates every new request. Already downloaded content cannot be recalled. Do not promise otherwise.

## 5. API contract

Use `/v1` versioning. Auth endpoints follow the selected library's maintained contract, rather than custom replicas. All business responses use a consistent envelope and sanitized typed errors, e.g.:

```json
{"data":{},"meta":{"correlationId":"opaque-id","nextCursor":null}}
```

```json
{"error":{"code":"VERSION_CONFLICT","message":"This record changed. Refresh and try again.","correlationId":"opaque-id"}}
```

Generate request/response schemas and OpenAPI documentation from one contracts layer. Examples below are application endpoints to implement, not claims that the pack contains their code.

| Area | Endpoints and mandatory behavior |
|---|---|
| Session/config | `GET /me`, `GET /capabilities`; derive permissions and environment flags server-side. |
| Properties | `GET/POST /properties`; `GET/PATCH /properties/:id`; explicit archive/restore actions; field provenance and version checking. |
| Ownership facts | `GET/POST /properties/:id/ownership-assertions`; review/correction actions, separate from grants. |
| Upload | `POST /properties/:id/uploads` → authorized upload intent; `POST /uploads/:id/complete` validates actual object ownership/hash/size. |
| Documents | `GET /properties/:id/documents`; `GET /documents/:id`; `GET /documents/:id/versions/:version/content`; preview/reclassify/archive actions. |
| Extraction | `POST /documents/:id/extractions`; `GET /extractions/:id`; `POST /extractions/:id/review` with field-level decisions, evidence and expectedVersion. |
| Bills | `GET/POST /properties/:id/obligations`; occurrence routes; patch due/amount via explicit versioned correction. |
| Payments | `POST /bill-occurrences/:id/payment-records`; reverse action with reason and original-record reference; no payment-gateway success simulation. |
| Maintenance | `GET/POST /properties/:id/maintenance`; detail/update/transitions/attachments with matching-property checks. |
| Health/history | `GET /properties/:id/health`, `/checklist`, `/timeline`; calculations use authorized data and named template versions. |
| Sharing | `GET/POST /properties/:id/invitations`; authenticated accept; `GET /properties/:id/access`; revoke/expire actions. |
| Search | `GET /search?q=...&propertyId=...`; search only authorized properties, documents and approved guides; private index not public. |
| Assistant | `POST /properties/:id/assistant/messages`; citation/source routes reauthorize; cancel operation supported. |
| Export | `POST /properties/:id/exports`; status/download routes; scope preview and expiry. |
| Notifications | `GET /notifications`; read/snooze actions; token registration/removal and per-channel preferences. |
| Content | `GET /guides`; published-only detail; admin draft/review/publish/retire routes. |
| Privacy | consent history/grant/withdraw; authenticated export/delete requests; session/device revocation. |
| Operations | role-limited provider health, failed jobs, retry, quota metrics, audit lookup; no raw private payload display. |

Mutation idempotency: scope to principal + action + resource + idempotency key; store payload hash and result. A repeated key with a different payload returns conflict. A repeated successful payment-record request cannot create another ledger effect. Never trust client-calculated amounts, grant scopes or health values.

## 6. Upload and extraction state machines

Upload intent → UPLOADING → QUARANTINED → SCANNING → CLEAN or REJECTED/FAILED. Parsing/extraction only after CLEAN. Malware-scanner unavailability is not a clean scan. Failed/expired incomplete objects are eventually cleaned up.

Default allowed inputs: PDF, JPEG and PNG; configurable 25 MB/file and 200-page processing limit, both proposed pilot caps. Camera/photo selection converts supported device images safely or explains unsupported format; orientation must be handled. Do not accept arbitrary archives or active document formats by accident.

Require authorized upload, allowlisted extension and detected content signature, generated storage key, limits, private storage and pre-processing safety checks. These defenses reflect OWASP's defense-in-depth guidance: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html . Do not send private documents to public sample-sharing malware services.

Isolate parsers/scanners in bounded processes with memory/time/page limits. Password-protected or corrupted PDFs get clear recovery instructions; do not log document passwords. Native text parsing first; OCR only where text is absent/unusable. AI extraction and OCR are separately identifiable processing steps.

Extraction states: QUEUED → RUNNING → AWAITING_REVIEW → APPLIED/PARTIALLY_APPLIED/REJECTED, plus FAILED/CANCELED/CONSENT_REQUIRED. Validation failures retain the protected original and expose a manual path. No automatic mutation of confirmed ownership facts.

Content hash deduplication must not reveal that another workspace has the same file. Versions preserve their source. Check current permission/consent before sending to the provider and again before returning/store-applying private output. Cancellation/revocation cannot recall data already transmitted; explain provider retention and withdrawal semantics accurately.

## 7. Worker, outbox and scheduling

Commit domain changes and outbox messages in one database transaction. A dispatcher publishes durable jobs and marks progress idempotently. Jobs include references, not raw document contents or credentials.

Separate worker duties: object scan, parse/OCR, extraction, recurrence generation, reminders, email/push dispatch, export generation, expired-object cleanup, data deletion and provider health. Every job has retry/backoff caps, lease/heartbeat handling, safe diagnostics and a dead-letter path. No endless reprocessing of a corrupt upload.

Recurrence generation uses unique `(obligationId, cycleKey)`. Test 28/29/30/31-day boundaries and leap years. Due dates are date-only in the property's timezone; delivery time is a separate user preference. Reminder edits create a schedule version; workers reject stale versions. Recording full payment cancels obsolete upcoming reminders. A partial payment adjusts the message and balance.

Notification delivery is at-least-once tolerant: deduplicate per recipient/occurrence/schedule/channel. Use minimal push text by default. In-app reminders work without push permission; device tokens expire/remove safely. Email/push sending to real recipients is approval-gated.

## 8. AI interface and limits

Ports: `classifyDocument`, `extractDocumentFields`, `answerPropertyQuestion`; each accepts only the minimum permitted context and returns a validated typed response with source anchors/usage/error states. No model choice is hardcoded into the UI.

Use structured ledger queries for totals and due dates; do not ask an LLM to sum arbitrary OCR text. Start search/retrieval with PostgreSQL and explicit scopes; add vectors only after measured need, with the same permission filter before and after retrieval.

V1 assistant has no general database-write, payment, external-network browsing or file-sharing tool. Source text is untrusted data, not instructions. Citation anchors must resolve to an accessible source version. See CONTENT_AI_POLICY for behavior and evaluation gates.

Set per-user daily limits, document page limits, server concurrency, request timeout and a monetary budget circuit breaker. De-duplicate identical version extraction when consent/provider schema remains valid. No unlimited AI promise. Raw prompts/document content must not enter analytics or error trackers.

## 9. Environments and secret handling

Separate local, test, staging and production DBs, auth origins, buckets, keys and mobile build identifiers. A test runner must verify the DB name/environment before cleanup. Do not repurpose existing unrelated client databases.

Generate `.env.example` with empty placeholders and descriptions, not usable credentials. Suggested groups:
- app environment, API origin, admin origin, deep-link scheme;
- DATABASE_URL and separate TEST_DATABASE_URL;
- auth secret/trusted origins/email sandbox/provider settings;
- private object storage endpoint/region/bucket and server-only credentials;
- scanner endpoint and health limits;
- AI provider/model/secret, processing region/policy and spend caps;
- worker concurrency and schedule settings;
- push/email settings and sandbox allowlists;
- monitoring credentials and redaction settings.

Only intended public config may use client-exposed environment prefixes. The mobile app obtains a safe capability payload, not the server environment. No production fallback to localhost, demo provider or in-memory database.

## 10. Data retention, deletion and exports

Publish a policy approved by the owner before collecting real user data. Define retention separately for originals, extracted text, AI messages, provider logs, exports, audit metadata and backups; no invented statutory periods.

Withdraw consent → stop future provider processing, cancel queued jobs and offer management of prior derived data within stated policy. Delete request → verify identity and scope, handle shared/co-owner records explicitly, remove applicable originals/derivatives/index/cache/export artifacts, invalidate grants and preserve only justified minimal records. Backup restoration must reapply deletion tombstones so deleted data does not reappear.

Exports are temporary private objects. Reauthorize at generation and download, exclude removed records and expired grants, and include a source manifest without leaking hidden workspace identifiers. Do not attach unencrypted vault files to routine notification emails.

## 11. Deployment and evidence

Ship one modular backend + worker, not microservices. Web/API/worker may share a deployment environment for pilot if process management and isolation are documented. A long-running worker or equivalent reliable scheduling capability is required for production reminders.

Prepare provider-neutral deployment instructions with selected provider-specific configuration only after approval. Health endpoints distinguish liveness from readiness (DB, storage, queue and provider capabilities). Monitor job lag, errors, storage growth, auth failures, mail failures and AI spend. Log correlation IDs, not secrets or raw private documents.

Proposed pilot objectives, not measured promises: core reads p95 < 800 ms at 50 concurrent synthetic users; non-provider mutations p95 < 1.5 s; provider tasks asynchronous; no unbounded queue growth. Run a 30-minute staging load characterization, record dataset, compute resources, measurement method and failures. Any unmet objective requires an explicit release decision. A future 100,000 registered-user goal is not the same as 100,000 concurrent users.

Proposed recovery objectives for owner approval: database RPO ≤ 24 hours, RTO ≤ 8 hours. Test a restore of DB plus document references/objects and replay deletion policy; record actual achieved results, not just configured backups.

Deliver source, environment/runbook documentation, schema/migration history, signed build artifacts, deployment version, provider/credential ownership handover, test evidence and remaining limitations. No “production ready” statement until the release checklist is completed.
