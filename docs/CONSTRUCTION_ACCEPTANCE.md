# Construction expense corrections and browser acceptance

Date: 2026-09-12. Local review checkpoint, not production readiness or formal owner approval.

## Operations/privacy continuation

Additive migrations17–19 and app/worker restart preserved Construction acceptance data. `check-construction-review.mjs --revoked` still reports owner spend250000paise, old unscanned bytes423, revoked architect project/cost sources/unselected document404 and providerBypass:false. No saved project changed for the new tests. The isolated300-second Profile/Operations expiry plus Back/Forward/refresh showed sign-in, but full Construction timed-expiry and frame-level no-flash are still untested. Prior normal Construction history acceptance below is not repeated or replaced. See [continuation evidence](evidence/OPERATIONS_PRIVACY_FULFILLMENT.md).

## All-phases foundation follow-up — 2026-09-12 evening

New evidence supplements, not replaces, the historical correction/handover record. Owner Chrome visually rendered the existing scanned selected PDF. Original failed upload was retried via owner Vault UI on the same version/hash, ordinary ClamAV attempt4 clean, previous failed evidence retained; no duplicate upload or scan-status patch. Its owner review remains pending. Existing confirmed attached document and completed project remain unchanged.

Chrome Home → Construction list → active overview → Plan → Budget → Back Plan → Forward Budget PASS by expected URL/visible content. Budget refresh PASS; related Bill → Back Budget PASS; selected Vault record → Back Documents PASS. Browser control actions still took about10s but returned successfully. Navigation implementation was not globally changed. Signed-out direct private URL shows OTP form. Browser timed expiry and frame-by-frame no-flash remain open; automated expired-session 401 and logout stale-response tests are separate.

Actual steps, IDs, failure/recovery detail and tests: `evidence/ALL_PHASES_FOUNDATION.md`. Final new regression: 27 unit / 78 integration, lint/typecheck/build PASS, schema current16. Owner spend250000paise and older revoked architect403/404 boundaries were rechecked by the existing review script (actual returned status404 for protected requests). No new architect grant or expansion performed during this follow-up. Earlier architect signed-in visual PDF limitation is not retrospectively marked passed by an owner screenshot.

Latest continuation: the approved local ClamAV 1.5.4 scanner is installed/configured with current official signatures, and the ordinary Vault → real worker → manual review → owner preview/download → Construction link → scoped architect preview → owner revocation journey has been exercised with genuinely scanned bytes. The first fresh upload remained fail-closed after an unconfirmed scanner result; the second fresh upload recorded a version/hash-bound clean verdict. Back and Forward rendered the expected Plan/Budget states despite browser-control completion timeouts; section refresh, related Bills/Vault returns and signed-out denial also rendered correctly. Expiry-specific history remains untested. See [current scanning and navigation evidence](evidence/LOCAL_SCANNING.md) and [startup](LOCAL_SCANNER_STARTUP.md). Regression: 71 integration / 10 files, 25 unit / 3 files, lint/typecheck/build pass (two existing tracing warnings). The earlier saved completed project, expense history, revoked grant and handover snapshot are preserved; no navigation implementation was changed.

**Ready for a guided local owner review with explicit limitations. Not production readiness.** Real local scanning and the selected-document authorization journey passed at the local boundary. The Codex in-app PDF viewer blocked rendering after the authorized preview response, so visual PDF rendering in that viewer is not claimed. Production storage/email, OCR/live AI, physical-device certification, encrypted/limit coverage, and expiry-specific history remain open. Individual section links/refresh, expense correction, Bills reversal, ordinary worker delivery, scoped architect access/revocation, and supported synthetic handover were exercised through the running browser application.

## Provenance and safe scope

