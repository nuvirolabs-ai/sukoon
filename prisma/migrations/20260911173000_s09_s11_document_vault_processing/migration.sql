-- S09-S11 extend the existing private document row into a logical document
-- with immutable version records and isolated parsing/AI evidence.

-- AlterTable
ALTER TABLE "PropertyDoc" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "originalFilename" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provenance" TEXT NOT NULL DEFAULT 'user_uploaded',
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'awaiting_review',
ADD COLUMN     "scanStatus" TEXT NOT NULL DEFAULT 'scan_pending',
ADD COLUMN     "sha256" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subtype" TEXT,
ADD COLUMN     "uploadedBy" TEXT;

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "scanStatus" TEXT NOT NULL,
    "processingState" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'user_uploaded',
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentParsingRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "pageCount" INTEGER,
    "textChars" INTEGER NOT NULL DEFAULT 0,
    "textChunks" JSONB,
    "error" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentParsingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiExtractionRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "parsingRunId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "providerEnvironment" TEXT NOT NULL,
    "response" JSONB,
    "error" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiExtractionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFieldProposal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "proposedValue" JSONB NOT NULL,
    "acceptedValue" JSONB,
    "state" TEXT NOT NULL DEFAULT 'proposed',
    "sourcePage" INTEGER,
    "sourceChunk" TEXT,
    "extractionMethod" TEXT NOT NULL,
    "confidence" JSONB,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiFieldProposal_pkey" PRIMARY KEY ("id")
);

-- Backfill existing logical documents as version 1. Old rows remain scan-pending
-- because the former signature check was not a malware scan.
INSERT INTO "DocumentVersion" (
    "id", "workspaceId", "documentId", "version", "originalFilename", "displayName",
    "mimeType", "sizeBytes", "sha256", "storageKey", "scanStatus", "processingState",
    "reviewStatus", "source", "uploadedBy", "uploadedAt", "createdAt", "updatedAt"
)
SELECT
    d."id" || ':v1', d."workspaceId", d."id", 1,
    COALESCE(NULLIF(d."originalFilename", ''), d."name"),
    COALESCE(NULLIF(d."displayName", ''), d."name"),
    d."mimeType", d."sizeBytes", d."sha256", d."storageKey", d."scanStatus",
    d."processingState", d."reviewStatus", d."provenance", COALESCE(d."uploadedBy", w."ownerUserId"),
    d."createdAt", d."createdAt", d."updatedAt"
FROM "PropertyDoc" d
JOIN "Workspace" w ON w."id" = d."workspaceId";

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_id_workspaceId_key" ON "DocumentVersion"("id", "workspaceId");
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");
CREATE INDEX "DocumentVersion_workspaceId_documentId_version_idx" ON "DocumentVersion"("workspaceId", "documentId", "version");
CREATE UNIQUE INDEX "DocumentParsingRun_idempotencyKey_key" ON "DocumentParsingRun"("idempotencyKey");
CREATE UNIQUE INDEX "DocumentParsingRun_id_workspaceId_key" ON "DocumentParsingRun"("id", "workspaceId");
CREATE INDEX "DocumentParsingRun_workspaceId_documentId_createdAt_idx" ON "DocumentParsingRun"("workspaceId", "documentId", "createdAt");
CREATE UNIQUE INDEX "AiExtractionRun_idempotencyKey_key" ON "AiExtractionRun"("idempotencyKey");
CREATE UNIQUE INDEX "AiExtractionRun_id_workspaceId_key" ON "AiExtractionRun"("id", "workspaceId");
CREATE INDEX "AiExtractionRun_workspaceId_documentId_createdAt_idx" ON "AiExtractionRun"("workspaceId", "documentId", "createdAt");
CREATE UNIQUE INDEX "AiFieldProposal_id_workspaceId_key" ON "AiFieldProposal"("id", "workspaceId");
CREATE INDEX "AiFieldProposal_workspaceId_documentId_state_idx" ON "AiFieldProposal"("workspaceId", "documentId", "state");
CREATE UNIQUE INDEX "PropertyDoc_idempotencyKey_key" ON "PropertyDoc"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentParsingRun" ADD CONSTRAINT "DocumentParsingRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentParsingRun" ADD CONSTRAINT "DocumentParsingRun_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentParsingRun" ADD CONSTRAINT "DocumentParsingRun_documentVersionId_workspaceId_fkey" FOREIGN KEY ("documentVersionId", "workspaceId") REFERENCES "DocumentVersion"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiExtractionRun" ADD CONSTRAINT "AiExtractionRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiExtractionRun" ADD CONSTRAINT "AiExtractionRun_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiExtractionRun" ADD CONSTRAINT "AiExtractionRun_documentVersionId_workspaceId_fkey" FOREIGN KEY ("documentVersionId", "workspaceId") REFERENCES "DocumentVersion"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiFieldProposal" ADD CONSTRAINT "AiFieldProposal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiFieldProposal" ADD CONSTRAINT "AiFieldProposal_runId_workspaceId_fkey" FOREIGN KEY ("runId", "workspaceId") REFERENCES "AiExtractionRun"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiFieldProposal" ADD CONSTRAINT "AiFieldProposal_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiFieldProposal" ADD CONSTRAINT "AiFieldProposal_documentVersionId_workspaceId_fkey" FOREIGN KEY ("documentVersionId", "workspaceId") REFERENCES "DocumentVersion"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
