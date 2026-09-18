# Local app, worker and scanner startup

## All-phases foundation update

Current additive schema count:23. After pulling/reviewing schema changes, use the existing safe local migration workflow and regenerate Prisma; restart the app and worker processes after generation because long-lived Prisma instances retain their old model set. Do not reset databases. Current run commands from repository root:

```sh
npm run db:generate
npm run db:migrate:deploy
npm run dev:local -- --hostname 127.0.0.1
```

In a separate terminal use `npm run worker:local`. Keep the existing ClamAV private database and opt-in environment configuration below. Scanner remains on-demand per upload; there is no new daemon/service. Stop app/worker with Ctrl-C in their own terminals, never broad process-kill commands. The ordinary worker remains necessary for queued retries.

### Synthetic demo dataset

For the reviewable local demonstration only, with the ordinary app and worker pointed at the approved normal local database:

```sh
npm run demo:seed
node scripts/demo-browser-evidence.mjs
```

Sign in with `demo-owner@sukoon.local` through the local OTP mailbox. The dataset is versioned at `.data/synthetic-demo/dataset-v1.json` and uses synthetic identities and owner-entered records only. To remove it later, run `npm run demo:reset` from the repository root. The reset command refuses production mode, a different database, a different storage root, unexpected demo IDs, or an unexpected owner workspace. Do not use it against another database or the saved review project.

T01 review: normal sandbox OTP as `t01-buyer-20260912@example.com`, then `/buy-sell/purchases` → Synthetic T01 external search → existing candidate → Purchase documents and evidence. Saved harmless PDF v1/v2 are independently scanned/manually confirmed; old evidence references remain v1. No owned Passport was created. Browser capture limitations and exact hashes are in `evidence/O01_T01.md`. No live AI is needed for manual classification. Never run synthetic erasure variables against this normal review DB.

Profile now exposes sessions, document-intelligence withdrawal, scoped account-owned records archives and deletion request-only intake. Account export generation/expired-artifact cleanup runs in `worker:local`; the archive deliberately excludes original bytes/derived output/secrets/other-owner records. `/operations` uses an authorized local operator and existing S12 review workflow; normal owners are denied. `/api/health` is liveness only. Vault same-version retry and real scanner settings remain unchanged; live OCR/AI remain unavailable.

### Disposable browser acceptance (never the review database)

The already-created local database `sukoon_s02_local_acceptance_20260912` contains only synthetic accounts and retired synthetic content. To resume its short-session browser tests:

```sh
APP_ENV=local SUKOON_DATA_DIR=.data/acceptance-20260912 DATABASE_URL=postgresql://tanutejas@localhost:5432/sukoon_s02_local_acceptance_20260912 BETTER_AUTH_URL=http://127.0.0.1:3102 SUKOON_ACCEPTANCE_SESSION_SECONDS=300 npx next dev --hostname 127.0.0.1 --port 3102
```

Run its worker separately with the same APP_ENV/SUKOON_DATA_DIR/DATABASE_URL/BETTER_AUTH_URL variables and `npx tsx scripts/run-local-worker.ts`. Omit the short-session variable from normal3100 startup; the guard rejects it on the saved review DB. `.next-acceptance` is ignored generated compiler output, not release content. Stop each acceptance process with Ctrl-C in its own terminal; retain the synthetic DB/artifacts unless their removal is explicitly requested. No new daemon/login item or whole-Mac scan is required.

ClamAV installation and official signature update were approved and completed for this private local checkout. The ordinary app/worker is now configured for the opt-in local scanner and remains fail-closed on scanner errors, stale/missing signatures, hash mismatch and unconfirmed output. This is not production storage, production email, OCR, live AI or deployment evidence. See `evidence/LOCAL_SCANNING.md` for actual acceptance evidence.

## Existing local application

From `/Users/tanutejas/Documents/Sukoon`, with the existing private `.env` and localhost local PostgreSQL database:

```sh
npm run db:generate
npm run db:migrate:deploy
npm run db:status
npm run dev:local -- --hostname 127.0.0.1
```

Use `http://localhost:3100`. Inspect an occupied port/process before starting another instance. Keep the sandbox mailbox private; no public tunnels or deployment. Restart the owned app/worker after Prisma generation so they use the new evidence model.