- Checkout `/Users/tanutejas/Documents/Sukoon`, branch `main`, base HEAD `83232ca`; substantial pre-existing dirty/untracked work preserved. No commit, reset, dependency reinstall, public tunnel, deployment or data deletion.
- Ordinary app: `http://localhost:3100`, `.data`, database `sukoon_s02_local_20260911`. Automated integration data: separate `sukoon_s02_test_20260911`.
- Owner: `construction-review-20260912@example.com`.
- Prior review architect: `construction-architect-review-20260912@example.com`; its earlier grant remains **revoked**.
- Scanner-acceptance architect: `scanner-architect-20260912@example.com`; the newly accepted grant is now **revoked** after the selected-document test.
- Property: **Construction Acceptance Plot**, `55c9391a-39e3-461c-85be-23907203a73b`.
- Project: **Acceptance G+2 Home**, `build-627e6f7dc2ee4d0d8389fb36e35d541d`. Currently owner-completed, with synthetic-only skipped stages and retained handover.
- Generated PDF: `output/pdf/construction-review-synthetic.pdf`; Vault document `7001e8e567ce412eaa22d98525f9d01e`. All entered property/contact/expense data is explicitly synthetic, not a real address, professional credential or transaction.
- Scanner PDF: `output/pdf/local-scanner-acceptance-synthetic.pdf`; Vault document `ffc5f27bda1947dc91b2dba9aadcb865`, version `6a620e2341454ee9b7c875b00e56efdd`, SHA-256 `6627ad24e6f8ae02a5262e083db7df401eec3d2db3e5a13f60db33993183d206`. It contains no real property or identity information. The separate active demonstration project is `build-e691f61318de9c319ea0ad71c145a84e` (**Scanner Acceptance Active Build**); the completed review project was not altered.

The existing server was inspected before replacement. Only the verified Sukoon Next process was stopped for Prisma refresh and the final restart; the ordinary local worker remained running. No unrelated process was terminated.

## Reproduce the owner walkthrough

Use the existing private local `.env` and PostgreSQL instance. Do not substitute staging/production URLs. Dependencies are already present; no reinstall is needed for this checkpoint.

```sh
cd /Users/tanutejas/Documents/Sukoon
npm run db:generate
npm run db:migrate:deploy
npm run db:status
npm run dev:local
```

In a second terminal:

```sh
cd /Users/tanutejas/Documents/Sukoon
npm run worker:local
```

The worker rejects production/nonlocal configuration and databases outside the local Sukoon naming guard. It runs reminder dispatch plus document processing with ordinary dependencies and the configured local ClamAV scanner; it does not run OCR or a live model. Stop either owned foreground command with Ctrl-C when finished; inspect an occupied port before starting another app.

Open `http://localhost:3100`. If another account is signed in, More → Sign out. Enter the synthetic owner email, Send OTP, then enter the newly displayed **Local sandbox OTP** and Open passport. Codes expire; none are recorded here. Do not expose this mailbox or app publicly. This is development-only passwordless authentication, not a production email-delivery claim.

Home → Construction → Acceptance G+2 Home. Budget shows the correction chain and linked payment now net zero; Handover shows retained history. Plan/Materials/People/Updates/Timeline remain readable. Completed project operational fields are intentionally closed, while audited expense correction remains available. To try new stage/material/budget entry, create a new explicitly synthetic project on the same existing Property Passport; do not seed an ordinary account. To repeat architect access, issue a fresh scoped sandbox invitation, sign into that recipient, and paste its token into the existing `/share/<token>` acceptance page; never reuse the revoked grant.

### Safe later removal

No cleanup was performed. Use the exact synthetic project’s **Archive project** confirmation to remove it from the active list while retaining ledger/history; restore from archived projects if needed. The Property Passport’s Archive action likewise retains its record. Keep the architect grant revoked. Do not purge the account, delete ledger rows, reset either database, or delete the entire `.data` directory. Permanent byte/account cleanup requires a separately approved retention-aware operation; archive is not erasure.

## Expense accounting and verification

Owner-facing direct correction requires amount, reason and confirmation. The original remains immutable; a signed reversal and positive replacement use the existing `ExpenseLedgerEntry`, with unique same-property links. Reverse entry adds only the signed reversal. Actor, reason, timestamp, original/replacement IDs and timeline event persist. Owner-only authorization, transaction lock/version, idempotency replay and uniqueness constraints protect effects. Reversal of a linked payment is rejected in Construction and directed to Bills.

Ordinary browser example, confirmed by local database inspection:

