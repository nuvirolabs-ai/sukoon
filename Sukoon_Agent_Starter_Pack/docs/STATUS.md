# SUKOON — Current Implementation State

## Latest checkpoint — DEMO_ENRICHMENT_CODE_TESTED, 2026-09-22

An additive `SUKOON_DEMO_ENRICHMENT_V1` seed is implemented for the existing
synthetic Akshay staging workspace. It is fixed to the `2026-09-22` anchor,
uses deterministic namespaced IDs/domain request keys, preserves the existing
user/properties/project/purchase workspace/payment history, and requires the
exact production-staging profile plus database `sukoon_demo_staging`. It
refuses local `.data` and all other database names. It creates no document or
document-version rows and makes no scan, OCR, AI, legal, government, provider
or payment-gateway claim.

The isolated focused unit and integration tests pass, including a second-run
idempotency check and zero-document-write assertion. Lint and typecheck pass.
The command is `npm run demo:enrich:staging`; it has not yet been run against
hosted staging in this checkpoint. Hosted browser acceptance and deployment
evidence remain open. See `../../docs/evidence/DEMO_ENRICHMENT.md` and the
staging runbook. No production action or new infrastructure was taken.

## Latest checkpoint — FINAL_CLIENT_REVIEW_PHYSICAL_MOTO, 2026-09-17

The authorized Moto installed the client-review APK successfully and completed
the signed-in local client-review journey over validated ordinary Wi-Fi:
Home, Properties, property overview, Vault Android DocumentsUI upload,
private processing, genuine local ClamAV clean result, manual category review,
protected PDF preview, Bills, Maintenance, Construction, Purchase Workspace,
Search, Updates, Android Back, keyboard, background/foreground,
force-close/reopen, sign-out and fresh sign-in. The uploaded file was the
harmless synthetic scanner-acceptance PDF; no private review data was copied
to the device or APK.

The controlled Mac-off test stopped only CLIENT_REVIEW. The phone displayed
“Unable to reach Sukoon right now.” and “Your account was not signed out.” The
service was restarted with `npm run client-review:up`; on the rebuilt APK, the
in-app Retry action returned to authenticated Home without reinstalling. A
native Capacitor fallback mismatch was fixed narrowly by aligning
`server.hostname` with the configured HTTPS origin and making Retry navigate
to `/` instead of reloading `/error.html`. No auth, authorization, backend,
database, storage or product-domain behavior changed.

The final APK is `output/client-review/Sukoon-Client-Review.apk`, package
`com.nuvirolabs.sukoon`, version `1.0` / version code `1`, 8,514,029 bytes,
SHA-256
`72c063add404de42ac083224502d1a942e01aa1c0e67404941820e271499d289`.
The Sukoon `adb reverse` mapping was removed; only the pre-existing unrelated
`tcp:8081` mapping remains. Literal USB removal is not claimed because the
agent cannot physically unplug the cable. Mobile-data acceptance is also not
claimed: the phone’s carrier data balance was exhausted and redirected the
attempt to its balance page. No production, paid infrastructure, SMTP, DNS,
deployment or release claim follows.

Regression evidence remains valid after the narrow native fallback change:
`npm run android:client-review` completed successfully, the APK installed with
`adb install -r`, and the prior full `npm run verify` passed (lint, typecheck,
23 unit files / 96 tests, 13 integration files / 99 tests, build), with the two
known filesystem-tracing warnings. Final repository checks are `git diff
--check` and the publication audit; the dirty worktree and saved review
projects remain preserved.

## Latest checkpoint — CLIENT_REVIEW_ZERO_EXTERNAL_ACCESS_CODE, 2026-09-17

The client-review path has been narrowed to the approved zero-external
architecture: the existing local Sukoon app, PostgreSQL, private `.data`
storage, durable worker and local ClamAV remain on the Mac; Tailscale Funnel
exposes only `http://127.0.0.1:3110` through the verified HTTPS hostname
`https://tanutejass-macbook-pro.tail535562.ts.net`. No Render/AWS/Vercel/
Cloudflare service, SMTP provider, paid database/storage, public ClamAV route,
or production deployment was created.

Repository-side implementation is complete for the separate `CLIENT_REVIEW`
profile. It uses an allowlisted synthetic account (`akshay-review@sukoon.local`)
and a strong owner-held access code, creates a normal Better Auth session,
applies the 30-day local review session policy, rate-limits failed attempts and
keeps the local sandbox mailbox unavailable. The existing local demo-owner,
sessions, OTP history, private review fixtures, EICAR fixtures and privacy
erasure data are not reused by the review seed. `npm run client-review:seed`
created a separately namespaced synthetic dataset with three properties, 19
documents, an active Construction project and a Purchase Workspace candidate;
the owner’s existing local data and completed review projects remain preserved.

The launcher checks local database scope/migration parity, ClamAV binary and
signature database, detects and reuses a recent compatible local worker
heartbeat, keeps CLIENT_REVIEW in `.next-client-review`, validates exact Funnel
routing and public HTTPS health before printing readiness. The ready block now
includes `REVIEW LOGIN: configured`; it never prints the access code. The
ignored local environment file is the sole owner-held location for the review
origin and generated code.

Acceptance evidence: public Funnel health and the signed-in browser journey for
Home, Properties, Vault, Construction, Purchase Workspace, Search, Updates,
Bills and Maintenance passed with the synthetic account. Browser sign-in,
normal session creation, logout invalidation, unavailable sandbox mailbox and
failed-code throttling passed. The protected document detail exposed the genuine
local scanner result and protected PDF endpoint; the in-app browser PDF canvas
did not provide accessible text, so a full visual PDF preview claim is not made.
Physical Moto no-USB/no-ADB/Wi-Fi-or-4G acceptance, phone upload/scan/preview,
and Mac-off/recovery evidence remain UNSTARTED.

Client-review APK build passed with the existing Android debug signing path:
`output/client-review/Sukoon-Client-Review.apk`, package
`com.nuvirolabs.sukoon`, HTTPS-only exact Funnel origin, cleartext disabled,
size 8,514,021 bytes, SHA-256
`ce9a10cefb228e2905d347d242f6c302674f9c5a7168484bf1649dd5f90ebdbb`. The APK
contains no server secret, access code, SMTP credential, database, worker,
scanner or private document bytes. It is a client-review debug artifact, not a
production release.

Final verification for this checkpoint passed the focused client-review and
Android tests, `npm run verify` (lint, typecheck, 23 unit files / 96 tests, 13
integration files / 99 tests, build), the publication audit and `git diff
--check`.
The exact next owner action is to generate and store the access code only in the
ignored `.env.client-review.local`, run `npm run client-review:up`, then install
the APK on the Moto and complete the physical acceptance checklist. No paid or
external infrastructure approval is required for this path.

