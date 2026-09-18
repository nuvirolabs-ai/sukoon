# Sukoon consumer redesign — local review build

Current typography, spacing, money, status language and no-dummy-language rules: [UI_CONTENT_SYSTEM.md](UI_CONTENT_SYSTEM.md). Visual capture: `scripts/ui-visual-audit.mjs` → `output/ui-visual-audit/`.

## Latest owner correction: rich composition, not sparse screens

The 14 September follow-up supersedes the sparse interpretation in the historical report below. Current evidence, exact retained data counts, capability matrix, screenshot links, source inconsistencies and blocked architect Construction acceptance are in [DEMO_COMPOSITION_CORRECTION.md](DEMO_COMPOSITION_CORRECTION.md). Warm cream/forest surfaces and richer Home, property, Construction and Purchase summaries are now restored without reseeding. Current screenshot folder: `output/demo-composition/screenshots/`. Older screenshots/results below remain historical evidence, not the current acceptance result.

Date: 14 September 2026. Status: **implemented for local review; not owner-approved design**.

## Scope and preservation

This is the owner's requested visual/information-architecture redesign of the existing product, not a backend rebuild or a new product scope. The current all-phases roadmap remains preserved. No schema, authorization, scanner configuration, storage policy, provider binding, paid service or release boundary changed. No records were seeded, reset, archived, deleted, reclassified or edited for these screenshots. Existing demo and historical review accounts remain intact.

The only server-response change is a narrowly scoped Unicode filename repair in the two protected document responses. QA reproduced HTTP 500 for “Demo Registry — Vijay Nagar”: the em dash could not be converted to an HTTP header ByteString. A tested Content-Disposition helper now supplies an ASCII fallback and encoded Unicode filename, preserving inline/download behavior. Document lookup, access checks, bytes and hash headers are unchanged. See [MDN Content-Disposition guidance](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition).

## Design principles

1. Summary first: identify the place, current state and next action.
2. A record is a quiet row until opened. Editing is a deliberate mode.
3. Neutral surfaces, restrained forest actions and typography carry hierarchy.
4. Stored facts stay honest. Unknown readiness remains “Not assessed”; the demo's real project progress is not replaced with the brief's example 28%.
5. Secondary information is relocated, not treated as permission to remove functionality.
6. Consumer copy avoids internal enum names. Original evidence remains available in contextual technical details.
7. A scoped shared view uses only its existing authorized response. No owner name, document status or capability is invented.

## Tokens and components

| Area | Current implementation |
|---|---|
| Canvas / surface | #f6f6f3 / white |
| Primary text / supporting | #202521 / neutral gray |
| Primary action / focus | #1b3d2f |
| Typography | System sans: -apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Inter, sans-serif |
| Brand | Existing SUKOON letterform treatment and blue OO; original Playfair/Georgia fallback retained for wordmark only |
| Hierarchy | Screen 34px; section 23–24px; row 17px; body 15–17px; support 13–15px; technical 12px |
| Surfaces | 20px radius, no heavy shadows; faint row separators |
| Rhythm | 4/8/12/16/20/24/32px spacing reused |
| Navigation | Home, Properties, +, Explore, More; bottom safe-area and trailing content space |
| Desktop | Deliberate 220px side navigation and a bounded reading workspace |
| Motion | 180ms interaction backgrounds; reduced-motion override; no decorative animation |

Shared primitives are in components/ui.tsx and components/consumer.tsx: PageHead, Surface, Button, Input, StatusPill, Sheet, SectionHeader, Metric, GroupedList, ListRow and Disclosure. They are used across owner, shared and supporting routes; the existing internal component-preview route now shows the new primitives.

Sheets use native modal dialogs, labelled headings, Escape dismissal, background scroll locking, return of focus and an explicit visible-control Tab loop. Navigation links inside sheets dismiss the sheet; protected preview/download links do not silently navigate the underlying page. Text inputs remain at least 16px; primary controls and navigation are at least 44px. This is implementation plus browser smoke evidence, not a full accessibility certification.

## Screen changes and disclosure

