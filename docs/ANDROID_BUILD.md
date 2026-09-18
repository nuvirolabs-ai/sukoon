# Sukoon Android debug client

This is a **debug APK packaging layer**. It is not a Play Store release, not a Kotlin rewrite, and not production-ready. The existing Next.js application remains the product. The Android app is a Capacitor WebView client that loads that application from a configured backend origin.

## Architecture

```
Existing Sukoon UI (Next.js App Router)
        ↓
Capacitor 8 Android WebView shell
        ↓
Sukoon backend (Better Auth, APIs, worker, ClamAV, PostgreSQL, object storage)
```

The APK does **not** contain PostgreSQL, Prisma, ClamAV, the worker, server secrets, or private document bytes. Those stay on the Mac/server host.

`npm run dev:local` is unchanged. Browser use at `http://localhost:3100` remains the local web profile.

## Capacitor versions

Installed from the official npm registry for this repository:

| Package | Version |
|---|---|
| `@capacitor/core` | 8.5.2 |
| `@capacitor/cli` | 8.5.2 |
| `@capacitor/android` | 8.5.2 |
| `@capacitor/app` | 8.1.1 |
| `@capacitor/browser` | 8.0.4 |
| `@capacitor/camera` | 8.2.4 |
| `@capacitor/filesystem` | 8.1.3 |
| `@capacitor/keyboard` | 8.0.5 |
| `@capacitor/network` | 8.0.1 |
| `@capacitor/share` | 8.0.1 |
| `@capacitor/splash-screen` | 8.0.2 |

