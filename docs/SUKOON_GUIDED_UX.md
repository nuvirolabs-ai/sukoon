# Sukoon guided consumer experience — local review checkpoint

**Status:** implemented and accepted on the connected local Android review device; not owner-approved and not a production-readiness claim.

**Checkpoint:** 2026-09-16, `ANDROID_GUIDED_UX_LOCAL_ACCEPTANCE`

This is a focused information-architecture pass over the existing Sukoon product. It makes the reference journey — Home → Property → Documents → Add/View paper — easier to follow while preserving the existing domain, scanner, storage, review, authorization, routes and data. It does not rebuild the backend, add a provider, alter permissions, redesign the logo, publish anything or introduce a new product scope.

## What changed

The first slice is organized around one question: what should the person do next?

- Home now derives a single, data-backed **Next** action from the current account state. It routes to the existing property, Vault/document, sharing or property-creation path without inventing a task or status.
- A property overview now has a small **Next for this property** disclosure before its grouped sections. The existing sections and deep links remain available.
- The property Documents/Vault view now leads with the existing upload path, search and compact status filters. Document rows link to the existing protected detail route instead of repeating preview, download, review, provenance and destructive actions on every row.
- **Add a paper** is a short, explicit three-step flow: choose, confirm context, upload and wait for the existing durable processing path. It reuses `POST /api/documents`, the existing property authorization and the existing worker; it does not create a second upload or processing system.
- Manual classification remains available independently of malware scanning. An unresolved stored `Other` value is shown as **Not sure yet**; the person must choose a category before confirming review. A deliberate selection is labelled **Other document type** and is submitted through the existing review endpoint.
- A reviewed document’s detail screen remains the place for preview, download, category, scanner/provenance, extraction, history and secondary actions. The manual category confirmation disappears once the existing review state is confirmed; the existing extraction review action remains available.
- Scan language is deliberately bounded: **No threats detected by the configured scanner** is not presented as authenticity, legal validity, government approval or building approval.

No backend model, migration, authorization rule, scanner policy, storage rule, construction rule, purchase rule or provider integration was changed in this slice.

## Reference journey

1. Sign in through the normal local sandbox OTP flow.
2. Use Home’s **Next** action or open a property.
3. Open **Documents** for that property.
4. Choose **Add a paper**, select a local PDF, confirm the property/category context and upload.
5. Observe the existing quarantine and durable worker processing state.
6. Wait for the configured local ClamAV result. A failure or unavailable result stays private and cannot be previewed or downloaded.
7. If the paper is clean, use the existing manual category/review step. This does not invoke OCR or live AI.
8. Open the protected document detail view. Preview and download remain behind the existing scan and authorization requirements.

The flow is intentionally summary-first. Scanner evidence, provenance, versions, extraction and action menus remain available on document detail, not removed.

## Security and domain invariants preserved

The path remains:

`upload → private quarantine → real scan → recorded verdict → review-gated downstream access`

The existing implementation still:

- binds scan evidence to the exact document version and SHA-256;
- records scanner implementation/version, signature information where available, scan time, verdict and bounded failure reason;
- fails closed for unavailable/stale signatures, scanner failures, timeouts, unsupported/encrypted content and scan-limit/skipped-content outcomes;
- preserves upload-size, MIME/signature, private-storage and path-containment checks;
- releases preview/download only after the applicable scan and existing review/authorization checks;
- runs a later replacement through its own version and scan path;
- keeps OCR and AI unavailable until separately configured and approved;
- uses server-derived authorization for property and document access.

The UI does not turn a clean scan into extracted fields, authenticity, approval or a reviewer decision. It does not mark a document clean from a successful process exit, and it does not use fixture output in the ordinary acceptance journey.

## Actual local scanner acceptance

The existing local scanner is ClamAV through the existing `MalwareScanPort` and durable worker. It is a foreground `clamscan` invocation over the quarantined upload; no daemon, network listener or whole-machine scan was introduced.

Observed local environment:

- ClamAV `clamscan` 1.5.4 at `/opt/homebrew/bin/clamscan`.
- Private database directory: `.data/clamav/signatures`.
- Freshness policy: signature database must be no more than 72 hours old; missing, stale or future-dated signatures fail closed.
- The approved foreground refresh completed successfully before the final acceptance retry. The observed database set was `daily.cld` 28125, `main.cvd` 63 and `bytecode.cvd` 339, with signature date `2026-09-16T06:24:00.000Z`.
- The worker was running with `APP_ENV=local`, `SUKOON_LOCAL_SCANNER=clamav` and the private database path.

The ordinary browser path used a new harmless PDF with no real property or identity information:

- file: `output/pdf/local-scanner-acceptance-synthetic.pdf`;
- SHA-256: `6627ad24e6f8ae02a5262e083db7df401eec3d2db3e5a13f60db33993183d206`;
- document version: `b2de8af2a59f4c44aae78b8cc4aade5d`;
- final document: `2b360bcec1c9422384166134a5c28316`;
- final state: `clean`, `awaiting_review`, manual review `confirmed`;
- the stored bytes hash exactly matched the uploaded hash.

