# 04 — Demo scenarios and acceptance evidence

## 1. Shared fixture principles

Use one versioned semantic manifest per scenario and a fixed stored date anchor. Re-running does not advance time or change payloads under old idempotency keys. Semantic identity includes workspace, scenario, object kind and business key; do not deduplicate across people by property name.

Fictional records must remain marked in provenance. The consumer can use natural names rather than repeated "DUMMY"/"Synthetic" prefixes. Show one quiet "Demo workspace — fictional records" indicator and retain explicit illustrative-media labels. Normal accounts remain empty.

Historical occurrences may be dated in the past; import execution/actual review/scan timestamps remain truthful. Never invent a past application delivery, legal opinion, inspection certification or payment-provider response.

Populate through validated domain commands, with a tested seed path for historical occurrence dates. Do not directly fake guidance, aggregate totals or read-model counters. Reconcile actual stored facts to UI summaries.

## 2. Construction scenario

Namespace: `SUKOON_CONSTRUCTION_POPULATE_V2` (scenario revision, not the frozen V2 app).

The primary scene is `Super Corridor Plot → Mehta Residence` from file 01. Aim for meaningful coverage, not thousands of rows:

- Existing 17-stage template where applicable; representative completed, active and planned tasks.
- At least one working typed decision dependency.
- One open owner decision, one prior decided item, one invoice review.
- One short delivery, one completed delivery, three quotes for an upcoming need.
- One scheduled inspection and one scoped previously recorded check.
- Two resolved issues and one current issue.
- One approved estimated change, with actual cost still unrecorded.
- Eight to twelve dated site notes.
- Money history supporting actual recorded totals.
- Three to five contextual reminders, reconciled by the real scheduler.
- No new hosted documents/media when those providers are disabled.

All counts are coverage targets. Reuse adequate existing records; do not add duplicates simply to meet a quota.

### Construction acceptance tasks

1. Find the active build from the hosted review Home or Construction list.
2. Identify current stage and next milestone without reading a long form.
3. Open the electrical decision and see its real dependency chain.
4. Open the invoice review and see that approval does not record payment.
5. See expected 400 / received 390 / short 10 and 2.5%.
6. Open the latest site note; any image is genuinely present or explicitly an illustration.
7. Explain original budget, approved change and actual recorded spend without double-counting.
8. Find the scheduled inspection; it must not appear completed.
9. Find 2.8-tonne steel requirement and quote comparison if those facts were seeded.
10. Refresh, reopen and sign back in; the same project and records remain visible.

Mutating acceptance uses a separate namespaced scratch project or disposable local scenario. Do not reset the canonical hosted workspace to recover from tests.

## 3. Purchase scenario A — active negotiation

Namespace: `SUKOON_TRANSACTION_DEMO_V1:BUY_ACTIVE`.

Reuse the owner's existing candidate if identity/provenance match. The inspected enrichment refers to `Riverfront Residency — Unit 1204`; do not replace it with a new Unit 703 just because an older chat used that example.

| Fact | Proposed initial state |
|---|---|
| Candidate | Riverfront Residency — Unit 1204 |
| Phase | Reviewing / negotiating; acquisition not complete |
| Asking price | ₹1,80,00,000 |
| Initial buyer offer | ₹1,68,00,000 at T−21 |
| Seller counter | ₹1,75,00,000 at T−14, owner-reported unless actual participant submission exists |
| Latest buyer offer | ₹1,72,00,000 at T−7 |
| Private buyer target | ₹1,72,00,000; never in seller/broker default projection |
| Agreed price | Not yet recorded |
| Parking | One space claimed; supporting paper not added |
| Open questions | Parking allocation; current society dues |
| Requests | Latest tax receipt; seller's ownership paper; parking-related record if applicable |
| Closed question | One harmless recorded question such as included appliances, with source attribution |
| Financing | Buyer intends financing; ₹1,18,00,000 requested; sanction/disbursement unknown |
| Visit | T+2, manually planned |
| Deadline | Follow up on parking at T+1 |
| Payments | None recorded for this negotiating scene |

Seed three immutable offer revisions, six to ten historical notes/events, two open questions, one resolved-and-reopened example only where meaningful, and a future visit. Do not mark unreceived documents received or professional review completed.

Buyer should see: "Seller's reported counter ₹1.75Cr", "Your latest offer ₹1.72Cr", "Parking still needs confirmation", "Visit in two days". No agreed-price badge, legal readiness score or bank confirmation.

## 4. Sale scenario B — manage separate interested buyers

Namespace: `SUKOON_TRANSACTION_DEMO_V1:SELL_ACTIVE`.

Reuse the synthetic `Palm Meadows Apartment` Passport. Create a private sale workspace if missing; do not publish or archive the property.

| Fact | Proposed state |
|---|---|
| Asking price | ₹85,00,000 |
| Seller desired possession window | User-entered T+60 target, not a promise |
| Prospect 1 | Priya Shah; offer recorded ₹81,00,000; visit completed |
| Prospect 2 | Nikhil Jain; offer recorded ₹83,00,000; visit T+3 |
| Selected buyer | None |
| Open request | Maintenance dues information, saved for owner follow-up |
| Disclosed documents | None on documents-disabled staging |
| Disclosure draft | Selected basic property facts only, private until explicitly shared |

