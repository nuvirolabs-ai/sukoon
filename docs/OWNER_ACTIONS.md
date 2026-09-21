# Consolidated owner actions — 2026-09-17

## Client-demo staging decision set — approval boundary

The repository-side Render plan and staging-review authentication change are
prepared on local branch `codex/sukoon-render-demo-staging`, with the approved
`origin` remote configured. The current V1 baseline is preserved by local
checkpoint branch `codex/sukoon-v1-dirty-checkpoint-20260921` at
`989b3656a94af075f311c721d5cf83e160d3b12b`. After the dedicated auth commit is
reviewed, push that branch and confirm the existing Render web service points
at the exact pushed SHA. The publication audit and `.gitignore` now exclude
local `.data`, OTP/session history, databases, ClamAV signatures, private
documents, EICAR/malware fixtures, APKs, archives and temporary acceptance
output; do not force-add them.

The proposed Render target is a new Sukoon project `sukoon-demo-staging` with
environment `demo-staging`, all resources in Singapore, networking isolation
enabled and permissions protection enabled where the workspace plan supports
them. The first apply creates only four services and one dedicated paid
Postgres database from `render.yaml`: web, worker, private SeaweedFS storage,
private ClamAV and `sukoon_demo_staging`. No Render, DNS, SMTP or billable
resource has been created by the staging-review auth task.

Before clicking Deploy Blueprint, approve the following estimate explicitly:

| Resource | Render plan | Region | Disk | Estimated monthly cost | Public/private | Why required |
|---|---|---|---:|---:|---|---|
| `sukoon-web` | paid `0.5c-512mb` | Singapore | none | $7 | HTTPS web; generated hostname first | Next.js UI/API and health |
| `sukoon-worker` | paid `0.5c-512mb` | Singapore | none | $7 | private process | durable jobs and exports |
| `sukoon-db` | paid `0.5c-1g` | Singapore | 15 GB | $23.50 est. | private connection | dedicated non-expiring DB |
| `sukoon-storage` | paid private `0.5c-512mb` | Singapore | 10 GB | $9.50 | private service | SeaweedFS private S3 |
| `sukoon-clamav` | paid private `1c-2g` | Singapore | 5 GB | $26.25 | private service | official signature scanning |
| **Estimated total** |  |  |  | **$73.25/mo** |  | before workspace, bandwidth, build, custom-domain and SMTP charges |

Dashboard pricing is authoritative. No billable provisioning is authorized by
this repository preparation. The owner must explicitly approve the estimate,
or provide a revised limit, before the first Blueprint apply.

### Selected storage implementation

`sukoon-storage` is SeaweedFS Community Edition `4.47`, Apache-2.0 licensed,
from the official `chrislusf/seaweedfs` image pinned in
`infra/seaweedfs/Dockerfile`. It runs `weed mini` single-node mode on a 10 GB
Render persistent disk. Render's private-service network is the storage
boundary; generated S3 credentials are still required. The official mode
creates the dedicated `sukoon-demo-staging` bucket at first start. Limitations:
single node, no HA/cross-region replication, disk capacity is not backup, and
backup/restore/retention remain operator duties. It is not production storage.

ClamAV is the official Cisco Talos `clamav/clamav-debian:stable` image pinned
in `infra/clamav/Dockerfile`, with a 5 GB signature disk and daily FreshClam
refresh. clamd TCP 3310 is private-network restricted, not inherently
authenticated or encrypted; no public endpoint or separate application-level
scanner authentication is proposed. Sukoon fails closed when signature
metadata is stale/future, content is unsupported/limited, the hash changes,
the result is malformed, or the scanner is unavailable.

### Owner actions required to cross the boundary

1. For the currently approved auth-only task, authorize the existing Render
   account/service deployment and configure the three staging-review variables
   in Render without exposing their values. Do not create SMTP, storage,
   ClamAV or another Postgres.
2. Confirm the exact pushed SHA that the existing web service will deploy.
3. If a later full client-demo deployment is approved, separately supply
   staging SMTP host, port, TLS mode, username, password and a verified sender
   through Render's secret prompt. Do not put credentials in chat or Git. The
   local sandbox mailbox is not used remotely.
4. If the SMTP provider requires it, add its separate DKIM, SPF and/or
   domain-verification DNS records. These are in addition to the application
   DNS record.
