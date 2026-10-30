# 05 — Execution, deployment and delivery contract

## 1. Scope and operating limits

Work only on Sukoon V1. Do not touch V2, Aven/Company OS, Gagan, Dogkart, their repositories, browser contexts, services, databases or ports.

No new paid service, storage, scanner, SMTP, database or domain change is approved by this pack. Use the existing Sukoon staging Web/Postgres/Worker. Do not apply the old Render Blueprint wholesale: it may include intentionally deferred services or database plans.

Use the checked-out package/scripts and deployed configuration as evidence. Do not assume commands, provider readiness or remote credentials from these filenames alone.

## 2. Evidence-first working order

### Gate 0 — Source, environment and safe workspace

- Read AGENTS and the current repository runbooks plus this pack.
- Record branch, commit, dirty/untracked state; preserve all work without reset/clean.
- Inspect GitHub/current local differences. The reference SHA in this pack is not permission to overwrite newer work.
- A branch name by itself does not preserve uncommitted files. Use a protected, secret-free local checkpoint/patch/snapshot appropriate to current policy. Do not commit private runtime data or secrets to make a safety checkpoint.
- Record expected Render service/database and current provider flags. Do not reveal connection strings, codes or session tokens.
- Coordinate with any agent already editing/deploying V1 to avoid simultaneous schema/code writers.

Output: concise baseline plus exact environment identity. Do not spend another session restating the whole architecture.

### Gate 1 — Fix the empty Construction result first

Run file 01's preflight, implement any missing safe bootstrap, then test on a disposable local database. Deploy the necessary reviewed changes to existing staging only through an authenticated correct service binding and the owner's approved workflow.

Run the Construction-only seed in staging with an exact target guard. Verify rerun, counts, money and authenticated display. Keep the existing broad `demo:enrich:staging` command out of this task unless its entire additional scope is reviewed and actually needed.

Do not label Construction done merely because a local fixture or seed test passes.

### Gate 2 — Buy/Sell gap matrix

Map both existing code and UI against file 02/03:

`capability | existing source/model/route | present/partial/missing | required delta | migration | authorization impact | provider gate | tests`

Inspect at least: purchases, purchase stages/evidence/import, Vault, property lifecycle, current shared views, authz, payment ledger, reminders, Construction event infrastructure, search, account export and erasure inventory.

No duplicate model simply because a new conceptual name appears in the specification. No importing V2 UI. No overwriting Construction visuals.

### Gate 3 — Private buyer and seller vertical slices

Implement/test one connected private flow first:

`sign-in → Buy/Sell → existing/add candidate or sale → real overview → question/request → offer/terms → next action → refresh`

Then manual financing/money, visits, history and handover. Use domain-specific mutations and truthful unavailable states. Private workflows must not wait for paid infrastructure.

### Gate 4 — Permissioned room and evidence

Implement the restricted role/visibility policy with isolated authenticated personas. Keep private organizer content out of rooms. Test owner disclosure preview separately from actual recipient access.

Real document paths reuse Vault. Full media tests run only where private storage and real scanning are configured; hosted capabilities remain disabled unless separately authorized.

Do not modify staging sign-in to allow anyone to type another person's email. If hosted participant identities are not available, complete and test code locally and report the exact hosted multi-party gate. Do not stop unrelated private workflow implementation.

### Gate 5 — Events, guidance and lifecycle

Use existing transaction/outbox patterns. Add rule-specific reevaluation and time triggers. Cover revoke/expiry, stale versions, archiving, money reversals, term revisions, cancelled visits, source replacement, and handover changes. Ensure new data participates in privacy/export inventory.

Do not send notifications externally without a configured approved delivery path and recipient scope. A durable in-app update does not mean external email delivered.

### Gate 6 — Seed the lived-in Buy/Sell scenarios

Implement the scenarios in file 04 only after typed objects/actions exist. Old negotiation notes remain historical; converting them to typed offers needs explicit source mapping and deduplication, not invented seller-authored confirmations.

Scenario application is additive and idempotent. Reuse suitable existing candidate/sale/property records. Fail with a sanitized conflict report rather than force-overwriting client edits. Rerun once to prove convergence.

### Gate 7 — Review and publish

