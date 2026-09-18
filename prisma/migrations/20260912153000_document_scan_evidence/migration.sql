CREATE TABLE "DocumentScanEvidence" (
  "id" TEXT NOT NULL,
  "documentVersionId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentScanEvidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentScanEvidence_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DocumentScanEvidence_jobId_attempt_key" ON "DocumentScanEvidence"("jobId", "attempt");
CREATE INDEX "DocumentScanEvidence_documentVersionId_createdAt_idx" ON "DocumentScanEvidence"("documentVersionId", "createdAt");
