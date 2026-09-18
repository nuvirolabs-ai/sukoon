CREATE TABLE "PurchaseWorkspace" (
 "id" TEXT PRIMARY KEY, "workspaceId" TEXT NOT NULL, "name" TEXT NOT NULL,
 "version" INTEGER NOT NULL DEFAULT 0, "requestKey" TEXT NOT NULL UNIQUE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 UNIQUE ("id", "workspaceId"), FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "PurchaseCandidate" (
 "id" TEXT PRIMARY KEY, "purchaseWorkspaceId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
 "name" TEXT NOT NULL, "propertyType" TEXT, "location" TEXT, "areaValue" TEXT, "areaUnit" TEXT,
 "askingPricePaise" BIGINT, "budgetPaise" BIGINT, "source" TEXT, "notes" TEXT,
 "stage" TEXT NOT NULL DEFAULT 'CONSIDERING', "version" INTEGER NOT NULL DEFAULT 0,
 "requestKey" TEXT NOT NULL UNIQUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 UNIQUE ("id", "workspaceId"), FOREIGN KEY ("purchaseWorkspaceId", "workspaceId") REFERENCES "PurchaseWorkspace"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
 CHECK ("askingPricePaise" IS NULL OR "askingPricePaise" >= 0), CHECK ("budgetPaise" IS NULL OR "budgetPaise" >= 0),
 CHECK ("stage" IN ('CONSIDERING', 'INFORMATION_GATHERING', 'REVIEWING', 'ON_HOLD', 'NOT_PROCEEDING'))
);
CREATE INDEX "PurchaseCandidate_purchaseWorkspaceId_idx" ON "PurchaseCandidate"("purchaseWorkspaceId");
CREATE TABLE "PurchaseEntry" (
 "id" TEXT PRIMARY KEY, "candidateId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
 "kind" TEXT NOT NULL, "body" TEXT NOT NULL, "requestKey" TEXT NOT NULL UNIQUE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
 CHECK ("kind" IN ('QUESTION', 'NOTE', 'DOCUMENT_REQUEST', 'HISTORY'))
);
CREATE INDEX "PurchaseEntry_candidateId_createdAt_idx" ON "PurchaseEntry"("candidateId", "createdAt");
