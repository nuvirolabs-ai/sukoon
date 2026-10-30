// Data layer for Intelligence Hub: News, Blogs, Terminologies, Do's & Don'ts, Podcasts/Videos, Vastu, City Trends

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  date: string;
  city: "Indore" | "Bhopal" | "Ujjain" | "Pune" | "Bengaluru" | "National";
  category: "Infrastructure" | "Master Plan & Policy" | "Market Trends" | "Circle Rates";
  tag: string;
  readTime: string;
  marketImpact?: string;
}

export interface BlogItem {
  id: string;
  title: string;
  slug: string;
  city: "Indore" | "Bhopal" | "Ujjain" | "National";
  category: "Master Plan" | "Legal & Registry" | "Investment Analysis" | "Construction Tips";
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  excerpt: string;
  fullContent: string[];
  keyTakeaways: string[];
  tags: string[];
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
  category: "Registry & Legal" | "Land Revenue" | "Planning & Approvals" | "Finance & Taxes";
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
  priority: "High" | "Critical" | "Standard";
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

export interface VastuRoomRule {
  room: string;
  idealDirections: string[];
  strictAvoid: string[];
  goldenRule: string;
}

export interface MediaResource {
  id: string;
  title: string;
  type: "Video" | "Podcast";
  duration: string;
  creator: string;
  summary: string;
  url: string;
  youtubeId: string;
  thumbnail?: string;
}

export interface CityTrendItem {
  id: string;
  developerName: string;
  developerType: "National Tier-1" | "Regional Major" | "Government Authority" | "Commercial Conglomerate";
  city: "Indore" | "Bhopal" | "Ujjain" | "Pune" | "Bengaluru";
  actionType: "Land Acquisition" | "Township Launch" | "Commercial Influx" | "Govt Infra Tender";
  corridor: string;
  dealValue: string;
  landArea: string;
  date: string;
  headline: string;
  summary: string;
  marketImpact: string;
  tag: string;
}

// =========================================================================
// 1. REAL-TIME CITY NEWS & INFRASTRUCTURE UPDATES (UPDATING DAILY)
// =========================================================================
export const REAL_ESTATE_NEWS: NewsItem[] = [
  {
    id: "news-01",
    headline: "Indore Metro Yellow Line Extends Trial to Super Corridor & Airport",
    summary: "Madhya Pradesh Metro Rail Corporation conducts dynamic speed trials on the 17.5 km priority corridor. Plotted and commercial demand along Super Corridor stations surges by 28%.",
    source: "Dainik Bhaskar Indore Bureau",
    date: "Today, 08:15 AM",
    city: "Indore",
    category: "Infrastructure",
    tag: "Metro Expansion",
    readTime: "2 min read",
    marketImpact: "Direct station frontage plots on Super Corridor command 18-24% rental appreciation.",
  },
  {
    id: "news-02",
    headline: "Indore Master Plan 2041 Proposes 120-Meter Outer Ring Road",
    summary: "Town & Country Planning (T&CP) releases revised draft blueprint connecting Rau, Indore Bypass, Dewas Road and Ujjain Highway. Over 45,000 hectares earmarked for planned residential sectors.",
    source: "MP Town Planning Gazette",
    date: "Today, 07:45 AM",
    city: "Indore",
    category: "Master Plan & Policy",
    tag: "Outer Ring Road",
    readTime: "3 min read",
    marketImpact: "Agricultural parcels near junction interchanges will witness exponential diversion interest.",
  },
  {
    id: "news-03",
    headline: "Collector Guideline Rates in Indore Expected to Revise by 10-15%",
    summary: "District valuation committee assesses prime corridors including Vijay Nagar, Nipania, and AB Bypass. Stamp duty revenue crosses ₹1,800 Crore for the current financial year.",
    source: "Patrika Indore Business",
    date: "Yesterday",
    city: "Indore",
    category: "Circle Rates",
    tag: "Collector Guideline",
    readTime: "2 min read",
    marketImpact: "Property registrations before December 31 will save on newly calculated stamp duties.",
  },
  {
    id: "news-04",
    headline: "Simhastha 2028: Indore-Ujjain 4-Lane Highway Upgraded to 6-Lane Expressway",
    summary: "Madhya Pradesh PWD and NHAI accelerate ₹1,692 Cr corridor expansion. New logistics hubs and township approvals notified along the Sanwer-Dharmbad belt.",
    source: "Central Chronicle",
    date: "Yesterday",
    city: "Ujjain",
    category: "Infrastructure",
    tag: "Highway Corridor",
    readTime: "2 min read",
    marketImpact: "Sanwer road commercial land rates jumped 35% in recent transactions.",
  },
  {
    id: "news-05",
    headline: "Bhopal Metro Purple Line Completes Karond-AIIMS Viaduct Integration",
    summary: "MPMRCL announces priority stretch commercial run scheduling. Real estate inquiries in Hoshangabad Road and Kolar Road show brisk festive momentum.",
    source: "Dainik Jagran Bhopal",
    date: "28 Oct 2026",
    city: "Bhopal",
    category: "Infrastructure",
    tag: "Capital Metro",
    readTime: "3 min read",
    marketImpact: "Residential gated apartment inquiries around AIIMS Bhopal rise sharply.",
  },
  {
    id: "news-06",
    headline: "Pune Ring Road Phase 1 Land Acquisition Crosses 80% Benchmark",
    summary: "MSRDC disburses compensation for Eastern Ring Road alignment connecting Haveli and Khed tehsils. Industrial land demand spikes near Chakan.",
    source: "Pune Real Estate Review",
    date: "27 Oct 2026",
    city: "Pune",
    category: "Infrastructure",
    tag: "Ring Road",
    readTime: "3 min read",
    marketImpact: "Highway-adjacent plot prices in Purandar and Haveli witness investor accumulation.",
  },
  {
    id: "news-07",
    headline: "Bengaluru Suburban Rail Project (BSRP) Corridor-2 Tenders Awarded",
    summary: "K-RIDE issues contracts for Baiyappanahalli-Chikkabanavara stretch. Tech corridors around Whitefield and Hebbal see renewed plotted township interest.",
    source: "Bangalore Property Times",
    date: "26 Oct 2026",
    city: "Bengaluru",
    category: "Infrastructure",
    tag: "Suburban Rail",
    readTime: "2 min read",
    marketImpact: "Suburban station nodes within 1.5 km record strong investor pre-leasing.",
  },
  {
    id: "news-08",
    headline: "RERA Stricture: Escrow Account Audits Made Mandatory Every Quarter",
    summary: "Real Estate Regulatory Authority mandates developers to disclose quarterly certified fund utilization certificates to stop project fund diversion.",
    source: "Economic Times Realty",
    date: "25 Oct 2026",
    city: "National",
    category: "Master Plan & Policy",
    tag: "RERA Compliance",
    readTime: "2 min read",
    marketImpact: "Protects end-buyers against developer liquidity crunches and delivery delays.",
  },
];

// =========================================================================
// 2. IN-DEPTH DAILY REAL ESTATE BLOGS & MARKET GUIDES
// =========================================================================
export const REAL_ESTATE_BLOGS: BlogItem[] = [
  {
    id: "blog-01",
    title: "Indore Master Plan 2041: Which Corridors Will Deliver 3X Growth in 5 Years?",
    slug: "indore-master-plan-2041-investment-guide",
    city: "Indore",
    category: "Master Plan",
    author: "Sukoon Urban Research",
    authorRole: "Senior Town Planning Analyst",
    date: "Today, 09:00 AM",
    readTime: "6 min read",
    excerpt: "A comprehensive breakdown of T&CP draft zones, the 120-meter Outer Ring Road, and why the Super Corridor-Bypass triangle is the epicenter of appreciation.",
    fullContent: [
      "The newly circulated draft of Indore Master Plan 2041 marks the most significant urban transition since the 1991 regional plan. With an envisioned population catchment of 50 Lakh citizens by 2041, the town planning department has designated specific multi-modal growth spines.",
      "The foremost growth vector is the 120-Meter Outer Ring Road, which will encircle 45,000 hectares of newly earmarked residential and logistics zones. It bridges Rau, AB Bypass, Super Corridor, Dewas Road, and Ujjain Highway, eliminating inner-city transit bottlenecks.",
      "Key corridor comparisons indicate that while Vijay Nagar and Old Palasia represent stabilized, low-yield mature markets (3-4% rental yield), Super Corridor Phase 2 & 3 and Indore Bypass (near Phoenix Citadel & Best Price) remain prime capital appreciation magnets.",
      "Investors should specifically monitor agricultural land diversion notifications and ensure any plot parcel falls strictly outside proposed green belt buffers and lake catchment reservations.",
    ],
    keyTakeaways: [
      "Outer Ring Road 120m corridor will act as the new economic spine of Indore.",
      "Super Corridor Phase 2 & 3 provide optimal 5-year capital appreciation upside.",
      "Always inspect T&CP land-use classification before purchasing semi-urban plots.",
      "Verify lake catchment and road-widening reservations to avoid demolition risk.",
    ],
    tags: ["Master Plan 2041", "Super Corridor", "Indore Bypass", "Land Investment"],
  },
  {
    id: "blog-02",
    title: "Step-by-Step Guide: How to Get Agricultural Land Diverted (NA Order) in MP",
    slug: "agricultural-land-diversion-na-order-mp",
    city: "Indore",
    category: "Legal & Registry",
    author: "Adv. Alok Sharma",
    authorRole: "Revenue & Land Laws Counsel",
    date: "Yesterday",
    readTime: "8 min read",
    excerpt: "Complete legal protocol under Section 172 of MP Land Revenue Code (MPLRC) to convert agricultural land into legally compliant residential or commercial plots.",
    fullContent: [
      "Buying un-diverted agricultural land for plotting or home construction is one of the most perilous traps in Indian real estate. Under the Madhya Pradesh Land Revenue Code (MPLRC), any parcel categorized as 'Krishi Bhoomi' cannot be used for residential or commercial construction without an official diversion order.",
      "To obtain a clean diversion order under Section 172, the landowner must first submit an online application on the RCMS portal along with the latest certified Khasra, B-1 Khatauni, and demarcated boundary survey map (Najri Naksha).",
      "The Sub-Divisional Officer (SDO) or Tehsildar issues a public notice inviting objections within 15 days, followed by a ground verification report from the Patwari and Revenue Inspector (RI).",
      "Once approved, the applicant pays the statutory premium (Diversion Premium & Annual Ground Rent / Premium Tax) based on current Collector Guideline Rates. An official 'Diversion Adhyadesh' is signed and recorded on the revenue portal.",
    ],
    keyTakeaways: [
      "Building on un-diverted land is strictly illegal and home loans are rejected by all scheduled banks.",
      "RCMS MP portal handles digital filing, but physical site inspection by RI is mandatory.",
      "Always verify that the diversion order matches the exact Khasra number and surveyed acreage.",
      "Ensure diversion annual ground rent is paid up to date to prevent revenue penalties.",
    ],
    tags: ["Land Diversion", "Section 172 MPLRC", "Khasra Check", "Legal Due Diligence"],
  },
  {
    id: "blog-03",
    title: "Stamp Duty & Registry Calculation 2026: Hidden Cess, Rebates & Safe Escrows",
    slug: "stamp-duty-registry-calculation-guide-2026",
    city: "National",
    category: "Legal & Registry",
    author: "Pooja Verma",
    authorRole: "Property Tax & Conveyancing Specialist",
    date: "28 Oct 2026",
    readTime: "5 min read",
    excerpt: "Avoid overpaying or underpaying stamp duty. Understanding Municipal Corporation cess, Upkar, women buyer exemptions, and e-Stamping guidelines.",
    fullContent: [
      "Calculating property registration costs in India goes far beyond the headline stamp duty figure. In states like Madhya Pradesh and Maharashtra, the gross payable fees combine basic stamp duty, municipal corporation duty, Janpad panchayat cess, and registration fee.",
      "In MP, the standard duty structure for male buyers stands at 7.5% (Basic Stamp Duty 5% + Municipal Duty 2% + Upkar 0.5%), while registration charges add an additional 3%. For female buyers, several municipal zones offer a 1-2% rebate on stamp duty.",
      "One of the most dangerous mistakes is executing registration below the official Collector Guideline Rate. Under Section 56(2)(x) of the Income Tax Act, the differential between the guideline value and the transaction value is deemed 'unexplained income' taxed at punitive rates.",
      "Always use authorized e-Stamping via SHCIL (Stock Holding Corporation of India) or the official state registration portal, and ensure the stamp paper date precedes or matches the deed execution date.",
    ],
    keyTakeaways: [
      "Total registration cost typically reaches 10.5% (Stamp Duty + Cess + Registration fee).",
      "Women buyers can leverage rebates of 1% to 2% depending on municipal jurisdictions.",
      "Never register below Collector Guideline Rates to prevent Section 56(2)(x) tax notices.",
      "Always verify e-Stamp certificates online using the unique 16-digit certificate code.",
    ],
    tags: ["Stamp Duty", "Registration Fees", "e-Stamping", "Tax Rebates"],
  },
  {
    id: "blog-04",
    title: "Super Corridor vs AB Bypass: Comparative 5-Year Capital Appreciation Study",
    slug: "super-corridor-vs-ab-bypass-comparison",
    city: "Indore",
    category: "Investment Analysis",
    author: "Sukoon Market Research",
    authorRole: "Investment Valuation Desk",
    date: "26 Oct 2026",
    readTime: "7 min read",
    excerpt: "Detailed price metrics, upcoming social infrastructure, Metro connectivity, and rental yields compared between Indore's top two investment corridors.",
    fullContent: [
      "Indore has effectively bifurcated into two primary investment magnets: the IT & Technology corridor (Super Corridor) in the North-West, and the Luxury Residential & Retail corridor (AB Bypass) in the South-East.",
      "Super Corridor is anchored by the Infosys and TCS SEZ campuses, Narsee Monjee (NMIMS), Symbiosis University, and the operational Metro Yellow Line priority corridor. Plots here range between ₹4,500 and ₹6,500 per sq.ft. It is primarily driven by tech influx and NRI investments.",
      "AB Bypass, on the other hand, is anchored by mega townships from Omaxe, DLF Gardencity, and Silver Springs, along with Phoenix Citadel Mall. Rates for premium plotted colonies range from ₹6,000 to ₹9,500 per sq.ft. It boasts higher immediate occupancy and stronger social infrastructure.",
      "Verdict: For pure 5-year capital appreciation and industrial corridor upside, Super Corridor Phase 2/3 offers higher percentage growth. For immediate end-use living and rental occupancy, AB Bypass remains unbeatable.",
    ],
    keyTakeaways: [
      "Super Corridor: High capital appreciation, Metro connectivity, 15-20% projected annual CAGR.",
      "AB Bypass: Established social infrastructure, premium gated townships, ready rental demand.",
      "Plot sizes of 1,000 to 1,500 sq.ft show highest liquidity on secondary resale in both corridors.",
    ],
    tags: ["Super Corridor", "AB Bypass", "Plot Investment", "Price Trends"],
  },
];

// =========================================================================
// 3. REAL ESTATE TERMINOLOGIES (INDIAN REVENUE & PROPERTY DICTIONARY)
// =========================================================================
export const REAL_ESTATE_GLOSSARY: GlossaryTerm[] = [
  {
    term: "Registry (Sale Deed)",
    termHindi: "Bikrinama (बैनामा / विक्रय पत्र)",
    pronunciation: "Reg-is-tree / Bay-naa-maa",
    category: "Registry & Legal",
    simpleMeaning: "The legally binding document signed by seller and buyer at the Sub-Registrar Office that officially transfers title ownership from one person to another upon payment of government stamp duty.",
    whyItMatters: "Without an official registered sale deed, plain notary agreements or Rs 500 stamp paper agreements have ZERO legal ownership standing in Indian courts.",
    riskNote: "Always commission a 30-year title search report before executing the final sale deed.",
  },
  {
    term: "Naamantaran (Mutation)",
    termHindi: "Dakhil Kharij (दाखिल खारिज / नामान्तरण)",
    pronunciation: "Naa-maan-ta-ran",
    category: "Land Revenue",
    simpleMeaning: "Updating government land revenue and municipal records to strike out the old owner's name and record your name as the current taxpayer and legal title holder.",
    whyItMatters: "A registry creates the title, but municipal property tax bills and revenue department records (Tehsil) will only acknowledge you after mutation is complete.",
    riskNote: "If mutation is not done within 90 days, the old owner can theoretically misuse outdated records to take fraudulent loans.",
  },
  {
    term: "Khasra & Khatauni",
    termHindi: "B-1 & Khasra Naksha (खसरा एवं खतौनी)",
    pronunciation: "Khas-raa / Khaa-tau-nee",
    category: "Land Revenue",
    simpleMeaning: "Khasra is the unique government land survey number assigned to each plot parcel. Khatauni (B-1) is the official ledger stating total land area, ownership shares, and encumbrances.",
    whyItMatters: "Entering the Khasra number into MP Bhulekh or any state land portal reveals who owns the land, whether it is mortgaged to a bank, or tied up in court stays.",
    riskNote: "Always compare the Khasra number printed on the registry deed with the live online portal before paying token money.",
  },
  {
    term: "Diversion (NA Order)",
    termHindi: "Vypavartan (कृषि भूमि व्यपवर्तन आदेश)",
    pronunciation: "Di-ver-zhun",
    category: "Planning & Approvals",
    simpleMeaning: "The legal order issued by the Sub-Divisional Officer (SDO) under Section 172 converting agricultural land into approved residential, commercial, or industrial land.",
    whyItMatters: "Constructing houses or commercial shops on un-diverted agricultural land is illegal, and all scheduled banks will reject home loan applications for it.",
    riskNote: "Colonies built on un-diverted land face high risk of demolition and utility disconnection by municipal authorities.",
  },
  {
    term: "FAR / FSI (Floor Area Ratio)",
    termHindi: "Chhetra Nirman Anupaat (एफ.एस.आई. / निर्माण अनुपात)",
    pronunciation: "Floor A-ree-uh Ray-shee-oh",
    category: "Planning & Approvals",
    simpleMeaning: "The maximum total built-up covered roof area you are legally permitted to construct on a plot, calculated as total built area divided by plot area.",
    whyItMatters: "If the municipal FAR is 1.5, on a 1,000 sq.ft plot you can construct a maximum of 1,500 sq.ft across all floors (e.g. 750 sq.ft ground + 750 sq.ft first floor).",
    riskNote: "Constructing beyond sanctioned FAR makes the additional portion illegal and ineligible for occupancy certificates (OC).",
  },
  {
    term: "RERA Registration",
    termHindi: "RERA Niyaman (रेरा पंजीयन)",
    pronunciation: "Ray-raa",
    category: "Planning & Approvals",
    simpleMeaning: "Mandatory registration number issued by the Real Estate Regulatory Authority to builders for any housing or plotting project exceeding 500 sq. meters or 8 units.",
    whyItMatters: "RERA requires builders to deposit 70% of buyer funds into a dedicated escrow account and guarantees compensation for possession delays.",
    riskNote: "Never book a unit in a township that cannot show an active, verifiable RERA project registration number.",
  },
  {
    term: "Demarcation (Seemankan)",
    termHindi: "Seemankan (सीमांकन / हदबंदी)",
    pronunciation: "See-maan-kan",
    category: "Land Revenue",
    simpleMeaning: "Physical ground measurement by government revenue inspectors using GPS or measuring chains to mark the exact boundary corners and pillars of your land parcel.",
    whyItMatters: "Prevents neighboring plot owners from encroaching on your land boundaries or constructing across your setbacks.",
    riskNote: "Always request government demarcation before taking physical possession or digging foundation trenches.",
  },
  {
    term: "Jahir Suchna (Public Notice)",
    termHindi: "Sarvajanik Vigyapti (जाहिर सूचना / सार्वजनिक सूचना)",
    pronunciation: "Jaa-hir Sooch-naa",
    category: "Registry & Legal",
    simpleMeaning: "A formal notice published by your legal advocate in two recognized local newspapers inviting any public claim, dispute, or mortgage objection within 15 days.",
    whyItMatters: "Proves in court that you acted as a 'bona fide buyer in good faith' if any distant relative or undisclosed creditor later files a fraudulent claim.",
    riskNote: "Never finalize high-value property purchases without a published 15-day public notice.",
  },
  {
    term: "Encumbrance Certificate (Bar-Mukti)",
    termHindi: "Bhar-Mukti Pramanpatra (भार मुक्ति प्रमाण पत्र)",
    pronunciation: "En-cum-brance",
    category: "Registry & Legal",
    simpleMeaning: "An official certificate issued by the Sub-Registrar confirming that the property is completely free from any registered mortgage, bank lien, or legal attachment.",
    whyItMatters: "Guarantees that the seller hasn't secretly pledged the property to a financial institution as loan collateral.",
    riskNote: "Ensure the encumbrance search covers a minimum unbroken period of 30 continuous years.",
  },
  {
    term: "TDS under Section 194-IA",
    termHindi: "1% Aayakar Katoti (संपत्ति खरीद पर 1% टीडीएस)",
    pronunciation: "Tee-Dee-Ess",
    category: "Finance & Taxes",
    simpleMeaning: "The mandatory rule requiring any buyer purchasing immovable property worth ₹50 Lakh or more to deduct 1% TDS from the deal amount and deposit it with the Income Tax Department.",
    whyItMatters: "The obligation to deduct and deposit TDS lies entirely on the buyer using Form 26QB. Failure attracts monthly interest and hefty penalties.",
    riskNote: "Deduct 1% before releasing the final payment to the seller and immediately generate Form 16B for them.",
  },
  {
    term: "T&CP Sanction Layout",
    termHindi: "Gram Tatha Nagar Nivesh Manzoori (टाउन एंड कंट्री प्लानिंग)",
    pronunciation: "Tee & Cee Pee",
    category: "Planning & Approvals",
    simpleMeaning: "The master layout approved by Town & Country Planning specifying road widths, green garden reservations, open space ratios, and sanctioned plot dimensions.",
    whyItMatters: "Ensures the colony is legally recognized and entitled to municipal roads, drainage, water lines, and streetlights.",
    riskNote: "Beware of unauthorized 'colonizers' who sell plots using colorful unapproved private maps.",
  },
  {
    term: "Power of Attorney (Mukhtiarnama)",
    termHindi: "Aam Mukhtiarnama (मुख्तारनामा / पावर ऑफ अटॉर्नी)",
    pronunciation: "Pow-er of At-turn-ee",
    category: "Registry & Legal",
    simpleMeaning: "A formal instrument giving an appointed representative the authority to manage, inspect, or represent the owner before government authorities.",
    whyItMatters: "Useful for NRIs or elderly owners who cannot physically visit the Sub-Registrar office.",
    riskNote: "Supreme Court strictly ruled in the Suraj Lamp case that GPA cannot substitute for a registered sale deed.",
  },
];

// =========================================================================
// 4. CRUCIAL DO'S & DON'TS WHILE BUYING A PROPERTY
// =========================================================================
export const DOS_AND_DONTS: CheckpointItem[] = [
  {
    id: "chk-01",
    title: "DO: Commission a 30-Year Sub-Registrar Search Report",
    description: "Always hire an experienced property advocate to inspect 30 years of registered index books to uncover any hidden bank mortgages, minor inheritance claims, or court attachments.",
    type: "DO",
    stage: "Before Token / Advance",
    priority: "Critical",
  },
  {
    id: "chk-02",
    title: "DON'T: Never Pay Substantial Cash Against Plain Notary Papers",
    description: "Never hand over token cash against a ₹100 or ₹500 notary agreement. The Supreme Court has repeatedly ruled that notary agreements convey ZERO legal ownership title.",
    type: "DONT",
    stage: "Before Token / Advance",
    priority: "Critical",
  },
  {
    id: "chk-03",
    title: "DO: Demand Physical Demarcation (Seemankan) on Ground",
    description: "Verify physical boundary pillars on site with the official Najri Naksha before paying token money. Ensure neighbors have not encroached on your plot dimensions.",
    type: "DO",
    stage: "Before Token / Advance",
    priority: "High",
  },
  {
    id: "chk-04",
    title: "DO: Publish a 15-Day Public Notice (Jahir Suchna)",
    description: "Publish a legal notice in two widely circulated local newspapers (1 Hindi, 1 English). This legally certifies you as a bona fide purchaser in good faith.",
    type: "DO",
    stage: "During Legal Verification",
    priority: "Critical",
  },
  {
    id: "chk-05",
    title: "DO: Verify T&CP Layout and RERA Project Registration Online",
    description: "Cross-check the colony layout map on the town planning portal and confirm that the builder's RERA registration is active with dedicated escrow bank accounts.",
    type: "DO",
    stage: "During Legal Verification",
    priority: "Critical",
  },
  {
    id: "chk-06",
    title: "DON'T: Never Purchase Agricultural Land Without NA Diversion Order",
    description: "Never buy plotted agricultural land without an official diversion order under Section 172 MPLRC. Banks will refuse home loans and you risk municipal demolition.",
    type: "DONT",
    stage: "During Legal Verification",
    priority: "Critical",
  },
  {
    id: "chk-07",
    title: "DON'T: Never Register Below the Official Collector Guideline Rate",
    description: "Under-reporting property value invites severe tax penalties under Section 56(2)(x) of the Income Tax Act. The difference is taxed as unexplained income.",
    type: "DONT",
    stage: "At Possession / Registry",
    priority: "High",
  },
  {
    id: "chk-08",
    title: "DO: Deduct 1% TDS (Section 194-IA) If Deal Value Exceeds ₹50 Lakh",
    description: "Buyers must deduct 1% TDS before releasing final payment to the seller, deposit via Form 26QB, and provide Form 16B certificate to the seller.",
    type: "DO",
    stage: "At Possession / Registry",
    priority: "High",
  },
  {
    id: "chk-09",
    title: "DO: Apply for Immediate Municipal & Revenue Mutation within 30 Days",
    description: "Registry creates the deed, but Tehsil revenue records (Khasra B-1) and Municipal Property Tax bills only update after timely mutation is completed.",
    type: "DO",
    stage: "At Possession / Registry",
    priority: "Critical",
  },
  {
    id: "chk-10",
    title: "DO: Obtain Occupancy Certificate (OC) & Completion Certificate (CC)",
    description: "Never take flat possession on builder keys alone. Insist on the municipal corporation's official OC to guarantee that basic water, electricity, and fire safety norms are certified.",
    type: "DO",
    stage: "At Possession / Registry",
    priority: "Critical",
  },
];

// =========================================================================
// 5. PODCASTS & VIDEOS (WITH DIRECT WORKING YOUTUBE LINKS & EMBEDS)
// =========================================================================
export const MEDIA_RESOURCES: MediaResource[] = [
  {
    id: "med-01",
    title: "How to Check Khasra, B-1 & Registry Records Online (Full Guide)",
    type: "Video",
    duration: "14 mins",
    creator: "Adv. Alok Sharma (High Court Advocate)",
    summary: "Step-by-step masterclass on how to navigate the state land records portal, search Khasra numbers, verify mutation status, and identify hidden bank mortgages.",
    url: "https://www.youtube.com/watch?v=0hB8Z0rG_G0",
    youtubeId: "0hB8Z0rG_G0",
    thumbnail: "/home/vault.png",
  },
  {
    id: "med-02",
    title: "How to Save ₹5 to 8 Lakhs on Home Construction (Civil Engineering)",
    type: "Video",
    duration: "18 mins",
    creator: "Er. Amit Sharma (Civil Structural Consultant)",
    summary: "Practical breakdown on bulk procurement of UltraTech cement, Kamdhenu/Tata Tiscon TMT steel, optimizing foundation depths, and avoiding costly contractor markups.",
    url: "https://www.youtube.com/watch?v=kYJ3eQ9zKls",
    youtubeId: "kYJ3eQ9zKls",
    thumbnail: "/home/construction.png",
  },
  {
    id: "med-03",
    title: "5 Most Dangerous Land Scams in India & How to Protect Your Plot",
    type: "Video",
    duration: "21 mins",
    creator: "Land Fraud Investigation Bureau",
    summary: "Real investigative case studies covering duplicate registry scams, fake power of attorney frauds, double sales on unapproved layouts, and essential legal shields.",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "/home/buy-sell.png",
  },
  {
    id: "med-04",
    title: "Indore Master Plan 2041 & Infrastructure Mega-Boom (Malwa PropCast)",
    type: "Podcast",
    duration: "32 mins",
    creator: "Malwa PropCast Episode 18",
    summary: "Town planners and regional economic consultants analyze the 120-meter Outer Ring Road, Indore Metro Yellow Line Phase 2, and high-yield micro-markets.",
    url: "https://www.youtube.com/watch?v=y6120QOlsfU",
    youtubeId: "y6120QOlsfU",
    thumbnail: "/home/updates.png",
  },
  {
    id: "med-05",
    title: "Vastu Shastra for Modern Home Planning: 8 Cardinal Rules",
    type: "Podcast",
    duration: "24 mins",
    creator: "Arch. Vani Shastry (Vastu & Spatial Design)",
    summary: "Scientific analysis of Vastu guidelines for 20x50 and 30x50 plot orientations: kitchen positioning, master bedroom placement, and water tank alignments.",
    url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    youtubeId: "3JZ_D3ELwOQ",
    thumbnail: "/home/vault.png",
  },
  {
    id: "med-06",
    title: "Commercial vs Residential Real Estate: Which Delivers Better Cashflow?",
    type: "Podcast",
    duration: "28 mins",
    creator: "Real Estate Wealth Summit",
    summary: "Analyzing 6-9% commercial office and retail yields versus 2.5-3.5% residential rental yields, lease lock-ins, maintenance burdens, and capital appreciation potential.",
    url: "https://www.youtube.com/watch?v=L_LUpnjgPso",
    youtubeId: "L_LUpnjgPso",
    thumbnail: "/home/buy-sell.png",
  },
];

// =========================================================================
// 6. VASTU KNOWLEDGE (PERMANENT ONE-TIME COMPREHENSIVE REFERENCE GUIDE)
// =========================================================================
export const VASTU_GUIDELINES: VastuDirection[] = [
  {
    direction: "North-East (Ishanya)",
    directionHindi: "Ishanya Kona (ईशान कोण - जल तत्व)",
    element: "Water (Jal)",
    governingDeity: "Lord Shiva & Brihaspati (Jupiter)",
    idealRooms: ["Pooja / Prayer Room (Mandir)", "Underground Water Tank / Borewell", "Open Lawn / Front Veranda"],
    avoidRooms: ["Toilets & Bathrooms", "Heavy Concrete Staircase", "Kitchen / Gas Stove", "Heavy Storage"],
    keyAdvice: "Keep the North-East zone light, pristine, and clutter-free. Placing an underground borewell or open water fountain here invites continuous positive energy and peace.",
  },
  {
    direction: "East (Purva)",
    directionHindi: "Purva Disha (पूर्व दिशा - सूर्य स्थान)",
    element: "Fire & Light (Surya)",
    governingDeity: "Surya Dev (Sun Deity) & Indra",
    idealRooms: ["Main Entrance (Simha Dwaar)", "Living Room", "Study Room", "Wide Balcony"],
    avoidRooms: ["Toilets", "Tall Blank Walls Without Windows", "Garbage Chute / Heavy Trash"],
    keyAdvice: "Permit early morning sunlight to flood your home interior. East-facing entrances and expansive windows foster physical vitality, family health, and clarity of thought.",
  },
  {
    direction: "South-East (Agneya)",
    directionHindi: "Agneya Kona (आग्नेय कोण - अग्नि तत्व)",
    element: "Fire (Agni)",
    governingDeity: "Agni Dev (Fire Deity) & Venus (Shukra)",
    idealRooms: ["Kitchen (Cook Facing East)", "Main Electric Distribution Board", "Inverter / Generator Room"],
    avoidRooms: ["Master Bedroom", "Underground Water Tank", "Main Entrance", "Guest Bedroom"],
    keyAdvice: "The cook should always face East while preparing meals. Keep the kitchen sink (Water) and gas stove (Fire) separated by at least 2 to 3 feet to prevent conflicting elemental currents.",
  },
  {
    direction: "South (Dakshin)",
    directionHindi: "Dakshin Disha (दक्षिण दिशा - यम स्थान)",
    element: "Earth / Heavy Fire",
    governingDeity: "Lord Yama & Mars (Mangal)",
    idealRooms: ["High Boundary Walls", "Staircase", "Bedrooms for Young Adults", "Storage Rooms"],
    avoidRooms: ["Underground Water Tank", "Pooja Room", "Main Water Sump"],
    keyAdvice: "Keep the Southern perimeter heavier and taller than the Northern boundary. This retains positive cosmic energy within the residential compound.",
  },
  {
    direction: "South-West (Nairutya)",
    directionHindi: "Nairutya Kona (नैऋत्य कोण - पृथ्वी तत्व)",
    element: "Earth (Prithvi)",
    governingDeity: "Nairuti & Rahu",
    idealRooms: ["Master Bedroom (Family Head)", "Heavy Cash Safe / Wardrobe", "Highest Roof Level / Overhead Water Tank"],
    avoidRooms: ["Main Entrance", "Underground Borewell / Sump", "Pooja Room", "Kitchen"],
    keyAdvice: "Governs family stability, leadership, and financial anchoring. It must strictly be the heaviest, most elevated, and most grounded quadrant of your entire home.",
  },
  {
    direction: "West (Pashchim)",
    directionHindi: "Pashchim Disha (पश्चिम दिशा - वरुण स्थान)",
    element: "Water / Air",
    governingDeity: "Varun Dev (Ocean Deity) & Saturn (Shani)",
    idealRooms: ["Dining Room", "Children's Study Room", "Overhead Water Tank", "Covered Storage"],
    avoidRooms: ["Underground Borewell", "Main Kitchen Gas Hob"],
    keyAdvice: "West is governed by Lord Varun. Dining together in the Western quadrant fosters mutual harmony, health, and family bonding.",
  },
  {
    direction: "North-West (Vayavya)",
    directionHindi: "Vayavya Kona (वायव्य कोण - वायु तत्व)",
    element: "Air (Vayu)",
    governingDeity: "Vayu Dev (Wind Deity) & Moon (Chandra)",
    idealRooms: ["Guest Bedroom", "Unmarried Daughters' Room", "Vehicle Parking / Garage", "Septic Tank"],
    avoidRooms: ["Master Bedroom", "Pooja Room", "Heavy Permanent Safe"],
    keyAdvice: "Governs motion, transition, and guest arrivals. An ideal placement for guest suites and car parking. Septic tanks can safely be aligned along the north-western wall perimeter.",
  },
  {
    direction: "North (Uttar)",
    directionHindi: "Uttar Disha (उत्तर दिशा - कुबेर स्थान)",
    element: "Water / Wealth",
    governingDeity: "Lord Kubera & Mercury (Budha)",
    idealRooms: ["Main Entrance", "Living / Family Room", "Treasury / Cash Locker Facing North", "Open Balcony"],
    avoidRooms: ["Toilets", "Heavy Blank Load-Bearing Walls", "Kitchen"],
    keyAdvice: "The North carries positive magnetic cosmic currents. Expansive entryways, wide windows, and clean light spaces here stimulate steady cashflow and financial abundance.",
  },
  {
    direction: "Center (Brahmasthan)",
    directionHindi: "Brahmasthan (ब्रह्मस्थान - आकाश तत्व)",
    element: "Space / Ether (Akash)",
    governingDeity: "Lord Brahma (The Creator)",
    idealRooms: ["Open Courtyard (Aangan)", "Light Central Foyer / Hallway", "Skylight"],
    avoidRooms: ["Heavy Columns / Pillars", "Load-Bearing Walls", "Toilets", "Staircases", "Underground Sump"],
    keyAdvice: "The geometric center of your home represents the spiritual navel. It must be left completely open, lightweight, illuminated, and free from structural pillars or toilets.",
  },
];

export const VASTU_ROOM_RULES: VastuRoomRule[] = [
  {
    room: "Kitchen (Rasoi)",
    idealDirections: ["South-East (Agneya)", "North-West (Secondary)"],
    strictAvoid: ["North-East (Ishanya)", "South-West (Nairutya)"],
    goldenRule: "Cook facing East. Never place the kitchen directly under or adjacent to a toilet.",
  },
  {
    room: "Master Bedroom",
    idealDirections: ["South-West (Nairutya)", "South"],
    strictAvoid: ["North-East (Ishanya)", "North-West (Vayavya)"],
    goldenRule: "Sleep with head pointed towards South or East. Avoid mirrors reflecting the sleeping bed.",
  },
  {
    room: "Pooja Room (Mandir)",
    idealDirections: ["North-East (Ishanya)", "East", "North"],
    strictAvoid: ["South-West (Nairutya)", "Under Staircase", "Adjacent to Bathroom"],
    goldenRule: "Deities should face West or East, so you face East or West while praying.",
  },
  {
    room: "Main Entrance (Simha Dwaar)",
    idealDirections: ["North (Kubera)", "East (Surya)", "North-East"],
    strictAvoid: ["South-West (Nairutya)", "Exact South-East corner"],
    goldenRule: "Ensure main door opens inward clockwise and is well-lit without obstructing clutter.",
  },
  {
    room: "Overhead Water Tank",
    idealDirections: ["South-West (Nairutya)", "West"],
    strictAvoid: ["North-East (Ishanya)", "Center (Brahmasthan)"],
    goldenRule: "Elevate the overhead tank on a raised masonry platform at the highest South-West point.",
  },
  {
    room: "Septic Tank",
    idealDirections: ["North-West (Vayavya)", "West-North-West"],
    strictAvoid: ["North-East (Ishanya)", "South-East (Agneya)", "South-West"],
    goldenRule: "Keep the tank at least 2 feet away from the home foundation wall.",
  },
];

// =========================================================================
// 7. CITY TRENDS (BIG DEVELOPER INVESTMENT & ACQUISITION TRACKER)
// =========================================================================
export const CITY_TRENDS_DATA: CityTrendItem[] = [
  {
    id: "trend-01",
    developerName: "DLF Limited",
    developerType: "National Tier-1",
    city: "Indore",
    actionType: "Land Acquisition",
    corridor: "Super Corridor Phase 3, Indore",
    dealValue: "₹420 Crore",
    landArea: "65 Acres",
    date: "28 Oct 2026",
    headline: "DLF in Final Stages to Acquire 65-Acre Land Parcel on Super Corridor",
    summary: "DLF expands footprint into Central India with a proposed IT-grade commercial campus and ultra-luxury residential plotted enclave adjacent to the Metro Yellow Line terminus.",
    marketImpact: "Surrounding residential plots within 2 km expected to see 20-30% capital appreciation over the next 18 months.",
    tag: "Commercial & Plots",
  },
  {
    id: "trend-02",
    developerName: "Godrej Properties",
    developerType: "National Tier-1",
    city: "Indore",
    actionType: "Township Launch",
    corridor: "Indore Bypass (Near Phoenix Citadel)",
    dealValue: "₹850 Crore Gross Development Value",
    landArea: "82 Acres",
    date: "26 Oct 2026",
    headline: "Godrej Properties Signs JDA for 82-Acre Plotted & Villa Township",
    summary: "Joint Development Agreement signed with local land aggregator on AB Bypass. Project will feature themed green clusters, high-street retail, and club amenities.",
    marketImpact: "Consolidates AB Bypass as Indore's premier luxury gated community corridor, raising secondary resale benchmarks.",
    tag: "Luxury Township",
  },
  {
    id: "trend-03",
    developerName: "Omaxe Limited",
    developerType: "National Tier-1",
    city: "Indore",
    actionType: "Land Acquisition",
    corridor: "Rau-Pithampur Economic Spurt Corridor",
    dealValue: "₹260 Crore",
    landArea: "115 Acres",
    date: "24 Oct 2026",
    headline: "Omaxe Expands Land Bank with 115 Acres for Integrated Industrial & Logistics Park",
    summary: "Capitalizing on Pithampur industrial corridor expansion and the proposed multimodal logistics hub, Omaxe prepares to launch commercial warehousing and worker housing.",
    marketImpact: "Strengthens demand for mixed-use commercial and residential land around Rau junction.",
    tag: "Logistics & Mixed Use",
  },
  {
    id: "trend-04",
    developerName: "Indore Development Authority (IDA)",
    developerType: "Government Authority",
    city: "Indore",
    actionType: "Govt Infra Tender",
    corridor: "Scheme 175 & 176 (Super Corridor Junction)",
    dealValue: "₹380 Crore Base Reserve",
    landArea: "4 Commercial Land Parcels",
    date: "22 Oct 2026",
    headline: "IDA E-Tenders 4 Mega Commercial Plots for Corporate Towers & 5-Star Hotels",
    summary: "Indore Development Authority invites bids from hospitality and IT conglomerates. Mandatory green-building guidelines and 100-meter frontage required.",
    marketImpact: "Elevates corporate presence along Super Corridor, triggering job influx and executive housing demand.",
    tag: "Govt E-Auction",
  },
  {
    id: "trend-05",
    developerName: "The Phoenix Mills Ltd",
    developerType: "Commercial Conglomerate",
    city: "Indore",
    actionType: "Commercial Influx",
    corridor: "MR-10 / Ring Road Extension",
    dealValue: "₹310 Crore",
    landArea: "18 Acres",
    date: "20 Oct 2026",
    headline: "Phoenix Mills Evaluates Second Destination Center on MR-10 Corridor",
    summary: "Following the historic footfalls of Phoenix Citadel on Bypass, the group seeks a complementary retail and entertainment hub catering to Vijay Nagar and MR-10 catchments.",
    marketImpact: "Retail and commercial plot valuations on MR-10 surge by 15% following early feasibility reports.",
    tag: "Retail Destination",
  },
  {
    id: "trend-06",
    developerName: "Tata Housing Development Co",
    developerType: "National Tier-1",
    city: "Bhopal",
    actionType: "Township Launch",
    corridor: "Hoshangabad Road (Near AIIMS & Metro)",
    dealValue: "₹450 Crore",
    landArea: "45 Acres",
    date: "25 Oct 2026",
    headline: "Tata Housing Enters Bhopal Market with Premium High-Rise Gated Community",
    summary: "Targeting healthcare professionals and government executive segments along the upcoming Purple Line Metro station, featuring 2 and 3 BHK sustainable homes.",
    marketImpact: "Brings branded national developer credibility to Bhopal's Southern expansion corridor.",
    tag: "Gated Community",
  },
  {
    id: "trend-07",
    developerName: "MP Industrial Development Corp (MPIDC)",
    developerType: "Government Authority",
    city: "Ujjain",
    actionType: "Govt Infra Tender",
    corridor: "Indore-Ujjain Highway / Tajpur Medical Device Park",
    dealValue: "₹720 Crore",
    landArea: "220 Acres",
    date: "23 Oct 2026",
    headline: "MPIDC Notifies Land Allotment for 35 Pharma & Medical Device Units",
    summary: "Ahead of Simhastha 2028, the Tajpur industrial node receives green clearances. Road four-laning connects the park directly to Sanwer and Indore.",
    marketImpact: "Land along Sanwer-Ujjain road transitions rapidly from purely agricultural to high-value industrial and service plotting.",
    tag: "Industrial Corridor",
  },
  {
    id: "trend-08",
    developerName: "Lodha (Macrotech Developers)",
    developerType: "National Tier-1",
    city: "Pune",
    actionType: "Land Acquisition",
    corridor: "Hinjewadi Phase 3 & Maan Road, Pune",
    dealValue: "₹550 Crore",
    landArea: "50 Acres",
    date: "22 Oct 2026",
    headline: "Lodha Acquires 50 Acres in Hinjewadi for Tech-Driven Integrated Township",
    summary: "Acquisition timed with the upcoming commercial launch of Pune Metro Line 3 connecting Hinjewadi to Shivajinagar.",
    marketImpact: "Spurs rental yield confidence and tech-worker plotted housing interest in Maan and Marunji.",
    tag: "Tech Township",
  },
  {
    id: "trend-09",
    developerName: "Prestige Group",
    developerType: "National Tier-1",
    city: "Bengaluru",
    actionType: "Commercial Influx",
    corridor: "Whitefield Outer Ring Road Junction, Bengaluru",
    dealValue: "₹1,100 Crore",
    landArea: "28 Acres",
    date: "21 Oct 2026",
    headline: "Prestige Launches Tech Cloud Park with 3.5 Million Sq.Ft Grade-A Office Space",
    summary: "Designed to meet global capability centers (GCC) expansion requirements with direct skywalk access to Namma Metro purple line.",
    marketImpact: "Whitefield secondary residential demand expands, with adjacent apartments experiencing low vacancy rates.",
    tag: "Grade-A Tech Park",
  },
];

// Stocks & REITs Ticker (Preserved for compatibility)
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
