# Rich demo composition correction — 14 September 2026

Status: corrected synthetic dataset complete for local visual review; **not owner-approved design**. No unrelated roadmap work was started. The UI was not redesigned in this correction.

## Current dataset correction — local acceptance result

This section supersedes the historical visual-only comparison below. The correction was limited to the reproducible `SYNTHETIC DEMO DATASET v1` seed and its read-only evidence runners. Production/domain behavior, authorization code, empty first-run accounts, saved Construction review records, ClamAV integration, privacy evidence and the existing UI were preserved.

1. **Money root cause.** The seed called `createObligationForUser` with strings such as `"485000"` under `amountPaise`. That parser treats string input as rupees, producing 48,500,000 paise. Direct Prisma bill rows and payment `amountPaise` fields were not affected. The corrected seed now passes explicit rupee strings through the domain parser and uses `lib/demo-money.ts` for exact direct-paise assertions; the double conversion cannot recur in the corrected seed path.
2. **Corrected monetary records.** Electricity is 485,000 paise (₹4,850), due seven days after the seed date, and open with 485,000 paise outstanding. Property Tax is 1,845,000 paise (₹18,450), due 18 days after the seed date, with a 1,000,000-paise (₹10,000) self-reported owner payment and 845,000 paise (₹8,450) outstanding. Water is 73,000 paise (₹730) and completed with its existing owner-recorded payment. Insurance renewal remains `NON_FINANCIAL` with no monetary due amount. The quarterly Loan instalment schedule remains ₹25,000 per occurrence; no principal or loan balance was derived or changed.
3. **Property-tax payment.** The missing partial payment was created through `recordPaymentForUser`, with the existing clean/confirmed synthetic tax receipt linked by exact document and version IDs. It is explicitly owner-entered and self-reported; it is not provider verification. Payment, balance, Home and Bills projections now agree on ₹8,450 outstanding.
4. **Money tests.** `tests/unit/demo-money.test.ts` proves ₹4,850 → 485000 paise, ₹18,450 → 1845000 paise, ₹10,000 → 1000000 paise, ₹730 → 73000 paise, the ₹1.20 Cr budget boundary and remaining ₹8,450 → 845000 paise. The seeded construction and material values use the same exact helper boundary.
5. **Construction progress.** Mehta Residence on Super Corridor Plot is `ACTIVE`; the current stage is `RCC / Structure`. The prior stored/derived result was 2% overall with a 44% current-stage result. The corrected dataset now reports 32% overall and 44% for the current stage. This is produced by the existing progress engine from five completed stages, the in-progress RCC stage and later not-started stages/tasks; no 28% or other display constant was added. The Approvals stage remains an owner/demo-recorded workflow state, not government verification.
6. **Construction documents.** Four exact-version links were added through `mutateConstructionForUser` with `DOCUMENT_LINK`: Demo Sanction Map, Demo Architectural Plan, Demo Structural Drawing and Demo Foundation Invoice for Super Corridor. Each harmless PDF was created through the Vault helper, processed by the existing local ClamAV worker, manually confirmed, and linked only after a clean current version existed. Construction now has four links and six Construction events (creation, activation and four links).
7. **Construction money/materials.** Planned budget is 1,200,000,000 paise (₹1.20 Cr) across ten realistic categories. Canonical Construction/ledger costs remain 269,000,000 paise (₹26.90 lakh) across three records; no budget item was counted as spend. Cement remains 800 bags with owner-recorded ₹390/₹398 rates; TMT Steel remains 7.2 tonnes with owner-recorded ₹61,000/₹60,500 per tonne (₹61/₹60.50 per kg) history; AAC Blocks and Sand remain present. These are not live market prices.
8. **Readiness demo.** Seven S12 checklist rules were created, submitted, reviewed and published through the real operator workflow, scoped to `Synthetic demo / Indore`, and tagged `Synthetic demo content — not legal advice — v1` with synthetic source references and reviewer evidence. S13 calculated the result: 6 applicable rules, 5 satisfied, 1 missing (NOC), and 1 contextual unknown excluded from the score; current record-readiness is **83%**. No health algorithm, legal guidance or hardcoded score changed.
9. **Architect Construction grant.** The existing p1 selected-document Architect grant and its history were preserved. A separate accepted identity-bound p3 invitation was created through S18 for `demo-architect@sukoon.local`, covering `PROPERTY_BASIC_READ`, `CONSTRUCTION_PROJECT_READ`, `CONSTRUCTION_TASK_READ`, `CONSTRUCTION_DOCUMENT_READ`, `CONSTRUCTION_UPDATE_READ`, and metadata/preview only for the four linked Construction documents. It does not grant budget, cost, contacts, bills, loans or broad document listing. The signed-in architect API/browser view returned the four selected documents and zero budgets, costs or contacts.
10. **Lawyer audit.** `demo-lawyer@sukoon.local` still lists 11 Vijay Nagar metadata records because its existing grant explicitly includes broad `DOCUMENT_LIST` and `DOCUMENT_METADATA_READ`. Only the selected Registry and Mutation documents have preview scope; Registry returned 200 and Insurance returned 404. This is recorded as existing scope semantics, not broadened or silently changed.
11. **Natural activity.** The Property Tax payment, obligation corrections, Construction activation/document links, readiness assessment and existing maintenance/purchase/sharing actions produced normal domain events. No fake feed strings, manual timeline event inserts for sharing, fixture scanner output or UI-only demo feed was added. The owner timeline now contains 76 events, including the durable correction history.
12. **Current dataset counts.** The approved local workspace contains 3 properties; 20 workspace documents/versions (19 property Vault records plus 1 purchase record), all `clean` and `confirmed`; 4 bills; 6 obligations/10 occurrences/2 payments; 4 maintenance records/9 maintenance events; 76 timeline events; 5 share records (4 active, 1 revoked history); 3 p1 readiness snapshots/7 items; 1 Construction project/17 stages/37 tasks/10 budget items/3 canonical costs/4 materials/8 price entries/4 contacts/6 updates/4 linked document versions/6 Construction events; and 1 Purchase Workspace/1 candidate/6 entries/5 evidence events. No durable reminder records were invented.
13. **Browser evidence.** `scripts/demo-composition-browser.mjs` passed with no page errors or horizontal overflow across 390, 410, 430 and 1280px owner viewports. It checked owner Home, Properties, Vijay Nagar overview and Bills, Vault/detail, Construction overview/Plan/Budget/Materials/Documents, Purchase overview/document/question disclosures and all 76 Updates events, plus signed-in lawyer and architect views. The protected owner PDF download hash remained `082a2b619be6c249be5a7871cea4c81513d6f98e9bb2c4384fbccad4d702dd5f`.
14. **Navigation acceptance.** The browser sequence Home → Properties → Construction overview → Plan → Materials → Back to Plan → Forward to Materials passed. Refresh on the Materials section URL passed. The runner waits for URL and visible content, not page-idle; exact evidence is in `output/demo-composition/browser.json`.
15. **Regression.** `npm run verify` PASS after the correction: ESLint PASS, typecheck PASS, 41 unit tests PASS, 92 PostgreSQL integration tests PASS across 12 files, and Next production build PASS. The build retained the two pre-existing dynamic-filesystem tracing warnings in `lib/providers.ts` and `lib/server-store.ts`; no new warning or dependency change was introduced. Focused `node scripts/demo-composition-audit.mjs demo-correction-after` PASS and `node scripts/demo-composition-browser.mjs` PASS (63 captures, no errors).
16. **Empty first-run accounts.** No normal empty account or authorization path was altered. Demo-only records remain fenced by the allowlisted local database, `.data` root and exact `demo-v1-*` identities; the existing authorization/integration coverage remains the evidence for empty-user isolation.
17. **No hardcoded demo UI.** No component, route, authorization or display-format shortcut was added for these values. The only application-side addition is the reusable seed/test money helper; all visible values continue to arrive through the existing APIs and domain projections. The demo remains a dataset stress test, not a first-run default.

