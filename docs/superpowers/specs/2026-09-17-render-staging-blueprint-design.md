# Render Staging Blueprint Design

**Date:** 2026-09-17
**Status:** Design approved in chat; implementation review pending
**Scope:** Isolated Sukoon client-demo staging on Render; no production release

## Goal

Prepare a Render Blueprint and the smallest compatible provider/runtime changes needed for an isolated HTTPS Sukoon demo that can be created from the Render Dashboard with one Blueprint sync, one secret-entry step, one application DNS record plus any required email-verification records, and one explicit synthetic-seed action.

The result is a client-demo staging environment, not production readiness. Local development, the existing local review accounts/data, the saved review projects, and the Company OS process remain untouched.

## Current repository finding

The current runtime is deliberately local-first and cannot be deployed safely by adding only a YAML file:

- `localDocumentProcessingDependencies()` always constructs local filesystem storage and only selects the existing ClamAV adapter for the local environment.
- Better Auth's OTP hook accepts only the local/test sandbox mailbox.
- `scripts/run-local-worker.ts` rejects every database that is not an isolated localhost `sukoon_s02_local_*` database.
- The current provider validator treats every provider capability as mandatory in a production Node runtime, even though OCR, live AI, push, payment, government and other external capabilities remain intentionally unavailable.
- `demo:seed` is fenced to the approved local database and `.data` root; a staging-specific fence does not yet exist.

Any staging implementation must correct these specific environment/provider boundaries without changing authorization, document access rules, malware fail-closed behavior, or the local adapter behavior used by the existing test suite.

## Recommended topology

Render should contain one new project/environment dedicated to Sukoon DEMO/STAGING. All five resources use the Singapore region, subject to Render offering the selected plan there. The project/environment uses `networking.isolation: enabled` and `permissions.protection: enabled` where the selected Render workspace plan supports those controls.

```text
Browser / Android staging APK
             |
        HTTPS custom domain
             |
      sukoon-web (Next.js)
          |       |
          |       +-- private network --> sukoon-storage (S3-compatible)
          |                                persistent disk
          |
          +-- private network --> sukoon-db (Render PostgreSQL)

      sukoon-worker (durable queue)
          |       |
          +-------+-- private network --> sukoon-storage
          |
          +-- private network --> sukoon-clamav (ClamAV daemon)
                                             official signatures disk
```

### Render resources

| Resource | Render type | Public? | Purpose |
|---|---|---:|---|
| `sukoon-web` | `web`, Node runtime | HTTPS only | Next.js UI and API |
| `sukoon-worker` | `worker`, Node runtime | No | Existing durable reminders, document stages and exports |
| `sukoon-db` | Render PostgreSQL | Private connection only | New staging database; no local/production reuse |
| `sukoon-storage` | `pserv`, Docker runtime | No | Private SeaweedFS S3 API with one persistent disk |
| `sukoon-clamav` | `pserv`, Docker runtime | No | Private ClamAV service with official signature database |

The queue remains the existing PostgreSQL-backed durable outbox. No Redis or alternate job system is introduced.

Render persistent disks are service-scoped, so the web and worker must not write a shared filesystem. The object-storage service owns its disk; the scanner service owns its signature disk. This preserves quarantine, private retrieval, versioning and worker restart behavior across separate services.

## Provider contracts

### Object storage

The selected implementation is **SeaweedFS Community Edition 4.47**, run as a single-node combined server with its S3 API enabled. The service uses the official `chrislusf/seaweedfs:4.47` container image from the SeaweedFS project source at `https://github.com/seaweedfs/seaweedfs`, licensed under Apache License 2.0. The implementation will be pinned to the published image digest during Blueprint preparation rather than using a floating `latest` tag.

SeaweedFS is selected over MinIO because the current MinIO community repository is archived/source-only and AGPLv3, while SeaweedFS remains an actively released S3-compatible project with an Apache-2.0 source license. This is an explicit staging decision, not a silent dependency choice.

The service will bind only the S3 port on Render's private network, mount a paid persistent disk at `/data`, and use a staging-only access key/secret. It will not expose the S3 API, admin API or console publicly. The single-node layout has no HA, replication, erasure-code redundancy or independent object-store backup; it is acceptable only for the client-demo staging target and requires the documented database/storage backup and restore drill. It is not a production storage design.

Add a staging-capable object-storage adapter behind the existing `ObjectStoragePort`. The adapter must:

1. use the private SeaweedFS S3 endpoint supplied by the Render private storage service;
2. reject public URLs and path traversal keys;
3. preserve the current `put`, `get` and `delete` result contract;
4. use server-side credentials only, never browser-visible credentials;
5. keep all uploads in the existing private quarantine-to-release flow;
6. return bounded unavailable errors rather than treating transport success as document cleanliness;
7. remain selected only when `APP_ENV=staging` and the staging storage variables are complete;
8. leave the local filesystem adapter unchanged for `APP_ENV=local` and tests.

