# 01 — Populate Construction and prove it is visible

## 1. Scope

The user sees an empty Construction/Build area. First identify whether that means the project list, a selected property's project, a project document section, or a literal development folder. Inspect the actual route and authenticated response; do not create a new "Buildfolder" data model.

The task is data, visibility, and safe demo execution. Preserve Construction OS Core 1.0 and the V1.2 visual treatment. Do not rebuild decisions, procurement, guidance, or the money engine merely to populate a screen.

## 2. Source finding that matters

At source checkpoint `bc9ad91a509c9da3849c7d33eaff584493201d88`:

- `seed:construction-ab` explicitly runs with `APP_ENV=local` and `SUKOON_DATA_DIR=.data`.
- `demo:enrich:staging` exists and is staging guarded.
- `runDemoEnrichment` finds an existing active `Mehta Residence` under the target owner's `Super Corridor Plot`.
- If the project is absent, it appends `construction:Mehta Residence_missing` to conflicts and skips Construction population. It does not create that missing project.
- Some other categories can be written before that check. A successful process exit alone therefore does not establish complete Construction population.

Do not blindly run either script. Reconfirm current implementation and fix the specific missing prerequisite or projection. Details and source links are in file 06.

## 3. Read-only preflight

Produce one redacted identity report before any write:

1. Visible origin, requested route, current deployed commit, and expected service ID.
2. Runtime profile and document capability flags.
3. Actual database identity from the connection, not only its URL text. Do not print credentials.
4. Authenticated user ID/email and server-derived workspace ID.
5. Owned properties, active/archived projects, project/property/workspace relationships.
6. `/api/construction` response for that session, and the relevant project detail response.
7. Row counts for stages, tasks, plans, decisions, issues, inspections, changes, commitments, deliveries, updates, and guidance under that exact project.
8. Active filters, archived-state defaults, stale cached state, error handling, and wrong account/property selection.
9. Whether the build knows the current Construction command set and has required migrations.

Distinguish these diagnoses:

| Finding | Correct next action |
|---|---|
| No authenticated session | Finish the existing approved sign-in; do not seed another identity |
| Rows exist, API returns none | Investigate tenant scoping, membership, archive/filter, or read projection; never weaken authorization |
| API returns rows, UI is empty | Fix mapping/loading/filter/render state without reseeding |
| Local rows exist, hosted rows absent | Seed the confirmed hosted demo environment, not localhost |
| Project absent, property present | Create the one missing synthetic project through the Construction domain |
| Wrong or ambiguous property/project | Report candidates and resolve ownership; do not guess by the first list item |
| Construction papers empty, bytes disabled | Explain capability limitation; populate workflows, not nonexistent documents |
| Source updated, hosted commit old | Deploy the reviewed current branch before invoking new seed commands |

Do not represent 401, 403, 503, or a failed API request as "no projects yet".

## 4. Safe execution boundary

Introduce or extend a narrowly scoped Construction-only hosted population command if the existing command cannot create the missing prerequisites safely.

Suggested scenario namespace: `SUKOON_CONSTRUCTION_POPULATE_V2`.

Suggested operations: `plan`, `apply`, and `verify`. The implementer must document the actual command names after inspecting package scripts. Do not pretend these suggested commands already exist.

Required checks:

- `APP_ENV=staging`, `NODE_ENV=production`, and `SUKOON_RUNTIME_PROFILE=STAGING`.
- Explicit confirmation naming the new scenario version.
- Actual database is `sukoon_demo_staging`, connected through the approved Sukoon service.
- Target is the configured synthetic staging review user and their owned workspace.
- The property belongs to that workspace and is not a real-user property.
- Hosted documents capability is observed, not silently overridden.
- No writes to V2, Gagan, Dogkart, other users, or other databases.
- No reset, truncate, broad delete, blanket reseed, or creation of a replacement review user.

Plan all required prerequisites and conflicts before writing. For multi-command execution, use a durable manifest/checkpoint or equivalent existing mechanism; do not hold a transaction open while scanning files or waiting on remote services.

## 5. Reuse and missing-record policy

Reuse the existing synthetic `Super Corridor Plot` and `Mehta Residence` if their ownership and scenario identity match. A project under a different user must not be reparented.

If absent, create the missing synthetic property/project through existing validated commands. If a required property is absent but the target workspace is not provably synthetic, stop.

Only create missing scenario records. For existing namespaced rows:

- Identical payload: skip and return the prior result.
- Different payload or user-edited content: report conflict; do not overwrite or change the idempotency key just to force another insert.
- Existing unrelated legacy records: leave untouched and calculate actual totals.

A rerun must converge. It must not add new payments, events, commitments, stages, reminders, or change the scenario dates again.

## 6. Coherent construction story

Use one rich active project before adding other projects. Default scenario facts, subject to preservation of existing legitimate records:

| Area | New-scenario target |
|---|---|
| Property | Super Corridor Plot |
| Project | Mehta Residence |
| Project | New home; G+2; area explicitly owner-entered if supplied |
| Current stage | RCC / Structure |
| Current milestone | First-floor slab |
| Original budget | ₹1,20,00,000 |
| Recorded spend | ₹26,90,000, backed by existing canonical cost/payment records |
| Approved estimated change | Flooring upgrade: +₹1,82,000; +3 estimated days |
| Current approved budget | ₹1,21,82,000 only if that change is not already included |
| Outstanding commitment example | ₹1,52,000, supported by actual commitment allocation records |
| Blocking decision | Electrical layout approval; downstream conduit work and slab milestone linked |
| Invoice review | ₹2,40,000 awaiting owner review; no payment created by approval |
| Delivery | 400 cement bags expected; 390 received; 10 still outstanding |
| Inspection | Reinforcement inspection scheduled, not performed |
| Material need | 2.8 tonnes of steel; three owner-entered quote records |
| Site log | 8–12 updates across meaningful completed/current stages |
| History | 20–35 meaningful events, with causes and actor/source context |
| People | Synthetic architect, contractor, structural engineer and owner contacts; contacts grant no access |

