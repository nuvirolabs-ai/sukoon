# 06 — Source baseline and explicit decisions

## 1. What was actually inspected

Read-only GitHub checks during preparation on 2026-09-23 resolved:

- Repository: `nuvirolabs-ai/sukoon`.
- Branch: `codex/sukoon-render-demo-staging`.
- Branch head: `bc9ad91a509c9da3849c7d33eaff584493201d88`.

The local Mac folder, current Render environment, authenticated live app, database rows and phone were **not** inspected during preparation of this pack. Do not mistake this document for live acceptance.

## 2. Source-confirmed findings

### 2.1 Package scripts

`package.json` contains:

- `demo:enrich:staging`, guarded for staging and the existing enrichment namespace.
- `seed:construction-ab`, explicitly local with `.data`.
- Existing local/staging workers, migration commands and verify scripts.

Source:
https://github.com/nuvirolabs-ai/sukoon/blob/bc9ad91a509c9da3849c7d33eaff584493201d88/package.json

A local-only command must not be repurposed for hosted data by removing its guard.

### 2.2 Existing enrichment is not a missing-project bootstrap

`lib/demo-enrichment.ts`:

- Requires the existing review user/workspace and named property set.
- Uses a fixed existing scenario anchor `2026-09-22`.
- Finds `Mehta Residence`; if absent appends `construction:Mehta Residence_missing` and skips its construction block.
- Can write other categories before reaching that check.
- Adds selected Construction history/updates and typed actions only when the project exists.
- Does not create document or version rows in its enrichment plan.

Source:
https://github.com/nuvirolabs-ai/sukoon/blob/bc9ad91a509c9da3849c7d33eaff584493201d88/lib/demo-enrichment.ts

This supports a possible explanation for an empty hosted project, not a verified live diagnosis.

### 2.3 Existing seed is not identical to the earlier Construction scenario

The inspected enrichment includes alternative values and state choices: a 7.2-tonne steel entry, flooring-impact payloads of `175000` under paise-named keys, and hard-coded October dates. It also writes a purchase question answer event whose note says the response is still awaited.

These are reasons to audit actual parsers, states and existing data before rerunning. Do not assume all seeded values implement the earlier 2.8-tonne / ₹1.82L / unanswered-question story. Do not silently "correct" existing financial history. Treat reported-source notes as notes, not authenticated counterparty actions.

### 2.4 Current purchase domain is a foundation, not the full requested module

`lib/purchases.ts` implements workspace creation, candidate creation/edit, private snapshots, and QUESTION/NOTE/DOCUMENT_REQUEST entries. It includes server authorization, request keys, version checks and rupee-to-paise parsing.

`lib/purchase-stages.ts` currently defines:

`CONSIDERING`, `INFORMATION_GATHERING`, `REVIEWING`, `ON_HOLD`, `NOT_PROCEEDING`.

Sources:
https://github.com/nuvirolabs-ai/sukoon/blob/bc9ad91a509c9da3849c7d33eaff584493201d88/lib/purchases.ts

https://github.com/nuvirolabs-ai/sukoon/blob/bc9ad91a509c9da3849c7d33eaff584493201d88/lib/purchase-stages.ts

Structured seller, offer, terms, financing and handover workflows in this pack are requirements to map/implement, not capabilities claimed verified by these files.

### 2.5 Evidence and import boundaries already matter

`lib/purchase-evidence.ts` distinguishes document requests and questions. RECEIVE/REVIEW need a document version; REVIEW needs prior receipt of that version. Non-receipt use of a version requires clean scan and confirmed review under the current implementation. Sources distinguish BUYER_UPLOADED, BUYER_REPORTED_SELLER and USER_NOTE.

`lib/purchase-import.ts` copies the same principal's own candidate versions into their own existing Passport, with explicit confirmation, source lineage and fresh destination scan. It does not transfer seller ownership, grant access or copy another owner's private records.

Sources:
https://github.com/nuvirolabs-ai/sukoon/blob/bc9ad91a509c9da3849c7d33eaff584493201d88/lib/purchase-evidence.ts

https://github.com/nuvirolabs-ai/sukoon/blob/bc9ad91a509c9da3849c7d33eaff584493201d88/lib/purchase-import.ts

Preserve these boundaries. Extending Buy/Sell is not permission to replace them with a simulated success screen.

## 3. Context supplied by the user, not freshly verified here

- V1 only; V2 frozen until V1 is coherent.
- Construction engine and V1.2 visual work were reported implemented.
- Last hosted model: existing Singapore Render Web + Postgres + Worker, with storage/scanner/SMTP deferred and separate staging review auth.
- Existing hosted URL: `https://demo.sukoonproptech.com`.
- Last reported review account: `akshay-review@sukoon.local`.
- Hosted enrichment had not been confirmed executed in the last pasted report.
- Prior broad seeding encountered a payment idempotency conflict; do not bypass it.

The implementer must freshly confirm these before writes.

## 4. Product decisions made explicit in this pack

1. Diagnose Construction visibility before inserting anything.
2. A missing synthetic project may be created through a scoped bootstrap; the full workspace must not be reset.
3. The current old enrichment namespace is immutable. New incompatible population logic uses a new scoped version and conflict detection, not reused keys with new payloads.
4. Preserve existing actual data rather than forcing illustrative totals or progress.
5. Build both buyer and seller private workflows; public property listings are out of scope.
6. Add genuine typed negotiation/money/lifecycle behavior rather than treating notes as equivalent.
7. Multi-party cooperation has explicit minimal scopes; actual hosted recipient auth remains a distinct gate.
8. Existing documents-disabled hosting remains unchanged. No ghost evidence or paid resources.
9. UI uses the same APIs for demo and normal users; only synthetic accounts receive seeded data.
10. Source completion is separate from hosted deployment, data execution, authenticated UI and physical-device proof.

These are proposed task requirements, not claims about Indian property law or the current production capability of Sukoon.
