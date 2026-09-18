# Independent acceptance dimensions

## Current staging checkpoint — 2026-09-17

The separate zero-external `CLIENT_REVIEW` checkpoint supersedes any earlier
client-review SMTP, Render or hosted-domain requirement. Its exact Tailscale
Funnel route and browser health are recorded in the client-review runbook; this
matrix continues to track Render staging independently.

Repository preparation is `CODE_TESTED` only. No remote provider, Render
resource, DNS, SMTP transport, ordinary hosted browser or physical-device
staging evidence exists yet. The first-apply Blueprint and explicit cost table
are review artifacts, not deployment acceptance.

Canonical backlog: ../Sukoon_Agent_Starter_Pack/SUKOON_MASTER_PLAN.md. Never promote a fixture or unavailable adapter into live acceptance.

| Capability | Code | Reviewed content | Actual provider | Ordinary browser | Physical device | Release |
|---|---|---|---|---|---|---|
| S02–S22 / C-OS | Historical local evidence retained | Synthetic/local; public review pending | Local Postgres/storage; most remote providers unavailable | See CONSTRUCTION_ACCEPTANCE.md; not universal coverage | UNSTARTED | BLOCKED |
| Local malware scanning | CODE_TESTED (prior checkpoint) | Not authenticity/legal review | Real local ClamAV evidence in evidence/LOCAL_SCANNING.md | Upload/scan/manual review/attachment evidenced; PDF visual viewer limitation and same-version retry remain | UNSTARTED | BLOCKED production topology |
| CLIENT_REVIEW Tailscale Funnel APK | Profile/launcher/access-code route and APK build tested; exact Funnel route verified | Separate synthetic/local client-review account and content only | Existing local PostgreSQL, private storage, local ClamAV and worker; no SMTP or paid external infrastructure | Public HTTPS health and core browser routes PASS; physical upload/scan/preview pending | Moto no-USB/no-ADB UNSTARTED | BLOCKED physical acceptance and owner-held access-code configuration |
| F01/F02 / S23 operations | Restricted snapshot/content/cancellation tested; broader diagnostics IN_PROGRESS | Synthetic content lifecycle verified; public content review pending | Configuration is not a live health probe | Positive synthetic operator and supported failed-job cancellation passed | UNSTARTED | BLOCKED stronger hosted authentication |
| F03/F04 / S24 privacy | Local records-v1, withdrawal, synthetic erasure and external replay tested; broader scope IN_PROGRESS | Live policy/full disclosure review pending | Actual local PostgreSQL dump/restore, private files and restored Next restart HTTP passed; not hosted recovery | Records-v1 READY passed, Chrome saving blocked; timed Construction expiry rendered sign-in; no frame-level proof | UNSTARTED | BLOCKED live policy/hosted operations |
| O01 manual ownership/renewals | Record/date/history and retry-safe schedule slice tested; broader O01 IN_PROGRESS | Owner-entered assertions only | No lender/insurer/payment connection | Synthetic ownership save and renewal schedule persisted and rendered after reauthentication | UNSTARTED | BLOCKED wider release gates |
| T/M/B/G/P/E/X/R extensions | UNSTARTED except explicit future evidence | BLOCKED where reviewer required | BLOCKED where access required | UNSTARTED | UNSTARTED | BLOCKED |
| T02 import executor (2026-09-15) | CODE_TESTED: 7 integration tests (lineage, confirmation, identity denials, replay, side-effect-free, route boundaries) | No legal content; synthetic fixtures only | Real local ClamAV scans in isolated disposable-stack browser acceptance | Isolated-stack Vault proof (`output/motion-final/t02-vault-imported-390.png`); consumer UI frozen, no new UI | UNSTARTED | BLOCKED (deal-room grants OA13, review, all release gates) |

Every completion record must split these dimensions and cite commands/results or observed browser steps. Missing optional AI/OCR must not turn public app liveness into a failure; protected readiness may report unavailable capabilities without leaking configuration to unauthenticated users.

Latest local scanner/browser delta: original failed PDF recovered in-place through real ClamAV attempt4; normal Chrome owner PDF rendering verified. Home/list/overview/Plan/Budget Back/Forward, section refresh, Bill return and Vault return verified. Timed browser expiry/no-flash remains IN_PROGRESS; route-level expired-session 401 and client stale-response suppression are automated evidence only. See `evidence/ALL_PHASES_FOUNDATION.md` (27 unit / 78 integration, migration16).
# O01/T01 continuation — 2026-09-12

O01 loan correction/payment/persistence and basic-only co-owner sandbox accept/revoke have current browser evidence. T01 organizer core has UI/API/database/auth tests and partial ordinary browser evidence; genuine purchase Vault upload, received evidence, question resolution, screenshots, remaining role/reauth/device acceptance are unfinished. No live-provider/content/release approval inferred. Both task boundaries and exact tests are in evidence/O01_T01.md; canonical T01 remains IN_PROGRESS.
