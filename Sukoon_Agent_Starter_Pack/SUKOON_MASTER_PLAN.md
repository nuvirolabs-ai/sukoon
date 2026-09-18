# SUKOON — Master Implementation Plan

## Current repository-side staging checkpoint — R03, 2026-09-17

R03 is **REPOSITORY_PREPARED / COST_APPROVAL_REQUIRED**, not deployed. The
current dirty product is on local branch `codex/sukoon-render-demo-staging`,
with no configured Git remote; the next external source gate is a clean push of
this reviewed branch and confirmation of its exact SHA before Render can use
it. A sanitized publication audit excludes local `.data`, OTP/session history,
databases, ClamAV signatures, private documents, EICAR/malware fixtures, APKs,
archives and temporary acceptance output.

Repository work now includes explicit staging provider factories and guards,
private SeaweedFS S3 storage, private clamd scanning, owner-supplied SMTP,
web-owned Prisma migration deployment, worker readiness/heartbeat, redacted
readiness health and a separate guarded `demo:seed:staging` command. The seed
uses generated synthetic bytes and queues work for the independent worker; it
does not copy local state, write scan verdicts or use fixture success. Local
behavior and the existing S00–S30/C-OS/T01/T02 evidence remain preserved.

`render.yaml` is a first-apply Singapore-only Blueprint for the new
`sukoon-demo-staging` / `demo-staging` project and environment: isolation and
protection enabled, four services plus one paid non-expiring Postgres, private
storage/scanner disks, web-owned migrations, worker start fencing and preview
generation disabled. It self-references Render's generated
`RENDER_EXTERNAL_URL`; custom-domain cutover is a later step. Selected storage
is SeaweedFS Community Edition 4.47 (Apache-2.0, official image, single-node
10 GB disk); scanner is the official Cisco Talos ClamAV Debian image (5 GB
signature disk, private clamd TCP, no public endpoint or app-level auth).

The pre-apply estimate is **$73.25/month** before workspace, bandwidth, build,
custom-domain and SMTP charges. Dashboard pricing is authoritative. No
billable provisioning, Render authorization, DNS, SMTP setup, external message,
deployment or hosted/device acceptance has occurred. See
`../docs/STAGING_DEMO_RUNBOOK.md` and `../docs/OWNER_ACTIONS.md` for the
consolidated owner action list and stop boundary.

## Current owner-directed correction — rich demo composition, 2026-09-14

UI03: LOCAL_IMPLEMENTED / OWNER_REVIEW_PENDING. The synthetic-only correction is now complete and reproducible without another UI redesign: exact rupee/paise seed boundaries, S15 Property Tax partial payment, ACTIVE/32% derived Mehta Residence progress, four real Vault/Construction links, S12-reviewed synthetic-only rules and S13 83% readiness, plus a separate accepted S18 Architect Construction grant. The existing UI, domain behavior, authorization, saved review records, scanner/privacy evidence and rich dataset remain intact. Current evidence: `../docs/DEMO_COMPOSITION_CORRECTION.md`, `output/demo-composition/demo-correction-after-audit.json`, and `output/demo-composition/browser.json` (63 captures; 41 unit tests in the focused run).

The local review candidate is ready for owner visual/data review, not final design approval or production readiness. The lawyer metadata projection remains documented existing scope behavior; no normal empty account was changed. Next work is owner feedback on UI03; unrelated all-phase modules remain paused under this latest instruction. Older evidence and queue below are preserved.

## Current owner-directed work — consumer visual redesign, 2026-09-14

The latest owner instruction prioritizes visual/information-architecture redesign over further roadmap features. All existing route/API/data/security/provider/release boundaries and S00–S30/F/O/T evidence are retained.

| ID | Slice | Current status / next gate |
|---|---|---|
| UI01 | Shared consumer system; Home, Properties, Passport, Vault, Construction overview, Purchase, Updates, shared views | LOCAL_IMPLEMENTED / OWNER_REVIEW_PENDING. Populated 390/410/430/1280 screenshots, disclosure/history/scoped-document checks and 38 unit +90 integration tests. See ../docs/DESIGN_REDESIGN.md. |
| UI02 | Deep-form density, comprehensive accessibility and physical-device acceptance | IN_PROGRESS wider redesign boundary. Supporting routes token-migrated and core forms relocated; residual detail editors, VoiceOver/Safari/large-text/virtual-keyboard proof explicitly listed in the design report. |

Exact resumption: owner review of localhost:3100, feedback and UI02; the feature queue below is preserved rather than silently completed or restarted. No work is implied after the session ends.

## All-phases authorization — 2026-09-12 (current)

The owner's root `SUKOON_ALL_PHASES_MASTER_PROMPT.md` now authorizes the entire roadmap. It supersedes historical OWN-only, future-unscheduled and stop-after-task instructions below, but not cost, privacy, provider, public messaging, deployment or release approvals. Historical S00–S30 and C-OS evidence remains intact; DONE LOCAL is not live-provider or release acceptance. This is the one implementation queue. `../docs/ALL_PHASES_SCOPE.md` maps both source sequences; owner inputs and acceptance dimensions are companion registers, not alternative plans.

Current order: finish eligible S23/S24 foundations and scanner/session acceptance defects; extend OWN; Transact & Draft; marketplace; Build ecosystem; media/commerce/approved partners; platform and release. Partner approval discovery can run alongside implementation. S25–S30 now gate the whole product rather than only OWN.