5. After generated-host health/auth evidence passes, add only the exact
   Render-provided DNS record for `demo.sukoon.nuvirolabs.com` (normally a
   CNAME, or the A/AAAA record Render instructs). Then set the custom origin as
   canonical, verify Better Auth and disable the public Render subdomain.
6. Provide the approved staging cleanup/retention, backup/restore and
   monitoring owner. No production deployment, real customer data, public
   listing, live OCR/AI, payment gateway or real external message is included.

The exact repository-side checks and startup/shutdown instructions are in
`docs/STAGING_DEMO_RUNBOOK.md`. The actual client-demo status remains
`BLOCKED_BEFORE_PROVISIONING_COST_APPROVAL` until these external gates pass.

Default external spend limit is zero until explicit approval. Do not put credentials in this document; use the chosen secret manager. These are requested decisions, not approvals already received. Independent repository work continues while blocked integrations remain visibly unavailable.

## Latest staging/demo audit — 2026-09-16

The requested client-demo target `https://demo.sukoon.nuvirolabs.com` is **BLOCKED BEFORE PROVISIONING**. It did not resolve during the audit. The checkout contains no staging deployment manifest or remote provider bindings. The available Vercel session lists existing Signor Vale projects, including older Sukoon projects, but no approved Nuvirolabs demo project/domain; none was reused. Current local filesystem, local ClamAV and sandbox OTP adapters are not remote staging acceptance. See [STAGING_DEMO_RUNBOOK.md](STAGING_DEMO_RUNBOOK.md).

To proceed, the owner must supply one consolidated staging decision: approved hosting/server/project and region with scoped deploy access, private storage choice and retention, staging OTP provider/sender/limits/credentials, monitoring/backup/rollback owners and the provider-generated DNS target. No local `.data`, local accounts, privacy-erasure fixtures, EICAR files or session history will be copied. No paid service or external mail will be activated without the corresponding approval.

Latest approval clarification: isolated synthetic operators and newly-created disposable destructive tests are approved and now exercised. Supported failed-job browser cancellation and synthetic erasure/interruption/actual restore replay passed at the boundaries in `evidence/PRIVACY_ERASURE_RECOVERY.md`. These do not approve live erasure. OA04 still requires reviewed purposes, retention/shared-data/audit/backup-expiry/replay/escalation policy and full disclosure scope. The local records-v1 export is explicitly partial. Browser download remains policy-blocked. No new owner approval is needed to continue O01/T01 or independent roadmap implementation.

| ID / priority | Exact owner action and proposed choice | Alternatives / required boundary | Independent work |
|---|---|---|---|
| OA01 first | Name operating/release owner and real approved operator identities; synthetic disposable operator already approved and exercised | Stronger operator authentication must be chosen before non-local access; no role escalation of existing accounts | Complete safe handler diagnostics and cancellation browser acceptance |
| OA02 first | Choose hosting region and staging provider/project; approve private storage, app + durable worker + private scanner topology, retention, backup destination and monthly ceilings | Recommend preserve Postgres/Next/worker architecture; managed vs self-hosted decision pending actual approved provider. No services provisioned | Readiness separation, restore scripts, release checklist |
| OA03 first | Approve transactional email/push providers, verified sender/domain, allowed recipients and per-day/month spending caps | Existing sandbox mailbox remains default; no real messages | Delivery failure/reconciliation tests |
| OA04 first | Name privacy/legal reviewer; approve versioned purposes, retention periods, deletion/shared-record/audit/backup replay policy and support escalation rules | No invented legal retention; deletion execution blocked pending policy | Session controls, request intake and isolated cleanup tests |
| OA05 first | Approve OCR/AI provider/model, region, permitted document purposes, retention/training terms, per-file/token/time/month caps and English/Hindi evaluation dataset | Keep bounded native PDF parsing and manual review available; no private documents to a new provider | Validation, independent state handling, evaluation harness |
| OA06 first | Supply jurisdiction scope and accountable reviewers for checklist/health wording, buyer guidance, guideline-rate provenance, legal templates and rights-cleared plans/media | Synthetic engine fixtures only until reviewed publication; no fabricated rates or legal advice | Review/version/provenance workflows |
| OA07 first | Choose mobile direction after capability review: proposed shared web baseline with explicit native capability layer, or dedicated Expo consumer app | Decision must cover camera/files, secure auth, push, deep links, offline, signing/store accounts and physical iOS/Android devices; not yet an architecture approval | Browser/accessibility checks and capability inventory |
| OA08 next | Approve pricing/currency/tax/invoice/refund/cancellation/entitlement rules, payment provider merchant account and sandbox/live boundaries | Separate platform subscriptions from property bills, material purchases and deal deposits; no wallet/escrow by default | Disabled commerce engine, signed-event/replay/mismatch tests |
| OA09 next | Supply authorized government/utility/BBPS/e-sign partner access and intended jurisdictions/coverage | Per connector verify current official requirements before selection: authorized sandbox/API, partner pending, portal-only or unsupported. No passwords/CAPTCHA bypass | Connector registry, consent/freshness/conflict boundaries |
| OA10 next | Nominate actual suppliers/professionals/brokers/editorial owners; approve publication/contact/moderation rules and evidence rights | No fake inventory, public listing or unsolicited outreach | Private drafts, moderation/RFQ/booking state machines |
| OA11 later | Approve enterprise pilot organization, case purposes, exact selected evidence/fields, expiry/export limits and service identity | No autonomous credit/insurance decisions or ambient tenant access | Organization isolation and scoped case APIs |
| OA12 release | Approve staging execution first, then reviewed UAT/security/restore/performance/device evidence and an explicit production release window | Staging approval is not production authorization. Specify operating budget, alerts, rollback owner and support expectations | Release evidence matrix and runbooks |
| OA13 T02 next | Define deal-room invitation/projection semantics: which candidate fields, evidence states, notes and document bytes each role (seller, lawyer, architect, co-buyer) may see; who may invite/revoke; whether sellers may answer questions in-room | Proposed default: buyer invites by email; invited parties see candidate basics + explicitly scoped evidence metadata only, never buyer notes/workspace internals, never bytes without an explicit per-document scope; all grants expiring + revocable like S09 shares. No grant model will be invented without this decision | T02 import executor (done, buyer-only); S09 share flows as reference |

