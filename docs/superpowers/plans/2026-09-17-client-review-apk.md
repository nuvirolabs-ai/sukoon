# Sukoon Client Review APK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separately configured `Sukoon-Client-Review.apk` that loads the current local Sukoon application over the verified HTTPS Tailscale Funnel origin without USB, ADB, the client's Tailscale app or paid infrastructure.

**Architecture:** Add a `CLIENT_REVIEW` runtime profile that uses the existing local PostgreSQL, local private storage, local ClamAV and durable worker, plus an allowlisted synthetic email and owner-held access code that creates a normal Better Auth session. No SMTP or paid/external service is selected. Add a Mac launcher that starts only the local Sukoon web process on `127.0.0.1:3110`, the existing worker and a foreground Tailscale Funnel proxy whose fixed target is only `http://127.0.0.1:3110`. Build the APK through the existing Capacitor/Gradle debug-signing path with the verified client-review origin injected at build time and restore the prior local generated configuration afterward.

**Tech Stack:** Next.js 16.3.4, Better Auth, existing Prisma/PostgreSQL/local ClamAV and worker, Capacitor 8.5.2, Android Gradle debug build, Node launcher and Tailscale Funnel.

**Spec:** User-supplied `SUKOON CLIENT REVIEW APK` brief dated 2026-09-17.

## Global Constraints

- `LOCAL_WEB` and `ANDROID_DEVICE_DEV` behavior remains unchanged.
- `CLIENT_REVIEW` must use an owner-supplied verified `https://<machine>.<tailnet>.ts.net` origin; localhost, LAN, Cloudflare and ADB reverse are rejected.
- Client review uses local database/storage/scanner/worker only; no paid infrastructure or Render provisioning is performed.
- Client review authentication uses only the allowlisted synthetic account and owner-held access code; the local sandbox mailbox and OTP display endpoint remain unavailable.
- Tailscale Funnel exposes only the Sukoon HTTP listener on Mac port 3110; PostgreSQL, ClamAV, worker, filesystem and diagnostics remain private.
- No credentials, tunnel tokens, APKs, private documents, OTPs or runtime state are committed.
- No automatic refresh may interrupt forms, uploads or confirmations; retry remains explicit.
- Existing authorization, document quarantine/scan/review and protected preview/download contracts are unchanged.

---

### Task 1: Add the CLIENT_REVIEW runtime and remote-auth boundary

**Files:**
- Modify: `lib/runtime-profile.ts`
- Modify: `lib/trusted-origins.ts`
- Modify: `lib/auth-mailbox.ts`
- Modify: `lib/smtp-mailbox.ts`
- Modify: `lib/durable-reminders.ts`
- Modify: `scripts/run-local-worker.ts`
- Test: `tests/unit/client-review-profile.test.ts`

**Interfaces:**
- Produces `SukoonRuntimeProfile` value `CLIENT_REVIEW`, validated owner-supplied Funnel origin and profile helpers used by Capacitor and launcher code.
- Produces `isClientReviewAuthEnvironment()`, `clientReviewSmtpConfigured()` and a client-review reminder dependency factory.
- Existing local/test mailbox behavior continues to be selected only outside `CLIENT_REVIEW`.

- [x] **Step 1: Write failing tests** for profile resolution, HTTPS-only origin selection, trusted-origin filtering, access-code configuration and rejection of the local sandbox mailbox in client review.
- [x] **Step 2: Run the focused test** and verify it fails because `CLIENT_REVIEW` and its auth boundary do not exist.
- [x] **Step 3: Implement the minimum profile/auth changes**. Treat client review as an HTTPS hosted-origin profile for trusted-origin filtering, but retain local storage/scanner/worker selection. Use the guarded access-code endpoint to create a normal Better Auth session; never read or display local OTPs.
- [x] **Step 4: Run the focused test and existing auth/provider tests** and verify they pass.
- [x] **Step 5: Run `npm run lint` and `npm run typecheck`** for the changed TypeScript.

### Task 2: Make client-review connection failures client-safe

**Files:**
- Modify: `components/StoreProvider.tsx`
- Modify: `components/NativeRuntime.tsx`
- Modify: `native-shell/error.html`
- Test: `tests/unit/client-session-boundary.test.ts`

**Interfaces:**
- Produces a fixed client-facing unavailable state: “Unable to reach Sukoon right now.” with an explicit Retry action.
- Internal exception text, Cloudflare errors, WebView error names and stack traces are not rendered in the client-review shell.
- Existing explicit navigation/back behavior, authenticated preview/download and form state are preserved.

- [x] **Step 1: Add a failing boundary assertion** proving an unreachable session does not render the internal error text and retains a retry action.
- [x] **Step 2: Run the focused test** and verify the current provider exposes the raw error.
- [x] **Step 3: Replace only the rendered unreachable message** with the fixed user-facing copy; keep the internal error available only for non-UI diagnostics if needed.
- [x] **Step 4: Run client-session and Android-related unit tests** and verify they pass.