| Stable ID | Completion slice | Dependencies | Current state |
|---|---|---|---|
| F01 | Public liveness / protected redacted readiness and operations queue | S03, S08 | CODE_TESTED; owner denial and isolated positive operator browser verified |
| F02 | Existing content review console, audited handler-specific controls, support references, quotas and retention diagnostics | F01, S12 | IN_PROGRESS; content and supported failed-job cancellation browser verified; generic replay disabled; fuller support/audit/quota/retention diagnostics and hosted strong-auth remain |
| F03 | Owner session controls and privacy request intake | S03, S18, S21 | CODE_TESTED; request/cancel browser verified; fulfillment remains F04 |
| F04 | Consent enforcement, account disclosure/export, deletion/derived cleanup and restore replay | F03; policy approval gates live erasure only | IN_PROGRESS; synthetic executor, interruption/storage/DB failure tests, real dump/restore and external replay verified; records-v1 intentionally partial; browser download policy-blocked; broader race/device/full-disclosure and live-policy/hosted gates remain |
| F05 | Same-version audited scanner rescan, PDF visual acceptance, expiry and history evidence | S09, C-OS | REAL_FLOW_VERIFIED rescan/PDF/history; isolated timed Profile/Operations expiry/history verified; full Construction expiry and frame-level no-flash pending |
| O01 | Co-owner/loan/insurance renewal/manual schedule journeys | S14, S18 | IN_PROGRESS at wider acceptance boundary; manual records/renewal and loan create/correct/payment/persistence browser verified; basic-read co-owner sandbox accept/revoke and post-revoke HTTP denials verified; screenshot/dropped-response/device proof untested; no live lender/insurer connection |
| O02 | English/Hindi OCR evaluation, approved live AI and reviewed readiness content | S10–S13, provider/content approval | BLOCKED live acceptance |
| T01 | Private Purchase Workspace, candidate comparison, evidence/questions and milestones | S04, S18 | IN_PROGRESS acceptance; enforced candidate Vault, real-scanned v1/v2, received/reviewed evidence, question history, screenshots, isolation and actual erasure/restore proof implemented and exercised. Native browser PDF rendering/file-save and device acceptance remain open. See ../docs/evidence/O01_T01.md |
| T02 | Scoped deal room, explicit post-purchase import and provenance | T01, S09 | IN_PROGRESS; import executor DONE and tested (migration-backed lineage, explicit confirmation, idempotent resume, fresh-scan copies, no grants/transfers; 7 integration tests; isolated genuine-ClamAV browser acceptance; evidence docs/evidence/T02_IMPORT.md). Remaining: deal-room invitation/accept/revoke/projection grants (needs OA13 field semantics — not invented) and connected multi-party acceptance. |
| T03 | Reviewed jurisdiction/rate registry and versioned legal draft wizard/render/revisions | T01, content approval | UNSTARTED engine; BLOCKED public content |
| T04 | Authorized e-sign integration and draft completion journey | T03, partner approval | BLOCKED |
| M01 | Seller allowlist draft/preview/moderation/publication lifecycle and safe media | S23, S09 | UNSTARTED |
| M02 | Buyer discovery/saves/enquiries/consent/visits linked to Purchase | M01, T01 | UNSTARTED |
| M03 | Broker authority, lead inbox, reports/appeals/stale listing controls | M01, F02 | UNSTARTED |
| B01 | Professional directory, credential review/expiry and consented contact | S23, S18 | UNSTARTED |
| B02 | Provenanced material quotes, scoped RFQ/revisions/comparison and canonical cost linkage | C-OS, B01 | UNSTARTED |
| B03 | Consulting booking/cancellation/outcomes and rights-cleared conceptual plan library | B01, content/payment rules | UNSTARTED |
| G01 | Jurisdiction connector registry, purpose consent, freshness/conflict review | F04, S09 | UNSTARTED |
| G02 | DigiLocker/land/registry/RERA/tax/water/electricity actual approved connections | G01, partner access | BLOCKED |
| P01 | Disabled-by-default pricing/entitlements and signed webhook reconciliation | F02, approved commercial rules | UNSTARTED engine |
| P02 | Real checkout/refunds/disputes and approved BBPS integration | P01, provider approval | BLOCKED |
| P03 | Approved referral/reward rules; escrow only via separately authorized partner | P01, legal/commercial approval | BLOCKED |
| E01 | Reviewed education/news/podcast revisions/retraction, rights and transcripts | S12, S23 | UNSTARTED |
| E02 | Public-only SEO and privacy-safe funnel evidence | E01, M01, public approval | UNSTARTED |
| X01 | Organization membership, scoped service credentials, cases/API quotas/audit/revocation | S04, F04 | UNSTARTED |
| X02 | Owner-authorized bank/NBFC/insurer/developer/society evidence journeys | X01, partner approval | BLOCKED |
| R01 | Cross-domain permission, replay, failure and performance regression | eligible slices, S25 | UNSTARTED |
| R02 | Platform decision, native capabilities and physical iOS/Android acceptance | R01, S26, owner choice | BLOCKED platform decision |
| R03 | Approved hosting/worker/storage/TLS/monitoring/backup and restore drill | F04, S27, infrastructure approval | BLOCKED |
| R04 | Hosted provider/user acceptance, release freeze and authorized handover | R01–R03, S28–S30 | BLOCKED |

For every row track code, reviewed content, actual provider integration, ordinary-browser acceptance, physical-device acceptance and release separately in `../docs/RELEASE_MATRIX.md`. UNSTARTED / IN_PROGRESS / CODE_TESTED / REAL_FLOW_VERIFIED / BLOCKED / RELEASE_ACCEPTED are evidence states, not substitutes for one another. Continue the next eligible slice within the active session; never imply background continuation.

## Current owner-approved expansion — 2026-09-12

Construction OS is **DONE LOCAL** on top of S02–S22. The latest user brief explicitly replaces the Construction future-only placeholder with a persistent manual-first planning-to-handover module; this is the scope authorization required by this plan. Earlier references to Construction being unscheduled describe the historical S22 boundary and are superseded only for this foundation.

| ID | Approved expansion | Dependencies | Current status |
|---|---|---|---|
| C-OS | Property-linked projects, roadmap/tasks, Vault/checklists, canonical costs, materials/entered rates/procurement, manual contacts, updates/reminders/timeline, scoped search/sharing/assistant and owner handover | S02–S22 | DONE LOCAL |

Evidence: `../docs/CONSTRUCTION_OS.md`, `../docs/evidence/CONSTRUCTION.md`. Three append-only Construction migrations bring the database to 13. Full integration: 10 files / 63 tests; Construction: 1 / 17; unit: 2 / 6; auth and authorization: 1 / 1 each. Install, migration status, lint, typecheck, optimized build and verify pass with the documented toolchain/storage warnings. Browser synthetic project and saved progress survive a real local server restart. No commit, reset, paid provider, staging or production action was taken. S23–S30 remain TODO; marketplace, live rates, engineering/legal certification and external ordering remain deferred.

## 1. Release contract

Phase 1 is OWN. Requirements R01–R12 are defined in `docs/PRODUCT_SOURCE_OF_TRUTH.md`. Later roadmaps are preserved but unscheduled. This file is a work queue, not evidence that its tasks have been done.

**Initial state: 31 tasks; S00 READY; S01–S30 TODO; zero tasks DONE; no repository, deployment, provider or approval verified.**

## 2. Workflow

Use AGENTS.md. Tasks become READY only when listed dependencies are DONE and required task inputs exist. Complete one scoped task, record evidence, update status and continue within the active session. A blocked task does not stop unrelated eligible work.

States: TODO / READY / IN_PROGRESS / BLOCKED / DONE / DEFERRED. Keep this status table authoritative. Never replace failed tests with prose assurances. A local adapter test is not its live-provider acceptance; S28 exists specifically to distinguish them.

