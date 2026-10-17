// Data layer for Market, Deals & Intelligence Hub

export interface WhatsAppDeal {
  id: string;
  title: string;
  location: string;
  city: string;
  priceFormatted: string;
  pricePaise: bigint;
  type: "Plot" | "Independent House" | "Flat" | "Commercial" | "Agriculture";
  dimensions: string;
  areaSqft: number;
  facing: string;
  reraApproved: boolean;
  clearTitle: boolean;
  postedDate: string;
  postedBy: string;
  agencyOrSeller: string;
  whatsappMessage: string;
  phone: string;
  whatsapp: string;
  highlights: string[];
  image: string;
}

export interface GuidelineRate {
  id: string;
  locality: string;
  zone: string;
  residentialPlotRate: number; // ₹ per sq.ft
  commercialPlotRate: number; // ₹ per sq.ft
  flatBuiltUpRate: number; // ₹ per sq.ft
  notes: string;
}

export interface RegisteredAssociate {
  id: string;
  name: string;
  agency: string;
  reraNumber: string;
  experienceYears: number;
  primeAreas: string[];
  dealsClosed: number;
  rating: number;
  phone: string;
  whatsapp: string;
  verified: boolean;
}

export interface BankLoanDetail {
  id: string;
  bankName: string;
  interestRateMin: number;
  interestRateMax: number;
  maxTenureYears: number;
  processingFee: string;
  specialFeatures: string[];
  contactSupport: string;
}

export interface LegalDraftTemplate {
  id: string;
  title: string;
  titleSubtitle: string;
  category: "Rental" | "Sale" | "Lease" | "Compliance";
  estimatedTimeMin: number;
  description: string;
  templateContent: string;
  variables: Array<{
    key: string;
    label: string;
    defaultValue: string;
    type: "text" | "number" | "date";
  }>;
}

// Live Daily WhatsApp-Style Deals Feed for Indore Real Estate
export const DAILY_WHATSAPP_DEALS: WhatsAppDeal[] = [
  {
    id: "deal-01",
    title: "1,000 sq.ft East Facing Plot in Super Corridor",
    location: "Super Corridor Phase 2 (Near TCS & Infosys Campus)",
    city: "Indore",
    priceFormatted: "₹52.00 Lakhs (₹5,200/sq.ft)",
    pricePaise: 520000000n,
    type: "Plot",
    dimensions: "20 × 50",
    areaSqft: 1000,
    facing: "East Facing (Sunrise Alignment)",
    reraApproved: true,
    clearTitle: true,
    postedDate: "Today, 10:15 AM",
    postedBy: "Vikas Trivedi (Verified Associate)",
    agencyOrSeller: "Shree Balaji Real Estate",
    whatsappMessage: "Hello, I saw the 20x50 East Facing Plot at Super Corridor Phase 2 for ₹52 Lakhs on Sukoon. Please share exact location and video.",
    phone: "+91 98260 88221",
    whatsapp: "919826088221",
    highlights: [
      "100% Clear Title & Registry Ready",
      "Wide 40 Feet Cement Road with underground electrification",
      "Immediate Possession with Demarcation Pillars",
      "Just 3 mins from TCS Metro Station",
    ],
    image: "/places/place-plot.png",
  },
  {
    id: "deal-02",
    title: "3 BHK Modern Luxury Villa at Scheme 140 / Pipliyahana",
    location: "Scheme 140, Near World Cup Square, Indore",
    city: "Indore",
    priceFormatted: "₹1.45 Crore (Negotiable)",
    pricePaise: 1450000000n,
    type: "Independent House",
    dimensions: "25 × 60",
    areaSqft: 1500,
    facing: "North Facing (Road Frontage)",
    reraApproved: true,
    clearTitle: true,
    postedDate: "Today, 09:40 AM",
    postedBy: "Rajesh Agrawal (Direct Owner)",
    agencyOrSeller: "Direct Family Owner",
    whatsappMessage: "Hello, I am interested in the 3 BHK Luxury Villa in Scheme 140 for ₹1.45 Cr on Sukoon. Want to schedule a visit today.",
    phone: "+91 98932 44331",
    whatsapp: "919893244331",
    highlights: [
      "Italian Marble Flooring & Teak Wood Doors",
      "Covered Parking for 2 Large SUVs",
      "Modular Hafele Kitchen with Chimney",
      "Municipal Narmada Water Connection & Sump",
    ],
    image: "/places/place-house.png",
  },
  {
    id: "deal-03",
    title: "2,400 sq.ft Corner Highway Commercial Plot",
    location: "Indore Bypass, Near Best Price & Omaxe City",
    city: "Indore",
    priceFormatted: "₹1.92 Crore (₹8,000/sq.ft)",
    pricePaise: 1920000000n,
    type: "Commercial",
    dimensions: "40 × 60 Corner",
    areaSqft: 2400,
    facing: "North-East Corner (Double Road)",
    reraApproved: true,
    clearTitle: true,
    postedDate: "Yesterday, 04:20 PM",
    postedBy: "Kapil Sharma (Top Associate)",
    agencyOrSeller: "Bypass Realty Partners",
    whatsappMessage: "Hello, regarding the 40x60 Commercial Corner Plot on Indore Bypass (₹1.92 Cr) on Sukoon. Please send T&CP Map and master plan setback details.",
    phone: "+91 94250 11998",
    whatsapp: "9425011998",
    highlights: [
      "Both Sides Open: 60 ft Sector Road & 40 ft Road",
      "Permitted for Showroom, Hospital, or Corporate Office",
      "High Footfall & Rapid Capital Growth Belt",
      "High Court Search Report Clear 30 Years",
    ],
    image: "/places/place-build.png",
  },
  {
    id: "deal-04",
    title: "2 BHK Premium High-Rise Flat at Vijay Nagar",
    location: "Vijay Nagar, Near Brilliant Convention Centre, Indore",
    city: "Indore",
    priceFormatted: "₹58.50 Lakhs",
    pricePaise: 585000000n,
    type: "Flat",
    dimensions: "1,180 sq.ft Super Built-up",
    areaSqft: 1180,
    facing: "East Facing Balcony",
    reraApproved: true,
    clearTitle: true,
    postedDate: "Yesterday, 02:15 PM",
    postedBy: "Sunil Jain",
    agencyOrSeller: "Silver Crest Residency",
    whatsappMessage: "Hello Sunil, I saw the 2 BHK Flat at Vijay Nagar for ₹58.50 Lakhs on Sukoon. Is bank loan pre-approved with SBI?",
    phone: "+91 98270 33441",
    whatsapp: "919827033441",
    highlights: [
      "Clubhouse, Gymnasium & Swimming Pool",
      "Pre-approved home loans from SBI, HDFC & ICICI",
      "Immediate Registry & Ready to Move",
      "Includes 1 Covered Basement Car Parking",
    ],
    image: "/places/place-flat.png",
  },
];

