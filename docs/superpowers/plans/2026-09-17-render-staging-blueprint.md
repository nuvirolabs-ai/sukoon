# Render Client-Demo Staging Implementation Plan

> **Execution note:** Follow the test-first rule for runtime behavior. Keep the current dirty product source and review artifacts separate; never use a blanket `git add .`.

**Goal:** Prepare the current Sukoon checkout for an isolated, Singapore-only Render client-demo staging environment while preserving local behavior, security boundaries, and the existing review projects.

**Stop conditions:** Do not create a Render project, paid service, database, disk, DNS record, SMTP account, or external deployment. Stop at the owner cost approval, Render account authorization, external SMTP credentials/domain verification, or DNS action. The current repository has no configured Git remote, so remote-branch verification/push is an owner action after the local audited branch is ready.

**Architecture:** Keep the existing Next.js web/API and PostgreSQL-backed durable queue. Add environment-scoped adapters behind `ObjectStoragePort`, `MalwareScanPort`, and `TransactionalEmailPort`: local/test adapters remain unchanged; staging uses private SeaweedFS S3, private ClamAV TCP, and owner-supplied SMTP. The web service alone runs Prisma `migrate deploy` in `preDeployCommand`; the staging worker checks migration parity and heartbeat readiness before consuming jobs. Render resources are `sukoon-web`, `sukoon-worker`, `sukoon-db`, `sukoon-storage`, and `sukoon-clamav`, all in Singapore, with project/environment isolation and protection enabled where the plan supports them.

## 1. Preserve provenance and make the staging branch auditable

**Files:** `.gitignore`, `lib/staging-repository-policy.ts`, `scripts/audit-staging-repository.mjs`, `tests/unit/staging-repository-policy.test.ts`, `docs/STAGING_DEMO_RUNBOOK.md`, `docs/OWNER_ACTIONS.md`.

1. Add a failing unit test for path/content policy. The policy must reject `.env` secrets, `.data`, databases, scanner signature directories, private documents, EICAR fixtures, `output`, `artifacts`, `tmp`, Android build/JDK output, generated archives, and temporary acceptance captures while allowing checked-in source, safe templates, migrations, reviewed docs and test code.
2. Implement a pure repository-audit policy that reports only sanitized paths/reasons and a CLI that exits non-zero for forbidden candidates. It must accept an explicit repository root and never print file contents or secret values.
3. Add only the new local artifact roots to `.gitignore`; do not delete or move any existing artifacts. Keep `.env.example` and `.env.android.local.example` trackable.
4. Run the audit against the current tree, inspect the result, and stage only the audited application/configuration/docs/tests needed for the staging branch. Leave private and temporary paths untracked/ignored.
5. Commit the design amendment and audited source on `codex/sukoon-render-demo-staging`. Record that no Git remote is configured, so a clean remote staging branch cannot yet be verified or pushed. Do not claim Render can consume this branch until the owner connects the authorized remote and pushes it.

**Verification:** `npm run test:unit -- tests/unit/staging-repository-policy.test.ts`, `node scripts/audit-staging-repository.mjs`, `git diff --check`, `git status --short`, and a file-list review of the exact staged paths. No secret values appear in output.

## 2. Add a staging-only provider configuration contract

**Files:** `lib/providers.ts`, `lib/document-processing.ts`, `lib/auth.ts`, `lib/auth-mailbox.ts`, `lib/trusted-origins.ts`, `lib/staging-runtime.ts`, `tests/unit/staging-provider-config.test.ts`.

1. Add failing tests proving that `APP_ENV=staging` requires remote storage, remote scanner, remote SMTP configuration, an HTTPS canonical origin, and a non-local database; optional OCR/AI/push/payment/government providers may remain unavailable.
2. Add tests proving local/test behavior remains unchanged, production remains fail-closed for missing required providers, and hosted origins reject HTTP, wildcard, localhost and unrelated domains.
3. Implement a typed staging configuration reader with redacted diagnostics. It must validate endpoint shape, required secret presence without exposing values, provider mode, canonical origin and staging profile identity.
4. Update dependency factories so only staging selects the remote adapters. Keep `localDocumentProcessingDependencies()` and the sandbox mailbox contract intact for local/test acceptance. Do not change authorization or document state transitions.
5. Make Better Auth allow the OTP route only when the staging SMTP contract is complete; otherwise return the existing fail-closed configuration response. Never fall back to the local mailbox in staging.

**Verification:** focused provider/auth/origin unit tests, `npm run typecheck`, and existing local auth/document-processing tests.

## 3. Implement private SeaweedFS S3 storage behind `ObjectStoragePort`

**Files:** `lib/s3-object-storage.ts`, `lib/document-processing.ts`, `tests/unit/s3-object-storage.test.ts`, `package.json`, `package-lock.json`, `infra/seaweedfs/Dockerfile`, `infra/seaweedfs/entrypoint.sh`.