## Historical checkpoint — CLIENT_REVIEW_TAILSCALE_FUNNEL_PIVOT, 2026-09-17

The owner replaced the prior Cloudflare/`demo.sukoon.nuvirolabs.com` client-review
ingress with zero-cost Tailscale Funnel so GoDaddy authoritative DNS and the
`nuvirolabs.com` nameservers remain untouched. Read-only inspection found
Tailscale CLI 1.102.3 at `/usr/local/bin/tailscale`, the macOS system-extension
variant, a running node, MagicDNS enabled and an observed node DNS name of
`tanutejass-macbook-pro.tail535562.ts.net`. `tailscale funnel` is supported by
the installed CLI, but `tailscale funnel status --json` is currently empty;
Funnel enablement, HTTPS certificate consent and the public health URL are not
yet verified. No Tailscale configuration, ACL, other device or public port was
changed.

The CLIENT_REVIEW launcher now requires the owner-supplied verified
`https://<machine>.<tailnet>.ts.net` origin, validates it against the current
Tailscale node and MagicDNS state, checks the local database/migration parity
and current ClamAV signature database, binds Sukoon only to `127.0.0.1:3110`,
starts the existing durable worker, runs only `tailscale funnel --https=443
http://127.0.0.1:3110`, validates the actual Funnel output, and waits for public
HTTPS health before printing the readiness block. The client-review APK builder
now refuses the old Cloudflare origin and requires the verified Funnel URL.

Focused pivot tests: 2 files / 9 tests PASS. Post-pivot `npm run verify` also
passed: lint, typecheck, 22 unit files / 90 tests, 13 integration files / 99
tests against the isolated `sukoon_s02_test_20260911` database with 25 current
migrations, and Next build with the same two existing filesystem-tracing
warnings. Publication audit (438 non-ignored paths) and diff-check pass.
At that earlier checkpoint, remote SMTP credentials and a real client-review inbox remained required; that requirement is superseded by the newer zero-external access-code checkpoint above. The
local sandbox mailbox and `demo-owner@sukoon.local` remain local-only. The
previous Cloudflare-origin APK is retained for provenance but superseded and
must not be installed. No public ingress, external email, deployment, database
reset, production change or paid service was created.

## Historical checkpoint — R03 REPOSITORY_PREPARED_COST_APPROVAL_REQUIRED, 2026-09-17

Repository-side client-demo staging preparation is complete for this slice; no
external staging resource has been created. The current product is on local
branch `codex/sukoon-render-demo-staging`; no Git remote is configured, so a
clean remote staging branch and exact Render source SHA remain unverified. A
sanitized publication audit passed for 429 non-ignored candidate paths. The
local `.data`, OTP/session history, databases, ClamAV signatures, private
documents, EICAR/malware fixtures, APKs, archives and temporary acceptance
output remain excluded from publication.

Implemented and unit-tested: explicit STAGING provider selection for private
SeaweedFS S3 storage, official private ClamAV clamd transport, owner-supplied
SMTP OTP/reminder delivery, exact version/hash scanner evidence, staging
worker migration readiness and heartbeat, authenticated redacted readiness,
and a guarded `demo:seed:staging` path. The staging seed creates synthetic
records/bytes only, queues document/export jobs for the independent worker and
never writes scan verdicts or local markers. Local/test adapters and the local
demo seed remain unchanged in intent.

Added `render.yaml` with one `sukoon-demo-staging` / `demo-staging` project and
environment, isolation/protection enabled, four services plus one paid
non-expiring Postgres database, all in Singapore, private persistent disks only
for SeaweedFS and ClamAV, web-owned migrations, worker readiness fencing and
preview generation disabled. The first apply self-references Render's
generated web `RENDER_EXTERNAL_URL`; the custom domain is intentionally a
second cutover step. No DNS, SMTP provider, Render project, billable service,
external message, deployment or client-ready claim exists.

Current external gates: explicit cost approval for the estimated $73.25/month
resource set; authorized Git-provider connection and clean branch push; Render
workspace authorization; approved SMTP credentials/sender and any separate
DKIM/SPF/domain-verification DNS; then the application DNS record for
`demo.sukoon.nuvirolabs.com`. Details and the exact cost table are in
`../../docs/STAGING_DEMO_RUNBOOK.md` and `../../docs/OWNER_ACTIONS.md`.

The newer owner direction adds a separate zero-cost `CLIENT_REVIEW` APK path
that is not Render staging: the APK will use the verified HTTPS Tailscale
Funnel origin while the Mac keeps the existing local database, worker, private
storage and ClamAV. Repository-side profile/auth/connection/build scaffolding
is in place; the newer access-code implementation removes the SMTP gate. See
`../../docs/CLIENT_REVIEW_RUNBOOK.md`.

The first local client-review debug APK build also passed before this ingress
pivot: `output/client-review/Sukoon-Client-Review.apk`, 8,514,576 bytes,
SHA-256 `d727eee50a6ed49ef5861f9cbf74b2a4c094499ef92c4ec3bb336ad5aa64e765`,
package `com.nuvirolabs.sukoon`, baked Cloudflare-era HTTPS origin, debug
signing only. That artifact is retained for provenance but is superseded and
must not be used for the Tailscale client review. A new APK awaits verified
Funnel origin and is not public-origin, OTP or Moto acceptance evidence.

## Latest checkpoint — STAGING_DEMO_PREFLIGHT_BLOCKED, 2026-09-16 (safe preparation complete; external inputs required)

The requested remote client-demo target `https://demo.sukoon.nuvirolabs.com` has not been provisioned. Focused deployment inspection found no Sukoon staging manifest, linked hosting project, remote database, private object-storage binding, staging ClamAV adapter or remote OTP transport in this checkout. The target hostname did not resolve. The visible Vercel session belongs to the existing Signor Vale projects account and exposes no approved Nuvirolabs demo project/domain; no existing project or unrelated DNS record was reused.

The current app correctly remains LOCAL-only for its local filesystem, local ClamAV and sandbox OTP selections. The existing synthetic seeder is also fenced to the approved local database and `.data` root, so it was not pointed at a remote database. No deployment, paid service, external email, DNS change, local-data copy, database reset, production change or local runtime interruption was performed.

