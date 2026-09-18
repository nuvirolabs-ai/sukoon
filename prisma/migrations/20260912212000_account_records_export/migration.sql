ALTER TABLE "PrivacyRequest" DROP CONSTRAINT "PrivacyRequest_status_check";
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_status_check" CHECK ("status" IN ('AWAITING_POLICY','CANCELLED','QUEUED','PROCESSING','READY','FAILED','EXPIRED'));
ALTER TABLE "PrivacyRequest" ADD COLUMN "exportScope" TEXT, ADD COLUMN "expiresAt" TIMESTAMP(3), ADD COLUMN "artifactKey" TEXT, ADD COLUMN "artifactSha256" TEXT, ADD COLUMN "failureCode" TEXT, ADD COLUMN "completedAt" TIMESTAMP(3);