For every DONE task append a completion record: date, commit if any, changed files, commands/exit codes, proof paths, limitations and acceptance decision. Use `docs/evidence/Sxx.md` for detail. Record owner-approved scope changes before adding modules.

## 3. Task ledger

| ID | Task | Dependencies | Initial status |
|---|---|---|---|
| S00 | Repository discovery and requirements mapping | None | DONE |
| S01 | Workspace, dependency lock and reproducible commands | S00 | DONE |
| S02 | Database foundation, evidence and transaction conventions | S01 | DONE LOCAL |
| S03 | Authentication, profile and consent foundation | S02 | DONE LOCAL |
| S04 | Resource authorization and isolated response contracts | S03 | DONE LOCAL |
| S05 | Native design primitives and reference assets | S01 | DONE LOCAL |
| S06 | Category-first home shell and design review capture | S03, S05 | DONE LOCAL |
| S07 | Property Passport vertical slice | S04, S06 | DONE LOCAL |
| S08 | Durable worker and provider boundaries | S02, S04 | DONE LOCAL |
| S09 | Private upload, vault and protected preview | S07, S08 | DONE LOCAL |
| S10 | Text parsing and extraction preparation | S09 | DONE LOCAL |
| S11 | AI extraction adapter and field-review workflow | S10 | DONE LOCAL |
| S12 | Content and checklist rule infrastructure | S04, S05 | DONE LOCAL |
| S13 | Explainable Property Health and gap actions | S11, S12 | DONE LOCAL |
| S14 | Manual obligations and recurring bill occurrences | S07, S04 | DONE LOCAL |
| S15 | Payment records, receipts and deduplicated expense ledger | S14, S09 | DONE LOCAL |
| S16 | Actual reminders and notification preferences | S14, S15, S08 | DONE LOCAL |
| S17 | Maintenance service records and full timeline | S07, S09, S15 | DONE LOCAL |
| S18 | Invitations, granular sharing and revocation | S04, S09, S03 | DONE LOCAL |
| S19 | Authorized property/document search | S18, S11 | DONE LOCAL |
| S20 | Property-scoped assistant with cited answers | S19, S13, S16, S17, S11 | DONE LOCAL |
| S21 | Scoped export packages and access receipts | S18, S09, S08 | DONE LOCAL |
| S22 | Buyer education, Updates and integrated home | S12, S13, S16, S17, S18, S19 | DONE LOCAL |
| S23 | Operations admin and support diagnostics | S08, S12, S03, S04 | IN_PROGRESS — local content and safe cancellation browser verified; broader F02 diagnostics/hosted access remain |
| S24 | Privacy lifecycle and data requests | S20, S21, S18, S03 | IN_PROGRESS — withdrawal and scoped account-records archive; erasure/tombstones/restore replay still unimplemented |
| S25 | Full OWN regression, security and failure testing | S20, S22, S23, S24 | TODO |
| S26 | iOS/Android build, accessibility and device audit | S25 | TODO |
| S27 | Authorized staging, monitoring and tested recovery | S25 | TODO |
| S28 | Live provider acceptance and AI evaluation | S27, S11, S20, S16, S09 | TODO |
| S29 | Owner/client UAT and release-candidate freeze | S26, S28 | TODO |
| S30 | Production release and handover | S29 | TODO |

### S09-S11 completion record — 2026-09-11

- Status: **DONE LOCAL** for S09, S10 and S11. No commit was created; the pre-existing dirty `main` worktree was preserved.
- S09: PostgreSQL document metadata/version rows, local `ObjectStoragePort` bytes, server-generated keys, SHA-256 integrity, quarantine/scan states, categories, replacement versions, archive/delete behavior, protected preview/download, and owner/cross-user authorization are implemented.
- S10: maintained `pdf-parse@2.4.5` text-PDF parsing is bounded to 50 pages with page/chunk anchors. `DocumentParsingRun` and `DocumentOcrRun` are separate durable records; OCR is a separate queue stage and remains explicitly unavailable locally.
- S11: typed/schema-validated extraction responses, deterministic unmistakably test-only fixture AI, source evidence, proposal review, accept/edit/reject, partial application, user-confirmed history and optimistic property-version conflicts are implemented. No live AI provider was called.
- Verification: `npm ci` PASS; `npm run db:migrate:deploy` PASS; `npm run db:status` PASS; `npm run lint` PASS; `npm run typecheck` PASS; `npm run test:unit` PASS (2 files/6 tests); `npm run test:integration` PASS (6 files/19 tests); `npm run test:auth` PASS (1/1); `npm run test:authorization` PASS (1/1); `npm run build` PASS; `npm run verify` PASS; `git diff --check` PASS.
- Limitations: no compatible real malware scanner, OCR binary/provider, production object storage, or live AI provider was available or installed. Local/test adapters do not satisfy production acceptance. Build retains the known local filesystem tracing warnings; `npm ci` reports four high toolchain advisories and no force fix was applied.

### S12-S15 completion record — 2026-09-11

- Status: **DONE LOCAL** for S12, S13, S14 and S15. No commit was created; the pre-existing dirty `main` worktree was preserved.
- S12: added global typed `ChecklistRule` versions and `RuleAuditEvent` history with DRAFT → IN_REVIEW → PUBLISHED → EXPIRED/RETIRED states, operator-only editing/publication, required source/reviewer/review-date provenance, superseding versions, neutral taxonomy, and applicability limited to typed jurisdiction/property/ownership context. No legal assumptions or executable rule predicates were added.
- S13: added immutable `AssessmentSnapshot`/`AssessmentItem` rows and a deterministic record-readiness evaluator. It uses active clean vault evidence, user-confirmed evidence when a rule requires confirmation, published applicable rules, `SATISFIED`/`MISSING`/`UNKNOWN`/`NOT_APPLICABLE`/`NEEDS_REVIEW` states, and C/N scoring that excludes unknown applicability from the denominator. No applicable published checklist returns `NOT_ASSESSED`; UI includes explanation and source/reviewer traceability.
- S14: added property-linked manual `Obligation` and idempotent `ObligationOccurrence` models. Amounts are optional only for `NON_FINANCIAL`, currency and timezone are explicit, dates are date-only, recurrence supports one-time/monthly/quarterly/yearly, and day 29/30/31 clamps to each target month’s final day. Reminders are stored as configuration only; no dispatch or provider is claimed.
- S15: added owner-scoped manual `ObligationPayment` and `ExpenseLedgerEntry` records with integer paise, full/partial/multiple payment handling, server-computed outstanding balance, stale version conflict, idempotency conflict, protected clean vault receipt/version validation, and explicit reversal/correction ledger rows. No gateway, bank reconciliation, or external payment verification was connected.
- Connected proof: `tests/integration/s12-s15.test.ts` passes 9/9, including authenticated S09-S11 synthetic upload → clean test-only processing → owner review → published rule → explainable health → ₹18,450 obligation → ₹10,000 partial → ₹8,450 receipt-linked completion → timeline/history → explicit PostgreSQL disconnect/reconnect read → User B denial. The focused suite also proves recurrence edit/deactivation/reactivation and one-success/one-stale-conflict concurrent payment behavior.
- Verification: `npm run typecheck` PASS; `npm run lint` PASS; `npm run test:unit` PASS (2 files/6 tests); `npm run test:integration` PASS (7 files/28 tests after S12-S15); `npm run test:auth` PASS (1/1); `npm run test:authorization` PASS (1/1); focused S12-S15 PASS (1 file/9 tests); `npm run db:migrate:deploy` PASS (7 migrations); `npm run db:status` PASS; `npm run build` PASS; `git diff --check` PASS. Build retains the two known local filesystem tracing warnings; `npm ci` reports four high toolchain advisories and no force fix was applied.
- Limitations: rules are synthetic local fixtures, the operator is a local role seam without a full operations console, no reviewed legal/content corpus exists, no production scanner/storage/OCR/AI/email/notification/payment provider exists, and no staging/production/device acceptance is claimed.