Do not force 31% progress. Seed coherent task/stage state, then show the percentage produced by the existing engine and label its basis. If the existing project yields another percentage, report it honestly.

Flooring's ₹120/sq ft to ₹190/sq ft rates and the ₹1,82,000 package impact are separate recorded estimates unless measured area and scope support the multiplication. Do not infer a fictional area merely to make them match.

## 7. History and dates

For a new scenario, choose one `scenarioAnchorDate` in the project timezone (`Asia/Kolkata` for this example), persist it in the scenario manifest, and reuse it on every rerun.

Example progression: setup at T−240 days, design at T−220, excavation at T−190, foundation at T−160, plinth at T−130, ground-floor work at T−90, current slab preparation at T−10. Add a prior completed decision, two resolved issues, a cancelled quote, a completed delivery, and a past recorded inspection.

Recent state: site update T−1; inspection scheduled T+1; electrical decision due T+2; slab milestone T+4; steel required T+8.

Do not call T+4 "Friday" unless that date actually is Friday. Derive Today/Tomorrow/overdue labels from the current clock; do not keep rolling scenario deadlines forward on every launch.

Record historical business occurrence dates separately from when the demo import was executed. Label provenance as synthetic/imported history; do not pretend the application actually sent notifications or performed scans months ago.

## 8. Money: no duplicate ledger

Use exact integer paise internally and respect each command's input unit. Inspect parsers before calling them: a rupee string is not a paise string.

If creating a new scenario with the target ₹26,90,000 total, the following is a proposed category allocation in rupees, not additional money to add to an existing funded project:

| Category | Amount |
|---|---:|
| Design/professional fees | ₹1,80,000 |
| Site preparation | ₹2,40,000 |
| Foundation/plinth | ₹7,50,000 |
| RCC concrete/formwork | ₹8,60,000 |
| Steel already consumed | ₹4,60,000 |
| Early services work | ₹80,000 |
| Site setup/miscellaneous | ₹1,20,000 |
| Total | ₹26,90,000 |

Use 12–18 dated cost effects if useful. Existing canonical actuals must not be repeated to reach a target screenshot total. The pending ₹2,40,000 invoice is not an extra payment. Deliveries and quote selection never create spend.

For the illustrative complete model:

`approved = 12,000,000 + 182,000 = 12,182,000 rupees`

`headroom = approved − 2,690,000 recorded − 152,000 outstanding commitment = 9,340,000 rupees`

Do not subtract total commitments including already paid portions again. If the existing engine cannot prove outstanding allocation without overlap, show the numbers separately instead of a misleading stacked bar. Negative headroom must remain visible as over-allocation.

## 9. Hosted documents and media

With hosted storage/scanning disabled:

- Create zero new Vault documents or document versions.
- Create no fake clean scans, false professional reviews, or dangling byte references.
- Drawings can be tracked as requested/not added records only where supported; do not display a Preview button for absent bytes.
- Site logs may include honest notes. Render actual existing protected media only where available.
- A shipped illustration may explain a stage, but label it "Illustration"; do not count it as a site photo or treat it as progress evidence.
- Do not populate a "6 photos" count unless six accessible real/synthetic media assets actually exist under the approved media model. Photo-label references alone are not photos.

Media-complete local proof may use clearly marked harmless synthetic files through the existing real upload/scan path in an isolated test environment. Do not activate storage or ClamAV spending as part of this task.

## 10. Presentation acceptance

Use the current V1.2 story: project status → Needs you → upcoming timeline → site → money → Explore.

All displayed values come from authenticated APIs. Keep max three dominant owner actions, current and next stage emphasized, delivery 390/400 and 2.5% short, and explainable money segments. Keep exact amounts in detail even when cards use compact values.

Verify every relevant section: Now, plan, money, site, materials, quotes, orders, deliveries, issues, decisions, inspections, changes, people, history, and handover preparation. Unsupported document sections must communicate why they are unavailable, not appear broken.

## 11. Proof required before moving to Buy/Sell

- Correct service/commit/database/user/workspace recorded.
- Preflight identifies why Construction was empty.
- Before/after counts scoped to the target project.
- New project appears in authenticated `/api/construction` and the actual hosted UI.
- Rerun creates no duplicate domain effects and preserves dates.
- Money and delivery equations reconcile.
- Guidance derives from source state; resolving a test decision updates guidance.
- Refresh, sign-out/sign-in, and reopen preserve data.
- An unrelated synthetic account receives none of the new private records.
- Existing payments, review projects, Construction visuals, and non-target data unchanged.
- No new document bytes/scan evidence on disabled hosted providers.
- Physical Moto result recorded separately; not blocked from completing browser work when no phone is attached.

Do not stop at "seed code pushed". Hosted execution and authenticated display are the user's goal. If access is unavailable, report that exact deployment/execution step as pending rather than complete.
