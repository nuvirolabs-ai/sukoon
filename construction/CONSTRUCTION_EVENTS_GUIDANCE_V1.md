# CONSTRUCTION EVENTS & GUIDANCE V1

Status: CANONICAL  
Depends on: `CONSTRUCTION_OS_CORE_V1.md`

## 1. Principle

```text
STATE
  ↓
DOMAIN EVENT
  ↓
GUIDANCE REEVALUATION
  ↓
ACTIVE GUIDANCE
  ↓
OPTIONAL NOTIFICATION
```

Important guidance must not be independently invented inside screens.

## 2. Mutation pipeline

```text
Command
↓
Authorize
↓
Validate
↓
Persist domain state
↓
Write audit/activity
↓
Emit ConstructionEvent
↓
Reevaluate affected guidance
↓
Commit / durable dispatch
```

Reuse Sukoon's existing outbox/worker architecture where appropriate.

## 3. Event envelope

```text
id
projectId
eventType
actorId?
subjectType
subjectId
occurredAt
visibility
source
metadata
correlationId?
```

Metadata must be schema-validated. Do not store secrets or document bytes in events.

## 4. Canonical event catalog

### Project / plan
```text
CONSTRUCTION_PROJECT_CREATED
CONSTRUCTION_PROJECT_UPDATED
CONSTRUCTION_PROJECT_PAUSED
CONSTRUCTION_PROJECT_RESUMED
CONSTRUCTION_PROJECT_COMPLETED
PROJECT_PLAN_VERSION_CREATED
PROJECT_PLAN_VERSION_ACTIVATED
PROJECT_PLAN_VERSION_SUPERSEDED
```

### Stage / milestone / work
```text
CONSTRUCTION_STAGE_READY
CONSTRUCTION_STAGE_STARTED
CONSTRUCTION_STAGE_BLOCKED
CONSTRUCTION_STAGE_COMPLETED
MILESTONE_READY
MILESTONE_COMPLETED
WORK_ITEM_READY
WORK_ITEM_STARTED
WORK_ITEM_BLOCKED
WORK_ITEM_COMPLETED
WORK_ITEM_REOPENED
WORK_ITEM_CANCELLED
DEPENDENCY_SATISFIED
DEPENDENCY_UNSATISFIED
```

### Decisions
```text
DECISION_REQUESTED
DECISION_DUE_CHANGED
DECISION_DEFERRED
DECISION_RECORDED
DECISION_CANCELLED
```

### Issues
```text
ISSUE_OPENED
ISSUE_ASSIGNED
ISSUE_UPDATED
ISSUE_ACTION_REQUIRED
ISSUE_RESOLVED
ISSUE_REOPENED
ISSUE_CLOSED
```

### Inspections
```text
INSPECTION_RECORDED
INSPECTION_CONCERN_RECORDED
INSPECTION_RECHECK_REQUIRED
```

### Changes
```text
CHANGE_PROPOSED
CHANGE_IMPACT_RECORDED
CHANGE_AWAITING_DECISION
CHANGE_APPROVED
CHANGE_REJECTED
CHANGE_IMPLEMENTED
CHANGE_CANCELLED
```

### Site
```text
SITE_UPDATE_ADDED
SITE_PHOTOS_ADDED
```

### Money
```text
BUDGET_UPDATED
COMMITMENT_CREATED
COMMITMENT_UPDATED
COMMITMENT_FULFILLED
COMMITMENT_CANCELLED
CONSTRUCTION_EXPENSE_RECORDED
CONSTRUCTION_EXPENSE_REVERSED
COST_PROJECTION_CHANGED
```

### Materials / procurement
```text
MATERIAL_REQUIREMENT_CREATED
MATERIAL_REQUIREMENT_DUE_CHANGED
SUPPLIER_QUOTE_RECORDED
SUPPLIER_QUOTE_SELECTED
ORDER_PLACED
ORDER_CANCELLED
MATERIAL_DELIVERED
MATERIAL_PARTIALLY_DELIVERED
DELIVERY_SHORTAGE_RECORDED
DELIVERY_CONCERN_RECORDED
```

### People
```text
PROJECT_PERSON_INVITED
PROJECT_PERSON_JOINED
PROJECT_PERSON_ROLE_CHANGED
PROJECT_PERSON_ACCESS_CHANGED
PROJECT_PERSON_REMOVED
```

### Documents
```text
CONSTRUCTION_DOCUMENT_LINKED
CONSTRUCTION_DOCUMENT_UNLINKED
CONSTRUCTION_DOCUMENT_VERSION_CHANGED
```

