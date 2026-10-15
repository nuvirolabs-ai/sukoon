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

// Layman Real Estate Dictionary (शब्दावली)
export const REAL_ESTATE_GLOSSARY: GlossaryTerm[] = [
  {
    term: "Registry (रजिस्ट्री)",
    termHindi: "पंजीकृत विक्रय पत्र (Registered Sale Deed)",
    simpleMeaning: "सरकारी सब-रजिस्ट्रार कार्यालय में स्टाम्प ड्यूटी चुकाकर संपत्ति का मालिकाना हक आधिकारिक रूप से अपने नाम दर्ज कराना।",
    whyItMatters: "बिना रजिस्ट्री के कोई भी नोटरी या सादा इकरारनामा कानूनी रूप से मालिकाना हक साबित नहीं करता।",
    riskNote: "रजिस्ट्री कराने से पहले 30 साल की सर्च रिपोर्ट (Search Report) अवश्य निकालें।",
  },
  {
    term: "Naamantaran / Mutation (नामांतरण)",
    termHindi: "राजस्व एवं नगर निगम रिकॉर्ड में नाम दर्ज होना",
    simpleMeaning: "रजिस्ट्री के बाद सरकारी राजस्व विभाग (तहसील) और नगर निगम के रिकॉर्ड में पुराने मालिक का नाम हटाकर नए मालिक का नाम चढ़ाना।",
    whyItMatters: "रजिस्ट्री से केवल सेल डीड बनती है, लेकिन नगर निगम टैक्स बिल और सरकारी रिकॉर्ड में नाम नामांतरण के बाद ही आता है।",
  },
  {
    term: "Khasra & Khatauni (खसरा और खतौनी)",
    termHindi: "ज़मीन का सरकारी सर्वे नंबर एवं खातेदार की नकल",
    simpleMeaning: "खसरा ज़मीन के हर टुकड़े का विशिष्ट सरकारी नंबर (Survey/Khasra No.) होता है, और खतौनी में उस नंबर के मालिक का नाम दर्ज होता है।",
    whyItMatters: "एमपी भूलेख (MP Bhulekh) पोर्टल पर खसरा नंबर डालकर तुरंत पता चलता है कि ज़मीन सरकारी है, बंधक है या किसी के नाम पर है।",
  },
  {
    term: "Diversion (डायवर्सन)",
    termHindi: "भूमि का गैर-कृषि उपयोग हेतु सरकारी रूपांतरण (NA Order)",
    simpleMeaning: "कृषि भूमि (खेती की ज़मीन) को मकान, प्लॉट या दुकान बनाने हेतु सरकारी आदेश से आवासीय या व्यावसायिक घोषित कराना।",
    whyItMatters: "बिना डायवर्सन वाले कृषि प्लॉट पर मकान बनाना अवैध माना जाता है और बैंक लोन भी नहीं मिलता।",
  },
  {
    term: "FAR / FSI (फ्लोर एरिया रेश्यो)",
    termHindi: "ज़मीन पर निर्माण की सरकारी अनुमत सीमा",
    simpleMeaning: "आपके प्लॉट के क्षेत्रफल के अनुपात में आप कितना वर्गफीट निर्माण (छत) बना सकते हैं, इसका सरकारी गणित।",
    whyItMatters: "यदि इंदौर में FAR 1.5 है, तो 1,000 sq.ft प्लॉट पर आप अधिकतम 1,500 sq.ft बिल्ट-अप बना सकते हैं।",
  },
  {
    term: "RERA (रेरा)",
    termHindi: "रियल एस्टेट विनियामक प्राधिकरण (RERA Act 2016)",
    simpleMeaning: "बिल्डरों और कॉलोनाइज़र की मनमानी रोकने और खरीदारों के अधिकारों की रक्षा करने वाली सरकारी नियामक संस्था।",
    whyItMatters: "हमेशा सुनिश्चित करें कि टाउनशिप या फ्लैट का RERA रजिस्ट्रेशन नंबर वैध और सक्रिय है।",
  },
];