The storage service is internal only. No public bucket policy or public object URL is permitted.

### Malware scanning

Add a staging-capable `MalwareScanPort` implementation that speaks to ClamAV through a bounded private-network connection. ClamAV is treated as network-restricted, not inherently authenticated; the scanner service remains private, and this slice does not add application-level ClamAV authentication. Any authenticated scanner protocol or service token is a separate proposal and release decision.

It must retain the existing evidence fields:

- implementation and ClamAV engine version;
- official signature version and signature date where the daemon exposes them;
- scan timestamp;
- exact `documentVersionId` and SHA-256;
- clean, rejected or unavailable verdict;
- bounded failure reason.

The scan must remain fail-closed for unavailable/stale/missing signatures, timeouts, malformed daemon responses, encrypted or unsupported content, scan limits and hash mismatch. A clean result means only that the configured scanner reported no threat for the exact bytes; it does not establish authenticity, legal validity, government approval or building approval.

ClamAV and its signature updater are private to Render. The scanner service must not bind a public hostname or accept internet traffic.

### OTP email

Add a staging-capable transactional email adapter behind the existing `TransactionalEmailPort`, using generic SMTP configuration so the owner can choose an approved provider without another code change. Required secret variables are supplied only in Render's secret UI:

- SMTP host, port and TLS mode;
- SMTP username/password or provider token;
- verified sender address;
- staging recipient policy/limit where supported.

The local in-memory mailbox remains available only to local/test. The staging transport must be idempotent for OTP delivery and must not log OTP values, provider payloads or credentials.

### Optional capabilities

OCR, live AI, push, government connectors, payment gateways, e-sign, public listings and other unapproved providers remain explicitly unavailable. They must not prevent the ordinary scanned-document/manual-review demo flow, and the readiness endpoint must report them as unavailable rather than pretending they are configured.

## Environment and secret contract

The Blueprint sets non-secret staging identity values and references the new Postgres instance. Render generates the Better Auth and internal service secrets or prompts for approved third-party credentials. No values are committed.

```text
APP_ENV=staging
NODE_ENV=production
SUKOON_RUNTIME_PROFILE=STAGING
BETTER_AUTH_URL=https://demo.sukoon.nuvirolabs.com
BETTER_AUTH_TRUSTED_ORIGINS=https://demo.sukoon.nuvirolabs.com
SUKOON_TRUSTED_ORIGINS=https://demo.sukoon.nuvirolabs.com
DATABASE_URL=<from the new Render Postgres instance>
BETTER_AUTH_SECRET=<Render-generated staging-only secret>
SUKOON_STORAGE_PROVIDER=remote
SUKOON_SCANNER_PROVIDER=remote
SUKOON_EMAIL_PROVIDER=remote
SUKOON_STORAGE_ENDPOINT=<private storage host/port>
SUKOON_STORAGE_BUCKET=sukoon-demo-staging
SUKOON_STORAGE_ACCESS_KEY=<Render-managed secret>
SUKOON_STORAGE_SECRET_KEY=<Render-managed secret>
SUKOON_CLAMAV_ENDPOINT=<private ClamAV host/port>
SUKOON_SMTP_HOST=<owner-approved provider>
SUKOON_SMTP_PORT=<owner-approved provider>
SUKOON_SMTP_USERNAME=<secret>
SUKOON_SMTP_PASSWORD=<secret>
SUKOON_EMAIL_FROM=<verified staging sender>
```

The Blueprint must use service references for private host/port and database connection details, generated values or service-to-service env references for internal secrets, and `sync: false` only for third-party credentials. Render does not support variable interpolation in Blueprint YAML, so the file must use its supported `fromDatabase`, `fromService`, `fromGroup`, `generateValue` and `sync: false` forms rather than shell-style interpolation.

## Staging seed safety

Create an explicit `demo:seed:staging` command that refuses to run unless all of these are true:

- `APP_ENV=staging`;
- `NODE_ENV=production`;
- `SUKOON_RUNTIME_PROFILE=STAGING`;
- a dedicated staging seed confirmation variable is present;
- the database name is exactly the Blueprint's staging database name and is not local/test/production;
- the storage endpoint, bucket and private storage provider are staging-specific;
- `SUKOON_DATA_DIR` is absent or is not the local `.data` root;
- no local sandbox mailbox is selected.

The command recreates only the approved synthetic demo dataset through an idempotent, staging-aware path. It never copies `.data`, local sessions, review accounts, privacy-erasure fixtures, EICAR files or local storage objects. Seeding is an explicit post-deploy action, not an unconditional build hook.

