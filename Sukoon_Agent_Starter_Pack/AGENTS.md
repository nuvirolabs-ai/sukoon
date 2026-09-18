# AGENTS.md — SUKOON Implementation Contract

## 1. Mission and boundary

Build SUKOON: **everything about an owner's property papers, obligations and record health in one place**. The canonical product object is the Property Passport. It is an application record, not a government title registry.

Phase 1 is OWN. Deliver the mobile application, shared backend, private storage and operational admin needed to make OWN genuinely work. Do not turn this into Company OS, an ERP, a national listings portal, a construction marketplace or a legal-services business.

The user's `references/Property_OS_Concept_Summary.pdf` is product evidence. Its pages 6–7 explicitly limit Phase 1. Screenshots illustrate appearance, not authorization to implement every feature they depict.

## 2. Read order and source precedence

At every new session read this file, `docs/STATUS.md` and the task/status section of `SUKOON_MASTER_PLAN.md`. Before the first change read `docs/DECISIONS.md` and the source map. Load the relevant specification sections for the selected task rather than inventing requirements from memory.

Precedence:
1. Latest explicit user instruction, subject to security/access constraints.
2. Recorded user-approved decisions in `docs/DECISIONS.md`.
3. Source-derived Phase 1 requirements in `docs/PRODUCT_SOURCE_OF_TRUTH.md`.
4. Engineering defaults in this pack and existing compatible implementation.
5. Visual examples and synthetic fixtures.

Flag disagreements. Do not silently reconcile the PDF's two later roadmaps, change the legal meaning of a document, or treat a generated mockup as signed design approval. Pack defaults may be used in development when no contrary evidence exists; approval-dependent production gates remain mandatory.

## 3. Repository discovery before scaffolding

- Inspect files, git status, package manifests/lockfiles, database schema, existing AGENTS instructions, tests, build scripts and environment examples.
- Never claim to inspect files or a machine that you cannot access.
- Preserve uncommitted work. Do not reset, clean, rewrite history, or overwrite existing source/specifications.
- Do not reuse another client's database, storage bucket, keys, authentication project, API endpoint or production assets. Sukoon is isolated.
- If compatible code exists, map it to acceptance criteria; do not rebuild for style preference.
- For a greenfield project use the proposed architecture in TECHNICAL_SPEC after checking current official documentation and package compatibility. Record exact versions and rationale. No guessed package APIs or unverified version combinations.
- Scaffolding tools may generate their own AGENTS files. Inspect/merge these; they must not replace this product contract.

## 4. Work loop

Select one eligible task from the master plan. Start with S00, not the most visually attractive module.

For each task:
1. Read its requirements, dependencies and relevant source/specification.
2. Record an implementation plan; change status to IN_PROGRESS.
3. Implement the smallest complete vertical slice: UI → API → authorization → persistence → job/event effects where applicable.
4. Run the task's targeted checks and affected regression tests. Fix failures, not assertions.
5. Record commands, actual results, evidence paths, decisions and residual limitations.
6. Update master plan and STATUS; create a scoped local git commit if appropriate. Do not push remotely without permission.
7. Continue the next eligible task within the active session.

No infinite retry loops. After three materially different failed attempts on the same blocker, record diagnosis and switch to independent eligible work or ask the one blocking question. Preserve a resumable checkpoint before stopping or context compression. Never promise unobserved background execution.

Parallel subagents are optional: use isolated worktrees or non-overlapping files, one schema/migration owner, one integrator. Agents must not simultaneously mutate the same task, lockfile or migration chain.

## 5. Status semantics

`TODO`: not started. `READY`: every dependency is DONE and required inputs exist. `IN_PROGRESS`: actively changing. `BLOCKED`: cannot meet acceptance for a named reason. `DONE`: code and task-specific evidence exist. `DEFERRED`: outside approved release.

DONE is not synonymous with released. A task may finish its adapter code while a provider remains unconfigured, but its live-integration acceptance task stays BLOCKED. Do not mark a task DONE with known missing acceptance criteria; split a narrower task only with recorded rationale and preserved remaining work.

Only claim a command passed after executing it and observing its exit status. “Not run,” “no device attached,” and “provider unavailable” are valid outcomes. A green TypeScript build alone is not functional, security, device or production verification.

## 6. Non-negotiable engineering rules