| Ledger record | Rupees | Retained relationship |
| --- | ---: | --- |
| Original manual entry `cba814fe-a1f8-4613-993e-b8569bfcdf6c` | 25,000 | Original untouched |
| Manual reversal `e53294a1-1906-497a-be98-8b9fc114b768` | -25,000 | Reversal of original |
| Replacement `eb2b8ee9-b6cc-4dfc-b359-3fbbe4a3f701` | 2,500 | Replacement for original |
| **Net manual expense** | **2,500** | One canonical accounting model |

Reason: “Extra zero entered during synthetic review; correct amount is ₹2,500.” Owner actor and UTC timestamp appeared in Budget; original/replacement anchors retain their relationship. Overview, Budget/category, cost list and assistant agreed at ₹2,500; property ledger confirmed the same three effects. Server restart preserved them.

Bills browser journey: created a ₹1,000 synthetic payable, recorded a manual payment (no money transferred), linked that existing payment in Construction → ₹3,500 project spend. Bills → All → View payment history → Reverse payment → Confirm payment reversal retained RECORDED→REVERSED plus REVERSAL history. Construction then showed linked cost ₹0 and project spend ₹2,500. The original payment is `8314cabd-cadc-4af7-89dd-9173a35a6480`. No Construction-side duplicate reversal was created.

**Fixture/API regression, not a browser retry claim:** focused PostgreSQL tests repeat the exact correction request concurrently and later, reject changed payloads/stale competing corrections/double reversal, test invalid inputs and unauthorized actors, and preserve snapshot JSON after a post-handover correction. The authenticated S15 reversal route is replayed with the same Bills idempotency key and asserted to create one reversal. The already-successful ordinary browser correction was not replayed by synthesizing a different request.

Handover now displays stored initial/latest budget and spend-at-handover separately from live spend. Later corrections append audit history, not silent snapshot changes.

## Browser journeys actually exercised

| Journey | Evidence / result |
| --- | --- |
| Empty synthetic owner → Home → Construction | No future-only placeholder; created no sample records automatically. |
| Existing Property Passport → new project | Plot created first through normal property UI; project attached to that record. |
| All nine sections | Overview, Plan, Budget, Materials, Documents, Updates, People, Timeline, Handover links and Refresh records/reload exercised after restart. |
| Back/Forward | **Rendered PASS / automation wait partial:** Home → Construction list → `Scanner Acceptance Active Build` → Plan → Budget; Back rendered Plan and Forward rendered Budget. The browser-control calls timed out waiting for completion after the URL had changed; independent URL and visible-state checks confirmed both destinations. |
| Stage/task/progress | Pre-Construction IN_PROGRESS; Record requirements DONE; stage 50%, overall 2%; timeline retained. |
| Budget | Foundation review budget created at ₹5,00,000, revised to ₹5,25,000; no spend created by estimate revision. |
| Manual correction | ₹25,000→₹2,500 with original, reversal, replacement and reason/actor/time. |
| Materials/prices | Synthetic PPC cement, 800 bags; comparable owner-entered ₹380 and ₹390/bag records; latest/previous/difference displayed. Not live market rates. |
| Contact/task/update | Synthetic architect contact, assigned Review planned budget task, due date, and owner-reported OPEN site issue. Contact creation itself granted no app access. |
| Reminder | Running `worker:local` delivered Review planned budget with one persisted attempt. Mark read and source navigation exercised; database confirmed `readAt`. Later task/project completion cancelled applicable reminders while retaining delivery history. |
| Six assistant questions | Current stage, pending tasks, spend, upcoming materials, missing documents, next milestone returned record-based answers and citation links. Spend ₹2,500; checklist UNKNOWN. No model/document intelligence claim. |
| Architect | Separate actual email-OTP browser session accepted the sandbox invitation for `scanner-architect-20260912@example.com`. The grant contained only property basics, project read, task read, and selected-document list/metadata/preview scopes; timeline, financial, contact, export, editing and other-document capabilities were absent. |
| Architect documents | Shared project UI exposed only `local-scanner-acceptance-synthetic.pdf`. The authorized direct preview response returned HTTP 200 and the uploaded SHA-256. The Codex PDF viewer itself displayed “This page has been blocked by Codex” / `ERR_BLOCKED_BY_CLIENT`, so viewer rendering—not app authorization—remains a tool limitation. |
| Revocation | Owner revoke endpoint returned HTTP 200 for the accepted grant. Architect refresh rendered “Shared property not found”; subsequent shared-property, shared-document and direct-document requests returned 404. |
| Related navigation / session boundary | Refresh preserved Budget; Bills → Back restored Budget; linked Vault record → Back restored project Documents. Signed-out navigation to a private project redirected to the sign-in screen with no project data. Expiry-specific history was not simulated. |
| Handover negative | Submit refused with 17 open stages, 29 required tasks, one open site issue. |
| Handover supported | Completed remaining Pre-Construction task and stage; explicitly skipped 16 unperformed stages with synthetic-only reason (tasks cancelled), resolved site issue, supplied owner confirmation/date/summary/handoff. Zero blockers; saved owner-completed summary, ₹2,500 snapshot. No engineering/legal certification. |
| App restart | Inspected/stopped only Sukoon app, relaunched command, opened fresh browser tab; correction ledger projection and completion snapshot retained. |

