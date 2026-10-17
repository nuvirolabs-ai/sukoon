# 03 — Transaction engine, authorization, money and guidance

## 1. Implementation contract, not a second backend

Map these concepts onto existing V1 Prisma models, repositories, APIs, session/authz helpers, outbox and tests. Retain working PurchaseWorkspace, PurchaseCandidate, PurchaseEntry, PurchaseEvidenceEvent, Vault, sharing and purchase-import behavior. Do not replace their stored enums in place or send the entire UI state to a generic save endpoint.

New models/endpoints are justified only by missing behavior. Keep transaction logic in focused modules rather than expanding one giant route or component. Keep existing Construction money/guidance behavior unchanged.

Every new persisted entity needs a bounded identifier, ownership scope, timestamps, actor/source, optimistic version where mutable, and explicit authorization. Database constraints must prevent cross-workspace child references; application checks alone are insufficient for referential integrity.

## 2. Conceptual entities

| Concept | Responsibility and minimum information |
|---|---|
| Private purchase workspace/candidate | Existing buyer organizer; candidate facts, source, original units, private budget and notes |
| SaleWorkspace | Owner workspace, owned property reference, asking price, lifecycle, active selected deal reference |
| SaleProspect | Seller-private contact/prospect, lead source, visit/follow-up state; not an authenticated grant |
| Transaction | Direction BUY/SELL, owner workspace, source candidate or owned property, phase, lifecycle, version and history |
| DealRoom | Optional permissioned collaboration space; participants, selected disclosures and shared discussion, not the full private transaction |
| Participant/Grant | User identity, inviting party, role label, explicit capabilities, subjects, expiry, accepted/revoked state |
| Claim | Topic/value, original source party, entered-by user, assertion time, evidence links, contradiction/supersession links |
| DocumentRequest | Request text/type, recipient/contact, due date, delivery/publication state, fulfillment status |
| Question/Response | Question, assignee, response source, immutable history, evidence version, resolution/reopen |
| ProfessionalReview | Reviewer, scope, exact document/terms version, limited conclusion, private/shared visibility |
| OfferRevision | Amount, currency, terms snapshot, author/reporting source, previous offer reference, status, optional expiry |
| TermsRevision | Price, token, possession, inclusions/exclusions, cost responsibilities, conditions, immutable revision |
| TermsAcknowledgement | Actor, exact revision, timestamp and type; never a substitute for legal execution |
| FinancingCase | Manual lender/application facts, requested/sanctioned/disbursed amounts, source, conditions, dates |
| PaymentPlanLine | Planned amount/date/milestone, price or additional-cost classification; no automatic cash effect |
| TransactionMoneyRecord | Canonical posted/reversed/refunded owner-recorded amounts and allocations; no duplicate property ledger |
| Visit/Appointment | Timezone-aware start/time or date-only, contact/participants, private notes and observations |
| Handover | Explicit checklist version, item disposition, possession report, keys/readings, remaining issues, owner confirmation |
| Event/Outbox | Atomic event and side-effect intent with idempotency/correlation, visibility and sanitized payload |
| Guidance | Deterministic active item, source references/versions, priority, action, expiry and resolution |
| Scenario manifest | Namespaced semantic keys, persisted date anchor, planned payload fingerprints, run outcomes |

Use typed relations where possible. JSON is acceptable for versioned immutable terms snapshots or bounded metadata; not for hiding critical ownership relations or money semantics in arbitrary notes.

## 3. State machines

### 3.1 Transaction phase and lifecycle are separate

Proposed phases:

`CONSIDERING → INFORMATION_GATHERING → REVIEWING → NEGOTIATING → TERMS_RECORDED → PRE_COMPLETION → HANDOVER → COMPLETED_RECORDED`

Financing, documents and visits may proceed concurrently. This is not a universal legal checklist. Lifecycle overlay: `ACTIVE`, `ON_HOLD`, `NOT_PROCEEDING`, `ARCHIVED`.

Keep current PurchaseCandidate stage values compatible. Add an explicit transaction layer or audited additive mapping; do not reinterpret old `REVIEWING` history as completed due diligence. Forward/back transitions require expected version, actor and reason where material. Moving backward or reopening preserves prior events/acknowledgements. Stage updates do not create payments, legal status or owned property automatically.

### 3.2 Offer

