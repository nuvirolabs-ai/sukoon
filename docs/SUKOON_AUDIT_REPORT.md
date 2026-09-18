# Sukoon V1 evidence-led audit report

Date: 2026-09-12 (Asia/Kolkata)

## Executive result

Current status: **NOT READY**.

Local scanning/navigation continuation (2026-09-12): existing MalwareScanPort/worker now use the approved opt-in ClamAV 1.5.4 adapter and immutable version-linked scan-attempt audit records, with a manual category review path independent of AI. Official signatures are current under the documented local policy; the real clean owner/architect acceptance used a fresh synthetic PDF and genuinely scanned bytes. The Codex PDF viewer blocked direct rendering, and browser Back/Forward control calls timed out after expected URL/page states rendered; expiry-specific history remains open. See `evidence/LOCAL_SCANNING.md`, `LOCAL_SCANNER_STARTUP.md` and `CONSTRUCTION_ACCEPTANCE.md`. Final checks: 71 integration, 25 unit, lint/typecheck/build pass; saved completed Construction review remains preserved.

Construction update (2026-09-12): **LOCAL FEATURE COMPLETE** for the explicitly approved manual-first Construction OS foundation, not production ready. Persistent projects/17-stage roadmap/tasks, scoped Vault/checklists, canonical cost accounting, materials/entered prices/procurement, manual contacts, updates/reminders/timeline, search/assistant/sharing and owner handover replace the former Construction future landing page. See `CONSTRUCTION_OS.md` and `evidence/CONSTRUCTION.md`. Earlier S22 placeholder observations below are historical, superseded by this scope approval. S23–S30 remain TODO.

The repository now has a working local development foundation for a transactional PostgreSQL/Prisma Property Passport state, maintained Better Auth email OTP sessions, centralized owner authorization, a private versioned PDF/JPEG/PNG vault, bounded text parsing with a separate OCR job/record boundary, fixture-backed source review, controlled typed content rules, explainable record-readiness snapshots, manual obligations/occurrences, manual payment/receipt/ledger records, durable reminder scheduling/preferences, maintenance history/timeline, and identity-bound capability sharing. That is useful local evidence for continued implementation, but it is not production email delivery, production object storage, production malware-scanning operations, OCR, live Document AI, production notification delivery, payment processing/reconciliation, reviewed legal/content approval, or complete OWN release.

The current local run address is `http://localhost:3100` when started with the documented local command. PostgreSQL stores domain state and document metadata. The development byte adapter writes to `SUKOON_DATA_DIR` (default `.data/`); `.data/` is ignored and must not be treated as a backup or deployment store.

## Environment and repository evidence

| Item | Observed result |
|---|---|
| Repository | `/Users/tanutejas/Documents/Sukoon` |
| Branch/revision at discovery | `main` / `83232ca` |
| Working tree | Dirty before work; existing changes preserved |
| Framework | Next.js `16.3.4` App Router, React `19.2.8`, TypeScript, Tailwind CSS |
| Root master plan | Missing; active copy is `Sukoon_Agent_Starter_Pack/SUKOON_MASTER_PLAN.md` |
| Database/migrations | Local DONE: Prisma 7.10 migrations applied to isolated local and test PostgreSQL databases; 13 migrations current |
| Worker/queue | Local durable PostgreSQL worker implemented; production dispatch/operations not configured |
| External email/storage/AI/reminder providers | Not configured or verified; local Better Auth and sandbox mailbox are development/test only |
| Local server | Started successfully at `http://localhost:3100` |
| Mobile app/device | Missing / not tested |
| Production/staging | Not tested; no deployment evidence |

Initial and after-batch command results are recorded in `docs/REPO_AUDIT.md` and `artifacts/sukoon-audit/baseline-checks.txt`.

## What changed in this batch

