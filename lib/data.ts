import type { BillType } from "./types";

// Educational copy only. It is deliberately labelled draft in the UI until a
// jurisdiction, source, reviewer, effective date and expiry policy are added.
export const BUYER_GUIDE = [
  { t: "Verify title chain", d: "Ask for the registry, link papers and encumbrance evidence; have a qualified local professional review gaps." },
  { t: "Check mutation records", d: "Confirm the recorded owner and tax records with the relevant local authority before relying on them." },
  { t: "Request society / colony records", d: "Ask for written no-dues and transfer requirements where they apply." },
  { t: "Compare approved and actual construction", d: "Have plans and physical construction checked by an appropriately qualified professional." },
  { t: "Confirm applicable value and charges", d: "Check current government sources for the relevant jurisdiction; Sukoon does not calculate these yet." },
  { t: "Check project registration where applicable", d: "Use the current state authority source for under-construction property." },
  { t: "Measure the property", d: "Record the unit and method, then compare the result with the source documents." },
  { t: "Document the transaction path", d: "Use written terms and professional advice before paying a token or signing an agreement." },
];

export const DOS_DONTS = {
  dos: ["Keep a written paper trail for payments", "Ask a qualified professional to review the documents", "Keep the vault current with source records", "Check the relevant government or society source"],
  donts: ["Do not treat a draft guide as legal or tax advice", "Do not rely on an unreviewed title or ownership claim", "Do not infer a current rate or deadline from an example", "Do not start work without the required professional and local approvals"],
};

export const BILL_TYPES: BillType[] = [
  "Property tax",
  "Wealth tax",
  "Rent",
  "Maintenance",
  "Society deposit",
  "Diversion tax",
  "Water",
  "Electricity",
  "Loan EMI",
  "Insurance",
  "Registry deadline",
  "Other",
];