// Official Collector Guideline Rates for Indore (Circle Rates)
export const INDORE_GUIDELINE_RATES: GuidelineRate[] = [
  {
    id: "guide-01",
    locality: "Vijay Nagar / Scheme 54 / PU-4",
    zone: "Zone 8 (Central Commercial & Prime Residential)",
    residentialPlotRate: 7200,
    commercialPlotRate: 14500,
    flatBuiltUpRate: 5200,
    notes: "Prime zone; registration stamp duty calculated strictly on higher of transaction value or guideline.",
  },
  {
    id: "guide-02",
    locality: "Super Corridor (TCS / Infosys Belt)",
    zone: "Zone 12 (Aerodrome & IT Growth Corridor)",
    residentialPlotRate: 4600,
    commercialPlotRate: 9800,
    flatBuiltUpRate: 3800,
    notes: "High investment appreciation zone under Master Plan 2021; major road widening projects.",
  },
  {
    id: "guide-03",
    locality: "Nipania / Mahalaxmi Nagar",
    zone: "Zone 9 (Eastern Ring Road Extension)",
    residentialPlotRate: 5400,
    commercialPlotRate: 11000,
    flatBuiltUpRate: 4400,
    notes: "High-density residential township hub with multiple gated societies.",
  },
  {
    id: "guide-04",
    locality: "Indore Bypass / Bicholi Mardana",
    zone: "Zone 14 (Eastern Expressway)",
    residentialPlotRate: 4800,
    commercialPlotRate: 9200,
    flatBuiltUpRate: 4100,
    notes: "Township plots, luxury villas, and multi-specialty medical hubs.",
  },
  {
    id: "guide-05",
    locality: "Rau / Silicon City / AB Road",
    zone: "Zone 13 (Southern Industrial & Education Corridor)",
    residentialPlotRate: 3400,
    commercialPlotRate: 6800,
    flatBuiltUpRate: 3100,
    notes: "Affordable housing zone near IIM Indore and Pithampur industrial highway.",
  },
];

