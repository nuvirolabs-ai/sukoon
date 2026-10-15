// Data layer for Construction Hub & Daily Raw Material Rates

export interface RawMaterialRate {
  id: string;
  name: string;
  nameHindi: string;
  category: "Steel" | "Cement" | "Sand" | "Aggregates" | "Bricks";
  brandOrType: string;
  unit: string;
  unitHindi: string;
  currentRate: number;
  previousRate: number;
  trend: "up" | "down" | "stable";
  changeAmount: number;
  lastUpdated: string;
  marketLocation: string;
}

export interface MaterialDealer {
  id: string;
  name: string;
  businessName: string;
  categories: string[];
  location: string;
  address: string;
  phone: string;
  whatsapp: string;
  rating: number;
  verified: boolean;
  specialty: string;
}

export interface ArchitectProfile {
  id: string;
  name: string;
  firm: string;
  experienceYears: number;
  location: string;
  specialization: string;
  notableProjects: string;
  phone: string;
  whatsapp: string;
  rating: number;
  verified: boolean;
  avatarText: string;
}

export interface ConceptualPlan {
  id: string;
  dimensions: string; // e.g. "20*50"
  plotAreaSqft: number;
  builtUpSqft: number;
  title: string;
  configuration: string; // e.g. "3 BHK Duplex"
  facing: string; // e.g. "East Facing (पूर्व मुखी)"
  vastuCompliant: boolean;
  floors: string;
  estimatedCost: string;
  description: string;
  features: string[];
  roomDetails: {
    groundFloor: string[];
    firstFloor?: string[];
  };
}

export interface QuickExpense {
  id: string;
  agencyName: string;
  amount: number;
  category: "Material" | "Labor" | "Equipment" | "Contractor" | "Miscellaneous";
  date: string;
  note?: string;
}

