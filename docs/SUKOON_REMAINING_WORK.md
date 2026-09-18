# Sukoon remaining work

## Current checkpoint — R03 repository preparation, 2026-09-17

The current local branch `codex/sukoon-render-demo-staging` contains the
repository-side client-demo staging preparation. No Git remote is configured,
so the current product is not yet represented by a clean remote staging branch
and Render cannot be safely pointed at it. The sanitized publication audit
passed; private `.data`, OTP/session history, databases, ClamAV signatures,
private documents, EICAR/malware fixtures, APKs, archives and temporary output
remain local and excluded.

Implemented: staging-only remote provider configuration, private SeaweedFS
S3-compatible storage, private clamd scanner, SMTP OTP/reminder transport,
web-owned migrations, worker fail-closed schema readiness/heartbeat,
authenticated redacted readiness, guarded `demo:seed:staging`, pinned official
service Dockerfiles and `render.yaml` for a Singapore-only isolated/protected
Render project. SeaweedFS is a single-node Apache-2.0 Community Edition demo
storage implementation with a 10 GB disk; ClamAV is the official Cisco Talos
image with a 5 GB signature disk. Neither is production infrastructure.

The first Blueprint apply deliberately has no custom domain and uses Render's
generated HTTPS origin via `RENDER_EXTERNAL_URL`. After generated-host health
and auth pass, add the exact Render-provided application DNS record, separately
add any SMTP DKIM/SPF/domain-verification records, cut over the canonical
Better Auth origin to `https://demo.sukoon.nuvirolabs.com`, then disable the
Render subdomain. No Render resource, DNS record, external SMTP, deployment or
client-demo acceptance has occurred.

The current cost gate is an estimated **$73.25/month** before workspace,
bandwidth, build, custom-domain and SMTP charges: web $7, worker $7, paid
Postgres $23.50 estimated with 15 GB, SeaweedFS $9.50 with 10 GB and ClamAV
$26.25 with 5 GB, all in Singapore. Dashboard pricing is authoritative and no
billable apply is authorized until the owner explicitly approves the table in
`docs/OWNER_ACTIONS.md`.

Next exact task after approval and source authorization: push the reviewed
branch, create the isolated Render project, apply the Blueprint, validate the
generated hostname/private health checks, configure approved SMTP, and perform
the independent web then Moto acceptance. Do not mark R03/R04 deployed or
client-ready from repository tests alone.

## Current delta — synthetic demo dataset, 2026-09-14

The reproducible local-only dataset runner is implemented and accepted at the ordinary browser boundary. See `evidence/SYNTHETIC_DEMO_DATASET.md` and `output/synthetic-demo/evidence.json`. Real local ClamAV evidence is present for all 16 seeded document versions; manual category confirmation remains separate; the owner and scoped architect view were exercised through normal OTP/browser routes, including an unselected-document denial. App and durable worker remain available on loopback 3100. The dataset is synthetic and owner-entered; it is not production readiness, live provider integration, OCR/AI, device acceptance or release approval.

The worker processed the two records initially labelled pending/quarantined before final inspection, so those labels do not represent current blocked statuses. Failure/unavailable scanner behavior remains covered by separate automated regression paths. Use `npm run demo:reset` only when the exact synthetic dataset should be removed; database, environment, storage-root and stable-identity fences are mandatory.

## Current delta — T01 evidence / T02 preparation, 2026-09-12 23:59 IST

T01 enforced candidate Vault, receipt/review and question history now work with real ClamAV v1/v2; ordinary headless browser screenshots and protected hash checks saved. Actual targeted purchase byte/derived/job erasure and old-backup replay passed in new isolated run0e59dfd623be53e6. Native PDF visual rendering and browser save remain unverified (Mac locked; headless native PDF capture timed out), device proof remains open. Do not repeat completed code or substitute HTTP hash proof for visual acceptance.

T02 read-only owner/exact-version import preview implemented/tested; deal-room permissions, identity-bound invitation/accept/revoke, confirmed provenance-preserving copy/fresh scan and full journey remain unfinished. No transfer executor or new owner authority exists yet. Canonical queue is `../Sukoon_Agent_Starter_Pack/SUKOON_MASTER_PLAN.md`; details/screenshots/review IDs in `evidence/O01_T01.md`. Latest full verify33 unit+90 integration, lint/typecheck/build PASS. Earlier counts and incomplete-context statements below are historical. OA04/providers/content/platform/release actions unchanged; no new scope approval required.

## Latest delta — synthetic erasure/recovery and O01, 2026-09-12