Official docs used: [Installing Capacitor](https://capacitorjs.com/docs/getting-started), [Android](https://capacitorjs.com/docs/android), [Configuration](https://capacitorjs.com/docs/config), [App](https://capacitorjs.com/docs/apis/app), [System Bars](https://capacitorjs.com/docs/apis/system-bars).

App ID: `com.nuvirolabs.sukoon`  
App name: `Sukoon`  
Native project: `android/`

## Runtime profiles

| Profile | How it is selected | Backend URL |
|---|---|---|
| `LOCAL_WEB` | Default for `npm run dev:local` | `http://localhost:3100` in the browser |
| `ANDROID_DEVICE_DEV` | `SUKOON_RUNTIME_PROFILE=ANDROID_DEVICE_DEV` or an Android server URL env | Explicit `SUKOON_ANDROID_SERVER_URL` / `NEXT_PUBLIC_SUKOON_API_BASE_URL` |
| `CLIENT_REVIEW` | `SUKOON_RUNTIME_PROFILE=CLIENT_REVIEW` | Verified Tailscale Funnel `https://<machine>.<tailnet>.ts.net` only |
| `STAGING` | `SUKOON_RUNTIME_PROFILE=STAGING` or `APP_ENV=staging` | HTTPS only |
| `PRODUCTION` | `SUKOON_RUNTIME_PROFILE=PRODUCTION` or `APP_ENV=production` | HTTPS only; local/Tailscale HTTP is ignored |

Do not hardcode a personal IP in committed source. Configure the reachable Mac address in gitignored `.env.android.local` (copy `.env.android.local.example`).

### Client-review APK

The separate client-review build is a debug-only Capacitor shell for the
Tailscale-Funnel-backed Mac application. It does not replace the LOCAL or
`ANDROID_DEVICE_DEV` profiles and does not use USB, `adb reverse`, LAN or a
Tailscale app on the client's phone.

```bash
npm run android:client-review
```

The build injects the verified `SUKOON_CLIENT_REVIEW_ORIGIN` HTTPS Funnel
origin from the ignored local review environment, reuses the existing debug
signing mechanism and writes
`output/client-review/Sukoon-Client-Review.apk` with its size and SHA-256. The
output is ignored and must not be committed. Ordinary Next.js UI/API/content
changes are delivered by the Mac server through the existing installed shell;
native Capacitor/Android, origin, permission, plugin, Gradle, icon/splash or
signing changes require rebuilding the APK. See
`docs/CLIENT_REVIEW_RUNBOOK.md` for tunnel, access-code sign-in, startup and phone acceptance
boundaries.

### Development backend URL strategy

Order of preference for a physical phone:

1. **Tailscale** — Mac `tailscale ip -4` (this Mac: `100.113.103.106`) and the **same Tailscale account on the phone**. Bake `http://100.x.x.x:3100`. This Android (moto e13) did **not** have the Tailscale app installed, so Tailscale was not used for the working debug APK.
2. **LAN** — Mac `ipconfig getifaddr en0`. Same Wi-Fi/subnet as the phone. On 15 Sep 2026 this Mac was `192.168.0.128` (ethernet) and the phone was `192.168.0.114` on `1_Floor_5G`; ICMP from the phone to the Mac was unreachable (likely AP/client isolation), so LAN was not used.
3. **USB `adb reverse` (this debug APK)** — while the phone is USB-debugging. The current Mac already has another local project on port 3100, so Sukoon listens on 3110 and the phone-side 3100 is reversed to that listener:

```bash
SUKOON_ANDROID_DEVICE_SERIAL=ZD2229Q3KB npm run android:review
```

Bake `SUKOON_ANDROID_SERVER_URL=http://127.0.0.1:3100`. Device `127.0.0.1:3100` then reaches the Mac Sukoon Next process on 3110 through `adb reverse tcp:3100 tcp:3110`; the Mac's existing port 3100 remains untouched. **Unplugging USB drops this tunnel.** Re-run `npm run android:review` after reconnecting, or rebake with Tailscale/LAN once those actually reach the phone.

`npm run android:sync` writes `.env.android.local` only when `SUKOON_ANDROID_SERVER_URL` is unset. It currently prefers LAN (`en0`) over Tailscale.

### Where the Android WebView URL is set

1. Gitignored `.env.android.local` → `SUKOON_ANDROID_SERVER_URL`
2. Loaded by `capacitor.config.ts` at `npx cap sync` time
3. Copied into `android/app/src/main/assets/capacitor.config.json` (also gitignored)
4. The WebView loads that origin. Cookies are first-party for that origin. Better Auth HttpOnly cookies are used; CapacitorCookies/CapacitorHttp overrides stay disabled.

The Next server must listen on a reachable interface:

```bash
npm run dev:android
```

That binds `0.0.0.0:3100` without changing `npm run dev:local`. From this Mac:

```bash
curl -sS http://127.0.0.1:3100/api/health
# {"data":{"status":"alive"}}
```

The same health URL also returned HTTP 200 on this Mac’s LAN and Tailscale addresses. Add every origin the WebView will use to `SUKOON_TRUSTED_ORIGINS` / `BETTER_AUTH_TRUSTED_ORIGINS` (also in `.env.android.local`). `BETTER_AUTH_URL` can remain `http://localhost:3100` for browser use; Android is an extra trusted origin, not a CSRF/origin bypass.

Production/staging must not inherit debug `server.url`, Tailscale HTTP, `127.0.0.1`, or cleartext.

## Debug network policy

Cleartext HTTP is allowed **only in the debug build type**:

- `android/app/src/debug/AndroidManifest.xml` sets `usesCleartextTraffic=true`
- `android/app/src/debug/res/xml/network_security_config.xml` permits cleartext for debug
- `android/app/src/release/AndroidManifest.xml` sets `usesCleartextTraffic=false`
- Capacitor `server.cleartext` is set only when the configured Android URL is `http:`

Release/staging expect HTTPS. Do not ship the debug network policy as a production default.

## Portrait decision

This first test APK locks the activity to portrait (`android:screenOrientation="portrait"`). The current consumer UI is designed for a phone-width column; landscape was not in scope for this packaging pass. Unlock later if a product requirement needs it.

## Build commands

From the repository root. Capacitor 8's Android library compiles as Java 21. This Mac's Homebrew OpenJDK is 17, and Android Studio's bundled JBR is 25 (too new for Gradle 8.14.3). The successful debug build used a **repo-local** Temurin 21 at `android/.jdk/temurin-21` (gitignored, not a system install).

Java's Gradle wrapper download of `services.gradle.org` timed out on this Mac (SOCKS/connect). The APK was assembled with Gradle **8.14.3** obtained via `curl` from GitHub.

```bash
npm run android:sync
npm run android:apk
```

Expected debug artifact:

`android/app/build/outputs/apk/debug/app-debug.apk`

Current generated debug APK (16 Sep 2026, USB reverse client):

- Filename: `app-debug.apk`
- Path: `/Users/tanutejas/Documents/Sukoon/android/app/build/outputs/apk/debug/app-debug.apk`
- Size: 8,514,557 bytes (8.1 MB)
- SHA-256: `33ebb41757faa98a3992e1418218601e904c456c1159bd4810383c3f84e0c627`
- Application ID: `com.nuvirolabs.sukoon`
- Version: 1 / 1.0
- minSdk 24 / targetSdk 36
- Signed with the Android **debug** keystore only
- Baked WebView origin: `http://127.0.0.1:3100` with debug-only `server.cleartext=true`
- Generated Capacitor Android scheme: `http` for this local HTTP profile; hosted HTTPS profiles remain `https`

This uses the debug keystore. No Play signing key is required or created.

The WebView URL is baked at `npx cap sync` time from gitignored `.env.android.local`. Rebuild after the Mac Tailscale/LAN address changes, or after switching between USB reverse and a network origin.

Open in Android Studio:

```bash
npx cap open android
```

Then Gradle sync. Run on a device with the Run button if USB debugging is enabled.

## ADB install

This Mac already has `adb` at `~/Library/Android/sdk/platform-tools/adb`.

On the phone:

1. Settings → About phone → tap Build number 7 times
2. Settings → Developer options → USB debugging → on
3. Connect USB and accept the debugging prompt

On the Mac:

```bash
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
SUKOON_ANDROID_DEVICE_SERIAL=ZD2229Q3KB npm run android:review
```

If `unauthorized` appears, accept the RSA prompt on the phone and retry. Wireless debugging is optional.

This debug APK loads `http://127.0.0.1:3100` through `adb reverse tcp:3100 tcp:3110`. Without that reverse (USB unplugged, or a Tailscale/LAN bake), `127.0.0.1` on the phone is the phone itself and the WebView will be blank. The review command refuses to take over an unexpected listener and validates that Sukoon is the process serving port 3110.

If the WebView cannot load Sukoon, diagnose in this order:

1. Tailscale connected on the phone? (this moto e13: Tailscale app not installed)
2. Tailscale connected on the Mac? (`tailscale status`)
3. Can the phone reach the Mac Tailscale IPv4?
4. Is Next listening beyond loopback? (`lsof -nP -iTCP:3100` should show `*:3100`)
5. Is the Mac firewall blocking port 3100?
6. Does `GET /api/health` return HTTP 200 on the exact origin baked into the APK?
7. Better Auth trusted origin includes that exact origin (no `*`)?
8. Cookies/session: same host as the WebView, CapacitorCookies disabled
9. Debug cleartext only (`android/app/src/debug`), not a global security disable

## File upload, preview, download

Upload still posts to `/api/documents` and follows quarantine → scanner → review. There is no on-device fake scan and no ClamAV bypass.

On Android, Vault upload exposes **Choose File** (PDF/JPEG/PNG via the system picker) and **Take Photo**. Camera output still goes through the same upload API.

Preview fetches authenticated bytes and shows them in an in-app overlay. PDFs are rendered locally with the pinned `pdfjs-dist` reader into a canvas, with page controls; images still use the authenticated blob path. Download fetches authenticated bytes, writes an app-cache file, and opens the system share sheet. Private files are not published. The share sheet is how the user chooses Files/Drive; Sukoon does not dump Vault bytes into public Downloads unless the user picks that destination.

## Notifications

In-app reminders remain. Native push is **not** configured. `@capacitor/app` is present; live FCM/APNs credentials are a separate provider task.

## Known limitations

- Debug APK only. Not Play-signed, not production-hardened, not a store release.
- The WebView must reach a live Sukoon server. Offline Vault persistence is intentionally not implemented.
- The native in-app browser on this Mac still displays a blank/dark PDF surface; the Android client uses the authenticated local PDF.js renderer and does not open a public viewer.
- `server.url` is Capacitor’s live-server/client mode. Official docs mark it as not a production bundling strategy; hosted HTTPS is required before any release claim.
- Push notifications, production App Links `autoVerify`, and release signing are out of scope.
- Camera is a source option on Vault upload; it is not a new native scanner.
- Hardware Back: open `<dialog>` sheets close first, then in-app history, then the app is minimized at Home. This is not a full native navigation stack.
- This USB-reverse APK stops reaching the Mac if the cable/`adb reverse` drop. Install Tailscale on the phone and rebake, or confirm LAN TCP, before using the phone untethered.
- Capacitor Keyboard `setResizeMode` logs `UNIMPLEMENTED` on this WebView; resize still comes from `capacitor.config.ts`. IME can show; do not treat that log as a failed login.
- Git on this Mac is currently blocked by an unsigned Xcode license; packaging did not reset the dirty worktree.

## Phone checklist (moto e13 `ZD2229Q3KB`, 15 Sep 2026)

| Step | Result |
|---|---|
| App launches | Yes — `MainActivity`, title `SUKOON — Escape the chaos` |
| Login screen | Yes |
| Sandbox OTP | Yes — `demo-owner@sukoon.local` |
| Demo owner Home | Yes — “Good evening, Aarav”, ₹3.02Cr, 3 properties |
| Home scroll | Yes |
| Bottom nav | Yes |
| Properties | Yes |
| Vijay Nagar House | Yes |
| Vault | Yes — 12 documents after upload |
| Construction | Yes — Mehta Residence; Back returns to Construction list |
| Purchase workspace | Yes — Motion Flat 7; Back returns to Purchases |
| Android Back | Sheet closes; document detail returns to Vault tab; nested routes do not kill the app |
| Keyboard | IME reported shown on Search |
| Background → foreground | Session kept |
| Kill / reopen | Session kept (Aarav Home) |
| Logout | Yes — returns to OTP; signed back in so the phone stays usable |
| Vault PDF upload | Yes — Android DocumentsUI Downloads → `sukoon-phone-upload.pdf` → `POST /api/documents` 201 → worker/ClamAV `scan=clean`, phone row “Needs review · 15 Sep” |

Keep `npm run dev:android` and `npm run worker:local` running on the Mac while the phone is in use. The 15 Sep checklist used the then-current 3100 mapping; the accepted 16 Sep continuation below supersedes its connection command.

## Phone acceptance continuation (moto e13 `ZD2229Q3KB`, 16 Sep 2026)

| Check | Result |
|---|---|
| Current APK | Installed `com.nuvirolabs.sukoon` 1.0 (1); SHA-256 `33ebb41757faa98a3992e1418218601e904c456c1159bd4810383c3f84e0c627` |
| Local origin | Working `http://127.0.0.1:3100`; Capacitor Android scheme `http` |
| Port safety | Company OS port 3100 preserved; Sukoon served on Mac port 3110 |
| Reverse mapping | `tcp:3100 → tcp:3110`, applied by `npm run android:review` |
| Sign-in | Normal sandbox OTP flow succeeded; session survived background and force-stop/reopen |
| Guided upload | Exact `local-scanner-acceptance-synthetic.pdf` selected through Android DocumentsUI and uploaded through the real Vault UI |
| Scanner | Existing worker recorded genuine ClamAV clean verdict; no fixture result or status patch used |
| Manual review | Explicit `Other document type` selection changed the paper to `Reviewed`; OCR/AI remained separate and unavailable |
| PDF preview | Protected bytes rendered visibly and readably by the local authenticated PDF.js canvas reader |
| Back | Preview closed first, then normal app history returned through the document flow |
| Network loss | Removing only the reverse showed `No connection` without clearing the session; restored mapping plus relaunch recovered the Home screen |
| Recording/evidence | Verified physical segment plus completed-state screenshots under `output/android-guided/` |

Repeatable phone review:

```bash
SUKOON_ANDROID_DEVICE_SERIAL=ZD2229Q3KB npm run android:review
```

The script requires the phone to be USB-authorized, the Sukoon app to be running on Mac port 3110, `/api/health` to return 200, and the durable worker to be present. It changes only the selected device's reverse mapping and launches the existing activity. It does not install software, clear data or touch port 3100.

## Device acceptance checklist

On a real Android phone, after the backend is reachable:

**LOGIN** — OTP, sandbox code if local, session restart  
**HOME** — scroll, floating nav, safe area above gesture bar  
**PROPERTIES** — switcher, detail  
**VAULT** — list, upload PDF, upload image, Take Photo, scanner states, preview, download  
**BILLS** — view / add if appropriate  
**CONSTRUCTION** — overview, Plan, stages, Materials, sheets, Back  
**PURCHASE** — workspace, evidence, questions  
**SEARCH / UPDATES / SHARING** — architect/shared route still authorized  
**LOGOUT / APP RESTART**  
**NETWORK LOSS** — “No connection” + Retry, session not cleared by a single failure  
**KEYBOARD** — OTP, Add Property, bills, construction, materials, purchase, search; focused field remains visible  

Do not treat a completed checklist as a production launch.

## Release-signing distinction

| | Debug APK (this task) | Release |
|---|---|---|
| Keystore | Android debug keystore | Separate upload key, human-approved |
| Network | Debug cleartext allowed for local HTTP | HTTPS only |
| Play Console | Not used | Not started |
| Secrets | None in the APK | Still none in the APK |
