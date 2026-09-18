-- AlterTable
ALTER TABLE "ExpenseLedgerEntry" ADD COLUMN     "actorUserId" TEXT,
ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "replacementForId" TEXT,
ADD COLUMN     "reversalOfId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseLedgerEntry_reversalOfId_key" ON "ExpenseLedgerEntry"("reversalOfId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseLedgerEntry_replacementForId_key" ON "ExpenseLedgerEntry"("replacementForId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseLedgerEntry_id_workspaceId_propertyId_key" ON "ExpenseLedgerEntry"("id", "workspaceId", "propertyId");

-- AddForeignKey
ALTER TABLE "ExpenseLedgerEntry" ADD CONSTRAINT "ExpenseLedgerEntry_reversalOfId_workspaceId_propertyId_fkey" FOREIGN KEY ("reversalOfId", "workspaceId", "propertyId") REFERENCES "ExpenseLedgerEntry"("id", "workspaceId", "propertyId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ExpenseLedgerEntry" ADD CONSTRAINT "ExpenseLedgerEntry_replacementForId_workspaceId_propertyId_fkey" FOREIGN KEY ("replacementForId", "workspaceId", "propertyId") REFERENCES "ExpenseLedgerEntry"("id", "workspaceId", "propertyId") ON DELETE NO ACTION ON UPDATE NO ACTION;