Current evidence: `evidence/PRIVACY_ERASURE_RECOVERY.md`; older checkpoints below are historical. F04 has real isolated erasure, DB/storage failure/retry, interruption, every-version/partial-file verification, independent tombstones and actual pg_dump/pg_restore replay. Restored Next HTTP checks deny old sessions/documents/projects and retain the unrelated owner; missing ledger returns503. This is not live data-erasure approval, distributed recovery or physical expiry of old backups.

F02 supported failed-job cancellation now passed in ordinary Chrome with one audit receipt. Scoped export request/generation/READY passed; Chrome download still ERR_BLOCKED_BY_CLIENT. Natural Construction section expiry, signed-out Back/Forward/refresh and fresh-session Plan/Budget history/refresh passed. Frame-by-frame no-flash, delayed-response browser/device evidence remain untested.

O01 is IN_PROGRESS with new manual co-owner/loan/insurance records, calendar validation and field history, no implicit grants/payments/schedules, explicit insurance-date schedule prefill and payload-bound schedule idempotency. Focused property tests5/5 passed; browser details and final regression are in the evidence checkpoint. Complete remaining O01 role/loan-schedule acceptance, then proceed T01 private Purchase Workspace; do not restart S00–S30 or wait for renewed feature scope.

S23/S24 remain IN_PROGRESS: broader support/audit/quota/retention diagnostics; full reviewed disclosure semantics; unexercised resource-family/provider-race cases; hosted operational and device acceptance. OA04 applies to live policy activation, not safe independent implementation. Both source roadmaps remain in the single canonical plan.

## Current all-phases delta — 2026-09-12 evening

The latest owner scope now includes BOTH roadmaps. This file is an evidence-gap register, not a second execution plan. Use `../Sukoon_Agent_Starter_Pack/SUKOON_MASTER_PLAN.md` for the dependency queue and `OWNER_ACTIONS.md` for approvals. Older OWN-only/deferred scheduling statements below are historical.

Implemented and tested: F01 restricted operations/liveness, F03 session controls/privacy request intake, F05 owner-audited same-job rescan and logout stale-response suppression. Original failed upload recovered with real ClamAV attempt 4 on unchanged bytes. Normal Chrome PDF visual, Plan/Budget Back/Forward, section refresh, related Bill/Vault return passed. S23/S24 remain incomplete: operator content/moderation UI, support/audit/usage/cost/retention controls; consent withdrawal enforcement, request fulfillment/derived cleanup and restore replay; browser timed expiry/no-flash coverage. No live OCR/AI or production gate is closed.

Final current regression: 27 unit + 78 integration tests; lint/typecheck/build/db status/diff check pass. See `evidence/ALL_PHASES_FOUNDATION.md` for browser details and exact resume task. Migration count 16. Saved review project and revoked architect access rechecked; no review data deleted.

Updated: 2026-09-12 (Asia/Kolkata)

Latest local scanning/navigation checkpoint: `evidence/LOCAL_SCANNING.md`. Approved ClamAV 1.5.4 is installed with official signatures, the ordinary worker recorded a real clean verdict for the fresh synthetic PDF, and owner/manual-review/Construction/architect/revocation acceptance passed at the local boundary. The Codex PDF viewer blocked direct rendering, browser history-control calls timed out after expected URLs rendered, and expiry-specific history remains untested. Final regressions: 71 integration + 25 unit; lint/typecheck/build pass. Startup: `LOCAL_SCANNER_STARTUP.md`. No production/OCR/live-AI/device gate is closed by this work.

This list is intentionally separate from the deferred concept roadmap. It describes evidence gaps and code work remaining for OWN plus the explicitly approved Construction OS foundation; it does not imply production approval.

## Highest priority code and security work

