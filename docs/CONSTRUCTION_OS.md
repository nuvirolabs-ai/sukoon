# Construction OS — local foundation

Checkpoint: 2026-09-12. User-approved expansion of the verified S02–S22 OWN checkpoint. This supersedes the earlier Construction future-only landing-page boundary, not the production release gates or the S23–S30 task ledger.

## Scope and entry points

Construction is a persistent, manual-first project workspace attached to an existing Property Passport. Creating a project never creates a duplicate property. Owners can maintain multiple projects, roadmap tasks, costs, materials, document links, contacts, updates, reminders and owner-confirmed handover history. Existing S05 primitives and category navigation are reused; the rest of OWN is not redesigned.

- `/construction`: authorized project list; optional `propertyId` filter and archived-owner view.
- `/construction/new`: select an owned active property and enter requirements.
- `/construction/[id]`: default overview; `?tab=overview|plan|budget|materials|documents|updates|people|timeline|handover` selects a section without fragmenting the route tree.
- `GET/POST /api/construction`: authorized list / idempotent project creation.
- `GET/POST /api/construction/[id]`: authorized projection / versioned command.
- `GET /api/construction/[id]/cost-sources`: owner-only eligible same-property INR obligations and recorded payments.
- Existing `/api/assistant` accepts `projectId` plus matching `propertyId`; existing search, Vault, sharing, reminders, Home, Updates and Property Passport entry points remain in use.

## Architecture and migrations

`lib/construction.ts` owns validation, access, transactions, lifecycle, accounting, projections, search and structured answers. `lib/construction-template.ts` owns the versioned conceptual roadmap and unavailable future pricing port. `components/ConstructionOS.tsx` renders server records and submits typed commands through the existing session boundary.

Four append-only migrations, applied to both isolated databases (14 migrations total):

1. `20260912120000_construction_os`: extend the retained `ConstructionProject`; add children below.
2. `20260912123000_construction_references`: strengthen task-stage, document-version and canonical ledger/obligation references.
3. `20260912124000_construction_task_order`: persist task sequence; newly instantiated templates and user-added tasks use explicit ordering.
4. `20260912140000_construction_expense_corrections`: unique reversal/replacement links, actor and reason on the existing canonical expense ledger, with same-property/workspace composite foreign keys.

The existing `ConstructionProject` retains legacy fields and adds type/status, built-up area/unit, floors, neutral quality, requirements JSON, initial/latest planned budget, dates, creator, active stage, archive and completion summary. New models: `ConstructionStage`, `ConstructionTask`, `ConstructionBudgetItem`, `ConstructionCost`, `MaterialRequirement`, `MaterialPriceEntry`, `ProcurementNeed`, `ConstructionContact`, `ConstructionUpdate`, `ConstructionDocumentLink`, `ConstructionEvent`.

Children carry project/workspace scope with composite project foreign keys. Existing `Property`, `PropertyDoc`, `DocumentVersion`, `ExpenseLedgerEntry`, obligations/payments, S16 reminders and property timeline are referenced, not replaced. The legacy whole-state save no longer writes/deletes Construction projects or Construction timeline entries. It also preserves modern S18 identity-bound grants rather than overwriting their capability arrays with legacy document scopes.

## Setup, roadmap and tasks

Setup requires an owned active property, name, project type, positive built-up area (maximum three decimal places), area unit, floor count, desired start, neutral quality label and integer-paise target budget. Target completion and free-text bedrooms/bathrooms/parking/lift/basement/terrace/other requirements are optional. Requirements are stored as `USER_ENTERED_REQUIREMENTS`, not verified building facts. Basic/Standard/Premium/Custom never imply a guaranteed price.

`home-workflow-v1` instantiates 17 ordered conceptual stages from Pre-Construction through Completion/Handover. Foundation has site marking, excavation, footing, reinforcement, concrete, curing and inspection-record tasks. Templates are persisted at creation, not hardcoded display cards. Dependencies, expected/actual dates, notes, required tasks, user-added stages/tasks, contact assignment and lifecycle rules are server enforced. Stage progress derives from child task completion; overall progress derives from stage progress, not a user percentage. Skipping requires an owner reason and closes unfinished tasks/reminders explicitly. It is not a safety or professional certification.

