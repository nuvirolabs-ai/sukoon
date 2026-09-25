-- Additive transaction organizer. Existing purchase stages stay unchanged.
ALTER TABLE "PurchaseEntry" ADD COLUMN "dueDate" TEXT;
ALTER TABLE "PurchaseCandidate" ADD COLUMN "transactionPhase" TEXT;
ALTER TABLE "PurchaseCandidate" ADD COLUMN "lifecycle" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "PurchaseCandidate" ADD COLUMN "linkedPropertyId" TEXT;
ALTER TABLE "PurchaseCandidate" ADD CONSTRAINT "PurchaseCandidate_transactionPhase_check" CHECK ("transactionPhase" IS NULL OR "transactionPhase" IN ('CONSIDERING', 'INFORMATION_GATHERING', 'REVIEWING', 'NEGOTIATING', 'TERMS_RECORDED', 'PRE_COMPLETION', 'HANDOVER', 'COMPLETED_RECORDED'));
ALTER TABLE "PurchaseCandidate" ADD CONSTRAINT "PurchaseCandidate_lifecycle_check" CHECK ("lifecycle" IN ('ACTIVE', 'ON_HOLD', 'NOT_PROCEEDING', 'ARCHIVED'));

CREATE TABLE "ScenarioManifest" (
  "id" TEXT PRIMARY KEY,
  "namespace" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL DEFAULT '',
  "anchorDate" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "report" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScenarioManifest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ScenarioManifest_namespace_workspaceId_subjectType_key" ON "ScenarioManifest"("namespace", "workspaceId", "subjectType");
CREATE INDEX "ScenarioManifest_workspaceId_idx" ON "ScenarioManifest"("workspaceId");

CREATE TABLE "SaleWorkspace" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "askingPricePaise" BIGINT,
  "possessionTargetDate" TEXT,
  "description" TEXT NOT NULL DEFAULT '',
  "phase" TEXT NOT NULL DEFAULT 'CONSIDERING',
  "lifecycle" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 0,
  "requestKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaleWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SaleWorkspace_property_fkey" FOREIGN KEY ("propertyId", "workspaceId") REFERENCES "Property"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SaleWorkspace_asking_check" CHECK ("askingPricePaise" IS NULL OR "askingPricePaise" >= 0)
);
CREATE UNIQUE INDEX "SaleWorkspace_requestKey_key" ON "SaleWorkspace"("requestKey");
CREATE UNIQUE INDEX "SaleWorkspace_id_workspaceId_key" ON "SaleWorkspace"("id", "workspaceId");
CREATE INDEX "SaleWorkspace_workspaceId_propertyId_idx" ON "SaleWorkspace"("workspaceId", "propertyId");

CREATE TABLE "SaleProspect" (
  "id" TEXT PRIMARY KEY,
  "saleWorkspaceId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "source" TEXT,
  "privateNotes" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'INTERESTED',
  "version" INTEGER NOT NULL DEFAULT 0,
  "requestKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaleProspect_sale_fkey" FOREIGN KEY ("saleWorkspaceId", "workspaceId") REFERENCES "SaleWorkspace"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SaleProspect_requestKey_key" ON "SaleProspect"("requestKey");
CREATE UNIQUE INDEX "SaleProspect_id_workspaceId_key" ON "SaleProspect"("id", "workspaceId");
CREATE INDEX "SaleProspect_saleWorkspaceId_idx" ON "SaleProspect"("saleWorkspaceId");

CREATE TABLE "OfferRevision" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT,
  "prospectId" TEXT,
  "saleWorkspaceId" TEXT,
  "amountPaise" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "authorSource" TEXT NOT NULL,
  "previousOfferId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RECORDED',
  "termsSnapshot" JSONB NOT NULL,
  "offeredOn" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfferRevision_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfferRevision_candidate_fkey" FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfferRevision_prospect_fkey" FOREIGN KEY ("prospectId", "workspaceId") REFERENCES "SaleProspect"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfferRevision_sale_fkey" FOREIGN KEY ("saleWorkspaceId", "workspaceId") REFERENCES "SaleWorkspace"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfferRevision_amount_check" CHECK ("amountPaise" > 0),
  CONSTRAINT "OfferRevision_parent_check" CHECK ((("candidateId" IS NOT NULL)::int + ("prospectId" IS NOT NULL)::int) = 1),
  CONSTRAINT "OfferRevision_status_check" CHECK ("status" IN ('DRAFT', 'RECORDED', 'COUNTERED', 'WITHDRAWN', 'EXPIRED', 'AGREEMENT_REPORTED'))
);
CREATE UNIQUE INDEX "OfferRevision_requestKey_key" ON "OfferRevision"("requestKey");
CREATE INDEX "OfferRevision_workspaceId_candidateId_idx" ON "OfferRevision"("workspaceId", "candidateId");
CREATE INDEX "OfferRevision_workspaceId_prospectId_idx" ON "OfferRevision"("workspaceId", "prospectId");