- Run lint, typecheck, unit/integration/authz suites and production build.
- Keep tests isolated so background workers or shared fixtures cannot corrupt their evidence.
- Reproduce and explain failures. A rerun passing does not erase an intermittent failure.
- Run publication audit against staged and reachable source as appropriate. Exclude `.env*` live secrets, `.data*`, dumps, tokens, uploaded bytes, generated APKs/build caches, screenshots/videos, runtime archives and scanner signatures. Secret-free examples may remain.
- Stage exact reviewed paths, inspect the staged diff, commit changes in bounded functional slices. Never force-push or overwrite another agent's changes.
- Use existing branch/deployment workflow. New migration is additive and backwards-compatible where possible; test against representative existing data first. A `DROP` rollback is data loss once the tables contain records, not a recovery plan.
- Report resource/cost impact before any operation outside existing approved capacity.

### Gate 8 — Actual hosted execution

Confirm the current source commit is deployed, migrations are current and correct account/database attached. Run guarded seeds inside the authorized Sukoon environment, not a Gagan/Dogkart shell or localhost with a renamed environment variable.

Safe Render targeting uses exact service ID/context, not left/right screen position. If the tool cannot bind to the authenticated correct service, do not click in an unrelated window. Return a short exact blocker and the ready command; do not claim it executed or ask for secrets in chat.

Seed commands must not run in an ordinary web startup, predeploy hook, public API route, or unprotected admin button. Execute as a scoped owner-authorized one-off operation. Leave a resumable, sanitized report.

### Gate 9 — Hosted user acceptance

Use the actual synthetic staging identity. Verify visible enriched Construction and both buying/selling journeys, search, updates and private data boundaries. An HTTP 200 page shell is insufficient.

Authentication and liveness can pass while full readiness stays degraded because storage/scanning are deliberately disabled. Preserve that honest distinction and no fake upload success.

Record exact hosted URLs and entity IDs locally in the evidence report for reproducing routes. Do not expose secrets or sensitive real-user information.

### Gate 10 — Android

Inspect the installed APK's origin first. The old Mac/Tailscale APK may not be displaying Render at all. Distinguish this from empty data.

Normal served UI changes may not require a new shell build; confirm current native configuration before rebuilding. If origin/plugins/native assets change, use the existing V1 Android build path, preserve `com.nuvirolabs.sukoon`, increment version metadata as appropriate, record the new hash and keep the previous artifact separately. Do not install as the V2 package or clear app data by default.

Phone acceptance includes real Build/Buy/Sell loading, normal Back, keyboard, large text, refresh/reopen and ordinary external internet with no required `adb reverse` or Mac backend. Report NOT RUN if no device is attached; continue browser/source work where safe.

## 3. Finish criteria

### Construction

The real hosted review user sees the intended project and connected stages, money, decisions, procurement, history and guidance. Data survives reruns and logins. Missing providers are honest. No unrelated records or V2 changes.

### Buy/Sell

Both sides work, not just a buyer demo. Data is typed, persisted and authorized. A user can create/continue a purchase, ask a question, record negotiation, track manual financing and money, prepare a sale, track distinct prospects, select disclosures and record handover. Permissioned collaborator and byte workflows have separate tested/provider statuses. Existing private purchase/history/import behavior remains intact.

### Report

Return only observed facts in a table:

- Root cause of empty Construction.
- Source/deployed SHA and actual target database/account.
- Added/reused/conflicting records by category; second-run effects.
- Construction visual and money checks.
- Buying/selling feature checks.
- Real participant, document and provider status.
- Privacy/authorization tests.
- Authenticated hosted routes checked.
- Android origin/build/install/device status.
- Known failures and exact next action.

Never substitute "implemented" for "deployed", "seeded locally" for "seeded hosted", or "role preview" for "recipient authenticated".

## 4. Scope decisions the implementer may make

Implement normal additive code changes, focused tests, safe schema extensions in the V1 branch, and local disposable testing needed for the specified product. Preserve current data and providers. Choose names/adapters based on the repository rather than literal conceptual table names.

Stop only the affected step for genuinely missing access, destructive changes, ambiguous real-record ownership, new paid resources, new live recipient authentication/disclosure, cross-owner retained document copies, or legal/retention choices not covered here. Continue independent safe work. Do not repeatedly ask for approval of the same already-supplied product brief.

Do not expand into public marketplace, live payments, automated title verification, new Construction features or a global redesign.