// Crucial Do's and Don'ts for Property Buyers
export const DOS_AND_DONTS: CheckpointItem[] = [
  {
    id: "chk-01",
    title: "DO: 30-Year Search Report from Sub-Registrar",
    description: "हमेशा किसी अनुभवी वकील से 30 वर्षों का सर्च रिपोर्ट निकलवाएं ताकि पता चल सके कि ज़मीन पर कोई पुराना बैंक बंधक या पारिवारिक विवाद तो नहीं है।",
    type: "DO",
    stage: "Before Token / Advance",
  },
  {
    id: "chk-02",
    title: "DO: Match Demarcation Pillars on Ground",
    description: "कागज़ पर लिखा प्लॉट नंबर और मौके पर पटवारी द्वारा लगाए गए सीमांकन पिलर का आमने-सामने मिलान करें।",
    type: "DO",
    stage: "Before Token / Advance",
  },
  {
    id: "chk-03",
    title: "DON'T: Never Pay Full Cash on Plain Notary",
    description: "केवल ₹100 या ₹500 के नोटरी पेपर पर बड़ा नकद भुगतान कभी न करें। सुप्रीम कोर्ट के अनुसार नोटरी से मालिकाना हक स्थानांतरित नहीं होता।",
    type: "DONT",
    stage: "Before Token / Advance",
  },
  {
    id: "chk-04",
    title: "DO: Verify T&CP Approved Layout Map",
    description: "सुनिश्चित करें कि कॉलोनी का नक्शा नगर तथा ग्राम निवेश (T&CP) और सक्षम प्राधिकारी (IDA/Panchayat) से स्वीकृत है।",
    type: "DO",
    stage: "During Legal Verification",
  },
  {
    id: "chk-05",
    title: "DON'T: Ignore Road Widening Setbacks",
    description: "मास्टर प्लान में प्रस्तावित सड़क चौड़ीकरण की जानकारी अवश्य लें, ताकि भविष्य में आपका फ्रंट बाउंड्री या निर्माण टूटने का जोखिम न रहे।",
    type: "DONT",
    stage: "During Legal Verification",
  },
  {
    id: "chk-06",
    title: "DO: Apply for Immediate Municipal Mutation",
    description: "रजिस्ट्री होते ही 30 दिनों के भीतर नगर निगम और तहसील में नामांतरण का आवेदन दें और नाम दर्ज करवाएं।",
    type: "DO",
    stage: "At Possession / Registry",
  },
];

// Basic Vastu Shastra Guidelines for Home Construction
export const VASTU_GUIDELINES: VastuDirection[] = [
  {
    direction: "North-East (ईशान कोण)",
    directionHindi: "ईशान दिशा (शुभ एवं पावन)",
    element: "जल तत्व (Water)",
    governingDeity: "भगवान शिव / बृहस्पति",
    idealRooms: ["पूजा कक्ष (Mandir)", "भूमिगत जल बोरिंग / वाटर टैंक", "हल्का खुला लॉन"],
    avoidRooms: ["शौचालय (Toilet)", "सीढ़ियां (Staircase)", "भारी स्टोरेज"],
    keyAdvice: "ईशान कोण को हमेशा साफ, खुला और हल्का रखें। यहां बोरिंग कराना अत्यंत शुभ और सुख-समृद्धिदायक माना जाता है।",
  },
  {
    direction: "South-East (आग्नेय कोण)",
    directionHindi: "आग्नेय दिशा (ऊर्जा एवं अग्नि)",
    element: "अग्नि तत्व (Fire)",
    governingDeity: "अग्नि देव",
    idealRooms: ["रसोई घर (Kitchen)", "बिजली का मुख्य मीटर", "इन्वर्टर / जेनरेटर रूम"],
    avoidRooms: ["मास्टर बेडरूम", "भूमिगत पानी की टंकी", "मुख्य प्रवेश द्वार"],
    keyAdvice: "रसोई में खाना बनाते समय मुख पूर्व दिशा की ओर होना चाहिए। पानी और आग (सिंक और गैस चूल्हा) एक साथ पास न रखें।",
  },
  {
    direction: "South-West (नैऋत्य कोण)",
    directionHindi: "नैऋत्य दिशा (स्थिरता एवं आधार)",
    element: "पृथ्वी तत्व (Earth)",
    governingDeity: "नैऋति",
    idealRooms: ["मालिक का मुख्य बेडरूम (Master Bedroom)", "भारी तिजोरी / अलमारी", "ऊंची छत / भारी निर्माण"],
    avoidRooms: ["मुख्य द्वार", "भूमिगत बोरिंग या कुआं", "मंदिर"],
    keyAdvice: "यह दिशा परिवार के मुखिया की स्थिरता का प्रतीक है। इसे घर का सबसे ऊंचा और भारी हिस्सा होना चाहिए।",
  },
  {
    direction: "North-West (वायव्य कोण)",
    directionHindi: "वायव्य दिशा (गति एवं वायु)",
    element: "वायु तत्व (Air)",
    governingDeity: "वायु देव",
    idealRooms: ["अतिथि कक्ष (Guest Room)", "अविवाहित कन्या का कमरा", "कार पार्किंग", "सेप्टिक टैंक"],
    avoidRooms: ["मास्टर बेडरूम", "पूजा घर"],
    keyAdvice: "अतिथि कक्ष के लिए उत्तम दिशा मानी जाती है। सेप्टिक टैंक को वायव्य के उत्तरी हिस्से में रखना अनुमत है।",
  },
  {
    direction: "North (उत्तर दिशा - कुबेर स्थान)",
    directionHindi: "उत्तर दिशा (धन एवं समृद्धि)",
    element: "जल / बुध",
    governingDeity: "भगवान कुबेर",
    idealRooms: ["मुख्य द्वार (Main Entrance)", "लिविंग रूम", "खुली बालकनी"],
    avoidRooms: ["भारी दीवारें", "शौचालय"],
    keyAdvice: "उत्तर दिशा से सकारात्मक चुंबकीय ऊर्जा का प्रवाह होता है। यहां बड़ी खिड़कियां और खुलापन धन प्रदाता होता है।",
  },
  {
    direction: "East (पूर्व दिशा - सूर्य स्थान)",
    directionHindi: "पूर्व दिशा (स्वास्थ्य एवं प्रगति)",
    element: "अग्नि / सूर्य",
    governingDeity: "सूर्य देव एवं इंद्र",
    idealRooms: ["मुख्य द्वार", "अध्ययन कक्ष (Study Room)", "बरामदा"],
    avoidRooms: ["शौचालय", "कचरा घर"],
    keyAdvice: "सुबह की पहली सूर्य किरणें घर में प्रवेश करनी चाहिए, जो परिवार के सदस्यों को उत्तम स्वास्थ्य और लंबी आयु प्रदान करती हैं।",
  },
];