// Daily Live Rates for Indore Market (मंडी भाव)
export const DAILY_MATERIAL_RATES: RawMaterialRate[] = [
  {
    id: "mat-01",
    name: "TMT Sariya (Iron / Steel)",
    nameHindi: "टीएमटी सरिया (लोहा)",
    category: "Steel",
    brandOrType: "Tata Tiscon / Kamdhenu Fe 550D (12mm)",
    unit: "per kg",
    unitHindi: "प्रति किलो",
    currentRate: 57.5,
    previousRate: 56.0,
    trend: "up",
    changeAmount: 1.5,
    lastUpdated: "Today, 11:30 AM",
    marketLocation: "Loha Mandi, Indore",
  },
  {
    id: "mat-02",
    name: "TMT Sariya (Commercial / Secondary)",
    nameHindi: "लोहा सरिया (लोकल/कमर्शियल)",
    category: "Steel",
    brandOrType: "Moira / Prime Gold Fe 500D",
    unit: "per kg",
    unitHindi: "प्रति किलो",
    currentRate: 52.0,
    previousRate: 52.5,
    trend: "down",
    changeAmount: -0.5,
    lastUpdated: "Today, 11:30 AM",
    marketLocation: "Loha Mandi, Indore",
  },
  {
    id: "mat-03",
    name: "Narmada Sand (Reti)",
    nameHindi: "नर्मदा रेती (बालू)",
    category: "Sand",
    brandOrType: "Coarse River Sand (छनी हुई रेती)",
    unit: "per cu.ft",
    unitHindi: "प्रति घन फीट (CFT)",
    currentRate: 46.0,
    previousRate: 45.0,
    trend: "up",
    changeAmount: 1.0,
    lastUpdated: "Today, 09:00 AM",
    marketLocation: "Nemawar Road Depot, Indore",
  },
  {
    id: "mat-04",
    name: "Crushed M-Sand (Manufactured Sand)",
    nameHindi: "एम-सैंड (पत्थर की रेती)",
    category: "Sand",
    brandOrType: "Double Washed Plaster Grade",
    unit: "per cu.ft",
    unitHindi: "प्रति घन फीट (CFT)",
    currentRate: 34.0,
    previousRate: 34.0,
    trend: "stable",
    changeAmount: 0,
    lastUpdated: "Today, 09:00 AM",
    marketLocation: "Rau Quarry Depot, Indore",
  },
  {
    id: "mat-05",
    name: "UltraTech Cement",
    nameHindi: "अल्ट्राटेक सीमेंट (पीपीसी)",
    category: "Cement",
    brandOrType: "UltraTech Super PPC Grade 53",
    unit: "per 50kg bag",
    unitHindi: "प्रति 50 किलो बोरी",
    currentRate: 385.0,
    previousRate: 380.0,
    trend: "up",
    changeAmount: 5.0,
    lastUpdated: "Today, 10:00 AM",
    marketLocation: "Dewas Naka, Indore",
  },
  {
    id: "mat-06",
    name: "Ambuja Cement",
    nameHindi: "अंबुजा सीमेंट (कवच)",
    category: "Cement",
    brandOrType: "Ambuja Kawach Water-Shield PPC",
    unit: "per 50kg bag",
    unitHindi: "प्रति 50 किलो बोरी",
    currentRate: 375.0,
    previousRate: 375.0,
    trend: "stable",
    changeAmount: 0,
    lastUpdated: "Today, 10:00 AM",
    marketLocation: "Dewas Naka, Indore",
  },
  {
    id: "mat-07",
    name: "Black Stone Chips (Gitti 20mm)",
    nameHindi: "काली गिट्टी (20mm स्लैब)",
    category: "Aggregates",
    brandOrType: "Crushed Basalt Metal (RCC Grade)",
    unit: "per cu.ft",
    unitHindi: "प्रति घन फीट (CFT)",
    currentRate: 29.0,
    previousRate: 30.0,
    trend: "down",
    changeAmount: -1.0,
    lastUpdated: "Today, 08:30 AM",
    marketLocation: "Bypass Stone Crushers, Indore",
  },
  {
    id: "mat-08",
    name: "Red Clay Bricks (लाल ईंट)",
    nameHindi: "लाल भट्ठे की ईंट (पक्की)",
    category: "Bricks",
    brandOrType: "Standard 9\" x 4\" x 3\" Kiln Baked",
    unit: "per piece",
    unitHindi: "प्रति नग",
    currentRate: 7.8,
    previousRate: 7.5,
    trend: "up",
    changeAmount: 0.3,
    lastUpdated: "Today, 08:30 AM",
    marketLocation: "Sanwer Road Bhattas, Indore",
  },
  {
    id: "mat-09",
    name: "AAC Fly Ash Blocks",
    nameHindi: "एएसी हल्के ब्लॉक (6 इंच)",
    category: "Bricks",
    brandOrType: "Siporex / Magicrete 600x200x150mm",
    unit: "per piece",
    unitHindi: "प्रति नग",
    currentRate: 64.0,
    previousRate: 64.0,
    trend: "stable",
    changeAmount: 0,
    lastUpdated: "Today, 10:00 AM",
    marketLocation: "Manglia Depot, Indore",
  },
];

// Listed Authorized Material Dealers in Indore
export const AUTHORIZED_DEALERS: MaterialDealer[] = [
  {
    id: "dlr-01",
    name: "Rameshwar Patel",
    businessName: "Patel Steel & Cement Traders",
    categories: ["TMT Sariya", "UltraTech Cement", "Binding Wire"],
    location: "Loha Mandi, Indore",
    address: "Shop 14-16, Near Central Gate, Loha Mandi",
    phone: "+91 98260 12345",
    whatsapp: "919826012345",
    rating: 4.8,
    verified: true,
    specialty: "Authorized Tata Tiscon & UltraTech Wholesale Distributor",
  },
  {
    id: "dlr-02",
    name: "Gaurav Khandelwal",
    businessName: "Khandelwal Reti & Gitti Supply",
    categories: ["Narmada Sand", "Black Metal Gitti", "Crusher Dust"],
    location: "Nemawar Road, Indore",
    address: "Plot 88, Near Toll Plaza, Nemawar Road",
    phone: "+91 98930 54321",
    whatsapp: "919893054321",
    rating: 4.7,
    verified: true,
    specialty: "Direct Dam / Quarry Delivery (Dumper & Tractor Trolley)",
  },
  {
    id: "dlr-03",
    name: "Mohanlal Sharma",
    businessName: "Indore Building Material Mart",
    categories: ["Ambuja Cement", "AAC Blocks", "Waterproofing Chemicals"],
    location: "Dewas Naka, Indore",
    address: "42 Transport Nagar, Ring Road, Dewas Naka",
    phone: "+91 94250 99887",
    whatsapp: "919425099887",
    rating: 4.9,
    verified: true,
    specialty: "Dr. Fixit Certified Waterproofing & Fast Bulk Supply",
  },
  {
    id: "dlr-04",
    name: "Mukesh Chouhan",
    businessName: "Malwa Bricks & Clay Products",
    categories: ["Kiln Baked Bricks", "Terracotta Tiles"],
    location: "Sanwer Road, Indore",
    address: "Sector F, Sanwer Road Industrial Area",
    phone: "+91 98270 44556",
    whatsapp: "919827044556",
    rating: 4.6,
    verified: true,
    specialty: "A-Grade Red Clay Kiln Bricks with Lowest Breakage Guarantee",
  },
];

