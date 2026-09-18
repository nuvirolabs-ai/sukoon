# SUKOON — Product Source of Truth

## 1. Status and source labels

This is the Phase 1 implementation interpretation, not a claim of deployed capability or an amendment to commercial scope.

`SOURCE`: supported by the user's PDF, cited by page/section below.
`CHAT`: explicit direction in this conversation.
`DEFAULT`: proposed engineering/product detail needed to build it; not specified in the PDF.
`APPROVAL`: human decision required before the relevant public release/action.

Reference: `references/Property_OS_Concept_Summary.pdf`, seven pages.

## 2. Product lock

**SOURCE, pages 6–7:** Phase 1 = OWN. “If I own a property, everything about my papers, taxes, and health lives here.” Buying/selling, construction, brokers and media come after OWN works.

**SOURCE, page 1:** The Property Passport is the central record across the lifecycle.

**CHAT:** Brand is SUKOON; tagline is ESCAPE THE CHAOS. Category-first home: Vault, Construction, Buy / Sell, Updates. Latest visual direction places the logo in the centre of the home banner.

**DEFAULT:** The first supported personas are an individual property record administrator, an explicitly invited family member/CA/lawyer, and a limited-access platform operator. Android and iOS share one mobile codebase; the operator has a web admin. Consumer desktop parity is not automatically included.

A user account is not a legal owner identity. Creating a record, paying a bill or uploading a deed does not establish ownership. Ownership names and co-owner details are recorded facts with provenance; application permissions are separate.

## 3. Source conflict register

| Issue | Source evidence | Implementation handling |
|---|---|---|
| Two later roadmaps | Page 5: government/payments → buy/sell → build → enterprise. Page 7: transact/draft → build → marketplace/media. | Phase 1 OWN is common. Preserve both later sequences; schedule neither without approval. |
| “DigiLocker / Smart Vault” | Page 6 names the category; page 5 places the external connector later. | Implement Sukoon Smart Vault now. Authorized DigiLocker connection is a separate future capability. |
| Health evaluates legal/structural dimensions | Pages 1–2 broad vision; page 6 emphasizes document/tax gaps. | Preserve “Property Health” label but limit V1 measurement to transparent record readiness, not certification. See content policy. |
| Live government data and rates | Pages 2–3 vision; pages 6–7 defer data-heavy functions. | Manual verified-by-user inputs and source labels now; no fabricated live data. |
| Category home includes later functions | Page 5 and chat versus pages 6–7 release exclusions. | Retain category navigation with honest Phase 1 destinations, not mock listings or construction management. |
| Wealth tax “where applicable” | Page 6 user-source wording. | Keep as inactive, unvalidated candidate metadata. Do not create a current liability, due date or legal assertion from it. Local applicability requires review. |
| Immutable/forever wording | Pages 2–4 and positioning on page 5. | Audit corrections and lineage; implement access revocation, retention and deletion policies. No unconditional perpetual retention promise. |
| Verification promises | Pages 1 and 3 use authenticated/verified language. | Represent evidence scope/source/status explicitly. No AI-created title clearance, fraud elimination or blanket legal guarantee. |

## 4. Phase 1 requirement map

| ID | Requirement | Source | Launch interpretation |
|---|---|---|---|
| R01 | Property Passport | p1, p6 | Persistent property record with type, location, ownership assertions and identifiers. |
| R02 | Smart Vault | p1, p6 | Private document upload, organization, preview, versions, recovery and authorized export. |
| R03 | Document AI | p1, p6 | Classification/extraction proposals, source anchors, review and gap detection. |
| R04 | Bills/reminders | p2, p6 | Manual obligations, payment records, receipts, due dates and notifications. |
| R05 | Property Health | p1–2, p6 | Versioned, explainable record-readiness assessment with unknown states. |
| R06 | Service history/timeline | p2–4, p6 | Maintenance records, attachments and durable event history with corrections. |
| R07 | Controlled sharing | p4, p6 | Property/document-scoped permissions, expiry, revocation and access audit. |
| R08 | Property assistant | p2–3, p6 | Authorized property questions, citations, uncertainty and no autonomous legal/financial action. |
| R09 | Buyer education | p6 | Small reviewed guide/checklist library; no transaction execution. |
| R10 | Sukoon category home | p5; chat | Vault, Construction, Buy / Sell, Updates; source-aware search and native navigation. |
| R11 | Admin and operations | DEFAULT | Provider/job/content/consent operations without blanket access to vaults. |
| R12 | Privacy, support, portability | DEFAULT | Consent, export/deletion requests, user support and safe session lifecycle. |

