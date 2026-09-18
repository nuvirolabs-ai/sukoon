# SUKOON — All-Phases Completion Mandate

## 1. My instruction and the completion target

I am now authorising implementation of the complete Sukoon product roadmap, not only Phase 1 OWN or manual-first Construction. Continue the existing project at `/Users/tanutejas/Documents/Sukoon`.

The mission remains: **Everything about your property, in one place.** The Property Passport connects discovery, due diligence, purchase, ownership, documents, obligations, maintenance, construction and eventual sale.

This instruction supersedes earlier product-scope restrictions such as “OWN only,” “Construction later,” “do not start S23+,” and “stop after this batch.” It does NOT override security rules, tool permissions, requirements for lawful data access, or approvals for costs, external processing and deployment.

Build the complete approved product in dependency-ordered, tested increments. Do not stop simply because one module or numbered task is finished. Continue safe independent work during the active session. Do not promise that work continues after the session ends.

Completion means working user journeys, correct information, operational controls, real integration evidence where required, and a reviewed release—not screens, interfaces, test fixtures or a single passing build.

This is an implementation direction. Do not alter the client agreement, assume that every expansion is covered by the original development fee, spend the previously discussed business budget, or invent delivery dates or percentage-complete estimates.

Preserve the digital-only operating model: no ground-acquisition workforce, field-verification department or salaried operating team is a default product dependency. Prefer self-service onboarding, automated routine processing and an owner-operated exception console. Real professional/content review and partner fulfilment must still have an accountable approved person or organisation; automation must not fabricate those approvals. External professionals are service partners, not an assumed Sukoon field workforce.

## 2. Preserve the current project and reported checkpoint

The latest owner-supplied reports describe locally implemented OWN functionality through S22, manual-first Construction, expense corrections, a real local ClamAV integration, genuinely scanned document attachment, selected-document architect access and successful revocation. Production, full mobile/device acceptance, live OCR/AI and several external services remain unaccepted.

Read applicable AGENTS instructions, the current canonical master plan/status, decisions, source specification, audit, Construction architecture and acceptance reports. Inspect the actual code and test environment before relying on old statuses. These reports are a starting point, not independent proof of every path.

Preserve the existing Next.js application, PostgreSQL/Prisma persistence, Better Auth, central authorization, private Vault, durable worker, S12 rules, S15 ledger and existing design system. Reuse working functionality; do not start another app or introduce a different stack just to complete this mandate.

Preserve the dirty working tree, existing migrations, completed review project, active scanner-review project, audited corrections and revoked grants. No reset, blanket cleanup, reinitialisation, destructive migration or unrelated overwrite. Do not automatically commit all existing changes, push remotely or publish. Record the starting revision/diff and request a scoped checkpoint/commit policy once if needed.

Do a focused delta assessment, not another project-wide discovery marathon. Resolve relevant contradictions before building on them. Previously identified legacy whole-state routes must not be allowed to overwrite modern models, permissions, financial history or new module records.

The current Mac scanner approval remains local and on-demand. It does not authorise whole-machine scans, new daemons, login items, unrelated package changes or public network access.

## 3. Preserve both source roadmaps explicitly

The supplied concept contains two different roadmaps. Do not silently substitute one for the other or renumber them as though they were identical.

Use the final notebook structure to organise the consumer experience:

- **Phase 1 — OWN:** Property Passport, Vault, document intelligence, obligations, record readiness, maintenance, timeline, sharing, assistant and buyer education.
- **Phase 2 — Transact & Draft:** city-wise guideline/circle rates; registry, notary, rent, agreement-to-sell and lease templates; deeper buyer/due-diligence workflows; controlled e-sign integration where applicable.
- **Phase 3 — Build:** construction guidance, material rates, dealer/engineer directory, consultations and conceptual floor plans, extending the already built Construction foundation.
- **Phase 4 — Marketplace & Media:** individual listings, paid broker participation, City → Area/Region → Residential/Commercial/Agricultural discovery, news/articles, podcasts and SEO.

Track the earlier concept's additional areas as explicit companion workstreams, not omissions or substitutes:

- **Government & Payment Integrations:** DigiLocker, available land/registration/RERA/municipal/utility connections, bill fetch and authorised checkout/reconciliation.
- **Enterprise Ecosystem:** permissioned bank/NBFC/insurance/developer/society integrations and underwriting-support workflows.
- **Shared Commercial and Release Foundation:** subscriptions, entitlements, provider operations, support, privacy, real-device acceptance, staging, security, release and handover.