// Listed Authorized Architects in Indore
export const AUTHORIZED_ARCHITECTS: ArchitectProfile[] = [
  {
    id: "arch-01",
    name: "Ar. Rajiv Nene (COA Reg: CA/98/22814)",
    firm: "Rajiv Nene & Associates",
    experienceYears: 24,
    location: "Palasia / Old Palasia, Indore",
    specialization: "Luxury Bungalows, Modern Vastu Duplexes & Villa Sanctions",
    notableProjects: "Over 350+ completed residences in Vijay Nagar, Saket & Bypass",
    phone: "+91 98260 77112",
    whatsapp: "919826077112",
    rating: 4.9,
    verified: true,
    avatarText: "RN",
  },
  {
    id: "arch-02",
    name: "Ar. Neha Verma",
    firm: "Studio VastuKala Architecture",
    experienceYears: 14,
    location: "Vijay Nagar, Indore",
    specialization: "100% Vastu-Compliant 20x50 & 30x50 Modern Plot Plans",
    notableProjects: "Award-winning compact row houses in Super Corridor & Scheme 78",
    phone: "+91 94253 66221",
    whatsapp: "919425366221",
    rating: 4.8,
    verified: true,
    avatarText: "NV",
  },
  {
    id: "arch-03",
    name: "Ar. Ashish Kulkarni",
    firm: "DesignGrid Structural & Architectural Studio",
    experienceYears: 18,
    location: "AB Road, Indore",
    specialization: "Structural RCC Design, T&CP Town Planning Map Sanctions",
    notableProjects: "Commercial complexes & high-end villas across MP",
    phone: "+91 98269 88334",
    whatsapp: "919826988334",
    rating: 4.7,
    verified: true,
    avatarText: "AK",
  },
];