// Top Registered Associates / Channel Partners
export const REGISTERED_ASSOCIATES: RegisteredAssociate[] = [
  {
    id: "assoc-01",
    name: "Rajesh Patel",
    agency: "Indore Realty Partners",
    reraNumber: "MPRERA-A-IND-2022-0941",
    experienceYears: 16,
    primeAreas: ["Super Corridor", "Airport Road", "Vijay Nagar"],
    dealsClosed: 142,
    rating: 4.9,
    phone: "+91 98260 55112",
    whatsapp: "919826055112",
    verified: true,
  },
  {
    id: "assoc-02",
    name: "Sunita Deshmukh",
    agency: "Apex Property Consultants",
    reraNumber: "MPRERA-A-IND-2021-0428",
    experienceYears: 12,
    primeAreas: ["Nipania", "Mahalaxmi Nagar", "Bypass"],
    dealsClosed: 98,
    rating: 4.8,
    phone: "+91 98930 22774",
    whatsapp: "919893022774",
    verified: true,
  },
  {
    id: "assoc-03",
    name: "Amitabh Chhabra",
    agency: "Metro Commercial Advisory",
    reraNumber: "MPRERA-A-IND-2023-1180",
    experienceYears: 20,
    primeAreas: ["AB Road", "Palasia", "MG Road Commercial"],
    dealsClosed: 215,
    rating: 4.9,
    phone: "+91 94250 88339",
    whatsapp: "919425088339",
    verified: true,
  },
];

// Bank Loan Details & Interest Comparison
export const BANK_LOAN_DETAILS: BankLoanDetail[] = [
  {
    id: "bank-sbi",
    bankName: "State Bank of India (SBI)",
    interestRateMin: 8.50,
    interestRateMax: 9.15,
    maxTenureYears: 30,
    processingFee: "0.35% (Max ₹10,000 + GST)",
    specialFeatures: [
      "Zero prepayment penalty on floating rate loans",
      "Overdraft facility available (SBI Maxgain)",
      "Special concession for women borrowers (-0.05%)",
    ],
    contactSupport: "1800 1234 (Toll-Free SBI Home Loans)",
  },
  {
    id: "bank-hdfc",
    bankName: "HDFC Bank",
    interestRateMin: 8.70,
    interestRateMax: 9.40,
    maxTenureYears: 30,
    processingFee: "Up to 0.50% of loan amount",
    specialFeatures: [
      "Fast online sanction within 48 hours",
      "Flexible step-up and step-down repayment options",
      "Plot purchase + construction composite loans",
    ],
    contactSupport: "1800 210 0018",
  },
  {
    id: "bank-icici",
    bankName: "ICICI Bank",
    interestRateMin: 8.75,
    interestRateMax: 9.50,
    maxTenureYears: 30,
    processingFee: "0.50% - 1.00%",
    specialFeatures: [
      "Pre-approved sanction for existing account holders",
      "Express digital loan journey with minimal paper visits",
      "High loan-to-value (LTV) up to 80% on registered values",
    ],
    contactSupport: "1800 1080",
  },
];