Vendor-specific commands, dependencies, costs and official requirement links will be added when evaluating the selected provider; no unverified price or eligibility is asserted here. Existing locally approved ClamAV is preserved, not a production scanner deployment approval.

## Initial official access references and platform recommendation

No mobile project configuration (`app.json`, `eas.json`, Capacitor config, Podfile or Android build project) was found in the current source inventory. Proposed OA07 choice: evaluate a Capacitor-packaged client first to reuse the approved responsive UI while the authenticated Next server remains hosted; this is a proposal, not an implementation decision. Camera/files require platform permissions and lifecycle handling, plus explicit review of native cookie/token handling, push credentials, deep links and no-private-offline-cache policy. [Official camera requirements](https://capacitorjs.com/docs/apis/camera), [filesystem requirements](https://capacitorjs.com/docs/apis/filesystem). Alternative: a dedicated Expo/React Native consumer client for native UI, sharing server contracts but requiring a separately tested client/navigation layer; Expo also documents DOM components in native WebViews, which is not evidence that this Next app is already native. [Expo DOM guide](https://docs.expo.dev/guides/dom-components/). Owner should choose before either scaffold is created.

OA02 proposed baseline retains the existing Node Next server and durable worker, rather than static-exporting authenticated routes. Next supports Node self-hosting; TLS/reverse proxy, isolated private data, process supervision, backup and monitoring still require approved infrastructure. [Official deployment guide](https://nextjs.org/docs/app/getting-started/deploying), [self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting). No hosting vendor/account, region or price has been selected.

OA03: if AWS SES is selected, production access is region-specific, sandbox recipient restrictions and sender identity verification apply; the owner must supply an approved account/region/domain and production access before real delivery. This is one candidate, not a service created or approved here. [SES production-access requirements](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html). Other vendors require their own current access review after selection. No email spend or recipient expansion is authorized.

OA09 DigiLocker developer portal could not be retrieved by the research tool in this session. Request owner-provided partner/onboarding documentation or retry official access research before defining this connector's requirements. Do not substitute an unofficial aggregator or claim access eligibility. Payment/BBPS/e-sign and utility-specific official access, contracts and costs remain to be researched against the chosen jurisdictions/providers; no invented pricing or blanket integration approval.
# O01/T01 continuation note — 2026-09-12

No new owner approval is required to finish the already-authorized private T01 Vault context and local acceptance. Those tasks are unfinished implementation, not provider/owner blocked. Existing OA01–OA12 decisions remain consolidated below; OA04 still blocks real-data erasure. No real seller messaging, publication, paid provider, OCR/AI processing or release was activated. Exact implementation checkpoint: evidence/O01_T01.md.
