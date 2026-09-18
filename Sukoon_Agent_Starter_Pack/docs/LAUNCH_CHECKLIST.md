# SUKOON — Launch Evidence and Go/No-Go

Every item begins unchecked. These are proposed engineering release gates, not statements of legal certification. Record evidence next to each item. NOT_RUN and BLOCKED are different from PASS.

## A. Scope and ownership

- [ ] OWN Phase 1 scope and future-category behavior acknowledged by Tanutejas Saraswat and client Akshay Kothari.
- [ ] Latest Home, property and vault design accepted; actual clean logo/hero assets have usable rights and quality.
- [ ] PDF roadmap conflict recorded; no undeclared modules included as “done.”
- [ ] Client ownership/access to production accounts, billing, secrets recovery and source handover documented.
- [ ] Named human owner for security/support/content/provider incidents identified; no field team assumed.

## B. Authentication and access

- [ ] Real auth delivery works; expired/replayed OTPs fail and rate limits are enforced.
- [ ] Valid session survives restart/offline startup; sign-out/revoke clears account-scoped caches.
- [ ] Two owners cannot access each other's IDs, lists, counts, search, files, citations, exports or jobs.
- [ ] Family/lawyer/CA grants expose only selected records/fields; operator sees no originals by default.
- [ ] Invitation replay/expiry, grant expiry, access revocation and in-flight job revocation tested.
- [ ] Operator authentication is hardened; no debug bypass/admin universal password.

## C. OWN workflows

- [ ] Add/edit/archive/reopen property with correct units, identifiers and provenance.
- [ ] Upload a real permitted file, scan, preview, reopen after restart and retrieve original bytes.
- [ ] Upload without AI consent remains usable manually.
- [ ] Real approved-provider extraction creates source-linked proposals; user review and conflicting-field handling work.
- [ ] Health uses reviewed applicable templates; no template/unknown applicability returns NOT_ASSESSED, not 100.
- [ ] Property Health explanation makes record readiness distinct from legal/structural certification.
- [ ] Manual bills, amountless deadlines, receivables, partial payment, receipt and reversal work.
- [ ] Recurrence/month-end/timezone behavior and duplicate reminders tested.
- [ ] A scheduled reminder arrives with the app closed; in-app fallback works without push permission.
- [ ] Maintenance, expense deduplication, warranty/invoice and corrected history work.
- [ ] Scoped export/download/expiry and clear non-recall limitation work.
- [ ] Assistant answers actual accessible records with citations and refuses unsupported legal/title conclusions.
- [ ] Education and future category destinations are honest; all visible controls have real outcomes.

## D. Security, privacy and information

- [ ] Private buckets/originals/previews/exports are inaccessible without authorization.
- [ ] File validation and actual malware scanner tested; scanner outage fails closed.
- [ ] Parser limits, invalid file types, oversized/corrupt files and cleanup tested.
- [ ] AI processing/provider/retention disclosures and consent are approved and not misleadingly called E2EE.
- [ ] Provider calls receive minimum necessary data; no public malware-sharing service receives private uploads.
- [ ] Terms, privacy, retention/deletion policy, support contact and consent withdrawal flow approved before real data collection.
- [ ] Data request verifies identity/scope and cleans original/derived/search/export/cache artifacts as applicable.
- [ ] Restore respects deletion tombstones and shared-record permissions.
- [ ] No raw secrets, OTPs, private search terms or document text in analytics/errors/logs.
- [ ] No production demo fixtures, fake provider responses, invented verification badges or stale screenshot dates.
- [ ] Legal/tax/local-content publication has original sources, review, applicability and expiry; no self-published AI legal advice.

## E. Testing and evidence

- [ ] Lint, typecheck, domain tests, real-database integration and all relevant builds pass on the frozen commit.
- [ ] Web/admin E2E and mobile owner/delegate flows pass with actual evidence.
- [ ] Concurrency, idempotency, lost network, provider timeouts and worker restart tests pass.
- [ ] AI evaluation report identifies dataset/provider/version and measured failures, not unsupported accuracy claims.
- [ ] Accessibility: large text, labels, screen-reader order, keyboard avoidance and reduced motion checked.
- [ ] Reference iPhone and representative Android safe areas/layouts checked on named devices/simulators.
- [ ] Camera/files/session/push assessed on actual relevant devices; missing device evidence remains a platform blocker.
- [ ] Dependency/secret scans reviewed; unresolved critical/high-impact security issues block release.

## F. Operations

- [ ] Production and staging isolated; no connection to another client's databases or services.
- [ ] API/worker/web/storage/auth have validated readiness checks and safe failure behavior.
- [ ] Durable scheduler, queue alerts, error alerts, storage limits and AI spend circuit breaker operate.
- [ ] Approved infrastructure capacity measured against the proposed pilot targets; actual load report provided.
- [ ] DB + object backup restore tested, actual recovery measurements recorded and approved.
- [ ] Redacted support/job diagnostics and safe retry workflow tested.
- [ ] Environment/migration/rollback/runbook documentation verified from a clean checkout.
- [ ] Production pricing, quotas and billable services approved; no assumption of permanent free hosting.

## G. Release

- [ ] Freeze source commit and lockfile; label build artifacts by environment/version.
- [ ] Required Apple/Google signing/distribution accounts available and authorized.
- [ ] Store privacy/data-safety declarations match actual SDK/provider behavior; no unapproved submission.
- [ ] Owner UAT and explicit production release authorization recorded.
- [ ] Deployment/migration recovery plan reviewed before applying production changes.
- [ ] Production smoke test uses authorized non-sensitive records and confirms persistent OWN flows.
- [ ] Handover includes source, credentials ownership, runbook, limitations, incident contact and deferred roadmap.

## Evidence template

```text
Gate:
Result: PASS / FAIL / BLOCKED / NOT_RUN
Commit/build:
Environment/device/provider:
Executed command or procedure:
Observed result:
Evidence path (redacted):
Reviewer/date:
Outstanding issue and owner:
```

## Decision rule

The agent may prepare a release candidate. It may not approve legal content, accept business risk, invent client sign-off or release production on its own. Failed core privacy/security/functional gates block release. Minor documented defects need explicit owner acceptance; missing evidence is not a waiver.