`DRAFT → RECORDED → COUNTERED | WITHDRAWN | EXPIRED | AGREEMENT_REPORTED`

Distinguish owner-reported external negotiation from participant-submitted room offers. Recording a counter does not silently withdraw every other offer. Mark the supersession relationship explicitly.

### 3.3 Request and question

Request delivery state: `PRIVATE_NOTE`, `PUBLISHED_TO_ROOM`, `DELIVERY_CONFIRMED` only with actual evidence. Fulfillment: `OPEN`, `PARTIAL`, `RECEIVED`, `REVIEWED`, `WITHDRAWN`, `NOT_APPLICABLE_RECORDED` with reason.

Question: `OPEN → ANSWERED → RESOLVED`, with `REOPEN` preserving response history. Saving "awaiting response" is a note, not ANSWERED. A new document version may mark linked review as needing recheck without rewriting the historical answer.

### 3.4 Participation

`INVITED → ACCEPTED → REVOKED | EXPIRED`, plus pre-acceptance decline/cancel. Accept requires authenticated identity match, unexpired one-use token, and current scope validation. Do not use invitations to auto-create authenticated sessions or auto-verify an email.

### 3.5 Financing

Manual statuses such as `NOT_STARTED`, `EXPLORING`, `APPLICATION_RECORDED`, `SANCTION_REPORTED`, `DISBURSEMENT_REPORTED`, `DECLINED_REPORTED`, `CANCELLED`. Separate numeric requested, sanctioned and disbursed fields. Null is unknown, not zero. Changing status cannot imply disbursement into transaction payments.

### 3.6 Handover

`NOT_STARTED → IN_PROGRESS → COMPLETED_RECORDED`, with controlled reopen/correction. Items have `OPEN`, `DONE_REPORTED`, `WAIVED_WITH_REASON`, `DISPUTED`; no blanket auto-completion. Completion requires explicit owner confirmation and known unresolved-item disposition. Preserve an immutable snapshot and later corrections separately.

## 4. Facts, document evidence and professional review

Keep these dimensions independent:

- Source: owner entered, buyer reported seller, authenticated seller submission, professional statement, imported record.
- Evidence: absent, requested, bytes stored/quarantined, scan-clean, category confirmed, actual review recorded.
- Review: person, role assertion, scope, exact version, conclusion, visibility, date.
- Validity for current work: current, superseded, access ended, unavailable.

A clean file is not legally valid. A received paper is not reviewed. A manual category confirmation is not a professional review. Two contradictory claims remain visible to authorized parties as conflicting statements; do not pick a winner automatically.

New upload and replacement use the existing Vault pipeline. Review binds to the exact document version/hash. Source version replacement does not relink old review to the new bytes. Quarantined or unavailable files remain blocked. Preserve current non-leaking authorization responses.

Under hosted documents-disabled mode, support requests and honest external-paper notes, but do not set `RECEIVED`/`REVIEWED` states that require a selected actual version. Use separate "owner says held outside Sukoon" provenance where needed. No orphan PropertyDoc or DocumentVersion rows.

## 5. Multi-party policy — minimal proposed OA13 resolution

This section supplies a deliberately restricted policy for synthetic development and local multi-user acceptance. It does not authorize real-user disclosure or unapproved auth/provider deployment.

### 5.1 Private organizers remain private

Buyer's budget, strategy, notes and financing are private to the buyer's workspace. Seller's other offers, prospects, loan details and notes are private to the seller's workspace. A DealRoom is an explicit projection, not a join returning both complete workspaces.

Adding a contact/persona grants no access. Existing property share roles do not automatically grant transaction access. A broker/administrator role label does not confer ownership or financial access.

### 5.2 Role defaults after explicit accepted invitation

| Role | Default allowed inside selected room | Default denied |
|---|---|---|
| Buyer participant | Shared property facts, own authored questions/offers, selected shared terms, permitted schedule, selected paper metadata | Seller private notes, competing buyers/offers, unshared papers, seller financial records |
| Seller participant | Shared facts/terms, buyer-published questions/offers, own disclosure controls, permitted schedule | Buyer's private budget, strategy, financing, lawyer-private notes |
| Buyer's lawyer | Specifically selected paper metadata/versions, assigned questions, explicit review submission | Money, private negotiation strategy, seller private records, broad invite/revoke authority |
| Broker | Room phase, assigned visits, explicitly shared offer/term records, assigned requests | Private finance, personal notes, professional confidential review, payment confirmation or term acceptance authority |
| Finance adviser | Explicitly selected financing fields/papers and assigned conditions | Unrelated negotiation/legal/private records; no assumed bank role |
| Viewer | Named read-only subjects selected by grantor | All writes, participant management, exports and all other private data |

