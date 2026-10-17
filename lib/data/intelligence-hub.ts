// Data layer for Intelligence Hub: News, Stocks, Vastu, Glossary, Podcasts

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  date: string;
  category: "Indore Infrastructure" | "Policy & Circle Rates" | "Market Trends";
  tag: string;
  readTime: string;
}

export interface StockTicker {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  marketCap: string;
}

export interface GlossaryTerm {
  term: string;
  termHindi: string;
  pronunciation?: string;
  simpleMeaning: string;
  whyItMatters: string;
  riskNote?: string;
}

export interface CheckpointItem {
  id: string;
  title: string;
  description: string;
  type: "DO" | "DONT";
  stage: "Before Token / Advance" | "During Legal Verification" | "At Possession / Registry";
}

export interface VastuDirection {
  direction: string;
  directionHindi: string;
  element: string;
  governingDeity: string;
  idealRooms: string[];
  avoidRooms: string[];
  keyAdvice: string;
}

export interface MediaResource {
  id: string;
  title: string;
  type: "Video" | "Podcast";
  duration: string;
  creator: string;
  summary: string;
  url: string;
  thumbnail: string;
}

// Today's Real Estate News & Infrastructure Updates
export const REAL_ESTATE_NEWS: NewsItem[] = [
  {
    id: "news-01",
    headline: "Indore Metro Yellow Line Extends to Super Corridor & Airport",
    summary: "Madhya Pradesh Metro Rail Corporation conducts trial runs on the 17.5 km priority corridor. Property demand along Super Corridor stations surges by 28%.",
    source: "Dainik Bhaskar Indore Bureau",
    date: "15 Oct 2026",
    category: "Indore Infrastructure",
    tag: "Metro Growth",
    readTime: "2 min read",
  },
  {
    id: "news-02",
    headline: "Indore Master Plan 2041 Proposes 120-Meter Outer Ring Road",
    summary: "Town & Country Planning (T&CP) releases draft plan connecting Rau, Bypass, Dewas Road and Ujjain Highway. Over 45,000 hectares earmarked for planned residential townships.",
    source: "MP Town Planning Gazette",
    date: "14 Oct 2026",
    category: "Policy & Circle Rates",
    tag: "Master Plan",
    readTime: "3 min read",
  },
  {
    id: "news-03",
    headline: "Collector Guideline Rates in Indore Expected to Revise by 10-15%",
    summary: "District valuation committee assesses prime corridors including Vijay Nagar, Nipania, and AB Bypass. Stamp duty revenue crosses ₹1,800 Crore for the current financial year.",
    source: "Indore Patrika Business",
    date: "12 Oct 2026",
    category: "Policy & Circle Rates",
    tag: "Stamp Duty",
    readTime: "2 min read",
  },
];

// Real Estate Sector Stocks & REITs Ticker
export const REAL_ESTATE_STOCKS: StockTicker[] = [
  {
    symbol: "DLF",
    name: "DLF Limited",
    price: "₹892.40",
    change: "+2.4%",
    isPositive: true,
    marketCap: "₹2.2 Lakh Cr",
  },
  {
    symbol: "GODREJPROP",
    name: "Godrej Properties",
    price: "₹2,840.15",
    change: "+1.8%",
    isPositive: true,
    marketCap: "₹78,900 Cr",
  },
  {
    symbol: "EMBASSY",
    name: "Embassy Office Parks REIT",
    price: "₹388.50",
    change: "+0.6%",
    isPositive: true,
    marketCap: "₹36,800 Cr",
  },
  {
    symbol: "NEXUS",
    name: "Nexus Select Trust (Retail REIT)",
    price: "₹142.20",
    change: "+1.1%",
    isPositive: true,
    marketCap: "₹21,500 Cr",
  },
  {
    symbol: "OBEROIRLTY",
    name: "Oberoi Realty Ltd",
    price: "₹1,780.00",
    change: "-0.4%",
    isPositive: false,
    marketCap: "₹64,700 Cr",
  },
];

