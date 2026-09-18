-- S05-S08: typed Property Passport provenance and durable worker jobs.
-- This migration is append-only. It does not reset or seed any records.

DROP INDEX "OutboxEvent_processedAt_createdAt_idx";

ALTER TABLE "OutboxEvent"
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "deadLetteredAt" TIMESTAMP(3),
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "lastError" JSONB,
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lockedBy" TEXT,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'queued';

ALTER TABLE "Property"
  ADD COLUMN "areaType" TEXT,
  ADD COLUMN "areaUnit" TEXT,
  ADD COLUMN "areaValue" TEXT,
  ADD COLUMN "identifiers" JSONB,
  ADD COLUMN "jurisdiction" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "ownershipAssertion" TEXT NOT NULL DEFAULT 'self_asserted',
  ADD COLUMN "ownershipProvenance" TEXT NOT NULL DEFAULT '';

CREATE TABLE "PropertyHistory" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "previousValue" JSONB,
  "nextValue" JSONB,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobEffect" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "effectKey" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "result" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobEffect_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyHistory_workspaceId_propertyId_createdAt_idx" ON "PropertyHistory"("workspaceId", "propertyId", "createdAt");
CREATE UNIQUE INDEX "JobEffect_jobId_key" ON "JobEffect"("jobId");
CREATE UNIQUE INDEX "JobEffect_effectKey_key" ON "JobEffect"("effectKey");
CREATE INDEX "JobEffect_aggregateType_aggregateId_idx" ON "JobEffect"("aggregateType", "aggregateId");
CREATE UNIQUE INDEX "OutboxEvent_idempotencyKey_key" ON "OutboxEvent"("idempotencyKey");
CREATE INDEX "OutboxEvent_status_nextAttemptAt_createdAt_idx" ON "OutboxEvent"("status", "nextAttemptAt", "createdAt");
CREATE INDEX "OutboxEvent_lockedAt_status_idx" ON "OutboxEvent"("lockedAt", "status");

ALTER TABLE "PropertyHistory" ADD CONSTRAINT "PropertyHistory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyHistory" ADD CONSTRAINT "PropertyHistory_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobEffect" ADD CONSTRAINT "JobEffect_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OutboxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