Map each scope item to its source and current implementation. Where the source gives only a high-level idea, write a minimal proposed contract and flag material business decisions. Do not treat invented extra features as original requirements.

## 4. One persistent execution plan, not a new prompt per batch

Locate the active `SUKOON_MASTER_PLAN.md`; the reported location is inside `Sukoon_Agent_Starter_Pack/`. Extend that canonical plan instead of creating competing status ledgers. Keep existing S00–S30 IDs and evidence. Add stable IDs for expanded modules and link them back to this mandate. Ensure the root AGENTS file points to the active plan and scope without discarding its safety instructions.

Create or update only the necessary companion records:

- `docs/ALL_PHASES_SCOPE.md`: requirements, source mapping, user journeys, dependencies and acceptance contracts.
- `docs/OWNER_ACTIONS.md`: one consolidated approvals/content/provider/platform decision list.
- `docs/RELEASE_MATRIX.md`: readiness by feature, environment and platform.
- Existing `docs/STATUS.md`, decisions and evidence files at their canonical paths.

For each feature track implementation, content readiness, provider readiness, ordinary-browser evidence, device evidence and release approval separately. Mark **UNSTARTED, IN_PROGRESS, CODE_TESTED, REAL_FLOW_VERIFIED, BLOCKED, RELEASE_ACCEPTED** or equivalent explicit dimensions. An interface or fixture-only path is never a completed live service.

Work loop: select the highest-priority eligible journey → inspect relevant code → implement UI/API/permissions/persistence/jobs → run focused tests → exercise the ordinary app → correct defects → record evidence → continue.

Stop only for an actual permission boundary, unavailable prerequisite, exhausted session/tool limit, or completed approved scope. Record the exact blocker and continue unrelated work whenever possible. Do not keep asking “shall I continue?” at artificial S-number boundaries.

Parallel agents are optional, only when tooling supports them: isolated worktrees or disjoint files, one schema/migration owner, one integrator. Do not race shared test-database setup or lockfile writes.

## 5. First delivery: operations, privacy and remaining local defects

Complete S23 and S24 now, adapting them to all current OWN and Construction resources. These controls are prerequisites for safely exposing larger public/provider workflows; do not postpone them until after a marketplace launch.

**Operations/admin:** permissioned content review, listing/professional moderation preparation, provider health, failed-job diagnosis, controlled idempotent retries, support metadata, usage/cost limits, retention jobs and auditable operator actions. Operators do not automatically get private files, raw prompts, financial records or cross-tenant access. Stronger operator authentication must be part of the release checks.

**Privacy lifecycle:** versioned consent, processing withdrawal, session/device revocation, owner data-export requests, account/property deletion requests, derived-text/search/cache/export cleanup, share revocation and configured retention. Separate deletion of personal data from preserving necessary minimal audit evidence under an approved policy. Do not hardcode indefinite retention. Test restoration in isolation so deleted data cannot silently reappear from a backup. Do not delete review records to demonstrate this.

Resolve the known browser Back/Forward harness waits using expected URL and visible-state checks. Add controlled time-based session-expiry tests with a test-only clock/session setup; do not weaken production session lifetimes or use the Mac system clock. Confirm sign-out/expiry do not briefly reveal cached private content. Test PDF visual rendering in an available ordinary browser and distinguish viewer/tool blocks from application failures.

Investigate the recorded first-upload `SCAN_RESULT_UNCONFIRMED` case. Determine whether it was a genuine safe failure, transient condition or adapter defect. Implement authorised, auditable re-scan/retry where appropriate; do not require a duplicate upload merely to recover or relax fail-closed policy.

Retain precise outstanding acceptance points rather than declaring the whole app failed because one automation wait fails.

## 6. Phase 1 OWN: finish real user value, not a rebuild

Preserve and harden the implemented Passport, Vault, obligations, receipts, canonical expenses, reminders, maintenance, sharing, search, assistant, exports, Home and Updates.

Close missing source-specified ownership information through existing structures: co-owner/access management, loan/insurance records, renewal dates and user-entered financial schedules where supported by approved scope. Do not invent insurance cover, loan balances, interest changes, official tax dues or valuations.

Separate independent states: malware scan, text extraction/OCR, document categorisation, user review and external verification. Manual categorisation of a genuinely scanned document must not require a live AI model. Preserve source document/version/page/chunk provenance for proposed and accepted fields.

