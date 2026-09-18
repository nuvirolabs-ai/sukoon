export type PropertyType = "flat" | "plot" | "villa" | "commercial" | "agri";
export type AreaUnit = "sqft" | "sqm" | "acre" | "hectare" | "other";
export type AreaType = "carpet" | "built_up" | "plot" | "land" | "other";

export interface PropertyIdentifier {
  label: string;
  value: string;
}
export type DocType =
  | "Registry"
  | "Chain documents"
  | "Link papers"
  | "NOC"
  | "Naamantaran (mutation)"
  | "Property info"
  | "Measurement"
  | "Sanction map"
  | "Tax receipt"
  | "Loan agreement"
  | "Insurance"
  | "EC"
  | "Identity"
  | "Address proof"
  | "Receipt"
  | "Other";

// Neutral record categories only. Applicability and requirements come from
// published S12 rules; this list is not a legal checklist.
export const DOCUMENT_TAXONOMY: DocType[] = [
  "Registry", "Chain documents", "Link papers", "NOC", "Naamantaran (mutation)",
  "Property info", "Measurement", "Sanction map", "Tax receipt", "Loan agreement",
  "Insurance", "EC", "Identity", "Address proof", "Receipt", "Other",
];

export type DocumentProcessingState =
  | "uploaded"
  | "quarantined"
  | "scan_pending"
  | "scan_failed"
  | "clean"
  | "awaiting_review"
  | "processing"
  | "ready"
  | "unsupported"
  | "failed"
  | "archived";

export type DocumentScanStatus = "scan_pending" | "clean" | "unavailable" | "failed" | "infected";
export type DocumentReviewStatus = "awaiting_review" | "in_review" | "partially_confirmed" | "confirmed";
export type DocumentSource = "user_uploaded" | "user_replaced" | "document_extracted" | "fixture_ai" | "purchase_import";

export interface DocumentVersionSummary {
  id: string;
  version: number;
  originalFilename: string;
  displayName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  sizeBytes: number;
  sha256: string;
  scanStatus: DocumentScanStatus;
  processingState: DocumentProcessingState;
  reviewStatus: DocumentReviewStatus;
  source: DocumentSource | string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PropertyDoc {
  id: string;
  propertyId: string;
  type: DocType;
  name: string;
  originalFilename?: string;
  displayName?: string;
  subtype?: string;
  uploadDate: string;
  uploadedBy?: string;
  uploadedAt?: string;
  updatedAt?: string;
  sizeKb?: number;
  sizeBytes?: number;
  sha256?: string;
  notes?: string;
  // base64 dataURL capped at ~1.5MB; optional
  dataUrl?: string;
  storageKey?: string;
  mimeType?: "application/pdf" | "image/jpeg" | "image/png";
  processingState?: DocumentProcessingState;
  scanStatus?: DocumentScanStatus;
  reviewStatus?: DocumentReviewStatus;
  provenance?: DocumentSource | string;
  archivedAt?: string;
  deletedAt?: string;
  version?: number;
  versions?: DocumentVersionSummary[];
  verified?: boolean;
  extracted?: Record<string, string>;
}

export type BillType =
  | "Property tax"
  | "Wealth tax"
  | "Rent"
  | "Maintenance"
  | "Society deposit"
  | "Diversion tax"
  | "Water"
  | "Electricity"
  | "Loan EMI"
  | "Insurance"
  | "Registry deadline"
  | "Other";

export interface Bill {
  id: string;
  propertyId: string;
  type: BillType;
  title: string;
  amount: number;
  dueDate: string; // ISO
  paidDate?: string;
  status: "pending" | "paid" | "overdue";
  receiptDocId?: string;
  recurring?: "monthly" | "quarterly" | "yearly" | "once";
  notes?: string;
}

export interface Maintenance {
  id: string;
  propertyId: string;
  task: string;
  dateReported: string;
  provider?: string;
  quote?: number;
  finalCost?: number;
  status: "open" | "in-progress" | "resolved";
  warrantyUntil?: string;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  propertyId: string;
  date: string;
  title: string;
  detail?: string;
  kind: "acquired" | "mutation" | "tax" | "loan" | "maintenance" | "doc" | "construction" | "other";
}

export interface ShareLink {
  id: string;
  propertyId: string;
  role: "Family" | "CA" | "Lawyer" | "Buyer" | "Architect";
  token: string;
  expiresAt: string;
  scopes: DocType[] | ["all"];
  note?: string;
}

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  city: string;
  area: string;
  address: string;
  jurisdiction?: string;
  areaValue?: string;
  areaUnit?: AreaUnit;
  areaType?: AreaType;
  ownershipAssertion?: "self_asserted";
  ownershipProvenance?: string;
  identifiers?: PropertyIdentifier[];
  carpetAreaSqft?: number;
  plotSizeSqft?: number;
  ownerName: string;
  purchaseDate?: string;
  purchaseValue?: number;
  loanActive?: boolean;
  loanBalance?: number;
  insuranceUntil?: string;
  createdAt: string;
  occupancy?: "self" | "rented" | "vacant";
  photoUrl?: string;
  coOwners?: string;
  rentAmount?: number;
  status?: "active" | "archived";
  version?: number;
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
  phone?: string;
  rentAmount: number;
  deposit?: number;
  startDate: string;
  endDate: string;
  status: "active" | "exited";
  agreementDocId?: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  category: "Plumbing" | "Electrical" | "Waterproofing" | "Painting" | "Pest" | "Cleaning" | "Other";
  vendor?: string;
  date: string;
  status: "requested" | "confirmed" | "done";
  cost?: number;
  rating?: number;
}

export interface Reminder {
  id: string;
  propertyId: string;
  kind: "tax" | "rent-expiry" | "insurance" | "mutation" | "bill" | "custom";
  title: string;
  dueDate: string;
  done?: boolean;
}

export interface Listing {
  id: string;
  propertyId?: string;
  title: string;
  city: string;
  type: PropertyType;
  price: number;
  carpetAreaSqft?: number;
  verified: boolean;
  healthScore?: number;
  contactMasked: string;
  description: string;
  createdAt: string;
  mine: boolean;
}

export interface ConstructionProject {
  id: string;
  propertyId?: string;
  name: string;
  plotSizeSqft: number;
  spec: string;
  budget: number;
  currentStage: number; // index into MILESTONES
  stageStatus: Record<number, "pending" | "active" | "done">;
  startDate: string;
  notes?: string;
}

export interface AppState {
  properties: Property[];
  docs: PropertyDoc[];
  bills: Bill[];
  maintenance: Maintenance[];
  timeline: TimelineEvent[];
  shares: ShareLink[];
  listings: Listing[];
  projects: ConstructionProject[];
  tenants: Tenant[];
  bookings: Booking[];
  reminders: Reminder[];
  lang: "en" | "hi";
  referralCode: string;
}