### S16-S18 completion record — 2026-09-12

- Status: **DONE LOCAL** for S16, S17 and S18. No commit was created; the pre-existing dirty `main` worktree was preserved.
- S16: added durable date-only/timezone-aware reminders for obligations and manual future events, revision-safe reconciliation, stale cancellation after edits/payment/archive, read/unread/snooze/dismiss actions, per-workspace channel preferences, delivery attempts, in-app delivery, sandbox email capture, unavailable-push retry with in-app fallback, and restart/lease-reclaim handling. Reminder messages remain explicitly self-entered and privacy-safe.
- S17: added owner-scoped maintenance issue records with category, priority, provider/contact fields, estimate/final cost, controlled lifecycle transitions, optimistic versioning, idempotent event history, clean same-property invoice/warranty/quotation/completion/photo links, maintenance-linked obligations, deduplicated payment ledger linkage, summaries, and timeline entries. No external provider completion is inferred.
- S18: added identity-bound hashed-token invitations, role presets and explicit capability grants, selected clean-document scopes, recipient-bound acceptance, expiry/replay protection, immediate revocation, shared-property/document/health projections, scoped search/operation boundaries, and output-time revocation checks. No permanent unauthenticated share URL or raw document output is produced.
- Verification: final gate run passed `npm ci`, `npm run db:migrate:deploy`, `npm run db:status`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run test:auth`, `npm run test:authorization`, focused `npm run test:integration -- tests/integration/s16-s18.test.ts`, `npm run build`, `npm run verify`, and `git diff --check`. Full integration passed 8 files / 38 tests; focused S16-S18 passed 1 file / 10 tests; unit passed 2 files / 6 tests; auth and authorization passed 1 file / 1 test each. The database is current at 9 migrations.
- Limitations: email is sandbox-captured, push is intentionally unavailable locally, scanner/OCR/live AI/production storage are not connected, maintenance and sharing were proven with synthetic local users/documents, and no staging, production, device, backup/restore, live-provider or client acceptance is claimed. Build retains the two known local filesystem tracing warnings; npm reports four high toolchain advisories and no force fix was applied.

### S19-S22 completion record — 2026-09-12

- Status: **DONE LOCAL** for S19, S20, S21 and S22. No commit was created; the pre-existing dirty `main` worktree was preserved.
- S19: workspace-scoped PostgreSQL `SearchProjection` reconciliation covers active properties and active clean/confirmed document versions with approved parsing text/chunks. Owner search includes property/document/obligation/maintenance records; shared search applies accepted capability/document scopes before returning results or counts. Archive/delete/review changes are reflected, and no public/global private index exists.
- S20: the client-local heuristic assistant was replaced by a property-scoped server boundary. It computes outstanding obligations and canonical maintenance-linked ledger totals in integer paise, returns source citations/deep links/page/chunk anchors, treats parsed text as untrusted evidence, exposes read-only/no-write behavior, input/context/rate/timeout/cancel boundaries, and suppresses delegate output after revocation. Provider metadata is explicit (`fixture_test_only` locally in tests, `unavailable_local` otherwise); no live model or raw prompt/answer persistence is claimed.
- S21: selected preview/confirm packages, durable PostgreSQL package/item rows, `GENERATE_EXPORT` outbox jobs, local deterministic ZIP/manifest generation, source/version/SHA-256 provenance, authenticated temporary download, expiry cleanup, artifact integrity checks and pre/post-output authorization are implemented. Delegate export requires explicit `DOCUMENT_EXPORT`; revoke produces `REVOKED` and removes local artifacts.
- S22: Home and Updates use owner/shared projections from current reminders, obligations, maintenance, documents and timeline rows. Guides and Buy/Sell expose only current reviewed `PUBLISHED` education; Construction and marketplace states remain honest future scope and all visible category routes remain reachable.
- Connected proof: `tests/integration/s19-s22.test.ts` passes 1 file / 8 tests for private/shared search, delegate isolation, assistant calculations/citations/prompt-injection/read-only/revocation, ZIP manifest/hash/download, scoped export/revoke-during-generation, Home/Updates/education, cross-surface navigation data, and PostgreSQL disconnect/reconnect.
- Batch verification: schema validation/generation, migration deploy/status, lint, typecheck, focused S19-S22, full integration and build passed. Build retains the two known local filesystem tracing warnings; no force audit fix was used.
- Limitations: local/test object storage only; no real scanner/OCR/live AI/email/push/provider; synthetic local content fixtures; no operator console, backup/restore, staging/production/device/accessibility or formal client design approval. Local completion is not production readiness.

## 4. Milestone gates

- **M0 — Real foundation:** S00–S04. Actual repository, reproducible checks, data, auth and authorization.
- **M1 — Working vault proof:** S05–S11. **DONE LOCAL**: native shell, persistent private document/version loop, bounded text/OCR boundary, and reviewed fixture-extraction path are evidenced. M1 is not production-complete; live external proof remains S28 and real scanner/storage/provider acceptance is still open.
- **M2 — Complete OWN workflows:** S12–S24. Health, bills, reminders, service history, sharing, search, assistant, content, admin and privacy.
- **M3 — Release candidate:** S25–S29. Regression, devices, staging, provider evidence, recovery and human acceptance.
- **M4 — Released:** S30 only after explicit authorization.

Do not skip M1 and spend the entire project on UI mockups. Completing M2 is not production readiness.

## 5. Detailed task contracts

### S00 — Repository discovery and requirements mapping

Dependencies: None. Requirements: R01, R10.

**Implement:** Inspect actual git state, repository, installed tools, manifests, existing tests, schema, env examples and source references. Record existing functionality against R01–R12, detect source/architecture conflicts, and name missing credentials/assets without revealing secrets. Make no application rewrites during this audit.

**Acceptance:** Create docs/REPO_AUDIT.md with commands actually run, current branch/commit or no-repository state, discovered scripts, compatible existing work, explicit unknowns, and the next task. No task completion claims based only on this pack.

**Evidence:** `docs/evidence/S00.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S01 — Workspace, dependency lock and reproducible commands

