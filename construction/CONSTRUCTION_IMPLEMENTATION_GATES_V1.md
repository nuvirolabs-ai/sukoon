# CONSTRUCTION IMPLEMENTATION GATES V1

Status: CANONICAL  
Purpose: Safe execution order for implementing Construction OS in Sukoon V1 and V2.

## 1. Do not begin with a rewrite

Audit current Construction implementation against:

1. `CONSTRUCTION_OS_CORE_V1.md`
2. `CONSTRUCTION_EVENTS_GUIDANCE_V1.md`
3. `CONSTRUCTION_AB_SCENARIO_V1.md`
4. `CONSTRUCTION_EXPERIENCE_CONTRACT_V1.md`

First deliverable: gap matrix.

Required columns:
```text
Capability
Current V1 status
Current V2 status
Existing code/data model
Canonical target
Gap
Migration needed?
API change needed?
Security impact?
Recommended action
```

Statuses:
```text
EXISTING
PARTIAL
MISSING
NEEDS_MIGRATION
NEEDS_REFACTOR
DEFERRED
```

Map existing concepts before deciding something is missing.

## 2. Preserve A/B boundaries

### V1 control
```text
Source:
/Users/tanutejas/Documents/Sukoon

App:
Sukoon

Package:
com.nuvirolabs.sukoon

Public:
HTTPS 443 → 127.0.0.1:3110
```

### V2 challenger
```text
Source:
/Users/tanutejas/Documents/Sukoon-Gemini-V2

App:
Sukoon Preview

Package:
com.nuvirolabs.sukoon.preview

Public:
HTTPS 8443 → 127.0.0.1:3125
```

Do not collapse the apps into one presentation.

Respect established DB/storage/session isolation.

## 3. Gate A — Repo audit

Before schema changes locate:

1. Construction models/tables.
2. Migrations.
3. APIs/routes.
4. authorization/capabilities.
5. worker jobs.
6. events/activity infrastructure.
7. document/context-link mechanism.
8. budget/cost/material/contact/update/handover implementation.
9. tests.
10. V1/V2 divergences.

No implementation until gap matrix exists and is internally checked.

## 4. Gate B — Domain delta

Implement only missing/partial delta.

Audit deeply:
```text
dependencies
decisions
issues
inspections
changes
commitments
supplier quotes
orders
deliveries
event coverage
guidance
handover depth
```

Do not replace sound existing:
```text
project
stages
tasks
budget
cost
materials
contacts
updates
document links
```

## 5. Gate C — Schema/migration safety

If schema changes are required:

1. Prefer additive/backward-compatible migrations.
2. Do not reset V1.
3. Do not rewrite history.
4. Preserve API compatibility until both apps migrate.
5. Test migration on isolated test DB.
6. Verify operational rollback/recovery approach.
7. Bring isolated V1/V2 DBs to equivalent schema before A/B.

Destructive migration requires explicit owner approval.

## 6. Gate D — Event coverage

Before Guidance Engine, implement/verify durable events for at least:

```text
DECISION_REQUESTED
DECISION_RECORDED
WORK_ITEM_BLOCKED
DEPENDENCY_SATISFIED
DELIVERY_SHORTAGE_RECORDED
INSPECTION_RECORDED
CHANGE_APPROVED
SITE_UPDATE_ADDED
CONSTRUCTION_EXPENSE_RECORDED
COMMITMENT_CREATED
CONSTRUCTION_DOCUMENT_VERSION_CHANGED
```

Events must be authorized, auditable, and schema-validated.

## 7. Gate E — Guidance Engine

Implement deterministic guidance before Construction home redesign.

Required:
```text
GuidanceItem persistence/read model
idempotent relevanceKey
rule evaluation
resolution
provenance
role projection
tests
```

Required scenario rules:
```text
blocking electrical-layout decision
contractor invoice review
cement shortage
inspection tomorrow
latest site photos
upcoming steel requirement if seeded
new structural drawing if workflow applies
```

No UI-hardcoded alerts.

## 8. Gate F — Canonical seed

Implement `CONSTRUCTION_AB_V1`.

Requirements:
- semantic manifest;
- relative dates;
- equivalent V1/V2 facts;
- no real data;
- safe scoped reset/reseed;
- no copied sessions/private docs;
- real processing where scan evidence is required;
- semantic checksum.

No A/B testing until parity passes.

## 9. Gate G — Engine acceptance

Before UI work prove:

1. Stage/milestone derives correctly.
2. Dependencies block/unblock correctly.
3. Decision approval resolves blocking guidance.
4. Delivery shortage emits event/guidance.
5. Inspection guidance resolves after inspection.
6. Approved Change affects change accounting.
7. Site update produces history/FYI.
8. Commitments and expenses remain distinct.
9. Document links resolve to protected Vault records.
10. Unauthorized users cannot access/mutate Construction data.

## 10. Gate H — V1 experience

Implement complete Construction OS in V1 control.

Suggested surfaces:
```text
Overview
Plan
Money
Site
More
```

Preserve existing working functionality.

Run full V1 regressions before V2 UI integration.

## 11. Gate I — V2 experience

Implement same capabilities in V2 without importing V1 consumer presentation.

V2 remains:
```text
guidance-first
narrative
progressively disclosed
low cognitive load
```

Functional parity is mandatory.

## 12. Gate J — Semantic parity

Using reset `CONSTRUCTION_AB_V1`, verify equivalent truth:

```text
same stage
same milestone
same decisions
same issues
same money facts
same deliveries
same inspection state
same change impacts
same site updates
same guidance
same document/evidence availability
```

Formatting/layout may differ.

## 13. Gate K — Physical A/B

Install both apps and run scenario tasks.

Capture:
```text
V1 screenshots/recording
V2 screenshots/recording
task timings
wrong taps
backtracks
help requests
misunderstandings
```

Do not declare a winner automatically.

## 14. Automated testing requirements

Cover:
```text
domain state machines
dependency graph
decision lifecycle
issue lifecycle
change lifecycle
inspection lifecycle
money calculations
commitment vs actual
delivery shortage
event emission
guidance idempotency
guidance resolution
guidance authorization
role projections
document-link authorization
handover
A/B seed parity
V1 regression
V2 regression
cross-boundary isolation
```

Do not weaken tests to fit implementation.

## 15. Performance

Moto e13 remains a target.

Avoid:
```text
continuous heavy animation
huge dependency graphs rendered client-side
eager full-history photo grids
expensive blur/shadows
huge client bundles
```

Use lazy loading/pagination as needed.

## 16. Security/truth

Never:
- infer engineering approval;
- infer legal compliance;
- infer authenticity;
- expose private documents;
- bypass auth;
- let UI role replace authorization;
- mix V1/V2 data accidentally;
- let workers consume wrong-environment queues.

## 17. Deferred-feature guard

If work drifts toward:
```text
marketplace
contractor bidding
IoT
BIM
AI vision
automatic legal verification
online payments
payroll
```
stop and return to Core 1.0.

## 18. Required implementation reporting

After each gate:
```text
Gate
Changes
Tests
Data/migration impact
V1 impact
V2 impact
Security impact
Known blockers
Next gate
```

Final:
```text
DOMAIN PARITY: YES/NO
CONSTRUCTION_AB_V1 PARITY: YES/NO
GUIDANCE ENGINE: YES/NO
V1 COMPLETE: YES/NO
V2 COMPLETE: YES/NO
PHYSICAL A/B READY: YES/NO
DEFERRED ITEMS: list
```