The first three worker attempts remained unavailable because the signature database was stale. After the approved refresh, retry attempts 4 and 5 recorded a clean result with the ClamAV/signature evidence above. This preserved fail-closed behavior and the full evidence trail.

The signed-in owner UI completed upload, observed the unavailable state, retried, saw the clean result, selected the deliberate **Other document type** category, confirmed it, and returned to a **Reviewed** document detail screen. The in-app browser's native PDF surface remains a blank/dark viewer on this host, but the Android client now uses an authenticated local PDF.js canvas renderer; the protected route, stored bytes and exact hash remain separately evidenced.

This proves local browser upload, real scanning, manual review independence and protected document presentation. It does not prove OCR, live AI, production storage or release readiness.

## Physical Android acceptance — supersedes the earlier blocked note

The connected Motorola moto e13 (`ZD2229Q3KB`) was accepted with the installed debug APK and the ordinary local flow. The Mac's Company OS server on port 3100 was preserved; Sukoon remained on port 3110 and the phone used the exact reversible mapping `tcp:3100 → tcp:3110`.

```text
PHONE CONNECTED TO CURRENT SUKOON: YES
LOGIN WORKING IN INSTALLED APP: YES
GUIDED UPLOAD COMPLETED ON PHONE: YES
PDF VISIBLY READABLE ON PHONE: YES
PHYSICAL JOURNEY RECORDING CAPTURED: YES
```

The original failure was an origin-scheme mismatch: the APK loaded `https://localhost/error.html` while its configured local server was HTTP. The narrow fix selects Capacitor's Android scheme from the configured server URL, so local HTTP uses `androidScheme: http` and hosted HTTPS profiles remain HTTPS. No backend, authorization, storage or scanner bypass was added. The repeatable review command validates the device, generated Capacitor config, Sukoon listener, health endpoint, worker, installed package and reverse mapping before launching the activity:

```sh
SUKOON_ANDROID_DEVICE_SERIAL=ZD2229Q3KB npm run android:review
```

The physical acceptance used the existing sandbox OTP flow and the harmless `local-scanner-acceptance-synthetic.pdf` fixture. The actual Vault upload entered the private quarantine/worker path, ClamAV recorded a clean verdict, the owner completed manual classification as **Other document type**, and the document detail showed **Reviewed**. The authenticated local PDF renderer visibly displayed the synthetic page on the phone. Android Back closed the preview before returning through the app's normal history. Background/force-stop/reopen preserved the signed-in session. Removing only the reverse mapping produced the in-app **No connection** state without signing the account out; restoring the mapping and relaunching recovered the session.

Physical evidence is split honestly between a recording of Home → Vault → Documents → Downloads → exact PDF selection and screenshots of the completed add/scan/review/preview/recovery states. The recording is not presented as one continuous end-to-end capture. Evidence is under `output/android-guided/`; the verified segment is `sukoon-guided-paper-journey-verified.mp4`, and the final readable preview is `10-final-apk-preview.png`.

## Responsive visual evidence

The audit used the populated local synthetic demo account and did not reduce its data to make screens look clean. It captured 46 layouts:

- 42 owner routes, including Home, Properties, property overview, Vault, document detail, Construction, Purchase Workspace, Updates, forms and supporting consumer routes;
- 2 lawyer shared routes;
- 2 architect shared routes;
- mobile widths at 390px, with targeted 430px sweeps;
- desktop presentation at 1280px for representative Purchase and Construction surfaces.

Automated visual checks reported:

| Check | Result |
| --- | --- |
| Horizontal overflow | 0 captures |
| Bottom navigation obstruction | 0 captures |
| Clipped row titles | 0 captures |
| Raw enum labels | 0 captures |
| ISO-format dates in consumer text | 0 captures |
| Dummy/sample language leaks | 0 captures |

The audit recorded three `401 Unauthorized` console messages while moving through protected-route checks. They are expected denial responses, not a page error; they remain visible in `output/ui-visual-audit/results.json` for diagnosis.

Focused current captures include:

- [Home — 390px](../output/ui-visual-audit/owner/home-390.png)
- [Properties — 390px](../output/ui-visual-audit/owner/properties-390.png)
- [Property overview — 390px](../output/ui-visual-audit/owner/property-390.png)
- [Vault tab — 390px](../output/ui-visual-audit/owner/vault-tab-390.png)
- [Document detail — 390px](../output/ui-visual-audit/owner/document-detail-390.png)
- [Construction overview — 390px](../output/ui-visual-audit/owner/construction-overview-390.png)
- [Purchase Workspace — 390px](../output/ui-visual-audit/owner/purchase-overview-390.png)
- [Updates — 390px](../output/ui-visual-audit/owner/updates-390.png)
- [Lawyer shared view — 390px](../output/ui-visual-audit/lawyer/shared-390.png)
- [Architect shared view — 390px](../output/ui-visual-audit/architect/shared-390.png)
- [Desktop Purchase Workspace — 1280px](../output/ui-visual-audit/owner/purchase-overview-1280.png)
- [Desktop Construction — 1280px](../output/ui-visual-audit/owner/construction-overview-1280.png)
- [Machine-readable audit result](../output/ui-visual-audit/results.json)