// Quick Editable Legal Draft Templates
export const LEGAL_DRAFT_TEMPLATES: LegalDraftTemplate[] = [
  {
    id: "draft-rental",
    title: "Residential Rental Agreement",
    titleSubtitle: "Standard 11-Month Tenancy Contract",
    category: "Rental",
    estimatedTimeMin: 3,
    description: "Standard 11-month legal rent agreement for flat, independent house, or villa in Madhya Pradesh.",
    variables: [
      { key: "landlordName", label: "Landlord Full Name", defaultValue: "Akshay Sharma", type: "text" },
      { key: "tenantName", label: "Tenant Full Name", defaultValue: "Rahul Verma", type: "text" },
      { key: "propertyAddress", label: "Property Address", defaultValue: "Flat 302, Scheme 54, Vijay Nagar, Indore", type: "text" },
      { key: "monthlyRent", label: "Monthly Rent (₹)", defaultValue: "18500", type: "number" },
      { key: "securityDeposit", label: "Security Deposit (₹)", defaultValue: "37000", type: "number" },
      { key: "agreementDate", label: "Commencement Date", defaultValue: "2026-11-01", type: "date" },
    ],
    templateContent: `RESIDENTIAL LEASE AGREEMENT

This Tenancy Agreement is executed on {{agreementDate}} at Indore, Madhya Pradesh:

FIRST PARTY (LANDLORD):
{{landlordName}}, resident of Indore (M.P.)

SECOND PARTY (TENANT):
{{tenantName}}, resident of Indore (M.P.)

TERMS & CONDITIONS:
1. PREMISES: The Landlord leases to the Tenant the residential premises situated at {{propertyAddress}} for a tenancy period of 11 (eleven) months.
2. MONTHLY RENT: The agreed monthly rent is ₹{{monthlyRent}}/- per month, payable in advance on or before the 5th day of every calendar month.
3. SECURITY DEPOSIT: The Tenant has deposited an interest-free refundable security deposit of ₹{{securityDeposit}}/- with the Landlord, refundable upon handover of possession after adjusting any dues or damages.
4. UTILITIES: Electricity, water, and society maintenance charges shall be borne and paid directly by the Tenant as per meter bills.
5. RENEWAL: The agreement may be renewed upon mutual consent of both parties before expiry.

Landlord Signature: ____________________
Tenant Signature: ____________________
Witness 1: ____________________     Witness 2: ____________________`,
  },
  {
    id: "draft-sale-agreement",
    title: "Agreement to Sell & Earnest Money Receipt",
    titleSubtitle: "Property Advance & Deal Lock Contract",
    category: "Sale",
    estimatedTimeMin: 5,
    description: "Standard pre-registry sale contract recording advance earnest money, total deal value, and final registry deadline.",
    variables: [
      { key: "sellerName", label: "Seller Full Name", defaultValue: "Vikas Trivedi", type: "text" },
      { key: "buyerName", label: "Buyer Full Name", defaultValue: "Akshay Sharma", type: "text" },
      { key: "propertyDescription", label: "Plot / Property Description", defaultValue: "Plot No. 14, Scheme 54, PU-4, Indore (Area: 3,200 sq.ft)", type: "text" },
      { key: "totalDealAmount", label: "Total Deal Amount (₹)", defaultValue: "28500000", type: "number" },
      { key: "advanceTokenAmount", label: "Advance Earnest Money Paid (₹)", defaultValue: "2500000", type: "number" },
      { key: "registryDeadline", label: "Registry Target Deadline", defaultValue: "2026-12-15", type: "date" },
    ],
    templateContent: `AGREEMENT TO SELL & EARNEST MONEY RECEIPT

This Agreement to Sell is executed at Indore, Madhya Pradesh:

SELLER: {{sellerName}}
BUYER: {{buyerName}}

SUBJECT PROPERTY:
{{propertyDescription}}

KEY TERMS & RECITALS:
1. TOTAL CONSIDERATION: The Seller agrees to sell and transfer absolute freehold title of the property to the Buyer for a total consideration of ₹{{totalDealAmount}}/-.
2. EARNEST MONEY (ADVANCE): The Buyer has paid ₹{{advanceTokenAmount}}/- as token advance money via Bank Cheque / RTGS, the receipt whereof the Seller hereby acknowledges.
3. BALANCE PAYMENT & REGISTRY: The balance amount shall be paid by the Buyer on or before {{registryDeadline}} at the office of the Sub-Registrar Indore during final deed execution.
4. TITLE WARRANTY: The Seller warrants that the property is completely free from mortgages, charges, litigation, tax encumbrances, or family disputes.
5. SPECIFIC PERFORMANCE: Both parties agree to specific performance under the Indian Contract Act in the event of default.

Seller Signature: ____________________
Buyer Signature: ____________________
Witness 1: ____________________     Witness 2: ____________________`,
  },
  {
    id: "draft-registry-checklist",
    title: "Property Registry Mandatory Checklist",
    titleSubtitle: "Sub-Registrar Office Statutory Documents",
    category: "Compliance",
    estimatedTimeMin: 2,
    description: "Complete list of statutory documents required at the Sub-Registrar office for smooth deed registration in MP.",
    variables: [
      { key: "propertyLocality", label: "Locality / District", defaultValue: "Indore (M.P.)", type: "text" },
    ],
    templateContent: `PROPERTY REGISTRATION STATUTORY CHECKLIST

Mandatory documents required at the Sub-Registrar Office for Deed Execution in {{propertyLocality}}:

1. [ ] Original Sale Deed draft printed on electronic Stamp Paper (E-Stamp)
2. [ ] Previous Link Title Deeds / Original Allotment Letter from Authority
3. [ ] Municipal Corporation Property Tax No Dues Certificate (NOC)
4. [ ] Updated Revenue Mutation Record (Namantaran) and B-1 Khasra extract
5. [ ] Aadhaar Card & PAN Card of both Seller and Buyer (PAN mandatory)
6. [ ] Two adult identity-verified witnesses with photo ID & Aadhaar
7. [ ] T&CP Town Planning Sanction Map / IDA Approved Layout Plan
8. [ ] SAMPADA MP online registration slot booking receipt
9. [ ] Bank Cheque / RTGS UTR payment details (proof of transaction)
10. [ ] TDS Form 26QB acknowledgement receipt (for transactions exceeding ₹50 Lakhs under Section 194-IA)

Note: Parties should report at the Sub-Registrar office 15 minutes before the booked SAMPADA slot.`,
  },
];