All roles start with no byte-download permission. Add preview and download separately, only for selected exact versions. UI and APIs both enforce the full scope, including counts, search snippets, activity and notification payloads. Access to a parent does not imply access to every child.

### 5.3 Invitation and revoke authority

- The private workspace owner can invite people only to information they control.
- Sharing someone else's contribution beyond its existing scope is denied.
- No participant may invite onward or increase another person's scope by default.
- Data contributor can revoke their disclosure; inviter can revoke their grants. Room owner can remove a participant from the room but cannot erase another person's private organizer or retained lawful own records.
- Default new invitation expiry: seven calendar days, shown explicitly. Grant expiry: default 30 days from acceptance, owner-editable downward/upward only through explicit UI and policy bounds.
- Raw invitation tokens are high-entropy and stored hashed. No public unauthenticated property/document page is created.
- Manual owner handoff of an invitation URL is allowed if an existing mechanism supports it; display "Invitation created", not "Email sent".

### 5.4 Credentials and hosted acceptance

Each actual participant requires a distinct real authenticated user/session. Never share the Akshay staging access code among buyer, seller, broker and lawyer or implement a client-side actor switch that bypasses identity.

Use existing isolated test/local auth to verify recipient journeys. On hosted staging with only one allowed review identity, complete owner-private workflows and an authorized **read-only preview of selected disclosure**. Report real hosted multi-party acceptance as blocked until approved recipient auth exists. A preview is not a simulated login and cannot submit recipient actions.

### 5.5 Notes and review visibility

Default note scope: author-private. Explicit options: selected own-workspace parties, selected room participants, or whole authorized room. Store author and audience per revision. Do not publish a lawyer's private notes through transaction owner exports or aggregate summaries.

Change in visibility needs confirmation of recipients. A professional-review summary is separately publishable; it does not expose the underlying private working notes.

### 5.6 Revocation and downloads

Recheck grant, expiry, version scope and document eligibility on every read and before queued output is returned. Immediately clear revoked content from active client views; stale responses must not repopulate it. No delayed fade-out retaining private rows.

Revocation prevents future app access; it cannot erase files someone already downloaded or screenshots they took. State that limitation plainly. Permit no silent retained copy/import of seller-owned bytes under the existing same-owner importer. Cross-owner transfer needs a separate explicitly approved consent/retention/import design.

## 6. Command and event consistency

A command should carry expectedVersion and an idempotency key bound to owner scope, action, subject and canonical payload. Replays with the same payload return the original effect. Changed payload with the same key returns a conflict. Do not create new idempotency keys to work around a failed payment retry.

Authorize → validate → lock relevant aggregate/validate expected version → persist change + audit/event + outbox in one transaction → commit → dispatch external work. Do not keep a database transaction open while waiting for the user, email, scanning or object storage. PostgreSQL locks are transaction-scoped; use consistent lock ordering and bounded deadlock/serialization retries.[S3]

Do not event-source the entire product anew. Reuse existing authoritative records and durable jobs. A synchronous projection after mutation can provide immediate UI truth, with a durable event for later guidance/search processing.

Events include: TRANSACTION_CREATED, PHASE_CHANGED, CLAIM_RECORDED, QUESTION_ASKED, RESPONSE_RECORDED, QUESTION_RESOLVED/REOPENED, DOCUMENT_REQUEST_CREATED/PUBLISHED, EVIDENCE_RECEIVED, DOCUMENT_VERSION_CHANGED, REVIEW_RECORDED, OFFER_RECORDED/COUNTERED/WITHDRAWN, TERMS_REVISED/ACKNOWLEDGED, VISIT_RECORDED, FINANCING_UPDATED, PAYMENT_RECORDED/REVERSED/REFUNDED, DISCLOSURE_CREATED/REVOKED, PARTICIPANT_ACCEPTED/REMOVED, HANDOVER_UPDATED, ACQUISITION_RECORDED, PASSPORT_LINKED, TRANSACTION_ARCHIVED.

Each event records actor, tenant/room, subject, occurredAt, recordedAt, source, schema version, correlation/idempotency and visibility. Avoid copying confidential payloads into generic timelines.

