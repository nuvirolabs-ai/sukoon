# Sukoon client demo staging runbook

**Status:** `REPOSITORY_PREPARED_COST_APPROVAL_REQUIRED` — 2026-09-17

This runbook prepares the isolated client-demo environment requested for `https://demo.sukoon.nuvirolabs.com`. It is not a deployment claim. No external resource, DNS record, database, bucket, email provider, server or paid service has been created by this checkpoint.

## Current repository-side checkpoint

- The current working tree is on local branch `codex/sukoon-render-demo-staging`; no Git remote is configured, so a clean remote staging branch cannot yet be verified or pushed. The publication audit passed for 429 non-ignored tracked/untracked candidate paths without printing secret values. Before any push, stage only the reviewed source, migration, infrastructure, docs and tests; never stage `.data`, OTP/session history, databases, ClamAV signatures, private documents, EICAR/malware fixtures, APKs, archives or temporary acceptance output.
- The repository-side staging contract is implemented and tested: remote S3-compatible storage, private clamd scanning, remote SMTP OTP delivery, web-owned Prisma migrations, worker migration readiness/fail-closed behavior, staging heartbeats, guarded synthetic seed and authenticated readiness checks. No Render resource, DNS record, SMTP provider or external message has been created.
- The first Render Blueprint is now present in the working tree at `../render.yaml`. It defines one `sukoon-demo-staging` project and `demo-staging` environment with isolation/protection enabled, four services plus one dedicated paid Postgres database, all in Singapore, and preview generation disabled. The web service self-references Render's generated `RENDER_EXTERNAL_URL` for the first infrastructure/auth check; no custom domain is in the first apply.

## Storage and scanner decisions

The selected `sukoon-storage` implementation is SeaweedFS Community Edition `4.47`, Apache-2.0, from the official `chrislusf/seaweedfs` image pinned in `infra/seaweedfs/Dockerfile`. It runs official `weed mini` single-node mode on a 10 GB persistent disk, with a private S3 endpoint and generated credentials. Its explicit limitations are single-node/no HA, no cross-region replication and operator-owned backup/restore; it is client-demo staging storage, not production storage. See `infra/seaweedfs/README.md`.

The selected `sukoon-clamav` implementation is the official Cisco Talos `clamav/clamav-debian:stable` image pinned in `infra/clamav/Dockerfile`, with a 5 GB persistent signature disk. It is private-network restricted on clamd TCP 3310; clamd has no inherent authentication or encryption, and no public endpoint or application-level scanner authentication is introduced. FreshClam refreshes official signatures daily; Sukoon rejects stale/future signature metadata older than 72 hours and fails closed on threats, errors, timeouts, hash mismatches, unsupported/limited content or unconfirmed results. See `infra/clamav/README.md`.

## Earlier audit record

- No Sukoon deployment manifest, linked `.vercel` project, Docker Compose deployment, managed-database binding or object-storage adapter exists in the checkout.
- `demo.sukoon.nuvirolabs.com` did not resolve during the audit. The exact DNS record cannot be specified until an approved hosting target supplies its canonical hostname or public address.
- The available Vercel CLI session exposes existing Signor Vale projects, including older Sukoon projects, but no approved Nuvirolabs client-demo project or `nuvirolabs.com` domain. Those projects and domains were not reused.
- The current runtime selects local filesystem storage, local ClamAV and the in-memory sandbox OTP transport for `APP_ENV=local`. It does not yet select those implementations as staging providers under a production Next runtime. Staging provider integration must be completed and tested before any remote APK is built.
- The current `demo:seed` guard is intentionally limited to the approved local database and `.data` root. It must be extended with a separate, explicit staging database/root fence before the dataset is seeded remotely. No local `.data` content will be copied.

## Proposed isolated topology

The safest first staging shape is one approved private host or private project dedicated to Sukoon DEMO. The exact vendor remains an owner choice.

```text
Akshay Android / browser
          |
       HTTPS 443
          |
  approved DNS + TLS edge
          |
   Sukoon Next.js app
          |
  private loopback/network only
     |       |        |
 PostgreSQL worker  ClamAV
     |
 private document storage
```

Required separation:

| Area | LOCAL | STAGING / DEMO | PRODUCTION |
|---|---|---|---|
| App origin | `http://localhost:3100` | `https://demo.sukoon.nuvirolabs.com` | separate approved HTTPS origin |
| Database | existing local DB | new uniquely named staging DB | separate production DB |
| Storage | existing `.data` root | new private staging bucket or host directory | separate production bucket |
| Authentication | local sandbox mailbox | approved staging email transport | production transport and policy |
| Scanner | local ClamAV | isolated staging ClamAV with official signatures | separately operated production scanner |
| Dataset | local synthetic demo seed | freshly recreated synthetic seed only | no demo seed by default |
| Worker | local foreground worker | independently supervised staging worker | separately operated worker |
| Secrets | local `.env` | staging secret store/env only | production secret store/env only |

