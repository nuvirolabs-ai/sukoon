-- AlterTable
ALTER TABLE "PropertyDoc" ADD COLUMN     "sourceCandidateId" TEXT,
ADD COLUMN     "sourceDocumentId" TEXT,
ADD COLUMN     "sourceSha256" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sourceVersionId" TEXT;