Names are fictional contacts until separately authenticated grants exist. Neither prospect is auto-invited or auto-accepted. The seller-private comparison can show both offers; any buyer-facing projection sees only that buyer's allowed room.

Seller should see: "Two interested buyers", next visit, each offer/source and the next follow-up. It must not look like a public portal with fabricated lead generation.

## 5. Purchase scenario C — handover rehearsal

Namespace: `SUKOON_TRANSACTION_DEMO_V1:HANDOVER_REHEARSAL`.

Use a separate fictional candidate, such as `Lakeview Apartment — Unit 502`, not one of the existing owned properties. This lets tests reach advanced flows without changing the active Riverfront negotiation.

| Fact | Proposed state |
|---|---|
| Commercial price | ₹1,73,00,000, explicitly owner-reported agreement |
| Payment plan | Token ₹5,00,000 + milestone ₹1,18,00,000 + completion ₹50,00,000 |
| Recorded token allocations | ₹2,00,000 + ₹1,00,000 = ₹3,00,000; self-reported only |
| Token remaining | ₹2,00,000 |
| Price remaining | ₹1,70,00,000, assuming no other payments/refunds |
| Extra charges | Unknown unless explicitly entered; not assumed zero |
| Handover date | T+14 planned, not completed |
| Open items | Keys, meter readings, included fixtures and pending-dues notes |
| Owned Passport | Not created until the explicit conversion acceptance test |

Registration is not verified and should not be labeled complete merely to make handover possible. The workflow may record a planned handover while registration/evidence remains unresolved.

## 6. Local multi-party and document fixture

In a disposable isolated test environment only, use distinct real authenticated synthetic buyer, seller, lawyer, broker and unrelated-user accounts. Exercise invitations, exact-version disclosure, private notes, expiry/revocation and queued-output suppression. Mark actual local fixture actions as synthetic.

For document tests, use harmless clearly labeled synthetic PDFs/images, real private storage and the configured scanner. Version 1 is received/reviewed; version 2 is uploaded/quarantined separately; old review remains pinned to v1. Do not copy a clean verdict to v2.

With hosted storage disabled, this fixture is **not** mirrored as clean documents in staging. Hosted acceptance must display the blocked capability accurately.

## 7. Automated acceptance matrix

| ID | Required proof |
|---|---|
| A01 | Correct target origin/commit/database/account/workspace before mutation |
| A02 | Construction missing-project case creates only one scoped project |
| A03 | Existing project with valid data is reused; no duplicate money/history |
| A04 | Whole seed preflight detects conflicts before partial unrelated writes |
| A05 | Same seed twice converges; interrupted run resumes; dates stay fixed |
| A06 | Paise/rupees transport is verified per command; exact totals reconcile |
| A07 | New normal account remains empty |
| T01 | Candidate creation does not create owned property |
| T02 | Sale workspace reuses owned property without duplicating it |
| T03 | Unknown area/price is not converted to zero or invented |
| T04 | Offer/counter revisions retain actor/source; retry creates one effect |
| T05 | Terms change invalidates only relevant acknowledgement/current review |
| T06 | Planned token/loan sanction does not create payment |
| T07 | Payment allocation, reversal and refund remain distinct and idempotent |
| T08 | Question note ≠ answer; answer ≠ resolution; reopen keeps history |
| T09 | Request save ≠ message sent; receipt/review needs actual version where required |
| T10 | Changing phase does not create legal ownership/registration/payment |
| T11 | Guidance is idempotent, time-aware, authorized and resolves on source change |
| T12 | Buyer A cannot see Buyer B's prospect/offer/counts/notes |
| T13 | Lawyer-private notes omitted from buyer/seller/broker exports and search |
| T14 | Grant replay, wrong identity, expiry, revocation and guessed IDs denied |
| T15 | In-flight/queued result rechecks current access; client clears revoked data |
| T16 | New source version does not inherit previous review or clean scan |
| T17 | Passport creation/import requires explicit confirmation and preserves source |
| T18 | Cross-owner seller-byte copy denied under the existing same-owner importer |
| T19 | Cancel/archive preserves evidence and does not delete other's records |
| T20 | New models included in export/deletion inventory and synthetic lifecycle tests |

## 8. Human and visual acceptance

Ask an unfamiliar person to find a current build action, a purchase unknown, the latest offer, next visit, seller's best offer and the remaining recorded payment. Do not coach them or declare an agent walkthrough a five-second human test.

Capture the actual populated owner screens at 390px, 430px and a useful desktop width: Construction story, money, procurement, Buy/Sell landing, buyer story, seller story, question, price history, terms, transaction money and handover. Test keyboard, large text, long names, Indian currency, Android Back and session refresh.

Graphs must use real stored values, state their denominator, and have a readable text alternative. No chart is better than a misleading chart.

## 9. Final status vocabulary

Use PASS / FAIL / NOT RUN / PROVIDER BLOCKED / ACCESS BLOCKED for each gate.

Separate code, migration, deployment, hosted seed, authenticated browser, distinct-participant, document-media and physical-device results. A counts report is not proof the client can see the records; screenshots are not proof of authorization; a stopped script is not a completed seed.