| Priority | Work | Acceptance evidence | Dependency / owner action |
|---|---|---|---|
| P0 | Complete production provider boundaries around the now-local S02-S08 foundation: private object storage, malware scanning, worker operations, email delivery, recovery and operational controls | Approved provider configuration; quarantine/scan evidence; restart/restore; worker retry; production-like auth/storage smoke | Architecture/provider decision and database/storage/auth credentials; owner approves provider spend and privacy terms |
| DONE LOCAL | S02-S08 database/auth/authorization, design, Property Passport and worker/provider boundary | Isolated PostgreSQL migrations, real-Postgres tests, hashed OTP/session tests, HTTP-only cookie flow, category shell, typed passport mutations/history/archive, worker crash/reclaim/effect tests | `docs/evidence/S02.md`–`S08.md`; this is not production readiness |
| DONE LOCAL / P1 | S07 Property Passport mutations | Create/list/edit/archive/restore; required jurisdiction/location/type/name/address/area; typed units/identifiers; self-asserted ownership provenance; optimistic version conflict; child retention/history | `docs/evidence/S07.md`; complete narrow child-resource APIs, retention/deletion policy and production acceptance remain open |
| DONE LOCAL / P0 | S09 private Smart Vault lifecycle | Quarantine/scan states, clean/rejected test boundary, private preview/download, SHA-256, duplicate/idempotency, replacement versions, archive/restore/delete, corruption and cross-user tests | `docs/evidence/S09.md`; approved production object store and real scanner remain release gates; signature checks are not malware scanning |
| DONE LOCAL / P1 | S10 parsing/OCR preparation | Bounded `pdf-parse@2.4.5` text parsing, page/chunk anchors, separate parsing/OCR records and durable OCR stage, empty/corrupt handling | `docs/evidence/S10.md`; approved OCR implementation, rotated/password fixture acceptance and consent/retention remain open |
| DONE LOCAL / P1 | S11 Document AI review workflow | Fixture-only schema-validated proposals, source evidence, accept/edit/reject/partial apply, user-confirmed provenance and optimistic conflict handling | `docs/evidence/S11.md`; approved live AI provider, processing region/retention, consent and spend limits remain open |
| DONE LOCAL / P1 | S12 controlled content/checklist rules | Versioned neutral rules, operator-only editing/publication, provenance gates, typed applicability, supersede/retire state and synthetic fixtures | `docs/evidence/S12.md`; reviewed jurisdiction/content corpus and operations console remain open |
| DONE LOCAL / P1 | S13 explainable Property Health | Immutable snapshots/items, NOT_ASSESSED, C/N score, applicability/evidence states, source traceability and permission filtering | `docs/evidence/S13.md`; approved checklist/health wording and production evidence policy remain open |
| DONE LOCAL / P1 | S14 manual obligations/occurrences | Property-linked PAYABLE/RECEIVABLE/NON_FINANCIAL records, explicit currency/timezone, date-only recurrence, safe month-end/leap handling, manual provenance | `docs/evidence/S14.md`; S16 now owns durable reminder delivery; legal rates/deadlines are not inferred |
| DONE LOCAL / P1 | S15 manual payments/receipts/ledger | Integer paise full/partial/multiple payment, receipt document/version validation, idempotency, stale conflict, reversal correction and deduplicated ledger | `docs/evidence/S15.md`; payment checkout, bank reconciliation and external verification remain deferred |
| DONE LOCAL / P1 | S16 durable reminders | Restart-safe date-only/timezone scheduling, in-app fallback, delivery attempt states, dedupe, preferences and cancellation after paid/edited/archived obligation | `docs/evidence/S16.md`; approved email/push provider, notification policy and live-device delivery remain open |
| DONE LOCAL / P1 | S17 maintenance lifecycle and expense ledger | Open → progress → resolve → reopen/correct; invoice/warranty links; maintenance-linked obligation; one payment-linked ledger effect; timeline/correction history | `docs/evidence/S17.md`; reviewed retention/deletion policy and external provider semantics remain open |
| DONE LOCAL / P0/P1 | S18 identity-bound sharing | Invitation acceptance, explicit capability/document scope, recipient binding, expiry/revoke, shared projections and output-time reauthorization | `docs/evidence/S18.md`; reviewed sharing/retention policy, live invite delivery and later search/assistant enforcement remain open |
| DONE LOCAL / P1 | S19 authorized private search | Workspace PostgreSQL projection, owner/shared property/document/record search, authorized counts/snippets/deep links, archive/delete freshness | `docs/evidence/S19.md`; production indexing/retention and broader review remain open |
| DONE LOCAL / P1 | S20 property-scoped assistant | Read-only server retrieval, deterministic ledger/obligation calculations, citations, prompt-injection handling, rate/context/timeout/cancel/cost metadata, revocation suppression | `docs/evidence/S20.md`; live model/provider evaluation, consent and production limits remain open |
| DONE LOCAL / P1 | S21 selected export packages | Preview/confirm, durable worker, ZIP manifest/provenance, source/artifact hashes, authenticated temporary download, expiry/cleanup and revocation | `docs/evidence/S21.md`; production object storage, retention/deletion policy and operator operations remain open |
| DONE LOCAL / P1 | S22 integrated Home/Updates/education | Owner/shared real-data projections, current published education only, honest Buy/Sell/Construction routes and connected journey | `docs/evidence/S22.md`; reviewed launch corpus, device/accessibility and formal design approval remain open |
| P1 | Operations admin | Operator auth, redacted job/provider/content diagnostics, safe retry and audit references; no raw originals | Durable worker, content and auth foundations |
| DONE LOCAL | Construction OS approved expansion | Persistent setup-to-handover, 17 focused / 63 total integration tests, canonical cost dedupe/reversal, scoped architect security and real browser persistence | `docs/CONSTRUCTION_OS.md`, `docs/evidence/CONSTRUCTION.md`; replaces only the former Construction placeholder boundary, not S23–S30 |