- Replaced seeded sample account data with an empty first-run state in `lib/store.ts`.
- The earlier local email-identified JSON-session adapter remains only as historical checkpoint material; it is no longer active in the API.
- The active `app/api/state/route.ts` path derives the owner from Better Auth and persists through the PostgreSQL repository, filtering child records to the server-owned workspace/property set.
- Reworked `components/StoreProvider.tsx` and `lib/client-store.ts` to load/persist state through the server, retain the existing UI shell, and support sign-out.
- Added local private document storage in `app/api/documents/route.ts` and authenticated retrieval/removal in `app/api/documents/[id]/route.ts`. Uploads allow only PDF/JPEG/PNG, cap files at 25 MB, check signatures, generate storage keys, and set `awaiting_review` rather than fabricating extraction.
- Updated the property setup/vault paths to use the upload boundary and show a truthful awaiting-review state.
- Changed the health display so an empty property is `NOT_ASSESSED`; a non-empty provisional result is labelled `record readiness`, based only on document coverage. It is not legal, tax, title, or structural certification.
- Removed seeded future updates and rate-table output from the visible Updates/Guideline surfaces and marked Buy/Sell publishing as deferred.
- Removed hard-coded construction, dealer, engineer, floor-plan, vendor, drafting, and live listing fixtures from the visible deferred routes. Those routes now state that the capability is not live.
- Removed the fake UPI destination, paid-plan/referral promises, automated-notification wording, and unqualified guide claims. Manual payment state is labelled self-reported and the buyer checklist is labelled a discussion aid, not approval.
- Added repository, evidence, audit, and remaining-work documentation.
- Added Prisma 7.10 schema/migration for Better Auth, workspaces, OWN records, exact paise money columns, timestamps/version fields, composite tenant foreign keys, consent/idempotency/outbox foundations, and preserved deferred-domain concepts.
- Replaced the active JSON session/state path with Better Auth 1.7.4 email OTP, PostgreSQL-backed users/sessions/verifications, a local/test-only sandbox mailbox, and a version-guarded PostgreSQL transaction for the existing UI state contract.
- Added centralized owner authorization for session, state, document metadata, and private-byte retrieval/removal. Cross-workspace guessed property/document IDs return non-leaking 404 responses; client workspace/user IDs are ignored.
- Added unit, real-Postgres foundation, auth, and direct API authorization tests plus a test runner that refuses non-isolated test database names.
- Added S05 shared semantic tokens/primitives, responsive sheet and internal design-system gallery while preserving the existing approved visual direction; formal owner visual approval remains pending.
- Added S06 category-first navigation for Vault, Construction, Buy / Sell and Updates, plus real profile and archived-property routes without fake records, rates, listings or alerts.
- Added S07 typed Property Passport create/list/edit/archive/restore APIs and UI with required jurisdiction/location/type/name/address/area, self-asserted ownership provenance, identifiers, purchase facts, optimistic versions, append-only field history and retained children.
- Added S08 durable `OutboxEvent` job states, PostgreSQL lease claims, retry/dead-letter behavior, idempotency/correlation keys, sanitized errors, unique `JobEffect` effect records, graceful shutdown, explicit provider ports and production fail-closed provider validation.
- Added S09 private vault metadata/version models, SHA-256 integrity, server-generated storage keys, local `ObjectStoragePort` bytes, categories, quarantine/scan states, protected preview/download, replacement versions, archive/restore/delete behavior and non-leaking owner authorization.
- Added S10 maintained `pdf-parse@2.4.5` text-PDF parsing with 50-page bounds, page/chunk anchors, corrupt/empty handling, separate durable `DocumentParsingRun` and `DocumentOcrRun` records, and an explicit `OCR_DOCUMENT` stage. No OCR binary or external OCR provider was installed or called.
- Added S11 schema validation, fixture-only AI classification/extraction with source evidence, proposal accept/edit/reject and partial application, user-confirmed Property History provenance, optimistic version conflicts, and prompt-injection-as-document-content tests. No live AI provider was called.
- Added S12 global versioned `ChecklistRule` content with neutral taxonomy, typed applicability, DRAFT/IN_REVIEW/PUBLISHED/EXPIRED/RETIRED transitions, source/reviewer/review-date publication gates, supersession and audit events. Only the explicit operator role can edit/publish; operator access does not grant a private workspace or vault.
- Added S13 immutable `AssessmentSnapshot`/`AssessmentItem` record-readiness evaluation from the Property Passport, active clean/confirmed vault evidence and published applicable checklist rules. It preserves `SATISFIED`, `MISSING`, `UNKNOWN`, `NOT_APPLICABLE` and `NEEDS_REVIEW`, uses C/N with unknown excluded, returns `NOT_ASSESSED` when no rule applies, and displays item explanations/source traceability.
- Added S14 property-linked manual obligations and unique recurring occurrences for PAYABLE, RECEIVABLE and NON_FINANCIAL records. Currency/timezone are explicit, dates are date-only, month-end/leap-year day clamping is deterministic, source is user-entered, and reminder configuration is stored without dispatch.
- Added S15 manual payment records and deduplicated expense ledger entries using integer paise, server-computed outstanding balances, partial/multiple/full payments, stale conflicts, idempotency, protected clean vault document/version receipt links and explicit reversal/correction rows. No gateway or bank provider was connected.
- Added the connected synthetic S12-S15 integration journey: authenticated S09-S11 upload/processing/review, published synthetic rule, health gap explanation, ₹18,450 obligation, ₹10,000 partial, ₹8,450 receipt-linked completion, timeline/history, explicit PostgreSQL disconnect/reconnect re-read, concurrent stale-write proof and User B denial.
- Added S16 durable reminder rows and attempt history with date-only local-time scheduling, recurring-horizon reconciliation, edit/payment/archive cancellation, read/unread/snooze/dismiss, workspace channel preferences, restart-safe worker leases, in-app delivery, sandbox email capture, unavailable-push retry and in-app fallback. No external notification provider was connected.
- Added S17 owner-scoped maintenance records with controlled OPEN/PLANNED/IN_PROGRESS/RESOLVED/CANCELLED lifecycle, optimistic versions, correction/reopen events, provider/contact and cost fields, clean same-property document links, maintenance-linked obligations, payment-linked expense deduplication, summaries and timeline entries.
- Added S18 authenticated identity-bound invitations with hashed high-entropy tokens, role/capability presets, selected clean-document scopes, recipient-bound acceptance, replay/expiry/revocation handling, shared projections, scoped document/health access and queued-operation output suppression after revocation. No permanent unauthenticated share URL or live invite delivery was added.
- Added S19 workspace-private PostgreSQL search projections for active property records and active clean/confirmed document versions with approved parsing text/chunks. Owner search covers properties, documents, obligations and maintenance; shared search reconciles the owning projection and applies active capability/document scopes before results, snippets or counts. Archive/delete/review changes are reflected and no public/global private index exists.
- Added S20 server property-scoped assistant retrieval with deterministic integer-paise obligation and canonical maintenance-ledger calculations, resolving citations/deep links/page/chunk anchors, explicit uncertainty/read-only/no-write behavior, input/context/rate/timeout/cancel metadata, prompt-injection-as-evidence handling and output-time revocation suppression. It reports `fixture_test_only` in tests or `unavailable_local` locally; no live model or raw prompt/answer persistence exists.
- Added S21 selected export preview/confirm, durable PostgreSQL package/item state, `GENERATE_EXPORT` worker jobs, deterministic ZIP manifest/provenance, source and artifact SHA-256 integrity, authenticated temporary download, expiry cleanup and authorization rechecks before generation, after storage and at download. Delegate export requires explicit `DOCUMENT_EXPORT`; revoke suppresses and cleans output.
- Added S22 server-backed Home/Updates owner/shared projections and current published education filtering. Guides and Buy/Sell no longer render draft seed content; Construction and marketplace routes stay honest future states while remaining reachable. The connected S19-S22 journey covers search → assistant → export → Updates/Home → revoke → restart.