CREATE TABLE "TermsRevision" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT,
  "prospectId" TEXT,
  "saleWorkspaceId" TEXT,
  "revision" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "requestKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TermsRevision_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TermsRevision_candidate_fkey" FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TermsRevision_sale_fkey" FOREIGN KEY ("saleWorkspaceId", "workspaceId") REFERENCES "SaleWorkspace"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TermsRevision_requestKey_key" ON "TermsRevision"("requestKey");
CREATE INDEX "TermsRevision_workspaceId_candidateId_idx" ON "TermsRevision"("workspaceId", "candidateId");

CREATE TABLE "TermsAcknowledgement" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "termsRevisionId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "acknowledgementType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TermsAcknowledgement_terms_fkey" FOREIGN KEY ("termsRevisionId") REFERENCES "TermsRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TermsAcknowledgement_termsRevisionId_actorUserId_acknowledgementType_key" ON "TermsAcknowledgement"("termsRevisionId", "actorUserId", "acknowledgementType");
CREATE INDEX "TermsAcknowledgement_workspaceId_idx" ON "TermsAcknowledgement"("workspaceId");

CREATE TABLE "FinancingCase" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "sourceOfFunds" TEXT,
  "requestedPaise" BIGINT,
  "sanctionedPaise" BIGINT,
  "disbursedPaise" BIGINT,
  "conditions" TEXT NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL DEFAULT 0,
  "requestKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancingCase_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FinancingCase_candidate_fkey" FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FinancingCase_amounts_check" CHECK (
    ("requestedPaise" IS NULL OR "requestedPaise" >= 0) AND
    ("sanctionedPaise" IS NULL OR "sanctionedPaise" >= 0) AND
    ("disbursedPaise" IS NULL OR "disbursedPaise" >= 0)
  )
);
CREATE UNIQUE INDEX "FinancingCase_requestKey_key" ON "FinancingCase"("requestKey");
CREATE UNIQUE INDEX "FinancingCase_candidateId_workspaceId_key" ON "FinancingCase"("candidateId", "workspaceId");

CREATE TABLE "PaymentPlanLine" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT,
  "saleWorkspaceId" TEXT,
  "label" TEXT NOT NULL,
  "amountPaise" BIGINT NOT NULL,
  "dueDate" TEXT,
  "classification" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentPlanLine_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentPlanLine_candidate_fkey" FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentPlanLine_sale_fkey" FOREIGN KEY ("saleWorkspaceId", "workspaceId") REFERENCES "SaleWorkspace"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentPlanLine_amount_check" CHECK ("amountPaise" > 0),
  CONSTRAINT "PaymentPlanLine_class_check" CHECK ("classification" IN ('PRICE', 'ADDITIONAL'))
);
CREATE UNIQUE INDEX "PaymentPlanLine_requestKey_key" ON "PaymentPlanLine"("requestKey");
CREATE INDEX "PaymentPlanLine_workspaceId_candidateId_idx" ON "PaymentPlanLine"("workspaceId", "candidateId");

CREATE TABLE "TransactionMoneyRecord" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT,
  "saleWorkspaceId" TEXT,
  "amountPaise" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "kind" TEXT NOT NULL,
  "allocation" TEXT NOT NULL,
  "reversalOfId" TEXT,
  "occurredOn" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransactionMoneyRecord_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionMoneyRecord_candidate_fkey" FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionMoneyRecord_sale_fkey" FOREIGN KEY ("saleWorkspaceId", "workspaceId") REFERENCES "SaleWorkspace"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionMoneyRecord_reversal_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "TransactionMoneyRecord"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "TransactionMoneyRecord_amount_check" CHECK ("amountPaise" > 0),
  CONSTRAINT "TransactionMoneyRecord_kind_check" CHECK ("kind" IN ('POSTED', 'REVERSAL', 'REFUND')),
  CONSTRAINT "TransactionMoneyRecord_allocation_check" CHECK ("allocation" IN ('PRICE', 'ADDITIONAL'))
);
CREATE UNIQUE INDEX "TransactionMoneyRecord_requestKey_key" ON "TransactionMoneyRecord"("requestKey");
CREATE UNIQUE INDEX "TransactionMoneyRecord_reversalOfId_key" ON "TransactionMoneyRecord"("reversalOfId");
CREATE INDEX "TransactionMoneyRecord_workspaceId_candidateId_idx" ON "TransactionMoneyRecord"("workspaceId", "candidateId");