1. Add failing adapter tests using an injected fake S3 request handler. Cover private endpoint validation, path-containment keys, exact content type/length, bounded transport failures, and the existing `put/get/delete` result shape. Prove no browser URL or credential is returned.
2. Add the AWS S3 client dependency needed for an S3-compatible endpoint. Implement `S3ObjectStorageAdapter` with path-style requests, server-only credentials, bounded timeouts, and safe error mapping. Reject public endpoints and unsafe object keys before network I/O.
3. Preserve the current quarantine/release key conventions and never write the web/worker filesystem for staging documents. Keep local storage untouched.
4. Add the SeaweedFS community image wrapper using the explicit implementation decision: `chrislusf/seaweedfs:4.47`, source `https://github.com/seaweedfs/seaweedfs`, Apache-2.0. Generate the private S3 config from runtime secrets in the container entrypoint, bind port 8333 only on the private service network, mount `/data`, and do not expose a console/public bucket.
5. Record the single-node limitations: one service/disk, no HA/replication/erasure redundancy, backup/restore required, staging/demo only, and never production storage.

**Verification:** adapter tests, typecheck, image-file shell validation, and a static check that no public URL, `latest` tag, or committed credential exists.

## 4. Implement private-network ClamAV scanning with exact evidence

**Files:** `lib/clamd-scanner.ts`, `lib/clamav-scanner.ts`, `lib/document-processing.ts`, `tests/unit/clamd-scanner.test.ts`, `infra/clamav/README.md`.

1. Add failing protocol tests with an in-process fake TCP server for `VERSION`, `INSTREAM`, `stream: OK`, `FOUND`, malformed responses, connection refusal, timeout, stale/missing signature metadata and size-limit outcomes.
2. Implement a bounded `ClamdScanner` using `net`, `shell:false`-equivalent direct socket I/O, 8 KiB protocol chunks, connect/scan timeouts, and strict response parsing. Bind evidence to the supplied document version and SHA-256 and return `clean`, `rejected`, or `unavailable` only from the daemon result and verified signature policy.
3. Keep the existing local `ClamAvScanner` behavior unchanged. The staging factory must require a private ClamAV endpoint and must never publish a scanner URL. Do not add application-level scanner authentication in this slice; document that private-network restriction is the boundary.
4. Add the official ClamAV service description using the exact current official stable image tag and its immutable digest recorded in `infra/clamav/Dockerfile`, with persistent `/var/lib/clamav` signature storage. Configure loopback/private binding only and document signature refresh, stale-db fail-closed policy, restart and removal. Resolve and record the tag/digest before the Blueprint is handed to the owner; never use `latest`.

**Verification:** focused scanner tests, existing malware/document-processing tests, and a static service-config review proving no public ClamAV service or public endpoint.

## 5. Add owner-supplied SMTP for staging without weakening local auth

**Files:** `lib/smtp-mailbox.ts`, `lib/auth-mailbox.ts`, `lib/auth.ts`, `tests/unit/smtp-mailbox.test.ts`, `docs/STAGING_DEMO_RUNBOOK.md`.

1. Add failing tests for TLS/port validation, sender validation, redacted errors, no OTP logging, and a fake transport that receives one idempotent verification message without writing to the local sandbox mailbox.
2. Implement the generic SMTP adapter behind the existing transactional email contract. Read host/port/TLS/user/password/from from staging-only environment variables, keep provider payloads and OTPs out of logs, and return bounded delivery failures.
3. Preserve the local in-memory mailbox and all local/test OTP behavior. Staging must fail closed if SMTP is incomplete; there is no fallback to a fixture, sandbox mailbox or real external delivery before credentials are supplied.
4. Document the separate SMTP DNS requirements: sender/domain verification plus provider-specific DKIM/SPF records, in addition to the application DNS record.

**Verification:** focused SMTP/auth tests, local OTP regression tests, lint and typecheck.

## 6. Make the durable worker migration-safe and observable

**Files:** `lib/worker-readiness.ts`, `lib/worker-heartbeat.ts`, `scripts/run-staging-worker.ts`, `prisma/schema.prisma`, `prisma/migrations/20260917090000_staging_worker_heartbeat/migration.sql`, `tests/unit/worker-readiness.test.ts`, `tests/integration/staging-worker-readiness.test.ts`, `app/api/health/ready/route.ts`.

1. Add failing tests showing the worker refuses to claim jobs when the database is unavailable, Prisma migration parity is incomplete, provider configuration is incomplete, or the environment is local/test. Add a passing case where the schema is current and the worker can start.
2. Implement a pre-consumption readiness check that calls `prisma migrate status` or an equivalent migration-parity check without applying migrations. The worker exits non-zero on failure and only then enters the existing reminder/document/export loop.
3. Add a minimal `WorkerHeartbeat` record because liveness cannot be inferred reliably from an idle queue. Update it on start, periodic heartbeat and clean shutdown; do not include document data or secrets.
4. Add `worker:staging` with explicit `APP_ENV=staging`, production-safe checks, graceful shutdown and the existing durable queue implementation. Keep `worker:local` unchanged.
5. Add authenticated redacted readiness at `/api/health/ready`; keep anonymous `/api/health` as process liveness. Report database/migration, storage probe, scanner metadata freshness, worker heartbeat and optional-provider availability without returning credentials, document keys or raw provider responses.

