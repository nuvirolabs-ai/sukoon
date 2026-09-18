# SUKOON — Decisions and Open Questions

## D-021 — R03_RENDER_STAGING_BLUEPRINT / COST_APPROVAL_REQUIRED — 2026-09-17

The current product must be pushed to a clean remote branch before Render can
use it. The repository has no configured remote, so no deployment source is
currently verified. The prepared Blueprint creates a separate Singapore
`sukoon-demo-staging` project and `demo-staging` environment with networking
isolation and permissions protection enabled, four services plus one paid
non-expiring Postgres database, and no preview environments. Migrations belong
only to the web pre-deploy command; the worker checks schema readiness and
fails closed.

The selected staging object store is official SeaweedFS Community Edition 4.47
(Apache-2.0), single-node `weed mini` on a 10 GB private Render disk. The
scanner is the official Cisco Talos ClamAV Debian image on a 5 GB private
signature disk. clamd is private-network restricted, has no inherent
authentication/encryption, and has no public endpoint; no app-level scanner
auth is added. Staging uses remote SMTP supplied by the owner, not the local
sandbox mailbox. Render's generated `RENDER_EXTERNAL_URL` is canonical for
the first health/auth check; the custom domain is a later cutover.

The estimate is $73.25/month before workspace, bandwidth, build, custom-domain
and SMTP charges. No billable resource, DNS, SMTP provider, deployment,
external message or production change is authorized until the owner approves
the cost table and supplies the genuinely required Git/Render/SMTP/DNS inputs.
Private files, local state, signatures, fixtures and secrets remain out of the
publication branch. This is client-demo staging, not production readiness.

## D-020 — MOTION_DEPENDENCY / NO_NEW_DEPENDENCY — 2026-09-15

The 2026 interaction pass uses zero new dependencies: the motion system is ~9 small components/hooks plus one CSS section (transform/opacity only, no backdrop-filter on content, capped stagger, rAF-throttled scroll observer). Rationale: the populated demo (3 properties, 19 documents, 17 stages/37 tasks, 76+ timeline events) scrolls with 0 longtasks; framer-motion/motion would add ~30–100KB JS for physics the pass does not need (springs are approximated with `cubic-bezier(0.32,0.72,0,1)`; direct manipulation is limited to sheet drag-to-dismiss and press compression). No package.json change. Revisit only if a future approved flow needs gesture-driven shared-element transitions that CSS cannot express.

## D-019 — SYNTHETIC_DEMO_CORRECTION / OWNER_REVIEW_PENDING — 2026-09-14

The synthetic demo seed may be corrected within the allowlisted local database and `.data` root without changing production/domain behavior, normal empty accounts, authorization code or the current UI. Money must cross the seed/domain boundary once; the normal S15 payment path, S12 rule review/publication flow, S13 assessment engine, existing ClamAV worker and S18 invitation/acceptance flow are required for evidence. The corrected local result is 3 properties, 20 workspace documents, 75 timeline events, 32% derived Construction progress, 83% synthetic-only readiness, four linked Construction documents and an accepted architect Construction grant with no budget/cost/contact access. Owner review remains open; this is not production scanning, OCR/AI, provider, device, deployment, release or final design approval. Evidence: `../../docs/DEMO_COMPOSITION_CORRECTION.md`.

## D-018 — CHAT_DIRECTION / OWNER_REVIEW_PENDING — 2026-09-14

Latest owner correction retains rich synthetic records, warm Sukoon cream/forest identity and consumer navigation. Summary-first must show useful amounts, project/material/site detail, received documents and questions, not empty menus. No reseed when records exist, no demo-specific UI constants. Batched owner read compositions and permission-scoped history pagination are acceptable; domain/security rewrites are not. Audit identifies pre-existing seed monetary/status/content inconsistencies and missing architect project scope. Do not silently normalize amounts/progress, invent approved checklists/docs, or grant access for screenshots. Evidence/approval gates: ../../docs/DEMO_COMPOSITION_CORRECTION.md.