Bring genuine document extraction and property assistance online using approved provider access—not renamed fixtures. Use native text parsing before bounded OCR when practical. Test supported English/Hindi documents with labelled fixtures and disclose unsupported languages/handwriting. Evaluate classification and field accuracy on a stated synthetic/consented dataset; report failures and correction paths instead of declaring accuracy from one successful example.

Use structured server calculations for balances, spend, deadlines and counts. Keep the assistant read-only by default; write requests open explicit normal confirmation flows. Model output never establishes ownership, title clearance, structural safety or required tax obligations.

Readiness shows evidence coverage and unknown applicability. A high known-item score must not hide many unknown items. No reviewed applicable checklist means not assessed—not an invented score. Approve the final wording and scoring policy through the product decision register.

## 7. Phase 2: Transact, due diligence and document drafting

Implement a persistent **Purchase Workspace** for a property the buyer is considering, including properties not listed on Sukoon. A prospective buyer is not automatically an owner. Keep access to seller-provided evidence explicit and separate from the seller's full private Passport.

Provide saved candidates, comparison of supported attributes, document requests, evidence collection, source/version status, open questions, user-selected legal professional engagement, financial planning, offers/negotiation history, booking/token records, agreement milestones, loan status tracking, registration appointments/records, possession and post-purchase tasks. These are recorded workflows, not automatic legal approvals or payment execution.

Create a permissioned deal room for buyer, seller and explicitly invited professionals. Each party sees only the authorised projection. Record actions, attachments, questions, milestones and corrections. Tie transaction documents to Vault versions and use the existing durable jobs, sharing and timeline.

**Guideline/circle rates:** implement location/property-type/effective-date lookup, source references, applicability factors, import preview, validation, review/publication and version history. Keep official guideline rates distinct from asking prices, recorded quotes and market estimates. Calculation must use reviewed rules and correct original units. No data means unavailable, not an invented city average. Record actual coverage; a nationwide schema is not nationwide data.

**Drafting suite:** registry/sale-deed, notary-related, rental, agreement-to-sell and lease document workflows. Use versioned jurisdiction-tagged templates with rights/source, reviewer, effective dates, required-field schemas, conditional clauses and provenance. Offer data-entry wizard, review preview, revision history and DOCX/PDF export. Use the available document/PDF tooling instructions when producing these artifacts.

Do not invent binding legal clauses or deploy unreviewed AI-generated contracts as approved forms. Synthetic clearly labelled templates may test the engine, while public template availability remains blocked until reviewed. Rendering a notary/registry template is not notarisation or registration. Validate any e-sign provider workflow separately; an image of a signature must not be presented as certified e-signing.

**After purchase:** import only agreed selected records into the buyer's owner workspace, preserving source/version history and the seller's private history. Do not transfer ownership or all documents because someone presses “deal complete.” Require the approved confirmation and evidence workflow. Changing an application ownership assertion is not a government registry change. Preserve a coherent property lifecycle without exposing shared global identifiers or merging other owners' records.

Acceptance must include a complete synthetic candidate → evidence request → reviewed draft → deal milestones → controlled buyer onboarding flow, with seller-private data inaccessible throughout.

## 8. Phase 4 consumer marketplace: listings, buyers and brokers

Implement the full public property portal already named in the roadmap. Listing management must originate from the Passport where available, without exposing the private Passport itself.

**Seller:** create draft, explicitly select publishable fields/media, preview public output, submit for moderation, publish through authorised rules, edit, pause, renew, close/sold and archive. For newly entered properties, persist a coherent private record and record the seller's assertion instead of claiming verified ownership.

**Buyer:** City → Area/Region → Residential/Commercial/Agricultural navigation, appropriate property subtypes, filters, saved searches/listings, comparison, enquiry, consented contact or protected conversation, visit requests and progression into the Purchase Workspace.

**Broker:** authenticated profile, documented relationship to sellers/listings, applicable credential evidence/review status, authorised listing management, lead inbox, assignment/status and plan entitlements. A subscription purchase is not professional verification or authority to sell a property.

**Trust and operations:** moderation queues, reports, duplicate/stale listing detection, seller reconfirmation, suspension/appeal, spam/rate limits and evidence-specific labels. No blanket “verified property,” “fraud eliminated,” or title guarantee. Review current relevant registration/advertising requirements against official sources before public activation in a jurisdiction.