Prepared [client-demo staging runbook](../../docs/STAGING_DEMO_RUNBOOK.md) with an isolated Next/PostgreSQL/worker/private-storage/ClamAV/HTTPS topology, environment separation, secret constraints, remote acceptance sequence, backup/monitoring requirements and the exact owner action set. The next required inputs are: approved hosting/server/project and region with scoped deploy access; private storage choice/retention; approved staging OTP transport, verified sender and credentials; monitoring/backup/rollback ownership; and the provider-specific DNS record for `demo.sukoon.nuvirolabs.com`. Until those exist, client-demo readiness is blocked at provisioning and no staging APK can honestly be built.

## Latest checkpoint — ANDROID_GUIDED_UX_LOCAL_ACCEPTANCE, 2026-09-16 (physical guided-paper acceptance passed; owner review pending)

The earlier `GUIDED_CONSUMER_UX_LOCAL_REVIEW` device-blocker note is superseded by this checkpoint. The connected Motorola moto e13 (`ZD2229Q3KB`) now reaches the local Sukoon app through the installed debug APK. Root cause was isolated through WebView CDP: the APK's configured HTTP server was opened with Capacitor's HTTPS Android scheme, producing `https://localhost/error.html` and `net::ERR_CONNECTION_REFUSED`. The narrow fix derives `androidScheme` from the configured server protocol; local HTTP uses `http`, while hosted HTTPS profiles remain HTTPS. No backend, database, authorization, storage or scanner bypass was introduced.

Five-line acceptance status:

```text
PHONE CONNECTED TO CURRENT SUKOON: YES
LOGIN WORKING IN INSTALLED APP: YES
GUIDED UPLOAD COMPLETED ON PHONE: YES
PDF VISIBLY READABLE ON PHONE: YES
PHYSICAL JOURNEY RECORDING CAPTURED: YES
```

The accepted phone path used the normal sandbox OTP flow, the actual Vault UI and the harmless `local-scanner-acceptance-synthetic.pdf`. The file entered private quarantine, the existing durable worker recorded a genuine ClamAV clean result, manual classification was completed as `Other document type`, and the protected document detail rendered the PDF visibly through the new authenticated local PDF.js canvas reader. The candidate was not made clean by process exit, database patch or fixture output; OCR/AI remained separate and unavailable. Android Back, background/force-stop/reopen and a deliberate missing-reverse connection-loss state were exercised. Removing only `tcp:3100` showed `No connection` without clearing the session; restoring the exact mapping and relaunching recovered the app.

Current device/runtime evidence:

- APK: `../../android/app/build/outputs/apk/debug/app-debug.apk`, 8,514,557 bytes, SHA-256 `33ebb41757faa98a3992e1418218601e904c456c1159bd4810383c3f84e0c627`, package `com.nuvirolabs.sukoon`, version 1.0 (1), debug-signed only.
- Mac Company OS port 3100 was preserved. Sukoon remains on review port 3110 and the device uses only `tcp:3100 → tcp:3110`.
- Repeatable check: `SUKOON_ANDROID_DEVICE_SERIAL=ZD2229Q3KB npm run android:review`.
- Physical screenshots and the verified journey segment are under `../../output/android-guided/`; the recording covers the selection segment, while screenshots cover the completed scan/review/preview/recovery states. It is not represented as one continuous end-to-end recording.
- App and durable worker remain running on the local review setup. The saved review projects and populated data remain preserved. A temporary pending UAT paper exists only on the synthetic guided account from an Android picker selection; it was not deleted or used to alter canonical demo data.

Final regression after the Android and guided-paper changes: `npm run verify` PASS — ESLint, TypeScript, 54 unit tests across 12 files, 99 integration tests across 13 files, migration check (24 migrations current), and Next production build (64 static pages/routes). The same two pre-existing dynamic filesystem tracing warnings remain in `lib/providers.ts` and `lib/server-store.ts`; there were no new warnings or failures. `git diff --check` is clean.

Remaining honest boundaries: OS-level large-text behavior, physical scanner-failure/unavailability injection, and a fresh physical signed-out/unrelated/revoked direct-request matrix remain untested. Existing automated authorization/privacy and fail-closed scanner coverage remains in the regression evidence. This is local debug-device evidence only; it does not claim native push, OCR/AI, production storage, release signing, deployment or production readiness. The earlier browser-native PDF viewer limitation remains separate; the Android client uses the protected local renderer.

## Latest checkpoint — GUIDED_CONSUMER_UX_LOCAL_REVIEW, 2026-09-16 (owner review pending)

Focused consumer information-architecture slice implemented over the existing system: Home next action → property context → Documents/Vault list → three-step Add a paper flow → protected document detail. No backend, schema, authorization, scanner, storage, Construction or Purchase domain changes. The ordinary synthetic browser journey used the existing upload/worker path and genuinely scanned local ClamAV bytes; stale signatures failed closed before the approved refresh, then the same document reached clean + manual review confirmed with exact hash evidence. Responsive audit: 46 captures at 390/430/1280px, zero overflow/navigation obstruction/clipped title/raw enum/ISO date/dummy-language findings; expected protected-route 401 console diagnostics retained. Full `npm run verify` PASS: lint, typecheck, 54 unit, 99 integration, build; two existing filesystem tracing warnings. Physical moto e13 remains blocked by the installed APK's baked 3100 origin while 3100 is occupied by another local project; reversible 3100→3110 reverse did not restore connection. Guided review evidence: `../../docs/SUKOON_GUIDED_UX.md`, `../../output/ui-visual-audit/`, `../../output/pdf/local-scanner-acceptance-synthetic.pdf`. App and worker left running on review port 3110. This is not owner-approved design, device acceptance, production scanning/storage, OCR/AI or release readiness. Next: owner visual review of the reference journey; then address only the reviewed UX/device follow-up.

## Latest checkpoint — T02_IMPORT_EXECUTOR_DONE, 2026-09-15 (roadmap work; UI frozen, no redesign)

T02 import executor implemented, tested and browser-accepted; deal-room invitation/projection grants explicitly deferred to owner question OA13 (no grant model invented). New: migration `20260915043332_t02_import_provenance` (source lineage columns on PropertyDoc); `lib/purchase-import.ts` (same-principal ownership of candidate + Passport, exact-version re-validation, explicit confirmation, UUID request keys, per-item idempotency with resume + 409 on reuse, fresh-scan copies via existing Vault/worker pipeline, append-only HISTORY + idempotent timeline event, four principle notices); `POST /api/purchases/import`; `DocumentSource.purchase_import`; lineage passthrough in `createDocumentForUser`. `npm run verify` PASS (lint, typecheck, 44 unit, 99 integration incl. 7 new executor tests, build). One latent cross-file test race found and fixed minimally (s16 lease claim now filters `DISPATCH_REMINDER`; intent unchanged). Isolated disposable-stack browser acceptance with genuine ClamAV (separate DB/storage/ports/distDir, torn down after; demo untouched): UI upload → real clean scan → UI category confirm → preview → execute → Vault shows imported row; DB lineage verified, original untouched. Evidence `docs/evidence/T02_IMPORT.md`, `output/motion-final/t02-vault-imported-390.png`. Incident: parallel session's Capacitor scaffold broke all routes (500, missing dep); service restored by commenting two lines (files preserved); auth re-verified; their `auth.ts`/store diffs and `android-packaging` unit tests are not mine. Demo fingerprint intact (DB: zero non-disposable writes). App :3100 + worker running. Next: T02 deal-room grants after OA13; T01 native PDF/browser-save when an unlocked browser exists.

