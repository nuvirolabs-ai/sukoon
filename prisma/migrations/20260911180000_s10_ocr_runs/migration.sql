-- S10 keeps parser attempts and OCR attempts as separate durable evidence.

CREATE TABLE "DocumentOcrRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "providerEnvironment" TEXT NOT NULL,
    "pageCount" INTEGER,
    "textChars" INTEGER NOT NULL DEFAULT 0,
    "textChunks" JSONB,
    "error" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentOcrRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentOcrRun_idempotencyKey_key" ON "DocumentOcrRun"("idempotencyKey");
CREATE UNIQUE INDEX "DocumentOcrRun_id_workspaceId_key" ON "DocumentOcrRun"("id", "workspaceId");
CREATE INDEX "DocumentOcrRun_workspaceId_documentId_createdAt_idx" ON "DocumentOcrRun"("workspaceId", "documentId", "createdAt");

ALTER TABLE "DocumentOcrRun" ADD CONSTRAINT "DocumentOcrRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentOcrRun" ADD CONSTRAINT "DocumentOcrRun_documentId_workspaceId_fkey" FOREIGN KEY ("documentId", "workspaceId") REFERENCES "PropertyDoc"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentOcrRun" ADD CONSTRAINT "DocumentOcrRun_documentVersionId_workspaceId_fkey" FOREIGN KEY ("documentVersionId", "workspaceId") REFERENCES "DocumentVersion"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