The database and storage must be private. PostgreSQL, ClamAV and document objects must not be internet-facing. The worker must be restartable independently from the web process. HTTPS must terminate at the approved edge or reverse proxy and forward only to the private app listener.

## Required owner actions before provisioning

Provide these as one staging decision set; do not put secrets into this repository or chat:

1. **Hosting/server:** approved provider/project, region, operating model (single private VM or managed services), deploy access (SSH or scoped CI token), operating owner, rollback owner and monthly cost ceiling.
2. **Storage:** either approval for a private encrypted staging volume on that host or an approved S3-compatible private bucket, including region, retention, lifecycle and scoped credentials. Public-read URLs are not acceptable.
3. **Email:** selected staging OTP transport, verified sender/domain, allowed recipient policy, daily/monthly limits and credentials in the selected secret store. The local sandbox mailbox cannot be used remotely.
4. **DNS:** after the host/provider is selected, add only the record for `demo.sukoon.nuvirolabs.com` that the provider gives. Normally this will be either a single `CNAME` from `demo.sukoon.nuvirolabs.com` to the provider hostname or an `A`/`AAAA` record to the approved server address; the exact value is provider-specific. Do not change unrelated Nuvirolabs records.
5. **Monitoring:** approved health/alert destination, operating owner, response window, worker/database/storage alert thresholds and backup destination.
6. **Staging policy:** demo-account allowlist, document retention/cleanup date, whether Akshay may upload documents during the demo, and the staging restore/rollback owner.

No paid service or external email delivery will be activated until the relevant provider and spend are explicitly approved.

## Staging configuration contract

The eventual staging secret set must be supplied through the selected host secret manager, not committed files. Values below are names and constraints, not credentials:

```text
APP_ENV=staging
NODE_ENV=production
SUKOON_RUNTIME_PROFILE=STAGING
BETTER_AUTH_URL=https://demo.sukoon.nuvirolabs.com
BETTER_AUTH_SECRET=<staging-only random secret, 32+ characters>
SUKOON_TRUSTED_ORIGINS=https://demo.sukoon.nuvirolabs.com
BETTER_AUTH_TRUSTED_ORIGINS=https://demo.sukoon.nuvirolabs.com
DATABASE_URL=<new staging-only PostgreSQL URL>
SUKOON_DATA_DIR=<new private staging storage root, never .data>
SUKOON_EMAIL_PROVIDER=<approved remote staging transport>
SUKOON_STORAGE_PROVIDER=<approved private staging adapter>
SUKOON_SCANNER_PROVIDER=<approved staging ClamAV adapter>
SUKOON_CLAMSCAN_PATH=<staging host absolute path>
SUKOON_CLAMAV_DATABASE=<staging host private signature path>
```

The staging process must fail closed if it sees a local/test/sandbox adapter, a localhost database that is not the isolated staging database, the local `.data` root, an HTTP public origin, a wildcard trusted origin, the local OTP mailbox, a missing secret or a public object-storage policy. OCR, live AI, push, government connections and payment gateways remain unavailable unless separately approved; they must not block ordinary scanned-document/manual-review demo flows or be represented as live.

For the Render Blueprint, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` and `SUKOON_TRUSTED_ORIGINS` initially self-reference the web service's generated `RENDER_EXTERNAL_URL`. After that hostname's health and auth checks pass, add the owner-approved custom domain, set all three origins to `https://demo.sukoon.nuvirolabs.com`, verify authentication, then disable the Render subdomain. The first Blueprint intentionally does not contain the custom domain because Render requires a custom domain before its subdomain can be disabled.

The Blueprint prompts for SMTP host, port, TLS mode, username, password and verified sender with `sync: false`. These are third-party values and must be supplied only in Render's secret prompt or dashboard. Depending on the selected SMTP provider, domain verification may require additional DKIM, SPF and/or provider-verification DNS records. Those records are separate from the one application record for `demo.sukoon.nuvirolabs.com`; do not claim that email setup needs only the application DNS change.

## Pre-apply Render cost gate

This is an estimate for the checked-in Blueprint, not a charge or provisioning result. Dashboard pricing is authoritative. No billable resource may be created until the owner explicitly approves this table.