## Latest checkpoint — PARALLEL-SESSION INCIDENT + T02 STATUS, 2026-09-15 ~16:50 (service restored, data verified)

At ~16:46 an unidentified parallel session added `components/NativeRuntime.tsx` (+ `lib/deep-links.ts`, `lib/request-origin.ts`, `lib/runtime-profile.ts`, `lib/trusted-origins.ts`; touched `app/layout.tsx`, `components/StoreProvider.tsx`, `lib/auth.ts`, `lib/client-store.ts`) importing `@capacitor/core`, which is not installed — every route returned 500. Minimal reversible response, no deletions: commented out the two `NativeRuntime` lines in `app/layout.tsx` with a re-enable note; foreign files left in place for their owner. App recovered (200). Auth re-verified after the incident (fresh revoked login → shared[] + doc 404; owner session 200). Untracked-file inventory cannot run (`git` itself is Xcode-gated); `lib/auth.ts`/`client-store.ts` foreign diffs are NOT reviewed — recommend the owning session documents them and auth checks re-run on their landing. Data verdict: DB proves zero non-disposable writes (only authorized Motion-Acceptance purchase rows); session-timeline count variance (78/80/82) against a static DB indicates nondeterministic ordering in a capped projection query — recorded backend observation, no action in this frozen-UI pass.

## Latest checkpoint — OWNER_CHECKPOINT_PREP_2026-09-15 (commit pending: Xcode-license-gated git, runbook ready)

## Latest checkpoint — OWNER_CHECKPOINT_PREP_2026-09-15 (commit pending: Xcode-license-gated git, runbook ready)

Owner visual-review checkpoint prepared; UI redesign work stopped per owner direction (+ stays full-page wizard, motion system is the frozen baseline, roadmap resumes from next dependency-eligible task). Disposable synthetic workspace "Motion Acceptance Disposable / Motion Flat 7" exercised end-to-end through the real UI: doc Requested→Received→Reviewed (incl. real ClamAV scan + manual category confirm, which REVIEW correctly requires) and question Open→Answered→Resolved→Reopened; evidence `output/motion-final/purchase-{receive,review,answer,resolve,reopen}.gif` + screencast frames. Canonical workspace untouched (6 entries, INFORMATION_GATHERING). No safe single-workspace delete exists (only create/update actions; `demo:reset` would nuke all demo identities — refused), so the clearly-named disposable workspace remains for owner disposition. 14-screen review captured with zero console errors; lawyer 11-doc projection + architect scoped construction view verified; Preview/Download verified live; Remove verified by code path only (no demo deletion); Replace-version upload is not a Vault-tab feature (documented gap, not a defect). `npm run verify` PASS (lint, typecheck, 41 unit, 92 integration, build) + `git diff --check` clean. Demo fingerprint: all counts identical; DB proves zero writes since seed day. Commit NOT created: /usr/bin/git is blocked by the macOS Xcode-license gate with no admin/brew path in-session; exact add-lists, exclusions, message, tag and no-push rule recorded in `output/motion-final/COMMIT_RUNBOOK.md` for one-command execution by the owner. App :3100 + worker left running.

## Latest checkpoint — FINAL_MOTION_POLISH_OWNER_REVIEW, 2026-09-15 (main working tree; no merge/commit/push)

Final consumer UI/motion pass on the current design + motion system. No backend/domain/schema/permission/scanner/calculation/sharing change; no reseed; demo verified untouched (fingerprint before/after: 3 properties, 19 docs, 4 bills, 17 stages/37 tasks/4 materials/6 updates/32%, 1 workspace/6 entries; DB TimelineEvent total 151 with zero rows created since seed day — the session-projection 78→80 read variance is not a write). New: `docs/MOTION_SYSTEM.md` (primitive catalog, 140/220/360ms tokens, binding private-data motion policy); `AnimatedRemovalList` safe-default immediate unmount (`allowExit` opt-in only for non-sensitive cosmetics — no consumer list uses exits); toast audit (all messages generic; provider unmounts with auth shell on logout); `PropertySwitcher` sheet with spring checkmark (preserves tab); Document Detail reordered status→actions→metadata→scanner; `FlashOnChange` rate/count highlight on change only (no per-load currency animation); `motion-expand` for purchase/activity history; skeleton swaps (reminders/maintenance/obligations/assessment/project) + AnimatedSegment for reminder/maintenance filters; global press feedback for text actions/summaries.

Evidence `output/motion-final/`: `nav-scroll.gif` (scroll-down compact / scroll-up expand), `add-sheet.gif` (open + Esc close), `search.gif` (typing → results), `property-switch-390.png`, `reduced-{properties,sheet}-390.png`, `logout-clearing.json` (post-logout: sign-in only, no private text/toasts/nav), `perf.json` (0 longtasks on Home/Vault/Plan/Updates/Purchase), plus prior `output/motion-evidence/` (24 PNGs, transition/sheet/expand/removal GIFs, architect shared views, interaction-checks). Auth boundaries re-verified read-only: revoked→shared[]+doc404; architect selected200/unselected404; architect search returns only 2 shared docs; logout→401. `npm run verify` PASS (lint, typecheck, 41 unit, 92 integration, build) + `git diff --check` clean. Sign-out clears private UI synchronously pre-network (pre-existing `signOut`, code-verified). Purchase Requested→Received→Reviewed / Open→Answered→Reopened morphs implemented but deliberately not exercised (would mutate demo). App :3100 + worker running; stopped for owner visual review.

## Latest checkpoint — MUSE_UI_MOTION_V2_INTEGRATED_LOCAL, 2026-09-15

`muse/ui-motion-v2` and `main` are identical at `83232ca64b553fe3347abab6fe86653d9a35283f`; no committed branch delta existed to merge. The shared dirty working tree was reviewed on the Muse ref and is now on `main` without reset or overwrite. Safe motion work remains integrated. `AnimatedRemovalList` was rejected at all private Home/Search/Vault data call sites because its exit retention could keep removed private records visually present for 220ms; those surfaces use immediate-unmount `AnimatedList`. No backend, API, permission, scanner, database, calculation, or sharing-scope change was accepted. Final `npm run verify`: lint/typecheck PASS, 41 unit PASS, 92 integration PASS, build PASS with the two existing filesystem tracing warnings. Construction revoked-scope and browser privacy/focus checks PASS. See `../../docs/MUSE_UI_MOTION_REVIEW.md`.

