# Muse UI / Motion Integration Review

Date: 2026-09-15

## Outcome

The repository contains `muse/ui-motion-v2`, but it has no commit or tree difference from `main`: both refs point to `83232ca64b553fe3347abab6fe86653d9a35283f`, and there is no separate worktree. The dependency-free interaction pass is present only in the shared dirty working tree, alongside the existing Sukoon implementation. The similarly named `MUSE_B2B_AUTONOMOUS_BUILD_KIT` directory is an unrelated B2B prompt kit and was not used as a merge source.

There was no committed branch delta to merge. The working tree was reviewed on `muse/ui-motion-v2`, the accepted interaction work was preserved, and the checkout was switched back to `main` without resetting or overwriting dirty files. Three integration decisions were made without changing server authorization, persistence, domain calculations, or product scope:

1. The compatibility `Sheet` wrapper no longer unmounts the native dialog when `open` becomes false. This preserves the motion sheet's close lifecycle and restores focus to the opener for edit/share/document disclosures.
2. Shared-property document rows now use `/api/shared/documents/:id`, the explicitly scoped shared-document endpoint, instead of relying on the general document route's shared-account fallback. The endpoint still rechecks the active grant and selected-document scope on every request; no capability was added.
3. Muse's `AnimatedRemovalList` is not integrated into private Search, Vault, or Home data rows. Its 220 ms retention would keep removed private content mounted and visually fading after query, scan/review, deletion, revocation, or account-scope changes. Those call sites use `AnimatedList`, which unmounts removed records immediately while retaining safe reveal/stagger behavior.

## Contract review

The review checked the current source against the applicable source-of-truth, canonical decisions, scanner evidence, sharing policy, document-processing path, and privacy boundaries.

| Surface | Review result |
| --- | --- |
| Authentication and session | Preserved. UI reads remain behind the existing Better Auth session; no client identity, cookie, OTP, or session-lifetime change was introduced. |
| Owner document access | Preserved. Preview/download continues through the protected version-aware route and remains gated by owner scope, active records, exact current version, clean scan, and storage integrity. |
| Malware scanning and processing | Preserved. Motion components do not select a scanner, mark a document clean, bypass quarantine, or trigger a new processing system. The existing ClamAV-backed durable worker and fail-closed evidence path remain authoritative. |
| Manual review and intelligence | Preserved. Presentation states do not become review decisions; OCR/AI availability is not inferred from animation or loading state. |
| Sharing and revocation | Preserved and made more explicit in the shared document link. Server-side scope, expiry, selected-document checks, and output-time reauthorization remain unchanged. |
| Construction and Purchase | Preserved. Motion is presentation-only; project/task/budget/cost permissions, integer-paise accounting, Purchase Workspace ownership boundaries, and evidence/version rules remain in their existing APIs and repositories. |
| Privacy and erasure | Preserved. No new cache, persistence, export, deletion, retention, or background side effect was introduced. |
| Dependencies and release surface | Preserved. The motion pass uses existing React/CSS and adds no package or provider. Local-only, production, device, OCR/AI, and release gates remain separate. |

## Motion-specific review

- `AnimatedList` caps the stagger and uses intersection observation only for reveal; it does not remove or paginate records.
- `AnimatedRemovalList` is retained as an unintegrated experiment only. It is rejected for authenticated/private records because visual exit retention is incompatible with immediate privacy-boundary changes.
- `PageTransition` changes presentation keys by route section and does not replace browser history or navigation methods.
- `MotionSheet` uses a native dialog, keyboard focus containment, Escape/backdrop close, opener focus restoration, safe-area padding, and reduced-motion handling. The wrapper lifecycle fix above keeps those behaviors active after a caller closes a sheet.
- `AnimatedSegment`, `StatusTransition`, `Skeleton`, `CollapsingHeader`, `Toast`, and press feedback alter presentation only. Status text remains derived from existing domain values; no raw state is promoted to a verified fact.
- Reduced-motion CSS disables entrance, shimmer, and sheet animation. The interaction pass does not depend on animation completion for data correctness.
- Existing populated-demo evidence remains the stress case: 3 properties, 20 workspace documents, Construction stages/tasks, Purchase Workspace evidence, scoped architect/lawyer views, and the saved review projects.

## Rejected changes

No domain/security regression was accepted. In particular, this review did not add a client-side authorization shortcut, broaden shared permissions, expose document bytes through a public URL, substitute a fixture scanner, invent extraction/review data, alter Construction financial scope, or change database models to support the visual layer.

## Verification record

The post-fix local verification completed as follows:

- Focused `npm run lint && npm run typecheck && npm run test:unit`: PASS; 9 unit files and 41 tests.
- Full `npm run verify`: PASS; lint, typecheck, 9 unit files / 41 tests, 12 integration files / 92 tests, and `next build`.
- `git diff --check`: PASS.
- `node scripts/check-construction-review.mjs --revoked`: PASS; owner spend `250000` paise, owner unscanned bytes `423`, architect project/cost-source/unselected-document requests `404`, and `providerBypass: false`.
- Live browser smoke on the populated local demo: PASS; Sheet focus restoration, explicit scoped architect document URL with selected bytes `200`, and post-sign-out denial `401`.
- Live browser privacy smoke on `main`: PASS; Search query changes and Vault filters have no retained `.motion-item--exit` rows, so removed private records unmount immediately.
- Local health: `GET /api/health` returned `200` with `{"data":{"status":"alive"}}`.

The build retained the two already-documented dynamic-filesystem tracing warnings in `lib/providers.ts` and `lib/server-store.ts`; no new warning was introduced by this review.

These results are local regression evidence only. They do not establish owner-approved final design, physical-device accessibility, production storage, live OCR/AI, provider readiness, deployment, or release acceptance.

## Resumption and review boundary

The dirty checkout and all existing S00–S30, scanner, privacy, Construction, Purchase, demo-composition, and motion evidence remain preserved. `main` now carries the accepted working-tree integration, while `muse/ui-motion-v2` remains an identical ref with no committed delta. No unrelated roadmap work was started. A future review should supply a committed Muse delta if a reproducible branch comparison is required.
