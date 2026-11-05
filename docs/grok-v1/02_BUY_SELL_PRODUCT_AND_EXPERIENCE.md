# 02 — Buy/Sell V1: product and experience contract

## 1. Product definition

Buy/Sell is a transaction organizer. It helps someone evaluate, negotiate, record and complete a property transaction with clear evidence and explicit access. It is not a public listing marketplace in this release.

Buyer promise: **Know what you are considering, what is still unknown, what needs you, and what happens next.**

Seller promise: **Prepare one property for sale, manage each interested buyer separately, share only what you choose, and keep a clear record through handover.**

Keep the user-facing label "Buy / Sell". "Transaction OS" is an internal product concept, not terminology to teach homeowners.

## 2. What exists versus what must be built

The inspected source already implements private Purchase Workspaces, candidates, notes/questions/document requests, evidence receipt/review, question history, and a guarded same-owner document import. The currently inspected candidate stages stop at considering/information gathering/reviewing/on hold/not proceeding.

Do not rewrite those features. Extend them for the scope below. Seller workflows, structured offers/terms, financing records, transaction stages, handover, shared negotiation, and multi-party permissions must be audited rather than assumed complete. An old note saying "seller counter-offer ₹1.75Cr" is not a typed Offer object and is not proof the seller submitted it.

## 3. First entry: two clear intentions

Open Buy / Sell with:

- **I'm buying** — continue an existing search or add a property found anywhere.
- **I'm selling** — choose an existing owned Property Passport, then prepare a private sale workspace.

Below these, show active purchases and sales as concise rows: property, current situation, next action, most relevant amount. No fake public inventory, "nearby deals", scraped listings, marketplace contacts, or search result placeholders.

A first-time user can start with three primary fields or fewer. Longer metadata is optional and added when it serves a decision.

## 4. Buyer journey

### 4.1 Add a property under consideration

Collect name/location, asking price if known, and a short source/notes field. Use existing account context. Price can be unknown. Save immediately into a private candidate; do not create an owned Passport.

Optional detail: property type, original area and unit, area basis, amenities/inclusions as claims, seller/broker contact, buyer budget, financing need. Carpet/built-up/super-built-up areas must remain distinct; do not compare incompatible area bases as equivalent.

Allow more than one candidate. Compare selected attributes from recorded data, with missing values shown as unknown and no fabricated value score.

### 4.2 The transaction story

The default candidate/deal screen is one scroll:

1. Property identity and current phase.
2. One meaningful next step.
3. Up to three things needing attention.
4. What we know / still need to confirm.
5. Commercial position.
6. Next visit/date and latest activity.
7. Contextual entry points to Papers, Questions, Terms, Money, People and History.

Example, using actual scenario data:

> Riverfront Residency · Unit 1204  
> Reviewing and negotiating  
> Seller's reported counter ₹1.75Cr · Your latest offer ₹1.72Cr  
> Next: follow up on parking allocation.

Keep facts short. An explanation is available on tap. Do not show a six-tab database or giant edit form as the default.

### 4.3 Collect and understand information

Represent four independent concerns:

- A claim: what someone said.
- Supporting evidence: what is actually available in Sukoon.
- Review: who assessed which exact version and what they concluded.
- Action: what is still unresolved.

Example:

> Parking: one space is claimed. Supporting paper not added.  
> Tax receipt: requested; not yet available here.  
> Society dues: question awaiting a response.

"Known" must not imply verified title. Where uncertainty exists, name the source instead: "Recorded by you", "Seller's statement", "Paper available", "Review recorded".

Document checklists are suggested information topics unless linked to an applicable, reviewed, sourced rule. Do not invent a mandatory Indian legal checklist from memory.

### 4.4 Requests and questions

From a missing item, one tap opens a short request: what is needed, who will handle it, due date if useful.

A saved private request is not a delivered request. Distinguish "Saved for your follow-up", "Shared in the deal room", and verified external delivery. Without SMTP, do not claim email sent.

Questions support answer, follow-up, resolve and reopen with history. An owner-entered paraphrase remains "You recorded the seller's response". It does not become a seller-authored response.

"Still waiting for the seller" is a follow-up note, not an answer that closes the question.

### 4.5 Visits

Support planned date/time, participants or contacts, notes, observations and follow-up questions. A contact who is not an authenticated participant is not an app member. Scheduling a private visit note sends no invitation unless an actual delivery path is enabled.

### 4.6 Offers and terms

Track asking price separately from offers. Each offer has author/source, version, amount, date, status and explicit terms. A counter creates a new linked offer, not an overwrite.

Terms can include price, proposed token, possession date, parking, included fixtures, furniture, cost responsibility and conditions. Optional terms remain unknown until recorded.

Use "Recorded commercial terms" rather than legal acceptance language. A user can record that terms were agreed outside Sukoon, but show who reported that and when. A verified participant acknowledgement is a separate event about an exact version; it is still not an e-signature or government confirmation.

Change any material term and prior acknowledgements become historical; request new acknowledgement rather than silently treating it as accepted.

### 4.7 Financing and transaction money

Track financing as manual records: intended source of funds, application submitted, lender-reported status, amount requested/sanctioned/disbursed, open conditions and documents. No lender confirmation is invented from an owner note.

Transaction money answers: purchase price, additional entered costs, amounts recorded as paid, remaining price, next planned payment. Keep deposits, refunds, reversals, loan sanction and disbursement distinct. No payment button that simulates bank transfers.

