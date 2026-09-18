# Sukoon Client Review APK runbook

**Status:** zero-external client-review profile is running locally through the
configured Tailscale Funnel. No SMTP, paid service, Render resource or
production deployment is required. The signed-in Moto journey passed over
ordinary Wi-Fi with the updated APK; literal USB removal and a successful
mobile-data pass remain outstanding. This is neither Render staging nor
production.

## Latest physical checkpoint — 2026-09-17

The authorized Moto (`ZD2229Q3KB`) installed
`output/client-review/Sukoon-Client-Review.apk` successfully. The installed
package is `com.nuvirolabs.sukoon`, version `1.0` / version code `1`, with
HTTPS-only client-review configuration. The APK was rebuilt once to correct a
native Capacitor fallback mismatch: `server.hostname` now follows the exact
configured HTTPS origin, and the fallback Retry action returns to `/` rather
than reloading `/error.html`. This keeps outage recovery inside the app
WebView and does not change authentication or application authorization.

The final artifact is 8,514,029 bytes with SHA-256
`72c063add404de42ac083224502d1a942e01aa1c0e67404941820e271499d289`.

Physical evidence captured on the actual phone:

- signed-in Home with the populated synthetic Akshay dataset;
- Properties, Vijay Nagar House overview, Bills and Maintenance;
- Vault upload through Android DocumentsUI of the harmless
  `local-scanner-acceptance-synthetic.pdf`;
- private quarantine/processing state, followed by “No threats detected by
  the configured scanner” from the real local ClamAV path;
- manual category confirmation, protected PDF preview showing the uploaded
  synthetic page, and reviewed status;
- Construction list and Mehta Residence overview;
- Buy / Sell, Purchase Workspaces and Riverfront Residency;
- Search with a real query and matching property result;
- Updates;
- Android Back, keyboard input, background/foreground, force-close/reopen,
  sign-out, and a fresh sign-in.

The Mac-side client-review web process was then stopped in isolation. The
phone showed “Unable to reach Sukoon right now.” and “Your account was not
signed out.” with no localhost, stack trace or debug error. After
`npm run client-review:up` restarted the service, the fixed APK’s in-app Retry
action returned to the authenticated Home without reinstalling. Local port
3100 and the durable worker remained healthy during the outage test.

The Sukoon-specific reverse mapping was removed and `adb reverse --list` shows
only the pre-existing unrelated `tcp:8081` mapping. The USB cable was still
physically attached for this controlled run, so the no-USB acceptance is not
claimed. Wi-Fi was validated and used for the journey. A mobile-data attempt
was blocked by the phone carrier’s exhausted data balance and redirected to a
carrier balance page; therefore mobile-data acceptance is not claimed.

Temporary visual evidence is retained outside the repository under `/tmp` and
was not published as product data. No local account, private document,
database, scanner signature, EICAR fixture or review project was copied into
the APK.

## Intended architecture

```text
Akshay's Android phone
        |
Sukoon-Client-Review.apk
        | HTTPS only
https://<machine>.<tailnet>.ts.net
        |
Tailscale Funnel
        |
Mac: http://127.0.0.1:3110
        |
Sukoon Next.js + existing local PostgreSQL + existing worker
        |
existing private local storage + existing local ClamAV
```

The APK is a Capacitor shell. The current Sukoon web application is served by
the Mac through the tunnel, so ordinary UI, content, form, API and database
changes appear after the local server is updated/restarted. No APK rebuild is
needed for those changes.

This profile does not provision Render, PostgreSQL, object storage, ClamAV or
any paid service. The previous Render Blueprint remains preserved as a
separate, unselected staging plan.

## One-time Tailscale setup

The Mac has Tailscale CLI 1.102.3 installed at `/usr/local/bin/tailscale` and the
macOS system-extension app variant. The current node reports MagicDNS enabled
and the observed node DNS name is
`tanutejass-macbook-pro.tail535562.ts.net`. Funnel is enabled for the exact
route below and was validated to proxy only to the local Sukoon listener. The
owner must keep the node and Funnel policy available during review.

The only command the launcher will run is equivalent to:

