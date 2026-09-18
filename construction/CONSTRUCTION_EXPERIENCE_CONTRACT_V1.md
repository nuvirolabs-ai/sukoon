# CONSTRUCTION EXPERIENCE CONTRACT V1

Status: CANONICAL  
Purpose: Defines user information needs and the V1/V2 presentation boundary.

## 1. One engine, two experiences

V1 and V2 must expose the same Construction capabilities and equivalent `CONSTRUCTION_AB_V1` facts.

They may differ in:
- hierarchy;
- navigation;
- density;
- progressive disclosure;
- copy;
- visual composition;
- motion;
- professional drill-down.

They may not differ in domain truth.

## 2. Homeowner jobs

A homeowner opens Construction to answer:

1. Where are we?
2. What needs me?
3. What changed?
4. What happens next?
5. How is the money looking?
6. Where are the papers/photos?
7. Who is responsible?
8. Is anything blocked or going wrong?

The interface should not require knowledge of:
- dependency graphs;
- work-item enums;
- guidance rule keys;
- event types;
- capability enums;
- worker/queue details;
- scanner internals.

## 3. Professional jobs

### Architect
Needs:
- current stage/milestone;
- current drawing revisions;
- decisions waiting on owner;
- inspections;
- issues;
- site updates;
- design dependencies.

### Contractor
Needs:
- ready work;
- blocked work and why;
- material needs;
- deliveries;
- issues;
- invoices/commitments where authorized;
- decisions affecting execution.

### Project manager
Needs:
- blockers;
- upcoming critical work;
- decisions;
- issues;
- approved changes;
- budget/commitment/spend;
- procurement;
- inspection schedule;
- project history.

Same engine, different projection.

## 4. Homeowner primary surfaces

Keep visible complexity to five concepts.

### NOW
Answers:
- what is happening now;
- what needs attention;
- what changed;
- what is coming up.

### JOURNEY
Answers:
- where are we;
- milestones complete;
- what is next;
- what is blocked.

### MONEY
Answers:
- planned;
- committed;
- recorded;
- approved changes;
- explainable projection where available.

### SITE
Answers:
- latest updates;
- photos;
- issues;
- inspections;
- deliveries.

### MORE
Contains:
- papers;
- people;
- materials/procurement;
- decisions;
- issues;
- full history;
- handover/settings.

Backend object names are not default navigation.

## 5. V1 control experience

V1 is the structured control.

Qualities:
- explicit;
- predictable;
- information-rich;
- clear sections;
- professional drill-down.

Suggested structure:
```text
Overview
Plan
Money
Site
More
```

### Overview
Shows:
```text
current stage
current milestone
needs attention
coming up
latest site update
money summary
open issues
```

### Plan
Supports:
```text
stages
milestones
work items
dependencies
decisions
inspections
```

### Money
Supports:
```text
budget categories
commitments
expenses
changes
variance/explanations
```

### Site
Supports:
```text
updates
photos
deliveries
issues
inspections
```

### More
Supports:
```text
materials
people
papers
decisions
issues
history
handover
```

## 6. V2 challenger experience

V2 is guidance-first and narrative.

Opening Construction should communicate the current situation immediately, for example:

> **First-floor slab is next**
>
> Two things need you before Friday.

Then progressively reveal:

### Current attention
> Electrical layout needs approval.

> Contractor invoice needs review.

### Site story
> Beam reinforcement finished yesterday.  
> Six photos were added.

### Money story
> ₹26.9L recorded so far.  
> The flooring change added ₹1.82L to the approved project cost.

### Journey
> Foundation ✓  
> RCC / Structure ●  
> Masonry ○

V2 should not feel like project-management software.

## 7. Right information at the right time

First-surface priority:

```text
BLOCKING
DECISION
DUE
EXCEPTION
meaningful FYI
```

Do not show every task/event/number/document on the primary surface.

## 8. Decision experience

Owner sees:
```text
what is being decided
why now
options
cost impact
schedule impact
attachments
what happens if deferred
```

Professional may also see:
```text
affected work
dependency chain
requestor
version references
audit
```

## 9. Issue experience

Owner:
> Water seepage is being investigated.

Professional:
```text
severity
assigned to
linked work
cost impact
schedule impact
resolution history
```

## 10. Change experience

Owner:
```text
what changed
why
cost impact
schedule impact
decision
```

Professional:
```text
affected work
budget categories
plan-version impact
actual vs estimated impact
```

## 11. Money experience

Owner primary:
```text
Planned
Committed
Recorded spend
Current approved/projected amount where explainable
```

Secondary:
```text
why it changed
largest categories
recent costs
```

Professional:
```text
category detail
commitments
actuals
linked invoices
change impacts
remaining commitments
```

Never hide commitment vs spend.

## 12. Site experience

Site is chronological and evidence-rich.

Each update may communicate:
```text
what happened
photos
work completed
issue
decision request
delivery
inspection
```

It should read like a project story, not an audit log.

## 13. Material/procurement experience

Owner:
> Steel is needed in 8 days. Three quotes are recorded.

Professional:
```text
requirement
quotes
selection
order
delivery
invoice
payment
```

No supplier marketplace required in Core 1.0.

## 14. Inspection experience

Consumer:
> Beam reinforcement checked  
> Recorded by Structural Engineer · [date]

If concern:
> One concern was recorded.

Never say "Structure approved" unless exact evidence supports that scoped claim.

## 15. Document experience

Construction surfaces documents in context.

Examples:
```text
Structural Drawing
RCC → First-floor slab

Invoice
Steel order

Warranty
Waterproofing
```

The document remains a protected Vault record.

## 16. People experience

Owner:
> Ankit Shah  
> Architect  
> Can add drawings, post site updates, and request your decisions.

Role display never substitutes for server authorization.

## 17. Handover experience

### Finish
```text
snag items
open issues
final expenses
```

### Collect
```text
drawings
warranties
manuals
photos
supplier/professional references
```

### Record
```text
handover date
final project photos
final recorded spend
completion evidence
```

Completion should feel like creating permanent property memory.

## 18. Copy rules

Prefer:
> Slab casting is next.

Not:
> Current milestone status.

Prefer:
> Electrical layout needs approval.

Not:
> Pending dependency.

Prefer:
> ₹2.40L invoice needs review.

Not:
> Outstanding payable object.

Prefer:
> 10 cement bags were short.

Not:
> Delivery variance exception.

Prefer:
> No paper has been added here yet.

Not:
> Missing artifact.

## 19. Owner-hidden technical detail

Hide by default:
```text
internal IDs
rule keys
event enum names
capability names
worker state
queue state
scanner daemon
database details
object storage
correlation IDs
raw audit payload
```

## 20. A/B parity rules

Both apps must let an authorized owner:
- understand current stage;
- see active guidance;
- open decisions;
- see issues;
- inspect Journey;
- inspect Money;
- view Site updates/photos;
- inspect delivery shortage;
- inspect inspection;
- find materials;
- find linked documents.

A missing capability in one app invalidates the UX comparison.

## 21. A/B success measurement

Per task:
```text
completed?
time
wrong taps
backtracks
asked for help?
misread state?
confidence
```

Then ask:
```text
Which app made the project easier to understand?
Which made it clearer what needed you?
Which made money easier to understand?
Which would you prefer for weekly use?
```

## 22. Physical-device quality bar

Primary target includes Moto e13.

Verify:
```text
scroll performance
tap targets
large text
keyboard
safe area
Android Back
bottom controls
photo loading
protected PDF
long names
large INR values
slow requests
unavailable states
background/reopen
```

V2 beauty must not depend on expensive effects that perform poorly on modest hardware.
