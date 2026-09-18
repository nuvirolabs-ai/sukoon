# Sukoon - Evidence-led audit and completion runbook

## Objective

Inspect the existing Sukoon repository and its local application at **http://localhost:3100**, identify demonstrated gaps against `SUKOON_V1_SOURCE_OF_TRUTH.md`, and complete safe, in-scope fixes without redesigning the application.

Do not start by rebuilding the app. Do not assume the framework, database, package manager, or implementation status. Do not claim production readiness based only on successful compilation or screenshots.

## 1. Establish the baseline before editing

1. Read existing `AGENTS.md`, README, package/lock files, app configuration, schemas/migrations, tests, and relevant product/architecture documents. Preserve their security and repository instructions. Report scope conflicts instead of silently rewriting them.
2. Inspect git status and identify unrelated user changes. Do not reset, overwrite, or auto-commit unrelated work. Record the current revision and whether the working tree is dirty.
3. Identify how the app starts, which process serves port 3100, its route map, persistence layer, file storage, authentication, AI integration, reminder scheduler, and deployment target. Record evidence with paths and line ranges.
4. Connect to the existing local server through available browser automation. Reuse project tooling where possible. Do not kill an unknown process, install global packages, change the stack, or create external accounts merely to force the audit to run.
5. Use an isolated local/test environment and synthetic users and property documents. Do not test against production, real owner documents, real payments, or a shared live database. Never print secrets, tokens, private document contents, or real customer details into reports.

If browser access or a required local service is unavailable, say exactly what could not be tested. Code inspection alone is not an end-to-end pass. Continue independent checks and give precise unblock instructions.

## 2. Audit every reachable surface

Inventory pages, buttons, links, forms, tabs, dialogs, searches, filters, file actions, notifications, and navigation targets. Trace visible actions through the server/API and persistence layer.

Distinguish a toast-only action, in-memory change, hard-coded fixture, or browser-only storage from a real persisted action. Demo functionality is acceptable only when explicitly labeled as demo and excluded from readiness claims.

For every required capability, record:

`Requirement | Route/action | Code path | Data/API path | Status | Evidence | Priority | Next action`

Use these statuses:

- **VERIFIED WORKING:** exercised successfully through the relevant end-to-end path.
- **PARTIAL:** some parts work, with precisely stated omissions.
- **UI ONLY / MOCK:** visible, but no real workflow behind it.
- **BROKEN:** attempted and failed, with reproduction steps.
- **NOT IMPLEMENTED:** absent after route and code inspection.
- **BLOCKED EXTERNAL:** needs a specified provider, credential, approval, or content decision.
- **NOT TESTED:** insufficient execution evidence.
- **DEFERRED:** outside the OWN launch scope.

Do not use unsupported percentage-complete scores.

## 3. Functional acceptance checks

These are proposed engineering tests for the source scope, not additional approved product modules.

### Identity and Property Passport

- Create a synthetic account, sign in/out, and test the actual session lifecycle.
- Add and edit a property, then refresh, sign in again, and verify persistence.
- Connect documents, bills, service records, timeline events, and assistant answers to the same property.
- Test empty accounts, multiple properties, invalid inputs, and missing/forbidden records.
- Distinguish a user's entered ownership claim from independently verified ownership.

### Vault and AI extraction

- Upload supported synthetic PDFs/images; verify server-side file checks, private storage, preview/download, property assignment, and durable metadata.
- Test unsupported files, oversized files, interrupted uploads, duplicate submissions, failed processing, and safe retries. Follow existing limits; document missing limits rather than inventing hidden ones.
- Exercise classification and extraction, display their processing status, and let the user review/correct values before important property fields change.
- Keep the original evidence reference. Reprocessing must not silently overwrite user-confirmed values.
- Verify document gaps follow the applicable configured checklist. Do not hard-code the illustrative "14/17" outcome.
- Separate uploaded, AI-extracted, user-confirmed, and independently verified states.
- When the AI provider is unavailable, keep upload/manual classification usable and label automated processing unavailable. Do not claim Document AI is complete until its live path is tested.

### Bills, reminders, and receipts

- Create a manual bill with amount, due date, category, and property; edit it; record a manual payment; attach a receipt; verify persistence and the timeline.
- Clearly distinguish "recorded as paid by user" from provider-confirmed payment.
- Test overdue/current states, timezone boundaries, currency/amount validation, and duplicate submissions.
- Test reminders across process restart using a short test schedule. Retries must not cause duplicate messages. A toast is not evidence of reminder delivery.
- Show notification permission/provider failures and whether delivery was attempted, delivered, failed, or unverified.

### Health, maintenance, and timeline