// Layman Real Estate Dictionary (Glossary)
export const REAL_ESTATE_GLOSSARY: GlossaryTerm[] = [
  {
    term: "Registry (Sale Deed)",
    termHindi: "Registered Sale Deed",
    simpleMeaning: "Officially registering property ownership in your name at the government Sub-Registrar office by paying the required stamp duty.",
    whyItMatters: "Without an official registry, plain notary agreements or stamp papers have zero legal validity for ownership in court.",
    riskNote: "Always commission a 30-year title search report before executing the final sale deed.",
  },
  {
    term: "Naamantaran (Mutation)",
    termHindi: "Municipal & Revenue Records Update",
    simpleMeaning: "Updating the municipal corporation and revenue department (Tehsil) records to replace the previous owner's name with your name.",
    whyItMatters: "A registry creates the deed, but property tax bills and official land records only reflect your ownership after mutation is completed.",
  },
  {
    term: "Khasra & Khatauni",
    termHindi: "Land Survey & Title Record Numbers",
    simpleMeaning: "Khasra is the unique government survey number assigned to each land parcel, and Khatauni records the title holder and ownership shares.",
    whyItMatters: "Entering the Khasra number into the government land portal immediately reveals whether the land is clear, mortgaged, or disputed.",
  },
  {
    term: "Diversion (NA Order)",
    termHindi: "Non-Agricultural Land Conversion Order",
    simpleMeaning: "The official government order converting agricultural land into approved residential or commercial land.",
    whyItMatters: "Building a house on un-diverted agricultural land is illegal, and banks will strictly reject home loan applications for it.",
  },
  {
    term: "FAR / FSI (Floor Area Ratio)",
    termHindi: "Permissible Construction Area Ratio",
    simpleMeaning: "The government formula that determines how many total square feet of roofed construction you are legally allowed to build on your plot.",
    whyItMatters: "If the municipal FAR is 1.5, on a 1,000 sq.ft plot you can construct a maximum of 1,500 sq.ft built-up area across all floors.",
  },
  {
    term: "RERA Registration",
    termHindi: "Real Estate Regulatory Authority",
    simpleMeaning: "The statutory regulatory body established to protect property buyers and ensure developers deliver projects on time as promised.",
    whyItMatters: "Always verify that any township or apartment project has a valid, active RERA registration number before making any payment.",
  },
];

// Crucial Do's and Don'ts for Property Buyers
export const DOS_AND_DONTS: CheckpointItem[] = [
  {
    id: "chk-01",
    title: "DO: 30-Year Search Report from Sub-Registrar",
    description: "Always hire an experienced property lawyer to inspect 30 years of Sub-Registrar records to ensure there are no hidden bank mortgages or inherited title disputes.",
    type: "DO",
    stage: "Before Token / Advance",
  },
  {
    id: "chk-02",
    title: "DO: Match Demarcation Pillars on Ground",
    description: "Verify the plot dimensions and boundary pillars physically on site with government demarcation records before committing funds.",
    type: "DO",
    stage: "Before Token / Advance",
  },
  {
    id: "chk-03",
    title: "DON'T: Never Pay Full Cash on Plain Notary",
    description: "Never hand over substantial cash against a ₹100 or ₹500 notary agreement. The Supreme Court has repeatedly held that notary papers cannot transfer property ownership.",
    type: "DONT",
    stage: "Before Token / Advance",
  },
  {
    id: "chk-04",
    title: "DO: Verify T&CP Approved Layout Map",
    description: "Ensure the colony layout map is officially approved by Town & Country Planning (T&CP) and the competent local development authority.",
    type: "DO",
    stage: "During Legal Verification",
  },
  {
    id: "chk-05",
    title: "DON'T: Ignore Road Widening Setbacks",
    description: "Check the master plan for proposed road widening reservations so you don't risk losing your front boundary or building setback to demolition.",
    type: "DONT",
    stage: "During Legal Verification",
  },
  {
    id: "chk-06",
    title: "DO: Apply for Immediate Municipal Mutation",
    description: "Within 30 days of registering your deed, submit your mutation application to the municipal corporation and Tehsil to record your name on the tax rolls.",
    type: "DO",
    stage: "At Possession / Registry",
  },
];

