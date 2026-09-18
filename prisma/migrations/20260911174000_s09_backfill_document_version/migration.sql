-- Existing PropertyDoc rows were logical version 1 records before S09.
UPDATE "PropertyDoc"
SET "version" = 1
WHERE "version" = 0
  AND EXISTS (
    SELECT 1
    FROM "DocumentVersion" version
    WHERE version."documentId" = "PropertyDoc"."id"
      AND version."workspaceId" = "PropertyDoc"."workspaceId"
      AND version."version" = 1
  );