## Historical checkpoint — MOTION_V2_BRANCH_REVIEW, 2026-09-15 (branch `muse/ui-motion-v2`, before contract review)

V2 interaction pass on a dedicated branch; main untouched (still at 83232ca), no commit, no push, no API/authorization/calculation/scanner/sharing-scope/database change, no reseed, no demo-data mutation (all evidence via read-only OTP sessions as demo-owner + demo-architect). Deltas over the v1 motion pass: `--motion-standard` aligned to 220ms (fast 140 / standard 220 / slow 360); canonical alias exports (`MotionPage`, `MotionStatus`, `FloatingChrome`, `Sheet`); chevron nudge on row press; new `AnimatedRemovalList` (220ms fade-and-collapse exits, exit-cancel on re-add, inert+aria-hidden while leaving, reduced-motion unmounts instantly) applied to Home attention, Vault filters and Search results; Construction site-updates wrapped for insertion animation; Purchase "Edit details or progress" converted from inline `<details>` to a MotionSheet; `Sheet` stays mounted so exit animation + focus restoration run on every dismissal path (fixed a real focus-restore miss found by probe).

Evidence: `output/motion-evidence/` adds 410/430 sweeps (properties/vault/plan/purchase/updates) + properties-desktop, `architect-shared-390`, `architect-property-390`, `architect-construction-390` (Shared project, scoped tabs, no Budget) + `architect-construction-plan-390`, `search-focus/results-390`, `add-sheet-390` (purchase question sheet), `vault-filter-reviewed/needs-attention-390`, screencast frames `cast-{removal,sheet,expand}-*.png`, GIFs `vault-removal.gif`/`sheet-spring.gif`/`plan-expand.gif` (real frames) + earlier `transition-property.gif`, `interaction-checks-v2.json` (keyboard open→focus-in-dialog; Esc→closed+focus-restored-to-row; backdrop-tap→closed; Tab+Enter navs; rapid 3-route taps settle on last; materials deep-link refresh OK; reduce→0.01ms). `interaction-checks.json` (v1: Plan scroll 0 longtasks/37 rows; Back/Forward URLs; double-tap one fetch per navigation, zero animation calls) still stands. Critical tooling note: headless-shell defaults to `prefers-reduced-motion: reduce`, which silently nulls all motion — all v2 motion frames captured with explicit no-preference emulation; DOM probe proves exits (11 held 30→210ms, unmounted by 240ms) and spring/expand mid-frames verified visually.

Verify: eslint PASS, `tsc --noEmit` PASS, 41 unit PASS (incl. consumer-presentation), `next build` PASS. Integration suite not re-run (no server file touched). Purchase Requested→Received→Reviewed / Open→Answered→Reopened morphs are implemented (`StatusTransition`) but not exercised live — doing so would mutate demo data. App left running on loopback :3100. Local interaction evidence only; not device/production/provider/deployment/release approval.

## Previous checkpoint — MUSE_UI_MOTION_CONTRACT_REVIEW_LOCAL, 2026-09-15

The repository has `muse/ui-motion-v2`, but it is identical to `main` at `83232ca64b553fe3347abab6fe86653d9a35283f` with no committed branch delta; the current work remains dirty and is now on `main` without reset or overwrite. The accepted interaction work remains in place. The compatibility `Sheet` wrapper preserves native dialog close/focus lifecycle, shared-property document links use the explicit scoped shared-document endpoint, and the v2 exit-retention component is excluded from private Home/Search/Vault data rows because removed private records must unmount immediately. No API, authorization, scanner, database, domain-calculation, persistence, dependency or product-scope change was introduced. Post-fix `npm run verify` passed with 41 unit and 92 integration tests; the saved Construction authorization check and live focus/scoped-document smoke also passed. Detailed review and limitations are in `../../docs/MUSE_UI_MOTION_REVIEW.md`. This remains local regression evidence and owner-review-pending visual work; no device, production, provider or release claim follows.

## Latest checkpoint — MOTION_POLISH_PASS_LOCAL_REVIEW, 2026-09-15

Presentation-only interaction pass over the existing consumer surfaces; no API, authorization, calculation, scanner, sharing-scope, purchase-domain or database change, no reseed, no mock data in components. New dependency-free motion system in `components/motion/` (Pressable/PageTransition/AnimatedList/AnimatedSegment/StatusTransition/Toast/Skeleton/CollapsingHeader/MotionSheet + useReducedMotion/useScrollState) with fast 140ms / standard 230ms / slow 360ms tokens; CSS transform/opacity only; `prefers-reduced-motion` disables entrance/shimmer/sheet animation (probe: transition 0.01ms). Floating scroll-aware bottom nav with gliding active pill (compacts, never hides); collapsing large-title headers; spring bottom sheets with grabber/focus-restore/Esc; moving-capsule segments; crossfading status badges; compact toast pills (payment/obligation/reminder/review/revoke/evidence/construction saves); layout-matching skeletons; Home stagger; property/vault/construction/purchase/updates/search/shared stagger without hiding records; Construction Plan vertical roadmap with expand/collapse (17 stages/37 tasks intact, stagger capped); Purchase Details→Documents→Questions→Decision journey stepper (heuristic presentation only); construction/material/purchase status morphs.

Evidence: `output/motion-evidence/` — 24 PNGs at 390/410/430/1280 (Home, Properties, property-open transition frames t1/t2, Property Overview, Vault, Document Detail sheet, Construction list/overview/Plan/Plan-expand, Purchase, Updates, Shared, Share tab, Search), 3 GIFs (transition-property, sheet-doc, construction-plan-expand), `interaction-checks.json` (Plan scroll 0 longtasks over 37 task rows; Back/Forward URLs correct; deep-link refresh OK; double-tap issues one navigation fetch each, zero animation-triggered calls). Verify: eslint PASS, `tsc --noEmit` PASS, 41 unit PASS (incl. consumer-presentation), `next build` PASS. Integration suite not re-run (no server file touched). One real defect found and fixed during capture: AnimatedList wrapper flattened ListRow flex layout (chevrons wrapped); fixed via `.motion-item:not(.list-row)` scoping, re-shot. Shared architect/lawyer recipient views could not be captured as demo-owner (no inbound grants; `/api/shared/properties` empty) — owner-side Sharing scopes + role picker captured instead. App left running on loopback :3100 for owner review. This is local interaction evidence only; not device, production, OCR/AI, provider, deployment or release approval.

