ALTER TABLE "user" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'owner';

CREATE TABLE "ChecklistRule" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "propertyType" TEXT,
    "ownershipContext" TEXT,
    "evidenceCategory" TEXT,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TEXT NOT NULL,
    "effectiveUntil" TEXT,
    "sourceName" TEXT,
    "sourceReference" JSONB,
    "sourcePublishedDate" TEXT,
    "reviewer" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChecklistRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RuleAuditEvent" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RuleAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "propertyVersion" INTEGER NOT NULL,
    "assessment" TEXT NOT NULL,
    "score" INTEGER,
    "applicableCount" INTEGER NOT NULL,
    "satisfiedCount" INTEGER NOT NULL,
    "unknownCount" INTEGER NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatorUserId" TEXT,
    CONSTRAINT "AssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleStableKey" TEXT NOT NULL,
    "ruleVersion" INTEGER,
    "requirement" TEXT NOT NULL,
    "applicability" TEXT NOT NULL,
    "evidenceState" TEXT NOT NULL,
    "evidenceDocumentId" TEXT,
    "evidenceDocumentVersionId" TEXT,
    "contribution" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "suggestedAction" TEXT,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amountPaise" BIGINT,
    "currency" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "recurrenceType" TEXT NOT NULL,
    "recurrenceDay" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'USER_ENTERED',
    "notes" TEXT,
    "reminderConfig" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ObligationOccurrence" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "cycleKey" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "amountPaise" BIGINT,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL DEFAULT 'GENERATED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ObligationOccurrence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ObligationPayment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "amountPaise" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "source" TEXT NOT NULL DEFAULT 'USER_ENTERED',
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "receiptDocumentId" TEXT,
    "receiptDocumentVersionId" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ObligationPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseLedgerEntry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "paymentId" TEXT,
    "obligationId" TEXT,
    "occurrenceId" TEXT,
    "amountPaise" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChecklistRule_stableKey_version_key" ON "ChecklistRule"("stableKey", "version");
CREATE INDEX "ChecklistRule_status_effectiveFrom_effectiveUntil_idx" ON "ChecklistRule"("status", "effectiveFrom", "effectiveUntil");
CREATE INDEX "ChecklistRule_stableKey_status_idx" ON "ChecklistRule"("stableKey", "status");
CREATE INDEX "RuleAuditEvent_ruleId_createdAt_idx" ON "RuleAuditEvent"("ruleId", "createdAt");
CREATE INDEX "RuleAuditEvent_actorUserId_createdAt_idx" ON "RuleAuditEvent"("actorUserId", "createdAt");
CREATE UNIQUE INDEX "AssessmentSnapshot_id_workspaceId_key" ON "AssessmentSnapshot"("id", "workspaceId");
CREATE INDEX "AssessmentSnapshot_workspaceId_propertyId_evaluatedAt_idx" ON "AssessmentSnapshot"("workspaceId", "propertyId", "evaluatedAt");
CREATE UNIQUE INDEX "AssessmentItem_id_workspaceId_key" ON "AssessmentItem"("id", "workspaceId");
CREATE INDEX "AssessmentItem_workspaceId_propertyId_evidenceState_idx" ON "AssessmentItem"("workspaceId", "propertyId", "evidenceState");
CREATE INDEX "AssessmentItem_snapshotId_workspaceId_idx" ON "AssessmentItem"("snapshotId", "workspaceId");
CREATE UNIQUE INDEX "Obligation_id_workspaceId_key" ON "Obligation"("id", "workspaceId");
CREATE INDEX "Obligation_workspaceId_propertyId_active_dueDate_idx" ON "Obligation"("workspaceId", "propertyId", "active", "dueDate");
CREATE UNIQUE INDEX "ObligationOccurrence_obligationId_cycleKey_key" ON "ObligationOccurrence"("obligationId", "cycleKey");
CREATE UNIQUE INDEX "ObligationOccurrence_id_workspaceId_key" ON "ObligationOccurrence"("id", "workspaceId");
CREATE INDEX "ObligationOccurrence_workspaceId_propertyId_dueDate_status_idx" ON "ObligationOccurrence"("workspaceId", "propertyId", "dueDate", "status");
CREATE UNIQUE INDEX "ObligationPayment_idempotencyKey_key" ON "ObligationPayment"("idempotencyKey");
CREATE UNIQUE INDEX "ObligationPayment_id_workspaceId_key" ON "ObligationPayment"("id", "workspaceId");
CREATE INDEX "ObligationPayment_workspaceId_propertyId_occurrenceId_status_idx" ON "ObligationPayment"("workspaceId", "propertyId", "occurrenceId", "status");
CREATE UNIQUE INDEX "ExpenseLedgerEntry_paymentId_key" ON "ExpenseLedgerEntry"("paymentId");
CREATE UNIQUE INDEX "ExpenseLedgerEntry_canonicalKey_key" ON "ExpenseLedgerEntry"("canonicalKey");
CREATE INDEX "ExpenseLedgerEntry_workspaceId_propertyId_createdAt_idx" ON "ExpenseLedgerEntry"("workspaceId", "propertyId", "createdAt");

ALTER TABLE "ChecklistRule" ADD CONSTRAINT "ChecklistRule_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "ChecklistRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RuleAuditEvent" ADD CONSTRAINT "RuleAuditEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ChecklistRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleAuditEvent" ADD CONSTRAINT "RuleAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentSnapshot" ADD CONSTRAINT "AssessmentSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentSnapshot" ADD CONSTRAINT "AssessmentSnapshot_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentSnapshot" ADD CONSTRAINT "AssessmentSnapshot_evaluatorUserId_fkey" FOREIGN KEY ("evaluatorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_snapshotId_workspaceId_fkey" FOREIGN KEY ("snapshotId", "workspaceId") REFERENCES "AssessmentSnapshot"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ChecklistRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationOccurrence" ADD CONSTRAINT "ObligationOccurrence_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationOccurrence" ADD CONSTRAINT "ObligationOccurrence_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationOccurrence" ADD CONSTRAINT "ObligationOccurrence_obligationId_workspaceId_fkey" FOREIGN KEY ("obligationId", "workspaceId") REFERENCES "Obligation"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationPayment" ADD CONSTRAINT "ObligationPayment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationPayment" ADD CONSTRAINT "ObligationPayment_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationPayment" ADD CONSTRAINT "ObligationPayment_obligationId_workspaceId_fkey" FOREIGN KEY ("obligationId", "workspaceId") REFERENCES "Obligation"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationPayment" ADD CONSTRAINT "ObligationPayment_occurrenceId_workspaceId_fkey" FOREIGN KEY ("occurrenceId", "workspaceId") REFERENCES "ObligationOccurrence"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObligationPayment" ADD CONSTRAINT "ObligationPayment_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "ObligationPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseLedgerEntry" ADD CONSTRAINT "ExpenseLedgerEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseLedgerEntry" ADD CONSTRAINT "ExpenseLedgerEntry_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseLedgerEntry" ADD CONSTRAINT "ExpenseLedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ObligationPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
