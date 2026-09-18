# CONSTRUCTION OS CORE V1

Status: CANONICAL  
Scope: Shared Construction engine for Sukoon V1 (control) and Sukoon V2 / Sukoon Preview (challenger)  
Scenario family: `CONSTRUCTION_AB_V1`  
Principle: **One construction engine, two different experiences.**

## 1. Product promise

Construction OS should answer six questions at any moment:

1. Where is my build right now?
2. What happened recently?
3. What needs my attention?
4. What happens next?
5. What is this costing me?
6. Where is the evidence?

The backend may contain detailed stages, tasks, dependencies, money records, materials, inspections, documents, people, events, and guidance. A normal homeowner should not need to understand that complexity.

> **Sukoon tells me where my construction stands, what changed, what needs me, what happens next, and what it is costing me.**

Construction OS is not primarily a task manager, accounting system, file manager, marketplace, or contractor ERP. It is a stateful digital representation of a physical build.

## 2. Core principles

### 2.1 Property remains the root object
Every construction project belongs to a property. Core 1.0 is optimized for new construction while remaining extensible to renovation, extension, and major repair.

### 2.2 Never ask for context Sukoon already knows
If an action begins inside a project, stage, work item, invoice, material need, or document, carry that context forward.

### 2.3 Keep domain concepts distinct
- `WorkItem` = planned work.
- `Issue` = problem/exception.
- `DecisionRequest` = choice/approval required.
- `Change` = deviation from original scope/budget/schedule/specification.
- `Inspection` = recorded check.
- `SiteUpdate` = what happened at site.

### 2.4 Events, guidance, and notifications are different
- Event = something happened.
- Guidance = what that state/event means now.
- Notification = optional delivery mechanism.

### 2.5 Truth over reassurance
Never turn:
- clean malware scan into authenticity;
- inspection record into certification;
- owner-entered statement into verification;
- estimate into guaranteed cost;
- plan into engineering approval.

### 2.6 Guidance is deterministic first
Guidance is derived from stored facts, dependencies, dates, decisions, issues, money, and rules. An LLM may later explain guidance, but it does not decide whether guidance exists.

## 3. Canonical lifecycle

```text
PROJECT SETUP
    ↓
TEAM
    ↓
DESIGN
    ↓
PRE-CONSTRUCTION READINESS
    ↓
PLAN
    ↓
SITE EXECUTION
    ↓
FINISHING
    ↓
HANDOVER
    ↓
PERMANENT PROPERTY PASSPORT
```

The lifecycle is not a universal legal workflow. Stages may be reopened or changed through explicit plan history.

## 4. Canonical domain objects

Implementation should map these concepts onto existing Sukoon models where possible instead of duplicating working domain logic.

### 4.1 ConstructionProject
Fields:
```text
id
propertyId
projectType
name
status
timezone
currency
builtUpArea?
floorCount?
plannedStartDate?
actualStartDate?
targetCompletionDate?
actualCompletionDate?
basePlannedBudget?
currentPlanVersionId?
createdAt
updatedAt
archivedAt?
```

Suggested statuses:
```text
DRAFT
PLANNING
ACTIVE
PAUSED
HANDOVER
COMPLETED
ARCHIVED
```

Invariants:
- belongs to an authorized property;
- completion preserves history;
- archive is not deletion;
- project status does not replace stage/work-item state.

### 4.2 ProjectPlanVersion
```text
id
projectId
versionNumber
label?
status
createdBy
createdAt
activatedAt?
supersededAt?
notes?
```
States:
```text
DRAFT
ACTIVE
SUPERSEDED
ARCHIVED
```
At most one ACTIVE version per project.

### 4.3 Stage
Represents a meaningful phase such as Foundation, RCC/Structure, Masonry, Electrical & Plumbing, Finishing, Handover. These are examples, not universal mandatory stages.

```text
id
planVersionId
name
sequence
status
plannedStart?
plannedEnd?
actualStart?
actualEnd?
summary?
```

States:
```text
PLANNED
READY
IN_PROGRESS
BLOCKED
DONE
SKIPPED
CANCELLED
```

### 4.4 Milestone
Outcome-oriented checkpoint such as first-floor slab completed.

```text
id
stageId
name
status
plannedDate?
actualDate?
description?
```

### 4.5 WorkItem
```text
id
stageId
milestoneId?
title
description?
status
priority?
responsiblePersonId?
plannedStart?
plannedEnd?
actualStart?
actualEnd?
estimatedCost?
sequence?
createdBy
createdAt
updatedAt
```

State machine:
```text
PLANNED
  ↓ dependencies satisfied
READY
  ↓ work begins
IN_PROGRESS
  ↓
DONE
```
Any non-terminal state may become `BLOCKED`. `PLANNED`, `READY`, or `IN_PROGRESS` may become `CANCELLED`.

