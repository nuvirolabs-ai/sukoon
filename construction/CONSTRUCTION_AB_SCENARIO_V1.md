# CONSTRUCTION A/B SCENARIO V1

Status: CANONICAL  
Scenario ID: `CONSTRUCTION_AB_V1`

## 1. Purpose

V1 and V2 must be compared using the same construction facts:

```text
same construction state
+ same active guidance
+ same available actions
+ different experience
= meaningful A/B comparison
```

Runtime-generated UUIDs, timestamps, event IDs, scan IDs, storage keys, and job IDs do not need to match.

## 2. Scenario clock

Use a seed-time anchor:

```text
T0 = scenario seed time
```

Canonical relative dates:

```text
latest site update = T0 - 1 day
inspection = T0 + 1 day
slab casting = T0 + 4 days
material requirement = T0 + 8 days
```

The app renders the resulting real local dates.

## 3. Property and project

```text
Property:
Super Corridor Plot

Project:
Mehta Residence

Project type:
New construction

Status:
ACTIVE

Base planned budget:
₹1.20Cr

Recorded spend:
₹26.90L

Current stage:
RCC / Structure

Current milestone:
First-floor slab
```

These facts must be seeded into the domain layer, not hardcoded into V1/V2 consumer components.

## 4. Team

Seed synthetic personas:

```text
Owner:
Aarav Mehta

Architect:
Ankit Shah

Structural Engineer:
Neha Kulkarni

Contractor:
Ravi Buildcon

Project Manager:
synthetic project-manager persona where useful
```

No real person data.

## 5. Current work state

Completed/recorded:
```text
Foundation completed
Plinth completed
Ground-floor RCC completed
Beam reinforcement for first-floor slab completed
```

In progress:
```text
Electrical conduit preparation
Slab reinforcement preparation
```

Planned:
```text
Reinforcement inspection: T0 + 1 day
Slab casting: T0 + 4 days
```

Slab casting depends on:
```text
electrical layout decision
electrical conduit completion
reinforcement inspection
```

## 6. Blocking decision

```text
Title:
Electrical layout approval

Requested by:
Architect

Assigned to:
Owner

Due:
before slab casting

Status:
OPEN
```

Expected guidance:
```text
BLOCKING
Electrical layout needs approval.

Reason:
Slab casting is recorded for [date] and conduit work depends on this decision.
```

## 7. Contractor invoice review

Seed:
```text
Record:
Contractor invoice / owner review

Amount:
₹2.40L

Status:
awaiting owner review/confirmation according to existing domain semantics
```

Expected guidance:
```text
DECISION or DUE
Contractor invoice needs review.
₹2.40L recorded.
```

Do not fabricate a payable/payment-provider state.

## 8. Delivery shortage

Order:
```text
Material:
Cement

Ordered:
400 bags
```

Delivery:
```text
Received:
390 bags

When:
T0
```

Expected shortage:
```text
10 bags
```

Expected event:
```text
DELIVERY_SHORTAGE_RECORDED
```

Expected guidance:
> 10 cement bags were short.  
> 390 received against 400 recorded as ordered.

## 9. Approved change

```text
Change:
Bedroom flooring upgrade

Original:
₹120/sq ft

Revised:
₹190/sq ft

Status:
APPROVED

Estimated cost impact:
+₹1.82L

Estimated schedule impact:
+3 days
```

Expected money explanation:
```text
Approved change delta includes +₹1.82L.
```

Expected FYI:
> Flooring upgrade changed the approved project cost by ₹1.82L.

Do not state actual cost impact unless actual cost is recorded.

## 10. Site update

At:
```text
T0 - 1 day
```

Summary:
```text
Beam reinforcement completed.
Electrical conduit work started.
```

Photos:
```text
6 synthetic site-photo references
```

Optional note:
```text
Rain delayed morning work by two hours.
```

Expected guidance:
> 6 site photos were added yesterday.

## 11. Inspection

```text
Inspection:
Reinforcement inspection

Scheduled:
T0 + 1 day

Status:
not yet completed/recorded
```

Expected guidance:
> Reinforcement inspection is tomorrow.

## 12. Material requirement

```text
Material:
TMT / steel

Required quantity:
2.8 tonnes

Required by:
T0 + 8 days

Last recorded reference rate:
₹60,500 / tonne

Status:
PLANNED or QUOTING
```

Optional synthetic quotes:
```text
Supplier A
₹60,200/t
delivery tomorrow

Supplier B
₹59,800/t
delivery in 3 days

Supplier C
₹61,000/t
delivery today
```

These are seeded quotes, not live market-rate claims.

## 13. Structural drawing

Seed:
```text
Document:
Structural Drawing

Context:
RCC / Structure → First-floor slab

State:
newer revision available
```

Possible guidance:
> A newer structural drawing is available.

Require re-review only if the workflow explicitly says so.

## 14. Expected active guidance order

At minimum:

1. BLOCKING — Electrical layout needs approval.
2. DECISION/DUE — Contractor invoice needs review.
3. EXCEPTION — 10 cement bags were short.
4. DUE — Reinforcement inspection is tomorrow.
5. FYI — 6 site photos were added yesterday.

Optional:
- Steel is needed soon.
- A newer structural drawing is available.

Ordering among same-priority items must be deterministic.

## 15. Expected project summary

The engine should derive a factual summary equivalent to:

```text
Project:
Mehta Residence

Current stage:
RCC / Structure

Current milestone:
First-floor slab

Owner attention:
at least 2 actionable items

Recorded spend:
₹26.90L

Base planned budget:
₹1.20Cr
```

No UI hardcoding.

## 16. Semantic manifest

Create a canonical semantic manifest containing stable facts:

```text
scenarioId
property semantic identity
project semantic identity
budget facts
stage/milestone
work states
decision facts
delivery/issue facts
change facts
inspection facts
material facts
site-update facts
document semantic identities
expected guidance rule keys
```

Exclude:
```text
UUIDs
session IDs
event IDs
job IDs
scan timestamps
storage keys
idempotency keys
createdAt values
worker IDs
```

The checksum proves semantic parity, not byte-identical databases.

## 17. Reset behavior

A/B reset must:
- restore canonical scenario;
- remove prior A/B mutations within explicit scenario scope;
- preserve V1/V2 environment isolation;
- never reset unrelated users/projects.

## 18. A/B tester tasks

Perform the same tasks in V1 and V2:

1. Tell me where the project stands.
2. Find what needs attention before slab casting.
3. Understand why slab casting may be blocked.
4. Review the contractor invoice.
5. Find the cement shortage.
6. Find the six latest site photos.
7. Understand how the flooring change affected the project.
8. Find tomorrow's inspection.
9. Find the structural drawing.
10. Find the upcoming steel requirement.

Record:
```text
task completion
time
wrong taps
backtracks
help/questions
missed guidance
misunderstood terminology
confidence
```

Do not tell the tester which app is expected to be better.