// 5 Standard Conceptual Floor Plans
export const CONCEPTUAL_PLANS: ConceptualPlan[] = [
  {
    id: "plan-15-45",
    dimensions: "15*45",
    plotAreaSqft: 675,
    builtUpSqft: 1150,
    title: "15 × 45 Compact Smart Duplex (675 sq.ft)",
    configuration: "2 BHK + Pooja + Car Porch",
    facing: "East Facing (पूर्व मुखी - उत्तम वास्तु)",
    vastuCompliant: true,
    floors: "Ground + First Floor (G+1)",
    estimatedCost: "₹21 - ₹24 Lakhs (Standard Finishing)",
    description: "Designed for compact urban plots with maximum ventilation, smart natural light shafts (cutouts), and complete space optimization.",
    features: [
      "Front Car/Bike Parking Porch (10' x 14')",
      "Ventilated Living Room with double height feeling",
      "Agni-Kona (South-East) Kitchen with utility wash area",
      "Master bedroom with private balcony on first floor",
    ],
    roomDetails: {
      groundFloor: [
        "Parking Porch: 9'6\" x 13'0\"",
        "Living Room: 13'6\" x 11'0\"",
        "Kitchen (South-East): 7'0\" x 8'6\"",
        "Common Washroom: 4'6\" x 6'0\"",
        "Ground Bedroom: 10'0\" x 11'0\"",
        "Rear Ventilation Shaft (OTS): 3'0\" x 4'0\"",
      ],
      firstFloor: [
        "Master Bedroom: 13'6\" x 11'6\" (Attached Bath: 5'0\" x 7'0\")",
        "Front Covered Balcony: 13'6\" x 4'0\"",
        "Family Lounge: 9'0\" x 8'0\"",
        "Open Terrace Access",
      ],
    },
  },
  {
    id: "plan-20-50",
    dimensions: "20*50",
    plotAreaSqft: 1000,
    builtUpSqft: 1750,
    title: "20 × 50 Prime Modern Villa (1,000 sq.ft)",
    configuration: "3 BHK + Drawing Room + Modular Kitchen",
    facing: "North-East Facing (ईशान मुखी)",
    vastuCompliant: true,
    floors: "Ground + First Floor (G+1)",
    estimatedCost: "₹32 - ₹36 Lakhs (Premium Finishing)",
    description: "The most popular Indian residential plot size. Balanced proportions, wide 20-foot frontage, spacious sedan car parking, and peaceful family living.",
    features: [
      "Large Covered Car Parking for Sedan / SUV",
      "Separate Formal Drawing Room & Family Living Zone",
      "Pooja Room in North-East (ईशान कोण)",
      "Large Master Bedroom with Walk-in Wardrobe space",
      "Spacious Modular Kitchen with Breakfast Counter",
    ],
    roomDetails: {
      groundFloor: [
        "Car Porch: 10'0\" x 15'0\"",
        "Drawing Room: 12'6\" x 13'0\"",
        "Family Living & Dining: 18'6\" x 11'6\"",
        "Modular Kitchen (SE): 8'6\" x 10'0\"",
        "Pooja Room (NE): 4'0\" x 5'0\"",
        "Ground Bedroom: 11'0\" x 12'0\" (Attached Bath)",
      ],
      firstFloor: [
        "Master Bedroom 1: 12'6\" x 14'0\" with Dresser & Bath",
        "Bedroom 2: 11'0\" x 12'0\"",
        "Family TV Lounge: 13'0\" x 10'0\"",
        "Front Balcony Deck: 18'6\" x 5'0\"",
      ],
    },
  },
  {
    id: "plan-30-50",
    dimensions: "30*50",
    plotAreaSqft: 1500,
    builtUpSqft: 2500,
    title: "30 × 50 Executive Garden Bungalow (1,500 sq.ft)",
    configuration: "4 BHK + Servant Room + Front Lawn",
    facing: "East Facing (सूर्य मुखी)",
    vastuCompliant: true,
    floors: "G+1 with Private Terrace Lounge",
    estimatedCost: "₹48 - ₹55 Lakhs",
    description: "Expansive 30-foot front elevation allowing grand entrance, 2-car driveway parking, lush green side setback, and luxurious open-to-sky courtyard.",
    features: [
      "Dual Car Covered Parking + Front Garden Lawn",
      "Central Brahmasthan Courtyard with skylight",
      "Spacious Dining area connected to Open American Kitchen",
      "Private Home Office / Study Room",
    ],
    roomDetails: {
      groundFloor: [
        "Dual Parking & Lawn: 14'0\" x 17'0\"",
        "Double Height Living Hall: 15'0\" x 18'0\"",
        "Dining Room: 12'0\" x 12'0\"",
        "Kitchen + Store + Utility: 10'0\" x 14'0\"",
        "Guest Bedroom: 13'0\" x 13'0\"",
        "Pooja Ghar: 6'0\" x 6'0\"",
      ],
      firstFloor: [
        "Master Suite with Balcony: 15'0\" x 16'0\"",
        "Kids Bedroom: 13'0\" x 13'0\"",
        "Study / Home Theatre Room: 12'0\" x 14'0\"",
        "Open Terrace Gazebo space",
      ],
    },
  },
  {
    id: "plan-40-60",
    dimensions: "40*60",
    plotAreaSqft: 2400,
    builtUpSqft: 3800,
    title: "40 × 60 Luxury Estate Villa (2,400 sq.ft)",
    configuration: "4 BHK + Home Theatre + Gym + 2-Car Porch",
    facing: "North Facing (कुबेर मुखी - समृद्धि कारक)",
    vastuCompliant: true,
    floors: "G+1 with Roof Deck",
    estimatedCost: "₹75 - ₹88 Lakhs",
    description: "Designed for premium upscale colonies (Indore Bypass, Nipania, Scheme 140). High ceiling foyer, grand perimeter setbacks, and resort-style living.",
    features: [
      "Grand Entrance Foyer with double ceiling height",
      "All 4 Bedrooms with en-suite luxury bathrooms and dressing areas",
      "Dedicated Home Theatre Room (14' x 18')",
      "Servant Room with independent side entry",
    ],
    roomDetails: {
      groundFloor: [
        "Double Car Porch: 18'0\" x 18'0\"",
        "Grand Living Foyer: 22'0\" x 16'0\"",
        "Formal Dining Area: 14'0\" x 14'0\"",
        "Gourmet Kitchen + Wet Kitchen + Store: 16'0\" x 12'0\"",
        "Guest Suite: 15'0\" x 14'0\"",
        "Powder Room & Pooja Mandir",
      ],
      firstFloor: [
        "Presidential Master Suite: 18'0\" x 18'0\" with Spa Bath & Balcony",
        "Bedroom 3 & Bedroom 4: 15'0\" x 14'0\" each",
        "Acoustic Home Theatre: 14'0\" x 18'0\"",
      ],
    },
  },
  {
    id: "plan-50-80",
    dimensions: "50*80",
    plotAreaSqft: 4000,
    builtUpSqft: 6200,
    title: "50 × 80 Royal Heritage Mansion (4,000 sq.ft)",
    configuration: "5 BHK + Swimming Pool / Jacuzzi + Lift Provision + 3-Car Parking",
    facing: "East-North Corner Facing",
    vastuCompliant: true,
    floors: "Basement / Stilt + Ground + First Floor",
    estimatedCost: "₹1.25 - ₹1.50 Crore",
    description: "Architectural masterpiece for large corner plots. Features internal elevator provision, private plunge pool/deck, 3 car parking, and royal classical facade.",
    features: [
      "Stately 50-Foot Portico & 3 Car Garage",
      "Private Rear Plunge Pool & Deck Lawn",
      "Passenger Elevator (Lift) connecting all levels",
      "Separate Formal Drawing Room & Informal Family Lounge",
    ],
    roomDetails: {
      groundFloor: [
        "Portico Driveway: 20'0\" x 20'0\"",
        "Formal Drawing Room: 18'0\" x 22'0\"",
        "Family Living & Grand Dining: 24'0\" x 18'0\"",
        "Modular Island Kitchen + Pantry: 18'0\" x 14'0\"",
        "Master Guest Bedroom: 16'0\" x 16'0\"",
        "Private Garden Deck & Water Feature",
      ],
      firstFloor: [
        "Master Bedroom 1 & 2: 18'0\" x 18'0\" each with walk-in closet",
        "Bedrooms 3 & 4: 16'0\" x 16'0\" with balconies",
        "Upper Lounge & Bar Counter: 18'0\" x 16'0\"",
      ],
    },
  },
];