### Direct HTTP confirmation, separate from browser UI evidence

In-app browser navigation directly to PDF/JSON APIs was partly blocked by the Codex client’s document viewer, so the application response was verified separately through the running app’s normal email-OTP endpoints and local mailbox. These are separate HTTP sessions, not fixture providers or database status patches.

Before the new grant was revoked: shared property GET 200; the visible document list contained only `ffc5f27bda1947dc91b2dba9aadcb865`; selected direct preview GET 200 and its response hash matched the upload; both unselected document metadata requests returned 404; the Construction project GET 200 had `owner=false`, no recorded/estimated budget, empty costs/budgets/contacts, and retained task/update visibility. Owner unscanned bytes remained 423 JSON. After owner revocation: shared property, shared document and direct document requests all returned 404. The existing preservation check also passed with owner spend `250000` paise.

```sh
# Current grant is revoked; checks only existing synthetic records plus normal login sessions.
node scripts/check-construction-review.mjs --revoked
# Without --revoked is intended only while repeating the active-grant exercise.
```

Partial capability changes during assistant output and queued operations remain covered by the existing isolated regression suite; no timing-hook fixtures were injected into this ordinary browser walkthrough.

## Real document/provider boundary

The newly generated one-page harmless PDF was rendered and visually checked, then uploaded with the normal Vault file chooser. The first fresh upload (`4603c5dcbba344cf82f9d2a2e44a9b44`) remained **scan unavailable / quarantined / Preview blocked** after the ordinary worker’s retries because the adapter correctly refused unconfirmed output (`SCAN_RESULT_UNCONFIRMED`). It was not patched or promoted. A second fresh upload (`ffc5f27bda1947dc91b2dba9aadcb865`, version `6a620e2341454ee9b7c875b00e56efdd`) was scanned by the configured ClamAV adapter and recorded `clean` with exact SHA-256/signature evidence. Manual `Registry` review then completed without AI. Owner download bytes matched the uploaded hash; the clean version was linked to the separate active synthetic Construction project and later shared only to the explicitly scoped architect.

The worker’s evidence row records `local-clamav-clamscan`, engine 1.5.4, signature versions/date, timestamp, exact document version and hash, verdict and bounded reason. No clean metadata was manually set, no quarantine bypass or fixture scanner was used, and no external processor was configured. The isolated EICAR fixture was scanned directly by the real engine and detected with exit code 1; it was not uploaded or executed. An empty-signature adapter run remained unavailable with `SIGNATURE_DATABASE_MISSING_OR_AMBIGUOUS`.

The local boundary is complete for this acceptance. Production private storage, production invite/email delivery, OCR and live AI require their own approved adapters and evidence gates. This local result does not claim production readiness, device acceptance, authenticity, government verification or building approval.

## Demonstrated usability changes and screenshots

- Existing typography, colours, logo, mobile-first centered layout and navigation retained.
- Clear planned budget / owner-entered estimate / recorded spend labels. Negative budget difference is shown as over planned budget, not clamped; remaining budget explicitly is not cost-to-finish.
- Fixed Property Passport ignoring `?tab=bills` / `?tab=vault`; tab selection now derives from allowlisted URL state, with Suspense for this Next version.
- Exposed existing S15 payment history/reversal API through Bills. Explicit inline confirmation avoids the native confirmation dialog that stalled this browser tool; no authentication/accounting bypass.
- Handover uses historical financial snapshot fields, not live totals under a historical label.
- Corrected fresh no-workspace/no-shared-history Home from misleading SHARED VIEW to an empty personal portfolio without seeding or creating a workspace on read. Existing revoked delegate history remains shared/empty. Regression-proven; a fresh-account visual recheck after this final copy fix remains open.
- Construction reminder wording includes project follow-ups; obsolete deferred Construction navigation scope removed. Buy/Sell remains guidance-only.

