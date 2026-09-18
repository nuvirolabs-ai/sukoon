# Sukoon consumer content system

This is the presentation contract for consumer screens. It does not change stored money, authorization, scanning, sharing scopes, privacy, Construction progress, Purchase ownership or payment accounting.

## Hierarchy

Every consumer screen answers, in this order:

1. **What matters** — one primary number, status or identity.
2. **What can I do** — one obvious next action.
3. **What details are available** — rows and disclosures, not a second database dump.

Use **summary → detail → deep detail**. Do not place every field at the same visual weight.

## Typography

System-first UI stack:

`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif`

Tokens in `app/globals.css`:

| Role | Size |
|---|---|
| Display / major number | 32–36px |
| Screen title | 28px |
| Section title | 22px |
| Card / row title | 17px |
| Body | 15px |
| Supporting | 13px |
| Metadata | 12px |

Use at most three font weights on an ordinary screen. Serif is reserved for the SUKOON wordmark.

## Spacing and alignment

- Page gutter: **20px** (`--space-page`)
- Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48
- Rows in a section share one vertical rhythm
- Icons and chevrons keep a consistent 18px box
- Desktop: 220px sidebar, bounded workspace (~900px), not stretched mobile cards

## Cards and rows

Prefer shared primitives in `components/consumer.tsx` and `components/ui.tsx`:

- `Metric` / metric group
- `ListRow` / `GroupedList`
- `SectionHeader`
- `Disclosure` / `InfoDisclosure`
- `ProgressBar`
- `EmptyState`

A typical row has: title, one supporting line, optional value, chevron. Do not nest cards inside cards. Do not put paragraphs inside rows.

Overflow rules: `min-width: 0`, 2-line clamp on titles/details, wrap large money, never shrink body copy to 11px.

Development-only stress fixtures live in `layoutStressFixtures()` and `/more/design-system`. They must not alter demo records.

## Money

`formatMoneyCompact` / `inr()` for summaries:

- below ₹1 lakh: `₹4,850`
- lakh: `₹26.90L`
- crore: `₹1.20Cr`

`formatMoneyExact` for transaction detail screens: `₹18,450`.

Do not mix `₹1,20,00,000`, `120 Lakh` and `₹1.2 Crore` on adjacent screens.

## Status language

Map stored enums with `displayLabel`. Examples:

| Stored | Shown |
|---|---|
| `IN_PROGRESS` | In progress |
| `USER_REPORTED` | Added by you |
| `NON_FINANCIAL` | Reminder only |
| `AWAITING_REVIEW` | Needs review |
| `SCAN_PENDING` | Scanning |
| `TERMINAL_FAILURE` | Couldn’t process |
| `INFORMATION_GATHERING` | Due diligence |

Do not expose raw enums in consumer UI. Use a pill only when colour adds meaning; otherwise secondary text.

## No dummy language

Consumer screens must never show: dummy, mock, fake, synthetic, fixture, test user, sample data.

`presentName()` strips a leading `Demo ` from visible titles. Stored filenames and technical logs keep their original names.

In **development only**, `DevAccountHint` may show one quiet `Demo account` line. Do not special-case demo emails. Normal users start empty.

## Consumer vs technical

| Consumer | Technical / disclosure |
|---|---|
| Security scan · No threats detected | Scanner evidence, hash, processing state |
| Added by you | `USER_REPORTED` |
| 11 documents | Document count field |
| Asking · ₹1.52Cr | `askingPricePaise` |

Deep technical evidence stays behind “What this means” or document/security disclosures.

## Motion

Preserve the approved motion system. This content pass does not add new animation families.

## Responsive quality bar

Primary: 390 / 410 / 430px. No horizontal overflow. Desktop is intentional, not stretched.

Visual capture: `scripts/ui-visual-audit.mjs`.

## Floating navigation inset

Consumer pages use one token, `--sukoon-content-bottom`, on `.app-workspace`. It is approximately nav offset + nav height + breathing room + safe-area. Do not pad individual routes to clear the bar. Desktop sets the token to a small page footer because the nav becomes a sidebar. Sheets keep safe-area padding only; they already cover the bar.

## Purchase routes

- `/buy-sell/purchases` list (recently active; disposable practice workspaces stay in Other)
- `/buy-sell/purchases/[id]` overview
- `/buy-sell/purchases/[id]/documents`
- `/buy-sell/purchases/[id]/questions`
- `/buy-sell/purchases/[id]/activity`
- `/buy-sell/purchases/[id]/details`

Deal Room is omitted until domain work exists.

## Document and payment routes

- Owner document: `/property/[id]/documents/[documentId]` — same `/api/documents/:id?metadata=true` authorization as before
- Shared document: `/shared/[id]/documents/[documentId]` — scoped `/api/shared/documents/:id`
- Obligation: `/property/[id]/bills/[obligationId]` — existing obligation and payment APIs

## Capability map (this cleanup)

| Action | Previous | Now |
|---|---|---|
| Document preview / download / replace / archive | Vault sheet | Document detail · More actions |
| Scan evidence | Vault sheet | Document detail · Security & provenance |
| Record / reverse payment | Obligation sheet | Payment detail · Payments / More actions |
| Correct schedule | Obligation sheet | Payment detail · More actions |
| Purchase edit / history | One long workspace | Details / Activity |
| Purchase documents / questions | Disclosures on workspace | Dedicated child routes; history stays off overview |
| Revise category budget | Every budget row | Category sheet · Revise budget |
| Add budget category | Always visible form | Secondary disclosure |
| Project budget edit | Every category form | Project settings |

Domain, money, Construction calculations, Purchase ownership, sharing and ClamAV are unchanged.

