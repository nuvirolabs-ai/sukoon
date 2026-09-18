# Sukoon - V1 scope and source of truth

## Read this first

This is a scope baseline for auditing an existing application, not a report of what that application currently implements. The live application and repository have not been inspected by the author of this file. Never turn a requirement below into a claim that it is implemented or missing without evidence.

**Brand:** Sukoon. **Product concept:** Property OS. **Core object:** Property Passport.

**Mission:** "If I own a property, everything about my papers, taxes, and health lives here."

## 1. Source and scope boundary

Source: the user's attached **Property OS: Concept Summary**, seven pages.

The source contains two different roadmap arrangements: a five-phase roadmap on page 5 and a notebook feature split on pages 6-7. Do not silently merge those into one contractual delivery list. For this V1 audit, use the explicit final notebook lock: **Phase 1 = OWN; buy/sell, construction, brokers, and media follow later.** Both arrangements support starting with property ownership. Future phase ordering remains a separate product decision.

The functional scope below is drawn from that notebook split, with explanatory detail from the earlier concept sections. Engineering acceptance requirements in the companion audit file are proposed testing safeguards, not quotations from the source or newly approved commercial deliverables.

## 2. Required V1 product capabilities

### OWN-01: Property Passport

One property record connects the owner's documents, property information, measurements, bills, maintenance, history, sharing, and assistant context. The record must remain the link between these areas rather than creating separate, disconnected property copies.

Source: pages 1 and 6. Exact schema, identity-resolution method, and mandatory onboarding fields are not specified in the concept. Audit the existing implementation before proposing changes.

### OWN-02: Smart Vault and Document AI

Store property documents and support AI classification, extraction, and document-gap detection. The notebook lists registry, chain documents, link papers, NOC, Naamantaran/mutation, property information, measurements, and sanctioned map. The earlier concept also discusses tax receipts, loan agreements, encumbrance certificates, society records, and insurance documents.

Source: pages 1 and 6. The example "14 of 17 documents" is illustrative, not a universal rule. The source does not supply a complete, authoritative document-requirement matrix for every property type and jurisdiction. Flag this content dependency explicitly; do not invent it.

A working local vault is not the same deliverable as a live DigiLocker integration. Audit them separately. The document places government/payment connectors in a later roadmap stage; provider approval is not proof of working local vault functionality, or vice versa.

### OWN-03: Bills and reminders - manual first

Support manual bills/obligations and reminders associated with a property. The notebook mentions property tax, rent for a landlord/tenant, maintenance, society deposit, diversion tax, water, electricity, registry-related deadlines, and "wealth tax (where applicable)."

Source: pages 2 and 6. Preserve those terms when reviewing scope, but do not translate a category name into a verified legal obligation, rate, or deadline. The source gives no applicability rules. Any questionable or unvalidated tax category needs a content decision before automated advice or default reminders.

Automatic bill retrieval, payment checkout, and official reconciliation are separate from manually recorded payments and receipts.

### OWN-04: Property Health

Show documentation completeness, recorded tax/bill status, and relevant gaps with corrective next actions. Explain what contributes to the result.

Source: pages 1-2 and 6. The concept does not specify a scoring formula, weights, evidence thresholds, or refresh schedule. Record these as decisions requiring a documented implementation; do not fabricate a sample 82/100 as a live result.

### OWN-05: Maintenance and property timeline

Keep maintenance/service history and a timeline of ownership events. The example service record includes an issue, report date, provider, estimated and final cost, status, and supporting invoice/warranty.

Source: pages 2-4 and 6. Recorded history needs clear event provenance. A record being present does not itself prove that the underlying physical work occurred.

### OWN-06: Controlled sharing

Allow limited property/document access for family, co-owners, a CA, a lawyer, or other permitted invitees. The broader concept specifies role-limited and time-bound access.

Source: pages 4 and 6. Audit record-level permissions and access expiry, not just whether a Share button exists.

### OWN-07: Property-scoped AI assistant

Answer questions using the permitted property's records: outstanding obligations, available/missing documents, recorded repair spend, and selected document summaries or sharing bundles.

Source: pages 2-3 and 6. Generic chatbot answers without access to the user's permitted property records do not satisfy this requirement. Unsupported answers must be marked as unknown, not guessed.

### OWN-08: Lightweight buyer education

Provide purchasing do's/don'ts and a guide/checklist. This is lightweight education, not a full transaction platform or media operation.

Source: pages 6-7. The source does not provide a completed, jurisdiction-specific legal knowledge base. Content requiring current verification is a dependency, not permission for the agent to invent advice.

## 3. Home screen and design boundary

The concept asks for a category-led home, and the conversation establishes the current Sukoon categories: **Vault, Construction, Buy / Sell, Updates**. Preserve the current approved logo, layout, and visual direction during the functional audit. Do not substitute a new dashboard or redesign the app without approval.

Category visibility is not equivalent to launch scope. Construction and Buy / Sell may be clearly marked as planned, provide an agreed informational preview, or be hidden behind feature flags. They must not pretend to offer live listings, verified transactions, material prices, or active projects when those services do not exist.

The screenshot examples are design references, not authoritative property records, current market prices, verification evidence, or sample data to expose as a new user's real account.

## 4. Explicitly deferred beyond OWN

The notebook excludes nationwide guideline/circle rates, a full legal-drafting suite, construction marketplace and professional consulting, a full villa floor-plan library, a public property/broker portal, city-to-area discovery, and a news/blog/podcast media channel from Phase 1.

Source: pages 6-7. The broader vision also includes government/payment connectors, transaction tools, material commerce, and enterprise services. Track these separately; do not score them as V1 defects solely because they appear in the long-term concept.

## 5. Unresolved decisions to expose, not conceal

- Document checklist applicability by property type, jurisdiction, and ownership situation.
- Health-score formula and what constitutes supported evidence.
- AI provider, document-processing permissions, limits, costs, and failure behavior.
- Authentication and reminder delivery providers for production.
- Approved buyer-education content and its review/update owner.
- Role defaults, sharing expiry, retention, deletion, and data-export behavior.
- Hosting, file storage, backups, monitoring, and operational support ownership.

These decisions do not justify fake data or silent external integrations. Complete independent, in-scope work and report genuine dependencies.