## D-017 — CHAT_DIRECTION / OWNER_REVIEW_PENDING — 2026-09-14

The latest owner authorizes a consumer visual/information-architecture redesign, superseding older centered-banner/pastel-card presentation, not the SUKOON logo or product/security boundaries. Use system sans, neutral surfaces, summary-first navigation and contextual actions. Home/Properties/+/Explore/More remains; desktop uses a sidebar. Existing APIs, data, providers, saved reviews and dirty work are retained. No invented readiness/progress/obligations may improve a screenshot. This build is for owner review, not final design approval. Evidence and remaining UX debt: ../../docs/DESIGN_REDESIGN.md.

## Current implementation decision pointer — 2026-09-12 23:59 IST

Latest T01 evidence brief is applied under the existing all-phases mandate. Enforced owned-property XOR candidate Vault context, immutable context, separate real scan/manual classification/user review and exact-version history are recorded in `../../docs/DECISIONS.md` and `../../docs/evidence/O01_T01.md`. T02 read-only import preview grants no access/ownership/copy authority. Synthetic erasure proof does not change OA04. Existing source locks and production-release boundaries below remain; superseded Phase-1-only scheduling is not reinstated.

## Status vocabulary

SOURCE_LOCK = explicit product source direction.
CHAT_DIRECTION = latest explicit chat direction.
PROPOSED_DEFAULT = usable for reversible development, not claimed client approval.
NEEDS_APPROVAL = human approval required for a relevant gate.
OPEN = unresolved information.

No signature or client acceptance is supplied by this file.

| ID | Status | Decision / issue | Consequence |
|---|---|---|---|
| D-001 | SOURCE_LOCK / OPEN later order | PDF p6–7 locks launch to OWN; p5 and p7 later sequences differ. | Build OWN. Preserve two future roadmaps, do not silently reconcile or expand the contract. |
| D-002 | CHAT_DIRECTION | SUKOON, ESCAPE THE CHAOS, original infinity logo. | Use supplied logo; brand assets are separate from app data. |
| D-003 | CHAT_DIRECTION / NEEDS_APPROVAL final | Latest home reference centers logo in banner and retains four category cards. Prior no-image exploration is not the final selected frame. | Use latest reference initially; capture actual UI and obtain design sign-off before release. |
| D-004 | PROPOSED_DEFAULT | Expo mobile; Express API; Next web/admin; Prisma/Postgres; private object store; durable Postgres-backed worker; maintained auth. | Inspect existing repository and verify current versions before scaffold. Do not migrate compatible code merely to follow a default. |
| D-005 | PROPOSED_DEFAULT | Email OTP is initial sign-in; SMS/social sign-in not implicitly included. | Keeps phone delivery dependency out of initial local development. Verify provider/mobile compatibility. Change only with recorded direction. |
| D-006 | PROPOSED_DEFAULT / NEEDS_APPROVAL | Property Health V1 is a transparent record-readiness ratio with explicit caveat, not legal/structural certification. | Do not invent weights or promote upload counts into verified title health. Public definition needs approval. |
| D-007 | SOURCE_LOCK | Bills/reminders manual first; optional integration framework is not a working provider. | Self-reported payments, no fake checkout or government reconciliation. |
| D-008 | PROPOSED_DEFAULT | Future categories remain navigable but transparently limited; buyer education is real V1. | No inert buttons and no fake listings, material rates, news or paid consults. |
| D-009 | NEEDS_APPROVAL | AI, storage, scanner, email/push provider, region/retention and spend limits. | Implement ports and development fixtures; block public release until approved live integration evidence. |
| D-010 | OPEN / NEEDS_APPROVAL | Pilot jurisdiction and approved local guidance reviewer. Suggested starting context is Indore/MP from examples, not coverage already established. | Unknown contexts get organizer-only/not-assessed states. No local legal claims until reviewed. |
| D-011 | NEEDS_APPROVAL | Privacy policy, retention periods, delete/shared-record handling, operational owner and release acceptance. | Prepare implementation; no legal certification or publication by the agent. |
| D-012 | OPEN | Actual Sukoon repository location/state, package versions, signing accounts, provider access, clean hero/vector assets. | S00 discovers what exists. Never assume prior personal-project credentials or client data. |
| D-013 | PROPOSED_DEFAULT | iOS/Android consumer app plus operator web; no full consumer desktop parity, subscription checkout or unlimited AI entitlement in Phase 1. | Avoid uncontrolled expansion; future approved additions become new tasks. |
| D-014 | SOURCE_LOCK | All supplied legal/rate/quantity/timeline examples are examples, not a production database. | Draft-only seeds; no legal content auto-approval. |