## Scope status matrix

| Requirement | Route/action | Code path | Persistence/permission evidence | Status | Priority / next action |
|---|---|---|---|---|---|
| Account and access | Sign-in, sign-out | `components/StoreProvider.tsx`, `lib/client-store.ts`, `lib/auth.ts`, `app/api/auth/[...all]/route.ts`, `app/api/session/route.ts` | Better Auth OTP sign-in; PostgreSQL user/session/verifications; HTTP-only cookie; hashed OTP and invalid/revocation tests | **Partial / local PASS** | P1: approved production email, edge rate limits, recovery/support, profile/consent/session-device controls |
| OWN-01 Property Passport | Create/list/edit/archive/restore | `app/property/new/page.tsx`, `app/properties/page.tsx`, `app/property/[id]/page.tsx`, `app/api/properties/`, `lib/property-repository.ts`, `lib/repository.ts` | Typed fields and history persisted in PostgreSQL; optimistic version conflict, archive child retention, restart persistence and user 2 denial are tested | **Partial / local PASS** | P1: narrow child-resource APIs, retention/deletion policy and reviewed ownership semantics |
| OWN-02 Smart Vault | Choose category, upload, open, remove | `app/api/documents/route.ts`, `app/api/documents/[id]/route.ts`, `lib/vault-repository.ts`, `VaultTab` in `app/property/[id]/page.tsx` | PostgreSQL metadata/version rows and private adapter bytes; clean-only preview/download; SHA-256 check; valid PDF/JPEG/PNG, mismatch/unsupported/oversize/zero/path/idempotency/replacement/archive/delete/corruption tests; user 2 guessed doc returns HTTP 404; approved local ClamAV clean/failure evidence recorded per version | **DONE LOCAL / not production** | P0: approved production object store and production scanner operations; local scanner-unavailable state remains fail-closed |
| OWN-02 Document parsing/OCR | Extract source text | `lib/document-parsing.ts`, `lib/document-processing.ts`, `DocumentParsingRun`, `DocumentOcrRun` | Text PDF fixture has page/chunk anchors; empty/corrupt PDF outcomes are durable; image parse falls through to separate OCR record; OCR is honest `unavailable` locally | **DONE LOCAL / OCR blocked** | P1: approved bounded OCR binary/provider, rotated-scan/password fixture acceptance and consent/retention policy |
| OWN-02 Document AI | Review extraction | `lib/providers.ts`, `lib/document-review.ts`, `app/api/documents/[id]/review/route.ts`, `DocumentReview` in `app/property/[id]/page.tsx` | Fixture response schema validation, source page/chunk evidence, prompt-injection fixture, accept/edit/reject/partial apply, user-confirmed history and stale-version conflict pass; no generic verified status | **DONE LOCAL / fixture only** | P1/P0: approved live provider, consent, limits, evaluation and S28 acceptance |
| OWN-03 Bills/reminders | Add manual obligation, inspect occurrence views, record payment | `lib/obligations.ts`, `lib/payments.ts`, `lib/durable-reminders.ts`, `app/api/obligations/`, `app/api/payments/`, `app/api/reminders/`, `ObligationsPanel` | Property-linked obligations/occurrences and manual payment/ledger rows persist in PostgreSQL; durable reminders reconcile recurring horizons, cancel obsolete alerts, preserve attempt state and honor channel preferences; in-app, sandbox-email and unavailable-push fallback tests pass | **DONE LOCAL / provider gate** | Approved email/push provider, live delivery, checkout/reconciliation and notification policy remain open |
| OWN-04 Property Health | View explainable record readiness | `lib/rules.ts`, `lib/assessment.ts`, `app/api/properties/[id]/health/`, `HealthAssessmentPanel` | Published typed rules, immutable snapshots/items, source/reviewer traceability, C/N, unknown/missing/needs-review/not-applicable states and cross-user filtering pass; no applicable published rule is `NOT_ASSESSED` | **DONE LOCAL / reviewed content open** | Approve the real checklist/algorithm/evidence policy; retain certification caveat |
| OWN-05 Maintenance/timeline | Record service/event | `lib/maintenance.ts`, `app/api/maintenance/`, `MaintenancePanel`, timeline repository | Owner-scoped maintenance rows persist with lifecycle/version/event history; clean same-property document links and a single payment-linked ledger effect are tested; no external provider completion is inferred | **DONE LOCAL / policy open** | Broader retention/deletion, concurrent correction, reviewed service semantics and operator diagnostics remain open |
| OWN-06 Controlled sharing | Create/preview/revoke | `lib/sharing.ts`, `lib/authz.ts`, `app/api/properties/[id]/shares/`, `app/api/shared/`, `ShareLink`/`ShareLinkScope` | Authenticated invitee binding, hashed token, explicit capability/document scope, replay/expiry/revoke, shared projections, direct-document checks and queued-job output recheck pass; no permanent unauthenticated link | **DONE LOCAL / provider and policy gate** | Live invite delivery, reviewed role/retention policy and production export policy remain open |
| OWN-07 Property-scoped assistant | Ask passport | `components/Assistant.tsx`, `lib/assistant.ts`, `app/api/assistant/`, `AssistantRequest` | Server retrieval is property-scoped and owner/shared-authorized; deterministic obligation/ledger answers, document citations, read-only boundary, prompt-injection isolation, rate/timeout/cancel metadata and revoke suppression pass | **DONE LOCAL / live AI gate** | Approved live AI provider, consent/region/retention, evaluation and cost policy remain open |
| OWN-08 Buyer education | Guides/current content | `app/guides`, `lib/education.ts`, `app/api/education/`, `app/buy-sell/page.tsx`, `EducationContent` | Only current `PUBLISHED` rows with source/reviewer/effective/expiry metadata are exposed; draft/expired rows remain hidden; synthetic current row is integration-tested | **DONE LOCAL / reviewed corpus gate** | Human-approved launch corpus, jurisdiction policy and content operations remain open |
| OWN-09 Search and export | Search, preview/confirm/download | `lib/search.ts`, `lib/exports.ts`, `lib/zip.ts`, `app/api/search/`, `app/api/exports/`, `SearchProjection`/`ExportPackage`/`ExportPackageItem` | Workspace-private projections, scoped delegate counts/snippets, archive/delete freshness, selected ZIP manifest/source hashes, worker replay, expiry and revoke-during-generation/download tests pass | **DONE LOCAL / provider and retention gate** | Production index/object storage, cleanup operations, retention/deletion policy and staging remain open |
| OWN-10 Integrated Home/Updates | Home, Updates, Buy/Sell, Construction | `lib/home.ts`, `lib/updates.ts`, `app/api/home/`, `app/api/updates/`, category pages | Owner/shared real-data projections, current education filtering and connected cross-surface/restart proof pass; no public listings, prices, news or fake government data | **DONE LOCAL / device and content gate** | Device/accessibility/design approval, approved content and staging remain open |
| Supporting operations admin | Failed jobs/provider/content diagnostics | No admin route found | No operator surface exists | **Missing** | P1: redacted operator diagnostics and retry/audit controls after durable job foundation |
| S08 worker/provider boundary | Durable jobs and provider ports | `lib/worker.ts`, `lib/providers.ts`, `app/api/health/`, `prisma/schema.prisma`, `scripts/worker-crash-fixture.ts` | PostgreSQL claim/reclaim, bounded retry/dead-letter, idempotency and unique effect tests; local adapters are explicit and production rejects non-remote bindings | **Partial / local PASS** | P0/P1: production queue operations, real storage/scanner/email/push/parser/AI/connectors, backup/restore and operator runbooks |
| Construction OS expansion | Construction + Property Passport | `lib/construction.ts`, `lib/construction-template.ts`, `components/ConstructionOS.tsx`, `app/api/construction/` | Persistent planning-to-owner-handover; 17 focused integration tests; capability-filtered architect access; canonical accounting; real browser restart | **DONE LOCAL** | No market rates, engineering/legal certification, professional verification, production storage/scanning, staging or device/UAT claim |
| Future categories | Public Buy/Sell, Guideline and external marketplace/provider services | `app/buy-sell`, `app/guideline`, provider boundaries | Deferred external capabilities remain labelled unavailable; no invented listings/rates | **Deferred** | Construction manual-first foundation is now approved; external scope/data approvals still required |

