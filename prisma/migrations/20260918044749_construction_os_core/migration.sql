-- AlterTable
ALTER TABLE "ConstructionCost" ADD COLUMN     "commitmentId" TEXT;

-- AlterTable
ALTER TABLE "ConstructionDocumentLink" ADD COLUMN     "contextId" TEXT,
ADD COLUMN     "contextType" TEXT NOT NULL DEFAULT 'PROJECT',
ADD COLUMN     "label" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ConstructionProject" ADD COLUMN     "currentPlanVersionId" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- AlterTable
ALTER TABLE "ConstructionUpdate" ADD COLUMN     "decisionRequestIds" JSONB,
ADD COLUMN     "deliveryIds" JSONB,
ADD COLUMN     "photoRefs" JSONB,
ADD COLUMN     "weatherNote" TEXT,
ADD COLUMN     "workCompletedIds" JSONB,
ADD COLUMN     "workerCount" INTEGER;

-- CreateTable
CREATE TABLE "ConstructionPlanVersion" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "ConstructionPlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionMilestone" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "plannedDate" TEXT,
    "actualDate" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionDependency" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "predecessorType" TEXT NOT NULL,
    "predecessorId" TEXT NOT NULL,
    "successorType" TEXT NOT NULL,
    "successorId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'FINISH_TO_START',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionDecision" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "workItemId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "selectedOptionId" TEXT,
    "decisionComment" TEXT NOT NULL DEFAULT '',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionDecisionOption" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "estimatedCostImpactPaise" BIGINT NOT NULL DEFAULT 0,
    "estimatedScheduleImpactDays" INTEGER NOT NULL DEFAULT 0,
    "attachmentDocumentIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionDecisionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionIssue" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "workItemId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costImpactPaise" BIGINT,
    "scheduleImpactDays" INTEGER,
    "resolution" TEXT NOT NULL DEFAULT '',
    "resolvedAt" TIMESTAMP(3),
    "photoRefs" JSONB NOT NULL DEFAULT '[]',
    "attachmentDocumentIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionInspection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "workItemId" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "result" TEXT NOT NULL DEFAULT 'RECORDED',
    "notes" TEXT NOT NULL DEFAULT '',
    "checklist" JSONB,
    "issueIds" JSONB NOT NULL DEFAULT '[]',
    "documentIds" JSONB NOT NULL DEFAULT '[]',
    "photoRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionChange" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "originalScope" TEXT NOT NULL DEFAULT '',
    "revisedScope" TEXT NOT NULL DEFAULT '',
    "estimatedCostImpactPaise" BIGINT NOT NULL DEFAULT 0,
    "actualCostImpactPaise" BIGINT,
    "estimatedScheduleImpactDays" INTEGER NOT NULL DEFAULT 0,
    "actualScheduleImpactDays" INTEGER,
    "affectedWorkItemIds" JSONB NOT NULL DEFAULT '[]',
    "documentIds" JSONB NOT NULL DEFAULT '[]',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "implementedAt" TIMESTAMP(3),

    CONSTRAINT "ConstructionChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionCommitment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "budgetCategoryId" TEXT,
    "vendorOrPersonId" TEXT,
    "title" TEXT NOT NULL,
    "amountPaise" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "committedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedBy" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierQuote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialRequirementId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierId" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitRatePaise" BIGINT NOT NULL,
    "taxPaise" BIGINT NOT NULL DEFAULT 0,
    "deliveryChargePaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaise" BIGINT NOT NULL,
    "deliveryDate" TEXT,
    "validUntil" TEXT,
    "documentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionOrder" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialRequirementId" TEXT,
    "commitmentId" TEXT,
    "supplierName" TEXT NOT NULL,
    "supplierId" TEXT,
    "orderedQuantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "totalPaise" BIGINT NOT NULL,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionDelivery" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orderId" TEXT,
    "materialRequirementId" TEXT,
    "supplierName" TEXT,
    "expectedQuantity" DECIMAL(14,3),
    "receivedQuantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condition" TEXT,
    "challanDocumentId" TEXT,
    "photoRefs" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionGuidance" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "consequence" TEXT,
    "actionType" TEXT NOT NULL DEFAULT 'NONE',
    "actionTarget" TEXT,
    "relevanceKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "provenance" JSONB,
    "relevantUntil" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionGuidance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionHandover" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "handoverDate" TEXT,
    "finalRecordedSpendPaise" BIGINT,
    "finalPhotoRefs" JSONB NOT NULL DEFAULT '[]',
    "finalDocumentIds" JSONB NOT NULL DEFAULT '[]',
    "warranties" JSONB NOT NULL DEFAULT '[]',
    "manuals" JSONB NOT NULL DEFAULT '[]',
    "snagItemIds" JSONB NOT NULL DEFAULT '[]',
    "professionalRecords" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionHandover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConstructionPlanVersion_projectId_status_idx" ON "ConstructionPlanVersion"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionPlanVersion_id_projectId_workspaceId_key" ON "ConstructionPlanVersion"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionPlanVersion_projectId_versionNumber_key" ON "ConstructionPlanVersion"("projectId", "versionNumber");