Use a deliberately allowlisted public listing projection. Precise address, owner contact, IDs, signatures, loan details, tax documents and private originals must not become public by default. Public photos are intentional listing content, not permission to publish private Vault documents. Handle upload scanning, metadata removal and owner preview of publishable media. Private pages remain authenticated regardless of robots/noindex settings.

No fabricated listings or broker profiles in normal accounts. Use an isolated, clearly labelled synthetic scenario for local acceptance. Seeded demonstration inventory is not marketplace supply.

Acceptance: seller drafts listing → moderator publishes synthetic listing locally → buyer finds/saves/enquires → seller accepts permitted interaction → buyer starts due diligence → listing is closed/withdrawn → public results update → private records remain isolated.

## 9. Phase 3 Build: complete the remaining construction ecosystem

Preserve the working project/stage/task/budget/material/contact/site-update/handover foundation and its correction, ledger, reminder and permissions behavior. Do not rebuild it.

Implement the remaining source features as connected capabilities:

**Dealer/professional directory:** self-service onboarding, service categories, locations/service areas, licence/authorisation evidence where applicable, consented contacts, review/expiry/suspension, business availability and role-limited management. Separate “identity reviewed,” “credential evidence reviewed” and actual issuer authorisation. A contact imported by an owner is not a verified directory professional.

**Material rates and quotations:** import/manual submission and approved provider connectors, with supplier, city, brand, grade, unit, quantity basis, tax/freight inclusion, timestamp, validity and source. Comparable price movement requires comparable specifications/units. Stale quotes remain labelled stale. Do not call a single dealer quote the market price.

**RFQs/procurement:** select project/stage requirements → owner approves recipients and scope → eligible suppliers receive only needed information → submit/revise quotations → compare → select → record external order/receipt or approved commerce event → preserve cost linkage. Quantity/rate calculations must use decimal-safe representations and declared units; expenses must not be duplicated by material requirements, quotes, invoices and payments.

**Engineer consulting:** browse reviewed profiles, permitted availability, enquiry, appointment/booking, consented case documents, consultation outcome, cancellation/rescheduling and approved provider payment/refund handling. The software can run with sandbox participants, but do not advertise paid live appointments without actual professionals and fulfilment arrangements.

**Guides and conceptual floor plans:** reviewed, rights-cleared construction stages and a searchable plan library using the notebook sizes—20×50, 30×50, 22×50, 15×50, 40×60 and 50×80—with explicit units and constraints. Store author, rights, review status, version, area/floor data and clear conceptual-use warnings. Do not copy architects' plans without rights or claim a generic plan is sanctioned, structurally safe or ready to build. Engineering quantities and approval rules require separately approved content/calculation sources.

All directories/RFQs/consultation/plan workflows must connect to the existing project and permission system, not introduce another Vault, payment ledger or scheduler.

Acceptance: project requirement → scoped RFQ → authentic sandbox supplier quote → comparison/selection → receipt/cost linkage; reviewed-professional booking → outcome; eligible licensed plan → project attachment. Test denied financial/document access and cancellation/permission changes.

## 10. Government, registry, utility and DigiLocker connections

Implement a modular connector registry with provider, purpose, jurisdiction/coverage, access requirements, permitted data, consent, retention, credentials reference, freshness and actual capability status. Use current official provider documentation; old portal names in the concept are discovery leads, not proof that a current API exists.

Cover the source's DigiLocker, land records, registration records, state RERA, property tax, municipal water and electricity/other applicable utilities. Do not promise nationwide automatic access from an API interface alone.

For each connector distinguish:

- Authorised API available and tested.
- Documented sandbox access only.
- Official user-facing portal/link available, but no integration.
- Partner approval or commercial access required.
- Unsupported for this jurisdiction/provider.

Use approved OAuth/consent and server-side secrets. No stored government-portal passwords, CAPTCHA bypass, scraping around access controls or guessed unofficial APIs. Source imports must show provider, record date, fetch date, coverage and limitations. “No record,” “no access,” “outage” and “unsupported” are different outcomes.

A DigiLocker connection is separate from Sukoon's Smart Vault. Implement its real partner flow only when access is approved; do not present ordinary uploads as issuer-fetched documents.

Manual entries remain usable and clearly labelled. Reconcile new provider records with existing obligations/documents rather than silently replacing or double-counting them. Let users review conflicts. Provider evidence does not automatically establish clear title.