## Connected journey result

| Step | Evidence result | Notes |
|---|---|---|
| Sign in | **PASS - local** | Better Auth email OTP; sandbox delivery only; HTTP-only persisted session cookie |
| Create Property Passport | **PASS - local** | Synthetic property written through the PostgreSQL-backed state transaction |
| Upload document | **PASS - local** | Synthetic PDF/JPEG/PNG metadata/version rows stored in PostgreSQL and bytes stored separately through the private local adapter; all files begin quarantined |
| Scan → parse → OCR → AI → review | **PASS - local/test boundary** | Test-only scanner clean result drives durable stages; text PDF reaches fixture proposals; image and empty-text paths record OCR unavailable; real scanner/OCR/live AI were not exercised |
| Review extraction | **PASS - local fixture** | Owner sees source-backed proposals and can accept/edit/reject; accepted fields are recorded as user-confirmed, not government verified |
| Add obligation/occurrences | **PASS - local/manual** | S14 property-linked PAYABLE/RECEIVABLE/NON_FINANCIAL records, date-only one-time/monthly/quarterly/yearly cycles, month-end/leap handling and Upcoming/Overdue/Completed/All UI passed; reminder configuration is stored only |
| Record payment/receipt | **PASS - local/manual** | S15 ₹18,450 partial/multiple payment journey passed with integer paise, protected clean receipt document/version link, outstanding balance, idempotency, stale conflict and explicit reversal correction; no gateway/reconciliation |
| Record maintenance | **PASS - local** | S17 create → plan/progress → resolve → reopen/correct, same-property clean invoice/warranty links, maintenance-linked payment/ledger deduplication, event ordering and User B denial passed |
| Inspect score/history | **PASS - local/synthetic rules** | S13 published-rule assessment shows C/N, missing/unknown/needs-review explanations, source/reviewer traceability and immutable history; no approved legal/health corpus |
| Search private records | **PASS - local authorized projection** | Owner search returned approved property/document/record matches; shared search reconciled the source workspace, withheld hidden counts/text, and returned only current capability-authorized results/deep links |
| Ask assistant | **PASS - deterministic local** | Server retrieved the selected property only, matched obligation/ledger totals, returned citations/page-chunk anchors, rejected write language and suppressed delegate output after revocation; no live model was called |
| Export selected records | **PASS - local durable worker** | Preview → confirm → `GENERATE_EXPORT` → manifest ZIP → authenticated download passed with exact selected bytes, source/version/hash provenance, replay-safe job and expiry/revoke cleanup |
| Home/Updates/education | **PASS - local projections** | Owner and shared Home/Updates projections showed actual reminders/maintenance/timeline boundaries; current published education was visible while draft/expired rows were hidden; marketplace/construction remained future state |
| Share selected document | **PASS - local identity-bound** | Synthetic lawyer invite required the invited authenticated identity, exposed only selected clean document metadata/bytes through capability checks, withheld bills/maintenance/owner fields, and denied guessed hidden records |
| Revoke access | **PASS - local immediate** | Revocation removed active shared projections/direct access and suppressed a queued shared operation at its output boundary; expiry and replay were also tested |
| Second-user denial | **PASS - tested for state and document** | User 2 saw zero records; guessed property write and document request returned non-leaking HTTP 404 |
| Refresh/restart persistence | **PASS - PostgreSQL re-read** | The S12-S15 journey explicitly disconnected and reconnected Prisma before re-reading the completed occurrence; earlier dev-server restart also preserved owner state; this is not backup/restore evidence |
| Worker crash/reclaim | **PASS - local** | Child process exited after a PostgreSQL claim; a restarted worker reclaimed the expired lease and one unique `JobEffect` remained |