**Verification:** focused readiness tests, isolated integration test with a disposable database, existing worker/document/reminder/export tests, lint/typecheck/build.

## 7. Add a guarded staging synthetic seed

**Files:** `scripts/demo-dataset.ts`, `scripts/demo-dataset-staging.ts`, `tests/unit/staging-seed-guard.test.ts`, `package.json`, `docs/STAGING_DEMO_RUNBOOK.md`.

1. Add failing tests for every guard: exact staging profile, production Node mode, dedicated database name, explicit confirmation, private remote storage, no `.data`, no sandbox mailbox, and rejection of local/test/production targets.
2. Implement `demo:seed:staging` as an explicit, idempotent command that recreates only the approved synthetic demo-owner records and queues document work for the real staging worker. It must never copy `.data`, local sessions, private review accounts, EICAR fixtures, scanner databases or local storage objects.
3. Keep the existing local `demo:seed` behavior and fixture boundaries unchanged. Do not write scan verdicts or fake review metadata as a shortcut; synthetic document bytes go through quarantine, real ClamAV and normal manual review.

**Verification:** guard unit tests, dry-run with every invalid environment, isolated seed integration test, and existing demo-data tests.

## 8. Add the Singapore Render Blueprint and operational runbook

**Files:** `render.yaml`, `docs/STAGING_DEMO_RUNBOOK.md`, `docs/OWNER_ACTIONS.md`, `Sukoon_Agent_Starter_Pack/docs/STATUS.md`, `Sukoon_Agent_Starter_Pack/SUKOON_MASTER_PLAN.md`.

1. Add a static Blueprint defining a new Sukoon demo-staging project/environment and only the five resources. Set every resource to Singapore, use paid plans, attach disks only to SeaweedFS and ClamAV, wire private service/database references, and set web health to `/api/health`.
2. Set web `preDeployCommand` to `npm run db:migrate:deploy`; set worker start to `npm run worker:staging`; do not make the worker a migration owner. Disable preview-environment provisioning. Keep the first Blueprint free of the custom domain so generated-hostname infrastructure checks happen first.
3. Use explicit staging-only names and secrets. Use `sync:false` for owner-supplied SMTP values, generated secrets for internal service credentials, and private service host/port references for storage and ClamAV. Do not add production resources, public storage, public scanner endpoints, local accounts or private files.
4. Document the second phase: add `demo.sukoon.nuvirolabs.com` only after generated-host health passes, add the exact Render-provided application DNS record, verify HTTPS and Better Auth, then set the custom domain as canonical and disable the Render subdomain. List any SMTP verification/DKIM/SPF records separately.
5. Add the compact pre-apply cost table with current estimates: web $7/mo, worker $7/mo, SeaweedFS $7/mo + 10GB disk $2.50/mo, ClamAV $25/mo + 5GB disk $1.25/mo, Render Postgres $19/mo + 15GB storage estimate $4.50/mo, for an estimated $73.25/mo before workspace, bandwidth, build-minute, custom-domain and SMTP charges. State that Dashboard pricing is authoritative and no billable apply occurs without explicit approval.
6. Document startup, shutdown, rollback, backup/restore, scanner signature refresh, worker restart, health checks, generated-host validation and custom-domain cutover. Record current blockers: no Git remote, Render authorization, cost approval, SMTP credentials/domain verification and DNS.
7. Update the canonical status/remaining-work register without marking staging deployed or client-ready. Preserve S00-S30 evidence and the saved review project references.

**Verification:** parse the YAML with an available YAML parser or Render CLI if already installed; otherwise run a structural static check that confirms exactly five resources, five Singapore regions, no free/expiring database plan, no custom domain in the first apply, and no forbidden private paths/secrets. Run `npm run lint`, `npm run typecheck`, focused unit/integration tests, `npm run build`, and finally `npm run verify`.

## 9. Handoff at the external-approval boundary

Before any external action, show the owner:

| Resource | Render plan | Region | Disk | Estimated monthly cost | Public/private | Why required |
|---|---|---|---:|---:|---|---|
| `sukoon-web` | paid `0.5c-512mb` | Singapore | none | $7 | HTTPS web; generated hostname first | Next.js UI/API and health endpoint |
| `sukoon-worker` | paid `0.5c-512mb` | Singapore | none | $7 | private process | durable reminders, document jobs and exports |
| `sukoon-db` | paid `0.5c-1g` | Singapore | 15GB | $23.50 est. | private connection | dedicated non-expiring staging PostgreSQL |
| `sukoon-storage` | paid private `0.5c-512mb` | Singapore | 10GB | $9.50 | private service | SeaweedFS S3-compatible private documents |
| `sukoon-clamav` | paid private `1c-2g` | Singapore | 5GB | $26.25 | private service | official signature-backed malware scanning |
| **Estimated total** |  |  |  | **$73.25/mo** |  | before workspace, bandwidth, build, custom-domain and SMTP charges |

Then stop and request explicit cost approval plus the exact owner action needed. Do not click Deploy Blueprint, provision billable infrastructure, add DNS, configure external SMTP, or claim remote acceptance until those gates are completed and separately evidenced.