Rules:
- READY means dependencies are satisfied.
- BLOCKED needs a reason or unresolved dependency.
- DONE does not imply professional certification.
- reopening DONE creates history/event evidence.

### 4.6 Dependency
```text
id
projectId
predecessorType
predecessorId
successorType
successorId
dependencyType
notes?
```

Initial dependency type:
```text
FINISH_TO_START
```

A dependency can connect work, milestones, decisions, inspections, or explicit evidence states where the existing domain safely supports it.

### 4.7 ProjectPerson
```text
id
projectId
userId?
displayName
roleTemplate
organization?
contactReference?
status
joinedAt?
leftAt?
```

Role templates:
```text
OWNER
ARCHITECT
STRUCTURAL_ENGINEER
CONTRACTOR
PROJECT_MANAGER
ELECTRICAL_CONSULTANT
PLUMBING_CONSULTANT
INTERIOR_DESIGNER
SUPPLIER
VIEWER
CUSTOM
```

Templates suggest capabilities; server authorization remains explicit.

### 4.8 DecisionRequest
```text
id
projectId
stageId?
workItemId?
requestedBy
assignedTo
title
context?
dueDate?
status
selectedOptionId?
decisionComment?
decidedAt?
createdAt
updatedAt
```

DecisionOption:
```text
id
decisionRequestId
label
description?
estimatedCostImpact?
estimatedScheduleImpactDays?
attachmentDocumentIds[]
```

States:
```text
OPEN
DECIDED
DEFERRED
CANCELLED
EXPIRED
```

A selected option may create/link a `Change`.

### 4.9 Issue
```text
id
projectId
stageId?
workItemId?
title
description
severity?
status
reportedBy
assignedTo?
reportedAt
costImpact?
scheduleImpactDays?
resolution?
resolvedAt?
attachmentDocumentIds[]
photoRefs[]
```

States:
```text
OPEN
INVESTIGATING
ACTION_REQUIRED
RESOLVED
CLOSED
```

### 4.10 Inspection
```text
id
projectId
stageId?
workItemId?
performedBy
performedAt
title
result
notes?
checklist?
issueIds[]
documentIds[]
photoRefs[]
```

Possible results:
```text
RECORDED
PASS_RECORDED
CONCERN_RECORDED
RECHECK_REQUIRED
```

Consumer copy must not overstate the inspection's legal/engineering meaning.

### 4.11 Change
```text
id
projectId
stageId?
title
reason
requestedBy
approvedBy?
status
originalScope?
revisedScope?
estimatedCostImpact?
actualCostImpact?
estimatedScheduleImpactDays?
actualScheduleImpactDays?
affectedWorkItemIds[]
documentIds[]
requestedAt
decidedAt?
```

States:
```text
PROPOSED
IMPACT_RECORDED
AWAITING_DECISION
APPROVED
REJECTED
IMPLEMENTED
CANCELLED
```

Changes explain why plan, money, or schedule moved.

### 4.12 SiteUpdate
```text
id
projectId
stageId?
createdBy
occurredOn
summary
workCompletedIds[]
issueIds[]
decisionRequestIds[]
deliveryIds[]
photoRefs[]
workerCount?
weatherNote?
notes?
createdAt
```

Keep creation lightweight; most structured fields remain optional.

### 4.13 BudgetCategory
```text
id
projectId
name
plannedAmount
sequence?
status
```

Example categories are configurable and not mandatory.

### 4.14 Commitment
Represents agreed/ordered future expenditure.

```text
id
projectId
budgetCategoryId
vendorOrPersonId?
title
amount
currency
status
committedAt
expectedBy?
sourceType?
sourceId?
notes?
```

States:
```text
DRAFT
ACTIVE
PARTIALLY_FULFILLED
FULFILLED
CANCELLED
```

### 4.15 Expense
Represents actual recorded cost.

```text
id
projectId
budgetCategoryId
commitmentId?
stageId?
vendorOrPersonId?
amount
currency
expenseDate
status
description?
receiptDocumentId?
invoiceDocumentId?
createdBy
createdAt
reversedAt?
reversalReason?
```

Existing canonical money/reversal rules remain authoritative.

### 4.16 MaterialRequirement
```text
id
projectId
stageId?
workItemId?
materialName
specification?
quantity
unit
requiredBy?
status
createdBy
```

States:
```text
PLANNED
QUOTING
SELECTED
ORDERED
PARTIALLY_RECEIVED
RECEIVED
CANCELLED
```

### 4.17 SupplierQuote
```text
id
materialRequirementId
supplierId?
supplierName
quantity
unitRate
taxAmount?
deliveryCharge?
totalAmount
deliveryDate?
validUntil?
documentId?
status
```