Correction source evidence: `output/demo-composition/demo-correction-after-audit.json`, `output/demo-composition/browser.json`, `scripts/demo-dataset.ts`, `scripts/demo-composition-audit.mjs`, `scripts/demo-composition-browser.mjs`, `lib/demo-money.ts` and `tests/unit/demo-money.test.ts`.

## Historical audit outcome before visual review (preserved evidence)

The normal PostgreSQL database `sukoon_s02_local_20260911` and ordinary authenticated APIs were audited for `demo-owner@sukoon.local`. Outcome: **B (records underexposed by presentation), with C (pre-existing projection limitations) and original seed inconsistencies**. There is no evidence that the preceding redesign deleted demo records. No seed/reset/restore ran. Authentication used only the existing local sandbox OTP flow.

Source evidence: `output/demo-composition/before-audit.json`, `after-audit.json`, and the read-only runner `scripts/demo-composition-audit.mjs`. All 29 audited table counts and sorted-ID fingerprints match before/after. This comparison proves record identities/counts, not a historical full-row checksum. Browser interaction checks independently compare owner property/document payloads unchanged.

| Persisted record | Before | After |
|---|---:|---:|
| Properties | 3 | 3 |
| Documents / versions | 16 / 16 | 16 / 16 |
| Legacy bills | 4 | 4 |
| Durable obligations / occurrences | 6 / 10 | 6 / 10 |
| Payments | 1 | 1 |
| Maintenance records / events | 4 / 9 | 4 / 9 |
| Property timeline events | 54 | 54 |
| Durable reminders | 0 | 0 |
| Share records | 4 | 4 |
| Readiness snapshots / checklist items | 2 / 0 | 2 / 0 |
| Construction projects / stages / tasks | 1 / 17 / 37 | 1 / 17 / 37 |
| Budget items / costs | 10 / 3 | 10 / 3 |
| Materials / recorded price entries | 4 / 8 | 4 / 8 |
| Construction contacts / site updates | 4 / 6 | 4 / 6 |
| Construction document links / events | 0 / 1 | 0 / 1 |
| Purchase workspaces / candidates | 1 / 1 | 1 / 1 |
| Purchase entries / evidence events | 6 / 5 | 6 / 5 |
| Document requests | 2 | 2 |
| Questions | 2 | 2 |