Dependencies: S00. Requirements: R11.

**Implement:** Preserve existing compatible stack or scaffold the proposed greenfield mobile/API/worker/web workspace. Verify official package compatibility, pin exact resolved versions and add actual root development/check scripts. Add CI with no production secrets and a deterministic test environment.

**Acceptance:** From a clean checkout install successfully, run lint/typecheck and package builds, and start each applicable development surface. docs/DECISIONS.md records the chosen stack. A missing command is implemented or explicitly excluded with rationale; not silently claimed to exist.

**Evidence:** `docs/evidence/S01.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S02 — Database foundation, evidence and transaction conventions

Dependencies: S01. Requirements: R01, R06, R11.

**Implement:** Implement base user-linked workspace, property identity, typed facts, timeline/audit, idempotency and outbox foundations as needed. Generate auth schema using the chosen maintained configuration. Add composite tenant constraints and real-Postgres fixtures.

**Acceptance:** Migrations apply to a new disposable database; persistence survives process restart. Cross-workspace parent-child insertion is rejected. Test data cleanup refuses production. Typed money/date/version conventions have unit tests.

**Evidence:** `docs/evidence/S02.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S03 — Authentication, profile and consent foundation

Dependencies: S02. Requirements: R07, R12.

**Implement:** Implement maintained email-OTP authentication, native session storage, profile/preferences, session/device revocation and versioned terms/privacy/AI-consent records. Sandbox mail in development; production transport readiness is separately gated at S28.

**Acceptance:** Correct, incorrect, expired and replayed OTP scenarios; throttling; sign out and session revocation; native restart persistence; transient network error does not log out. Client bundles/logs contain no secrets. Default profiles expose no claimed legal ownership.

**Evidence:** `docs/evidence/S03.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S04 — Resource authorization and isolated response contracts

Dependencies: S03. Requirements: R01, R07, R12.

**Implement:** Implement central authorization and field/resource filters for owned workspaces and scoped delegates. Define admin metadata roles and typed public API contracts. Never trust client workspace IDs.

**Acceptance:** Two independent users cannot read/edit/list/count/search another user's properties or documents; tests include guessed resource IDs and cross-property attachments. Operator cannot read originals. Unauthorized errors do not reveal resource existence.

**Evidence:** `docs/evidence/S04.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S05 — Native design primitives and reference assets

Dependencies: S01. Requirements: R10.

**Implement:** Create tokenized mobile/web components, native safe-area layouts, typography/icons and states. Preserve original SUKOON logo and center-banner instruction; audit supplied asset quality rather than tracing a new logo.

**Acceptance:** Component gallery/test screens show small/large text, loading/empty/error states and keyboard-safe forms. No fake device chrome or screenshot-as-app. Document any missing clean hero/vector asset for review.

**Evidence:** `docs/evidence/S05.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S06 — Category-first home shell and design review capture

Dependencies: S03, S05. Requirements: R10.

**Implement:** Build Home, bottom navigation and Add sheet with real routes. Provide current capabilities, correct empty states and Phase 1-scoped category landing routes. Record design screenshots; synthetic visual fixture stays development-only.

**Acceptance:** Every visible navigation target opens correctly. Logo is centered in banner. No mock valuation/rate/verification data in production. Capture reference iPhone and small Android layouts; record owner design approval as pending until received. Final integration is S22.

**Evidence:** `docs/evidence/S06.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S07 — Property Passport vertical slice

Dependencies: S04, S06. Requirements: R01, R06.

**Implement:** Create/list/edit/archive properties and ownership assertions with provenance, original area unit/type, typed identifiers and history. Connect mobile forms and server persistence.

**Acceptance:** Sign in → create a property → restart app → reopen → edit with version conflict handling → archive. A different user cannot access it. Empty mandatory jurisdiction fields are validated; optional documents/purchase value/IDs do not block creation.

**Evidence:** `docs/evidence/S07.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S08 — Durable worker and provider boundaries

Dependencies: S02, S04. Requirements: R02, R04, R11.

**Implement:** Implement queue/outbox dispatcher, retry/dead-letter behavior and ports for storage, scanning, mail/push and AI. Add environment/capability validation and redacted health diagnostics.

**Acceptance:** Kill/restart a worker mid-task; jobs resume safely without duplicate domain effects. Missing credentials produce a real unavailable state. Production refuses dev adapters, in-memory job persistence and fake scanner success.

**Evidence:** `docs/evidence/S08.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S09 — Private upload, vault and protected preview

Dependencies: S07, S08. Requirements: R02, R07.

**Implement:** Implement upload intents, object completion validation, quarantine/scan, clean private storage, metadata, categories/versions and protected viewing. Original file remains intact. Camera/PDF paths have real UI.

**Acceptance:** Upload a real synthetic PDF/photo, scan, preview, restart and retrieve the same bytes/hash. Reject spoofed MIME/oversize/unsafe paths/cross-property object IDs. Scanner failure blocks serving. No public file URL. First authenticated persistent vault milestone is evidenced.

**Evidence:** `docs/evidence/S09.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S10 — Text parsing and extraction preparation

Dependencies: S09. Requirements: R03.

**Implement:** Safely parse text PDFs and use bounded OCR for scans only. Handle supported camera orientation and file limits; show unreadable/corrupt/password-protected/unsupported cases without fabricated fields. Consent gates provider-bound operations.

**Acceptance:** Fixtures cover text PDFs, rotated scans, corrupt/oversize input and missing consent. Native parsing/OCR statuses and anchors are preserved. Worker retry does not create duplicate document versions or lose the original.

**Evidence:** `docs/evidence/S10.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S11 — AI extraction adapter and field-review workflow

Dependencies: S10. Requirements: R03.

**Implement:** Implement one real provider adapter behind typed contracts plus local test doubles. Field proposals include source anchors and uncertainty; build review/confirm/reject/conflict UI. Enforce per-user limits and no automatic ownership overwrite.