States:
```text
RECEIVED
SELECTED
REJECTED
EXPIRED
WITHDRAWN
```

### 4.18 Order
```text
id
projectId
materialRequirementId?
commitmentId?
supplierId?
supplierName
orderedQuantity
unit
totalAmount
orderedAt
expectedDelivery?
status
documentId?
```

States:
```text
PLACED
PARTIALLY_DELIVERED
DELIVERED
CANCELLED
```

### 4.19 Delivery
```text
id
projectId
orderId?
materialRequirementId?
supplierName?
expectedQuantity?
receivedQuantity
unit
receivedBy
receivedAt
condition?
challanDocumentId?
photoRefs[]
notes?
```

If `receivedQuantity < expectedQuantity`, emit shortage evidence/event. Do not infer supplier fault.

### 4.20 DocumentLink
Construction links protected Vault documents; it does not duplicate bytes.

```text
id
projectId
documentId
contextType
contextId?
label?
createdBy
createdAt
```

Contexts may include project, stage, milestone, work, decision, issue, inspection, change, commitment, expense, material, order, delivery, or handover.

### 4.21 ConstructionEvent
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

Events feed history, guidance reevaluation, future notification delivery, and debugging/audit.

### 4.22 GuidanceItem
```text
id
projectId
ruleKey
subjectType
subjectId
type
priority
title
reason
consequence?
actionType
actionTarget?
relevanceKey
createdAt
updatedAt
relevantUntil?
resolvedAt?
provenance?
```

Types:
```text
BLOCKING
DECISION
DUE
EXCEPTION
FYI
```

### 4.23 HandoverRecord
```text
id
projectId
status
handoverDate?
finalRecordedSpend?
finalPhotoRefs[]
finalDocumentIds[]
notes?
completedAt?
```

Handover can collect snag items, final drawings, warranties, manuals, final photos, professional records, supplier references, and meter details.

## 5. Money model

Keep these concepts distinct.

### Base planned budget
Original approved baseline.

### Current approved budget
Approved plan after recorded approved changes.

### Committed
```text
Committed = Σ active Commitment.amount
```

### Outstanding commitments
```text
Outstanding Commitment
= max(Commitment.amount - linked non-reversed actuals, 0)
```

### Recorded spend
```text
Recorded Spend
= Σ non-reversed Expense.amount
```

### Approved change delta
```text
Approved Change Delta
= Σ approved Change.estimatedCostImpact
```
Use actual impact only when explicitly recorded and appropriate.

### Projected final
Core 1.0 must remain deterministic.

At minimum:
```text
Projected Final
= Current Approved Budget
  + explicit deterministic forecast adjustments
```

If the engine does not contain sufficient explicit forecast state, do not invent a projected number. Show approved budget, recorded spend, outstanding commitments, and known change deltas instead.

## 6. Dependency rules

1. Work becomes READY only when required dependencies are satisfied.
2. If a required predecessor reopens/changes, downstream readiness must be reevaluated.
3. Milestone completion may derive from required work, but the derivation must be explicit and testable.
4. If a linked design/document version changes after downstream work was planned/started, emit a version-change event and reevaluate guidance. Do not automatically claim physical work is invalid.

## 7. Role projections

Same engine, different information hierarchy.

### Owner
Where are we, what needs me, what changed, what next, money, evidence.

### Architect
Current stage, drawings/current revisions, decisions waiting on owner, inspections, issues, site updates, design dependencies.

### Contractor
Ready/blocked work, materials, deliveries, issues, invoices/commitments where authorized, execution-impacting decisions.

### Project manager
Blockers, schedule risk, changes, budget/commitment/spend, procurement, issues, project status.

UI role is not authorization.

## 8. Handover

Completion should support:
- snag closeout;
- open issue disposition;
- final spend;
- drawings;
- warranties/manuals;
- final photos;
- handover date;
- professional completion records.

Completion preserves all project history and feeds the permanent Property Passport.

## 9. Deferred scope

Core 1.0 defers:
- supplier marketplace;
- contractor bidding;
- automatic material-price scraping;
- workforce/payroll;
- IoT;
- BIM;
- CV progress estimation;
- AI drawing approval;
- automatic legal/compliance conclusions;
- online payments;
- government connectors;
- escrow;
- predictive AI cost forecasts.

## 10. Core invariants

1. Project belongs to one property.
2. V1 and V2 implement the same domain contract.
3. Presentation may differ; domain semantics may not.
4. No UI may fabricate completion, approval, cost, scan, inspection, or verification.
5. Money follows existing integer-paise/canonical rules.
6. Documents remain protected Vault records; Construction links context.
7. Meaningful state change → event → guidance reevaluation.
8. Guidance is idempotent and resolvable.
9. Notification is separate from event/guidance.
10. Handover preserves permanent history.