## 5. Release exclusions

Do not implement public property posting, brokers, buyer/seller chat, escrow, loan origination, insurance underwriting, nationwide circle/guideline rates, legal-document drafting, government/title verification, live tax reconciliation, automatic bill checkout, material commerce, engineers/dealers directory, paid consultation, floor-plan library or a news/podcast publishing business in Phase 1.

Future provider ports and feature flags may be defined, but disabled UI must not imply a working service. No “Pay now,” “Verified dealer,” “RERA cleared,” “Live steel price” or “Legally safe to buy” unless the relevant capability and evidence actually exist in an approved later release.

## 6. Information architecture

Home → category navigation → property-scoped workspace. Most real actions begin with a property, not an unrelated module database.

Bottom navigation from the latest reference: Home / Properties / Add / Explore / More. Add is an action sheet, not an empty tab. Use an accessible label “Add”.

- **Home:** category navigation, personal updates and a Property Passport entry point. No invented total portfolio value.
- **Vault:** choose a property, then documents, reviewed details, gaps and sharing.
- **Construction:** clearly marked future construction workspace. In V1 explain the planned scope and offer “Manage my plot documents.” No fabricated progress or prices.
- **Buy / Sell:** V1 contains reviewed buying education and “Prepare my property records.” Public listings and transaction actions are visibly not available yet.
- **Updates:** personal due-date reminders, document-processing status and maintenance events. Any educational notices are reviewed content. Not a live news feed.
- **Properties:** owned/application-managed records and separately marked shared records.
- **Explore:** the small approved education library, not geographic property discovery.
- **More:** profile, notifications, privacy/AI consent, access management, help, data requests and sign out.

Property workspace: Overview / Documents / Bills / History, with Maintenance, Health, People and Ask as contextual destinations. Avoid ten cramped top tabs.

## 7. User journeys and required behavior

### J01 — New owner

Open app → sign in → accept versioned terms/privacy notices → optional AI consent is separate → empty Home → Add property → save → property overview.

Required at initial save: display name, property type, country, state and city. Optional locality/address/area, ownership details, municipal identifiers, loan/insurance references are progressively added. Do not require an exact map pin, purchase value, Aadhaar, PAN, location permission or uploaded deed to create a record.

Property types: apartment/flat, independent house/villa, plot, commercial, agricultural, other. Original area units and area meaning (plot, carpet, built-up) must remain distinct. This taxonomy is a DEFAULT grouping of the source categories, not a universal legal classification.

For incomplete information show “Added by you” / “Not assessed.” Do not show an 82/100 demo score or declare the property verified.

### J02 — Upload and understand a document

Select property → upload camera/photo/PDF → validate and quarantine → scan → store protected original → classify/extract if consent exists → review proposed fields with document-page evidence → confirm selected fields → save provenance and update timeline.

Support the source's registry, chain/link papers, NOC, Naamantaran/mutation, property information, measurement and sanctioned map categories, plus a general “Other.” More specific source categories from page 1 may be added as optional labels. A document category is not proof that the document is legally required.

Review never overwrites a contradictory confirmed field silently. Show old value, new proposal and source; require a choice. “Unreadable,” “not found,” “language unsupported” and “needs manual review” are normal results.

A user may upload without AI consent and organize fields manually. The production AI feature must still be tested with a real approved provider before full release.

### J03 — Bills and reminders

Add property obligation → select type → enter amount/currency where known, date, recurrence, timezone and optional account reference → save → see due state → reminder appears → record a payment with date/method/reference/receipt → outstanding balance and timeline update.

V1 types include property tax, water, electricity, gas, rent payable/receivable, society maintenance, maintenance charges, insurance renewal, EMI reminder, society deposit, diversion-related obligation, registry-related deadline and custom. Unvalidated local-tax types require user-entered context and no legal default schedule.