The 16 documents are 15 property documents (11 Vijay Nagar, 3 Palm Meadows, 1 plot) plus 1 purchase document. All 16 versions are scan-clean and manually confirmed; filename text such as “Awaiting Review” or “Quarantined Example” does not describe their current security state. Requests: one open, one user-reviewed. Questions: two currently open; five evidence events retain receive/review/answer/resolve/reopen history. No resolved question was fabricated. Share records comprise three accepted active personas and one revoked historical record.

Additional existing legacy reminder records are visible again through the property summary: Vijay has three unfinished saved dates, including insurance renewal and maintenance warranty. These are explicitly not durable delivery receipts. No notifications were scheduled by this task.

## Important source inconsistencies — not silently repaired

1. **Money input mismatch in the seed:** the seed passes strings already converted to paise into `createObligationForUser`; its parser interprets string input as rupees. Thus Electricity's legacy Bill is ₹4,850 while its durable occurrence is ₹4,85,000; Property Tax is ₹18,450 versus ₹18,45,000. The Water payment is ₹730 against a ₹73,000 obligation, leaving ₹72,270. No property-tax partial payment exists. The new summaries display the durable obligation values as persisted, not cosmetic substitutes. The early commentary quoting ₹18,450 as the obligation was corrected after tracing both sources. This is **pre-existing synthetic-data inconsistency, not deletion**. Fixing seed input and applying audited corrections to existing financial records requires an explicitly scoped follow-up; do not reseed over them.
2. Mehta Residence is stored as PLANNING, its current stage is RCC / Structure, and the existing task-based calculation reports **2% overall** (44% for the current stage), not the brief's illustrative 28%. Its planned budget is ₹1.20 Cr and recorded spend ₹26.90 L. The seed mixes task status vocabulary, which warrants a separate synthetic-data/domain-contract review rather than changing progress logic for this screenshot. Cement's latest recorded rate is ₹390/bag, not ₹398. All values remain unchanged.
3. Historical state: there were **zero Construction document links**, zero durable reminders and zero applicable assessment items; readiness was “Not assessed.” The current correction above is the authorized reproducible repair. Source-file inspection showed omissions/incomplete seed examples; no unrelated records were restored.
4. **Architect Construction scope:** `demo-architect@sukoon.local` has selected-document access on Vijay Nagar. Mehta Residence belongs to Super Corridor Plot. Signed-in project requests return 404, and the browser shows denial. No new invitation/grant was created to turn this into a pass.
5. **Lawyer scope:** the existing lawyer grant permits listing/metadata for all 11 Vijay documents, with byte-preview rights scoped separately. The lawyer screenshot is evidence of that actual metadata grant, not proof that all 11 originals are previewable.