## Construction-specific boundaries still open

- Reviewed jurisdiction-specific Construction checklist corpus. No published applicable rule means UNKNOWN, not legal approval.
- No live price source, validated engineering quantity calculator, supplier RFQ/order integration, municipal integration or professional verification. Manual entries are labelled with provenance; pricing port remains UNAVAILABLE.
- DONE LOCAL: direct Construction correction/reversal retains original, actor/reason/time and canonical reversal/replacement links; owner-only, idempotent and concurrency-tested. Bills remains authoritative for linked payments. Historical handover snapshots are not rewritten. See `docs/CONSTRUCTION_ACCEPTANCE.md` (71 integration + 25 unit checks; ordinary browser evidence).
- Construction review gates still open: production private storage/invite delivery, Codex PDF viewer compatibility, OCR/AI provider integration, physical-device/browser matrix, expiry-specific history, encrypted/limit scanner fixtures and production readiness. Local ClamAV scanning, eligible selected-document/shared-preview authorization, section navigation/reload, manual correction, linked Bills reversal, reminder delivery, architect access/revocation and synthetic owner handover were exercised.
- Formal design/accessibility acceptance, real-device keyboard/safe-area tests, large-project/load/concurrency review beyond covered cases, production security/retention review, backup/restore and staging/UAT remain open.
- Production private storage and production-grade scanner operations are still required. The local linked-document acceptance used genuinely scanned synthetic bytes; no real project paper, authenticity, government verification or building approval was claimed.

## Content, product and policy dependencies

- Approve the document checklist by property type, jurisdiction, and ownership situation.
- Approve the Property Health algorithm, wording, evidence thresholds, and `NOT_ASSESSED` behavior for missing templates.
- Provide reviewed buyer-education sources with jurisdiction, effective date, reviewer, and expiry; current guides stay drafts.
- Decide authentication delivery, AI provider/region/retention, scanner, object storage, reminder channels, and usage/cost limits.
- Decide invitee role defaults, data retention/deletion, export behavior, and access after revocation.
- Approve privacy policy, terms, consent withdrawal, support contact, and operational ownership.

## Untested local/device/operational requirements

- Server process restart with persisted PostgreSQL state is proven locally; worker child-process crash/reclaim and exactly-one-effect are also proven against isolated PostgreSQL; backup/restore is still untested.
- Interrupted uploads, password-protected PDFs, rotated scans, OCR quality, external provider retries, backup/restore, and concurrent worker/replace races beyond the covered idempotency paths.
- Reminder timing at month-end/leap-year/timezone boundaries has focused local coverage; live notification delivery, provider retries and production worker operations remain untested.
- Maintenance has focused lifecycle/document-link/ledger coverage; broader retention/deletion, concurrent correction and operator diagnostics remain untested.
- Search, assistant, export and integrated Home/Updates have focused local coverage; live provider behavior, cached-client/device behavior, retention policy, operator diagnostics and staging remain open.
- The local email OTP mailbox is intentionally development/test-only; no external delivery provider or production secret is configured.
- Desktop and mobile widths around 390–430 CSS px, safe areas, keyboard behavior, large text, screen-reader order, and real iOS/Android devices.
- Accessibility audit, dependency/secret scan, staging TLS/monitoring/backup, and production smoke.

## Deferred later-phase functionality

These remain outside Phase 1 OWN unless a newer explicit scope is approved: live government/DigiLocker/utility connectors; payment checkout and reconciliation; circle/guideline rate tables; legal drafting suite; public listings/brokers/transaction portal; construction marketplace/material rates/professional consulting; floor-plan library; vendor directory and bookings; media/news/blog/podcast; enterprise finance/insurance. The current routes state these capabilities are not live and do not present hard-coded records.

## Next executable task

Review the Construction checkpoint; S23 — operations admin and support diagnostics remains the next numbered task on explicit continuation. S02–S22 and the approved manual-first Construction foundation are locally complete at their documented boundaries, independent of unresolved real scanner/OCR/live-AI/provider gates. Do not connect paid providers, credentials, shared, staging or production data without explicit authorization; local/test adapters remain visibly non-production.
# Current continuation pointer — O01/T01, 2026-09-12

Use the existing canonical master plan, not historical checkpoint text below. O01 loan and basic-read co-owner browser checks now have evidence; T01 private organizer core is implemented but purchase-context Vault, scanned received evidence, question resolution and full screenshot/browser acceptance are unfinished. Next implementation is the explicit purchase document context in the existing Vault pipeline, without false ownership or a second storage system. See evidence/O01_T01.md. S23/S24 broader gaps and OA04 live-erasure gate remain unchanged.