Acceptance requires a connector-specific observed fetch/consent/revocation/error flow. With no permitted endpoint or credentials, finish safe integration preparation, retain the exact blocked task and continue other work. An unavailable adapter does not complete that connector.

## 11. Payments, subscriptions and commercial flows

Implement configurable plan/entitlement management for premium ownership features, broker participation, document packages and consultations as specified by approved product decisions. Pricing in previous conversations was illustrative; do not activate charges from those examples.

Use approved payment providers for checkout, recurring payments where supported, signed webhooks, durable event intake, idempotency, pending/success/failure states, reconciliation, cancellations, refunds and disputes. Verify server/provider state—not browser success—to grant paid entitlements. Test duplicate, delayed and out-of-order events, amount/currency mismatch and refund after entitlement changes.

Separate provider-confirmed platform purchases, externally recorded property bill payments, material invoices and property purchase transactions. An internal receipt is not an official utility receipt; a reconciliation row is not proof of bank settlement.

Build bill fetch/pay through an approved bill-payment partner arrangement. Do not invent a bank or BBPS integration. Escrow/closing capability needs a separately approved authorised provider and legal/commercial design; do not hold property transaction funds in a homemade wallet or platform account.

Build digital referral/affiliate attribution and anti-abuse support only to the extent required by approved commercial scope. Rewards remain disabled until explicit rules and payout authorisation exist. Avoid fake cash balances or incentives paid for empty registrations.

A cancelled subscription must not silently destroy property records or circumvent the approved privacy/data-access policy. Keep marketing consent separate from essential transactional notifications.

## 12. Marketplace & Media: content, podcast and SEO

Extend the existing reviewed-content system rather than create a disconnected content store.

Support education, news/articles and podcast episodes with author, source/rights, dates, language, categories, review/publication/revision/retraction, source links, media metadata and saved content. Preserve distinction between property-specific Updates and public editorial content. Draft, withdrawn and expired guidance must not appear as current advice or influence readiness.

Podcasts need actual rights-cleared audio or authorised embeds, player behavior, episode metadata and feed support where appropriate—not a decorative card or invented conversation. Transcripts/summaries must correspond to the real source.

Use human-reviewed AI assistance for preparation, not automatic factual/legal publication. Do not republish full copyrighted articles, buy fake engagement or fabricate authors/reviews.

Build useful public discovery: crawlable approved guides and active authorised listings, metadata, canonical URLs, sitemaps, structured data consistent with actual page content and redirects/withdrawal handling. Private vault/search/deal/profile/export data must never enter public indexes or analytics payloads. No bulk low-quality city pages with invented rates or thin duplicates.

Implement privacy-safe attribution and funnel events for acquisition → signup → property creation → meaningful use. The historical 1-lakh-user target is a business goal, not a performance or acquisition guarantee. SEO code does not create traffic, reviewed content or marketplace supply by itself.

## 13. Enterprise ecosystem without a private-data marketplace

Implement the earlier concept's B2B foundation using explicit organisation membership, tenant isolation, scoped service credentials, consented case workspaces, versioned APIs, audit records, quotas, webhook delivery and revocation.

Provide minimal source-aligned portals/workflows for:

- Banks/NBFCs: borrower-consented selected property evidence, document request/review and recorded application status.
- Insurers: consented evidence and quote/application/referral status.
- Developers/societies: authorised property/document handover and relevant maintenance/charge integration with existing owner workflows.

Underwriting support is structured evidence/decision support with provenance and reviewed criteria—not autonomous credit approval, binding insurance underwriting, title certification or eligibility guarantees. Real decisions and offers belong to approved accountable partners.

No institution receives ambient access to users' private properties. Do not sell a bulk vault dataset, grant access solely because an organisation is paying, or treat user platform membership as consent to every partner. Purpose, fields, duration, export and revocation must be explicit.

Acceptance: synthetic institution requests selected evidence → owner authorises → institution accesses only that case → data/review events are audited → consent expires/revokes → API and deferred outputs deny further access. Real partner acceptance remains separately tracked.

## 14. Ordinary runtime and external approvals

Create one consolidated `docs/OWNER_ACTIONS.md` early, then update it instead of asking repeated isolated questions.

For every blocker give: capability affected, decision needed, recommended option, alternatives where material, present official access requirements, region/data handling, current cost assumptions and limits, exact approval/action, and what work can continue without it.

