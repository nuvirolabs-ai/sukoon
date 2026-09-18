
-- AlterTable
ALTER TABLE "ConstructionProject" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "areaUnit" TEXT NOT NULL DEFAULT 'sqft',
ADD COLUMN     "builtUpArea" DECIMAL(14,3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completionSummary" JSONB,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "currentStageId" TEXT,
ADD COLUMN     "floorCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "initialBudgetPaise" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "projectType" TEXT NOT NULL DEFAULT 'NEW_HOME',
ADD COLUMN     "qualityLevel" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "requirements" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PLANNING',
ADD COLUMN     "targetCompletionDate" TEXT,
ADD COLUMN     "templateVersion" TEXT NOT NULL DEFAULT 'legacy';

-- CreateTable
CREATE TABLE "ConstructionStage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "expectedStart" TEXT,
    "expectedEnd" TEXT,
    "actualStart" TEXT,
    "actualEnd" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "dependsOnId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'USER_ENTERED',

    CONSTRAINT "ConstructionStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionTask" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dueDate" TEXT,
    "assignedContactId" TEXT,
    "dependsOnId" TEXT,
    "estimatePaise" BIGINT NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "completedAt" TIMESTAMP(3),
    "required" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'USER_ENTERED',

    CONSTRAINT "ConstructionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionBudgetItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "category" TEXT NOT NULL,
    "estimatedPaise" BIGINT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ConstructionBudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionCost" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "taskId" TEXT,
    "budgetItemId" TEXT,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ledgerEntryId" TEXT,
    "obligationId" TEXT,
    "documentLinkId" TEXT,
    "recordedDate" TEXT NOT NULL,

    CONSTRAINT "ConstructionCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequirement" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "requiredByDate" TEXT,
    "estimatedUnitRatePaise" BIGINT NOT NULL DEFAULT 0,
    "actualUnitRatePaise" BIGINT,
    "supplierContactId" TEXT,
    "provenance" TEXT NOT NULL DEFAULT 'USER_ENTERED',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "MaterialRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialPriceEntry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "grade" TEXT NOT NULL DEFAULT '',
    "dealer" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL,
    "recordedDate" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "pricePaise" BIGINT NOT NULL,
    "provenance" TEXT NOT NULL DEFAULT 'USER_ENTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialPriceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementNeed" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "supplierContactId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ProcurementNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionContact" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "provenance" TEXT NOT NULL DEFAULT 'OWNER_ENTERED',

    CONSTRAINT "ConstructionContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionUpdate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issueStatus" TEXT NOT NULL DEFAULT 'NONE',
    "createdBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionDocumentLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "taskId" TEXT,
    "updateId" TEXT,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionDocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PROJECT',
    "payload" JSONB NOT NULL,
    "requestKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionStage_id_projectId_workspaceId_key" ON "ConstructionStage"("id", "projectId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionStage_projectId_sequence_key" ON "ConstructionStage"("projectId", "sequence");

-- CreateIndex
CREATE INDEX "ConstructionTask_projectId_stageId_status_idx" ON "ConstructionTask"("projectId", "stageId", "status");

-- CreateIndex
CREATE INDEX "ConstructionBudgetItem_projectId_idx" ON "ConstructionBudgetItem"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionCost_ledgerEntryId_key" ON "ConstructionCost"("ledgerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionCost_obligationId_key" ON "ConstructionCost"("obligationId");

-- CreateIndex
CREATE INDEX "ConstructionCost_projectId_idx" ON "ConstructionCost"("projectId");

-- CreateIndex
CREATE INDEX "MaterialRequirement_projectId_requiredByDate_idx" ON "MaterialRequirement"("projectId", "requiredByDate");

-- CreateIndex
CREATE INDEX "MaterialPriceEntry_projectId_materialId_recordedDate_idx" ON "MaterialPriceEntry"("projectId", "materialId", "recordedDate");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementNeed_projectId_materialId_key" ON "ProcurementNeed"("projectId", "materialId");

-- CreateIndex
CREATE INDEX "ConstructionContact_projectId_idx" ON "ConstructionContact"("projectId");

-- CreateIndex
CREATE INDEX "ConstructionUpdate_projectId_occurredAt_idx" ON "ConstructionUpdate"("projectId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionDocumentLink_projectId_documentVersionId_key" ON "ConstructionDocumentLink"("projectId", "documentVersionId");

-- CreateIndex
CREATE INDEX "ConstructionEvent_projectId_createdAt_idx" ON "ConstructionEvent"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionEvent_projectId_requestKey_key" ON "ConstructionEvent"("projectId", "requestKey");

-- AddForeignKey
ALTER TABLE "ConstructionStage" ADD CONSTRAINT "ConstructionStage_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionTask" ADD CONSTRAINT "ConstructionTask_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionBudgetItem" ADD CONSTRAINT "ConstructionBudgetItem_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionCost" ADD CONSTRAINT "ConstructionCost_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequirement" ADD CONSTRAINT "MaterialRequirement_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialPriceEntry" ADD CONSTRAINT "MaterialPriceEntry_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementNeed" ADD CONSTRAINT "ProcurementNeed_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionContact" ADD CONSTRAINT "ConstructionContact_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionUpdate" ADD CONSTRAINT "ConstructionUpdate_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDocumentLink" ADD CONSTRAINT "ConstructionDocumentLink_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionEvent" ADD CONSTRAINT "ConstructionEvent_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "ConstructionProject"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;


