# Hosted verification

Date: 2026-09-23. Repository: `/Users/tanutejas/Documents/Sukoon`. Branch: `cursor/sukoon-v1-construction-buysell-6bd3`.

These checks are separate. A pass on one does not cover the others.

## Deployment

PASS for the existing web service `sukoon-web` / `srv-damg370u01pc73a58l80`.

- Live site: `https://demo.sukoonproptech.com`.
- Render `sukoon-web` currently tracks `cursor/sukoon-v1-construction-buysell-6bd3`.
- Do not switch it back to `codex/sukoon-render-demo-staging` until the reviewed changes are integrated there and that exact resulting commit passes verification. Deployment tracking was not changed. This pull request was not merged.
- Accepted population deploy: `dep-daq02p7avr4c73c9apcg`, source commit `e672c151251c9bbccbc1298c206e8892ecfa49c0` (`Give the Construction scenario test enough time in CI.`). Trigger was “Branch updated”. Status was Deploy succeeded / Live.
- Pre-deploy on that deploy applied migration `20260923120000_transaction_organizer` and reported all migrations applied. The log named the database `sukoon_demo_staging`.
- GitHub verify on pull request 1 was green for `e672c151251c9bbccbc1298c206e8892ecfa49c0` before that deploy (Actions run `35886872250`).
- Before that deploy the service was on `codex/sukoon-render-demo-staging` at `bc9ad91`. No new service was created. Instance size was not changed. The worker service was not changed. The old blueprint was not applied.

A later commit on the same tracked branch, `5b3748770a3e7feac481320a867818b7d2a95e44`, changes purchase, evidence, and transaction writes to use the configured public-origin allowlist. The live site then accepted the public site origin and still rejected an unrelated origin. That check is what made the scratch writes below possible. It is not a second population.

## Seed execution

PASS against `sukoon_demo_staging` only. This closing pass did not seed again.

The database name was confirmed with `current_database()` before any populate write. The review workspace had no Mehta Residence project at plan time (`projectId` null). That is why Construction was empty for this account: enrichment skips a missing Mehta Residence and does not create it.

`construction:populate apply`, then the same command again:

- First apply created one project (`build-437c1a2bbf51e68abb42cef1c3212106`), 12 `COST_RECORD` rows, and no document rows. Recorded spend `269000000` paise, approved change `18200000` paise, outstanding commitment `15200000` paise, progress 30% from the engine. `documentsTouched` false.
- Second apply created nothing. It reused the same project and skipped all 12 cost records. Money figures were unchanged. `documentsTouched` false.

`transactions:populate apply`, then the same command again:

- First apply created one candidate, the buy scene, the sale scene, and the handover scene. Riverfront stayed a candidate with 3 offers. The negotiating scene had no recorded payment. Palm Meadows Apartment had 2 prospects. Handover net price payments were `30000000` paise.
- Second apply created nothing and skipped those four scenes. The same checks passed.

`demo:enrich:staging` and `seed:construction-ab` were not run. Seeds are not run on app startup.

## Authenticated browser

PASS for the owner review session on `https://demo.sukoonproptech.com`.

What was on screen after the population:

- Home needs attention included the reinforcement inspection, the electrical layout decision, the first-floor slab milestone, and TMT steel.
- Construction list included Mehta Residence, on RCC / Structure, preparing the first-floor slab, with a scheduled reinforcement inspection, an open electrical layout approval, and a contractor invoice in review.
- Construction money: base plan ₹1.20Cr, approved changes +₹1.82L, current approved ₹1.22Cr, recorded ₹26.90L, committed ₹1.52L. Bedroom flooring upgrade is the approved change.
- Materials: river sand completed, cement 400 bags partially received, TMT steel 2.8 tonnes with a quote still required.
- Buying: Riverfront Residency — Unit 1204 is Negotiating at ₹1.80Cr, with recorded price payments ₹0 of ₹1.80Cr and the line that this is not a bank confirmation. Lakeview Apartment — Unit 502 is in handover.
- Questions on the Riverfront deal included “Which parking space is allocated?” and “What are the current society dues?”, both open.
- Selling: Palm Meadows Apartment, two interested buyers. Priya Shah ₹81.00L. Nikhil Jain ₹83.00L, with the owner note that the offer is not shared with Priya Shah.
- Search for Palm returned Palm Meadows Apartment. Search for cement showed the query and filters without a result row. That screen lists properties, documents, bills, and maintenance.
- Updates for the day included Cement and Construction history on Super Corridor Plot.

Screenshots in this folder:

Construction:

