# Sukoon — Start Here

Version 1.0 · Agent implementation pack · Prepared for Tanutejas Saraswat
Client: Akshay Kothari · Product brand: SUKOON · Tagline: ESCAPE THE CHAOS

## What this pack is

Repository instructions and an implementation specification for building a real Sukoon Phase 1 application. This is not an application, not tested application code, not evidence that anything has been deployed, and not a replacement for the development agreement.

The first release is **OWN**: a Property Passport, private smart vault, reviewed AI extraction, manual bills and reminders, maintenance and history, transparent Property Health, controlled sharing, and a property-scoped assistant. Buyer education is lightweight. Public listings, construction commerce and government payment integrations are not silently included in this release.

## Start in your coding tool

1. Open the actual Sukoon repository in your coding agent. If there is no repository, create a dedicated empty Sukoon project folder and open it. Do not use a Gagan, Dogkart or Company OS repository.
2. Copy the contents of this folder into that repository, preserving `docs/` and `references/`. If files with these names already exist, ask the agent to compare and merge rather than overwrite them.
3. Paste the complete contents of `START_PROMPT.txt` into the agent.
4. The agent must inspect the repository first. It should then work through the master plan in dependency order, updating its evidence after each task.

No assumed local folder path, cloud account, credentials, technical stack, completed task, client approval or production environment is supplied by this pack.

## The two files that govern execution

- `AGENTS.md`: permanent instructions, safety boundaries and how the agent works.
- `SUKOON_MASTER_PLAN.md`: ordered tasks, dependencies, acceptance tests, status and the next task.

## Supporting specifications

| File | Purpose |
|---|---|
| `docs/PRODUCT_SOURCE_OF_TRUTH.md` | Source traceability, Phase 1 boundaries, user journeys and feature contracts. |
| `docs/TECHNICAL_SPEC.md` | Proposed architecture, data model, permissions, APIs, jobs, security and environments. |
| `docs/DESIGN_SPEC.md` | Sukoon identity, latest home reference, native layout, screen inventory and interaction rules. |
| `docs/CONTENT_AI_POLICY.md` | Correct information, provenance, review workflow, Property Health rules and safe AI. |
| `docs/LAUNCH_CHECKLIST.md` | Evidence required before pilot and production release. |
| `docs/DECISIONS.md` | Explicit assumptions, unresolved conflicts and future decisions. |
| `docs/STATUS.md` | A truthful resumable state file; starts with no implementation verified. |

`references/` contains the user-supplied concept PDF, original logo and latest in-chat home mockup. These are reference inputs, not application fixtures or production data. `references/SOURCE_MAP.md` identifies exactly what each supports.

## Source hierarchy

The PDF contains two different later-phase roadmaps. This pack explicitly uses its **pages 6–7 “Phase 1 = OWN” lock** for launch, while preserving both later roadmaps as unresolved planning inputs. It does not merge all five-year features into an alleged complete V1. See decision D-001.

The latest home mockup is a visual direction, not proof that its sample data, text, dimensions or future modules are approved production requirements. No client design approval is assumed.

Architecture, database/API contracts, task breakdowns, security controls and acceptance thresholds in this pack are proposed engineering defaults. They are distinguished from user/source requirements. Preserve compatible existing implementation after an audit; record deviations instead of silently changing the product.

## What “ready to use” requires

An authenticated user must be able to create a property, save and retrieve real documents, review actual extraction results, record bills and reminders, share only permitted records, revoke access, and return later to find persistent data. A separate operator interface must expose failures without unrestricted access to private vaults.

Production additionally requires functioning email/auth delivery, private object storage, document scanning, an approved AI provider and processing consent, scheduled workers, monitoring, backups with a tested restore, user privacy controls, and signed mobile builds. Missing providers are blockers, not permission to ship mock results. In-app reminders remain useful when push permission is denied.

The human owner must supply or approve accounts, credentials, spending, privacy/legal content, release policy and final design. The agent can build and test most of the application before these are available, but must not declare production readiness while they remain missing.

## First proof milestone

After repository discovery and foundation, prove this loop with synthetic data:

`Sign in → create Property Passport → upload a real file → scan → review → reopen it after app restart → deny access to another user.`

After that, build out the remaining OWN workflows. Do not spend the first weeks building only an attractive home screen.
