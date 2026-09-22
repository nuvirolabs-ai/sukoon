# Plan: additive staging demo enrichment

> **Execution note:** This plan is for the current Sukoon staging branch. The
> user has already supplied the implementation and staging-execution scope;
> no production, local `.data`, or unrelated service is in scope.

## Step 1 — Guard and deterministic plan

**Files:** `lib/staging-seed-policy.ts`, `lib/demo-enrichment.ts`,
`tests/unit/demo-enrichment.test.ts`

1. Add the explicit `SUKOON_DEMO_ENRICHMENT_V1` namespace and a staging-only
   guard that composes the existing staging seed fence with a separate
   enrichment confirmation.
2. Add stable ID/request-key helpers and a pure date/data plan builder. The
   plan must not contain document records, scan verdicts, provider responses,
   or secrets.
3. Write/run the red unit tests first for namespace stability, fixed record
   counts, date window, mixed statuses, future coverage, and the no-document
   invariant.

## Step 2 — Domain-aware executor

**Files:** `lib/demo-enrichment.ts`, `scripts/demo-enrichment.ts`,
`package.json`

1. Resolve the existing configured owner/workspace and the three required
   properties by stable name. Abort if the owner, workspace, or any required
   property is absent or ambiguous.
2. Insert only missing namespaced legacy bills, reminders, and timeline rows.
3. Create obligations through `createObligationForUser`, occurrences through
   the normal schedule path, and payments through `recordPaymentForUser` with
   namespace-owned keys. Never update or reuse an existing payment key.
4. Create/update maintenance only through the existing maintenance lifecycle,
   preserving existing rows and statuses. Use no document links.
5. Enrich the existing Construction project through its mutation API for
   current state and guidance; add historical append-only events/updates with
   deterministic identity and synthetic provenance.
6. Enrich the existing purchase candidate through `purchaseCommand` and
   `recordPurchaseEvidence` only for text notes/questions/requests. Do not
   attach document versions or claim external responses.
7. Return a bounded report with created/skipped counts by category, date range,
   and conflicts.

## Step 3 — Integration proof

**Files:** `tests/integration/demo-enrichment.test.ts`

1. Use the isolated `TEST_DATABASE_URL` test database and create a minimal
   existing owner/workspace with exactly the three named properties, one
   baseline payment, and one baseline document.
2. Run the executor twice with an injected test-safe environment and assert
   that the second run creates zero new namespaced rows, the baseline payment
   and document are byte-for-byte metadata unchanged, and no document/scan
   rows are added.
3. Assert that an absent property fails before any insert and that the
   namespace never crosses a different workspace.

## Step 4 — Local verification and documentation

Run focused unit/integration tests, lint, typecheck, build, and diff check.
Update the canonical staging runbook, status, remaining-work register, and
master-plan checkpoint with the command, guard variables, sanitized report,
and the fact that hosted storage/scanning remain unavailable.

## Step 5 — Staging-only execution and browser assessment

After local verification, commit and push only the reviewed source/docs/tests.
Deploy the existing `sukoon-web` branch/service, wait for the exact commit to
be Live, and run the explicit enrichment command with the staging confirmation
against the existing staging database only. Re-login with the existing
staging-review flow and inspect Home, Properties, Bills, Maintenance,
Construction, Buy/Sell, Search, and Updates. Record counts and conflicts;
report any hosted blocker without reseeding or touching unrelated services.