Project states: `PLANNING`, `APPROVALS`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`. Stage states: `NOT_STARTED`, `READY`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `SKIPPED`. Task states: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `CANCELLED`. Dependency cycles/invalid cross-project refs and transitions fail. Completed tasks are historical; a new follow-up task is used instead of rewriting completion history.

## Authorization and concurrency

The authenticated principal and workspace are resolved on the server. Browser owner/workspace claims confer no authority. All project writes are owner-only; unrelated users and operators do not inherit owner access. Archived properties are unavailable; archived projects are owner-only. Child IDs are validated in the authorized project, including stage/task/material/budget/update/contact/document-link references.

S18 adds `CONSTRUCTION_PROJECT_READ`, `CONSTRUCTION_TASK_READ`, `CONSTRUCTION_DOCUMENT_READ`, `CONSTRUCTION_BUDGET_READ`, `CONSTRUCTION_COST_READ`, `CONSTRUCTION_UPDATE_READ`, `CONSTRUCTION_MATERIAL_READ`, `CONSTRUCTION_CONTACT_READ`. Project-read is the base grant. Document links additionally obey existing selected-document metadata/preview capabilities and clean version checks. Architect role labels do not grant construction finances: the owner chooses capabilities explicitly. Requirements, owner summary and private contact/financial fields are omitted where unauthorized. Search counts, assistant facts and event payloads follow the same scopes. Assistant output rechecks access and partial capability changes before returning.

Creation uses a scoped deterministic id, PostgreSQL advisory locking and payload-hashed idempotency key. Commands lock the project row, replay matching successful keys before stale-version checks, and reject changed payloads or stale versions. Successful commands append one event and property history entry transactionally. Repeated task completion is a semantic no-op. Client forms retain a request key on retry and disable Save after success until input changes.

## Exact budget and expense rules

All money is stored as integer paise; UI rupees convert exactly without binary-float accounting. This foundation uses INR. Category initial/latest estimates, total initial/latest target and revisions are plans. Task and material estimates do not become ledger spend. Category totals are not automatically added to the overall target; owners explicitly revise the target. Committed totals are not implemented or inferred.

1. `USER_ESTIMATE`: budget/task/material planning only; no actual ledger effect.
2. `USER_RECORDED_EXPENSE`: a Construction cost creates one existing canonical ledger entry with `construction:<project>:<request-key>`. The cost references that entry; it is never also summed as an independent amount.
3. `LINKED_PAYMENT`: link one existing same-property canonical payment entry. Include its later payment reversal entries in the derived amount. Linking creates no payment.
4. `LINKED_INVOICE`: link one existing same-property payable obligation. Actual spend is the sum of its canonical `PAYMENT` and `PAYMENT_REVERSAL` entries, not the invoice face value, estimate or receivable entries. Future payments/reversals are reflected on refresh.
5. Canonical entry IDs are deduplicated. Duplicate links and invoice/payment overlap, including another construction project, are rejected. An obligation-scoped advisory lock serializes concurrent overlap checks. Estimates and procurement quantities never enter this sum.
6. Remaining planned budget = latest target minus recorded canonical spend; negative values are surfaced, not clamped away. Category variance compares category estimate with assigned cost rows. Unassigned costs still count in project spend.

Direct manual expenses now expose owner-only **Correct entry** and **Reverse entry**. `COST_CORRECT` retains the original cost/ledger row, appends its signed negative reversal and a positive replacement, and links the replacement cost to the original. `COST_REVERSE` appends only the negative reversal. A nonempty reason, explicit confirmation, actor, timestamp and relationships are retained. Changed positive integer-paise amounts are required for replacement; zero/same/negative values fail. Original cost net becomes zero and the replacement carries the corrected amount; property and Construction totals use the same ledger.

Unique reversal/replacement references, deterministic canonical keys and the existing project lock/version/idempotency boundary prevent duplicate effects and stale competing corrections. Repeating a successful request with the same payload/key returns the existing result; changed payloads conflict. Already-reversed originals cannot be reversed again. Correct the active replacement for a further correction. Archived projects require restore first. Financial corrections remain available on closed projects; other closed-project mutations stay blocked.

S15 remains the only reversal path for linked payment/invoice records. Bills exposes payment history, explicit confirmation and the existing `/api/payments/[id]/reverse` endpoint; Construction redirects there and recalculates on refresh. No independent Construction reversal of a linked payment is permitted. There is no bank reconciliation, online payment or external invoice verification. Remaining planned budget is a budget difference, never an engineering estimate of cost to finish.

## Vault and reviewed checklists

Links point to existing same-property clean `PropertyDoc` + `DocumentVersion` records, optionally a stage/task/site update. No second byte store exists. A document link is not evidence of municipal approval. The picker reports no clean versions when scans are pending/unavailable and links back to Vault. Production malware scanning remains a release gate; tests explicitly use synthetic clean metadata.

Construction checklist applicability reuses S12 normalized property type/jurisdiction evaluation and only current reviewed `PUBLISHED` category `CONSTRUCTION` checklist rules. States include `UNKNOWN`, `DOCUMENT_AVAILABLE`, `UNDER_REVIEW`, `MISSING_FROM_CONFIGURED_CHECKLIST`, with configured source metadata. No rule means UNKNOWN, not automatic legal readiness. No nationwide checklist, legal mandate, sanctioned-plan validation, government permission or occupancy status is invented.

## Materials, procurement and people

Requirements store entered quantity/unit, dates, stage, entered estimate/actual rate, supplier reference and status. Quantity provenance is `USER_ENTERED`; there is no engineering quantity calculator. Unit-rate history is append-only, same-unit validated, dated and labelled entered history, with brand/grade/dealer/location fields and latest/previous/difference. Procurement tracks `PLANNED`, `QUOTE_REQUIRED`, `ORDERED_EXTERNALLY`, `RECEIVED`, `CANCELLED` and owner notes. It does not place orders or assert supplier availability.

`MaterialPricingPort.latest` returns `UNAVAILABLE`. No paid/live rate feed, RFQ, supplier list or market price is connected. Contacts contain name/company/role/phone/email/notes and are labelled Added by owner; no verification badge or marketplace exists.

## Updates, reminders, timeline, search and assistant

Site updates persist timestamp/stage/title/description/progress evidence/issue resolution and optional Vault attachments. Project create/status, stage/task progress, documents, budgets/costs, materials, updates and completion append Construction events and safe Property Timeline entries. Events cannot be edited/deleted through Construction APIs; owner archive preserves history. Generic property timeline summaries avoid embedding financial details.

S16 schedules durable task, milestone, material, approval/document follow-up and warranty reminders at 09:00 Asia/Kolkata using the existing in-app engine. Completion/cancellation/archive cancels applicable reminders; warranty handoff reminders survive project completion. No second scheduler or live external channel was added. Existing Home/Updates consume the persisted reminder/timeline rows.

S19 adds authorized project/stage/task/material/contact records and scoped counts/deep links. S20 accepts explicit project context and computes current stage, next milestone, pending tasks, recorded spend, upcoming material requirements and configured missing documents. Answers cite source records, are read-only and do not require a model. Engineering design, structural calculations, safety, invented quantities and legal advice remain unsupported. Existing rate/context/timeout/cancellation/audit controls remain in use.

## Completion and retained history

Completion evaluates open stages, required tasks, unresolved site issues and applicable configured missing/review documents. Owner confirmation, valid completion date, summary and maintenance/warranty handoff text are required. Closed history is immutable except archive/restore. Wording is Project marked complete by owner, never legally complete or occupancy approved.

The stored historical snapshot includes start/completion/duration, initial/latest budget, recorded spend at completion, milestone outcomes, document references, contacts, major events and handoff text. Existing property history remains connected. Subsequent legitimate S15 payment reversals or direct manual corrections may change current canonical spend; the completion snapshot remains unchanged. Handover explicitly displays stored snapshot amounts separately from current recorded spend. Corrections append audit events rather than issuing a silently revised historical completion summary.

## Ordinary local acceptance

See [Construction acceptance](CONSTRUCTION_ACCEPTANCE.md) for the 2026-09-12 synthetic browser walkthrough, exact startup/login instructions, 70 integration + 7 unit checks, screenshots, and unpassed browser-history/real-device gates. Run `npm run worker:local` alongside `npm run dev:local`. The local worker uses ordinary unavailable scanner/OCR/AI boundaries, not fixture providers. Specialized reminder/document workers claim only their own event types. Actual scanning and shared clean-document preview remain blocked; fixture tests do not close these gates.

## Acceptance and limitations

See [Construction evidence](evidence/CONSTRUCTION.md). Local foundation is implemented and tested; this is not production readiness. Real scanner/storage, reviewed jurisdiction content, approved rate/AI/delivery providers, retention/privacy policy, operator/recovery controls, performance/load/security review, staging, iOS/Android, accessibility and human UAT remain open. Legacy projects are preserved without silently fabricating completed roadmap history. Older pre-sequence records retain their existing default order; newly created projects use explicit template order.