**Acceptance:** Deterministic fixtures verify classification/review/partial apply/version conflict and no-source behavior. Provider responses are schema-validated. A real-provider evidence run is required at S28; do not describe fixture tests as live AI verification.

**Evidence:** `docs/evidence/S11.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S12 — Content and checklist rule infrastructure

Dependencies: S04, S05. Requirements: R05, R09.

**Implement:** Implement constrained rule schema, content versioning, draft/review/publish/expire workflow and permissioned operator editing. Seed source terms and synthetic draft examples only, not invented current legal requirements.

**Acceptance:** Draft/expired/wrong-location content cannot publish to users or affect health. Unknown applicability stays unknown. Reviewer/source/version fields are enforced. No arbitrary executable predicates or self-approved AI legal content.

**Evidence:** `docs/evidence/S12.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S13 — Explainable Property Health and gap actions

Dependencies: S11, S12. Requirements: R05.

**Implement:** Implement approved record-readiness algorithm, assessment snapshots, item evidence/action UI and permission-filtered results. Keep legal/structural caveat adjacent to the score.

**Acceptance:** Empty template returns NOT_ASSESSED; C/N calculation matches fixtures; unknown contributes no completion credit; inappropriate evidence cannot satisfy an item. Hidden delegate records cannot leak via a whole-property score.

**Evidence:** `docs/evidence/S13.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S14 — Manual obligations and recurring bill occurrences

Dependencies: S07, S04. Requirements: R04.

**Implement:** Build obligations, recurrence/date-only scheduling, paid/receivable/nonfinancial distinctions, reminders configuration and mobile bill lists/details. Preserve self-reported versus external-source origin.

**Acceptance:** Month-end/leap-year/timezone tests, unique bill cycle generation and restart persistence pass. No automatic legal rates/deadlines. Deadline without amount works; manual bills never appear officially fetched.

**Evidence:** `docs/evidence/S14.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S15 — Payment records, receipts and deduplicated expense ledger

Dependencies: S14, S09. Requirements: R04, R06.

**Implement:** Implement manual payment/partial payment, attachment linking, reversal/correction and expense linkage. Amounts use paise and explicit currency. No payment gateway or bank reconciliation is simulated.

**Acceptance:** Duplicate request has one ledger effect; partial payments update outstanding amount; reversal restores appropriate balance; stale concurrent edits conflict. Bill receipt and maintenance invoice linkage cannot double-count expenses.

**Evidence:** `docs/evidence/S15.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S16 — Actual reminders and notification preferences

Dependencies: S14, S15, S08. Requirements: R04, R12.

**Implement:** Generate durable in-app reminders and email/push adapter dispatch with preferences, schedule revisions, stale-job cancellation, snooze/read states and privacy-safe messages.

**Acceptance:** Reminders survive worker restart; edited/paid bills cancel obsolete alerts; duplicates are suppressed. In-app works after push permission denial. Sandbox delivery is tested; live consenting-device/email delivery remains S28 acceptance.

**Evidence:** `docs/evidence/S16.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S17 — Maintenance service records and full timeline

Dependencies: S07, S09, S15. Requirements: R06.

**Implement:** Build issue CRUD, state transitions, estimates/actual costs, optional provider details, invoice/warranty/photo attachments and event/correction views. Only owner-reported completion is claimed.

**Acceptance:** Create → progress → resolve → reopen/correct flow persists. Attachments belong to the same property. Totals use a single linked ledger entry. No immutable-history claim prevents lawful deletion workflows.

**Evidence:** `docs/evidence/S17.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S18 — Invitations, granular sharing and revocation

Dependencies: S04, S09, S03. Requirements: R07.

**Implement:** Implement explicit category/document/field capability grants, identity-bound invitations, scope preview, expiry and revocation. Keep delegates out of other workspace records.

**Acceptance:** Invite a sandbox family user/lawyer with distinct scopes; private fields and originals are withheld. Expired/replayed invitations fail. Revoke then test list, preview, direct download, search and cached-session refresh. No permanent unauthenticated share links.

**Evidence:** `docs/evidence/S18.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S19 — Authorized property/document search

Dependencies: S18, S11. Requirements: R02, R08, R10.

**Implement:** Index only approved safe fields/text for authorized retrieval; implement title/type/property filters and deep links. Public approved-guide search is separate from private vault search.

**Acceptance:** Search results/counts/snippets are scoped before return; a delegate cannot infer inaccessible documents. Delete/revoke/review updates are reflected. Query and error analytics do not expose private document text.

**Evidence:** `docs/evidence/S19.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S20 — Property-scoped assistant with cited answers

Dependencies: S19, S13, S16, S17, S11. Requirements: R08.

**Implement:** Implement read-only assistant, structured ledger tools, permissioned source retrieval, citation resolution, uncertainty, consent, budget/rate caps and cancellation. Export suggestions open explicit app flow only.

**Acceptance:** Adversarial prompts/documents cannot expose other property data or issue writes. Ledger totals match API calculations. Citations resolve; missing source yields uncertainty. Revocation during processing blocks unauthorized output. Live model evaluation occurs at S28.

**Evidence:** `docs/evidence/S20.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S21 — Scoped export packages and access receipts

Dependencies: S18, S09, S08. Requirements: R07, R12.

**Implement:** Build preview/confirm export selection, durable ZIP/manifest generation, authenticated expiring download, audit and artifact cleanup. Respect field and source-version access.

**Acceptance:** Export contains exactly authorized selected files and no hidden records. Revoke during generation and before download prevents access. Expiry works; manifest distinguishes self-reported/AI/external evidence and includes no legal certification.

**Evidence:** `docs/evidence/S21.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S22 — Buyer education, Updates and integrated home

Dependencies: S12, S13, S16, S17, S18, S19. Requirements: R09, R10.

**Implement:** Wire Home/category states to actual owned/shared records, notifications and guides. Add small approved-content education flows, saved guides and honest Construction/Buy-Sell future landing pages.

**Acceptance:** All visible buttons/routes work with real API responses. No bogus listing/price/news data; screenshots' demo dates/claims are absent. Unpublished guides stay hidden. Reviewed launch content is a human prerequisite checked again at S29.

**Evidence:** `docs/evidence/S22.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S23 — Operations admin and support diagnostics

Dependencies: S08, S12, S03, S04. Requirements: R11.

**Implement:** Implement role-limited admin for failed jobs/retries, provider capabilities, content queues, user support metadata, consent/audit references and spend/storage visibility. Strengthen operator authentication.

**Acceptance:** Operator cannot download private files or view raw AI prompts. Retry preserves idempotency. Admin actions are audited; sensitive diagnostic content is redacted. Production configuration validation rejects unsafe capabilities.