### 4.8 Documentation, registration and handover

These are recorded milestones, not a universal legal sequence. Allow honest parallel work. Registration appointment scheduled is not registration complete. A paper being present is not registration verified.

Handover tracks keys, meter readings, possession date, included fixtures, pending items, dues notes, contact details and evidence where available. Show unanswered items; don't require a false "all done" checklist to save progress.

### 4.9 Add the purchased property to Properties

Offer a separate explicit action after a user-recorded acquisition milestone:

1. Review facts and their sources.
2. Confirm they want an owner-asserted Passport.
3. Reuse/link an existing suitable Passport or create one through the existing property API after duplicate checks.
4. Keep purchase history and candidate unchanged.
5. Copy selected buyer-owned evidence only through the existing exact-version import, with a fresh destination scan when required.

Do not transfer the seller's property, documents, access grants or ownership. Under hosted documents-disabled mode, metadata-only Passport creation can proceed with explicit confirmation; byte imports remain disabled and explain why.

## 5. Seller journey

### 5.1 Start from an existing property

Property → **Prepare to sell**. Reuse known address, area, ownership assertion and property identity. Ask only asking price if known, expected timing and a short description. Save privately. This does not publish a listing or verify seller authority.

### 5.2 Prepare a sale pack

Show information the owner may choose to disclose. Private by default. Select exact property fields and exact document versions, then review a "What the buyer will see" projection.

Never share an entire Passport automatically. Exclude loan balance, personal notes, bank details, maintenance contacts, other properties and unrelated papers unless an explicit supported scope is selected.

With storage disabled, share permitted facts in an authenticated room only when available; document selectors explain unavailability. Do not create pretend document attachments.

### 5.3 Track each buyer separately

Create a prospect with source/contact, next action, visit, questions, offer history and progress. Each prospect/deal has its own private workspace boundary. Buyer A must never see buyer B's price, identity, notes or offer count unless the owner explicitly publishes an allowed aggregate; no such aggregate is enabled by default.

A seller can have many prospects; there must not be multiple active internally selected sale agreements for the same seller listing. Selecting another requires an explicit recorded change of disposition. This is an application consistency rule, not an assertion about legal exclusivity.

### 5.4 Respond and negotiate

Respond to permitted requests, share selected versions, record an offer/counter, record visits, and decide whether to continue. Each action has a clear actor and source. Broker involvement does not grant broker authority to accept terms or confirm payments.

### 5.5 Finish sale and retain records

Record transaction outcome, payment records, pending/refund/disputed balances and handover. Closing a sale records history; it does not automatically delete or archive the original property or revoke all pre-existing family grants. Present those as separate explicit owner actions.

## 6. Professional experience

Lawyer: selected papers and exact reviewed versions, assigned questions, separate private notes and explicitly shared review summaries.

Broker: assigned deal progress, allowed commercial terms, visits and requests; no private buyer budget, financing or legal notes by default.

Finance adviser: explicitly granted financing/budget information and selected papers only.

A professional's name/title is owner-provided identity information, not verified professional status. Deeper navigation is role/capability-driven, not a toggle that changes authorization.

## 7. Visual rules

Use a few purposeful visualizations:

- Stage path: completed / current / future work, not a fake "safe to buy" percentage.
- Price history: labeled asking price, buyer offers and seller counters, with actor/source and dates. No fake interpolation or truncated axes that exaggerate movement.
- Information matrix: requested / available / reviewed / needs recheck. Count only real records in the applicable scope.
- Payment bar: price versus canonically allocated net recorded payments; show refunds/reversals and overpayment separately.
- This-week date rail: visits, response dates, financing follow-up and handover.

Prefer readable rows, typography, spacing and selective visual emphasis over nested rounded cards. Keep essential transaction identity and the next action visible at 390px/430px without tiny text. Use lightweight SVG/CSS, text alternatives, keyboard access and reduced motion. No screenshots-as-UI.

## 8. Common quick actions

| Action | Primary inputs; prefill known context |
|---|---|
| Add candidate | Name/location, asking price optional, source/note |
| Ask question | Question, responsible contact/person, due date optional |
| Record response | Response, source, evidence optional when supported |
| Record offer | Amount, key terms, source/actor context |
| Add visit | Date/time, person/contact, note optional |
| Record payment | Amount, date, allocation context; advanced method/reference |
| Follow up | Short note, next date optional |
| Prepare seller disclosure | Selected facts/versions, recipient, expiry |

"Three inputs" is a design goal, not permission to omit material consent or provenance. Significant sharing, ownership, money corrections and completion actions need clear confirmation of scope.

## 9. Included now / excluded now

Included: private buyer and seller organization; typed lifecycle, requests, questions, offers, terms, manual financing and transaction money; visits; handover; exact-version provenance; private professional views and permissioned room foundation; deterministic guidance; exports/privacy integration; realistic synthetic scenarios.

Excluded: public marketplace, lead purchasing, live valuation, automatic title/legal verdicts, government APIs, payment collection/escrow, e-signatures, lending decisions, WhatsApp/iMessage automation, unapproved provider purchases.

Real multi-party hosted use depends on separate authenticated participant identities. The existing single review account must not be reused as every participant. File 03 defines the safe collaboration boundary; file 05 defines deployment gates.