-- CreateIndex
CREATE INDEX "ConstructionMilestone_projectId_stageId_idx" ON "ConstructionMilestone"("projectId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionMilestone_id_projectId_workspaceId_key" ON "ConstructionMilestone"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionDependency_projectId_successorType_successorId_idx" ON "ConstructionDependency"("projectId", "successorType", "successorId");

-- CreateIndex
CREATE INDEX "ConstructionDependency_projectId_predecessorType_predecesso_idx" ON "ConstructionDependency"("projectId", "predecessorType", "predecessorId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionDependency_id_projectId_workspaceId_key" ON "ConstructionDependency"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionDecision_projectId_status_idx" ON "ConstructionDecision"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionDecision_id_projectId_workspaceId_key" ON "ConstructionDecision"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionDecisionOption_projectId_decisionId_idx" ON "ConstructionDecisionOption"("projectId", "decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionDecisionOption_id_projectId_workspaceId_key" ON "ConstructionDecisionOption"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionIssue_projectId_status_idx" ON "ConstructionIssue"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionIssue_id_projectId_workspaceId_key" ON "ConstructionIssue"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionInspection_projectId_performedAt_idx" ON "ConstructionInspection"("projectId", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionInspection_id_projectId_workspaceId_key" ON "ConstructionInspection"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionChange_projectId_status_idx" ON "ConstructionChange"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionChange_id_projectId_workspaceId_key" ON "ConstructionChange"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionCommitment_projectId_status_idx" ON "ConstructionCommitment"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionCommitment_id_workspaceId_key" ON "ConstructionCommitment"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "SupplierQuote_projectId_materialRequirementId_idx" ON "SupplierQuote"("projectId", "materialRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuote_id_projectId_workspaceId_key" ON "SupplierQuote"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionOrder_projectId_status_idx" ON "ConstructionOrder"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionOrder_id_projectId_workspaceId_key" ON "ConstructionOrder"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionDelivery_projectId_orderId_idx" ON "ConstructionDelivery"("projectId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionDelivery_id_projectId_workspaceId_key" ON "ConstructionDelivery"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE INDEX "ConstructionGuidance_projectId_status_idx" ON "ConstructionGuidance"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionGuidance_projectId_relevanceKey_key" ON "ConstructionGuidance"("projectId", "relevanceKey");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionHandover_projectId_key" ON "ConstructionHandover"("projectId");

-- AddForeignKey
ALTER TABLE "ConstructionCost" ADD CONSTRAINT "ConstructionCost_commitmentId_workspaceId_fkey" FOREIGN KEY ("commitmentId", "workspaceId") REFERENCES "ConstructionCommitment"("id", "workspaceId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConstructionPlanVersion" ADD CONSTRAINT "ConstructionPlanVersion_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionMilestone" ADD CONSTRAINT "ConstructionMilestone_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDependency" ADD CONSTRAINT "ConstructionDependency_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDecision" ADD CONSTRAINT "ConstructionDecision_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDecisionOption" ADD CONSTRAINT "ConstructionDecisionOption_decisionId_projectId_workspaceI_fkey" FOREIGN KEY ("decisionId", "projectId", "workspaceId") REFERENCES "ConstructionDecision"("id", "projectId", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDecisionOption" ADD CONSTRAINT "ConstructionDecisionOption_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionIssue" ADD CONSTRAINT "ConstructionIssue_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionInspection" ADD CONSTRAINT "ConstructionInspection_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionChange" ADD CONSTRAINT "ConstructionChange_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionCommitment" ADD CONSTRAINT "ConstructionCommitment_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionOrder" ADD CONSTRAINT "ConstructionOrder_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDelivery" ADD CONSTRAINT "ConstructionDelivery_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionGuidance" ADD CONSTRAINT "ConstructionGuidance_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionHandover" ADD CONSTRAINT "ConstructionHandover_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