**Evidence:** `docs/evidence/S23.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S24 — Privacy lifecycle and data requests

Dependencies: S20, S21, S18, S03. Requirements: R12.

**Implement:** Implement consent withdrawal, session/device controls, data export/delete requests, retention policy configuration, derived-data cleanup, account-cache clearing and deletion tombstones for restore workflows.

**Acceptance:** Withdraw stops future processing; delete removes eligible originals/text/index/cache/export artifacts and invalidates grants. Shared records are handled explicitly. Backup restore process cannot silently resurrect deleted content. Policy approvals stay external until received.

**Evidence:** `docs/evidence/S24.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S25 — Full OWN regression, security and failure testing

Dependencies: S20, S22, S23, S24. Requirements: R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12.

**Implement:** Run end-to-end owner/delegate/operator scenarios, cross-workspace attacks, duplicate/concurrent mutation, worker failure, missing providers, access changes during jobs, large files and migration regression. Add secret/dependency checks.

**Acceptance:** Record command exit results and reproducible reports. No known critical/high privacy flaw, broken core flow or fake provider dependency can be marked waived by the agent. Correctly classify unrun external/device tests.

**Evidence:** `docs/evidence/S25.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S26 — iOS/Android build, accessibility and device audit

Dependencies: S25. Requirements: R10, R12.

**Implement:** Create installable development/release-candidate builds using permitted local/accounts tooling. Test camera/files, real safe areas, keyboard, notifications, session restart and sharing on available iOS/Android devices.

**Acceptance:** Capture actual device/simulator identity, OS/build, screenshots and flow results. Missing hardware or signing account is a recorded blocker for that platform. No clipped layouts at large text; no secrets in release bundle. Native release-store approval is not presumed.

**Evidence:** `docs/evidence/S26.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S27 — Authorized staging, monitoring and tested recovery

Dependencies: S25. Requirements: R11, R12.

**Implement:** After infrastructure authorization deploy isolated staging API/worker/web/storage/database with TLS, alerts, private buckets, backups and runbook. Characterize proposed pilot load; exercise backup/restore including deletion replay.

**Acceptance:** Remote flows persist and work after restarts. Record actual performance/RPO/RTO and resource configuration; list misses without inventing guarantees. The operator can identify job/provider failures. Approval required before paid provisioning.

**Evidence:** `docs/evidence/S27.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S28 — Live provider acceptance and AI evaluation

Dependencies: S27, S11, S20, S16, S09. Requirements: R02, R03, R04, R08.

**Implement:** With approved accounts, consent and sandbox/authorized users, test real email auth, object storage, scanner, scheduled notification delivery and AI extraction/assistant. Run the labelled evaluation suite and spend-limit circuit breakers.

**Acceptance:** Provider credentials/processing terms documented without secrets. At least one real end-to-end scan/extraction/review/assistant flow and reminder delivery evidenced. Evaluation report names model/dataset/failures. A missing AI/scanning/auth provider blocks full release, not replaced with mock success.

**Evidence:** `docs/evidence/S28.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S29 — Owner/client UAT and release-candidate freeze

Dependencies: S26, S28. Requirements: R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12.

**Implement:** Run LAUNCH_CHECKLIST against the candidate. Obtain scope/design/content/privacy/health-definition approval and user acceptance from the named project owners. Record known limitations and handover material.

**Acceptance:** A new test owner completes all OWN journeys; invitee sees only scoped records; operator handles failures. Required reviewed guides and policy pages exist. Freeze commit/build and signed acceptance with no invented client approval.

**Evidence:** `docs/evidence/S29.md` plus relevant test/build artifacts; must not include private documents or secrets.


### S30 — Production release and handover

Dependencies: S29. Requirements: R11, R12.

**Implement:** After explicit release authorization deploy the frozen candidate and approved migrations, distribute signed builds through approved channels, verify production smoke tests, hand over client-owned accounts and runbooks.

**Acceptance:** Record production version/URLs/build identifiers, rollback/recovery steps, monitoring ownership and tested core flow with authorized records. Store submissions/approvals reported separately. Final report distinguishes released capabilities from deferred roadmap; no production claim before this gate.

**Evidence:** `docs/evidence/S30.md` plus relevant test/build artifacts; must not include private documents or secrets.

## 6. Deferred backlog — not an instruction to build now

| Future area | Source | Prerequisites before scheduling |
|---|---|---|
| Government/DigiLocker/utility connectors | PDF p2 and p5 | Provider access, jurisdiction coverage, consent, commercial terms and explicit scope approval. |
| Bill payment checkout | PDF p5 | Authorized payment arrangement, reconciliation/refunds/disputes design and approval. |
| Transact/draft/circle rates | PDF p7 | Reviewed jurisdiction data, legal templates, provenance and approved scope. |
| Full buyer/seller workflows and listings | PDF p3, p5, p7 | Transaction permissions, moderation, identity/evidence model and release approval. |
| Escrow/closing | PDF p5 | Separate authorized provider/legal/commercial design; do not hold funds by default. |
| Construction planning/materials/professionals | PDF p3 and p7 | Reviewed engineering content, actual local price sources, supply coverage and scope. |
| Floor-plan library | PDF p7 | Rights, safety/context warnings, architect review and scope. |
| Media/SEO scale | PDF p7 | Editorial source/review process, useful approved content and separate scope. |
| Enterprise finance/insurance | PDF p4–5 | Partners, data-consent boundaries, regulatory/commercial review and scope. |

The PDF has two different phase sequences. D-001 retains that conflict. Do not arbitrarily renumber the future roadmap or treat all rows as included in the current fee.

## 7. Completion record template

```text
Task:
Status change:
Date/time:
Branch/commit, if any:
Requirement IDs:
Implementation summary:
Files changed:
Commands and actual results:
Device/provider/environment evidence:
Acceptance criteria met:
Remaining limitations / blockers:
Decision references:
Next eligible task:
```

## 8. Current next action

**Current next executable task: T02 deal-room invitation/accept/revoke/projection grants (needs OA13 field semantics — recorded in docs/OWNER_ACTIONS.md, not invented) with connected multi-party acceptance; T01 native PDF/browser-save acceptance when an unlocked browser is available.** T02 import executor is DONE and tested (migration-backed lineage, explicit confirmation, idempotent resume, fresh-scan copies, no grants/transfers; evidence docs/evidence/T02_IMPORT.md). Do not repeat completed S00–S30, O01 or erasure fault drills. S23/S24 remain IN_PROGRESS; owner decisions stay consolidated in `../docs/OWNER_ACTIONS.md`. Complete milestones only against their actual code/content/provider/browser/device/release criteria.