Prioritise decisions needed for a genuinely usable app: production-capable private storage, transactional email, OCR/AI, scanner operation/signature updates, worker hosting, domain/TLS, reviewed content and mobile release target. Also track payments, partner access and directory/media supply. Do not leave these until the final session.

Code may be built and tested with sanctioned sandbox fixtures, but fixtures must be unmistakable and disabled in ordinary/live runtime. Do not stop at a forest of interface stubs. Once a provider is approved and accessible, complete its ordinary-app acceptance before calling it integrated.

This mandate does not authorise new costs, external accounts, real-user emails, public publication, new processing of private documents, live payments, production migrations or deployment. Request grouped explicit approval. Do not paste secrets into chat or evidence. Never use another client's infrastructure or data.

Use feature-specific capability validation. Disabled optional news, push or government connectors must not make healthy unrelated OWN routes fail. Conversely, required authentication, storage or scanning failures must not be hidden. A secure deployed self-hosted scanner is not disallowed merely because it is not a commercial remote API; test transport and security separately from production suitability.

Define liveness, feature readiness and provider diagnostics separately. Expose only suitably redacted public health information, with detailed operations diagnostics protected.

## 15. One coherent application and source of truth

Preserve the category-led Home: **Vault / Construction / Buy–Sell / Updates**. Add the full phase functionality inside coherent routes and sections, not dozens of unrelated home cards.

Reuse design primitives, typography, accessible contrast, whitespace and restrained icons. No decorative property photography or new gaudy gradients. Genuine user-approved listing photos are functional listing content, not permission to redesign the app. Preserve approved branding and logo placement.

Connect all modules to the appropriate Passport/project/deal identity while strictly separating public and private projections. Personal vault search, public listing discovery and public educational search require different scopes and must not leak through counts, snippets or recommendations.

Choose a single authoritative modern path per domain. Inventory legacy AppState/bills/reminders/share/construction writes, migrate safely where required and use tested compatibility adapters temporarily. Do not leave two independent writable sources of truth. No silent data loss or alteration of financial/provenance history.

Reassess permissions whenever a new resource, attachment, summary, export, search projection, assistant tool or webhook is added. Revocation must be checked at request and output boundaries; explain that already downloaded copies cannot be recalled.

## 16. Mobile app delivery: settle the platform, do not conceal the gap

The current reported implementation is Next.js/mobile web. The older master plan contains iOS/Android build acceptance, but the available reports do not establish a final approved native-versus-packaged-web decision.

Inspect the repository for an existing mobile client or packaging decision. If present, follow it. If absent, place one specific recommendation in OWNER_ACTIONS comparing reuse of the current responsive app with separate native clients, identifying authentication, file/camera, push, deep-link and offline implications. Ask once before a major architectural choice; continue responsive web and backend completion meanwhile.

Do not call a browser page, screenshot, PWA shortcut or simulator a released native app. Produce the approved installable builds through authorised tooling/accounts and identify the artifact type and platform accurately. Never guess App Store or Play approval.

Test physical iOS and Android where available: safe areas, keyboard, file/camera import, preview/download, sign-in/resume, session expiry, permissions, notifications, deep links, back/forward, network loss and large text. Missing hardware or signing access remains an explicit platform blocker.

No private document offline cache by default. Any approved cache must follow identity, expiry and logout/revocation rules. No sandbox OTP endpoint exposed on public deployment or an unauthorised tunnel.

## 17. Testing, security, reliability and performance

Use synthetic data in isolated databases with existing safe migration wrappers. Establish a repeatable normal-app walkthrough as well as unit/integration tests. Do not invent test counts or sum focused subsets twice. Record actual commands, exit codes, failures and skips.

Test complete role journeys: owner, co-owner, buyer, seller, broker, architect, supplier, content moderator, support operator and enterprise delegate. Include guessed IDs, cross-property attachments, API/search/count leaks, stale writes, replayed invitations, expiry, revocation during jobs, malicious document prompts, injection, unsafe file paths, oversize/corrupt files, scanner outage and provider errors.

For external side effects, an internal JobEffect row alone does not prove exactly-once delivery. Use provider-supported idempotency or bounded reconciliation and represent uncertain outcomes. Test a crash after an external action but before acknowledgement. Re-authorise inputs and outputs and stop future processing after consent withdrawal.

