-- CreateTable
CREATE TABLE "SearchProjection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "documentId" TEXT,
    "documentVersionId" TEXT,
    "entityType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "searchableText" TEXT,
    "searchableChunks" JSONB,
    "searchableTextChars" INTEGER NOT NULL DEFAULT 0,
    "reviewState" TEXT NOT NULL,
    "visibilityState" TEXT NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportPackage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "includePropertyMetadata" BOOLEAN NOT NULL DEFAULT false,
    "selectionHash" TEXT NOT NULL,
    "artifactStorageKey" TEXT,
    "artifactSha256" TEXT,
    "artifactSizeBytes" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "manifest" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportPackageItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "propertyId" TEXT,
    "providerEnvironment" TEXT NOT NULL,
    "outputState" TEXT NOT NULL,
    "inputChars" INTEGER NOT NULL,
    "retrievalCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostPaise" BIGINT,
    "actualCostPaise" BIGINT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceReference" JSONB NOT NULL,
    "reviewer" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "effectiveFrom" TEXT NOT NULL,
    "expiresAt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchProjection_workspaceId_propertyId_entityType_visibili_idx" ON "SearchProjection"("workspaceId", "propertyId", "entityType", "visibilityState");

-- CreateIndex
CREATE INDEX "SearchProjection_workspaceId_updatedAt_idx" ON "SearchProjection"("workspaceId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SearchProjection_workspaceId_entityType_propertyId_document_key" ON "SearchProjection"("workspaceId", "entityType", "propertyId", "documentId", "documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExportPackage_idempotencyKey_key" ON "ExportPackage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ExportPackage_workspaceId_propertyId_status_expiresAt_idx" ON "ExportPackage"("workspaceId", "propertyId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "ExportPackage_requestedByUserId_createdAt_idx" ON "ExportPackage"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExportPackage_id_workspaceId_key" ON "ExportPackage"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "ExportPackageItem_workspaceId_propertyId_packageId_idx" ON "ExportPackageItem"("workspaceId", "propertyId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "ExportPackageItem_packageId_documentId_documentVersionId_key" ON "ExportPackageItem"("packageId", "documentId", "documentVersionId");

-- CreateIndex
CREATE INDEX "AssistantRequest_workspaceId_requestedByUserId_createdAt_idx" ON "AssistantRequest"("workspaceId", "requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantRequest_workspaceId_propertyId_createdAt_idx" ON "AssistantRequest"("workspaceId", "propertyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EducationContent_slug_key" ON "EducationContent"("slug");

-- CreateIndex
CREATE INDEX "EducationContent_contentType_status_effectiveFrom_expiresAt_idx" ON "EducationContent"("contentType", "status", "effectiveFrom", "expiresAt");

-- AddForeignKey
ALTER TABLE "SearchProjection" ADD CONSTRAINT "SearchProjection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchProjection" ADD CONSTRAINT "SearchProjection_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchProjection" ADD CONSTRAINT "SearchProjection_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchProjection" ADD CONSTRAINT "SearchProjection_documentVersionId_workspaceId_fkey" FOREIGN KEY ("documentVersionId", "workspaceId") REFERENCES "DocumentVersion"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackage" ADD CONSTRAINT "ExportPackage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackage" ADD CONSTRAINT "ExportPackage_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackage" ADD CONSTRAINT "ExportPackage_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackageItem" ADD CONSTRAINT "ExportPackageItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackageItem" ADD CONSTRAINT "ExportPackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ExportPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackageItem" ADD CONSTRAINT "ExportPackageItem_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackageItem" ADD CONSTRAINT "ExportPackageItem_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackageItem" ADD CONSTRAINT "ExportPackageItem_documentVersionId_workspaceId_fkey" FOREIGN KEY ("documentVersionId", "workspaceId") REFERENCES "DocumentVersion"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_propertyId_workspaceId_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
