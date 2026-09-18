-- Allow one Vault version to be relevant in several Construction contexts.
-- The same version in the same context still links only once.
DROP INDEX "ConstructionDocumentLink_projectId_documentVersionId_key";
CREATE UNIQUE INDEX "ConstructionDocumentLink_projectId_documentVersionId_contextType_contextId_key" ON "ConstructionDocumentLink"("projectId", "documentVersionId", "contextType", "contextId");