## Latest checkpoint — DEMO_COMPOSITION_CORRECTION_LOCAL_ACCEPTANCE, 2026-09-14

The approved synthetic-demo correction scope is implemented and reproducible; no UI redesign or unrelated roadmap work was started. The corrected seed uses an exact money boundary, adds the normal Property Tax payment path, aligns Mehta Residence to ACTIVE/32% derived progress, links four ClamAV-scanned and manually confirmed Construction documents, publishes seven synthetic-only S12 rules through the real review flow, evaluates 83% readiness through S13, and accepts the separate identity-bound architect Construction grant. Existing review projects, ClamAV evidence, privacy evidence, prior shares and rich records remain preserved.

Evidence and capability matrix: ../../docs/DEMO_COMPOSITION_CORRECTION.md. Current audit: `output/demo-composition/demo-correction-after-audit.json` with 3 properties, 20 workspace documents/versions, 4 bills, 6 obligations/10 occurrences/2 payments, 76 timeline events, 5 share records, 3 readiness snapshots/7 items, 1 Construction project/17 stages/37 tasks/4 links and 6 Construction events, and Purchase Workspace evidence. `output/demo-composition/browser.json` records 63 clean owner/lawyer/architect captures across 390/410/430/1280px, hash-preserved download, scoped document checks, and Back/Forward/refresh acceptance. Full local verification is recorded in the report after the post-correction run; the two existing storage-tracing warnings remain.

The lawyer's 11-record metadata projection remains an intentional consequence of its existing broad metadata scope; only selected Registry/Mutation bytes are previewable. Normal empty first-run accounts and authorization paths were not changed. This remains local synthetic evidence and is not owner-approved design, production scanning/storage, OCR/AI, device, deployment or release readiness. Next action: owner visual/data review of the corrected local demo; no unrelated module continuation is implied.

## Latest checkpoint — CONSUMER_REDESIGN_LOCAL_REVIEW, 2026-09-14

Owner-authorized visual/IA redesign now covers the shared system and eight primary consumer surfaces, plus quieter supporting forms, search, bills, maintenance, sharing and privacy. Read/edit separation, native modal disclosure, human activity labels, safe-area bottom navigation and deliberate desktop sidebar replace dense overview presentation. Full before/after report: ../../docs/DESIGN_REDESIGN.md.

Local proof: 28 primary layouts at390/410/430/1280 without horizontal overflow; sandbox OTP, keyboard/disclosure/focus return, owner Unicode PDF bytes, purchase summary/action values, Construction and property-section Back/Forward/refresh, 11 supporting routes, architect selected200/unselected404, signed-out refresh/history and direct401. Historical review checker --revoked passed with250000paise and unchanged423/404 boundaries. Final full regression: lint/typecheck/build PASS;38 unit +90 integration PASS; two existing storage-tracing warnings.

No normal-demo record edits, new scans, migrations, authorization changes, dependency upgrades or deployments. A pre-existing Unicode filename HTTP500 was fixed only in protected response presentation. UI01 remains owner-review-pending; UI02 deep-form and comprehensive device/accessibility work remains open. App and original worker remain on loopback. No continued work is implied after this session.

## Latest checkpoint — SYNTHETIC_DEMO_DATASET v1, 2026-09-14

`npm run demo:seed` completed against the approved normal local database and storage root. The local-only, versioned runner `scripts/demo-dataset.ts` uses six stable `demo-v1-*` personas, three synthetic property passports, 16 document versions processed by the existing durable worker and real ClamAV 1.5.4, manual confirmation independent of scan status, obligations/bills/reminders, maintenance, Construction planning records, scoped sharing, purchase evidence, timeline/search-compatible owner data, and a local account-export workflow record. `npm run demo:reset` was exercised after an interrupted seed and removed only exact demo identities; production-mode and unapproved-root fences returned non-zero before writes.

Ordinary headless Chromium acceptance `node scripts/demo-browser-evidence.mjs` passed: owner OTP/Home/Properties/Vault/Construction/Purchase/Updates rendered, and the architect’s signed-in shared view showed only the selected `Demo Sanction Map — Vijay Nagar`; unselected direct document access returned 404. Screenshots and scanner/version/hash evidence are in `../../docs/evidence/SYNTHETIC_DEMO_DATASET.md` and `../../output/synthetic-demo/evidence.json`. Normal app and worker are running on loopback 3100. This is local synthetic evidence only; it does not close production providers, OCR/AI, device, deployment or release gates. Existing S00–S30, O01/T01/T02 and saved review evidence remain preserved; T02 is still IN_PROGRESS.

## Latest checkpoint — T01 evidence / T02 read-only foundation, 2026-09-12 23:59 IST

Current authoritative delta: `../../docs/evidence/O01_T01.md`. Migration23 enforces owned-property XOR purchase-candidate Vault context, immutable context and exact-version evidence links. Existing scanner/worker/manual review and protected bytes reused. Real ordinary-app upload, v1/v2 ClamAV evidence, manual categories, question answer/resolve/reopen, reauth, zero owned properties and screenshots captured with installed headless Chromium. Native PDF popup visual capture/browser file-save remains blocked/unverified; physical device acceptance untested. T01 remains IN_PROGRESS acceptance, not a full completion claim.

New isolated purchase erasure/actual backup-restore replay run0e59dfd623be53e6 PASS with originals/replacements/derived evidence/jobs removed and another owner's purchase bytes preserved. Normal review preserved. OA04 still blocks live erasure. Final23:58 verify exit0: lint/typecheck/build PASS,33 unit +90 integration PASS,23 migrations current normal/test; same2 tracing warnings. Construction --revoked checker PASS including250000paise.

T02 independent safe foundation started and tested: POST `/api/purchases/import-preview` validates owner/candidate/destination/exact reviewed versions and returns PREVIEW_ONLY with importEnabledfalse. No copy, ownership, grants or seller records changed. Next: identity-bound scoped deal-room access and explicit confirmed provenance-preserving imports through Vault/fresh scan. Existing owner-action register and full roadmap remain active; no deployment/paid provider/external delivery authorized by this checkpoint.

## Latest checkpoint — O01 / T01 organizer, 2026-09-12

Final23:20 IST `npm run verify` exit0: lint/typecheck/build PASS,33 unit +88 integration PASS,22 migrations current in normal/test/current O01 source target; two existing tracing warnings. Buyer sign-out/sign-in retained prospect/details/request/question/history; Profile remains0 active properties. Saved review checker --revoked and diff-check PASS.