## Health, operations and recovery

Keep `/api/health` as anonymous process liveness. Add an authenticated/readiness path for operator use that reports redacted status for:

- database connectivity and migration parity;
- private storage put/get/delete probe using a disposable non-document key;
- scanner connectivity and signature freshness;
- worker heartbeat/lease progress;
- configured versus unavailable optional providers.

Prisma migrations have one owner: the web service's `preDeployCommand`. The worker must perform a schema/migration readiness check before it consumes any job and must fail closed when the database is unavailable or migrations are incomplete. The worker must not run migrations and must not race the web pre-deploy path.

No secrets, document bytes, private object keys, OTPs or raw provider responses appear in health output. The worker receives graceful shutdown, releases active claims, and resumes expired leases after restart through the existing durable queue.

The runbook must cover Render deploy rollback, database backup/restore into a disposable staging target, storage retention/cleanup, signature refresh, worker restart and custom-domain verification. No production rollback or migration is included.

## Render Blueprint behavior

The repository-side `render.yaml` will:

1. define a new Render project/environment for staging in Singapore;
2. create only the five named staging resources above;
3. provision the web service first on its Render-generated hostname and include `demo.sukoon.nuvirolabs.com` only after infrastructure validation is ready;
4. set the web health-check path;
5. run checked-in Prisma migrations once as a pre-deploy command on the web service;
6. build the worker separately from the web process;
7. disable pull-request preview provisioning for this client-demo Blueprint;
8. avoid any reference to existing Sukoon/Vercel resources or unrelated projects;
9. leave seeding as an explicit guarded command after the owner confirms the target;
10. use fixed staging names so a later sync updates only this Blueprint's resources;
11. retain the Render-generated hostname during infrastructure validation, then make the custom domain the canonical Better Auth/Sukoon origin after HTTPS and authentication pass and disable the public Render subdomain unless a documented staging reason requires it.

The Blueprint is infrastructure-as-code, not proof that the resources exist. The acceptance state changes only after Render reports successful provisioning and the external HTTPS/web, scanner, storage, worker and Android checks pass.

## Acceptance gates

### Repository-side

- local adapter behavior remains unchanged;
- staging configuration rejects local/test adapters and unsafe origins;
- staging storage, SMTP, ClamAV and worker factories are unit-tested;
- scanner evidence remains bound to exact version/hash;
- `demo:seed:staging` is fenced and idempotent;
- `render.yaml` passes Render Blueprint schema validation;
- lint, typecheck, unit, integration and production build pass.

### Render-side

- a new isolated Render project/environment exists;
- the web URL, private services, database and disks belong to that environment;
- DNS has only the owner-approved `demo.sukoon.nuvirolabs.com` record;
- staging sign-in uses the approved SMTP provider, not the sandbox mailbox;
- real synthetic uploaded bytes pass through quarantine, private storage, ClamAV and recorded verdict before preview/download/share;
- worker restart/reclaim passes for reminders, document jobs and exports;
- remote browser routes and protected document hash download pass;
- the staging APK works without USB, ADB reverse, Tailscale or the Mac;
- no production readiness claim is made.

Before the first Blueprint Apply, prepare and present a cost table with resource, Render plan, Singapore region, disk size, estimated monthly cost, public/private status and rationale. No billable Render resource may be created until the owner explicitly approves that table.

## Alternatives considered

### External S3-compatible storage

An approved external S3-compatible service would be more conventional for a long-lived deployment, but adds another provider/account, credentials, costs, lifecycle configuration and owner approval. It is not the minimum-click path when the owner currently has Render access only. SeaweedFS is the selected staging implementation, with its single-node limitations recorded above.

### Shared Render persistent disk

Rejected. Render disks are attached to one service and cannot be safely shared by the web and worker. It would break the durable processing boundary or force the worker into the web process.

### Deploy the existing local adapter unchanged

Rejected. It would require local filesystem, local ClamAV or sandbox OTP assumptions and would violate staging isolation or fail closed on the first request.

## Owner actions after repository preparation

The owner will still need to:

1. connect the repository to the Render account;
2. connect/authorize the Git provider and push the audited current source as a clean staging branch before Render can read it;
3. choose Singapore and approve the paid plans required for private services and persistent disks;
4. provide an approved SMTP provider, verified sender and credentials in Render;
5. apply the Blueprint;
6. add the exact application DNS record Render supplies for the custom domain and any separate SMTP DKIM/SPF/domain-verification records;
7. explicitly run the guarded staging synthetic seed;
8. provide the resulting staging URL and health output for remote acceptance.

No DNS, service, database, email account, paid provider, deployment or production change is authorized by this design document alone.