## Decision record template

### D-015 — CHAT_DIRECTION — 2026-09-12

Root SUKOON_ALL_PHASES_MASTER_PROMPT.md and latest owner request supersede the earlier OWN-only scheduling boundary in D-001/D-008/D-013. Both source roadmaps are now authorized implementation scope; canonical plan retains S00–S30 and adds F/O/T/M/B/G/P/E/X/R IDs. Commercial terms, provider spend/private-data processing, real messaging/publication, platform choice, reviewed content and production release still require their specific approvals. No existing evidence or saved review data is discarded. Owner action register: ../../docs/OWNER_ACTIONS.md.

### D-016 — LOCAL_IMPLEMENTATION — 2026-09-12

Reuse existing content review/durable worker/private object storage for operations, withdrawal and scoped account records export. Local synthetic operator and disposable destructive test scope explicitly authorized by continuation; no real operator or live deletion authorized. Records-v1 excludes originals/derived output/operational payloads and is not a full statutory disclosure. Owner chooses artifact expiry; no legal retention term invented. OA04 gates live erasure policy, while synthetic erasure/tombstone/restore implementation remains eligible and unfinished. Short-session override may run only on a separate acceptance DB/loopback port. Evidence: ../../docs/evidence/OPERATIONS_PRIVACY_FULFILLMENT.md.

```text
ID:
Date:
Status:
Question / conflict:
Source evidence:
Options considered:
Decision:
Reason:
Owner/approver:
Affected requirements/tasks:
Migration/security/cost effect:
```

Reversible engineering choices can proceed with a rationale. Decisions affecting scope, privacy, legal content, cost, production or the accepted visual direction require the appropriate human approval. Missing external credentials should not stop independent local implementation.

## 2026-09-12 — Synthetic erasure/recovery and O01 continuation

Owner-authorized disposable erasure now has target/policy/ownership gates, an independent durable opaque instruction ledger, idempotent cleanup, DB/storage failure recovery and actual older-backup replay evidence. This supersedes the earlier "unfinished executor" status, not OA04: no live retention/deletion or full disclosure policy was inferred. Source/restored review targets remain isolated; historical backups are not physically expired by replay. S23/S24 remain IN_PROGRESS at their wider acceptance boundaries.

Continue O01 using existing property/history, sharing and obligation/reminder structures. Co-owner names do not grant access, manual balances are not lender feeds, and an insurance date does not create a payment or renewal. Explicit user-confirmed schedules use payload-bound idempotency. Keep both source roadmaps in the canonical queue; remaining O01 role/loan-schedule acceptance then T01 are eligible without renewed feature approval.
# O01/T01 implementation boundary — 2026-09-12

Prospects use buyer-controlled PurchaseWorkspace/Candidate/Entry models under the existing account Workspace, never a fake owned Property. T01 core stage changes do not transfer ownership, copy seller data or prove legal/financial events. Requests are local records; no seller delivery. Purchase document context remains unfinished and must extend the existing Vault pipeline with explicit authorization, not bypass its owned-property FK. O01 schedule corrections preserve paid occurrence evidence and owner-entered loan balances. Source evidence: ../../docs/evidence/O01_T01.md.
