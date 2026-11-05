// Data layer for Construction Hub & Daily Raw Material Rates

export interface RawMaterialRate {
  id: string;
  name: string;
  nameAlt: string;
  category: "Steel" | "Cement" | "Sand" | "Aggregates" | "Bricks";
  brandOrType: string;
  unit: string;
  unitShort: string;
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
  facing: string; // e.g. "East Facing (Vastu Compliant)"
  vastuCompliant: boolean;
  floors: string;
  estimatedCost: string;
  elevationStyle?: string;
  elevationDescription?: string;
  description: string;
  features: string[];
  roomDetails: {
    groundFloor: string[];
    firstFloor?: string[];
  };
}

export interface CivilEngineerProfile {
  id: string;
  name: string;
  firm: string;
  experienceYears: number;
  location: string;
  specialization: string;
  qualifications: string;
  phone: string;
  whatsapp: string;
  rating: number;
  verified: boolean;
  avatarText: string;
  projectsCompleted: number;
}

export interface QuickExpense {
  id: string;
  agencyName: string;
  amount: number;
  category: "Material" | "Labor" | "Equipment" | "Contractor" | "Miscellaneous";
  date: string;
  note?: string;
}

// Daily Live Rates for Indore Market
export const DAILY_MATERIAL_RATES: RawMaterialRate[] = [
  {
    id: "mat-01",
    name: "TMT Steel Bars (Sariya)",
    nameAlt: "Fe 550D High Strength Steel",
    category: "Steel",
    brandOrType: "Tata Tiscon / Kamdhenu Fe 550D (12mm)",
    unit: "per kg",
    unitShort: "/kg",
    currentRate: 57.5,
    previousRate: 56.0,
    trend: "up",
    changeAmount: 1.5,
    lastUpdated: "Today, 11:30 AM",
    marketLocation: "Loha Mandi, Indore",
  },
  {
    id: "mat-02",
    name: "TMT Steel (Secondary Grade)",
    nameAlt: "Fe 500D Commercial Steel",
    category: "Steel",
    brandOrType: "Moira / Prime Gold Fe 500D",
    unit: "per kg",
    unitShort: "/kg",
    currentRate: 52.0,
    previousRate: 52.5,
    trend: "down",
    changeAmount: -0.5,
    lastUpdated: "Today, 11:30 AM",
    marketLocation: "Loha Mandi, Indore",
  },
  {
    id: "mat-03",
    name: "Narmada River Sand",
    nameAlt: "Coarse River Sand (Screened)",
    category: "Sand",
    brandOrType: "Coarse Washed River Sand",
    unit: "per cu.ft",
    unitShort: "/cu.ft",
    currentRate: 46.0,
    previousRate: 45.0,
    trend: "up",
    changeAmount: 1.0,
    lastUpdated: "Today, 09:00 AM",
    marketLocation: "Nemawar Road Depot, Indore",
  },
  {
    id: "mat-04",
    name: "Crushed M-Sand (Manufactured)",
    nameAlt: "Double Washed Stone Dust",
    category: "Sand",
    brandOrType: "Double Washed Plaster Grade",
    unit: "per cu.ft",
    unitShort: "/cu.ft",
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
    nameAlt: "Super PPC Grade 53",
    category: "Cement",
    brandOrType: "UltraTech Super PPC Grade 53",
    unit: "per 50kg bag",
    unitShort: "/bag",
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
    nameAlt: "Kawach Water-Shield PPC",
    category: "Cement",
    brandOrType: "Ambuja Kawach Water-Shield PPC",
    unit: "per 50kg bag",
    unitShort: "/bag",
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
    nameAlt: "RCC Slab Grade Basalt Aggregate",
    category: "Aggregates",
    brandOrType: "Crushed Basalt Metal (RCC Grade)",
    unit: "per cu.ft",
    unitShort: "/cu.ft",
    currentRate: 29.0,
    previousRate: 30.0,
    trend: "down",
    changeAmount: -1.0,
    lastUpdated: "Today, 08:30 AM",
    marketLocation: "Bypass Stone Crushers, Indore",
  },
  {
    id: "mat-08",
    name: "Red Clay Kiln Bricks",
    nameAlt: "Standard Baked Red Bricks",
    category: "Bricks",
    brandOrType: "Standard 9\" x 4\" x 3\" Kiln Baked",
    unit: "per piece",
    unitShort: "/pc",
    currentRate: 7.8,
    previousRate: 7.5,
    trend: "up",
    changeAmount: 0.3,
    lastUpdated: "Today, 08:30 AM",
    marketLocation: "Sanwer Road Bhattas, Indore",
  },
  {
    id: "mat-09",
    name: "AAC Lightweight Blocks",
    nameAlt: "6-Inch Aerated Concrete Blocks",
    category: "Bricks",
    brandOrType: "Siporex / Magicrete 600x200x150mm",
    unit: "per piece",
    unitShort: "/pc",
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
    categories: ["TMT Steel", "UltraTech Cement", "Binding Wire"],
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
    businessName: "Khandelwal Sand & Aggregate Supply",
    categories: ["Narmada Sand", "Black Metal Aggregate", "Crusher Dust"],
    location: "Nemawar Road, Indore",
    address: "Plot 88, Near Toll Plaza, Nemawar Road",
    phone: "+91 98930 54321",
    whatsapp: "919893054321",
    rating: 4.7,
    verified: true,
    specialty: "Direct Quarry Delivery (Dumper & Tractor Trolley)",
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
    specialty: "Dr. Fixit Certified Waterproofing & Wholesale Bulk Supply",
  },
  {
    id: "dlr-04",
    name: "Mukesh Chouhan",
    businessName: "Malwa Bricks & Clay Products",
    categories: ["Kiln Baked Bricks", "Terracotta Tiles"],
    location: "Sanwer Road, Indore",
    address: "Sector F, Industrial Area, Sanwer Road",
    phone: "+91 97550 11223",
    whatsapp: "919755011223",
    rating: 4.6,
    verified: true,
    specialty: "Direct Kiln Supply (Truckloads of 5,000 / 10,000 pieces)",
  },
];