A deadline can exist without an amount. A payment record is “Recorded by you,” not reconciled by a biller. Support partial payments and correction/reversal. A rent receivable is not silently counted as an expense; a refundable deposit is not presented as consumption.

Auto-pay, automatic tax calculation, interest-rate monitoring and bank reconciliation are future features. No promise of official bill fetching in this release.

### J04 — Property Health

Open Health → see assessment status and the applicable checklist version → view complete/missing/needs-review/unknown items with evidence → take a specific action → see recalculated result.

Health must not be a legal, investment, insurance or structural recommendation. Its algorithm and unresolved applicability are defined in CONTENT_AI_POLICY. Before an approved checklist exists for the property context, show “Not assessed” and an organizer checklist, not a numeric compliance score.

### J05 — Maintenance and permanent history

Create issue → record category/description/reported date → add estimate, provider contact if permitted and optional target date → update state → record completion/actual expense/invoice/warranty → history entry.

States: OPEN → IN_PROGRESS → RESOLVED, with CANCELED and REOPENED recorded as transitions. Owner-reported resolution is not professional verification. A professional review would require identity, scope, date and evidence, not a green tick added by the agent.

Financial totals must link to one expense/payment record so a maintenance invoice and its bill payment are not counted twice. History records who did what, when, source and correction links; sensitive details remain scoped.

### J06 — Invite a family member, CA or lawyer

Property → People → invite a verified email identity → choose records and capabilities → choose expiry → preview exactly what will be visible → confirm → recipient authenticates and accepts → access is audited.

A lawyer preset contains selected title-related records, not all documents. A finance preset may see selected bills, not unrestricted legal papers. A family preset is still an explicit grant. Presets are editable proposals, not professional certification.

Revoke → future access denied; pending exports and AI requests recheck permissions; mobile caches clear when revalidation occurs. Explain that a previously downloaded file cannot be remotely recalled. No secret-bearing link grants indefinite access.

### J07 — Ask about this property

Select property → ask → retrieve only authorized records → return answer with document/ledger citations and “as of” information → source links open only if still authorized.

Examples: bills due this month, location of a particular document, recorded maintenance expenses in a period, items not yet provided. Missing sources produce “I do not have that record.” A missing upload is not proof that a document does not exist.

The assistant is read-only in V1. “Prepare a bundle for my lawyer” opens an explicit export/share selection flow; it cannot autonomously send files. No legal approval to build/buy, tax advice, payment execution or silent property edits.

### J08 — Export and revoke

Select allowed records → preview export list and access → generate protected package → authenticate to retrieve → log export → expire artifact.

DEFAULT: ZIP with selected original files and a manifest/HTML summary before a polished PDF-report product. The manifest includes data sources, generation time, version and “Not a title/legal certificate.” Export must not include another property's files or fields hidden from the requester.

### J09 — Learn before buying

Explore or Buy / Sell → choose an approved guide → see jurisdiction/scope, source and review date → save guide → optional checklist attached to a consideration note or current property.

No universal mandatory “17 documents,” official legal clearance, token-payment instructions, live stamp-duty calculator or unreviewed AI articles. For launch, publish a small human-reviewed set of non-jurisdiction-specific organizational guides and any reviewed pilot-jurisdiction checklist. Draft content cannot masquerade as published advice.

## 8. Shared functional rules

Every change survives refresh/restart. All resource lists are paginated and filterable. Empty states invite a real next action. No notification or permission popup is mandatory merely to browse the user's own saved records.

Account switching, expiration, loss of connectivity and revoked access must never reveal a previous account's data. Public pages contain no private record metadata or search snippets.

Property transfer between legal owners is not part of V1. Sharing does not transfer legal ownership. Do not automatically transfer all historic owners' documents during a future sale.

## 9. Success and definition of completion

Phase 1 is complete only when R01–R12 and release gates have evidenced implementations. A screenshot, demo seed, green build or published app icon is not completion.

Measure activation as authenticated account → property created → real document saved → subsequent return, with privacy-safe events. Track document failure rate, review completion, reminder delivery, authorized shares and revocation reliability. Registered users, property records and active users are distinct metrics. Do not claim 100,000-user readiness from a synthetic signup counter.
