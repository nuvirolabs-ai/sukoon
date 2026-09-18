# SUKOON — Source Map and Provenance

## User inputs included unchanged

- `Property_OS_Concept_Summary.pdf`: the seven-page PDF attached to the coding-pack request. This is not a substituted earlier concept document.
- `sukoon-logo-original.jpeg`: the original user-supplied SUKOON logo from this conversation.
- `home-latest-reference.png`: the latest in-chat home mockup with the logo centered lower in the home banner. This is a visual reference, not proof of approved working functionality.

The PDF is preserved unchanged. The source summary below points back to its pages; it does not silently edit the PDF.

## Page traceability

| PDF page / section | What it supports | Pack location |
|---|---|---|
| p1, Executive Summary | Property Passport as central lifecycle record. | Product R01, journeys, schema. |
| p1, Vault | Classified documents, extraction and completeness concept. | R02–R03, S09–S11. |
| p1–2, Health table | Proposed dimensions and example corrective actions, not an algorithm. | R05, health caveat and proposed deterministic policy. |
| p2, Bills | Ledger, alert hub and manual fallback. | R04, S14–S16. |
| p2, Government integrations | Modular state/municipal provider vision. | Deferred provider framework and capability states. |
| p2, Maintenance | Service incident, cost, invoice/warranty history. | R06, S17. |
| p2–3, Assistant | Property-scoped questions and document bundle concept. | R08, S20–S21. |
| p3, Buying/selling | Guided transaction and passport-driven listing vision. | Future backlog, not silently shipped in OWN. |
| p3, Construction/materials | Construction stages, example requirements and procurement vision. | Deferred features, not production material/rate fixtures. |
| p3–4, Timeline | Historical property events. | R06, append-only corrections and privacy-aware deletion. |
| p4, Sharing table | Different stakeholder access to different records. | R07, central permission model, S18. |
| p4–5, Monetization/roadmap | Recurring value and five-phase strategic roadmap. | Preserved future vision with conflict D-001. |
| p5, Rough idea | Categories on Home rather than internal feature dashboard. | R10 and category-first UI. |
| p6, Phase 1 OWN | Smart vault, manual bills/reminders, health/history, sharing, AI, lightweight buyer education. | Authoritative Phase 1 implementation scope. |
| p6–7, Exclusions | Circle rates, drafting, construction marketplace, plans, portal/brokers/media deferred. | Product exclusions and future backlog. |
| p7, Later phases + one-line lock | Alternative future sequence, OWN first. | Conflict register and deferred-only tasks. |

The surfaced PDF text in the conversation identifies these especially relevant line ranges: central property record L10–L12; OWN scope L184–L217; exclusions L218–L226; later roadmap and one-line lock L228–L253. These line identifiers are provenance notes for the supplied excerpt, not line numbers to invent for other documents.

## Proposed implementation additions

The source does not specify authentication method, stack, database/API contracts, cloud providers, production legal rules, a validated health algorithm, AI model, data residency/retention, active integrations, measured capacity, repository state or test evidence. Those are explicitly proposed defaults or approval gates in this pack.

## External technical references

Checked when preparing this pack; implementation agents must verify the selected library version and current provider terms before using them.

- Expo project setup: https://docs.expo.dev/more/create-expo/
- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Better Auth Expo integration: https://better-auth.com/docs/integrations/expo
- Better Auth Prisma integration: https://better-auth.com/docs/adapters/prisma
- Better Auth email OTP: https://better-auth.com/docs/plugins/email-otp
- Better Auth Express integration: https://better-auth.com/docs/integrations/express
- PostgreSQL-backed job library: https://github.com/timgit/pg-boss
- OWASP file-upload guidance: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- DigiLocker official requester process: https://www.digilocker.gov.in/web/partners/requesters
- Apple iPhone 17 Pro display specifications: https://www.apple.com/in/iphone-17-pro/specs/

External references support technical safeguards/integration details, not legal/title verification or a substitution of the source's product scope. This pack does not reproduce a live Indian legal/tax database.