## Security and honesty findings

Resolved in this batch:

- New accounts no longer receive seeded properties, bills, tenants, listings, or projects.
- Server state is partitioned by an HTTP-only session-derived user; the client cannot select a workspace/user id for the state endpoint.
- Property children are filtered against the server's current property set.
- Document retrieval checks authentication, document membership, the user-prefixed storage key, path containment, and `no-store` caching.
- File declarations are checked against PDF/JPEG/PNG signatures and size limits.
- Health is now explicitly `NOT_ASSESSED` without applicable published rules; rule-backed readiness is explainable and evidence-driven, and verification/extraction is not claimed for new uploads.
- Future rates/editorial updates/listings are no longer shown as live new-account data.

Still open:

- The local JSON/session adapter is no longer active; the current UI-compatible PUT is a transitional whole-state PostgreSQL transaction. A production API must expose typed, narrow mutations with idempotency and CSRF/origin protections.
- Local PostgreSQL persistence is not a tested backup/restore system or managed production database.
- There is no malware scanner; the local adapter only performs signature checks and therefore must not be treated as a production clean scan.
- No local OCR binary/provider was available; `DocumentOcrRun` records `unavailable` without overwriting parser evidence or serving unverified bytes.
- The fixture AI adapter is deterministic and explicitly test-only; it never represents live AI or confidence and document text is treated as untrusted content.
- The legacy client bill path remains transitional; Home/Updates/assistant/search/export now use narrow server projections. The new assistant/search/export paths are local-only and still require approved provider, retention, operator and staging evidence.
- Better Auth is configured locally, but external email delivery, production secrets, profile/consent UX, and device/session management remain open.
- No production auth, storage, AI, notification provider, staging, mobile, device, accessibility, monitoring, backup/restore, or release evidence exists. S16 local delivery states are not live notification acceptance.
- Provider capabilities are explicit: local/test storage, sandbox email, and unavailable scanner/push/parser/AI/connector adapters never claim external success; production configuration fails closed unless all bindings are remote. `/api/health` exposes redacted capability state and reports local unconfigured capabilities as degraded.