// Registered Architects Directory in Indore
export const AUTHORIZED_ARCHITECTS: ArchitectProfile[] = [
  {
    id: "arch-01",
    name: "Ar. Prashant Agrawal",
    firm: "Agrawal & Associates Design Studio",
    experienceYears: 14,
    location: "Vijay Nagar, Indore",
    specialization: "Modern Residential Architecture, Vastu Planning, Interior Design",
    notableProjects: "Over 200 luxury bungalows built in Scheme 54, 78, and Bypass",
    phone: "+91 98270 44556",
    whatsapp: "919827044556",
    rating: 4.9,
    verified: true,
    avatarText: "PA",
  },
  {
    id: "arch-02",
    name: "Ar. Neha Verma",
    firm: "GreenSpace Eco Architecture",
    experienceYears: 9,
    location: "Super Corridor, Indore",
    specialization: "Sustainable Eco-Homes, Zero Energy Design, Duplex Layouts",
    notableProjects: "Boutique villas on Super Corridor & Airport Road",
    phone: "+91 94066 33221",
    whatsapp: "919406633221",
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

// Registered Civil Engineers & Structural Consultants Directory
export const AUTHORIZED_CIVIL_ENGINEERS: CivilEngineerProfile[] = [
  {
    id: "eng-01",
    name: "Er. Amit Sharma",
    firm: "Apex Structural & Civil Consultants",
    experienceYears: 16,
    location: "Vijay Nagar / Scheme 54, Indore",
    specialization: "RCC Frame Design, Seismic Soil Analysis & Bar Bending Audits",
    qualifications: "M.Tech (Structural Engineering) IIT Roorkee • Chartered Engineer (IEI)",
    phone: "+91 98260 55112",
    whatsapp: "919826055112",
    rating: 4.9,
    verified: true,
    avatarText: "AS",
    projectsCompleted: 340,
  },
  {
    id: "eng-02",
    name: "Er. Rajesh Choudhary",
    firm: "Choudhary & Associates Structural Engineers",
    experienceYears: 22,
    location: "Dewas Naka / Bypass, Indore",
    specialization: "Foundation Stability, Heavy Raft Footings & Municipal Sanctions",
    qualifications: "B.E. Civil (SGSITS Indore) • Govt Approved Structural Engineer",
    phone: "+91 98931 44220",
    whatsapp: "919893144220",
    rating: 4.8,
    verified: true,
    avatarText: "RC",
    projectsCompleted: 510,
  },
  {
    id: "eng-03",
    name: "Er. Priya Solanki",
    firm: "Solanki Civil & Quality Testing Labs",
    experienceYears: 11,
    location: "Super Corridor / Airport Road, Indore",
    specialization: "Concrete Cube Testing, Site Supervision & Water Proofing Audits",
    qualifications: "M.Tech (Construction Management) • NABL Certified Quality Auditor",
    phone: "+91 94251 77889",
    whatsapp: "919425177889",
    rating: 4.9,
    verified: true,
    avatarText: "PS",
    projectsCompleted: 195,
  },
];

// Standard Conceptual Floor Plans & 3D Elevation Concepts
export const CONCEPTUAL_PLANS: ConceptualPlan[] = [
  {
    id: "plan-15-50",
    dimensions: "15*50",
    plotAreaSqft: 750,
    builtUpSqft: 1350,
    title: "15 × 50 Smart Urban Duplex (750 sq.ft)",
    configuration: "2 BHK + Study + Front Car Porch",
    facing: "East Facing (Sunrise Alignment)",
    vastuCompliant: true,
    floors: "Ground + First Floor (G+1)",
    estimatedCost: "₹24 - ₹28 Lakhs (Turnkey)",
    elevationStyle: "Contemporary Vertical Louver & Glass Balcony",
    elevationDescription: "Sleek vertical wooden-finish aluminium louvers with warm recessed LED cove lighting, maximizing natural daylight while preserving privacy.",
    description: "Designed specifically for narrow urban plots. Open plan living with cross ventilation shafts and zero wasted corridor space.",
    features: [
      "Front Covered Sedan Parking Porch (10' x 15')",
      "Double-height light well bringing natural sky light into living hall",
      "Vastu-compliant South-East kitchen with separate utility area",
      "Upper floor master bedroom with cantilevered front glass balcony",
    ],
    roomDetails: {
      groundFloor: [
        "Car Porch: 10'0\" x 15'0\"",
        "Living Room: 13'6\" x 12'0\"",
        "Kitchen (South-East): 8'0\" x 9'0\"",
        "Ground Bedroom: 10'6\" x 11'0\"",
        "Common Bath: 4'6\" x 6'6\"",
      ],
      firstFloor: [
        "Master Bedroom: 13'6\" x 12'6\" (Attached Bath: 5'0\" x 7'0\")",
        "Kids Bedroom / Study: 10'6\" x 10'0\"",
        "Front Covered Balcony: 13'6\" x 4'6\"",
        "Open Terrace Access",
      ],
    },
  },
  {
    id: "plan-20-50",
    dimensions: "20*50",
    plotAreaSqft: 1000,
    builtUpSqft: 1850,
    title: "20 × 50 Prime Modern Villa (1,000 sq.ft)",
    configuration: "3 BHK + Drawing Room + Modular Kitchen",
    facing: "North-East Facing (Vastu Compliant)",
    vastuCompliant: true,
    floors: "Ground + First Floor (G+1)",
    estimatedCost: "₹34 - ₹38 Lakhs (Premium Finishing)",
    elevationStyle: "Modern Minimalist Glass & Stone Cladding",
    elevationDescription: "Exterior travertine stone cladding accent wall, frameless toughened glass railings, and a bold cantilevered roof canopy.",
    description: "The most popular residential plot proportion across Indian cities. Wide 20-foot frontage, full SUV car parking, and generous family living zones.",
    features: [
      "Large Covered SUV Parking Porch (11' x 16')",
      "Separate Formal Drawing Room & Private Family Living Lounge",
      "Dedicated Pooja Room in North-East quadrant",
      "Master Suite with walk-in closet space and terrace sit-out",
    ],
    roomDetails: {
      groundFloor: [
        "Car Porch: 11'0\" x 16'0\"",
        "Formal Drawing Room: 12'6\" x 13'0\"",
        "Family Living & Dining: 18'6\" x 12'0\"",
        "Modular Kitchen (South-East): 8'6\" x 10'6\"",
        "Pooja Room (North-East): 4'6\" x 5'0\"",
        "Ground Bedroom: 11'6\" x 12'0\" (Attached Bath)",
      ],
      firstFloor: [
        "Master Bedroom 1: 13'0\" x 14'6\" with Dresser & Bath",
        "Bedroom 2: 11'6\" x 12'6\"",
        "Family TV Lounge: 13'0\" x 10'6\"",
        "Front Balcony Deck: 18'6\" x 5'0\"",
      ],
    },
  },
  {
    id: "plan-30-50",
    dimensions: "30*50",
    plotAreaSqft: 1500,
    builtUpSqft: 2600,
    title: "30 × 50 Executive Garden Bungalow (1,500 sq.ft)",
    configuration: "4 BHK + Front Lawn + Servant Room",
    facing: "East Facing (Sunrise Alignment)",
    vastuCompliant: true,
    floors: "G+1 with Private Terrace Lounge",
    estimatedCost: "₹50 - ₹58 Lakhs",
    elevationStyle: "Neo-Contemporary Geometric Villa Elevation",
    elevationDescription: "Striking cubic volumes, wooden soffits beneath roof slabs, and floor-to-ceiling panoramic glass windows facing the garden lawn.",
    description: "Expansive 30-foot front elevation providing grand curb appeal, 2-car driveway, lush front lawn, and open-plan kitchen.",
    features: [
      "Dual Car Covered Driveway + Landscaped Front Garden",
      "Central Brahmasthan open courtyard with skylight pergola",
      "Open American Kitchen with Breakfast Island & Utility",
      "Private Home Office / Study on the upper floor",
    ],
    roomDetails: {
      groundFloor: [
        "Dual Parking & Front Lawn: 14'0\" x 18'0\"",
        "Double Height Living Hall: 15'0\" x 18'0\"",
        "Dining Room: 12'0\" x 13'0\"",
        "Kitchen + Store: 10'0\" x 14'0\"",
        "Guest Bedroom: 13'0\" x 13'0\"",
        "Pooja Mandir: 6'0\" x 6'0\"",
      ],
      firstFloor: [
        "Master Suite with Balcony: 15'0\" x 16'6\"",
        "Kids Bedroom: 13'0\" x 13'6\"",
        "Home Office / Gym Room: 12'0\" x 14'0\"",
        "Open Terrace Gazebo: 14'0\" x 16'0\"",
      ],
    },
  },
  {
    id: "plan-30-60",
    dimensions: "30*60",
    plotAreaSqft: 1800,
    builtUpSqft: 3100,
    title: "30 × 60 Premium Grand Duplex (1,800 sq.ft)",
    configuration: "4 BHK + Home Theatre + Powder Room",
    facing: "North-Facing (Prosperity Alignment)",
    vastuCompliant: true,
    floors: "Ground + First Floor (G+1)",
    estimatedCost: "₹62 - ₹72 Lakhs",
    elevationStyle: "Modern Scandinavian Concrete & Timber Elevation",
    elevationDescription: "Exposed architectural concrete panels paired with warm teak timber cladding and black-framed aluminium glazing.",
    description: "Deep 60-foot length allows an expansive private rear garden, large dining foyer, double living spaces, and dedicated home theatre.",
    features: [
      "Extra-long 20-foot porch accommodating 2 large SUVs",
      "Acoustic Home Theatre / Entertainment Lounge",
      "Private rear garden deck accessible from master bedroom",
      "Solar rooftop panel integration with concealed inverter ducting",
    ],
    roomDetails: {
      groundFloor: [
        "Car Porch: 14'0\" x 20'0\"",
        "Grand Living Foyer: 16'0\" x 18'0\"",
        "Dining Space: 13'0\" x 13'0\"",
        "Kitchen + Pantry: 11'0\" x 14'0\"",
        "Guest Bedroom: 14'0\" x 14'0\"",
        "Rear Garden Deck: 12'0\" x 14'0\"",
      ],
      firstFloor: [
        "Master Bedroom: 16'0\" x 17'0\" (Walk-in Dresser & Luxury Bath)",
        "Bedroom 2: 14'0\" x 14'0\"",
        "Home Theatre: 13'0\" x 16'0\"",
        "Covered Balcony Deck: 14'0\" x 6'0\"",
      ],
    },
  },
  {
    id: "plan-50-40",
    dimensions: "50*40",
    plotAreaSqft: 2000,
    builtUpSqft: 3200,
    title: "50 × 40 Wide-Frontage Courtyard Villa (2,000 sq.ft)",
    configuration: "4 BHK + Central Courtyard (Aangan) + 3-Car Parking",
    facing: "East-Facing (Grand Frontage)",
    vastuCompliant: true,
    floors: "Ground + First Floor",
    estimatedCost: "₹65 - ₹76 Lakhs",
    elevationStyle: "Neo-Classical Classical Colonnade Facade",
    elevationDescription: "Stately 50-foot wide neoclassical facade with double-height fluted round pillars, arched French windows, and wrought iron balustrades.",
    description: "Rare 50-foot wide frontage allowing a majestic mansion appearance from the road. Built around an internal climate-controlled courtyard.",
    features: [
      "Stunning 50-foot wide street facade with grand porch",
      "Central open courtyard (Aangan) providing all rooms with garden views",
      "Side setback servant quarters with independent washroom",
      "Separate formal drawing room and informal living wing",
    ],
    roomDetails: {
      groundFloor: [
        "Grand Portico: 18'0\" x 18'0\"",
        "Formal Drawing Room: 16'0\" x 18'0\"",
        "Central Courtyard: 14'0\" x 14'0\"",
        "Dining & Island Kitchen: 14'0\" x 22'0\"",
        "Master Guest Bedroom: 15'0\" x 16'0\"",
      ],
      firstFloor: [
        "Master Bedroom 1: 16'0\" x 18'0\" with Dresser & Bath",
        "Bedroom 2 & 3: 14'0\" x 15'0\" each with attached baths",
        "Family Lounge: 16'0\" x 14'0\"",
        "Panoramic Front Terrace: 20'0\" x 10'0\"",
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
    facing: "North Facing (Prosperity Alignment)",
    vastuCompliant: true,
    floors: "G+1 with Roof Deck",
    estimatedCost: "₹75 - ₹88 Lakhs",
    elevationStyle: "Modern Italian Travertine & Glass Facade",
    elevationDescription: "High-end Italian travertine stone finish, motorized exterior pergolas, and ambient architectural wall grazing illumination.",
    description: "Designed for prime upscale colonies (Indore Bypass, Nipania, Scheme 140). High ceiling foyer, grand perimeter setbacks, and resort-style living.",
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
    configuration: "5 BHK + Private Pool / Deck + Elevator Provision + 3-Car Garage",
    facing: "North-East Corner Facing",
    vastuCompliant: true,
    floors: "Stilt + Ground + First Floor",
    estimatedCost: "₹1.25 - ₹1.50 Crore",
    elevationStyle: "Regal Classical Heritage Mansion Facade",
    elevationDescription: "Stately 50-foot portico with classical Roman archways, carved stone cornices, and exterior mood lighting.",
    description: "Architectural masterpiece for large corner plots. Features internal elevator provision, private plunge pool/deck, 3-car parking, and royal classical facade.",
    features: [
      "Stately 50-Foot Portico & 3 Car Garage",
      "Private Rear Plunge Pool & Deck Lawn",
      "Passenger Elevator connecting all levels",
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
    agencyName: "Sharma Steel Traders",
    amount: 86250,
    category: "Material",
    date: "14 Oct 2026",
    note: "1.5 Ton Tata Tiscon 12mm & 16mm for First Floor Slab",
  },
  {
    id: "exp-02",
    agencyName: "Mukesh Construction Contractor",
    amount: 32000,
    category: "Labor",
    date: "12 Oct 2026",
    note: "Centering and Shuttering weekly labor settlement",
  },
  {
    id: "exp-03",
    agencyName: "Khandelwal Sand Suppliers",
    amount: 18400,
    category: "Material",
    date: "10 Oct 2026",
    note: "2 Dumpers Narmada Screened River Sand",
  },
  {
    id: "exp-04",
    agencyName: "Shree Ram Mixer & Vibrator Hire",
    amount: 8500,
    category: "Equipment",
    date: "08 Oct 2026",
    note: "Slab casting mixer machine & needle vibrator hire",
  },
  {
    id: "exp-05",
    agencyName: "UltraTech Depot Dewas Naka",
    amount: 38500,
    category: "Material",
    date: "05 Oct 2026",
    note: "100 Bags UltraTech Super PPC for RCC columns",
  },
];