```sh
tailscale funnel --https=443 http://127.0.0.1:3110
```

It does not use `--bg`, `--tcp`, `--tls-terminated-tcp`, `--set-path`, or a
startup service. The launcher validates the actual Funnel output before it
prints readiness and requires both the discovered HTTPS hostname and the exact
local proxy target `http://127.0.0.1:3110`. PostgreSQL, ClamAV, the worker,
filesystem paths, diagnostics and all other Mac ports remain unexposed.

Tailscale Funnel supplies a stable `*.ts.net` HTTPS hostname and automatically
provisions its TLS certificate after the required tailnet enablement. The
actual URL must be copied into `.env.client-review.local` as
`SUKOON_CLIENT_REVIEW_ORIGIN`; no hostname is hardcoded or guessed in the
repository. GoDaddy authoritative DNS and `nuvirolabs.com` nameservers remain
untouched. See the official [Funnel requirements and limitations](https://tailscale.com/docs/features/tailscale-funnel)
and [Funnel CLI reference](https://tailscale.com/docs/reference/tailscale-cli/funnel).

## Client-review sign-in setup

Client review deliberately has no email provider. It uses one separately seeded
synthetic account and a strong owner-held access code, exchanged over the
existing HTTPS client-review route and converted server-side into a normal
Better Auth session. The local sandbox mailbox and `/api/auth/dev-mailbox`
remain unavailable in `CLIENT_REVIEW`; no global Better Auth bypass exists.

Generate a code locally, then paste it into the ignored environment file without
printing or committing it:

Copy the template and fill only owner-held local values:

```sh
npm run client-review:generate-code
# Copy .env.client-review.example to .env.client-review.local once,
# then set SUKOON_CLIENT_REVIEW_ACCESS_CODE to the generated value.
```

The local file must contain the exact Funnel origin, the allowlisted synthetic
email and the generated access code. Never commit that file or paste its values
into chat. The access code is rate-limited and is never printed by the routine
startup command.

## Daily Mac startup

After the ignored review environment contains the exact origin and access code,
run exactly:

```sh
npm run client-review:up
```

The launcher validates local PostgreSQL scope and migration parity, verifies
the local ClamAV binary and current signature database, validates Tailscale
state and the exact client-review origin, starts Next only on `127.0.0.1:3110`
with a separate `.next-client-review` directory, detects a recent compatible
local worker heartbeat and reuses that worker, or starts one only when no
healthy local worker exists, waits for local liveness, starts only the
foreground Funnel proxy, then verifies public HTTPS health. Ctrl-C sends
shutdown signals only to child processes started by this launcher; a reused
local worker and unrelated Mac processes are left alone.

The local server uses the existing local database, `.data` storage root and
approved local ClamAV configuration. `CLIENT_REVIEW` uses local access-code
authentication and the existing local reminder dependency; no email service is
selected. OCR, live AI, push, government connectors, payment gateways and
production services remain unavailable unless separately approved.

## APK build

Build the private debug APK with:

```sh
npm run android:client-review
```

The build loads the verified Funnel origin from the ignored local environment
file and injects only:

```text
SUKOON_RUNTIME_PROFILE=CLIENT_REVIEW
SUKOON_ANDROID_SERVER_URL=https://<machine>.<tailnet>.ts.net
```

It reuses the existing Android debug signing mechanism and writes the ignored
artifact:

```text
output/client-review/Sukoon-Client-Review.apk
```

The build prints the exact file size and SHA-256. It restores the prior local
generated Capacitor config and local debug APK after the build, so the existing
LOCAL Android development profile remains independent. The APK contains no
database, worker, ClamAV, server secret, SMTP credential or private document
bytes.

The current Tailscale client-review build is:

```text
Path: output/client-review/Sukoon-Client-Review.apk
Size: 8,514,029 bytes
SHA-256: 72c063add404de42ac083224502d1a942e01aa1c0e67404941820e271499d289
Package: com.nuvirolabs.sukoon
Signing: existing Android debug signing only
Baked origin: https://tanutejass-macbook-pro.tail535562.ts.net
Android scheme: https; cleartext: false; mixed content: false
```

The public browser preflight through the exact Funnel route passed sign-in with
the synthetic review account, normal session/logout behavior, Home, Properties,
Vault, Construction, Purchase Workspace, Search, Updates, Bills and
Maintenance. The physical evidence above supersedes the earlier
browser-only limitation for phone upload, real scan execution, visual PDF
rendering and Mac-off recovery, but does not close the no-USB or mobile-data
gates.

The pre-pivot Cloudflare-origin artifact below is retained for provenance only
and must not be installed for this Tailscale review:

```text
Path: output/client-review/Sukoon-Client-Review.apk
Size: 8,514,576 bytes
SHA-256: d727eee50a6ed49ef5861f9cbf74b2a4c094499ef92c4ec3bb336ad5aa64e765
Package: com.nuvirolabs.sukoon
Signing: existing Android debug signing only
Baked origin: https://demo.sukoon.nuvirolabs.com (superseded by Tailscale pivot)
Android scheme: https; cleartext: false
```

This pre-pivot artifact is not a current client-review deliverable. Rebuild
after the actual Funnel URL is confirmed; the build now refuses to run without
that verified URL.

## What updates automatically

After the APK is installed, these changes are served by the Mac and do not
require a new APK:

- React components and CSS;
- copy, content and guided UX;
- forms and web navigation;
- Next.js API and backend behavior;
- database-backed records and existing local worker behavior;
- document scan/review/preview behavior served by the local application.

The user can leave the app open. The shell does not perform a destructive
timer-based refresh while a form, upload or confirmation is in progress. Next
development updates are picked up by the live web origin; closing/reopening
the app or using the explicit Retry action reloads the current server. A
restart/reopen is the safe recovery point after a server restart.

These changes require a new APK:

- Capacitor configuration or WebView origin;
- Android manifest, permissions, launcher icon, splash or system-bar policy;
- native Java/Kotlin code;
- Capacitor plugin versions or native plugin behavior;
- Gradle, SDK, package/application identity or signing changes;
- any change that makes the shell load a different public origin.

## Client-facing failure behavior

If the Mac, local server or tunnel is unavailable, the app shows:

> Unable to reach Sukoon right now.

with Retry. It does not show localhost, `ERR_CONNECTION_REFUSED`, Tailscale
diagnostics, WebView errors or stack traces, and it does not sign the user out
solely because the server is temporarily unavailable. Client review requires
the Mac and tunnel to be online; offline Vault persistence is not claimed.

## Phone acceptance checklist

Only after the Funnel URL resolves from outside the Mac network and the
owner-held review access code is configured:

1. Build `npm run android:client-review`.
2. Install `output/client-review/Sukoon-Client-Review.apk` on the Moto.
3. Do not run `adb reverse`; unplug USB.
4. Use ordinary Wi-Fi or mobile data.
5. Open Sukoon and sign in with the allowlisted synthetic review email and
   access code.
6. Verify launcher icon, splash, full-screen WebView and no browser chrome.
7. Verify Home, Properties, Vault, synthetic PDF upload, genuine local ClamAV
   scan, manual review, protected PDF preview, Construction, Purchase
   Workspace, Search and Updates.
8. Background and foreground the app; restart it; verify the session and
   retry behavior.
9. Log out and log in again.
10. Stop the Mac Sukoon server or tunnel briefly and verify the client-facing
    connection state.
11. Restart `npm run client-review:up` and verify Retry recovery.

This physical list is not complete until each result is recorded from the
actual phone over normal internet. Local source checks and an APK build are not
substitutes for this acceptance.

## Current blocker and handoff fields

Not yet available honestly:

- literal no-USB/no-ADB Moto acceptance (the cable could not be physically
  removed by the agent; no Sukoon reverse mapping remains);
- successful mobile-data acceptance (carrier data balance exhausted during
  the attempt).

The locally built APK path, byte size and SHA-256 are recorded above and were
revalidated after the final build. The next owner actions are to unplug the
Moto, confirm the app remains on the authenticated Home, and repeat the
journey on mobile data after restoring the carrier balance. No SMTP account,
paid service or DNS change is part of this client-review path.