- TypeScript strict mode; schema-validate every external input and provider response. Explicit typed errors and correlation IDs.
- All protected resources use server-derived identity and resource-scoped authorization. Client IDs, hidden buttons and a supplied workspace_id are not authorization.
- Money uses integer paise; areas preserve the original value, unit and type. Date-only obligations use their property's IANA timezone; timestamps use UTC.
- Mutations with financial/job/export effects require idempotency. Concurrent edits use optimistic version checks. Migrations and data backfills must be reversible or have an explicit recovery plan.
- Private documents are never served by public bucket URLs. Malware scanning and content validation precede parsing or download; production scan failure fails closed.
- Originals, extracted text, thumbnails, exports, search entries, notifications and AI output inherit the source record's access restrictions.
- Append-only events record corrections rather than erasing history; personal-data deletion is a separate governed workflow. “Immutable” does not mean retaining private data forever regardless of deletion policy.
- No homegrown authentication or encryption protocols. No credentials in clients, logs, screenshots, fixtures or commits. No session tokens in ordinary mobile async storage.
- Handle loading, empty, error, permission-denied, offline and retry states on every data screen. A transient network error must not sign out a valid user.
- Do not persist private vault content offline by default. Purge account-scoped caches on logout; authenticated authorization always precedes reopening private files.
- All application actions are real. No hardcoded balances, fake “verified” badges, canned AI disguised as provider output, simulated payment success or silent localStorage-only persistence.
- External jobs are retryable and bounded. Provider side effects must tolerate duplicate job execution. Never rely on a browser tab or ephemeral API-process timer for production reminders.
- No public document upload scanners that could disclose private files. No live client documents in test fixtures.

## 7. Information integrity

The content policy is binding. The agent must not invent legal checklists, due dates, required documents, material rates, circle rates, government data, valuation trends, certifications or provider availability.

Every factual property field preserves its provenance. AI extraction is a proposal until confirmed; confirmation is not government verification. Legal/structural conclusions are outside the assistant's authority. Source-specific evidence labels replace a blanket “Verified property” promise.

Location-specific legal/tax content needs jurisdiction, original authoritative source, applicable date/version and human review. Unreviewed seeds stay DRAFT and cannot affect production health scores or notifications. Do not hardcode the source's sample “14/17,” material quantities or example years as actual user data.

The Smart Vault is Sukoon's feature. DigiLocker is a separate external integration; use its name as a connection only after authorized onboarding. A connector stub must return UNAVAILABLE, not success.

## 8. Design rules

Use `docs/DESIGN_SPEC.md` and the latest supplied home reference. Preserve the actual SUKOON logo; do not generate another wordmark. The logo is centered in the home banner, as last requested.

Implement native components, scrolling and safe areas; do not use a screenshot as the app or paint the device's Dynamic Island/status bar into the content. No surprise redesign, extra module cards or invented portfolio metrics.

Construction and Buy / Sell remain the requested category labels, but Phase 1 destinations are explicitly limited. Accessibility and accurate labels take precedence over decorative screenshot copy. Obtain design feedback at S06 without blocking independent backend work.

## 9. Test and release contract

Required layers: pure domain tests; real-PostgreSQL integration tests; API permission/validation tests; worker retry/idempotency tests; mobile flow tests; web/admin end-to-end checks; accessibility and real-device checks; staging restore and release smoke tests.

At least two independent user workspaces, an invited delegate and an operator account must feature in negative permission tests. Test revocation while an AI response or export job is in progress, not just before starting.

A production claim requires every applicable item in `docs/LAUNCH_CHECKLIST.md`. No fake scans, development auth, demo seed, public bucket or placeholder legal pages in production.

## 10. Human approval boundaries

Never autonomously:
- spend money or create billable infrastructure;
- register provider, developer-store or government partner accounts;
- approve legal content, title verification, privacy policy or contractual amendments;
- process real documents through an unapproved external AI service;
- send emails/invites to real recipients as a test;
- publish content, production deployments or store releases;
- run destructive database commands, delete user records, push to remotes or deploy migrations to production.

Prepare the exact action and rationale, then obtain authorization. Test mail and push use sandbox recipients/devices. Local, reversible development work can continue.

## 11. End-of-session report

Record: branch/commit (if any), tasks changed, files changed, test commands and outcomes, evidence locations, blockers and who must resolve them, current release readiness, and the exact next eligible task. Include no private user documents, raw prompts, secrets or unredacted provider payloads.