## Installed local scanner

The current private checkout already has the following ignored `.env` values. Do not replace them with test adapters:

```text
SUKOON_LOCAL_SCANNER=clamav
SUKOON_CLAMSCAN_PATH=/opt/homebrew/bin/clamscan
SUKOON_CLAMAV_DATABASE=/Users/tanutejas/Documents/Sukoon/.data/clamav/signatures
```

There is no separate scanner process to start. The durable worker invokes `/opt/homebrew/bin/clamscan` once per quarantined Sukoon upload and records the result before any release to preview, download, Construction linking or shared access. `freshclam` is an operator-run foreground update, not part of the worker startup.

```sh
HOMEBREW_NO_AUTO_UPDATE=1 brew install clamav
mkdir -p /Users/tanutejas/Documents/Sukoon/.data/clamav/signatures
chmod 700 /Users/tanutejas/Documents/Sukoon/.data/clamav/signatures
/opt/homebrew/bin/freshclam --config-file=/Users/tanutejas/Documents/Sukoon/.data/clamav/freshclam.conf
```

The installed binary is `/opt/homebrew/bin/clamscan` and the engine is ClamAV 1.5.4. Freshclam is one foreground update, not a service. The private config is `.data/clamav/freshclam.conf`; the checked-in template is `config/clamav/freshclam.conf.example`. The official signature set is under `.data/clamav/signatures`; the current 2026-09-16 foreground update completed with daily 28125, main 63 and bytecode 339, and the database test passed. Update at least daily and before acceptance, while the document worker is stopped. Do not run concurrent signature updates during scans. If updates fail, do not generate fake CVD files or relax freshness limits. Network access is limited to Homebrew package retrieval and official ClamAV signature/DNS update endpoints; no document leaves the machine.

In the worker terminal:

```sh
SUKOON_LOCAL_SCANNER=clamav \
SUKOON_CLAMSCAN_PATH=/opt/homebrew/bin/clamscan \
SUKOON_CLAMAV_DATABASE=/Users/tanutejas/Documents/Sukoon/.data/clamav/signatures \
npm run worker:local
```

If you want app provider health to show the same selected implementation, supply the same three environment variables to `npm run dev:local`. “Configured” means selected, not a successful scan; version-linked evidence is authoritative. Without these variables, `npm run worker:local` continues with the unavailable scanner. Do not use NODE_ENV=test for the ordinary app or worker.

No scanner daemon, socket, network listener or login startup is used. `clamscan` receives one approved Sukoon upload on stdin and exits after that document; wall-time/scan/output limits apply. Ctrl-C stops the foreground app/worker/updater. Allow an active worker scan to finish or time out and record its result. Do not terminate unrelated processes.

## Client-demo staging scanner and storage boundary

The local setup above is not the client-demo staging setup. Render staging uses the repository-side `ClamdScanner` over a private service-to-service TCP endpoint and the `S3ObjectStorageAdapter` against the private SeaweedFS S3 endpoint. The staging worker is `npm run worker:staging`; it checks the dedicated Prisma schema before consuming jobs, and fails closed if the schema, scanner, signatures, storage or remote SMTP configuration is unavailable. It does not use the local `.data` root, local mailbox, local filesystem adapter or local `clamscan` binary.

The staging scanner is the official Cisco Talos `clamav/clamav-debian:stable` image with a private persistent signature volume and daily FreshClam refresh. Clamd is restricted to the private Render network and has no public endpoint; no application-level scanner authentication is assumed. The configured 72-hour signature freshness bound, document limits and fail-closed verdict rules remain authoritative. The staging storage implementation is SeaweedFS Community Edition `4.47`, Apache-2.0, running `weed mini` with a private S3 endpoint and a separate persistent disk; it is single-node client-demo storage and is not production storage. See `infra/clamav/README.md`, `infra/seaweedfs/README.md` and `docs/STAGING_DEMO_RUNBOOK.md`.

No staging verdict, document preview, remote seed or client-demo acceptance exists until the approved Blueprint is provisioned, the worker performs the real scan, and the protected browser journey records evidence against the dedicated staging database and storage.

