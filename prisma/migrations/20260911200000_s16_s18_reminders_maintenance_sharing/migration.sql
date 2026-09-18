-- AlterTable
ALTER TABLE "Maintenance" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Other',
ADD COLUMN     "contactDetails" TEXT,
ADD COLUMN     "dateCompleted" TEXT,
ADD COLUMN     "dateStarted" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'OWNER_REPORTED';

-- AlterTable
ALTER TABLE "Obligation" ADD COLUMN     "maintenanceId" TEXT;

-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "inviteeEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "inviteeUserId" TEXT;

-- CreateTable
CREATE TABLE "DurableReminder" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "obligationId" TEXT,
    "occurrenceId" TEXT,
    "offsetDays" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "localTime" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "readAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureState" TEXT,
    "failureReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "deepLink" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DurableReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderAttempt" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "providerOutcome" TEXT,
    "providerMessageId" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "detail" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceDocumentLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT,
    "linkType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceDocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareOperation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DurableReminder_idempotencyKey_key" ON "DurableReminder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DurableReminder_workspaceId_propertyId_state_scheduledAt_idx" ON "DurableReminder"("workspaceId", "propertyId", "state", "scheduledAt");

-- CreateIndex
CREATE INDEX "DurableReminder_obligationId_occurrenceId_channel_idx" ON "DurableReminder"("obligationId", "occurrenceId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "DurableReminder_id_workspaceId_key" ON "DurableReminder"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderAttempt_idempotencyKey_key" ON "ReminderAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReminderAttempt_workspaceId_reminderId_attemptedAt_idx" ON "ReminderAttempt"("workspaceId", "reminderId", "attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderAttempt_reminderId_attemptNumber_key" ON "ReminderAttempt"("reminderId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceEvent_idempotencyKey_key" ON "MaintenanceEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MaintenanceEvent_workspaceId_propertyId_maintenanceId_creat_idx" ON "MaintenanceEvent"("workspaceId", "propertyId", "maintenanceId", "createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceDocumentLink_workspaceId_propertyId_maintenanceI_idx" ON "MaintenanceDocumentLink"("workspaceId", "propertyId", "maintenanceId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceDocumentLink_maintenanceId_documentId_linkType_key" ON "MaintenanceDocumentLink"("maintenanceId", "documentId", "linkType");

-- CreateIndex
CREATE INDEX "ShareOperation_workspaceId_propertyId_shareLinkId_createdAt_idx" ON "ShareOperation"("workspaceId", "propertyId", "shareLinkId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Maintenance_idempotencyKey_key" ON "Maintenance"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Obligation_maintenanceId_key" ON "Obligation"("maintenanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Obligation_maintenanceId_workspaceId_key" ON "Obligation"("maintenanceId", "workspaceId");

-- AddForeignKey
ALTER TABLE "DurableReminder" ADD CONSTRAINT "DurableReminder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DurableReminder" ADD CONSTRAINT "DurableReminder_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DurableReminder" ADD CONSTRAINT "DurableReminder_obligationId_workspaceId_fkey" FOREIGN KEY ("obligationId", "workspaceId") REFERENCES "Obligation"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DurableReminder" ADD CONSTRAINT "DurableReminder_occurrenceId_workspaceId_fkey" FOREIGN KEY ("occurrenceId", "workspaceId") REFERENCES "ObligationOccurrence"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderAttempt" ADD CONSTRAINT "ReminderAttempt_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderAttempt" ADD CONSTRAINT "ReminderAttempt_reminderId_workspaceId_fkey" FOREIGN KEY ("reminderId", "workspaceId") REFERENCES "DurableReminder"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceEvent" ADD CONSTRAINT "MaintenanceEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceEvent" ADD CONSTRAINT "MaintenanceEvent_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceEvent" ADD CONSTRAINT "MaintenanceEvent_maintenanceId_workspaceId_fkey" FOREIGN KEY ("maintenanceId", "workspaceId") REFERENCES "Maintenance"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceDocumentLink" ADD CONSTRAINT "MaintenanceDocumentLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceDocumentLink" ADD CONSTRAINT "MaintenanceDocumentLink_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceDocumentLink" ADD CONSTRAINT "MaintenanceDocumentLink_maintenanceId_workspaceId_fkey" FOREIGN KEY ("maintenanceId", "workspaceId") REFERENCES "Maintenance"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceDocumentLink" ADD CONSTRAINT "MaintenanceDocumentLink_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceDocumentLink" ADD CONSTRAINT "MaintenanceDocumentLink_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareOperation" ADD CONSTRAINT "ShareOperation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareOperation" ADD CONSTRAINT "ShareOperation_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareOperation" ADD CONSTRAINT "ShareOperation_shareLinkId_workspaceId_fkey" FOREIGN KEY ("shareLinkId", "workspaceId") REFERENCES "ShareLink"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareOperation" ADD CONSTRAINT "ShareOperation_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareOperation" ADD CONSTRAINT "ShareOperation_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_maintenanceId_workspaceId_fkey" FOREIGN KEY ("maintenanceId", "workspaceId") REFERENCES "Maintenance"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ObligationPayment_workspaceId_propertyId_occurrenceId_status_id" RENAME TO "ObligationPayment_workspaceId_propertyId_occurrenceId_statu_idx";