// Basic Vastu Shastra Guidelines for Home Construction
export const VASTU_GUIDELINES: VastuDirection[] = [
  {
    direction: "North-East (Ishanya)",
    directionHindi: "North-East (Water & Purity)",
    element: "Water",
    governingDeity: "Lord Shiva & Jupiter",
    idealRooms: ["Prayer Room (Mandir)", "Underground Water Tank / Borewell", "Open Lawn"],
    avoidRooms: ["Toilet", "Heavy Staircase", "Heavy Storage"],
    keyAdvice: "Keep the North-East zone light, clean, and clutter-free. Placing an underground borewell or open water feature here invites positive energy.",
  },
  {
    direction: "South-East (Agneya)",
    directionHindi: "South-East (Fire & Energy)",
    element: "Fire",
    governingDeity: "Agni Dev (Fire Deity)",
    idealRooms: ["Kitchen", "Main Electric Meter Board", "Inverter / Generator Room"],
    avoidRooms: ["Master Bedroom", "Underground Water Tank", "Main Entrance"],
    keyAdvice: "Face East while cooking in the kitchen. Ensure the sink (water) and gas stove (fire) are separated by at least 2 to 3 feet.",
  },
  {
    direction: "South-West (Nairutya)",
    directionHindi: "South-West (Earth & Stability)",
    element: "Earth",
    governingDeity: "Nairuti",
    idealRooms: ["Master Bedroom", "Heavy Wardrobe / Cash Safe", "Highest Overhead Construction"],
    avoidRooms: ["Main Entrance", "Underground Borewell / Sump", "Pooja Room"],
    keyAdvice: "This zone governs family stability and financial anchoring. It should be the heaviest and highest elevated quadrant of your home.",
  },
  {
    direction: "North-West (Vayavya)",
    directionHindi: "North-West (Air & Motion)",
    element: "Air",
    governingDeity: "Vayu Dev (Wind Deity)",
    idealRooms: ["Guest Bedroom", "Unmarried Children's Room", "Car Parking", "Septic Tank"],
    avoidRooms: ["Master Bedroom", "Pooja Room"],
    keyAdvice: "Ideal location for guest accommodations and vehicle parking. Septic tanks can be safely placed along the northern fringe of this zone.",
  },
  {
    direction: "North (Kubera Sthan)",
    directionHindi: "North (Wealth & Abundance)",
    element: "Water / Mercury",
    governingDeity: "Lord Kubera",
    idealRooms: ["Main Entrance", "Living Room", "Open Balcony"],
    avoidRooms: ["Heavy Load-Bearing Blank Walls", "Toilet"],
    keyAdvice: "The North carries positive magnetic cosmic currents. Expansive windows, open verandas, and clean entryways here stimulate prosperity.",
  },
  {
    direction: "East (Surya Sthan)",
    directionHindi: "East (Health & Vitality)",
    element: "Fire / Sun",
    governingDeity: "Surya Dev (Sun Deity)",
    idealRooms: ["Main Entrance", "Study Room", "Front Veranda"],
    avoidRooms: ["Toilet", "Trash Storage"],
    keyAdvice: "Early morning sunlight should permeate directly into the interior, fostering robust physical health, clarity, and mental vitality for occupants.",
  },
];

// Informative Video Links & Podcasts
export const MEDIA_RESOURCES: MediaResource[] = [
  {
    id: "med-01",
    title: "How to Save ₹5 to 8 Lakhs on Home Construction (Civil Guide)",
    type: "Video",
    duration: "18 mins",
    creator: "Er. Amit Sharma (Indore)",
    summary: "Practical tips on cement, TMT steel procurement, and labor contracting to eliminate budget overruns and save substantial costs.",
    url: "https://youtube.com/watch?v=example-construction-save",
    thumbnail: "/home/construction.png",
  },
  {
    id: "med-02",
    title: "How to Verify Land Registry & Khasra Online (Step-by-Step)",
    type: "Video",
    duration: "12 mins",
    creator: "Adv. Alok Sharma (High Court Advocate)",
    summary: "Learn how to inspect Khasra records, Khatauni entries, and diversion orders in 5 minutes using the official land portal.",
    url: "https://youtube.com/watch?v=example-registry-check",
    thumbnail: "/home/vault.png",
  },
  {
    id: "med-03",
    title: "Podcast: Indore 2030 - Metro, Super Corridor & Growth Corridors",
    type: "Podcast",
    duration: "34 mins",
    creator: "Malwa PropCast Episode 14",
    summary: "Regional real estate analysts evaluate infrastructure corridors and where investment offers the strongest rental and appreciation yields.",
    url: "https://podcast.sukoon.local/episode-14",
    thumbnail: "/home/buy-sell.png",
  },
  {
    id: "med-04",
    title: "5 Golden Rules of Vastu for Plot and Floor Planning",
    type: "Podcast",
    duration: "22 mins",
    creator: "Vastu Shastra Architect Vani",
    summary: "How to design 20x50 and 30x50 plot plans with 100% compliant Vastu orientation without structural compromises.",
    url: "https://podcast.sukoon.local/vastu-rules",
    thumbnail: "/home/updates.png",
  },
];