Terminally failed old uploads are not magically made clean by installing a scanner. The acceptance PDF was uploaded fresh after starting the configured worker; its clean evidence is version/hash-bound. The earlier parser-mismatch upload remains unavailable/quarantined. A replacement version also gets a fresh job and quarantine; preserve prior versions. Do not patch statuses or reset the database.

Removal, only when desired: stop the worker, unset the three scanner variables, then `brew uninstall clamav`. Optionally move the specific signature directory and unused config to Trash. Do not remove `.data`, uploads, local PostgreSQL or dependency packages used by other apps. Existing no-scan access blocking remains active.

## Synthetic erasure/recovery acceptance (separate from normal review)

Normal app/worker remain `npm run dev:local` and `npm run worker:local` with the approved `.env` scanner configuration. Do **not** add any SUKOON_ERASURE variables to `.env`. Migration20 only extends privacy status values; normal/live deletion remains request-only. No new scanner install or service is required.

Fresh automated destructive proof, only on a new uniquely named synthetic database/object pair:

```sh
npx tsx scripts/erasure-acceptance.ts
```

The runner uses existing safe migrations and installed PostgreSQL tools, fails on database/directory reuse, generates a private pre-deletion archive/object snapshot, injects controlled failures, interrupts/restarts cleanup, restores into a second new database and verifies external-ledger replay. It does not drop/reset any database. Read `evidence/PRIVACY_ERASURE_RECOVERY.md` before using it. Keep its external `.data/erasure-ledgers/<run>` directory independent of all database/object backups. Never restore old application data and declare it ready without replay.

Saved synthetic browser review (not normal saved Construction review):

```sh
npx tsx scripts/start-erasure-review.ts cf9094ffc2548660
```

Open `http://127.0.0.1:3103`; sandbox owner `erase-retained-cf9094ffc2548660@example.com`. This environment has 300-second sessions, two explicitly synthetic properties and the O01 renewal demonstration. Its synthetic operator is `erase-operator-cf9094ffc2548660@example.com`. Normal3100 accounts retain their normal session policy. Do not rerun `--seed` or `--ownership-seed` to inspect existing records: those flags create test data.

Generate a newly confirmed records-v1 archive in that isolated environment only:

```sh
npx tsx scripts/start-erasure-review.ts cf9094ffc2548660 --exports
```

Actual restored application review, separate loopback3104/compiler output:

```sh
npx tsx scripts/start-erasure-review.ts 355ae965ad60d2d1 --restore
```

Startup refuses a mismatched or unreconciled ledger/root. A missing recovery ledger is not repaired by creating an empty replacement. For a deliberately pending authorized instruction, the recovery worker is `npx tsx scripts/erasure-worker.ts` with the exact run's DATABASE_URL/APP_ENV/policy/run/root/ledger environment (the acceptance runner demonstrates the full configuration). `--queue` consumes one existing ERASE_PRIVACY_REQUEST through the established durable worker. `--interrupt-after-database` is a destructive-test checkpoint switch, never ordinary operations. Never aim these at the normal review DB/root.

Stop these foreground synthetic servers with Ctrl-C in their own terminals. Do not stop unrelated listeners. Synthetic DBs, original object snapshots and opaque recovery evidence are retained for inspection; cleanup/removal is a separate scoped action. After proof, `start-erasure-review.ts <run> --purge-auth` removes temporary test cookie material from that run's private metadata. Existing old-cookie HTTP proof cannot be rerun after that purge; rerun the full acceptance in a new run instead. No cookies/OTPs are checked into source or printed in evidence.
# O01/T01 runtime checkpoint — 2026-09-12

The local real-scanner configuration is unchanged. Start app with `npm run dev:local -- --hostname 127.0.0.1` and worker with `npm run worker:local`. The new `/buy-sell/purchases` organizer does **not yet support purchase-context Vault upload**; do not create an owned Passport merely to work around that gap. Existing genuine owner/Construction scanning remains separate and preserved. Migration chain now22 in normal/test/current O01 source review; historical restores were not upgraded or rerun. See evidence/O01_T01.md for the precise resumable checkpoint.