## Commands and observed results

- `npm run lint`: PASS with no errors or warnings.
- `npm run typecheck`: PASS.
- `npm run test:unit`: PASS; 25 tests across 3 files, including scanner protocol/header/hash and provider/worker helpers.
- `npm run test:integration`: PASS; 10 files / 71 tests against isolated PostgreSQL, preserving the OWN regressions and Construction cases. Includes auth, composite-FK, Property Passport, worker crash/reclaim/effect, API authorization, Vault, rules/health/bills/payments, reminders/maintenance/sharing, search/assistant/exports/Home/Updates and Construction.
- `npm run test:integration -- tests/integration/construction.test.ts`: PASS; focused Construction suite, including the approved document/review/security boundaries. See `evidence/CONSTRUCTION.md` for the connected journey, negative cases and fixture boundaries.
- `npm run test:integration -- tests/integration/s19-s22.test.ts`: PASS; 1 file / 8 focused S19-S22 tests.
- `npm run test:integration -- tests/integration/s16-s18.test.ts`: PASS; 1 file / 10 focused S16-S18 tests.
- `npm run test:auth`: PASS; focused isolated PostgreSQL authentication suite.
- `npm run test:authorization`: PASS; focused isolated PostgreSQL authorization suite.
- `npm run build`: PASS; Next retains the two expected local object-byte filesystem tracing warnings for `lib/providers.ts` and `lib/server-store.ts`.
- `npm run verify`: PASS after scanner/navigation continuation; lint, typecheck, 25 unit tests in 3 files, 71 integration tests in 10 files and optimized build. The build retains the two existing local object-byte tracing warnings.
- `npm ci`: PASS; npm reported four high toolchain advisories. No `npm audit fix --force` was run.
- `npm run db:migrate:deploy`: PASS for isolated local/test databases; 15 migrations current, including the additive document scan evidence migration.
- `npm run db:status`: PASS; database schema is up to date.
- `git diff --check`: PASS.
- `GET /api/health`: local server remains a degraded local capability boundary; ClamAV is selected and runtime-evidence based, while push, OCR/parser, live AI and connector providers remain unconfigured.
- Browser: `http://localhost:3100` opened; sign-in, create, property persistence, upload, authenticated open, second-user isolation, spoof rejection, and sign-out were exercised.
- API: owner state returned 1 property/1 document before and after a dev-server restart; the focused S12-S15 suite also reconnected Prisma before reading a completed occurrence; user 2 returned 0 properties/0 documents; user 2 document guess HTTP 404; guessed property write HTTP 404; spoof upload HTTP 400; unauthenticated state HTTP 401.
- Session: HTTP sign-in returned a `better-auth.session_token` cookie marked `HttpOnly`; sign-out returned deletion headers and removed the persisted session row.
- Production guard: local, sandbox and unconfigured provider bindings are rejected when production is selected; no external email transport, paid provider, credential, staging or production deployment was configured or claimed.