// Informative Video Links & Podcasts
export const MEDIA_RESOURCES: MediaResource[] = [
  {
    id: "med-01",
    title: "मकान बनाने में ₹5 से 8 लाख कैसे बचाएं? (Civil Engineer Guide)",
    type: "Video",
    duration: "18 mins",
    creator: "Er. Amit Sharma (Indore)",
    summary: "सीमेंट, सरिया और लेबर ठेके में होने वाली सामान्य गलतियां और उनसे लाखों रुपये बचाने के 7 व्यावहारिक सुझाव।",
    url: "https://youtube.com/watch?v=example-construction-save",
    thumbnail: "/home/construction.png",
  },
  {
    id: "med-02",
    title: "प्लॉट खरीदने से पहले रजिस्ट्री और खसरा चेक करने का आसान तरीका",
    type: "Video",
    duration: "12 mins",
    creator: "Adv. Alok Sharma (High Court Advocate)",
    summary: "एमपी भूलेख पोर्टल से खसरा, खतौनी और डायवर्सन ऑर्डर अपने मोबाइल से 5 मिनट में खुद चेक करना सीखें।",
    url: "https://youtube.com/watch?v=example-registry-check",
    thumbnail: "/home/vault.png",
  },
  {
    id: "med-03",
    title: "पॉडकास्ट: इंदौर 2030 - मेट्रो, सुपर कॉरिडोर और जमीनों का भविष्य",
    type: "Podcast",
    duration: "34 mins",
    creator: "Malwa PropCast Episode 14",
    summary: "इंदौर के रियल एस्टेट विश्लेषक चर्चा करते हैं कि अगले 5 वर्षों में किस क्षेत्र में निवेश से सबसे तेज़ रिटर्न मिलेगा।",
    url: "https://podcast.sukoon.local/episode-14",
    thumbnail: "/home/buy-sell.png",
  },
  {
    id: "med-04",
    title: "मकान का नक्शा बनवाते समय वास्तु के 5 स्वर्णिम नियम",
    type: "Podcast",
    duration: "22 mins",
    creator: "Vastu Shastra Expert Vani",
    summary: "20x50 और 30x50 के प्लॉट में बिना तोड़-फोड़ के 100% वास्तु कैसे बैठाएं।",
    url: "https://podcast.sukoon.local/vastu-rules",
    thumbnail: "/home/updates.png",
  },
];