Browser viewport checks: **360×800**, **430×932**, **1280×800**. Correction layout had no horizontal document overflow at the tested dimensions. At 430px, Enter opened Correct entry, Tab focused the amount input, and empty Save was blocked by required amount/reason/confirmation validation without a mutation. This is browser emulation, not a real phone or full accessibility audit.

Screenshots are running-app captures, not generated UI mockups. Full-page browser stitching produced artifacts, so use these viewport captures instead:

- [Correction 360×800](../artifacts/construction-acceptance/correction-360.png)
- [Correction audit below fold](../artifacts/construction-acceptance/correction-audit-360.png)
- [Correction 430×932](../artifacts/construction-acceptance/correction-430.png)
- [Correction desktop 1280×800](../artifacts/construction-acceptance/correction-1280.png)
- [Required-field keyboard check 430px](../artifacts/construction-acceptance/keyboard-validation-430.png)
- [Document picker unavailable](../artifacts/construction-acceptance/document-picker-blocked.png)
- [Delivered reminder](../artifacts/construction-acceptance/reminder-delivered-430.png)
- [Bills reversal history](../artifacts/construction-acceptance/bills-payment-reversed.png)
- [Architect scoped plan](../artifacts/construction-acceptance/architect-plan.png)
- [Revoked project denial](../artifacts/construction-acceptance/architect-revoked.png)
- [Handover refusal](../artifacts/construction-acceptance/handover-blocked.png)
- [Owner-completed handover](../artifacts/construction-acceptance/handover-complete.png)

Remaining visual gates: real iOS/Android, additional desktop browsers, full keyboard/screen-reader sweep, browser history recovery, and final owner visual approval. A “—” beside property readiness means not assessed, not a missing saved property name; the saved name/passport were verified.

## Repository verification

- Prisma validate/generate and migration deploy: passed; 14 migrations applied to local and test databases. Final `db:status`: up to date.
- Focused correction + worker pass: 26 tests at that intermediate checkpoint. Subsequent focused checks exposed an empty-account fixture/model assertion error and revoked-delegate expectation; corrected the actual model query and preserved historical delegate behavior, without weakening those expectations.
- Final `npm run verify`: **lint PASS, typecheck PASS, 7 unit tests PASS, 70 integration tests in 10 files PASS, production build PASS**. Includes OWN auth/authorization, Vault, S12–S22, worker and **23 Construction tests**. Final pass followed the last Home/navigation changes.
- Existing build warnings remain at `lib/providers.ts` and `lib/server-store.ts` for dynamic local-filesystem tracing. These are deployment/packaging gates, not a production approval.
- `git diff --check`: passed before documentation handoff; no forced dependency fix/reinstall.

Post-handover financial correction immutability, simultaneous correction races and permission changes during generation are fixture/API regression evidence. Local ClamAV scanning and positive selected clean-document authorization passed; the Codex PDF viewer’s visual rendering, production provider behavior and physical-device behavior remain unverified. The local guided review is available now without hiding those boundaries.
# 2026-09-12 continuation: controlled expiry and preserved review

Latest related evidence: `evidence/PRIVACY_ERASURE_RECOVERY.md`. No saved review project/document/grant was used as an erasure target. Post-migration checker retains250000paise, old unscanned bytes423 and revoked architect project/cost-source/unselected-document404, providerBypass:false.

On separate synthetic loopback3103, normal Home/list/project/Plan navigation passed. A server-issued300-second session expired naturally; project UI became sign-in, Back/Forward/refresh remained signed out and `/api/session` returned401. Fresh OTP restored access; Plan→Budget→Back→Forward and Budget refresh passed with explicit page-state inspection. No navigation-call replacement was needed. Frame-level no-flash and delayed-response/device evidence remain untested; this is not completion of every session/device criterion. Historical evidence below is preserved.