## Evidence locations

- `docs/CONSTRUCTION_OS.md`
- `docs/evidence/CONSTRUCTION.md`

- `docs/REPO_AUDIT.md`
- `docs/evidence/S00.md`
- `docs/evidence/S01.md`
- `docs/evidence/S02.md`
- `docs/evidence/S03.md`
- `docs/evidence/S04.md`
- `docs/evidence/S05.md`
- `docs/evidence/S06.md`
- `docs/evidence/S07.md`
- `docs/evidence/S08.md`
- `docs/evidence/S09.md`
- `docs/evidence/S10.md`
- `docs/evidence/S11.md`
- `docs/evidence/S12.md`
- `docs/evidence/S13.md`
- `docs/evidence/S14.md`
- `docs/evidence/S15.md`
- `docs/evidence/S16.md`
- `docs/evidence/S17.md`
- `docs/evidence/S18.md`
- `docs/evidence/S19.md`
- `docs/evidence/S20.md`
- `docs/evidence/S21.md`
- `docs/evidence/S22.md`
- `docs/DECISIONS.md`
- `artifacts/sukoon-audit/baseline-checks.txt`
- `artifacts/sukoon-audit/local-foundation-checks.txt`
- `artifacts/sukoon-audit/synthetic-registry.pdf` (synthetic upload fixture)
- `artifacts/sukoon-audit/synthetic-spoof.txt` (synthetic negative fixture)

No private property documents, secrets, session cookies, or raw provider payloads were written to the report.