### Handover
```text
HANDOVER_STARTED
SNAG_ITEM_OPENED
SNAG_ITEM_RESOLVED
HANDOVER_DOCUMENT_ADDED
HANDOVER_COMPLETED
```

## 5. Guidance classes

```text
BLOCKING
DECISION
DUE
EXCEPTION
FYI
```

Consumer UI does not need to expose enum names.

Priority:
```text
CRITICAL
HIGH
NORMAL
LOW
```

Use deterministic inputs such as dependency impact, due-date proximity, financial impact, severity, assignment, and current stage. No opaque ML score.

## 6. Guidance identity/idempotency

Conceptually:
```text
relevanceKey
= ruleKey
+ subjectType
+ subjectId
+ relevant state/version
```

Repeated evaluation updates an existing active item instead of duplicating it.

## 7. Guidance provenance

Persist enough to explain:
```text
ruleKey
evaluatedAt
subjectVersion
triggerFacts
sourceObjectIds
```

Operator/debug views may expose raw rule facts; normal users see human wording.

## 8. Core guidance rules

### G01 Blocking dependency
IF downstream work is planned/near and a required predecessor is incomplete, create BLOCKING guidance.

Example:
> Electrical layout needs approval.

Reason:
> Slab casting is recorded for Friday and conduit work depends on this decision.

### G02 Decision due
IF an OPEN decision is near due date, create DECISION/DUE guidance.

### G03 Work item blocked
IF work is BLOCKED, surface the recorded blocker where authorized. Never invent the reason.

### G04 Delivery shortage
IF expected quantity exists and received < expected:
> 10 cement bags were short.  
> 390 received against 400 recorded as ordered.

### G05 Inspection due
IF a recorded inspection/check date is approaching and incomplete:
> Reinforcement inspection is tomorrow.

### G06 Inspection concern
IF result is `CONCERN_RECORDED` or `RECHECK_REQUIRED`, create EXCEPTION guidance using scoped wording.

### G07 Open issue affecting current stage
Surface non-terminal issues relevant to current/next work based on severity and relevance.

### G08 Approved change with cost impact
> Flooring upgrade changed the approved project cost by ₹1.82L.

Use exact stored impact only.

### G09 Approved change with schedule impact
> Flooring change adds 3 recorded days to the plan.

Do not infer actual delay.

### G10 Invoice/owner review
If the domain records an invoice/action needing owner review:
> Contractor invoice needs review.

Do not imply payment due unless explicitly recorded.

### G11 Commitment due
Surface outstanding active commitments near their recorded expected date.

### G12 Material required soon
> Steel is needed soon.  
> 2.8 tonnes are recorded as required before [date].

### G13 Linked drawing/document version changed
> A newer structural drawing is available.

Require re-review only if explicit workflow/dependency says so.

### G14 Site update FYI
> Architect added 6 site photos yesterday.

Usually no push by itself.

### G15 Budget threshold
If exact approved budget/commitment/spend rules cross a configured threshold:
> Recorded spend and commitments are above the approved amount for [category].

### G16 Handover open items
> 2 handover items are still open.

### G17 Missing handover evidence
Only for configured/reviewed requirements:
> Electrical layout has not been added to the handover record.

"Not added" is not "does not exist."

## 9. Guidance resolution

States:
```text
ACTIVE
RESOLVED
EXPIRED
DISMISSED
```

`DISMISSED` does not mean underlying state is fixed. Critical/blocking guidance may be non-dismissible.

## 10. Guidance action types

```text
OPEN_DECISION
OPEN_WORK_ITEM
OPEN_ISSUE
OPEN_INSPECTION
OPEN_DOCUMENT
OPEN_MONEY_RECORD
OPEN_DELIVERY
OPEN_SITE_UPDATE
OPEN_PROJECT_STAGE
OPEN_HANDOVER
NONE
```

Actions must navigate only to authorized objects.

## 11. Role projections

Same facts, different projections.

Owner:
> Electrical layout needs your approval before Friday.

Architect:
> Electrical layout awaiting owner approval. Slab preparation remains blocked.

Contractor:
> Conduit work cannot complete until electrical layout is approved.

Project manager:
> 1 blocking decision affecting Friday slab milestone.

## 12. Acceptance criteria

1. Guidance comes from stored state, not hardcoded UI.
2. Re-evaluation does not duplicate active items.
3. Resolving underlying state resolves guidance.
4. Provenance explains trigger.
5. Role changes projection, not truth.
6. Unauthorized facts never appear.
7. Equivalent `CONSTRUCTION_AB_V1` state yields equivalent guidance in V1 and V2.
