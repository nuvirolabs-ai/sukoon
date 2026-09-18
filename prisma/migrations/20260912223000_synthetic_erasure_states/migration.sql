ALTER TABLE "PrivacyRequest" DROP CONSTRAINT "PrivacyRequest_status_check";
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_status_check" CHECK ("status" IN ('AWAITING_POLICY','CANCELLED','QUEUED','PROCESSING','READY','FAILED','EXPIRED','ERASING','ERASED'));
