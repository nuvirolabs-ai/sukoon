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
  titleHindi: string;
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
    facing: "East Facing (शुभ पूर्व मुखी)",
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
    facing: "North Facing (कुबेर मुखी)",
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
      "IMC Narmada Water Connection & Sump",
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
    facing: "North-East Corner (ईशान कोना)",
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

// Official Collector Guideline Rates for Indore (गाइडलाइन दरें)
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
    locality: "Super Corridor (TCS/Infosys Belt)",
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
    title: "Residential Rental Agreement (किरायानामा)",
    titleHindi: "आवासीय किरायानामा अनुबंध",
    category: "Rental",
    estimatedTimeMin: 3,
    description: "Standard 11-month legal rent agreement for flat, independent house, or villa in Madhya Pradesh.",
    variables: [
      { key: "landlordName", label: "Landlord (मकान मालिक का नाम)", defaultValue: "Akshay Sharma", type: "text" },
      { key: "tenantName", label: "Tenant (किरायेदार का नाम)", defaultValue: "Rahul Verma", type: "text" },
      { key: "propertyAddress", label: "Property Address (मकान का पता)", defaultValue: "Flat 302, Scheme 54, Vijay Nagar, Indore", type: "text" },
      { key: "monthlyRent", label: "Monthly Rent ₹ (मासिक किराया)", defaultValue: "18500", type: "number" },
      { key: "securityDeposit", label: "Security Deposit ₹ (अमानत राशि)", defaultValue: "37000", type: "number" },
      { key: "agreementDate", label: "Commencement Date (प्रारंभ तिथि)", defaultValue: "2026-11-01", type: "date" },
    ],
    templateContent: `RENT AGREEMENT / किरायानामा

यह किरायानामा आज दिनांक {{agreementDate}} को स्थान इंदौर (म.प्र.) में निष्पादित किया गया:

प्रथम पक्ष (मकान मालिक / Landlord):
श्री/श्रीमती {{landlordName}}, निवासी इंदौर (म.प्र.)।

द्वितीय पक्ष (किरायेदार / Tenant):
श्री/श्रीमती {{tenantName}}, निवासी इंदौर (म.प्र.)।

शर्तें निम्नलिखित हैं:
1. प्रथम पक्ष ने अपना मकान स्थित: {{propertyAddress}} द्वितीय पक्ष को आवासीय उपयोग हेतु 11 माह की अवधि के लिए किराये पर दिया है।
2. मासिक किराया ₹{{monthlyRent}}/- (अक्षरी: रुपये {{monthlyRent}} मात्र) प्रति माह तय हुआ है, जिसका भुगतान प्रत्येक माह की 5 तारीख तक करना अनिवार्य होगा।
3. द्वितीय पक्ष ने अमानत राशि (Security Deposit) ₹{{securityDeposit}}/- प्रथम पक्ष के पास जमा की है, जो मकान खाली करते समय समायोजन पश्चात बिना ब्याज वापस की जाएगी।
4. बिजली बिल का भुगतान द्वितीय पक्ष स्वयं मीटर रीडिंग के अनुसार करेगा।
5. 11 माह पश्चात दोनों पक्षों की आपसी सहमति से किरायानामा नवीनीकृत किया जा सकेगा।

प्रथम पक्ष (Landlord) Signature: ____________________
द्वितीय पक्ष (Tenant) Signature: ____________________
गवाह 1: ____________________     गवाह 2: ____________________`,
  },
  {
    id: "draft-sale-agreement",
    title: "Agreement to Sell / Bayanama (इकरारनामा / बयानामा)",
    titleHindi: "अचल संपत्ति विक्रय इकरारनामा",
    category: "Sale",
    estimatedTimeMin: 5,
    description: "Standard pre-registry sale contract recording advance token amount (Bayana), total deal value, and final registry deadline.",
    variables: [
      { key: "sellerName", label: "Seller Name (विक्रेता का नाम)", defaultValue: "Vikas Trivedi", type: "text" },
      { key: "buyerName", label: "Buyer Name (क्रेता का नाम)", defaultValue: "Akshay Sharma", type: "text" },
      { key: "propertyDescription", label: "Plot / Property Details (प्रॉपर्टी विवरण)", defaultValue: "Plot No. 14, Scheme 54, PU-4, Indore (Area: 3200 sq.ft)", type: "text" },
      { key: "totalDealAmount", label: "Total Deal Amount ₹ (कुल सौदा राशि)", defaultValue: "28500000", type: "number" },
      { key: "advanceTokenAmount", label: "Bayana / Advance Paid ₹ (बयाना राशि)", defaultValue: "2500000", type: "number" },
      { key: "registryDeadline", label: "Registry Target Date (रजिस्ट्री की अंतिम तिथि)", defaultValue: "2026-12-15", type: "date" },
    ],
    templateContent: `AGREEMENT TO SELL / विक्रय इकरारनामा (बयानामा)

यह विक्रय अनुबंध पत्र आज दिनांक को स्थान इंदौर में निष्पादित हुआ:

विक्रेता (Seller): श्री {{sellerName}}
क्रेता (Buyer): श्री {{buyerName}}

प्रॉपर्टी का विवरण:
{{propertyDescription}}

नियम एवं शर्तें:
1. विक्रेता अपनी उक्त अचल संपत्ति को क्रेता को कुल तयशुदा राशि ₹{{totalDealAmount}}/- में विक्रय करने हेतु पूर्णतः सहमत है।
2. क्रेता ने बयाना (Advance Token Amount) स्वरूप ₹{{advanceTokenAmount}}/- का भुगतान चेक/RTGS द्वारा विक्रेता को कर दिया है, जिसकी प्राप्ति विक्रेता स्वीकार करता है।
3. शेष धनराशि का भुगतान क्रेता द्वारा दिनांक {{registryDeadline}} तक पंजीयन कार्यालय (उप-पंजीयक इंदौर) में रजिस्ट्री के समय किया जाएगा।
4. विक्रेता प्रमाणित करता है कि उक्त संपत्ति पूर्णतः भारमुक्त, विवादरहित एवं साफ मालिकाना हक की है। किसी बैंक या वित्तीय संस्था में कोई बंधक नहीं है।
5. यदि विक्रेता नियत तिथि तक रजिस्ट्री नहीं कराता है, तो क्रेता न्यायालय के माध्यम से विशिष्ट अनुपालन (Specific Performance) कराने का पूर्ण अधिकारी होगा।

विक्रेता के हस्ताक्षर: ____________________
क्रेता के हस्ताक्षर: ____________________
गवाह 1: ____________________     गवाह 2: ____________________`,
  },
  {
    id: "draft-registry-checklist",
    title: "Property Registry Checklist (रजिस्ट्री ज़रूरी कागज़ात चेकलिस्ट)",
    titleHindi: "उप-पंजीयक कार्यालय रजिस्ट्री चेकलिस्ट",
    category: "Compliance",
    estimatedTimeMin: 2,
    description: "Complete list of statutory documents required at the Sub-Registrar office for smooth deed registration in MP.",
    variables: [
      { key: "propertyLocality", label: "Locality (स्थान)", defaultValue: "Indore (म.प्र.)", type: "text" },
    ],
    templateContent: `PROPERTY REGISTRATION MANDATORY CHECKLIST / रजिस्ट्री चेकलिस्ट

उप-पंजीयक कार्यालय में रजिस्ट्री हेतु आवश्यक दस्तावेज़:

1. [ ] मूल विक्रय पत्र (Sale Deed Draft) ई-स्टाम्प पेपर पर मुद्रित
2. [ ] विक्रेता का मूल स्वामित्व दस्तावेज़ (पूर्व रजिस्ट्री / आवंटन पत्र)
3. [ ] नगर निगम चालू वित्तीय वर्ष का संपत्ति कर (Property Tax) अदेय प्रमाणपत्र (NOC)
4. [ ] नामांतरण (Mutation) प्रतिलिपि एवं अद्यतन खसरा / B-1 खतौनी नकल
5. [ ] विक्रेता एवं क्रेता दोनों के आधार कार्ड एवं पैन कार्ड (PAN Card अनिवार्य)
6. [ ] दो सक्षम वयस्क गवाह (पहचान पत्र एवं आधार कार्ड सहित)
7. [ ] विकास प्राधिकरण (IDA) अथवा T&CP स्वीकृत अभिन्यास (Sanction Map)
8. [ ] संपदा (SAMPADA MP) ऑनलाइन स्लॉट बुकिंग रसीद
9. [ ] बैंक चेक / RTGS यूटीआर विवरण (भुगतान के प्रमाण स्वरूप)
10. [ ] टीडीएस (TDS Form 26QB) रसीद (यदि संपत्ति मूल्य ₹50 लाख से अधिक हो - धारा 194-IA)

निर्देश: संपदा पोर्टल पर ऑनलाइन स्लॉट समय से 15 मिनट पूर्व दोनों पक्ष उपस्थित हों।`,
  },
];