| Screen | First view | On request |
|---|---|---|
| Home | Owner greeting, actual purchase-value portfolio, property count, project/purchase counts, first three attention rows, quiet category tiles, four human-readable activities | Complete attention projection at /updates?view=attention; all updates; Profile/More for invitation, pricing, language and account controls |
| Properties | Three asset rows with locality/type, known purchase value, document/bill counts and honest readiness | Existing property hub; archived records and restore remain available |
| Property hub | Readiness summary and grouped Documents, Bills, Maintenance, Rent, Timeline, Sharing, Exports | Property details, identity/ownership history, loan/insurance, edit/archive, Assistant and readiness explanation |
| Vault | Collections by property; inside a property, document count and concise document rows | Owner preview/download, manual category, extraction review, scan evidence/hash/source metadata and removal confirmation |
| Construction | Project/current stage/progress, three next actions, grouped destinations | Full plan, budget, materials, documents, site updates, people, timeline, handover; project settings and status actions |
| Purchase | Candidate, stage, location/type, asking/target, actual received-request and open-question counts, one Continue action | Documents, questions, entry response/review form, version evidence and activity; editing, comparison and candidate/workspace creation |
| Updates | Date groups and human activity titles with property/date context | Related record and original event details; raw JSON stays inside Activity details, not the feed |
| Shared view | Shared property, exact authorized document count, selected document rows | Property address/details already permitted by the response; no empty forbidden modules |
| Supporting consumer routes | Consistent typography, neutral surfaces, larger support text | Bill details/payment actions, maintenance forms, sharing invitation/grant actions, privacy sessions/requests/processing, search filters |
| Operations | Existing professional workflows retained | Shared global primitives only; no operator capability changes |

Future-dated source events are labelled “Upcoming dates,” not misrepresented as completed today. Existing source ordering and facts are preserved. The Home projection currently contains 12 attention items (it is capped by the existing API); the redesign shows three rows and links to the complete returned projection. It does not invent the brief's sample count of three.

Existing long creation flows (property setup and construction setup) remain on their dedicated routes. Core obligation/maintenance/sharing creation and privacy controls now open only when requested. Purchase response controls are not permanently visible. No live OCR/AI or legal/government verification is implied.

## Screenshot evidence

Before captures were made with the populated normal demo account before edits, at 390px. After captures use the same records at 390, 410, 430 and 1280px. The architect capture uses the existing synthetic architect identity.

| Screen | Before at 390px | After at 390px |
|---|---|---|
| Home | [Before](../output/design-redesign/before/home-390.png) | [After](../output/design-redesign/after/home-390.png) |
| Properties | [Before](../output/design-redesign/before/properties-390.png) | [After](../output/design-redesign/after/properties-390.png) |
| Property overview | [Before](../output/design-redesign/before/property-390.png) | [After](../output/design-redesign/after/property-390.png) |
| Vault | [Before](../output/design-redesign/before/vault-390.png) | [After](../output/design-redesign/after/vault-390.png) |
| Construction | [Before](../output/design-redesign/before/construction-390.png) | [After](../output/design-redesign/after/construction-390.png) |
| Purchase | [Before](../output/design-redesign/before/purchase-390.png) | [After](../output/design-redesign/after/purchase-390.png) |
| Updates | [Before](../output/design-redesign/before/updates-390.png) | [After](../output/design-redesign/after/updates-390.png) |
| Shared architect | [Before](../output/design-redesign/before/shared-390.png) | [After](../output/design-redesign/after/shared-390.png) |

[Desktop Home](../output/design-redesign/after/home-1280.png), [document detail](../output/design-redesign/after/document-detail-390.png), [purchase question](../output/design-redesign/after/purchase-question-390.png), [larger-text smoke](../output/design-redesign/after/home-large-text-390.png).

After files without a suffix are viewport captures. Files ending -full.png retain the complete scrollable page; a fixed bottom bar can appear across the middle of a full-page composite. This is not a claim that an entire scrollable screen fits one viewport. Before captures were full-page. No before-desktop capture was made.

## Actual local checks