## 9. Latest completion record

Task: S00 - Repository discovery and requirements mapping
Status change: READY -> DONE
Date/time: 2026-09-11 Asia/Kolkata
Branch/revision: `main` / `83232ca` at discovery; working tree remains dirty and pre-existing edits were preserved
Requirement IDs: R01, R10
Implementation summary: Inspected the actual Next.js repository, source documents, starter-pack specifications, routes, state model, environment surface, scripts, and local runtime. Rendered and reviewed PDF pages 6-7. Identified the client-only seeded prototype and missing server/auth/database/worker/provider layers. Continued into a bounded local foundation batch per the completion runbook.
Evidence: `docs/REPO_AUDIT.md`, `docs/evidence/S00.md`, `docs/SUKOON_AUDIT_REPORT.md`, `artifacts/sukoon-audit/`
Acceptance: Repository and scope are mapped with actual commands and explicit unknowns. No production or full OWN completion claim is made.
Next eligible task: S02 database foundation, followed by S03 authentication and S04 authorization.

Task: S01 - Workspace, dependency lock and reproducible commands
Status change: IN_PROGRESS -> DONE
Date/time: 2026-09-11 Asia/Kolkata
Branch/revision: `main` / `83232ca` at discovery; working tree remains dirty and pre-existing edits were preserved
Requirement IDs: R11
Implementation summary: Retained the existing Next.js web stack, added documented local development and verify scripts, added a secret-free CI check, recorded engineering decisions, completed `npm ci`, and verified lint/typecheck/build plus local server startup and restart persistence.
Evidence: `docs/evidence/S01.md`, `docs/DECISIONS.md`, `.github/workflows/verify.yml`, `artifacts/sukoon-audit/local-foundation-checks.txt`
Acceptance: The applicable web workspace installs and verifies from the checked-in lockfile; missing mobile/worker/database/provider surfaces are explicitly excluded and recorded. No production or full OWN completion claim is made.
Next eligible task: S02 database foundation, followed by S03 authentication and S04 authorization.

Task: S02-S04 - Database, authentication and resource authorization foundation
Status change: TODO -> DONE LOCAL
Date/time: 2026-09-11 Asia/Kolkata
Branch/revision: `main` / `83232ca` at discovery; working tree remains dirty and pre-existing edits were preserved
Requirement IDs: R01, R06, R07, R11, R12
Implementation summary: Added Prisma 7.10/PostgreSQL schema and checked-in migration with user/workspace ownership, composite child foreign keys, timestamps/version fields, exact paise money columns, document metadata separate from local development bytes, idempotency/consent/outbox foundations, and preserved OWN domain tables. Added Better Auth 1.7.4 email OTP with hashed verification records, persisted HTTP-only cookie sessions, sandbox mailbox in local/test only, and sign-out revocation. Replaced active JSON-session/domain routes with a workspace-scoped transactional repository and centralized owner authorization; unknown cross-workspace property/document IDs return non-leaking 404 responses. Added unit, real-Postgres integration, auth, authorization, restart, and migration safety checks.
Evidence: `docs/evidence/S02.md`, `docs/evidence/S03.md`, `docs/evidence/S04.md`, `docs/DECISIONS.md`, `README.md`
Acceptance: Isolated local and test databases migrated successfully; unit and integration suites pass; live HTTP owner -> property -> synthetic document -> sign-out/in -> persistence -> second-user empty/guessed-ID denial journey passes. Production email, object storage, scanner, worker, recovery, staging, and deployment remain unverified and blocked.
Next eligible task: S05 native design primitives/reference assets, then S07 typed Property Passport mutations.

Task: S05-S08 - Design primitives, category shell, Property Passport and durable worker/provider boundaries
Status change: TODO -> DONE LOCAL
Date/time: 2026-09-11 Asia/Kolkata
Branch/revision: `main` / `83232ca` at discovery; working tree remains dirty and pre-existing edits were preserved; no commit created
Requirement IDs: R01, R02, R04, R06, R10, R11
Implementation summary: Added shared semantic UI primitives and an internal design-system gallery while preserving the existing SUKOON composition; wired the four category-first home routes and profile/archived-state navigation to real app state; implemented typed Property Passport create/list/edit/archive/restore APIs and UI with required jurisdiction/location/type/name/address/area, self-asserted ownership provenance, identifiers, purchase facts, optimistic versions, append-only field history and child retention; extended the PostgreSQL outbox into a leased durable worker with bounded retries, terminal dead-letter state, idempotency/correlation keys, sanitized errors, graceful shutdown and unique effect recording; added explicit local/test/sandbox/unconfigured provider ports and production fail-closed validation.
Files changed: `app/globals.css`, `app/page.tsx`, `app/properties/page.tsx`, `app/profile/page.tsx`, `app/property/new/page.tsx`, `app/property/[id]/page.tsx`, `app/more/design-system/page.tsx`, `app/api/properties/`, `app/api/health/`, `components/ui.tsx`, `lib/navigation.ts`, `lib/property-repository.ts`, `lib/providers.ts`, `lib/worker.ts`, `prisma/schema.prisma`, `prisma/migrations/20260911141200_s05_property_history_s08_jobs/migration.sql`, `scripts/worker-crash-fixture.ts`, `tests/unit/`, `tests/integration/`, `docs/evidence/S05.md`–`S08.md`
Commands and actual results: `npm run db:generate` PASS; isolated `npm run db:migrate:deploy` PASS; `npm run db:status` PASS; `npm run lint` PASS; `npm run typecheck` PASS; `npm run test:unit` PASS (2 files / 6 tests); `npm run test:integration` PASS (5 files / 12 tests); serial `npm run test:auth` PASS; `npm run test:authorization` PASS; `npm run build` PASS; final `npm run verify` PASS with the 6-test unit suite; `GET /api/health` returned honest local HTTP 503/degraded status; browser owner create/edit/archive and cross-user denial PASS locally.
Device/provider/environment evidence: local browser at `http://localhost:3100`; isolated local/test PostgreSQL only; actual child worker exit/reclaim fixture passed; no paid provider, credential, staging, production, real property document or real external delivery used.
Acceptance: S05-S08 local acceptance criteria are met. Formal owner visual approval, real-device evidence, production provider acceptance, backup/restore and staging/production remain open. No production or full OWN completion claim is made.
Evidence: `docs/evidence/S05.md`, `docs/evidence/S06.md`, `docs/evidence/S07.md`, `docs/evidence/S08.md`
Decision references: D-019 through D-023 in `docs/DECISIONS.md`
Next eligible task: S09 private upload, vault and protected preview.