Run migrations and restore drills on disposable/staging data only, including deletion replay. Test restart survival, concurrent workers, job leases, notification duplication and reconciliation. Review dependency advisories using actual installed versions, upstream fixes and runtime/build exposure; do not assume an old forced downgrade is still the only remedy or run force fixes. Unresolved high-risk exposure needs an explicit release decision, not silence.

Define measurable pilot performance budgets and cost limits before load testing. Distinguish registered users from simultaneous active users, document throughput and external API concurrency. Measure p95 latency, error rates, queue backlog, storage growth and worst-case processing costs under an explicit scenario. Do not claim “supports 1 lakh users” from a build or a small fixture test.

Run focused tests after changes, required cross-module regressions at milestones and the full verification pipeline before release candidates. Avoid unnecessary repeated installations/full scans while retaining mandated final evidence.

## 18. Staging, live providers, UAT and release

Carry forward S25–S30 and broaden their regression scope to all newly implemented modules. Prepare deployment artifacts/runbooks early; actual provisioning and publication wait for explicit approval.

Staging must use an isolated approved database, private storage, API/web runtime, durable worker, real required providers, TLS, environment-scoped secrets, monitors, backup/restore and a rollback plan. Remove development-only adapters from live paths; do not simply change NODE_ENV and call the Mac configuration production-ready.

Test the actual hosted journeys with authorised synthetic/consented data: new registration and real email, fresh upload/real scan, genuine extraction/review, real assistant answers with citations, reminders, share/revoke/export, purchase/listing/procurement and approved payment sandboxes. Record browser, platform, provider, content version and deployment revision.

Obtain owner/client approval for visual behavior, published content, privacy, scoring, commercial rules and the actual candidate. Do not interpret successful tests or this mandate as Akshay's final acceptance.

After explicit release approval, deploy the frozen candidate and approved migrations, verify production smoke tests, document rollback and operations ownership, hand over appropriate client-owned accounts and authorised installable artifacts. Report store submissions and approvals separately.

No phase is released merely because an optional feature flag hides its missing functionality. A narrower pilot can be proposed, but only the owner can approve its disclosed scope; it does not redefine “all phases complete.”

## 19. Recommended execution order and visible deliverables

Use these as workstreams with dependency contracts, not new interpretations of source phase numbering:

1. **Close the current foundation:** S23/S24, known navigation/session/scanner recovery gaps, authoritative-domain reconciliation and consolidated provider/platform decisions.
2. **Finish ordinary OWN use:** approved live storage/email/OCR/AI paths, real information sources, content review and local/browser evidence. Run this alongside independent feature coding when external access is blocked.
3. **Transact & Draft:** purchase workspaces, reviewed template engine, rate data infrastructure and deal-room permissions.
4. **Marketplace:** seller/buyer/broker flows and moderation, using the deal-room foundation.
5. **Construction ecosystem:** directories, sourced rates, RFQs, consultations and licensed conceptual plans, reusing current Construction.
6. **Media, commerce and partner integrations:** reviewed public content/podcasts/SEO, approved payments and entitlement flows, government/utility coverage, enterprise cases.
7. **Release acceptance:** complete platform delivery, cross-product regression, staging/live providers, UAT, release and handover.

Government, commercial and platform approval work begins at step 1, not step 6. Production safety checks and testing run throughout. Independent tasks can proceed early where dependencies are met.

At every milestone leave a normal-app walkthrough that demonstrates what changed. No isolated pages with “coming soon” count as completed in-scope modules. Honest blocked states remain valid, but the module stays unfinished.

## 20. Final handover and session reporting

The ultimate handover must contain working application code, migrations, approved web/mobile artifacts, operations/admin, reviewed launch content, configured and tested approved providers, security/privacy controls, test evidence, setup/deploy/recovery runbooks, release matrix and a short owner guide.

Every session ends with a concise factual checkpoint: completed user journeys; code/provider/content/browser/device evidence; changed files and tests; precise owner actions; existing safe continuation work; and the exact next executable task. Do not produce another long celebration of fixture-only completion.

Maintain the persistent task plan so a new session can resume without rebuilding from chat memory. If context/time ends, checkpoint before stopping. When all currently executable work is exhausted, show the blocker list rather than invent progress.

**Start now:** reconcile this scope with the active plan, identify the remaining work once, issue the consolidated owner-action list, and implement the highest-priority safe S23/S24 and release-foundation slice. Then continue through eligible work in the same session. This mandate authorises ongoing development across all phases; it does not authorise bypassing approvals or falsifying completion.
