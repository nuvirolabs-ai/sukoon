# Sukoon V1 — Construction demo + Buy/Sell implementation pack

Prepared: 2026-09-23. This is a specification and agent handoff, not a report of deployed changes.

## Outcome

1. The existing V1 Construction/Build area must display a coherent, populated, interactive construction project in the **actual hosted review account**.
2. Buy/Sell must become a usable buyer-and-seller transaction organizer, not a property portal mockup or a collection of notes disguised as completed workflows.
3. Preserve the current V1 Construction visual design and all working product behavior. V2 is frozen.

## Installation and reading order

Place this entire folder at:

`/Users/tanutejas/Documents/Sukoon/docs/grok-v1/`

Read:

1. `01_CONSTRUCTION_POPULATION_AND_VISIBILITY.md`
2. `02_BUY_SELL_PRODUCT_AND_EXPERIENCE.md`
3. `03_TRANSACTION_ENGINE_ACCESS_AND_GUIDANCE.md`
4. `04_SCENARIOS_AND_ACCEPTANCE.md`
5. `05_EXECUTION_AND_DEPLOYMENT.md`
6. `06_SOURCE_BASELINE_AND_DECISIONS.md`

Then use `GROK_START_HERE.md` as the agent prompt.

## Authority and limits

The user's current scope is V1 only. These documents supplement the established Construction specifications; they do not authorize a Construction rewrite. Buy/Sell requirements below are the proposed implementation contract consolidated from the product discussion. New endpoint/table names are conceptual until the agent maps them to the repository.

Preserve security, authorization, accounting, exact document-version provenance, privacy, and existing data. Older instructions to implement both V1 and V2 are superseded for this task. This pack does not override system/tool restrictions or turn unavailable provider features into available ones.

Forwarding the prompt gives the implementer a bounded development task. It does not authorize new paid resources, real-user invitations, destructive database operations, public listings, financial transfers, or legal conclusions. Any required permissions must come through the available tools and owner authorization, not assumptions in a document.

## Target identity: verify, do not assume current availability

| Item | Expected target from the last reported checkpoint |
|---|---|
| V1 source | `/Users/tanutejas/Documents/Sukoon` |
| GitHub repository | `nuvirolabs-ai/sukoon` |
| Deployment branch | `codex/sukoon-render-demo-staging` |
| Branch SHA read while preparing this pack | `bc9ad91a509c9da3849c7d33eaff584493201d88` |
| Existing web service | `sukoon-web` / `srv-damg370u01pc73a58l80` |
| Hosted URL | `https://demo.sukoonproptech.com` |
| Provider URL | `https://sukoon-web.onrender.com` |
| Staging database name | `sukoon_demo_staging` |
| Synthetic review account | `akshay-review@sukoon.local` |
| Android V1 package | `com.nuvirolabs.sukoon` |
| Frozen V2 folder | `/Users/tanutejas/Documents/Sukoon-Gemini-V2` |

The branch SHA is a source reference, not an instruction to downgrade a newer deployment. GitHub source does not prove what is deployed, seeded, or visible on the phone. Check all three separately.

## Hosted provider boundary

The last verified operating model is Web + Postgres + Worker. Hosted document storage, malware scanning, and SMTP were deliberately not provisioned. Staging uses its separate review sign-in, not the earlier Mac/Tailscale access-code configuration.

Recheck capability flags at execution time. If document storage/scanning remain unavailable:

- Complete database-backed Construction, buying, selling, questions, offers, schedules, and recorded transaction money.
- Leave new uploads, previews, copies, and imports requiring bytes explicitly unavailable.
- Do not generate ghost documents, clean scan statuses, evidence counts, or external-message delivery confirmations.
- Test real media/version workflows separately in a sanctioned isolated local environment with actual bytes and the existing scanner.
- Do not describe a metadata-only hosted review as full Vault or multi-party acceptance.

## Existing-record rule

Normal users start empty. Only the explicitly targeted synthetic review workspace may be populated. Do not seed all users or broaden data visibility to make the home screen look populated.

Check existing rows before inserting. Names are presentation labels, not sufficient ownership or deduplication keys. Preserve existing payments, inspection evidence, reviewed documents, handover snapshots, and reviewer/client edits. Existing project progress and money take precedence over illustrative targets when overwriting would alter established history.

## Completion language

Use separate statuses:

- Implemented in source.
- Locally verified.
- Deployed to the expected commit.
- Seed executed in the expected database/account.
- Authenticated hosted UI verified.
- Physical Android verified.
- Provider blocked.
- Not run.

A test not run is not PASS and is not evidence of a functional failure. A homepage HTTP 200 is not authenticated feature acceptance. A screenshot or agent task time is not an independent human usability study.
