-- Preserve write fences when an already-provisioned disposable erasure target
-- receives new domain tables. Normal targets have no synthetic trigger function.
DO $$
BEGIN
 IF to_regprocedure('synthetic_erasure_write_fence()') IS NOT NULL THEN
  CREATE TRIGGER synthetic_erasure_fence BEFORE INSERT OR UPDATE OR DELETE ON "PurchaseWorkspace" FOR EACH ROW EXECUTE FUNCTION synthetic_erasure_write_fence();
  CREATE TRIGGER synthetic_erasure_fence BEFORE INSERT OR UPDATE OR DELETE ON "PurchaseCandidate" FOR EACH ROW EXECUTE FUNCTION synthetic_erasure_write_fence();
  CREATE TRIGGER synthetic_erasure_fence BEFORE INSERT OR UPDATE OR DELETE ON "PurchaseEntry" FOR EACH ROW EXECUTE FUNCTION synthetic_erasure_write_fence();
 END IF;
END $$;