See `../../docs/evidence/O01_T01.md`. O01 browser: created a monthly manual loan schedule, corrected to quarterly/₹120.75, recorded payment, refreshed, and verified owner-entered balance ₹1,234.56 unchanged. Co-owner name alone had zero grants; separate PROPERTY_BASIC_READ-only sandbox invitation was denied before acceptance, allowed basic projection after acceptance, then revoked by owner; fresh recipient/refresh denied. Direct scoped HTTP returned404 for shared property, Bills and document list after revocation.

T01 IN_PROGRESS: buyer-controlled workspace/candidate/entry models, private UI/API, comparison, local requests/questions/notes/stages/history, centralized authorization, paise/unknown validation, retry/version guards and account-records export coverage. Browser first-run buyer created an external prospect and saved request/question/stage across refresh without an owned Passport. Purchase Vault context, actual scanned evidence, received/reviewed distinctions, question resolution, full role/reauth/screenshot/device acceptance remain unfinished; this is not T01 completion. No T02 completion claim. Two additive migrations21–22 preserve synthetic write fences on upgraded disposable targets. Existing genuine scanner and Construction review remain intact. OA04 still blocks real erasure. No commit/deploy/new provider approval inferred.

## Latest checkpoint — PRIVACY_ERASURE_RECOVERY / O01, 2026-09-12

Final checks22:42 IST: lint/typecheck/build PASS,33 unit +84 integration tests PASS,20 migrations current in normal/test targets. Real restore/restart HTTP and normal review preservation PASS. Browser records archive saving remains Chrome-policy-blocked; frame-level/device proof remains untested. Final source and exact resumption details are in the evidence file below.

Current evidence `../../docs/evidence/PRIVACY_ERASURE_RECOVERY.md` supersedes earlier "executor unimplemented" statements below. S23/S24 remain IN_PROGRESS. Synthetic-only request confirmation, scope/DB/root/policy fences, manifests, external durable instruction catalog, database/storage write fencing, resumable cleanup and real older-backup replay are implemented and exercised. Final primary run355ae965ad60d2d1: property + account + delegate erasure, DB rollback, process exit75 interruption, storage failure/retry, repeated replay, three existing outbox jobs, actual pg_dump/pg_restore and restored Next HTTP authorization. Normal saved review remains separate and preserved.

Chrome on separate runcf9094ffc2548660: supported failed-job cancellation and audit passed; records-v1 generation READY passed, browser download still blocked by Chrome. Natural Construction Plan expiry, signed-out Back/Forward/refresh and renewed Plan/Budget history/refresh passed. No frame-level no-flash or physical-device claim.

Continued O01 rather than stopping at foundation: manual ownership/loan/insurance records, honest unknown balance, typed dates/history and explicit existing schedule links/prefill; concurrent request-key schedule dedupe. Focused property tests5 passed; browser persisted synthetic records and non-financial renewal with three in-app reminders. Remaining O01 role/loan-schedule acceptance is still tracked, followed by T01 private Purchase Workspace. Provider/content/platform/cost/deployment decisions remain consolidated in OWNER_ACTIONS; live erasure requires OA04. Full final verification and runtime checkpoint are appended to the evidence report. No work is implied after the session ends.

## Latest continuation checkpoint — 2026-09-12 late evening

All-phases authority and the single F/O/T/M/B/G/P/E/X/R backlog remain in force. Historical sections below are retained, not current completion claims. S23 and S24 are **IN_PROGRESS**, not complete.

Delivered: existing content workflow in restricted operations console with revision guards/audits; allowlisted failure diagnostics and audited cancellation (not generic retry); future document-intelligence withdrawal across enqueue/dispatch/result boundaries; scoped local account-records export with explicit confirmation, expiry, durable generation and authenticated integrity-checked retrieval; server-issued client expiry and guarded disposable short-session configuration. Additive migrations17–19 applied to local/test/isolated acceptance DBs. Saved projects, real ClamAV, owner document hashes and revoked architect boundaries preserved.

Actual browser: isolated owner denial, synthetic operator draft/review/publish/retire audit sequence; natural300-second expiry and protected Profile/Operations Back/Forward/refresh sign-in rendering; separate owner account export request/confirmation/READY; explicit withdrawal acknowledgment. Browser download and direct API navigation were blocked by Chrome policy; separate sandbox-authenticated HTTP ZIP download returned200,915bytes and matching hash. Frame-by-frame no-flash is not proved. No real operator elevated; disposable operator only.

Evidence and final regression result: `../../docs/evidence/OPERATIONS_PRIVACY_FULFILLMENT.md`. Scope/deletion matrix: `../../docs/PRIVACY_LIFECYCLE.md`. Owner actions: `../../docs/OWNER_ACTIONS.md`. Normal runtime remains localhost3100 and seven-day sessions; isolated acceptance runtime is separate3102/300seconds, never production.

Final checks: lint/typecheck PASS;30 unit tests in5 files PASS;83 integration tests in11 files PASS; build PASS with the same two existing dynamic-filesystem warnings;19 migrations current; diff-check and saved Construction review checker PASS. Normal3100 app/worker running; disposable3102 app/worker stopped with data retained for resumption.

**Next executable task:** F04 synthetic-only deletion executor: enforce source execution fences, persist scoped cleanup manifest and recovery tombstone, clean every version/object/derived/export/grant/job/session, test partial failure/resume and restore replay on disposable DB. This engineering is unimplemented, not blocked by missing renewed scope approval. OA04 blocks live policy-dependent fulfillment only. Also finish F02 browser cancellation, richer diagnostics, allowed-surface download and full expiry/no-flash proof. Do not claim the broader statutory account export complete from v1's deliberate exclusions. Continue canonical roadmap after these honest boundaries; no background work is implied.

## Current all-phases checkpoint — 2026-09-12 evening

Latest owner mandate is `../../SUKOON_ALL_PHASES_MASTER_PROMPT.md`. The one expanded backlog remains `../SUKOON_MASTER_PLAN.md`; S00–S30 historical evidence below is preserved, not a statement that all phases are done. Earlier scanner-unavailable/OWN-only/continue-only-on-request statements are historical and superseded.

S23/S24 are IN_PROGRESS. Implemented this session: restricted redacted operations snapshot and public liveness separation; owner session listing/revoke-others with action receipts; immediate logout cache clearing and stale-response suppression; persistent privacy request/cancel intake (not deletion/export fulfillment); owner audited same-job scan recovery retaining exact version/hash and all attempts. Migration 16 is additive `20260912193000_privacy_request_intake`, applied to local and isolated test databases.