| Resource | Render plan | Region | Disk | Estimated monthly cost | Public/private | Why required |
|---|---|---|---:|---:|---|---|
| `sukoon-web` | paid `0.5c-512mb` | Singapore | none | $7 | HTTPS web; generated hostname first | Next.js UI/API and liveness |
| `sukoon-worker` | paid `0.5c-512mb` | Singapore | none | $7 | private process | durable reminders, document jobs, exports |
| `sukoon-db` | paid `0.5c-1g` | Singapore | 15 GB | $23.50 est. | private connection | dedicated non-expiring staging PostgreSQL |
| `sukoon-storage` | paid private `0.5c-512mb` | Singapore | 10 GB | $9.50 | private service | SeaweedFS S3-compatible private documents |
| `sukoon-clamav` | paid private `1c-2g` | Singapore | 5 GB | $26.25 | private service | official signature-backed malware scanning |
| **Estimated total** |  |  |  | **$73.25/mo** |  | before workspace, bandwidth, build, custom-domain and SMTP charges |

The database plan is paid and does not use Render's free database that expires after 30 days. The storage and scanner endpoints are private services; only the web service has public HTTPS traffic. Render's environment isolation blocks private cross-environment traffic, while environment protection limits destructive actions to eligible workspace administrators where the selected plan supports it.

## Provisioning sequence after owner inputs arrive

1. Connect the owner-approved Git provider repository and push a clean reviewed staging branch containing the current source revision. Confirm the Render Blueprint SHA matches that branch and that the publication audit reports no private files or values.
2. In Render, select Singapore, create the `sukoon-demo-staging` project and `demo-staging` environment, keep environment networking isolation and permissions protection enabled, and review the five-resource change set against the cost table. Do not click Deploy Blueprint before cost approval.
3. After approval, apply the Blueprint with its generated web hostname. Render creates the dedicated paid Postgres, private SeaweedFS disk/service, private ClamAV disk/service, web service and independent worker. Do not copy local `.data`, local accounts, sessions, privacy-erasure fixtures, EICAR files, signatures or local objects.
4. Let the web pre-deploy command own `prisma migrate deploy`. Confirm the worker's migration readiness check passes before it consumes jobs; the worker never runs migrations.
5. Confirm SeaweedFS's private `sukoon-demo-staging` bucket and put/get/delete probe, then verify ClamAV's private clamd TCP 3310 endpoint and current signature metadata. Record implementation/engine/signature evidence without exposing secrets or document bytes.
6. Enter the owner-approved staging SMTP transport and verified sender. Use only approved synthetic recipients; do not use the local sandbox mailbox or send test mail to arbitrary real addresses.
7. Validate the generated hostname from outside Render: `/api/health` for liveness and authenticated `/api/health/ready` for database/migration/storage/scanner/worker readiness. Do not treat anonymous liveness alone as acceptance.
8. Add only the Render-provided application DNS record for `demo.sukoon.nuvirolabs.com` (normally a CNAME, or the exact A/AAAA record Render instructs). Separately add any SMTP DKIM/SPF/domain-verification records the approved mail provider requires. Verify HTTPS and remote OTP auth.
9. Change the canonical Better Auth/Sukoon origin and trusted origins to `https://demo.sukoon.nuvirolabs.com`, verify auth and protected document routes, then disable the public Render subdomain unless an operator documents a staging need to retain it.
10. Run `SUKOON_STAGING_SEED_CONFIRMATION=CLIENT_DEMO_SYNTHETIC_V1 npm run demo:seed:staging` against the dedicated database. The command creates only approved synthetic records and private synthetic bytes, queues document/export jobs and never copies local state. Let the independent worker scan; rerun the guarded seed only to complete synthetic records after the worker has produced real clean results and manual review is explicitly recorded.
11. Run remote web acceptance: sign-in, Home, Properties, Vault upload/scan/manual review/preview/download, Bills, Maintenance, Construction, Purchase Workspace, Search, Updates, Sharing and revocation. Verify downloaded hashes and unselected-document denial.
12. Build a separate staging-configured debug APK with `https://demo.sukoon.nuvirolabs.com`, install it on the Moto, remove `adb reverse`, unplug USB and repeat the core flow while the Mac app is stopped.
13. Exercise worker restart/reclaim for document jobs, reminders and exports, plus a private staging backup/restore drill. Keep the restored target separate and prove revoked/deleted records do not reappear.

## Acceptance boundary

The staging client demo is not complete until all of the following have independent evidence:

- hostname resolves and HTTPS certificate is valid from an outside network;
- staging sign-in uses the approved remote transport, not the local mailbox;
- database, storage, worker and scanner are isolated from LOCAL and PRODUCTION;
- real uploaded synthetic bytes receive a recorded ClamAV verdict before preview/download/share;
- protected preview/download and document version hashes are verified;
- the approved synthetic dataset is recreated without importing local records;
- worker restart and recovery checks pass;
- the Android app works without USB, ADB, Tailscale or access to this Mac;
- monitoring, rollback, backup and staging cleanup ownership are documented.

Until these are complete, the honest status is **not client-demo ready**. A successful local build or a Vercel project listing does not satisfy the staging claim.