## Information hierarchy corrections

- **Identity:** retained logo, forest green, mobile Home/Properties/+/Explore/More and deliberate desktop shell. Restored warm cream `#f7f3eb`; muted forest/cream category surfaces, system sans, no imagery or new brand.
- **Home:** real named Construction and Purchase summaries instead of throwing away fetched data; visible obligation amounts; four attention rows; property-event count; search affordance; recent activity. No owner-email conditional UI or demo constants.
- **Properties:** actual document/bill/history/open-maintenance counts and existing build name/status. Owner-only batched read projection; no per-property database calls.
- **Property overview:** upcoming obligations, saved reminder dates, record metrics, people with access and active build entry. Readiness uses the existing assessment, not a manufactured score. Existing section navigation remains.
- **Vault:** all 11 document rows remain visible by default; All / Needs attention / Reviewed filters reflect actual state. Details contain category, upload date, current version, source, security explanation, review/preview/download and technical evidence. No repeated warnings/actions in list rows.
- **Construction:** stage/progress, next steps, Money, material quantities and recorded rates, latest site update, deeper section links/settings. Financial/material/site sections retain existing capability checks.
- **Purchase:** prices and actual received/open counts, visible received-document/request/question rows, then the primary continuation action; editing and revision history stay deeper. No fake extracted fields, responses or received documents.
- **Updates:** current mixed feed retained; “Complete property history” loads all 54 timeline events in 25/25/4 pages. Scoped owner/shared query and authentication reused; stable ordering, bounded page size, no new source-of-truth table.

## Capability audit

“Browser” here is headless Chromium against the ordinary local app with sandbox OTP, not an API-only simulation. No new domain writes were performed for cosmetic proof.

| Previous capability | Current location | Accessible? | Evidence |
|---|---|---|---|
| All property records | Properties → Passport; counts/records now on overview | Yes | Populated screens, source/API counts |
| All 11 Vijay documents | Passport → Documents → All | Yes | Browser asserts 11; Reviewed 11; Needs attention 0 |
| Preview / download | Open document → Preview / Download | Yes | Protected owner PDF 200 and download hash match; native PDF rendering not newly certified |
| Manual classification / extraction review | Document detail | Yes | Controls retained; full Vault regression, no new review mutation |
| Scanner/source evidence | Document detail → Scan & technical details | Yes | Existing metadata response; no new scan or fixture substitution |
| Remove document | Document detail → More actions → Remove + confirmation | Yes | Hidden-by-default/focus checks; destructive action not replayed |
| Upload document | Vault → Upload document | Yes | Existing format/quarantine path retained; full Vault tests |
| Property edit/archive/ownership | Property details | Yes | Controls/source audit; no demo archive performed |
| Obligations/payments/reversals | Bills & obligations | Yes | Route and full payment regression; seed mismatch separately recorded |
| Saved reminder dates | Property overview → Saved reminder dates | Yes, restored to overview | Normal owner projection, existing dates only |
| Maintenance/history/warranties | Passport → Maintenance | Yes | Route browser check and lifecycle integration tests |
| Sharing/export/rent/Assistant | Passport sections / Ask Sukoon | Yes | Route checks; full sharing/export/assistant suites |
| Complete Construction stages/tasks | Project → Plan | Yes | 17 stages/37 tasks retained; Back/Forward/refresh |
| Material history/updates/contacts | Project → Materials / Updates / People | Yes | Populated Materials screenshot; full Construction tests |
| Project updates/status/archive | Project details & settings | Yes | Source audit and full Construction regression, no mutation replay |
| Purchase response/history | Visible question/request → detail → View activity | Yes | Actual action option/value, keyboard/dialog checks; purchase regression |
| Purchase create/edit/upload | Existing continuation/details/options | Yes | Read interface has no permanent textareas; mutation handlers retained |
| All property timeline history | Updates → Browse all property history → See older | Yes, restored in Updates | Historical browser all54; current correction browser all76; pagination/isolation tests |
| Lawyer shared records | Shared property | Yes, existing metadata scope | Populated lawyer screenshot (11 listed records) |
| Architect selected original | Shared property → Sanction Map | Yes | Selected200/unselected404, refresh preserves scope |
| Architect Construction | Existing project URL | **No existing grant** | Direct404 and denial screenshot; not marked passed |
| Signed-out protected views | Sign-in gate | Correctly denied | Refresh/Back/Forward and direct document401 |

