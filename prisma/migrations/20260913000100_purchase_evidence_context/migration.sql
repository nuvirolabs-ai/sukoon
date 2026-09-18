ALTER TABLE "PropertyDoc" ALTER COLUMN "propertyId" DROP NOT NULL;
ALTER TABLE "PropertyDoc" ADD COLUMN "purchaseCandidateId" TEXT;
ALTER TABLE "PropertyDoc" ADD CONSTRAINT "PropertyDoc_purchaseCandidateId_workspaceId_fkey" FOREIGN KEY ("purchaseCandidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyDoc" ADD CONSTRAINT "PropertyDoc_exactly_one_context" CHECK (("propertyId" IS NOT NULL)::int + ("purchaseCandidateId" IS NOT NULL)::int = 1);
ALTER TABLE "PurchaseEntry" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "state" TEXT NOT NULL DEFAULT 'OPEN';
CREATE TABLE "PurchaseEvidenceEvent" (
 "id" TEXT PRIMARY KEY, "entryId" TEXT NOT NULL REFERENCES "PurchaseEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "action" TEXT NOT NULL, "note" TEXT NOT NULL, "source" TEXT NOT NULL, "actorUserId" TEXT NOT NULL,
 "documentVersionId" TEXT REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "requestKey" TEXT NOT NULL UNIQUE, "payloadHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PurchaseEvidenceEvent_entryId_createdAt_idx" ON "PurchaseEvidenceEvent"("entryId", "createdAt");
CREATE FUNCTION purchase_evidence_context_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."documentVersionId" IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM "PurchaseEntry" e JOIN "DocumentVersion" v ON v.id=NEW."documentVersionId"
  JOIN "PropertyDoc" d ON d.id=v."documentId"
  WHERE e.id=NEW."entryId" AND d."purchaseCandidateId"=e."candidateId" AND d."propertyId" IS NULL AND d."workspaceId"=e."workspaceId" AND v."workspaceId"=e."workspaceId"
 ) THEN RAISE EXCEPTION 'PURCHASE_EVIDENCE_CONTEXT_MISMATCH'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER purchase_evidence_context_guard BEFORE INSERT OR UPDATE ON "PurchaseEvidenceEvent" FOR EACH ROW EXECUTE FUNCTION purchase_evidence_context_guard();
CREATE FUNCTION vault_context_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."propertyId" IS DISTINCT FROM NEW."propertyId" OR OLD."purchaseCandidateId" IS DISTINCT FROM NEW."purchaseCandidateId" OR OLD."workspaceId" IS DISTINCT FROM NEW."workspaceId" THEN RAISE EXCEPTION 'VAULT_CONTEXT_TRANSFER_NOT_SUPPORTED'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER vault_context_immutable BEFORE UPDATE ON "PropertyDoc" FOR EACH ROW EXECUTE FUNCTION vault_context_immutable();
DO $$ BEGIN
 IF to_regprocedure('synthetic_erasure_write_fence()') IS NOT NULL THEN
  CREATE TRIGGER synthetic_erasure_fence BEFORE INSERT OR UPDATE OR DELETE ON "PurchaseEvidenceEvent" FOR EACH ROW EXECUTE FUNCTION synthetic_erasure_write_fence();
 END IF;
END $$;