- `construction/signed-in-home.png`
- `construction/project-list.png`
- `construction/mehta-residence.png`
- `construction/recorded-spend-and-flooring.png`
- `construction/money-and-changes.png`
- `construction/materials-cement-steel.png`
- `construction/updates.png`

Buy/Sell:

- `buy-sell/buying-list.png`
- `buy-sell/buying-riverfront.png`
- `buy-sell/buying-money.png`
- `buy-sell/questions.png`
- `buy-sell/selling-list.png`
- `buy-sell/selling-palm-meadows.png`
- `buy-sell/selling-nikhil-offer.png`
- `buy-sell/search-palm.png`
- `buy-sell/updates.png`

## Scratch interaction

PASS, then removed. Isolated records only. Mehta Residence, Riverfront, Palm Meadows, and Lakeview were not edited.

Construction, on a scratch project that was not Mehta Residence:

- An open decision produced guidance G02, “Scratch layout choice is due soon.”
- Recording the decision set it to DECIDED and that guidance was gone.
- A delivery of 7 against 10 produced guidance G04, “3 scratch bricks nos were short.”
- Recorded spend stayed `0`. Cost rows stayed `0`. The order created one commitment, not recorded spend.
- After refresh and a fresh sign-in: decision DECIDED, one delivery expected `10` received `7`, spend `0`, costs `0`, G04 still active.

Buy/Sell, on a scratch candidate that was not Riverfront or Lakeview:

- One buyer offer was created. The same request key on retry was a duplicate and returned the same id. Offer count stayed 1. Asking `50000000` paise, latest offer `44000000` paise, no seller counter, agreed false, no terms revision.
- One question was answered. The same request key on retry was a duplicate. State stayed ANSWERED with one ANSWER event.
- Saving a visit set the next date to `2026-10-15`. The same request key on retry was a duplicate. There is no visit-update command; that request returned 400 `INVALID TRANSACTION ACTION`. The saved visit date still persisted.
- The scratch candidate moved to HANDOVER. The handover item was created OPEN and then updated to DONE_REPORTED.
- A ₹100 price payment posted once (`10000` paise, one record). The same request key on retry was a duplicate and returned the same id. Net stayed `10000` paise and the record count stayed 1. Money was not double-counted.
- After refresh and a fresh sign-in, the offer, answered question, visit date, ₹100 net, and DONE_REPORTED handover item were still there. The scratch page still showed “Recorded price payments ₹100 of ₹5.00L. This is not a bank confirmation.”

Accepted counts stayed put during the scratch writes: Mehta Residence 1, Riverfront offers 3 and net `0`, Palm Meadows prospects 2, Lakeview handover IN_PROGRESS.

Scratch rows were then deleted, and only those rows:

| Count | Before delete | After delete |
|---|---|---|
| Mehta Residence projects | 1 | 1 |
| Scratch projects | 1 | 0 |
| Scratch candidates | 1 | 0 |
| Riverfront offers | 3 | 3 |
| Riverfront money records | 0 | 0 |
| Palm Meadows prospects | 2 | 2 |
| Lakeview handover | IN_PROGRESS | IN_PROGRESS |
| Lakeview money records | 2 | 2 |
| Scratch reminders | 1 | 0 |

The signed-in app list then showed only Mehta Residence. Purchase names were Lakeview Apartment — Unit 502 and Riverfront Residency — Unit 1204. The scratch project request returned 404.

## Riverfront labels

No copy change. The signed-in Riverfront page distinguishes the figures:

- Asking ₹1.80Cr.
- Your latest offer ₹1.72Cr, with the row “2026-09-16 · Owner entered · Recorded”.
- Reported counter ₹1.75Cr, with the row “2026-09-09 · Owner reported seller · Countered”.
- An earlier buyer figure, ₹1.68Cr, is “Owner entered · Countered”.
- Your target ₹1.72Cr is the private budget. It uses a different label from the latest offer, even though the amounts match.
- Agreed is false and there is no terms revision, so the page does not show an agreed amount. The phase is Negotiating. “Terms recorded” appears as a later stage, not as recorded terms.
- Recorded price payments are ₹0 of ₹1.80Cr, with the line that this is not a bank confirmation.

## Not part of this acceptance

These were not run and were not simulated:

- Multi-party authentication. Prospects are records on the review account, not separate sign-ins. Invites do not send email.
- Document bytes and scanning. The review workspace has 0 property documents. The seed did not create document rows, scans, or photo counts.
- Physical Android. No device was attached and the package `com.nuvirolabs.sukoon` was not exercised.

## Remaining product gap

An existing visit can be saved, and that date is what the story shows next. There is no command to update that visit afterward. Adding one would be a new action, so it was left unchanged.