Real browser: original failed synthetic PDF recovered via UI + ordinary ClamAV attempt 4; confirmed scanned PDF visibly rendered in Chrome. Home/list/overview/Plan/Budget Back/Forward, Budget refresh, Bill return and selected Vault return passed. Owner denied operations. Synthetic privacy request/cancel survives refresh and account has zero sample properties. Expiry/no-flash browser acceptance and positive operator browser remain unfinished.

Latest full verification: lint, typecheck, 27 unit tests in 4 files, 78 integration tests in 11 files, build, db:status and diff-check PASS. Two existing dynamic-filesystem build warnings remain. Baseline main `83232ca64b553fe3347abab6fe86653d9a35283f`, pre-existing dirty work preserved, no commit/deploy/new paid provider. Exact evidence: `../../docs/evidence/ALL_PHASES_FOUNDATION.md`; consolidated decisions: `../../docs/OWNER_ACTIONS.md`.

Next executable task: F02/S23 content-review console using existing S12 guards/transitions; extend redacted handler diagnostics and audit, then approved-policy-independent consent/cleanup tests. See canonical queue for all remaining T/M/B/G/P/E/X/R tasks. Work does not continue after this session ends.

## Current checkpoint - 2026-09-12

Pack version: 1.0
Repository: `/Users/tanutejas/Documents/Sukoon`
Branch / commit at discovery: `main` / `83232ca`
Working tree: DIRTY before work; existing changes preserved
Application code: INSPECTED; Next.js client prototype plus local foundation batch
Database / migrations: LOCAL DONE - 13 Prisma/PostgreSQL migrations current in isolated local and test databases
Mobile build: NOT VERIFIED
API / worker / web: local API routes and durable PostgreSQL worker added; production operations not configured
Provider connections: NOT CONFIGURED OR VERIFIED
Staging / production: NOT VERIFIED
Client design approval: NOT RECORDED
Release readiness: NOT READY

## Task state

S00 DONE with `docs/REPO_AUDIT.md` and `docs/evidence/S00.md`. S01 DONE for the currently applicable web workspace. S02-S04 are DONE for the isolated local foundation. S05-S08 are DONE LOCAL: reusable primitives, category-first shell, typed Property Passport mutations/history/archive, and durable worker/provider ports are implemented and evidenced. S09-S11 are DONE LOCAL: private vault/version/protected preview, bounded text parsing with separate OCR stage/records, and fixture-backed source review are implemented and evidenced. S12-S15 are DONE LOCAL: controlled typed rules, immutable explainable record-readiness snapshots, manual obligations/occurrences, and manual paise payment/receipt/ledger records are implemented and evidenced. S16-S18 are DONE LOCAL: durable reminders/preferences, maintenance lifecycle/timeline, and identity-bound capability sharing are implemented and evidenced. S19-S22 are DONE LOCAL: authorized private search, cited read-only assistant, scoped expiring exports, and real-data Home/Updates/current-education integration are implemented and evidenced. S23-S30 remain TODO.
The local-only object-byte adapter, unavailable scanner/OCR adapters, fixture AI, synthetic rule fixtures, synthetic published education rows, sandbox email mailbox and unavailable push adapter are development/test boundaries. Local S02-S22 completion is not production authentication, email delivery, object storage, malware scanning, OCR, live AI, notification-provider, payment-processing, staging, or production readiness.
Construction OS (C-OS): DONE LOCAL under the new explicit expansion brief; persistent setup/roadmap/tasks, Vault/checklists, canonical costs, materials/entered rates/procurement, manual contacts, site updates/reminders/timeline, scoped search/sharing/assistant and owner handover. This supersedes the old Construction future-only boundary. See `../../docs/CONSTRUCTION_OS.md` and `../../docs/evidence/CONSTRUCTION.md`.
Next action: accept/review the Construction checkpoint. S23 operations admin remains the next numbered task on explicit continuation; S23–S30 are not completed by this expansion.

## Inputs already included

The original seven-page concept PDF, original SUKOON logo, latest home mockup, product and engineering specifications, dependency-based master plan and release checklist.

## Open external inputs

Database/toolchain integration, deployment/provider choices and credentials, privacy/retention/content/health-definition approvals, signing accounts/devices and final design acceptance remain open. Inspect before assuming they are available.

## Session checkpoint

Completed: repository discovery, scope mapping, empty first-run state, local PostgreSQL/Prisma migration, Better Auth email OTP with hashed OTP/session rows, workspace ownership constraints, version-guarded state transaction, centralized owner authorization, local document metadata/bytes split, S05 reusable primitives and gallery, S06 category shell/routes, S07 typed Property Passport APIs/UI/history/archive, S08 durable worker/provider ports, S09 private vault/version/protected preview, S10 bounded text parsing plus separate OCR stage/records, S11 schema-validated fixture extraction/review, S12 operator-only typed content rule lifecycle, S13 immutable explainable health snapshots, S14 recurrence-safe obligations, S15 manual payment/receipt/ledger flow, S16 durable reminders/preferences and provider boundaries, S17 maintenance lifecycle/timeline and expense linkage, S18 identity-bound capability sharing/revocation, API negative tests, restart/lease reclaim, and evidence reports.
Tests: `npm ci`, migrations/status, lint, typecheck, build and verify PASS with the two existing local-filesystem tracing warnings; unit 2 files/6 tests, real-Postgres integration 10 files/63 tests, focused Construction 1 file/17 tests, auth 1/1 and authorization 1/1 PASS. The full suite retains all 46 OWN tests and adds the connected Construction journey, exact accounting/reversals, scoped architect denials, stale/idempotent mutations, completion and persistence. Browser setup, progress, expense/material/site records and real app-restart checks supplement API/domain tests. npm reports four high advisories; no force fix.
Blockers: no real local malware scanner, OCR binary/provider, production object storage, live AI, external email or push delivery, payment gateway/reconciliation, full operator console, reviewed health/content corpus, mobile/device, backup/restore, staging/production, and formal design approval. The local scanner boundary fails closed; signature checks are not malware scanning. Local sharing is identity-bound at the authenticated API boundary, but local invite delivery remains sandbox-only and production retention/policy approval is open.
Next exact action: review the Construction evidence and approved local boundaries; continue S23 only when requested. Preserve the dirty worktree and all OWN records. No staging, production, paid provider or real-device acceptance is implied.

## Session checkpoint template

```text
Date/time:
Agent/tool:
Branch/commit:
Working tree status:
Current task and actual status:
Completed this session:
Tests executed and results:
Device/provider checks performed:
Evidence files:
Decisions added:
Known failing tests:
Blocked tasks + owner + next unblock action:
Next eligible task:
Exact next command/action:
Release readiness and why:
```