CREATE TABLE "TransactionVisit" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT,
  "prospectId" TEXT,
  "startsOn" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "contactName" TEXT,
  "notes" TEXT NOT NULL DEFAULT '',
  "observations" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "requestKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransactionVisit_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionVisit_candidate_fkey" FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionVisit_prospect_fkey" FOREIGN KEY ("prospectId", "workspaceId") REFERENCES "SaleProspect"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TransactionVisit_requestKey_key" ON "TransactionVisit"("requestKey");
CREATE INDEX "TransactionVisit_workspaceId_candidateId_idx" ON "TransactionVisit"("workspaceId", "candidateId");

CREATE TABLE "TransactionHandover" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT,
  "saleWorkspaceId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "plannedDate" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0,
  "snapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransactionHandover_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionHandover_candidate_fkey" FOREIGN KEY ("candidateId", "workspaceId") REFERENCES "PurchaseCandidate"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionHandover_sale_fkey" FOREIGN KEY ("saleWorkspaceId", "workspaceId") REFERENCES "SaleWorkspace"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionHandover_status_check" CHECK ("status" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED_RECORDED'))
);
CREATE UNIQUE INDEX "TransactionHandover_candidateId_workspaceId_key" ON "TransactionHandover"("candidateId", "workspaceId");
CREATE UNIQUE INDEX "TransactionHandover_saleWorkspaceId_workspaceId_key" ON "TransactionHandover"("saleWorkspaceId", "workspaceId");

CREATE TABLE "TransactionHandoverItem" (
  "id" TEXT PRIMARY KEY,
  "handoverId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "disposition" TEXT NOT NULL DEFAULT 'OPEN',
  "note" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "TransactionHandoverItem_handover_fkey" FOREIGN KEY ("handoverId") REFERENCES "TransactionHandover"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionHandoverItem_disposition_check" CHECK ("disposition" IN ('OPEN', 'DONE_REPORTED', 'WAIVED_WITH_REASON', 'DISPUTED'))
);
CREATE UNIQUE INDEX "TransactionHandoverItem_handoverId_label_key" ON "TransactionHandoverItem"("handoverId", "label");
CREATE INDEX "TransactionHandoverItem_workspaceId_idx" ON "TransactionHandoverItem"("workspaceId");

CREATE TABLE "DealRoom" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealRoom_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DealRoom_workspaceId_subjectType_subjectId_key" ON "DealRoom"("workspaceId", "subjectType", "subjectId");

CREATE TABLE "DealGrant" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "inviteeEmail" TEXT NOT NULL,
  "inviteeUserId" TEXT,
  "roleLabel" TEXT NOT NULL,
  "capabilities" TEXT[] NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'INVITED',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "requestKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealGrant_room_fkey" FOREIGN KEY ("roomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DealGrant_status_check" CHECK ("status" IN ('INVITED', 'ACCEPTED', 'REVOKED', 'EXPIRED', 'DECLINED'))
);
CREATE UNIQUE INDEX "DealGrant_requestKey_key" ON "DealGrant"("requestKey");
CREATE INDEX "DealGrant_inviteeUserId_status_idx" ON "DealGrant"("inviteeUserId", "status");
CREATE INDEX "DealGrant_workspaceId_idx" ON "DealGrant"("workspaceId");

CREATE TABLE "DealNote" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT,
  "workspaceId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealNote_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DealNote_room_fkey" FOREIGN KEY ("roomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DealNote_audience_check" CHECK ("audience" IN ('AUTHOR_PRIVATE', 'ROOM'))
);
CREATE UNIQUE INDEX "DealNote_requestKey_key" ON "DealNote"("requestKey");
CREATE INDEX "DealNote_workspaceId_audience_idx" ON "DealNote"("workspaceId", "audience");

CREATE TABLE "DealDisclosure" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "factKey" TEXT NOT NULL,
  "factValue" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "requestKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealDisclosure_room_fkey" FOREIGN KEY ("roomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DealDisclosure_requestKey_key" ON "DealDisclosure"("requestKey");
CREATE INDEX "DealDisclosure_workspaceId_idx" ON "DealDisclosure"("workspaceId");

CREATE TABLE "TransactionGuidance" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "ruleKey" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "relevanceKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "dueDate" TEXT,
  "state" TEXT NOT NULL DEFAULT 'ACTIVE',
  "sourceFingerprint" TEXT NOT NULL,
  "evaluatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransactionGuidance_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TransactionGuidance_workspaceId_ruleKey_subjectType_subjectId_relevanceKey_key" ON "TransactionGuidance"("workspaceId", "ruleKey", "subjectType", "subjectId", "relevanceKey");
CREATE INDEX "TransactionGuidance_workspaceId_state_idx" ON "TransactionGuidance"("workspaceId", "state");
