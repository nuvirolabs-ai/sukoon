# Synthetic staging demo enrichment

## Intent

Add a second, additive demo-data layer to the existing synthetic Akshay
staging workspace. The layer is named `SUKOON_DEMO_ENRICHMENT_V1`, is
staging-only, and makes the existing three properties feel used over roughly
the previous ten months without changing the baseline seed, owner identity,
payment history, documents, scan results, authorization, or provider state.

This is demonstration data, not evidence of legal, government, payment,
malware, OCR, AI, or external-provider activity.

## Safety boundary

- The command is enabled only when `APP_ENV=staging`, `NODE_ENV=production`,
  `SUKOON_RUNTIME_PROFILE=STAGING`, the database name is exactly
  `sukoon_demo_staging`, and `SUKOON_DEMO_ENRICHMENT_CONFIRMATION` equals the
  namespace.
- It resolves the existing owner by the configured staging review email and
  requires the three named baseline properties. It never creates a user or a
  replacement property.
- Every created row has a deterministic ID where the model permits one and a
  namespaced idempotency/request key where the model supports it. Existing
  rows are never overwritten; a same-key conflict is reported and skipped.
- The executor never touches `PropertyDoc`, `DocumentVersion`, scan evidence,
  OCR/AI rows, storage bytes, sessions, verification records, or provider
  configuration.
- New obligations and payments use the existing domain functions, including
  integer-paise validation, payment idempotency, ledger entries, occurrence
  status, and reminder reconciliation. Existing payment rows are read for
  reporting only.
- Construction active objects use the existing versioned command pipeline so
  audit events and guidance reevaluation remain domain-derived. Historical
  Construction events and timeline rows are append-only synthetic records.
- Sharing is not expanded by this slice: the already seeded synthetic shares
  remain the source of the People/Sharing view. No message or invitation is
  sent.

## Data shape

The plan is anchored to the first run's date and uses relative dates from
approximately ten months in the past through sixty days in the future. It
creates a bounded set of records:

- monthly electricity and several water records, with mostly recorded
  payments, one late payment, one current unpaid item, and one partial annual
  property-tax payment;
- recurring society/maintenance and insurance reminders;
- 5–8 maintenance records with completed, resolved, in-progress, planned,
  cancelled, and upcoming states;
- property and cross-domain timeline entries spread through the date range;
- Construction history, recent site updates, a pending decision, a shortage,
  an inspection needing follow-up, a contractor/payment review, active steel
  procurement, and one approved change with an explicit synthetic impact;
- an additive purchase discussion history on the existing candidate, including
  non-binding offers/counter-offer notes, questions, evidence requests, a
  professional-review note, financing stage, and a future action.

All purchase discussion notes explicitly say they are recorded synthetic
discussion and not legal or government verification. No purchase document is
created because hosted storage/scanning is unavailable.

## Test and acceptance shape

Pure tests cover namespace stability, date planning, counts, no-document
invariant, and status distribution. An isolated PostgreSQL integration test
creates only a minimal existing Akshay-like workspace, runs the executor twice,
asserts equal namespaced counts and unchanged baseline payment/document rows,
and checks that missing baseline properties fail closed. The script output is
sanitized and reports counts/date range/conflicts without secrets.

Local verification runs lint, typecheck, focused unit/integration tests,
production build, and `git diff --check`. Hosted execution is a separate,
explicit staging command and is accepted only against `sukoon_demo_staging`.
