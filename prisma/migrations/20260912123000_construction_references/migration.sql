
-- CreateIndex
CREATE UNIQUE INDEX "ConstructionCost_obligationId_workspaceId_key" ON "ConstructionCost"("obligationId", "workspaceId");

-- AddForeignKey
ALTER TABLE "ConstructionTask" ADD CONSTRAINT "ConstructionTask_stageId_projectId_workspaceId_fkey" FOREIGN KEY ("stageId", "projectId", "workspaceId") REFERENCES "ConstructionStage"("id", "projectId", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionCost" ADD CONSTRAINT "ConstructionCost_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "ExpenseLedgerEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionCost" ADD CONSTRAINT "ConstructionCost_obligationId_workspaceId_fkey" FOREIGN KEY ("obligationId", "workspaceId") REFERENCES "Obligation"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDocumentLink" ADD CONSTRAINT "ConstructionDocumentLink_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDocumentLink" ADD CONSTRAINT "ConstructionDocumentLink_documentVersionId_workspaceId_fkey" FOREIGN KEY ("documentVersionId", "workspaceId") REFERENCES "DocumentVersion"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;