## Visual and regression evidence

- Before correction: `output/design-redesign/composition-before/` (earlier original redesign evidence remains in `output/design-redesign/before/`).
- Current screenshots: `output/demo-composition/screenshots/`. Fifteen owner views at 390/410/430/1280 = 60 captures, plus lawyer, architect selected-document and architect Construction = **63 captures**. No horizontal viewport overflow. Full-page composites include the fixed navigation at its capture position; content remains scrollable with bottom padding, not all visible in one viewport.
- `output/demo-composition/browser.json`: all11 Vault filter assertions, visible purchase rows, all76 history, owner download SHA-256 `082a2b619be6c249be5a7871cea4c81513d6f98e9bb2c4384fbccad4d702dd5f` (the stored value is also checked against the Vault payload), no page exceptions, Back/Forward and section refresh. Lawyer selected Registry bytes200 and unselected Insurance bytes404 are checked separately from its11 visible metadata records. Architect Construction returns the four selected document links with budget/cost/contact arrays empty; unselected Super Corridor Registry bytes404 and selected Sanction Map bytes200 are checked.
- `output/demo-composition/interactions.json`: 12 interaction groups; 11 supporting consumer routes; Tab containment, Escape/focus return, signed-out behavior, project/property navigation, owner payload preservation, architect selected200/unselected404.
- Focused PostgreSQL suite `s19-s22.test.ts`: 11 passed, including two added composition/history tests.
- Final full verification after the composition changes: lint/typecheck/build, 38 unit tests and 92 PostgreSQL integration tests passed. Two existing storage-tracing build warnings remain (`providers.ts`, `server-store.ts`). Final browser and interaction reruns also passed.
- Saved historical review check: `node scripts/check-construction-review.mjs --revoked`: spend250000paise, owner unscanned423, revoked architect project/cost-source/unselected-document404, no bypass.

Investigated failures: initial Construction Money card overflowed at390 because full rupee strings exceeded a two-column metric; compact rupee display/flexible metric sizing corrected it. Initial screenshot readiness waited for a heading but not all Home requests; the composition runner now waits for populated data. A new test's inferred UUID literal-array type caused a TypeScript failure; explicit string-ID typing corrected it without weakening assertions.

## Review and exact remaining work

Open `http://localhost:3100/` as `demo-owner@sukoon.local` using local sandbox OTP. Visit Properties → Vijay Nagar → Bills and Vault; Properties → Super Corridor Plot → Mehta Residence; Buy/Sell → Purchases; Updates → Complete property history. To review the scoped Construction share, sign in as `demo-architect@sukoon.local`; to review the existing legal-document semantics, sign in as `demo-lawyer@sukoon.local`. Same components/APIs serve ordinary accounts. App and worker use existing startup instructions: `npm run dev:local -- --hostname 127.0.0.1`, `npm run worker:local`; scanner remains the already approved per-upload local ClamAV setup. No scanner installation/configuration was changed.

Owner action: review the corrected synthetic composition and decide whether the local review candidate should become the accepted visual/data demonstration. Owner review does not imply production readiness, live OCR/AI, provider integration, device acceptance, deployment, or release approval. The next specific task is owner feedback on this corrected dataset; unrelated roadmap modules remain paused under the latest instruction.

Remaining dense surfaces: Construction Plan/Budget/Materials editors, detailed obligation/payment forms, purchase evidence edit/activity panels, raw technical document evidence, multi-candidate comparison table, and Operations. They remain available rather than removed. Property-document historical versions/replacement/archive affordances remain an older UX gap (current version and technical evidence are exposed; no new endpoint/workflow was invented here). Physical iPhone/Safari, VoiceOver, virtual keyboard, full large-text/accessibility certification and final owner design acceptance remain untested/unapproved. No production, live AI/OCR, provider, release or deployment claim follows from this correction.
