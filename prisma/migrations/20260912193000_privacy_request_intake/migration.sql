-- Additive intake only. Does not delete or export any user records.
CREATE TABLE "PrivacyRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('EXPORT_ACCOUNT', 'DELETE_ACCOUNT', 'DELETE_PROPERTY')),
  "propertyId" TEXT,
  "requestKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AWAITING_POLICY' CHECK ("status" IN ('AWAITING_POLICY', 'CANCELLED')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrivacyRequest_scope_check" CHECK (("kind" = 'DELETE_PROPERTY') = ("propertyId" IS NOT NULL))
);
CREATE UNIQUE INDEX "PrivacyRequest_userId_requestKey_key" ON "PrivacyRequest"("userId", "requestKey");
CREATE INDEX "PrivacyRequest_userId_createdAt_idx" ON "PrivacyRequest"("userId", "createdAt");