### Task 3: Add the one-command local app, worker and tunnel launcher

**Files:**
- Create: `scripts/start-client-review.mjs`
- Create: `.env.client-review.example`
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `docs/CLIENT_REVIEW_RUNBOOK.md`

**Interfaces:**
- `npm run client-review:up` loads only the ignored `.env.client-review.local`, validates the exact profile/origin/port and Tailscale state, checks local database/migration/scanner readiness, starts `next dev` on `127.0.0.1:3110` in `.next-client-review`, reuses a recent compatible local worker heartbeat or starts one only when needed, waits for local liveness, then starts or validates the foreground Tailscale Funnel and verifies public HTTPS health.
- The launcher never binds or forwards PostgreSQL, ClamAV, worker, filesystem or diagnostic ports and never logs secret values.
- Shutdown uses child-process signals only and leaves unrelated processes untouched.

- [x] **Step 1: Write failing pure validation tests** for exact Tailscale node/origin, MagicDNS, local proxy target and no TCP/alternate-port settings.
- [x] **Step 2: Run the focused test** and verify the launcher validation is absent.
- [x] **Step 3: Implement the launcher and package scripts** with sanitized logs and graceful child shutdown.
- [x] **Step 4: Add the ignored local template** with the verified Funnel origin and access-code variable only; do not include the generated code or runtime state.
- [x] **Step 5: Document the Tailscale Funnel command** as exactly `tailscale funnel --https=443 http://127.0.0.1:3110`, with no background service, TCP forwarding or other exposed port.
- [x] **Step 6: Run launcher/config tests and shell/static checks**.

### Task 4: Add a separate client-review APK build profile

**Files:**
- Modify: `capacitor.config.ts`
- Create: `scripts/build-client-review-apk.mjs`
- Create: `.env.android.client-review.example`
- Modify: `package.json`
- Modify: `tests/unit/android-packaging.test.ts`
- Modify: `docs/ANDROID_BUILD.md`

**Interfaces:**
- `npm run android:client-review` builds `android/app/build/outputs/apk/debug/app-debug.apk` with `SUKOON_RUNTIME_PROFILE=CLIENT_REVIEW` and the verified `SUKOON_CLIENT_REVIEW_ORIGIN` injected only into the child build environment.
- The script uses the existing `assembleDebug` signing path, emits a copy at `output/client-review/Sukoon-Client-Review.apk`, prints size and SHA-256, and restores the prior ignored generated Capacitor config after completion.
- LOCAL Android sync/build remains configured from `.env.android.local` and is not overwritten.
- Hosted client-review Capacitor settings use HTTPS, disallow mixed content/cleartext and permit only the exact origin.

- [x] **Step 1: Write failing tests** for the client-review origin/profile, HTTPS scheme, exact navigation host and output naming/path rules.
- [x] **Step 2: Run the focused test** and verify it fails because the profile/build entrypoint is absent.
- [x] **Step 3: Implement the profile-aware Capacitor settings and isolated build script** by reusing the existing Android sync/toolchain helpers.
- [x] **Step 4: Run the Android packaging tests and `npm run android:client-review`** after the verified Funnel URL became available; do not commit the superseded pre-pivot APK.
- [x] **Step 5: Record the prior artifact as superseded and document the new origin-gated build; do not record an acceptance claim until the remote origin works.**

### Task 5: Verify and document the client handoff boundary

**Files:**
- Modify: `docs/CLIENT_REVIEW_RUNBOOK.md`
- Modify: `docs/ANDROID_BUILD.md`
- Modify: `Sukoon_Agent_Starter_Pack/docs/STATUS.md`
- Modify: `docs/RELEASE_MATRIX.md`
- Test: full repository suite

**Interfaces:**
- Documents automatic updates for ordinary web/API/database changes served by the Mac and the exact native changes requiring a new APK.
- Documents the owner-held access-code setup and Tailscale Funnel boundary without inventing a provider or sending mail.
- Separately records local source/build evidence, public HTTPS/tunnel evidence and physical Moto acceptance; none is substituted for another.

- [x] **Step 1: Run `npm run verify`** and record exact lint, typecheck, unit, integration and build results.
- [x] **Step 2: Run the local Tailscale/Funnel preflight** after the actual URL was confirmed; record the exact route and local proxy target.
- [ ] **Step 3: Build/install and physically test the APK** after the owner configures the ignored access code: sign-in, core screens, upload/real local ClamAV, preview, background/reopen, logout/relogin, Mac-off connection state and recovery.
- [ ] **Step 4: Record APK path, byte size, SHA-256, startup command and rebuild rules; do not call the result production-ready.**