The earlier broad redesign’s before/after comparison remains in [DESIGN_REDESIGN.md](DESIGN_REDESIGN.md), with captures under `output/design-redesign/`. Those captures are historical context for the already-existing visual system; this checkpoint is the guided-flow slice.

## Accessibility and interaction notes

- The new controls use semantic buttons, links, labels and form controls.
- Touch targets in the guided flow are at least 44px high.
- Existing keyboard, focus and modal behavior remains in the shared component system.
- The guided flow uses the existing reduced-motion rule; its small transitions are not required to understand or complete the journey.
- Search and status filters narrow the list without hiding the existing records or changing authorization.
- The layout remains scrollable rather than compressing dense data into a dashboard wall.

The full device accessibility pass is still open. The phone acceptance covered the guided paper journey, keyboard visibility during interaction, Back, background/reopen and a deliberate connection-loss state; OS-level large-text behavior, physical scanner-failure injection, and a fresh physical signed-out/revoked direct-request matrix remain untested.

## Regression result

`git diff --check` passed. The full `npm run verify` passed on the Node 22 runtime:

- ESLint: passed;
- TypeScript: passed;
- unit tests: **54 passed** across 12 files;
- integration tests: **99 passed** across 13 files;
- Next production build: passed, 64 static pages generated and all application/API routes compiled.

The build still reports the two known dynamic filesystem tracing warnings in `lib/providers.ts` and `lib/server-store.ts`. They pre-date this UI slice and were not changed here. No backend, authorization, scanner or storage regression was introduced by the guided flow.

## What remains deliberately unchanged or open

- Construction, Purchase Workspace, sharing, privacy, bills, payments, reminders, maintenance, Search, Assistant, exports and the genuine scanner remain on their existing domain paths.
- Full deep-form migration and a complete route-by-route accessibility review remain UX debt; the consumer surfaces continue to use the shared design system.
- The in-app browser’s native PDF rendering still needs an unlocked/compatible browser if that surface itself must be visually accepted; Android uses the protected local PDF.js renderer instead.
- Physical large-text, physical scanner-unavailability injection and fresh physical signed-out/revoked/unrelated direct-request checks remain open. Existing automated authorization and fail-closed scanner evidence remains valid and was included in the full regression run.
- No owner approval is implied. Review the focused Home → Property → Documents → Add paper journey before extending the same disclosure pattern to deeper forms.

## Local startup for review

The standard local app remains intended for port 3100. For this checkpoint, the app is running on 3110 because port 3100 is occupied by another local project. The current review process is running and should be left in place.

App, alternate review port:

```sh
APP_ENV=local SUKOON_DATA_DIR=.data \
SUKOON_TRUSTED_ORIGINS='http://localhost:3110,http://127.0.0.1:3110,http://localhost:3100,http://127.0.0.1:3100' \
BETTER_AUTH_TRUSTED_ORIGINS='http://localhost:3110,http://127.0.0.1:3110,http://localhost:3100,http://127.0.0.1:3100' \
/opt/homebrew/opt/node@22/bin/npm run dev -- --port 3110
```

Worker and scanner:

```sh
APP_ENV=local SUKOON_DATA_DIR=.data SUKOON_LOCAL_SCANNER=clamav \
SUKOON_CLAMSCAN_PATH=/opt/homebrew/bin/clamscan \
SUKOON_CLAMAV_DATABASE=/Users/tanutejas/Documents/Sukoon/.data/clamav/signatures \
/opt/homebrew/opt/node@22/bin/npm run worker:local
```

Signature refresh is a foreground operation documented in [LOCAL_SCANNER_STARTUP.md](LOCAL_SCANNER_STARTUP.md). It is not a persistent daemon and must not be changed to a network-exposed service for this local review.

Android review client:

```sh
SUKOON_ANDROID_DEVICE_SERIAL=ZD2229Q3KB npm run android:review
```

This leaves the Company OS listener on port 3100 untouched and applies only the device-side reverse `tcp:3100 → tcp:3110`. Keep the USB connection and the Sukoon app/worker processes running. Rerun the command after reconnecting the phone.

## Owner review handoff

The local app and worker are left running with the synthetic guided-flow account and genuine scanner evidence preserved. The next owner action is visual review of Home’s **Next** action, the property Documents view, and the three-step **Add a paper** flow on the connected phone using `npm run android:review`. This is an owner-review checkpoint, not a final design approval or production release.