- Change a document or bill and verify that the readiness result and next actions update according to a documented formula.
- Explain the formula, unknown inputs, and evidence status. A completeness score must not be presented as certified title, legal clearance, or structural safety.
- Create a maintenance issue, add estimate/final cost and evidence, then resolve it and check the linked event history.
- Preserve corrections and event provenance. Avoid duplicate history events on retry.

### Sharing and authorization

- Create two independent test users. Prove that user B cannot access user A's property by guessing IDs or using direct API, search, file, preview, export, or assistant endpoints.
- Share only selected permitted records. Test a restricted invitee, expired invitation, and revoked access.
- Apply permissions server-side, including document processing and AI retrieval; hiding a button is not authorization.
- Check the lifetime of download URLs against access revocation. Do not claim previously downloaded files can be recalled.
- Invitations and exports must not leak documents into public pages or search indexes.

### Assistant and information quality

- Ask about bills, document gaps, and maintenance totals for a specific permitted property.
- Check answers against actual records and show record/document references.
- Ask an unanswerable question and verify an explicit unknown rather than invented facts.
- Try a document containing malicious instructions; its text must remain untrusted content, not agent instructions.
- Do not send document data to an external AI service without the configured permissions/disclosure. Never claim end-to-end encryption if server-side processing can read plaintext.
- Treat sample tax rates, legal requirements, market prices, due dates, and verification labels as samples unless they have an approved source and freshness policy.
- Include lightweight buyer guidance only within the agreed scope; flag unreviewed jurisdiction-specific content.

### UI, search, and future categories

- Preserve the current design. Fix overflow, broken controls, inaccessible contrast/labels, keyboard behavior, and missing loading/empty/error/retry states.
- Test mobile widths around 390-430 CSS pixels and a desktop viewport; record actual viewport sizes. Do not call these exact device certifications.
- Confirm that search and filters use permitted real records; exclude unsupported future search categories or label them honestly.
- Construction, Buy / Sell, and expanded Updates must not simulate live availability. Deferred pages should explain their status rather than leaving dead controls.

## 4. Separate local readiness from launch readiness

Run the repository's relevant build, type, lint, unit, integration, and end-to-end checks. Record commands, exit status, failures, and skips. Do not weaken assertions or delete failing tests just to obtain green output.

Check migrations on an isolated database and safe start/restart behavior. Before claiming launch-ready, obtain evidence for production authentication, private file storage, restore-tested backups, error monitoring, job execution, usage/cost limits, deployment configuration, and operational ownership. Never test restore destructively on live data.

Missing external credentials can block a specific capability without blocking unrelated work. Report what is ready for a local demo versus a real user launch.

## 5. Write the audit, then complete bounded fixes

First create `docs/SUKOON_AUDIT_REPORT.md` with the baseline findings. Only then begin repairs.

Priority:

- **P0:** cross-user data exposure, public documents, destructive/data-loss paths, broken core authentication or persistence.
- **P1:** required OWN workflows absent/broken, misleading verification/payment/AI behavior, essential reliability failures.
- **P2:** usability, responsive polish, secondary performance/accessibility issues.
- **DEFERRED:** later-phase modules, not launch defects.

Fix demonstrated P0 and P1 issues within the approved OWN scope in small, independently tested batches. Add regression coverage and update the audit after each batch. Reuse existing architecture and avoid unrelated refactors, new paid services, destructive migrations, or visual redesign.

Pause the affected task for a genuine credential, approval, legal-content, data, or product-decision blocker. Record the exact dependency and continue independent work. Never replace a blocker with fabricated results.

## 6. Required output artifacts

Create:

- `docs/SUKOON_AUDIT_REPORT.md`: dated environment/revision, scope, status matrix, reproduced gaps, before/after fixes, test evidence, and remaining blockers.
- `docs/SUKOON_REMAINING_WORK.md`: prioritized remaining tasks, acceptance test, dependency, and owner action required.
- `artifacts/sukoon-audit/`: synthetic-data screenshots of mobile/desktop pages, permitted test logs, and browser traces where available. Exclude all secrets and real property papers; follow repository ignore rules.

The report must contain this end-to-end result:

`Sign in -> Create Property Passport -> Upload document -> Review extraction -> Add bill/reminder -> Record payment/receipt -> Record maintenance -> Inspect score/timeline -> Ask assistant -> Share selected document -> Revoke access -> Verify second-user denial -> Refresh/restart and verify persistence`

Mark every unexecuted step explicitly. A polished home screen or a passing build is not a substitute for these results.

Conclude with one evidence-based status: **NOT READY**, **LOCAL DEMO READY**, **PILOT READY WITH LISTED LIMITATIONS**, or **LAUNCH CHECKS PASSED IN THE SPECIFIED ENVIRONMENT**. State what was tested and what remains unknown. Do not promise a fully working production app without production evidence.
