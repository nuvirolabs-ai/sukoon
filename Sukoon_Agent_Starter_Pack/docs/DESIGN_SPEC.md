# SUKOON — Design and Screen Contract

## 1. Inputs and authority

CHAT direction: SUKOON branding; “ESCAPE THE CHAOS”; category-first home; property search; Vault / Construction / Buy / Sell / Updates; latest request positions the logo centrally within the home banner.

References:
- `references/sukoon-logo-original.jpeg` — original supplied wordmark. Preserve orange/blue infinity mark and proportions.
- `references/home-latest-reference.png` — latest generated home direction, after the logo was moved downward into the hero centre.

This is the latest design reference, not an assumed signed approval. Earlier chat requested a no-photo version, while the latest selected reference includes a house banner. Record that history and follow the latest reference initially; changing imagery needs a recorded design decision. Do not silently switch to an earlier rejected dashboard.

## 2. Native screen, not a flattened image

Build actual text, buttons, cards, forms and navigation. Do not ship the reference screenshot as an ImageBackground with invisible hotspots. Do not reproduce a fake status bar, Dynamic Island, rounded physical phone border or bottom home indicator; the OS supplies device chrome.

Apple lists iPhone 17 Pro's display as 1206 × 2622 pixels: https://www.apple.com/in/iphone-17-pro/specs/ . At 3× this suggests a 402 × 874-point reference canvas; this point mapping is an engineering inference and must be checked against the selected simulator. The supplied mockup is 852 × 1846 and is not a literal native screenshot.

Use measured device dimensions and safe-area insets. Design must adapt to small Android widths, keyboard, accessibility text size and landscape where supported. No fixed heights that clip labels merely to force every section above the fold. The home is scrollable; tab navigation remains reachable.

## 3. Home composition

Order:
1. System safe area and native status bar.
2. Banner with centered SUKOON logo/tagline; notification and profile controls at upper right without overlap.
3. Property search.
4. Lightweight location/type chips.
5. Two-by-two category grid: Vault, Construction, Buy / Sell, Updates.
6. Property Passport entry strip or a real “Add your first property” state.
7. Bottom navigation: Home, Properties, Add action, Explore, More.

Logo is centered horizontally in the banner, below the top controls, preserving the supplied proportions. Do not move it back to the top-left. Avoid another large marketing headline because the user explicitly removed it.

Image assets are decorative only and never convey private data. Prefer a clean original/licensed hero asset. The screenshot is reference-only, not proof of a clean reusable photo. If the hero source cannot be separated safely, use a neutral banner fallback during development and flag the missing asset for design approval; do not regenerate the logo or distort the mockup to hide missing assets.

## 4. Honest category behavior

| Card | Phase 1 subtitle | Tap |
|---|---|---|
| Vault | Your property papers, organized. | Property picker → secure vault. |
| Construction | Your build journey, next. | Clearly labelled future capability + link to plot documents. |
| Buy / Sell | Prepare for your next move. | Reviewed buyer education and record-preparation guide. No listings. |
| Updates | Your reminders and recent activity. | Actual authorized notifications/history. |

These subtitles intentionally replace unsupported mockup claims such as “Verified properties” or implied live market news. The feature names and composition remain unchanged.

Search placeholder: “Search your property, documents…”; scope to the user's accessible records and approved guides. The original mockup's broad location search must not imply public discovery in V1. Location/type chips filter **My Properties** only and should be explained in the search UI. Hide irrelevant chip values when no matching owned/shared records exist; no hardcoded Indore for every user.

## 5. Proposed tokens, not another redesign

Use a quiet warm-neutral surface, strong readable text and restrained category accents. Proposed starting tokens:

```text
canvas          #F8F7F4
surface         #FFFFFF
text.primary    #182226
text.secondary  #59646C
line            #E6E8E7
brand.action    #164D3C
vault.tint      #ECF6F0
construction    #FCF3E7
buySell.tint    #ECF3FA
updates.tint    #FBEFEF
error           #B42318
```

Validate contrast before use; token values are not certification of accessibility. Use semantic tokens, not scattered literals. Spacing scale 4/8/12/16/24/32. Native system sans-serif for functional content; restrained serif section titles only where faithful to the reference and legible. Do not distribute proprietary font files. Current consumer typography, spacing, money formatting and status-language mapping: `docs/UI_CONTENT_SYSTEM.md`.

Cards use subtle borders/elevation, not heavy gradients/glows. Use one coherent native-style icon family. Status colors must have text/icons, not color alone. No gratuitous animation, parallax, fake financial tickers or ornamental dashboards.

## 6. Component contract

Build: ScreenScaffold, AppHeader, PropertySelector, SearchField, FilterChip, CategoryCard, RecordRow, EmptyState, ErrorState, LoadingState, StatusLabel, MoneyValue, DueDate, DocumentPreview, SourceBadge, ExtractionReviewField, PermissionScopePicker, ConfirmationSheet and SourceCitation.

All components support loading/disabled/retry/pressed/focus/accessibility states as appropriate. Minimum interactive target proposal: 44 × 44 points. Forms preserve entered data after validation errors and prevent duplicate submissions. Long filenames, translated labels and large numbers wrap or truncate with accessible full values.

Every screen that reads protected data renders safe loading before fetching and clears prior-account content during user/property switches. No briefly visible prior user's balance, document title or AI response.

## 7. Required screen inventory

| Group | Screens |
|---|---|
| Access | Welcome, email login/OTP, session-expired, privacy/AI consent, profile. |
| Home | Empty/active Home, search/results/no-results, filters, notifications, Add sheet. |
| Properties | My/shared properties, create/edit, overview, ownership facts and provenance, archive confirmation. |
| Vault | Category/document list, upload source selection, progress/failure, protected preview, versions, extraction review/conflict, document metadata. |
| Bills | Obligations list, add/edit, occurrence detail, reminder settings, record payment/partial payment, reverse correction, receipt attach. |
| Health/history | Assessment explanation, item detail, evidence/action, timeline, event/correction details. |
| Maintenance | Issue list, create/edit, transitions, completion expense, attachments/warranty. |
| Sharing | People/scopes, invite preview, accept invitation, access detail/revoke, export selection/status/download. |
| Assistant | Property-scoped conversation, citations, permission/consent/provider unavailable states. |
| Education | Explore/guide list, published guide with sources, saved guide, future Build/Buy-Sell boundaries. |
| Account | Notification preferences, devices, help, export/delete requests, sign out. |
| Admin web | Operator login, jobs, providers/capabilities, content review, audit/support queues, release health. |

## 8. Visual acceptance

Capture the same deterministic synthetic account on the reference iPhone simulator and a representative Android device; also capture empty/no-API/error states. Compare alignment, logo placement, card hierarchy, native safe areas, scrolling and button destinations with the reference. Never claim a device was tested from a resized PNG.

Check VoiceOver/TalkBack labels, dynamic text, reduced motion, keyboard avoidance and screen-reader navigation order. Confirm tab bar does not cover the final form action. Request review of the Home/property/vault slice at S06; owner approval is recorded before final release.
