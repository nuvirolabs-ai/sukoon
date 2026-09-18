# Sukoon

Consumer visual/data review (14 September 2026): [rich demo composition correction, corrected counts and acceptance](docs/DEMO_COMPOSITION_CORRECTION.md); [design system and historical before/after evidence](docs/DESIGN_REDESIGN.md). Open http://localhost:3100 and sign in as demo-owner@sukoon.local through the normal sandbox OTP form. The corrected populated demo remains intact; do not reseed/reset for review. This is not final owner-approved design or production readiness.

Sukoon is a Property OS prototype whose central object is the Property Passport. Phase 1 is OWN: property records, a private vault, manual obligations, health/history, controlled sharing, a property-scoped assistant, and lightweight buyer education.

The current repository includes the locally verified S02–S22 OWN foundation and the owner-approved Construction OS expansion: transactional PostgreSQL/Prisma, Better Auth sessions, private Vault, typed rules, health, obligations/payments/ledger, reminders, maintenance, capability sharing, private search, structured assistant, exports and Home/Updates. Construction adds persistent property-linked planning through owner-confirmed handover. It is not production authentication delivery, production storage/scanning/OCR, live AI, external notification delivery, a payment gateway or a deployment.

## Local development

Use Node/npm with the checked-in lockfile and an isolated local PostgreSQL database:

```bash
npm ci
npm run dev:local
```

Copy `.env.example` to `.env`, replace the two database URLs with uniquely named local databases, and set a local-only `BETTER_AUTH_SECRET` of at least 32 characters. Apply the checked-in migration with `npm run db:migrate:deploy`; do not point either URL at shared, staging, or production data. `npm run test:integration` refuses a test database that is not named `sukoon_s02_test_*`.

Open [http://localhost:3100](http://localhost:3100). The first screen requests an email OTP. In local development the OTP is delivered to the in-memory sandbox mailbox and shown only through the explicitly local sign-in affordance; no password or sample property data is created. Better Auth owns the HTTP-only session cookie and persisted session row.

Domain state and document metadata are stored in PostgreSQL. Only local uploaded bytes are written to `.data/`, which is ignored by Git. To use a disposable object-byte location instead:

```bash
SUKOON_DATA_DIR=/tmp/sukoon-local-test npm run dev:local -- --port 3100
```

Do not point the database or local byte adapter at shared, staging, or production data. Do not use real property papers in fixtures. Signature checking is not malware scanning. `GET /api/health` reports redacted provider capability state. Local/test storage, unavailable scanner/OCR adapters, fixture AI and the sandbox mailbox are explicit development adapters; production configuration fails closed unless every provider binding is remote. Production email transport, object storage, scanning, OCR, worker operations, AI, reminder, staging, and deployment gates remain open.

## Checks

```bash
npm run lint
npm run typecheck
npm run db:status
npm run test:unit
npm run test:integration
npm run test:auth
npm run test:authorization
npm run build
npm run verify
```

`npm run test:integration` uses an isolated PostgreSQL database: 10 files / 63 tests, including the existing 46 OWN regressions and 17 Construction tests. Unit tests: 2 files / 6 tests. `npm run test:auth` and `npm run test:authorization` each run 1 focused test. Run Construction alone with `npm run test:integration -- tests/integration/construction.test.ts`. Do not run database-mutating suites simultaneously against the same test database. There are 13 checked-in migrations. See `docs/SUKOON_AUDIT_REPORT.md`, `docs/SUKOON_REMAINING_WORK.md`, `docs/evidence/S02.md`–`S22.md` and `docs/evidence/CONSTRUCTION.md`. Build still warns about the two existing development filesystem tracing boundaries; npm reports four high advisories, with no forced fix applied.

## Construction OS

Open [Construction](http://localhost:3100/construction), choose **Start a Construction Project**, select an existing owned Property Passport, and enter type, built-up area, floors, neutral quality, target budget and dates. A persisted 17-stage conceptual roadmap is created. The project page has Overview, Plan, Budget, Materials, Documents, Updates, People, Timeline and Handover tabs. Property Passport links back to its projects.

Estimates remain separate from actual canonical ledger spend. Invoices/payments are linked without duplicate payment effects. Materials, entered rate history, procurement status and contacts are manual-first; the pricing provider is unavailable. Vault/checklist states never imply government approval. Explicit S18 construction scopes can share plans and updates with an architect without exposing budgets or payments. The assistant answers structured recorded facts without a live model.

See [Construction architecture and accounting](docs/CONSTRUCTION_OS.md), [foundation evidence](docs/evidence/CONSTRUCTION.md), and [current browser acceptance and walkthrough](docs/CONSTRUCTION_ACCEPTANCE.md). Direct manual expenses now support audited owner correction/reversal; linked payments are reversed only in Bills. Run `npm run worker:local` alongside `npm run dev:local` for persisted in-app reminders and honest document-provider states. Local completion does not claim production readiness.

## Product boundary

The current home categories are Vault, Construction, Buy / Sell, and Updates. The 2026-09-12 approved Construction foundation supersedes the former future-only placeholder. Construction marketplace, live material rates, verified professionals, supplier ordering, public Buy / Sell listings, guideline/circle rates, government connectors, payment checkout and media remain deferred until explicit scope/provider/content approvals. S23–S30 are not implemented by this expansion.
