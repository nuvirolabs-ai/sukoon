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
    id: "deal-omaxe-01",
    title: "1,500 sq.ft Prime Residential Plot in Omaxe City 1",
    location: "Omaxe City 1, AB Bypass Road, Indore",
    city: "Indore",
    priceFormatted: "₹67.50 Lakhs (₹4,500/sq.ft)",
    pricePaise: 675000000n,
    type: "Plot",
    dimensions: "30 × 50",
    areaSqft: 1500,
    facing: "North-East Facing (Park Facing)",
    reraApproved: true,
    clearTitle: true,
    postedDate: "Today, 11:30 AM",
    postedBy: "Vikramaditya Rathore (Direct Channel Partner)",
    agencyOrSeller: "Heritage Estates Bypass",
    whatsappMessage: "Hello, I saw the 1500 sqft Plot in Omaxe City 1 for ₹67.50 Lakhs on Sukoon. Is it near the club house? Please send details.",
    phone: "+91 98265 77110",
    whatsapp: "919826577110",
    highlights: [
      "Prime Park Facing Plot in Sector B",
      "Fully gated township with 24x7 security & clubhouse",
      "Direct owner registry, clear title & zero encumbrance",
      "Bank loan pre-approved from SBI & HDFC",
    ],
    image: "/places/place-plot.png",
  },
  {
    id: "deal-dlf-01",
    title: "2,000 sq.ft Corner Villa Plot in DLF Gardencity",
    location: "DLF Gardencity, AB Bypass Road, Indore",
    city: "Indore",
    priceFormatted: "₹96.00 Lakhs (₹4,800/sq.ft)",
    pricePaise: 960000000n,
    type: "Plot",
    dimensions: "40 × 50 Corner",
    areaSqft: 2000,
    facing: "East-North Corner",
    reraApproved: true,
    clearTitle: true,
    postedDate: "Today, 08:45 AM",
    postedBy: "Neha Saxena (Verified Associate)",
    agencyOrSeller: "Greenfield Properties",
    whatsappMessage: "Hello Neha, interested in the 2000 sqft Corner Plot in DLF Gardencity on Sukoon for ₹96L. Can we visit this afternoon?",
    phone: "+91 98931 99220",
    whatsapp: "919893199220",
    highlights: [
      "Ultra-wide 60 ft & 40 ft corner junction",
      "IDA & T&CP approved township with underground utilities",
      "Immediate registry & boundary demarcation done",
      "Walking distance from international sports arena",
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
  {
    id: "deal-05",
    title: "1,200 sq.ft Residential Plot in Silicon City",
    location: "Silicon City, Rau AB Road, Indore",
    city: "Indore",
    priceFormatted: "₹42.00 Lakhs (₹3,500/sq.ft)",
    pricePaise: 420000000n,
    type: "Plot",
    dimensions: "24 × 50",
    areaSqft: 1200,
    facing: "West Facing",
    reraApproved: true,
    clearTitle: true,
    postedDate: "Yesterday, 11:10 AM",
    postedBy: "Mohanlal Sharma",
    agencyOrSeller: "Rau Property Hub",
    whatsappMessage: "Hello Mohanlal ji, saw the 1200 sqft plot in Silicon City for ₹42 Lakhs on Sukoon. Please share mutation receipt.",
    phone: "+91 98261 44552",
    whatsapp: "919826144552",
    highlights: [
      "Near IPS Academy and Emerald Heights School",
      "Direct municipal tap water and concrete drainage",
      "Ready for house construction",
      "Clear title verified by Sukoon",
    ],
    image: "/places/place-plot.png",
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
  {
    id: "assoc-04",
    name: "Vikramaditya Rathore",
    agency: "Heritage Estates Bypass",
    reraNumber: "MPRERA-A-IND-2021-0812",
    experienceYears: 14,
    primeAreas: ["Omaxe City 1 & 2", "Indore Bypass", "Bicholi Mardana"],
    dealsClosed: 124,
    rating: 4.9,
    phone: "+91 98265 77110",
    whatsapp: "919826577110",
    verified: true,
  },
  {
    id: "assoc-05",
    name: "Neha Saxena",
    agency: "Greenfield Properties",
    reraNumber: "MPRERA-A-IND-2024-1402",
    experienceYears: 9,
    primeAreas: ["DLF Gardencity", "Super Corridor", "Airport Road"],
    dealsClosed: 76,
    rating: 4.8,
    phone: "+91 98931 99220",
    whatsapp: "919893199220",
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
  {
    id: "bank-bob",
    bankName: "Bank of Baroda",
    interestRateMin: 8.40,
    interestRateMax: 9.20,
    maxTenureYears: 30,
    processingFee: "Zero processing fee under Baroda Monsoon / Festive Offer",
    specialFeatures: [
      "Special concession for Baroda Yoddha defense personnel",
      "Linked to Baroda Repo Linked Lending Rate (BRLLR)",
      "Top-up loan facility at standard home loan interest rates",
    ],
    contactSupport: "1800 5700",
  },
  {
    id: "bank-union",
    bankName: "Union Bank of India",
    interestRateMin: 8.35,
    interestRateMax: 9.05,
    maxTenureYears: 30,
    processingFee: "0.50% (Max ₹15,000)",
    specialFeatures: [
      "Competitive low entry interest rate for CIBIL > 750",
      "Free personal accident insurance coverage with loan",
      "Quick sanction for plot purchase + house construction",
    ],
    contactSupport: "1800 22 22 44",
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
    id: "draft-registry",
    title: "Registry Agreement & Sale Deed Clauses",
    titleSubtitle: "Conveyance Deed & Sub-Registrar Submission Draft",
    category: "Sale",
    estimatedTimeMin: 6,
    description: "Statutory sale deed conveyance agreement draft with boundary schedule, khasra mutation declaration, and consideration clauses.",
    variables: [
      { key: "vendorName", label: "Vendor / Seller Full Name", defaultValue: "Vikas Trivedi", type: "text" },
      { key: "vendeeName", label: "Vendee / Buyer Full Name", defaultValue: "Akshay Sharma", type: "text" },
      { key: "khasraNumber", label: "Khasra / Survey Number", defaultValue: "Khasra No. 142/2/1", type: "text" },
      { key: "subDistrict", label: "Sub-District / Tehsil", defaultValue: "Tehsil Indore, District Indore (M.P.)", type: "text" },
      { key: "saleValue", label: "Total Sale Consideration (₹)", defaultValue: "5200000", type: "number" },
      { key: "eastBoundary", label: "East Boundary", defaultValue: "Colony 30 Feet Cement Road", type: "text" },
      { key: "westBoundary", label: "West Boundary", defaultValue: "Plot No. 15", type: "text" },
      { key: "northBoundary", label: "North Boundary", defaultValue: "Plot No. 22", type: "text" },
      { key: "southBoundary", label: "South Boundary", defaultValue: "Open Park Boundary", type: "text" },
    ],
    templateContent: `DEED OF ABSOLUTE SALE (REGISTRY CONVEYANCE)

This Absolute Deed of Sale is executed before the Sub-Registrar of Assurances at {{subDistrict}}:

BY AND BETWEEN:
VENDOR (SELLER): {{vendorName}}, having PAN and Aadhaar, hereinafter called the First Party.
AND
VENDEE (BUYER): {{vendeeName}}, having PAN and Aadhaar, hereinafter called the Second Party.

PROPERTY SCHEDULE & BOUNDARIES:
All that piece and parcel of freehold land situated at {{khasraNumber}}, {{subDistrict}}, bounded as follows:
- EAST: {{eastBoundary}}
- WEST: {{westBoundary}}
- NORTH: {{northBoundary}}
- SOUTH: {{southBoundary}}

OPERATIVE COVENANTS:
1. CONSIDERATION: In consideration of the sum of ₹{{saleValue}}/- paid in full by the Vendee to the Vendor via Cheque/RTGS, the Vendor hereby conveys, transfers, and assigns absolute freehold rights and title to the Vendee forever.
2. POSSESSION: Vacant, physical, and peaceful possession of the property has been delivered to the Vendee upon signing.
3. INDEMNITY & TITLE: The Vendor declares that the property has unencumbered title, free from attachments, civil court decrees, taxes, mortgages, or government acquisitions.
4. MUTATION (NAMANTARAN): The Vendor hereby consents to the mutation of the Vendee's name in Revenue and Municipal records without objection.

In witness whereof, the parties have signed on this deed in the presence of witnesses.

Vendor (Signature & Thumb): ____________________
Vendee (Signature & Thumb): ____________________
Witness 1: ____________________     Witness 2: ____________________`,
  },
  {
    id: "draft-jahir-suchna",
    title: "Jahir Suchna Doc (Public Notice)",
    titleSubtitle: "Newspaper Notice of Title Search (अख़बारी ज़ाहिर सूचना)",
    category: "Compliance",
    estimatedTimeMin: 4,
    description: "Statutory public notice template published in regional newspapers prior to property registry to invite third-party objections.",
    variables: [
      { key: "advocateName", label: "Advocate Full Name", defaultValue: "Adv. Rajesh Saxena (High Court Bar Association)", type: "text" },
      { key: "clientName", label: "Purchaser / Client Name", defaultValue: "Akshay Sharma", type: "text" },
      { key: "propertyDetail", label: "Property Full Description", defaultValue: "Plot No. 14, Sector B, Scheme 140, Indore (Area 1,500 sq.ft)", type: "text" },
      { key: "sellerName", label: "Current Owner / Seller", defaultValue: "Vikas Trivedi S/o Ramesh Trivedi", type: "text" },
      { key: "cityDistrict", label: "City / District", defaultValue: "Indore (M.P.)", type: "text" },
      { key: "advocateContact", label: "Advocate Office Phone / WhatsApp", defaultValue: "+91 98260 11223", type: "text" },
    ],
    templateContent: `PUBLIC NOTICE / ज़ाहिर सूचना (TITLE CLEARANCE SEARCH)

To all whomsoever it may concern:

Be it known to the general public that our client, {{clientName}}, resident of {{cityDistrict}}, has entered into an Agreement to Sell to purchase the following immovable property:

PROPERTY DESCRIPTION:
{{propertyDetail}}, currently owned and possessed by {{sellerName}}.

Our client is investigating the marketability and marketable freehold title of the above-mentioned property for final registry execution.

Any bank, financial institution, private lender, family heir, coparcener, or any other person having any claim, charge, lien, mortgage, easement, court litigation, leasehold, or objection whatsoever against the said property is hereby called upon to lodge written objection with documentary proof at our office address below within 15 (fifteen) days from the publication of this notice.

If no valid objection is received with certified documents within the stipulated period, it shall be deemed that the property has clear, marketable, and unencumbered title, and our client shall proceed with the execution and registration of the Sale Deed. Any subsequent claims shall be deemed waived and rejected.

Date of Notice: {{publishedDate}}
Issued Under Instructions of Client By:
{{advocateName}}
Office Address: Chamber No. 42, District Court Compound, {{cityDistrict}}
Contact: {{advocateContact}}`,
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

// Multi-City Guideline Values across India
export interface CityGuidelineGroup {
  city: string;
  state: string;
  stampDutyNote: string;
  rates: GuidelineRate[];
}

export const MULTI_CITY_GUIDELINE_RATES: CityGuidelineGroup[] = [
  {
    city: "Indore",
    state: "Madhya Pradesh",
    stampDutyNote: "MP Stamp Duty: 7.5% (5% Stamp Duty + 2% Janpad + 0.5% Upkar) + 3% Municipal Cess = 10.5% for Urban",
    rates: INDORE_GUIDELINE_RATES,
  },
  {
    city: "Bhopal",
    state: "Madhya Pradesh",
    stampDutyNote: "MP Stamp Duty: 10.5% in Bhopal Municipal Corporation (BMC) limit",
    rates: [
      {
        id: "bhopal-01",
        locality: "Arera Colony / E-1 to E-7",
        zone: "Zone 1 (Bhopal Prime VIP Residential)",
        residentialPlotRate: 6400,
        commercialPlotRate: 12800,
        flatBuiltUpRate: 4600,
        notes: "High demand posh sector; premium circle rate calculation.",
      },
      {
        id: "bhopal-02",
        locality: "Hoshangabad Road (Bhopal-Hoshangabad Highway)",
        zone: "Zone 5 (Growth Corridor & Malls)",
        residentialPlotRate: 4200,
        commercialPlotRate: 8500,
        flatBuiltUpRate: 3600,
        notes: "Major residential township hub with AIIMS Bhopal connectivity.",
      },
      {
        id: "bhopal-03",
        locality: "Kolar Road / Chuna Bhatti",
        zone: "Zone 6 (Rapid Suburban Expansion)",
        residentialPlotRate: 3800,
        commercialPlotRate: 7200,
        flatBuiltUpRate: 3200,
        notes: "Four-lane expressway underway; rising capital valuation.",
      },
      {
        id: "bhopal-04",
        locality: "MP Nagar Zone 1 & Zone 2",
        zone: "Zone 2 (Central Commercial District)",
        residentialPlotRate: 8500,
        commercialPlotRate: 18500,
        flatBuiltUpRate: 6200,
        notes: "Prime commercial, banking, and coaching hub of Madhya Pradesh.",
      },
    ],
  },
  {
    city: "Ujjain",
    state: "Madhya Pradesh",
    stampDutyNote: "MP Stamp Duty: 10.5% (Special Simhastha infra development concessions in specific corridors)",
    rates: [
      {
        id: "ujjain-01",
        locality: "Mahakal Corridor / Hari Phatak Belt",
        zone: "Zone 1 (Pilgrim Hospitality & Heritage)",
        residentialPlotRate: 5200,
        commercialPlotRate: 11500,
        flatBuiltUpRate: 4000,
        notes: "High commercial demand for hotels, resorts, and dharamshalas.",
      },
      {
        id: "ujjain-02",
        locality: "Sanwer Road / Indore-Ujjain Highway",
        zone: "Zone 3 (Indore Metro Link Corridor)",
        residentialPlotRate: 3600,
        commercialPlotRate: 7400,
        flatBuiltUpRate: 3100,
        notes: "Proposed Indore-Ujjain rapid transit link appreciation belt.",
      },
      {
        id: "ujjain-03",
        locality: "Freeganj / Madhav Nagar",
        zone: "Zone 2 (Central Ujjain Residential)",
        residentialPlotRate: 4800,
        commercialPlotRate: 9500,
        flatBuiltUpRate: 3800,
        notes: "Established residential core with wide railway connectivity.",
      },
    ],
  },
  {
    city: "Pune",
    state: "Maharashtra",
    stampDutyNote: "Maharashtra Stamp Duty: 6% (5% Stamp Duty + 1% Local Body Tax) + 1% Metro Cess = 7%",
    rates: [
      {
        id: "pune-01",
        locality: "Hinjewadi / Rajiv Gandhi Infotech Park",
        zone: "PCMC / PMRDA IT Hub",
        residentialPlotRate: 7800,
        commercialPlotRate: 15200,
        flatBuiltUpRate: 6400,
        notes: "IT hub with high rental yields and fast Metro construction.",
      },
      {
        id: "pune-02",
        locality: "Kharadi / EON Free Zone",
        zone: "Eastern Pune IT District",
        residentialPlotRate: 8600,
        commercialPlotRate: 17500,
        flatBuiltUpRate: 7200,
        notes: "Near Pune International Airport and World Trade Centre.",
      },
      {
        id: "pune-03",
        locality: "Baner / Balewadi High Street",
        zone: "Western Corridor (Mumbai Highway)",
        residentialPlotRate: 9800,
        commercialPlotRate: 19800,
        flatBuiltUpRate: 8100,
        notes: "Luxury lifestyle, premium restaurants, and tech headquarters.",
      },
    ],
  },
  {
    city: "Bengaluru",
    state: "Karnataka",
    stampDutyNote: "Karnataka Stamp Duty: 5% + 10% Cess on Stamp Duty + 2% Urban Surcharge (~5.6% total)",
    rates: [
      {
        id: "blr-01",
        locality: "Whitefield / ITPL Main Road",
        zone: "East Bengaluru IT Zone",
        residentialPlotRate: 9200,
        commercialPlotRate: 18800,
        flatBuiltUpRate: 7500,
        notes: "Purple Line Metro connected; high corporate leasing volume.",
      },
      {
        id: "blr-02",
        locality: "Sarjapur Road / ORR Junction",
        zone: "South-East Tech Corridor",
        residentialPlotRate: 8400,
        commercialPlotRate: 16500,
        flatBuiltUpRate: 6900,
        notes: "Close to Bellandur tech parks and top international schools.",
      },
      {
        id: "blr-03",
        locality: "HSR Layout (Sectors 1 to 7)",
        zone: "Prime Tech-Startup Hub",
        residentialPlotRate: 12500,
        commercialPlotRate: 24000,
        flatBuiltUpRate: 9800,
        notes: "Highest capital value residential sector in South Bengaluru.",
      },
    ],
  },
  {
    city: "Delhi-NCR",
    state: "Delhi / Haryana / UP",
    stampDutyNote: "Haryana: 7% (Male), 5% (Female) | Delhi: 6% (Male), 4% (Female) | UP (Noida): 7%",
    rates: [
      {
        id: "ncr-01",
        locality: "Golf Course Extension Road (Gurgaon)",
        zone: "Gurugram Premium Residential",
        residentialPlotRate: 14500,
        commercialPlotRate: 28500,
        flatBuiltUpRate: 11500,
        notes: "Ultra-luxury high rise condos and rapid transit corridors.",
      },
      {
        id: "ncr-02",
        locality: "Sector 150 (Noida Expressway)",
        zone: "Sports City Green Belt",
        residentialPlotRate: 7600,
        commercialPlotRate: 14800,
        flatBuiltUpRate: 6200,
        notes: "Direct connectivity to upcoming Jewar International Airport.",
      },
      {
        id: "ncr-03",
        locality: "Dwarka Expressway (Sector 102-113)",
        zone: "Northern Peripheral Expressway",
        residentialPlotRate: 9500,
        commercialPlotRate: 19000,
        flatBuiltUpRate: 7800,
        notes: "8-lane grade-separated access directly connecting IGI Airport.",
      },
    ],
  },
];