## 7. Money rules

All persisted amounts use integer minor units and currency. Transport decimals must be explicit; avoid JS floating-point money math. Keep asking price, offer, agreed/reported price, estimated additional costs, scheduled payments and actual payment records distinct.

Price paid net = sum of posted allocations to price − reversals/refunds of those allocations. Outstanding price = recorded agreed price − net allocated price payments. Show unknown until price is recorded; show overpayment separately rather than clamping and hiding it.

Total acquisition estimate = recorded price + explicitly entered estimated ancillary costs. Do not automatically calculate stamp duty, taxes, fees or brokerage from generic percentages. Missing cost categories mean the estimate is incomplete, not free.

A planned token, selected offer, acknowledgement, sanctioned loan, or receipt upload creates no payment. A reversal negates an accounting record; a refund records a returned amount. They are different operations, each with history. Existing canonical payment/ledger records must be linked, never inserted again by Transaction OS or Passport conversion.

No currency mixing, no inferred loan principal reduction, no fake bank confirmation. Corrections use authorized reversal/replacement, not edits to historical money rows.

## 8. Guidance engine

Reuse the Construction event/outbox infrastructure where compatible, but separate transaction rules and authorization. No duplicate scheduler or hardcoded frontend alerts.

Guidance stores ruleKey, private workspace/room scope, subject, source versions, evaluatedAt, active/closed state, relevance identity, deadline and action route. One active item per rule/subject/relevance episode; repeated events do not create duplicates. Resolved items remain historical. Reopening creates/updates the appropriate episode.

Reevaluate on relevant mutations **and time passing**. Use the existing scheduler for approaching dates and stale items; no requirement for another write to make an item overdue. Before serving, filter against current authorization and latest subject state. Scope changes suppress pending output.

| Rule | When | Human action |
|---|---|---|
| TX01 | Open request approaching/past recorded deadline | Follow up on the tax receipt |
| TX02 | Question response is still outstanding | Ask about parking allocation |
| TX03 | New response not yet reviewed by its requester | Read the seller's response |
| TX04 | A relevant exact document version was replaced | Review the newer paper; old review remains historical |
| TX05 | New reported/participant offer requiring owner's decision | Review the ₹1.75Cr counter |
| TX06 | Terms changed after acknowledgement | Check changed possession/price terms |
| TX07 | User-recorded financing condition due | Follow up on the lender's requested item |
| TX08 | Recorded future payment plan is due | Review planned payment; no transfer is made |
| TX09 | Visit is approaching | View visit details |
| TX10 | Handover still has unresolved items | Check keys/readings/pending items |
| TX11 | Required person cannot access a needed selected record | Review sharing or request the contributor to share |
| TX12 | Two authorized claims conflict | Resolve the parking/area information conflict |
| TX13 | Completed-reported purchase lacks a linked Passport | Review details before adding to Properties |

Owner landing shows at most three main actions. Zero guidance means "No actions from your recorded information", not "This property is safe". A coverage percentage is permissible only for a precisely defined applicable checklist and must exclude unknown/unreviewed requirements rather than fake legal certainty.

## 9. Privacy, exports and deletion

Extend the current resource lifecycle/export inventory for every new table and object link. Document which private, room-shared, author-owned and audit records belong in a user's export. Another party's private notes must not be included.

Synthetic-only erasure tests must cover new relations. Preserve current live erasure/retention approval restrictions; do not activate real-data deletion to make the feature list look complete. Deleting a transaction must not delete another person's Property Passport or selected document bytes. Archive first where disposal policy is unresolved.

## 10. Acceptance boundaries

Prove invariants in APIs and tests, not only disabled UI controls. Default deny and per-request permission checks follow OWASP guidance.[S1] Files remain served through authorized handlers and the configured validation/storage pipeline; filename/MIME checks alone do not create trustworthy scan evidence.[S2]

A missing provider is a separate capability boundary. It must not stop buyer/seller records, nor be hidden by fake evidence. Multi-party or media features cannot be declared hosted-complete based on owner preview or local tests.

## Technical sources

[S1] OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

[S2] OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

[S3] PostgreSQL explicit locking documentation: https://www.postgresql.org/docs/current/explicit-locking.html

These are engineering references, not property-law sources. Product rules above are proposed Sukoon requirements, not statutory requirements.