- Full existing npm run verify: lint, type-check, build, 38 unit tests and 90 real-PostgreSQL integration tests passed. Five new unit tests cover presentation wording and Unicode response filenames. No dependency upgrade or migration was made. The build reports two existing filesystem-tracing warnings in providers.ts and server-store.ts.
- Screenshot sweep: seven primary owner routes × four widths = 28 layouts, with no horizontal viewport overflow. Shared architect captured separately.
- Interaction evidence: output/design-redesign/interactions.json. Normal sandbox OTP; summary counts; document row disclosure; keyboard containment, Escape and focus return; exact document deep link; unchanged purchase action values; Construction Plan/Budget Back/Forward/refresh; More-sheet navigation; Property/Bills/Vault history; 11 additional consumer route widths; larger-root-text/reduced-motion smoke; owner property/document preservation; architect selected document 200 and unselected document 404; signed-out refresh/history and protected document 401.
- Protected owner PDF bytes match SHA-256 082a2b619be6c249be5a7871cea4c81513d6f98e9bb2c4384fbccad4d702dd5f. Existing scan evidence is present. This run did not perform or substitute a new scan.
- Historical review checker: node scripts/check-construction-review.mjs --revoked passed. Recorded spend remains 250000 paise; owner unscanned document remains 423; revoked architect project, cost sources and unselected document remain 404.
- Original tests and APIs are retained. No normal-demo write journey was replayed simply for cosmetic evidence; domain mutations remain covered by the full existing integration suite.

## Investigated failures

- Native modal keyboard loop initially included controls inside closed details; visible-control filtering corrected it. Tab containment and focus return then passed.
- Unicode document header HTTP 500 was reproduced in the normal server with its stack, fixed in response presentation only, unit tested, and retested through owner/architect protected requests.
- Screenshot “Earlier” wait was invalid for a dataset whose returned activity all fell within current/future dates; replaced with a present semantic landmark. Future events were separately labelled correctly.
- Purchase summary initially stayed in loading state after its first fetch; final screenshots require the summary to resolve and the interaction test asserts the actual “1 of 2” count.
- Ambiguous candidate text and a case-sensitive question locator were automation problems. Assertions now target the actual heading and exact existing question. No domain assertions were relaxed.
- History waits use expected URLs and selected/visible page state, not network-idle.

## Remaining UX debt and acceptance limits

The requested main overview screens are migrated; the product is not declared final owner-approved. All consumer routes inherit the new shell/type system, but some deeper controls still retain older form density: Construction Plan/Budget/Materials/Handover detail editors; Rent and export configuration; readiness-rule explanations; nested ownership corrections; long privacy fulfillment history. These are reachable, not hidden permanently. Shared invitations, deferred-provider pages and long reviewed guides have typography/surface migration rather than bespoke journey redesign. Operations intentionally remains denser.

Still unverified: physical iPhone/Safari behavior at device scale, VoiceOver and a complete automated contrast/label audit, keyboard-with-mobile-virtual-keyboard layouts, text scaling across every deep form, native PDF visual rendering/file-save in this redesign run, and a fresh timed natural-expiry run. Signed-out history is verified; it is not a new expired-session/no-flash certification. The existing broader scanner/device/release register is not closed by this visual task.

No claims of production storage, OCR, live AI, government/utility integration, payments, public deployment or production readiness. Owner design review remains the next decision, particularly Home hierarchy and the depth of secondary forms.

## Local review and exact resumption

App: http://localhost:3100 (loopback only). Use demo-owner@sukoon.local through the normal sandbox OTP form; it displays the local code. The selected-document shared view is demo-architect@sukoon.local. Do not reseed or reset to review.

Existing startup commands, if the processes are stopped:

- App: npm run dev:local -- --hostname 127.0.0.1
- Worker: npm run worker:local
- Scanner remains the approved per-upload clamscan invocation, not a persistent daemon. Keep its signature-policy instructions in docs/LOCAL_SCANNER_STARTUP.md / existing scanner evidence; this visual task did not alter configuration.

Repeat visual evidence with node scripts/design-acceptance.mjs after; interactions with node scripts/design-interactions.mjs; full regression with npm run verify. The screenshot runner is for the local synthetic dataset and uses the already-installed local browser runtime.

Next: owner review of this local visual build, then remaining deep-form/accessibility/device polish under this same design system. The all-phases feature queue is preserved, not silently resumed or completed by this visual checkpoint. No work is implied after this session ends.