// Initial Quick Expenses Notebook entries
export const INITIAL_QUICK_EXPENSES: QuickExpense[] = [
  {
    id: "exp-01",
    agencyName: "Sharma Sariya Steels",
    amount: 86250,
    category: "Material",
    date: "14 Oct 2026",
    note: "1.5 Ton Tata Tiscon 12mm & 16mm for First Floor Slab",
  },
  {
    id: "exp-02",
    agencyName: "Mukesh Mistri (Thekedar)",
    amount: 32000,
    category: "Labor",
    date: "12 Oct 2026",
    note: "Centering and Shuttering labor weekly payment",
  },
  {
    id: "exp-03",
    agencyName: "Khandelwal Reti Supply",
    amount: 18400,
    category: "Material",
    date: "10 Oct 2026",
    note: "2 Dumper Narmada Sand (छनी हुई रेती)",
  },
  {
    id: "exp-04",
    agencyName: "Shree Ram Concrete Mixer Machine",
    amount: 8500,
    category: "Equipment",
    date: "08 Oct 2026",
    note: "Slab casting mixer machine & vibrator hire",
  },
  {
    id: "exp-05",
    agencyName: "UltraTech Cement Depot Dewas Naka",
    amount: 38500,
    category: "Material",
    date: "05 Oct 2026",
    note: "100 Bags UltraTech Super PPC for columns",
  },
];
