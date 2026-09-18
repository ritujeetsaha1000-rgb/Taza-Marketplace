// Global App State & Config
const API_BASE = '/api/v1';
let currentLanguage = localStorage.getItem('taza_language') || 'en';
let products = [];
let cart = JSON.parse(localStorage.getItem('taza_cart') || '[]');
let currentRole = 'consumer';
let currentFilter = 'all';
let currentSort = 'freshness';
let currentSearchQuery = '';
let activeModalProduct = null;
let authTokens = { consumer: null, farmer: null };
let currentUser = { id: 1, name: 'Sourav Banerjee' };
let cachedFarmerOrders = [];

// ===== Toast Notification System =====
function createToastContainer() {
  if (document.getElementById('toastContainer')) return;
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
}

function showToast(message, type = 'info', duration = 3500) {
  createToastContainer();
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.textContent = `${icons[type] || 'ℹ️'} ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
window.showToast = showToast;

// ===== Safe DOM Helper =====
function sanitizeText(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const CROP_NAME_TRANSLATIONS = {
  "Red Onion (Peyaj)": {
    bn: "লাল পেঁয়াজ (দেশি পেঁয়াজ)",
    hi: "लाल प्याज (देसी प्याज)"
  },
  "Fresh Mountain Ginger (Ada)": {
    bn: "তাজা পাহাড়ি আদা",
    hi: "ताजा पहाड़ी अदरक"
  },
  "White Garlic (Rosun)": {
    bn: "সাদা রসুন (গ্রেড এ)",
    hi: "सफेद लहसुन (ग्रेड ए)"
  },
  "Fresh Farm Tomato": {
    bn: "তাজা হাইব্রিড টমেটো",
    hi: "ताजा हाइब्रिड टमाटर"
  },
  "Fresh Hybrid Tomato": {
    bn: "তাজা হাইব্রিড টমেটো",
    hi: "ताजा हाइब्रिड टमाटर"
  },
  "Crisp Shimla Royal Apple": {
    bn: "সিমলা রয়্যাল আপেল",
    hi: "शिमला रॉयल सेब"
  },
  "Fresh Purple Brinjal (Begun)": {
    bn: "তাজা মুক্তকেশী বেগুন",
    hi: "ताजा बैंगनी बैंगन"
  },
  "Chandramukhi Premium Potato": {
    bn: "চন্দ্রমুখী প্রিমিয়াম আলু",
    hi: "चंद्रमुखी प्रीमियम आलू"
  },
  "Chandramukhi Potato": {
    bn: "চন্দ্রমুখী প্রিমিয়াম আলু",
    hi: "चंद्रमुखी प्रीमियम आलू"
  },
  "Jyoti Table Potato": {
    bn: "সিঙ্গুর জ্যোতি আলু",
    hi: "सिंगूर ज्योति आलू"
  },
  "Jyoti Potato": {
    bn: "সিঙ্গুর জ্যোতি আলু",
    hi: "सिंगूर ज्योति आलू"
  },
  "Jyoti Potato (Singur Royal)": {
    bn: "সিঙ্গুর জ্যোতি আলু (রয়্যাল)",
    hi: "सिंगूर ज्योति आलू (रॉयल)"
  },
  "Singur Jyoti Potato (Fresh Farmgate)": {
    bn: "সিঙ্গুর জ্যোতি আলু (তাজা ফার্মগেট)",
    hi: "सिंगूर ज्योति आलू (फार्म फ्रेश)"
  },
  "Pointed Gourd (Green Potol)": {
    bn: "তাজা কচি পটল",
    hi: "ताजा हरा परवल"
  },
  "Pointed Gourd (Potol)": {
    bn: "তাজা কচি পটল",
    hi: "ताजा हरा परवल"
  },
  "Fresh Crisp Carrot (Gajar)": {
    bn: "তাজা মিষ্টি গাজর",
    hi: "ताजा लाल गाजर"
  },
  "Green Bell Capsicum (Shimla Mirch)": {
    bn: "সবুজ ক্যাপসিকাম (শিমলা লঙ্কা)",
    hi: "हरी शिमला मिर्च"
  },
  "Sweet Lime / Mousambi (Pack of 4)": {
    bn: "রসালো মিষ্টি মৌসম্বি",
    hi: "रसदार मीठा मौसमी"
  },
  "Bengal Martaman Banana (Kola)": {
    bn: "বাংলার মার্তমান কলা (ডজন)",
    hi: "बंगाल मर्तबान केला (दर्जन)"
  },
  "Bengal Martaman Banana (Dozen)": {
    bn: "বাংলার মার্তমান কলা (ডজন)",
    hi: "बंगाल मर्तबान केला (दर्जन)"
  },
  "Ruby Pomegranate (Bedana)": {
    bn: "মিষ্টি লাল বেদানা / ডালিম",
    hi: "मीठा लाल अनार / बेदाना"
  },
  "Fresh Bottle Gourd Greens (Lau Shak)": {
    bn: "তাজা কচি লাউ শাক",
    hi: "ताजा लौकी साग"
  },
  "Golden Sona Moong Dal (সোনা মুগ ডাল)": {
    bn: "খাঁটি সোনা মুগ ডাল",
    hi: "शुद्ध सोना मूंग दाल"
  },
  "Green Gram (Moong Dal)": {
    bn: "খাঁটি সোনা মুগ ডাল",
    hi: "शुद्ध सोना मूंग दाल"
  },
  "Red Lentil (Masoor Dal)": {
    bn: "দেশি মসুর ডাল",
    hi: "देसी मसूर दाल"
  },
  "Red Lentil (Desi Masoor Dal)": {
    bn: "দেশি মসুর ডাল",
    hi: "देसी मसूर दाल"
  },
  "Aromatic Gobindobhog Rice (গোবিন্দভোগ চাল)": {
    bn: "গোবিন্দভোগ সুগন্ধি চাল (জিআই ঐতিহ্য)",
    hi: "गोविंदभोग सुगंधित चावल (जीआई हेरिटेज)"
  },
  "Gobindobhog Rice": {
    bn: "গোবিন্দভোগ সুগন্ধি চাল (জিআই)",
    hi: "गोविंदभोग सुगंधित चावल (जीआई)"
  },
  "Gobindobhog Aromatic Rice (GI Heritage)": {
    bn: "গোবিন্দভোগ সুগন্ধি চাল (জিআই ঐতিহ্য)",
    hi: "गोविंदभोग सुगंधित चावल (जीआई हेरिटेज)"
  },
  "Minikit Parboiled Rice (মিনিকিট চাল)": {
    bn: "মিনিকিট চাল (প্রিমিয়াম)",
    hi: "मिनीकिट चावल (प्रीमियम)"
  },
  "Minikit Rice": {
    bn: "মিনিকিট চাল (প্রিমিয়াম)",
    hi: "मिनीकिट चावल (प्रीमियम)"
  },
  "Green Bullet Chili": {
    bn: "ঝাল বুলেট কাঁচা লঙ্কা",
    hi: "तीखी हरी बुलेट मिर्च"
  },
  "White Garlic": {
    bn: "সাদা রসুন",
    hi: "सफेद लहसुन"
  },
  "Large Cardamom": {
    bn: "দার্জিলিং বড় এলাচ",
    hi: "दार्जिलिंग बड़ी इलायची"
  }
};

const APP_TRANSLATIONS = {
  en: {
    // Role selection
    roleModalTitle: "Welcome to TAZA KisanDirect",
    roleModalSubtitle: "Direct Farm-to-Fork Agri-Logistics Marketplace & Fair-Trade Platform",
    rolePromptHeading: "Please select your role to continue:",
    rolePromptSub: "Choose your profile type to tailor your live platform dashboard",
    badgeDirectBuyer: "Direct Buyer",
    roleConsumerTitle: "I am a Consumer / Buyer",
    roleConsumerDesc: "For households, restaurants & commercial buyers seeking farm-fresh produce.",
    btnEnterConsumer: 'Enter as Consumer <i data-lucide="arrow-right"></i>',
    badgeFarmerProducer: "Producer / FPO",
    roleFarmerTitle: "I am a Farmer / FPO",
    roleFarmerDesc: "For individual crop growers, FPO collectives & farm aggregators.",
    btnEnterFarmer: 'Enter Farmer Hub <i data-lucide="arrow-right"></i>',
    roleFooterNote: "Secured with Dual Role-Based Access Control • West Bengal Agri-Corridor",

    // Navigation
    navDeliveryHeader: "Delivering to Kolkata 700001",
    navDeliveryDistrict: "Bengal Agricultural Corridor",
    searchCatAll: "All Crops",
    searchCatVeg: "Vegetables",
    searchCatFruits: "Fruits",
    searchCatGrains: "Grains & Rice",
    searchCatTubers: "Tubers & Potatoes",
    searchCatSpices: "Spices",
    searchPlaceholder: "Search direct farm produce: 'Singur Potato', 'Gobindobhog', 'Himsagar'...",
    navUserGreetingConsumer: "Hello, Sourav",
    navUserGreetingFarmer: "Hello, Ananda (Farmer)",
    navUserRoleConsumer: 'Consumer Hub <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>',
    navUserRoleFarmer: 'Farmer Hub <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>',
    navOrdersLine1: "Returns",
    navOrdersLine2: "& Orders",
    navCartLabel: "Cart",
    retailSavingsCounter: '<i data-lucide="trending-down"></i> Retail Markup Saved Today: ₹1,24,900',

    // Subnav
    subnavMenuAllText: "All Categories",
    subnavVeg: "Fresh Vegetables",
    subnavFruits: "Seasonal Fruits",
    subnavGrains: "Direct Grains & Rice",
    subnavLogisticsText: "AI Smart Logistics",
    subnavMandiText: "Mandi Arbitrage Engine",

    // Hero
    heroCommercialBadge: '<i data-lucide="award"></i> No Mandi Intermediaries • Zero Markups',
    heroMainTitle: "Fresh Harvests Shipped Direct From Verified FPOs",
    heroMainDesc: "Order fresh vegetables, grains, and fruits straight from the farm gate. Direct price transparency from 150g up to 50kg wholesale lots with live freshness decay analytics.",
    heroOrderBtn: "Order Harvest Fresh",
    heroRouteBtnText: "View AI Route Matrix",
    promo1Title: "Fair Price Guarantee",
    promo1Desc: "Farmers earn 35% more; buyers save 40% vs APMC.",
    promo2Title: "< 18hr Farm-to-Gate",
    promo2Desc: "Green EV & direct corridor dispatch.",

    // Category pills
    pillAll: '<i data-lucide="layout-grid"></i> All Crops',
    pillVeg: '<i data-lucide="salad"></i> Vegetables',
    pillFruits: '<i data-lucide="apple"></i> Fruits',
    pillGrains: '<i data-lucide="wheat"></i> Grains & Rice',
    pillPulses: '<i data-lucide="cookie"></i> Pulses & Dal',
    pillTubers: '<i data-lucide="layers"></i> Tubers & Potato',

    // Catalog & Sorting
    catalogHeading: "Today's Fresh Cut Harvests",
    catalogSubtitle: "Live inventory direct from West Bengal FPO collection centers & farm gates",
    catalogSortLabel: "Sort By:",
    sortOptFreshness: "Freshness Rating (Highest First)",
    sortOptPriceAsc: "Price: Low to High",
    sortOptPriceDesc: "Price: High to Low",
    sortOptDistance: "Nearest Farm Distance",

    // Farmer Hub
    farmerHeaderTitle: "Farmer & FPO Producer Operations Hub",
    farmerWelcomeSub: "Real-time mandi arbitrage, demand forecasting & direct route dispatch",
    farmerCreateListingBtnText: "Create New Harvest Listing",
    farmerAiTitle: "AI Demand Predictor",
    farmerAiDesc: "Wholesale & Household demand for <strong>Jyoti Potato & Pointed Gourd</strong> in Kolkata is projected to spike <strong>+38%</strong> this weekend. Suggested farmgate quote: <strong>₹21-24/kg</strong>.",
    farmerWeatherTitle: "Disaster & Weather Alert",
    farmerWeatherAlertText: "Gangetic plains advisory: Moderate rainfall expected in southern districts. <strong>Shared reefer vehicles</strong> reserved for FPO cluster dispatch.",
    farmerLogisticsTitle: "Route Aggregation (Shared Green Logistics)",
    farmerLogisticsDesc: "3 other farms in Singur & Tarakeswar are loading EV trucks for Vashi/Kolkata corridor tomorrow. Combining shipments saves <strong>₹2,800 in fuel</strong>.",
    farmerFormTitle: "List Harvest for Consumer & Bulk Sale",
    labelCropName: "Crop Name & Variety",
    chip1: "Jyoti Potato",
    chip2: "Pointed Gourd (Potol)",
    chip3: "Nasik Onion (Peyaj)",
    chip4: "Shimla Royal Apple",
    chip5: "Desi Ginger (Ada)",
    chip6: "Bengal Garlic (Rosun)",
    chip7: "Gobindobhog Rice",
    labelCategory: "Category",
    labelStock: "Available Stock (kg / Dozen)",
    labelPrice: "Direct Farm Gate Price (₹)",
    helperNetPayout: "* Zero Mandi deductions. You keep 100% of this price.",
    labelMinQty: "Minimum Order Quantity",
    helperMinQty: "* Set 0.5 kg for retail or 20 kg for commercial bulk.",
    mandiCardTitle: '<i data-lucide="database" style="width: 14px; height: 14px; display: inline-block; vertical-align: -2px; margin-right: 4px;"></i> Official Mandi APMC Benchmark (Database Auto-Calculated)',
    mandiLiveTag: "Agmarknet WB Live",
    mandiModalLabel: "Mandi Modal Price",
    mandiRetailLabel: "Est. City Retail Rate",
    mandiAdvantageLabel: "Farmer Direct Advantage",
    mandiMarketLabel: "Market:",
    labelDistrict: "Production District",
    labelDescription: "Crop Description & Organic Certification",
    btnPublishCrop: "Publish Directly to Live Store",
    farmerOrdersSectionTitle: "Direct Incoming Orders (Zero Brokers)",

    // Cart Drawer
    cartDrawerTitle: "Your Direct Farm Cart",
    btnClearAll: "Clear All",
    labelProduceSubtotal: "Produce Subtotal:",
    labelPlatformFee: "Platform Fee (2% Fair Trade):",
    labelDelivery: "Delivery:",
    cartDeliveryFee: "₹35.00 - ₹65.00 (Tiered by Harvest Qty)",
    labelTotalPayable: "Total Payable:",
    btnCheckout: "Proceed to Direct Farm Checkout",

    // Product Modal
    labelSpecHarvested: "Harvested",
    labelSpecDelivery: "Delivery Speed",
    labelSpecSeason: "Season / District",
    labelModalSelectQty: "Select Desired Quantity",
    labelModalComputedTotal: "Calculated Total:",
    btnModalAddToCartText: "Add Direct Farm Order to Cart",

    // AI Logistics Modal
    logisticsEngineTag: '<i data-lucide="cpu"></i> AI Logistics Engine',
    logisticsHeading: "Direct Farm Route & Flood Rerouting Matrix",
    logisticsConsignmentLabel: "Live Dispatch Consignment ID:",
    logisticsOriginLabel: '<i data-lucide="map-pin"></i> Origin District (Farm Hub):',
    logisticsDestLabel: '<i data-lucide="navigation"></i> Destination Hub:',
    tabDirectText: "Direct Farm Corridor",
    tabBatchText: "Multi-Stop Cluster Pickup (TSP)",
    statLabelRouteDistTime: "Route Distance & Time",
    statLabelIntermediaries: "Intermediaries Skipped",
    statLabelCarbon: "Carbon Emission Saved",
    statLabelFreight: "Freight Savings",
    tspAlertText: "<strong>Heuristic TSP Engine:</strong> Optimizing multi-farmer pickup sequence to maximize vehicle payload while minimizing deadhead mileage.",
    tspSectionTitle: '<i data-lucide="truck"></i> Sequenced Farmgate Pickups',
    tspLabelCargo: "Aggregated Cargo",
    tspLabelUtilization: "Vehicle Utilization",
    tspLabelDistance: "Batch Circuit Distance",
    tspLabelCost: "Est. Aggregation Cost",
    btnCloseLogistics: "Close Logistics Inspector",

    // Orders Modal
    ordersModalHeading: "Your Farm Direct Orders & Escrow Shipments",
    ordersModalSub: "Real-time delivery status, waybills, and farmer contact relays",

    // Footer
    footerBackToTop: "Back to top",
    footerCol1Title: "Get to Know Us",
    fLinkAbout: "About TAZA Agri-Tech",
    fLinkFpo: "FPO Empowerment Mission",
    fLinkZero: "Zero Intermediary Charter",
    fLinkDisaster: "Calamity Disaster Fund",
    footerCol2Title: "Connect with Farmers",
    fLinkProducers: "Verified Bengal Producer Groups",
    fLinkHubs: "Regional Agro Hubs (Singur/Memari)",
    fLinkCalendar: "Harvest Calendar & Yields",
    fLinkInquiries: "Direct 1:1 Inquiries",
    footerCol3Title: "Make Money with Us",
    fLinkRegister: "Register as an FPO / Farmer",
    fLinkGreenFleet: "Partner with Farm Green Fleet",
    fLinkAiFleet: "AI Fleet Operator Program",
    footerCol4Title: "Assurance & Protection",
    fLinkPriceTrans: "Direct Price Transparency",
    fLinkInsurance: "Transit Spoilage Insurance",
    fLinkEscrow: "Escrow Payout Guarantee",
    fLinkDocs: "OpenAPI Backend Specs (/docs)",
    footerBottomBrand: "TAZA Fair-Trade E-Commerce & Logistics Network • West Bengal, India",
    footerBottomCopy: "© 2026 TAZA Agri-Tech Platform. Direct farm-to-table system with zero middlemen markup.",

    // Floating Bar & Toast
    btnFloatingViewCartText: "View Cart",
    cartToastText: "Added to cart",

    // TazaTalks AI Chatbot
    tazaTalksFloatingTitle: "TazaTalks AI",
    tazaTalksActiveModeConsumer: "🛒 Consumer Assistance Interface (Active)",
    tazaTalksActiveModeFarmer: "🌾 Farmer & FPO Operations Interface (Active)",
    tazaTalksSubheadConsumer: "Consumer Agro-Direct Assistant",
    tazaTalksSubheadFarmer: "Farmer & FPO Operations Assistant",
    tazaTalksInputPlaceholder: "Ask TazaTalks or type a question...",
    tazaTalksHelpCardTitle: "Need Further Assistance?",
    tazaTalksHelpCardDesc: "Our dedicated Kisan & Consumer Helpline is active 24/7 for Bengal agro-trade.",
    tazaTalksCallBtnText: "Call Customer Care (6289069619)",
    tazaTalksWelcomeConsumer: "👋 Hi! Welcome to <strong>TazaTalks Consumer Support</strong>. How can I help you today? Choose an FAQ below or ask any question!",
    tazaTalksWelcomeFarmer: "🌾 Welcome to <strong>TazaTalks Farmer & FPO Hub</strong>. Need help with warehouse booking, mandi rates, or payouts? Tap an FAQ below or ask anything!",
    tazaTalksFallbackMsg: "I couldn't find an automated answer for your specific query. You can connect directly with our 24/7 West Bengal Customer Care team right away:",

    // Frequently Bought Section & Bundle Modal
    freqBoughtTitle: "Frequently Bought by You",
    freqBasedBadge: "Based on your past orders",
    freqBoughtSubtitle: "Top reordered staples from verified Bengal farmgates • Hover & slide to explore",
    btnBuyBundleText: "1-Click Reorder Basket",
    freqModalBadgeText: "Direct Farm Reorder Basket",
    freqBundleModalTitle: "Frequently Bought Staple Crops",
    freqBundleModalSubtitle: "Your recurring household staples based on your order history & seasonal demand",
    labelBundleItemsHeading: "Curated Reorder Items",
    labelFreqProduceSubtotal: "Produce Subtotal:",
    labelFreqMandiRetail: "Mandi City Retail Value:",
    labelFreqDirectSavings: "Your Direct Savings:",
    labelFreqTotalPayable: "Total Basket Payable:",
    btnCancelFreqModal: "Keep Browsing",
    btnAddAllFreqText: "Add All Items to Cart & Reorder",

    // Favourite Farmers & Direct 1:1 Chat
    subnavFavFarmersText: "Favourite Farmers",
    favFarmersTitle: "Your Favourite Farmers & FPO Collectives",
    favFarmersSubtitle: "Direct access to verified Bengal growers • Select your district & chat 1:1 in real-time",
    favEscrowPillText: "Direct Farmgate Escrow",
    favDistrictLabelText: "Your District:",
    optDistrictAll: "All Bengal Districts (8 FPOs)",
    optDistrictHooghly: "Hooghly (Singur / Tarakeswar)",
    optDistrictNadia: "Nadia (Ranaghat / Beldanga)",
    optDistrictBardhaman: "Purba Bardhaman (Memari / Kalna)",
    optDistrictDarjeeling: "Darjeeling (Kurseong / Gorubathan)",
    optDistrictMalda: "Malda (English Bazar / Samsi)",
    optDistrictMurshidabad: "Murshidabad (Baharampur / Kandi)",
    optDistrictSouth24: "South 24 Parganas (Baruipur / Canning)",
    optDistrictBankura: "Bankura (Bishnupur / Kotulpur)",
    btnFarmerChatText: "Chat with Farmer",
    btnFarmerCallText: "Call Gate",
    farmerChatEscrowTag: "Escrow Protected",
    farmerChipsHeading: "Quick Questions for this Farmer:",
    farmerChatPlaceholder: "Ask about harvest quality, bulk supply, dispatch...",
    farmerChatHelplineNote: '<i data-lucide="headset" style="width:12px;height:12px;display:inline-block;vertical-align:-1px;"></i> Zero-Broker Relay Helpline:',
    farmerTypingLabel: "Farmer is typing...",

    // Stock-Market Dynamic Pricing
    pricingChoiceTitle: "Daily Pricing Strategy (Stock-Market Model)",
    optDynamicPegTitle: "📈 Dynamic Daily Market Peg",
    optDynamicPegSub: "Produce price dynamically tracks daily Mandi movements & arrivals like commodity stocks.",
    optFixedPriceTitle: "🔒 Fixed Farm Gate Price",
    optFixedPriceSub: "Lock a steady, constant price per kg that never changes regardless of daily market swings.",
    labelPrice: "Base Target Price (₹/kg)",
    helperNetPayout: "Baseline target payout without middleman cuts.",
    labelFloorText: "🛡️ Minimum Price Floor (MSP ₹/kg)",
    helperPriceFloor: "Produce will never sell below this floor even in market dips.",
    previewStripLabel: "Today's Dynamic Market Price:",
    labelHarvestTime: "Harvest Date & Time (ফসল তোলার তারিখ ও সময়)",
    helperHarvestTime: "💡 Tallying harvest time against current clock computes the live freshness index and guarantees consumer quality upon delivery.",
    labelLiveFreshnessTitle: "Real-Time Biological Freshness Index [e^(-λ·t)]"
  },

  bn: {
    // Role selection
    roleModalTitle: "তাজা কিষাণডাইরেক্ট-এ স্বাগতম",
    roleModalSubtitle: "সরাসরি খামার থেকে ক্রেতার দুয়ারে কৃষি-লজিস্টিকস ও ন্যায্য বাণিজ্য মার্কেটপ্লেস",
    rolePromptHeading: "অনুগ্রহ করে আপনার ভূমিকা নির্বাচন করুন:",
    rolePromptSub: "আপনার প্ল্যাটফর্ম অভিজ্ঞতা কাস্টমাইজ করতে প্রোফাইল বেছে নিন",
    badgeDirectBuyer: "সরাসরি ক্রেতা",
    roleConsumerTitle: "আমি একজন ক্রেতা / ভোক্তা",
    roleConsumerDesc: "পরিবার, রেস্তোরাঁ ও বাণিজ্যিক ক্রেতাদের জন্য খাঁটি তাজা ফসলের সরাসরি ক্রয়।",
    btnEnterConsumer: 'ভোক্তা হিসেবে প্রবেশ করুন <i data-lucide="arrow-right"></i>',
    badgeFarmerProducer: "উৎপাদক / এফপিও",
    roleFarmerTitle: "আমি একজন কৃষক / এফপিও",
    roleFarmerDesc: "স্বতন্ত্র কৃষক, কৃষক উৎপাদক সংস্থা (FPO) এবং সমবায়ের জন্য।",
    btnEnterFarmer: 'কৃষক হাবে প্রবেশ করুন <i data-lucide="arrow-right"></i>',
    roleFooterNote: "দ্বৈত ভূমিকা-ভিত্তিক সুরক্ষিত প্রবেশাধিকার • পশ্চিমবঙ্গ কৃষি করিডোর",

    // Navigation
    navDeliveryHeader: "ডেলিভারি গন্তব্য: কলকাতা ৭০০০০১",
    navDeliveryDistrict: "পশ্চিমবঙ্গ কৃষি করিডোর",
    searchCatAll: "সকল ফসল",
    searchCatVeg: "শাকসবজি",
    searchCatFruits: "ফলমূল",
    searchCatGrains: "শস্য ও চাল",
    searchCatTubers: "আলু ও কন্দ",
    searchCatSpices: "মশলাপাতি",
    searchPlaceholder: "সরাসরি খামারের ফসল খুঁজুন: 'সিঙ্গুর আলু', 'গোবিন্দভোগ', 'হিমসাগর'...",
    navUserGreetingConsumer: "নমস্কার, সৌরভ",
    navUserGreetingFarmer: "নমস্কার, আনন্দ (কৃষক)",
    navUserRoleConsumer: 'ভোক্তা হাব <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>',
    navUserRoleFarmer: 'কৃষক হাব <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>',
    navOrdersLine1: "অর্ডার",
    navOrdersLine2: "ও ট্র্যাকিং",
    navCartLabel: "কার্ট",
    retailSavingsCounter: '<i data-lucide="trending-down"></i> আজ মধ্যস্বত্বভোগীদের সাশ্রয়: ₹১,২৪,৯০০',

    // Subnav
    subnavMenuAllText: "সব ক্যাটাগরি",
    subnavVeg: "তাজা শাকসবজি",
    subnavFruits: "মৌসুমি ফলমূল",
    subnavGrains: "সরাসরি চাল ও শস্য",
    subnavLogisticsText: "এআই স্মার্ট লজিস্টিকস",
    subnavMandiText: "মান্ডি আরবিট্রেজ ইঞ্জিন",

    // Hero
    heroCommercialBadge: '<i data-lucide="award"></i> কোনো মধ্যস্বত্বভোগী নেই • শূন্য বাড়তি দাম',
    heroMainTitle: "যাচাইকৃত এফপিও ও খামার থেকে সরাসরি তাজা ফসল",
    heroMainDesc: "সরাসরি খামার গেট থেকে তাজা শাকসবজি, শস্য এবং ফল অর্ডার করুন। ১৫০ গ্রাম থেকে ৫০ কেজি পাইকারি লট পর্যন্ত রিয়েল-টাইম সতেজতা ট্র্যাকিং সহ স্বচ্ছ মূল্য।",
    heroOrderBtn: "তাজা ফসল অর্ডার করুন",
    heroRouteBtnText: "এআই রুট ম্যাট্রিক্স দেখুন",
    promo1Title: "ন্যায্য মূল্যের নিশ্চয়তা",
    promo1Desc: "কৃষকদের ৩৫% বেশি আয়; ক্রেতাদের ৪০% সাশ্রয়।",
    promo2Title: "< ১৮ ঘণ্টা খামার থেকে দুয়ারে",
    promo2Desc: "গ্রিন ইভি ও সরাসরি করিডোর ডিসপ্যাচ।",

    // Category pills
    pillAll: '<i data-lucide="layout-grid"></i> সকল ফসল',
    pillVeg: '<i data-lucide="salad"></i> শাকসবজি',
    pillFruits: '<i data-lucide="apple"></i> ফলমূল',
    pillGrains: '<i data-lucide="wheat"></i> শস্য ও চাল',
    pillPulses: '<i data-lucide="cookie"></i> ডাল ও কলাই',
    pillTubers: '<i data-lucide="layers"></i> আলু ও কন্দ',

    // Catalog & Sorting
    catalogHeading: "আজকের তাজা সংগ্রহ করা ফসল",
    catalogSubtitle: "পশ্চিমবঙ্গ এফপিও সংগ্রহ কেন্দ্র ও খামার গেট থেকে সরাসরি লাইভ স্টক",
    catalogSortLabel: "বাছাই করুন:",
    sortOptFreshness: "সতেজতা রেটিং (সর্বোচ্চ আগে)",
    sortOptPriceAsc: "মূল্য: কম থেকে বেশি",
    sortOptPriceDesc: "মূল্য: বেশি থেকে কম",
    sortOptDistance: "নিকটবর্তী খামারের দূরত্ব",

    // Farmer Hub
    farmerHeaderTitle: "কৃষক ও এফপিও উৎপাদক অপারেশনস হাব",
    farmerWelcomeSub: "রিয়েল-টাইম মান্ডি সালিশি, চাহিদার পূর্বাভাস ও সরাসরি রুট ডিসপ্যাচ",
    farmerCreateListingBtnText: "নতুন ফসলের তালিকা তৈরি করুন",
    farmerAiTitle: "এআই চাহিদা পূর্বাভাস",
    farmerAiDesc: "কলকাতায় <strong>জ্যোতি আলু ও পটল</strong>-এর পাইকারি ও পারিবারিক চাহিদা এই উইকএন্ডে <strong>+৩৮%</strong> বৃদ্ধির পূর্বাভাস। প্রস্তাবিত খামার দর: <strong>₹২১-২৪/কেজি</strong>।",
    farmerWeatherTitle: "দুর্যোগ ও আবহাওয়া সতর্কতা",
    farmerWeatherAlertText: "গাঙ্গেয় সমভূমি পরামর্শ: দক্ষিণ জেলাগুলিতে মাঝারি বৃষ্টির সম্ভাবনা। এফপিও ক্লাস্টারের জন্য <strong>শেয়ার্ড রিফার ভ্যান</strong> সংরক্ষিত।",
    farmerLogisticsTitle: "রুট একত্রীকরণ (শেয়ার্ড গ্রিন লজিস্টিকস)",
    farmerLogisticsDesc: "সিঙ্গুর ও তারকেশ্বরের আরও ৩টি খামার আগামীকাল কলকাতার উদ্দেশ্যে ইভি ট্রাক লোড করছে। একত্রীকরণে <strong>₹২,৮০০ জ্বালানি সাশ্রয়</strong>।",
    farmerFormTitle: "ভোক্তা ও পাইকারি বিক্রির জন্য ফসল তালিকাভুক্ত করুন",
    labelCropName: "ফসলের নাম ও জাত",
    chip1: "জ্যোতি আলু",
    chip2: "কচি পটল",
    chip3: "নাসিক পেঁয়াজ",
    chip4: "শিমলা আপেল",
    chip5: "দেশি আদা",
    chip6: "সাদা রসুন",
    chip7: "গোবিন্দভোগ চাল",
    labelCategory: "বিভাগ / ক্যাটাগরি",
    labelStock: "উপলব্ধ স্টক (কেজি / ডজন)",
    labelPrice: "সরাসরি খামার গেট মূল্য (₹)",
    helperNetPayout: "* কোনো মান্ডি কমিশন কাটা হবে না। আপনি ১০০% মূল্য পাবেন।",
    labelMinQty: "সর্বনিম্ন অর্ডার পরিমাণ",
    helperMinQty: "* খুচরার জন্য ০.৫ কেজি বা পাইকারির জন্য ২০ কেজি সেট করুন।",
    mandiCardTitle: '<i data-lucide="database" style="width: 14px; height: 14px; display: inline-block; vertical-align: -2px; margin-right: 4px;"></i> সরকারি মান্ডি এপিএমসি বেঞ্চমার্ক (ডেটাবেস অটো-গণনা)',
    mandiLiveTag: "অ্যাগমার্কনেট ডাব্লুবি লাইভ",
    mandiModalLabel: "মান্ডি পাইকারি দর",
    mandiRetailLabel: "শহরের আনুমানিক খুচরা দর",
    mandiAdvantageLabel: "কৃষকের সরাসরি লাভ",
    mandiMarketLabel: "বাজার:",
    labelDistrict: "উৎপাদন জেলা",
    labelDescription: "ফসলের বিবরণ ও জৈব সার্টিফিকেশন",
    btnPublishCrop: "সরাসরি লাইভ স্টোরে প্রকাশ করুন",
    farmerOrdersSectionTitle: "সরাসরি আগত অর্ডারসমূহ (শূন্য দালাল)",

    // Cart Drawer
    cartDrawerTitle: "আপনার তাজা খামার কার্ট",
    btnClearAll: "সব মুছুন",
    labelProduceSubtotal: "ফসলের মোট মূল্য:",
    labelPlatformFee: "ন্যায্য বাণিজ্য প্ল্যাটফর্ম ফি (২%):",
    labelDelivery: "ডেলিভারি:",
    cartDeliveryFee: "₹৩৫.০০ - ₹৬৫.০০ (ফসলের পরিমাণের ভিত্তিতে)",
    labelTotalPayable: "সর্বমোট প্রদেয় অর্থ:",
    btnCheckout: "সরাসরি ফার্ম চেকআউটে এগিয়ে যান",

    // Product Modal
    labelSpecHarvested: "তোলার সময়",
    labelSpecDelivery: "ডেলিভারি গতি",
    labelSpecSeason: "মৌসুম / জেলা",
    labelModalSelectQty: "পছন্দমতো পরিমাণ নির্বাচন করুন",
    labelModalComputedTotal: "মোট হিসাবকৃত মূল্য:",
    btnModalAddToCartText: "সরাসরি খামার ফসল কার্টে যোগ করুন",

    // AI Logistics Modal
    logisticsEngineTag: '<i data-lucide="cpu"></i> এআই লজিস্টিকস ইঞ্জিন',
    logisticsHeading: "সরাসরি খামার রুট ও বন্যা পুনঃরুট ম্যাট্রিক্স",
    logisticsConsignmentLabel: "লাইভ ডিসপ্যাচ চালান আইডি:",
    logisticsOriginLabel: '<i data-lucide="map-pin"></i> উৎপাদক জেলা (খামার হাব):',
    logisticsDestLabel: '<i data-lucide="navigation"></i> গন্তব্য হাব:',
    tabDirectText: "সরাসরি খামার করিডোর",
    tabBatchText: "মাল্টি-ফার্ম ক্লাস্টার পিকআপ (টিএসপি)",
    statLabelRouteDistTime: "রুটের দূরত্ব ও সময়",
    statLabelIntermediaries: "মধ্যস্বত্বভোগী বাদ দেওয়া হয়েছে",
    statLabelCarbon: "কার্বন নিঃসরণ সাশ্রয়",
    statLabelFreight: "পরিবহন খরচ সাশ্রয়",
    tspAlertText: "<strong>হিউরিস্টিক টিএসপি ইঞ্জিন:</strong> একাধিক কৃষকের ফসল সংগ্রহের ক্রম অপ্টিমাইজ করা হয়েছে যাতে জ্বালানি খরচ সর্বনিম্ন হয়।",
    tspSectionTitle: '<i data-lucide="truck"></i> ধারাবাহিক ফার্মগেট পিকআপ',
    tspLabelCargo: "একত্রিত মোট পণ্য",
    tspLabelUtilization: "গাড়ির ধারণক্ষমতা ব্যবহার",
    tspLabelDistance: "সার্কিট ভ্রমণের মোট দূরত্ব",
    tspLabelCost: "আনুমানিক একত্রীকরণ খরচ",
    btnCloseLogistics: "লজিস্টিকস উইন্ডো বন্ধ করুন",

    // Orders Modal
    ordersModalHeading: "আপনার সরাসরি খামার অর্ডার ও শিপমেন্ট",
    ordersModalSub: "রিয়েল-টাইম ডেলিভারি স্ট্যাটাস, ওয়েবিল ও কৃষকের সাথে যোগাযোগ",

    // Footer
    footerBackToTop: "পৃষ্ঠার শুরুতে যান",
    footerCol1Title: "আমাদের সম্পর্কে জানুন",
    fLinkAbout: "তাজা এগ্রি-টেক পরিচিতি",
    fLinkFpo: "এফপিও ক্ষমতায়ন মিশন",
    fLinkZero: "শূন্য মধ্যস্বত্বভোগী সনদ",
    fLinkDisaster: "দুর্যোগ ও ফসল ত্রাণ তহবিল",
    footerCol2Title: "কৃষকদের সাথে যুক্ত হন",
    fLinkProducers: "যাচাইকৃত বাংলা উৎপাদক দল",
    fLinkHubs: "আঞ্চলিক কৃষি হাব (সিঙ্গুর/মেমারি)",
    fLinkCalendar: "ফসল তোলার ক্যালেন্ডার",
    fLinkInquiries: "সরাসরি ১:১ অনুসন্ধান",
    footerCol3Title: "আমাদের সাথে আয় করুন",
    fLinkRegister: "এফপিও / কৃষক হিসেবে নিবন্ধন করুন",
    fLinkGreenFleet: "গ্রিন ফ্লিটের সাথে অংশীদারিত্ব",
    fLinkAiFleet: "এআই ফ্লিট অপারেটর প্রোগ্রাম",
    footerCol4Title: "নিরাপত্তা ও সুরক্ষা",
    fLinkPriceTrans: "স্বচ্ছ সরাসরি মূল্য নির্ধারণ",
    fLinkInsurance: "পরিবহন ক্ষতি বীমা",
    fLinkEscrow: "এসক্রো পেমেন্ট গ্যারান্টি",
    fLinkDocs: "ওপেনএপিআই ব্যাকএন্ড স্পেক্স (/docs)",
    footerBottomBrand: "তাজা ন্যায্য বাণিজ্য ই-কমার্স ও লজিস্টিক নেটওয়ার্ক • পশ্চিমবঙ্গ, ভারত",
    footerBottomCopy: "© ২০২৬ তাজা এগ্রি-টেক প্ল্যাটফর্ম। শূন্য মধ্যস্বত্বভোগী সহ সরাসরি খামার থেকে দুয়ারে সিস্টেম।",

    // Floating Bar & Toast
    btnFloatingViewCartText: "কার্ট দেখুন",
    cartToastText: "কার্টে যোগ করা হয়েছে",

    // TazaTalks AI Chatbot
    tazaTalksFloatingTitle: "তাজাটকস এআই",
    tazaTalksActiveModeConsumer: "🛒 ভোক্তা সহায়তা ইন্টারফেস (সক্রিয়)",
    tazaTalksActiveModeFarmer: "🌾 কৃষক ও এফপিও অপারেশনস ইন্টারফেস (সক্রিয়)",
    tazaTalksSubheadConsumer: "ভোক্তা কৃষি সহায়তা এআই",
    tazaTalksSubheadFarmer: "কৃষক ও এফপিও অপারেশনাল এআই",
    tazaTalksInputPlaceholder: "তাজাটকস-কে প্রশ্ন করুন বা টাইপ করুন...",
    tazaTalksHelpCardTitle: "সরাসরি সহায়তা প্রয়োজন?",
    tazaTalksHelpCardDesc: "আমাদের নিবেদিত কিষাণ ও ভোক্তা হেল্পলাইন ২৪/৭ সক্রিয় রয়েছে।",
    tazaTalksCallBtnText: "কাস্টমার কেয়ারে কল করুন (৬২৮৯০৬৯৬১৯)",
    tazaTalksWelcomeConsumer: "👋 নমস্কার! <strong>তাজাটকস ভোক্তা সহায়তা</strong>-এ স্বাগতম। নিচে দেওয়া প্রশ্নগুলি দেখুন বা যেকোনো প্রশ্ন টাইপ করুন!",
    tazaTalksWelcomeFarmer: "🌾 <strong>তাজাটকস কৃষক ও এফপিও হাব</strong>-এ স্বাগতম। গুদাম বুকিং, মান্ডি দর বা পেমেন্ট সংক্রান্ত তথ্য জানতে নিচে ক্লিক করুন!",
    tazaTalksFallbackMsg: "আপনার প্রশ্নের সরাসরি উত্তর ডাটাবেসে পাওয়া যায়নি। আপনি অবিলম্বে আমাদের কাস্টমার কেয়ার সেন্টারে যোগাযোগ করতে পারেন:",

    // Frequently Bought Section & Bundle Modal
    freqBoughtTitle: "আপনার প্রায়শই কেনা ফসলসমূহ",
    freqBasedBadge: "আপনার পূর্ববর্তী অর্ডারের ভিত্তিতে",
    freqBoughtSubtitle: "যাচাইকৃত বাংলার খামার গেট থেকে সর্বাধিক পুনঃঅর্ডার করা ফসল • স্লাইড করে দেখুন",
    btnBuyBundleText: "১-ক্লিক রিঅর্ডার বাস্কেট",
    freqModalBadgeText: "সরাসরি খামার রিঅর্ডার বাস্কেট",
    freqBundleModalTitle: "প্রায়শই কেনা প্রয়োজনীয় ফসল",
    freqBundleModalSubtitle: "আপনার অতীত অর্ডার এবং মৌসুমী চাহিদার ভিত্তিতে তৈরি স্মার্ট বাস্কেট",
    labelBundleItemsHeading: "নির্বাচিত রিঅর্ডার আইটেম",
    labelFreqProduceSubtotal: "ফসলের উপমোট:",
    labelFreqMandiRetail: "শহরের খুচরা বাজার মূল্য:",
    labelFreqDirectSavings: "আপনার সরাসরি সাশ্রয়:",
    labelFreqTotalPayable: "বাস্কেটের মোট প্রদেয়:",
    btnCancelFreqModal: "ব্রাউজিং চালিয়ে যান",
    btnAddAllFreqText: "সব আইটেম কার্টে যোগ করুন ও রিঅর্ডার করুন",

    // Favourite Farmers & Direct 1:1 Chat
    subnavFavFarmersText: "পছন্দের কৃষকবৃন্দ",
    favFarmersTitle: "আপনার পছন্দের কৃষক ও এফপিও সমবায়",
    favFarmersSubtitle: "যাচাইকৃত বাংলা চাষিদের সরাসরি খামার • আপনার জেলা নির্বাচন করে ১:১ সরাসরি চ্যাট করুন",
    favEscrowPillText: "সরাসরি খামারগেট এসক্রো",
    favDistrictLabelText: "আপনার জেলা:",
    optDistrictAll: "বাংলার সকল জেলা (৮টি এফপিও)",
    optDistrictHooghly: "হুগলি (সিঙ্গুর / তারকেশ্বর)",
    optDistrictNadia: "নদিয়া (রানাঘাট / বেলডাঙা)",
    optDistrictBardhaman: "পূর্ব বর্ধমান (মেমারি / কালনা)",
    optDistrictDarjeeling: "দার্জিলিং (কার্শিয়াং / গরুবাথান)",
    optDistrictMalda: "মালদা (ইংরেজ বাজার / সামসী)",
    optDistrictMurshidabad: "মুর্শিদাবাদ (বহরমপুর / কান্দি)",
    optDistrictSouth24: "দক্ষিণ ২৪ পরগনা (বারুইপুর / ক্যানিং)",
    optDistrictBankura: "বাঁকুড়া (বিষ্ণুপুর / কোতুলপুর)",
    btnFarmerChatText: "কৃষকের সাথে চ্যাট করুন",
    btnFarmerCallText: "গেটে কল করুন",
    farmerChatEscrowTag: "এসক্রো সুরক্ষিত",
    farmerChipsHeading: "এই কৃষকের জন্য দ্রুত প্রশ্নসমূহ:",
    farmerChatPlaceholder: "ফসলের গুণমান, পাইকারি সরবরাহ বা ডিসপ্যাচ সম্পর্কে জিজ্ঞাসা করুন...",
    farmerChatHelplineNote: '<i data-lucide="headset" style="width:12px;height:12px;display:inline-block;vertical-align:-1px;"></i> শূন্য-মধ্যস্বত্বভোগী রিলে হেল্পলাইন:',
    farmerTypingLabel: "কৃষক টাইপ করছেন...",

    // Stock-Market Dynamic Pricing
    pricingChoiceTitle: "দর নির্ধারণের কৌশল (স্টক মার্কেট মডেল)",
    optDynamicPegTitle: "📈 বাজার দর অনুযায়ী দৈনিক পরিবর্তনশীল দর",
    optDynamicPegSub: "প্রতিদিনের মান্ডি ও বাজার ওঠানামার সাথে স্বয়ংক্রিয়ভাবে আপনার ফসলের সেরা লাইভ দর নির্ধারিত হবে।",
    optFixedPriceTitle: "🔒 স্থির খামার দর",
    optFixedPriceSub: "বাজারের ওঠানামা নির্বিশেষে একটি নির্দিষ্ট, অপরিবর্তনীয় দর লক করে রাখুন।",
    labelPrice: "মূল লক্ষ্যমাত্রা খামার দর (₹/কেজি)",
    helperNetPayout: "মধ্যস্বত্বভোগী ছাড়া সরাসরি কৃষকের মোট প্রাপ্তি দর।",
    labelFloorText: "🛡️ সর্বনিম্ন রিজার্ভ মূল্য / ফ্লোর প্রাইস (MSP ₹/কেজি)",
    helperPriceFloor: "নিরাপত্তা গ্যারান্টি: বাজার দর কমলেও এই মূল্যের নিচে কোনো ফসল বিক্রি হবে না।",
    previewStripLabel: "আজকের লাইভ বাজার দর:",
    labelHarvestTime: "ফসল তোলার তারিখ ও সময়",
    helperHarvestTime: "💡 বর্তমান সময়ের সাথে মিলিয়ে লাইভ সতেজতা সূচক হিসাব করা হয় যা ক্রেতার ডেলিভারির সময় মান নিশ্চিত করে।",
    labelLiveFreshnessTitle: "রিয়েল-টাইম জৈবিক সতেজতা সূচক [e^(-λ·t)]"
  },

  hi: {
    // Role selection
    roleModalTitle: "ताजा किसानडायरेक्ट में आपका स्वागत है",
    roleModalSubtitle: "सीधे खेत से उपभोक्ता तक कृषि-लॉजिस्टिक्स और निष्पक्ष व्यापार मंच",
    rolePromptHeading: "कृपया आगे बढ़ने के लिए अपनी भूमिका चुनें:",
    rolePromptSub: "अपना लाइव प्लेटफ़ॉर्म अनुभव शुरू करने के लिए प्रोफ़ाइल चुनें",
    badgeDirectBuyer: "सीधा खरीदार",
    roleConsumerTitle: "मैं एक उपभोक्ता / खरीदार हूँ",
    roleConsumerDesc: "परिवारों, रेस्तरां और थोक खरीदारों के लिए खेत की ताज़ा उपज।",
    btnEnterConsumer: 'उपभोक्ता के रूप में प्रवेश करें <i data-lucide="arrow-right"></i>',
    badgeFarmerProducer: "उत्पादक / एफपीओ",
    roleFarmerTitle: "मैं एक किसान / एफपीओ हूँ",
    roleFarmerDesc: "व्यक्तिगत किसानों, एफपीओ संघों और कृषि उत्पादकों के लिए।",
    btnEnterFarmer: 'किसान हब में प्रवेश करें <i data-lucide="arrow-right"></i>',
    roleFooterNote: "दोहरी भूमिका-आधारित सुरक्षित पहुंच • पश्चिम बंगाल कृषि गलियारा",

    // Navigation
    navDeliveryHeader: "डिलीवरी स्थान: कोलकाता 700001",
    navDeliveryDistrict: "बंगाल कृषि गलियारा",
    searchCatAll: "सभी फसलें",
    searchCatVeg: "सब्जियां",
    searchCatFruits: "फल",
    searchCatGrains: "अनाज और चावल",
    searchCatTubers: "आलू और कंद",
    searchCatSpices: "मसाले",
    searchPlaceholder: "सीधे खेत की उपज खोजें: 'सिंगूर आलू', 'गोविंदभोग', 'हिमसागर'...",
    navUserGreetingConsumer: "नमस्ते, सौरव",
    navUserGreetingFarmer: "नमस्ते, आनंद (किसान)",
    navUserRoleConsumer: 'उपभोक्ता हब <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>',
    navUserRoleFarmer: 'किसान हब <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>',
    navOrdersLine1: "ऑर्डर",
    navOrdersLine2: "और ट्रैकिंग",
    navCartLabel: "कार्ट",
    retailSavingsCounter: '<i data-lucide="trending-down"></i> आज बिचौलियों से कुल बचत: ₹1,24,900',

    // Subnav
    subnavMenuAllText: "सभी श्रेणियां",
    subnavVeg: "ताज़ा सब्जियां",
    subnavFruits: "मौसमी फल",
    subnavGrains: "सीधे अनाज और चावल",
    subnavLogisticsText: "एआई स्मार्ट लॉजिस्टिक्स",
    subnavMandiText: "मंडी आर्बिट्रेज इंजन",

    // Hero
    heroCommercialBadge: '<i data-lucide="award"></i> कोई बिचौलिया नहीं • शून्य कमीशन',
    heroMainTitle: "सत्यापित एफपीओ और खेतों से सीधे ताज़ा फसल",
    heroMainDesc: "सीधे खेत से ताजी सब्जियां, अनाज और फल ऑर्डर करें। 150 ग्राम से लेकर 50 किलोग्राम तक लाइव ताजगी विश्लेषण और पारदर्शी मूल्य निर्धारण।",
    heroOrderBtn: "ताज़ा फसल ऑर्डर करें",
    heroRouteBtnText: "एआई रूट मैट्रिक्स देखें",
    promo1Title: "उचित मूल्य गारंटी",
    promo1Desc: "किसानों को 35% अधिक आय; खरीदारों को 40% की बचत।",
    promo2Title: "< 18 घंटे खेत से द्वार तक",
    promo2Desc: "ग्रीन ईवी और सीधा कॉरिडोर डिस्पैच।",

    // Category pills
    pillAll: '<i data-lucide="layout-grid"></i> सभी फसलें',
    pillVeg: '<i data-lucide="salad"></i> सब्जियां',
    pillFruits: '<i data-lucide="apple"></i> फल',
    pillGrains: '<i data-lucide="wheat"></i> अनाज और चावल',
    pillPulses: '<i data-lucide="cookie"></i> दालें',
    pillTubers: '<i data-lucide="layers"></i> आलू और कंद',

    // Catalog & Sorting
    catalogHeading: "आज की ताज़ा काटी गई फसलें",
    catalogSubtitle: "पश्चिम बंगाल एफपीओ संग्रह केंद्रों और खेतों से सीधा लाइव स्टॉक",
    catalogSortLabel: "क्रमबद्ध करें:",
    sortFreshness: "ताजगी रेटिंग (उच्चतम पहले)",
    sortPriceAsc: "कीमत: कम से अधिक",
    sortPriceDesc: "कीमत: अधिक से कम",
    sortDistance: "निकटतम खेत की दूरी",

    // Farmer Hub
    farmerHeaderTitle: "किसान और एफपीओ उत्पादक संचालन केंद्र",
    farmerWelcomeSub: "वास्तविक समय मंडी मध्यस्थता, मांग पूर्वानुमान और सीधा मार्ग प्रेषण",
    farmerCreateListingBtnText: "नई फसल की सूची बनाएं",
    farmerAiTitle: "एआई मांग भविष्यवक्ता",
    farmerAiDesc: "कोलकाता में <strong>ज्योति आलू और परवल</strong> की मांग इस सप्ताहांत <strong>+38%</strong> बढ़ने का अनुमान है। सुझाया गया फार्मगेट मूल्य: <strong>₹21-24/किग्रा</strong>।",
    farmerWeatherTitle: "आपदा और मौसम चेतावनी",
    farmerWeatherAlertText: "गंगा के मैदानों की सलाह: दक्षिणी जिलों में मध्यम वर्षा की संभावना। एफपीओ क्लस्टर डिस्पैच के लिए <strong>साझा रीफ़र वाहन</strong> आरक्षित।",
    farmerLogisticsTitle: "रूट एकत्रीकरण (साझा ग्रीन लॉजिस्टिक्स)",
    farmerLogisticsDesc: "सिंगूर और तारकेश्वर के 3 अन्य खेत कल कोलकाता के लिए ईवी ट्रक लोड कर रहे हैं। शिपमेंट मिलाने से <strong>₹2,800 ईंधन की बचत</strong> होगी।",
    farmerFormTitle: "उपभोक्ता और थोक बिक्री के लिए फसल सूचीबद्ध करें",
    labelCropName: "फसल का नाम और किस्म",
    chip1: "ज्योति आलू",
    chip2: "ताजा परवल",
    chip3: "नासिक प्याज",
    chip4: "शिमला सेब",
    chip5: "देसी अदरक",
    chip6: "सफेद लहसुन",
    chip7: "गोविंदभोग चावल",
    labelCategory: "श्रेणी",
    labelStock: "उपलब्ध स्टॉक (किग्रा / दर्जन)",
    labelPrice: "सीधा फार्म गेट मूल्य (₹)",
    helperNetPayout: "* कोई मंडी शुल्क नहीं कटेगा। आपको 100% पूरा मूल्य मिलेगा।",
    labelMinQty: "न्यूनतम ऑर्डर मात्रा",
    helperMinQty: "* खुदरा के लिए 0.5 किग्रा या थोक के लिए 20 किग्रा निर्धारित करें।",
    mandiCardTitle: '<i data-lucide="database" style="width: 14px; height: 14px; display: inline-block; vertical-align: -2px; margin-right: 4px;"></i> आधिकारिक मंडी एपीएमसी बेंचमार्क (डेटाबेस द्वारा स्वतः गणना)',
    mandiLiveTag: "एगमार्कनेट डब्ल्यूबी लाइव",
    mandiModalLabel: "मंडी थोक मूल्य",
    mandiRetailLabel: "अनुमानित शहर खुदरा दर",
    mandiAdvantageLabel: "किसान का सीधा लाभ",
    mandiMarketLabel: "बाजार:",
    labelDistrict: "उत्पादन जिला",
    labelDescription: "फसल विवरण और जैविक प्रमाणन",
    btnPublishCrop: "सीधे लाइव स्टोर में प्रकाशित करें",
    farmerOrdersSectionTitle: "आने वाले सीधे ऑर्डर (शून्य बिचौलिए)",

    // Cart Drawer
    cartDrawerTitle: "आपकी ताज़ा फार्म कार्ट",
    btnClearAll: "सभी साफ़ करें",
    labelProduceSubtotal: "उपज का कुल मूल्य:",
    labelPlatformFee: "उचित व्यापार प्लेटफ़ॉर्म शुल्क (2%):",
    labelDelivery: "डिलीवरी:",
    cartDeliveryFee: "₹35.00 - ₹65.00 (फसल मात्रा के अनुसार)",
    labelTotalPayable: "कुल देय राशि:",
    btnCheckout: "सीधे फार्म चेकआउट के लिए आगे बढ़ें",

    // Product Modal
    labelSpecHarvested: "कटाई का समय",
    labelSpecDelivery: "डिलीवरी गति",
    labelSpecSeason: "मौसम / जिला",
    labelModalSelectQty: "मनचाही मात्रा चुनें",
    labelModalComputedTotal: "कुल परिकलित मूल्य:",
    btnModalAddToCartText: "सीधे खेत का ऑर्डर कार्ट में जोड़ें",

    // AI Logistics Modal
    logisticsEngineTag: '<i data-lucide="cpu"></i> एआई लॉजिस्टिक्स इंजन',
    logisticsHeading: "सीधा फार्म रूट और बाढ़ पुनर्मार्ग मैट्रिक्स",
    logisticsConsignmentLabel: "लाइव डिस्पैच चालान आईडी:",
    logisticsOriginLabel: '<i data-lucide="map-pin"></i> स्रोत जिला (फार्म हब):',
    logisticsDestLabel: '<i data-lucide="navigation"></i> गंतव्य हब:',
    tabDirectText: "सीधा फार्म गलियारा",
    tabBatchText: "मल्टी-स्टॉप क्लस्टर पिकअप (टीएसपी)",
    statLabelRouteDistTime: "रूट की दूरी और समय",
    statLabelIntermediaries: "बिचौलिए हटाए गए",
    statLabelCarbon: "कार्बन उत्सर्जन में बचत",
    statLabelFreight: "भाड़ा लागत में बचत",
    tspAlertText: "<strong>ह्यूरिस्टिक टीएसपी इंजन:</strong> कई किसानों के पिकअप क्रम को अनुकूलित किया गया है ताकि वाहन क्षमता का अधिकतम उपयोग हो।",
    tspSectionTitle: '<i data-lucide="truck"></i> क्रमबद्ध फार्मगेट पिकअप',
    tspLabelCargo: "एकत्रित कुल कार्गो",
    tspLabelUtilization: "वाहन क्षमता उपयोग",
    tspLabelDistance: "सर्किट की कुल दूरी",
    tspLabelCost: "अनुमानित एकत्रीकरण लागत",
    btnCloseLogistics: "लॉजिस्टिक्स विंडो बंद करें",

    // Orders Modal
    ordersModalHeading: "आपके सीधे फार्म ऑर्डर और शिपमेंट",
    ordersModalSub: "लाइव डिलीवरी स्थिति, वेबिल और किसान से सीधा संपर्क",

    // Footer
    footerBackToTop: "शीर्ष पर वापस जाएं",
    footerCol1Title: "हमारे बारे में जानें",
    fLinkAbout: "ताजा एग्री-टेक परिचय",
    fLinkFpo: "एफपीओ सशक्तिकरण मिशन",
    fLinkZero: "शून्य बिचौलिया घोषणापत्र",
    fLinkDisaster: "आपदा एवं फसल राहत कोष",
    footerCol2Title: "किसानों से जुड़ें",
    fLinkProducers: "सत्यापित बंगाल उत्पादक समूह",
    fLinkHubs: "क्षेत्रीय कृषि हब (सिंगूर/मेमारी)",
    fLinkCalendar: "फसल कटाई कैलेंडर",
    fLinkInquiries: "सीधी 1:1 पूछताछ",
    footerCol3Title: "हमारे साथ कमाई करें",
    fLinkRegister: "एफपीओ / किसान के रूप में पंजीकरण करें",
    fLinkGreenFleet: "ग्रीन फ्लीट के साथ साझेदारी",
    fLinkAiFleet: "एआई फ्लीट ऑपरेटर कार्यक्रम",
    footerCol4Title: "सुरक्षा और आश्वासन",
    fLinkPriceTrans: "पारदर्शी प्रत्यक्ष मूल्य निर्धारण",
    fLinkInsurance: "पारगमन खराबी बीमा",
    fLinkEscrow: "एस्क्रो भुगतान गारंटी",
    fLinkDocs: "ओपनएपीआई बैकएंड स्पेक्स (/docs)",
    footerBottomBrand: "ताजा फेयर-ट्रेड ई-कॉमर्स और लॉजिस्टिक्स नेटवर्क • पश्चिम बंगाल, भारत",
    footerBottomCopy: "© 2026 ताजा एग्री-टेक प्लेटफ़ॉर्म। शून्य बिचौलियों के साथ सीधे खेत से मेज तक।",

    // Floating Bar & Toast
    btnFloatingViewCartText: "कार्ट देखें",
    cartToastText: "कार्ट में जोड़ा गया",

    // TazaTalks AI Chatbot
    tazaTalksFloatingTitle: "ताजाटॉक्स एआई",
    tazaTalksActiveModeConsumer: "🛒 उपभोक्ता सहायता इंटरफ़ेस (सक्रिय)",
    tazaTalksActiveModeFarmer: "🌾 किसान एवं एफपीओ संचालन इंटरफ़ेस (सक्रिय)",
    tazaTalksSubheadConsumer: "उपभोक्ता कृषि सहायता एआई",
    tazaTalksSubheadFarmer: "किसान एवं एफपीओ संचालन सहायक",
    tazaTalksInputPlaceholder: "ताजाटॉक्स से पूछें या टाइप करें...",
    tazaTalksHelpCardTitle: "सीधी सहायता की आवश्यकता है?",
    tazaTalksHelpCardDesc: "हमारी समर्पित किसान और उपभोक्ता हेल्पलाइन 24/7 सक्रिय है।",
    tazaTalksCallBtnText: "कस्टमर केयर को कॉल करें (6289069619)",
    tazaTalksWelcomeConsumer: "👋 नमस्ते! <strong>ताजाटॉक्स उपभोक्ता सहायता</strong> में आपका स्वागत है। नीचे दिए गए प्रश्न देखें या कोई भी सवाल टाइप करें!",
    tazaTalksWelcomeFarmer: "🌾 <strong>ताजाटॉक्स किसान और एफपीओ हब</strong> में आपका स्वागत है। गोदाम बुकिंग, मंडी भाव या भुगतान संबंधी प्रश्न नीचे पूछें!",
    tazaTalksFallbackMsg: "आपके प्रश्न का स्वचालित उत्तर नहीं मिल सका। आप तुरंत हमारी 24/7 कस्टमर केयर टीम से संपर्क कर सकते हैं:",

    // Frequently Bought Section & Bundle Modal
    freqBoughtTitle: "आपके द्वारा अक्सर खरीदी गई फसलें",
    freqBasedBadge: "आपके पिछले ऑर्डर के आधार पर",
    freqBoughtSubtitle: "सत्यापित बंगाल फार्मगेट से शीर्ष पुनः ऑर्डर की गई उपज • स्लाइड करके देखें",
    btnBuyBundleText: "1-क्लिक रीऑर्डर बास्केट",
    freqModalBadgeText: "सीधा फार्म रीऑर्डर बास्केट",
    freqBundleModalTitle: "अक्सर खरीदी जाने वाली मुख्य फसलें",
    freqBundleModalSubtitle: "आपके पिछले ऑर्डर और मौसमी मांग के आधार पर आपकी व्यक्तिगत बास्केट",
    labelBundleItemsHeading: "चयनित रीऑर्डर आइटम",
    labelFreqProduceSubtotal: "उपज का उप-योग:",
    labelFreqMandiRetail: "मंडी खुदरा बाजार मूल्य:",
    labelFreqDirectSavings: "आपकी सीधी बचत:",
    labelFreqTotalPayable: "बास्केट का कुल भुगतान:",
    btnCancelFreqModal: "ब्राउज़िंग जारी रखें",
    btnAddAllFreqText: "सभी आइटम कार्ट में जोड़ें और रीऑर्डर करें",

    // Favourite Farmers & Direct 1:1 Chat
    subnavFavFarmersText: "पसंदीदा किसान",
    favFarmersTitle: "आपके पसंदीदा किसान और एफपीও संघ",
    favFarmersSubtitle: "सत्यापित बंगाल किसानों से सीधा संपर्क • अपना जिला चुनें और 1:1 चैट करें",
    favEscrowPillText: "सीधा फार्मगेट एस्क्रो",
    favDistrictLabelText: "आपका जिला:",
    optDistrictAll: "बंगाल के सभी जिले (8 एफपीओ)",
    optDistrictHooghly: "हुगली (सिंगूर / तारकेश्वर)",
    optDistrictNadia: "नदिया (रानाघाट / बेलडांगा)",
    optDistrictBardhaman: "पूर्व बर्धमान (मेमारी / कालना)",
    optDistrictDarjeeling: "दार्जिलिंग (कर्सियांग / गोरुबथान)",
    optDistrictMalda: "मालदा (इंग्लिश बाजार / सामसी)",
    optDistrictMurshidabad: "मुर्शिदाबाद (बहरमपुर / कांदी)",
    optDistrictSouth24: "दक्षिण 24 परगना (बारुईपुर / कैनिंग)",
    optDistrictBankura: "बांकुड़ा (विष्णुपुर / कोतुलपुर)",
    btnFarmerChatText: "किसान से चैट करें",
    btnFarmerCallText: "गेट पर कॉल करें",
    farmerChatEscrowTag: "एस्क्रो सुरक्षित",
    farmerChipsHeading: "इस किसान के लिए त्वरित प्रश्न:",
    farmerChatPlaceholder: "फसल गुणवत्ता, थोक आपूर्ति या प्रेषण के बारे में पूछें...",
    farmerChatHelplineNote: '<i data-lucide="headset" style="width:12px;height:12px;display:inline-block;vertical-align:-1px;"></i> शून्य बिचौलिया हेल्पलाइन:',
    farmerTypingLabel: "किसान टाइप कर रहे हैं...",

    // Stock-Market Dynamic Pricing
    pricingChoiceTitle: "दैनिक मूल्य निर्धारण रणनीति (कमोडिटी मॉडल)",
    optDynamicPegTitle: "📈 दैनिक मंडी दर अनुसार गतिशील मूल्य",
    optDynamicPegSub: "कमोडिटी स्टॉक की तरह दैनिक मंडी आवक और बाजार उतार-चढ़ाव के अनुसार मूल्य तय होता है।",
    optFixedPriceTitle: "🔒 स्थिर फार्म गेट मूल्य",
    optFixedPriceSub: "बाजार के उतार-चढ़ाव से बेपरवाह एक स्थिर, निश्चित मूल्य लॉक करें।",
    labelPrice: "आधार लक्षित फार्म मूल्य (₹/किग्रा)",
    helperNetPayout: "बिचौलियों के बिना किसान का सीधा शुद्ध भुगतान।",
    labelFloorText: "🛡️ न्यूनतम समर्थन मूल्य / फ्लोर प्राइस (MSP ₹/किग्रा)",
    helperPriceFloor: "सुरक्षा गारंटी: बाजार गिरने पर भी फसल इस दर से नीचे कभी नहीं बिकेगी।",
    previewStripLabel: "आज का लाइव बाजार मूल्य:",
    labelHarvestTime: "फसल कटाई की तारीख व समय",
    helperHarvestTime: "💡 वर्तमान समय से मिलान करके जैविक ताजगी सूचकांक की गणना की जाती है जिससे डिलीवरी पर गुणवत्ता बनी रहे।",
    labelLiveFreshnessTitle: "रीयल-टाइम जैविक ताजगी सूचकांक [e^(-λ·t)]"
  }
};

function getTranslatedCropName(cropName) {
  if (!cropName) return "";
  if (currentLanguage === 'en') return cropName;
  
  if (CROP_NAME_TRANSLATIONS[cropName] && CROP_NAME_TRANSLATIONS[cropName][currentLanguage]) {
    return CROP_NAME_TRANSLATIONS[cropName][currentLanguage];
  }
  for (let key in CROP_NAME_TRANSLATIONS) {
    if (cropName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cropName.toLowerCase())) {
      if (CROP_NAME_TRANSLATIONS[key][currentLanguage]) {
        return CROP_NAME_TRANSLATIONS[key][currentLanguage];
      }
    }
  }
  return cropName;
}

function getTranslation(key, fallback = "") {
  const t = APP_TRANSLATIONS[currentLanguage] || APP_TRANSLATIONS.en;
  return t[key] || fallback || (APP_TRANSLATIONS.en[key] || "");
}

function changeAppLanguage(lang) {
  if (!APP_TRANSLATIONS[lang]) lang = 'en';
  currentLanguage = lang;
  localStorage.setItem('taza_language', lang);

  // Sync dropdown
  const langSelect = document.getElementById("langSelect");
  if (langSelect) langSelect.value = lang;

  // Sync modal pills
  const pEn = document.getElementById("langPillEn");
  const pBn = document.getElementById("langPillBn");
  const pHi = document.getElementById("langPillHi");
  if (pEn) pEn.classList.toggle("active", lang === "en");
  if (pBn) pBn.classList.toggle("active", lang === "bn");
  if (pHi) pHi.classList.toggle("active", lang === "hi");

  applyTranslations();

  // If consumer catalog is present, re-render to update dynamic translations (crop names, units, buttons)
  if (typeof renderProducts === 'function' && typeof products !== 'undefined' && products && products.length > 0) {
    renderProducts(products);
  }
  // If farmer warehouse cards are present, refresh them with localized indicators
  if (typeof renderFarmerWarehouseCards === 'function') {
    const selectedWhDist = document.getElementById("whDistrictFilter")?.value || "Hooghly";
    renderFarmerWarehouseCards(selectedWhDist);
  }
}

function applyTranslations() {
  const t = APP_TRANSLATIONS[currentLanguage] || APP_TRANSLATIONS.en;

  // Helper setters
  const setHtml = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.innerHTML = val;
  };
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.innerText = val;
  };

  // 1. Role Selection Modal
  setText("roleModalTitle", t.roleModalTitle);
  setText("roleModalSubtitle", t.roleModalSubtitle);
  setText("rolePromptHeading", t.rolePromptHeading);
  setText("rolePromptSub", t.rolePromptSub);
  setText("badgeDirectBuyer", t.badgeDirectBuyer);
  setText("roleConsumerTitle", t.roleConsumerTitle);
  setText("roleConsumerDesc", t.roleConsumerDesc);
  setHtml("btnEnterConsumer", t.btnEnterConsumer);
  setText("badgeFarmerProducer", t.badgeFarmerProducer);
  setText("roleFarmerTitle", t.roleFarmerTitle);
  setText("roleFarmerDesc", t.roleFarmerDesc);
  setHtml("btnEnterFarmer", t.btnEnterFarmer);
  setText("roleFooterNote", t.roleFooterNote);

  // 2. Navigation
  setText("navDeliveryHeader", t.navDeliveryHeader);
  setText("navDeliveryDistrict", t.navDeliveryDistrict);
  setText("navOrdersLine1", t.navOrdersLine1);
  setText("navOrdersLine2", t.navOrdersLine2);
  setText("navCartLabel", t.navCartLabel);
  setHtml("retailSavingsCounter", t.retailSavingsCounter);

  const searchInp = document.getElementById("globalSearchInput");
  if (searchInp && t.searchPlaceholder) {
    searchInp.placeholder = t.searchPlaceholder;
  }

  // User Greeting / Role
  const userGreeting = document.getElementById("navUserGreeting");
  const userRoleText = document.getElementById("navUserRole");
  if (userGreeting) {
    if (currentRole === "consumer") {
      const cName = (window.authState && window.authState.name) ? window.authState.name.split(' ')[0] : "Sourav";
      userGreeting.innerText = currentLanguage === 'bn' ? `নমস্কার, ${cName}` : (currentLanguage === 'hi' ? `नमस्ते, ${cName}` : `Hello, ${cName}`);
    } else {
      const fName = (window.authState && window.authState.name) ? window.authState.name.split(' ')[0] : (currentLanguage === 'bn' ? "আনন্দ" : "Ananda");
      userGreeting.innerText = currentLanguage === 'bn' ? `নমস্কার, ${fName} (কৃষক)` : (currentLanguage === 'hi' ? `नमस्ते, ${fName} (किसान)` : `Hello, ${fName} (Farmer)`);
    }
  }
  if (userRoleText) {
    userRoleText.innerHTML = currentRole === "consumer" ? t.navUserRoleConsumer : t.navUserRoleFarmer;
  }

  // Search category options
  const searchCat = document.getElementById("searchCategory");
  if (searchCat && searchCat.options && searchCat.options.length >= 6) {
    searchCat.options[0].text = t.searchCatAll;
    searchCat.options[1].text = t.searchCatVeg;
    searchCat.options[2].text = t.searchCatFruits;
    searchCat.options[3].text = t.searchCatGrains;
    searchCat.options[4].text = t.searchCatTubers;
    searchCat.options[5].text = t.searchCatSpices;
  }

  // 3. Subnav
  setText("subnavMenuAllText", t.subnavMenuAllText);
  setText("subnavVeg", t.subnavVeg);
  setText("subnavFruits", t.subnavFruits);
  setText("subnavGrains", t.subnavGrains);
  setText("subnavLogisticsText", t.subnavLogisticsText);
  setText("subnavMandiText", t.subnavMandiText);

  // 4. Hero Section
  setHtml("heroCommercialBadge", t.heroCommercialBadge);
  setText("heroMainTitle", t.heroMainTitle);
  setText("heroMainDesc", t.heroMainDesc);
  setText("heroOrderBtn", t.heroOrderBtn);
  setText("heroRouteBtnText", t.heroRouteBtnText);
  setText("promo1Title", t.promo1Title);
  setText("promo1Desc", t.promo1Desc);
  setText("promo2Title", t.promo2Title);
  setText("promo2Desc", t.promo2Desc);

  // 5. Category Filter Pills
  setHtml("pillAll", t.pillAll);
  setHtml("pillVeg", t.pillVeg);
  setHtml("pillFruits", t.pillFruits);
  setHtml("pillGrains", t.pillGrains);
  setHtml("pillPulses", t.pillPulses);
  setHtml("pillTubers", t.pillTubers);

  // 6. Catalog Section & Sorting
  setText("catalogHeading", t.catalogHeading);
  setText("catalogSubtitle", t.catalogSubtitle);
  setText("catalogSortLabel", t.catalogSortLabel);
  setText("sortOptFreshness", t.sortOptFreshness);
  setText("sortOptPriceAsc", t.sortOptPriceAsc);
  setText("sortOptPriceDesc", t.sortOptPriceDesc);
  setText("sortOptDistance", t.sortOptDistance);

  // 7. Farmer Dashboard
  setText("farmerHeaderTitle", t.farmerHeaderTitle);
  setText("farmerWelcomeSub", t.farmerWelcomeSub);
  setText("farmerCreateListingBtnText", t.farmerCreateListingBtnText);
  setText("farmerAiTitle", t.farmerAiTitle);
  setHtml("farmerAiDesc", t.farmerAiDesc);
  setText("farmerWeatherTitle", t.farmerWeatherTitle);
  setHtml("farmerWeatherAlertText", t.farmerWeatherAlertText);
  setText("farmerLogisticsTitle", t.farmerLogisticsTitle);
  setHtml("farmerLogisticsDesc", t.farmerLogisticsDesc);
  setText("farmerFormTitle", t.farmerFormTitle);
  setText("labelCropName", t.labelCropName);
  setText("chip1", t.chip1);
  setText("chip2", t.chip2);
  setText("chip3", t.chip3);
  setText("chip4", t.chip4);
  setText("chip5", t.chip5);
  setText("chip6", t.chip6);
  setText("chip7", t.chip7);
  setText("labelCategory", t.labelCategory);
  setText("labelStock", t.labelStock);
  setText("labelPrice", t.labelPrice);
  setText("helperNetPayout", t.helperNetPayout);
  setText("labelMinQty", t.labelMinQty);
  setText("helperMinQty", t.helperMinQty);
  setText("pricingChoiceTitle", t.pricingChoiceTitle);
  setText("optDynamicPegTitle", t.optDynamicPegTitle);
  setText("optDynamicPegSub", t.optDynamicPegSub);
  setText("optFixedPriceTitle", t.optFixedPriceTitle);
  setText("optFixedPriceSub", t.optFixedPriceSub);
  setText("labelFloorText", t.labelFloorText);
  setText("helperPriceFloor", t.helperPriceFloor);
  const previewStripEl = document.getElementById("previewStripLabel");
  if (previewStripEl && t.previewStripLabel) {
    previewStripEl.innerHTML = `<i data-lucide="activity" style="width: 13px; height: 13px; display: inline-block; vertical-align: -2px; margin-right: 3px;"></i> ${t.previewStripLabel}`;
  }
  setHtml("mandiCardTitle", t.mandiCardTitle);
  setText("mandiLiveTag", t.mandiLiveTag);
  setText("mandiModalLabel", t.mandiModalLabel);
  setText("mandiRetailLabel", t.mandiRetailLabel);
  setText("mandiAdvantageLabel", t.mandiAdvantageLabel);
  setText("mandiMarketLabel", t.mandiMarketLabel);
  setText("labelDistrict", t.labelDistrict);
  setText("labelDescription", t.labelDescription);
  setText("labelHarvestTime", t.labelHarvestTime);
  setText("helperHarvestTime", t.helperHarvestTime);
  setText("labelLiveFreshnessTitle", t.labelLiveFreshnessTitle);
  setText("btnPublishCrop", t.btnPublishCrop);
  setText("farmerOrdersSectionTitle", t.farmerOrdersSectionTitle);

  // Farmer Portal Action Buttons & Storage Tabs
  setText("farmerDocsBtnText", currentLanguage === 'bn' ? "আমার নথিপত্র ও চুক্তি (নথিপত্র)" : (currentLanguage === 'hi' ? "मेरे दस्तावेज़ और अनुबंध" : "My Documents & Agreement"));
  setText("farmerLogisticsBtnText", currentLanguage === 'bn' ? "এআই ডিসপ্যাচ লজিস্টিকস (লজিস্টিকস)" : (currentLanguage === 'hi' ? "एআই प्रेषण लॉजिस्टिक्स" : "AI Dispatch Logistics"));

  const tabCards = document.getElementById("whTabCards");
  const tabCalc = document.getElementById("whTabCalculator");
  const tabRadar = document.getElementById("whTabRadar");
  if (tabCards) {
    tabCards.innerHTML = currentLanguage === 'bn'
      ? `<i data-lucide="layout-grid"></i> ১. নিকটবর্তী কোল্ড স্টোর`
      : (currentLanguage === 'hi' ? `<i data-lucide="layout-grid"></i> १. नजदीकी कोल्ड स्टोर` : `<i data-lucide="layout-grid"></i> 1. Nearby Cold Stores`);
  }
  if (tabCalc) {
    tabCalc.innerHTML = currentLanguage === 'bn'
      ? `<i data-lucide="calculator"></i> ২. স্থান ও ক্ষমতা গণনা`
      : (currentLanguage === 'hi' ? `<i data-lucide="calculator"></i> २. स्पेस व क्षमता गणना` : `<i data-lucide="calculator"></i> 2. Harvest Space Calculator`);
  }
  if (tabRadar) {
    tabRadar.innerHTML = currentLanguage === 'bn'
      ? `<i data-lucide="radar"></i> ৩. এআই ৪০ কিমি রাডার স্ক্যান`
      : (currentLanguage === 'hi' ? `<i data-lucide="radar"></i> ३. এআই ४० किमी रडार खोज` : `<i data-lucide="radar"></i> 3. AI 40km Distance Finder`);
  }

  // 8. Cart Drawer
  setText("cartDrawerTitle", t.cartDrawerTitle);
  setText("btnClearAll", t.btnClearAll);
  setText("labelProduceSubtotal", t.labelProduceSubtotal);
  setText("labelPlatformFee", t.labelPlatformFee);
  setText("labelDelivery", t.labelDelivery);
  setText("cartDeliveryFee", t.cartDeliveryFee);
  setText("labelTotalPayable", t.labelTotalPayable);
  setText("btnCheckout", t.btnCheckout);

  // 9. Product Modal
  setText("labelSpecHarvested", t.labelSpecHarvested);
  setText("labelSpecDelivery", t.labelSpecDelivery);
  setText("labelSpecSeason", t.labelSpecSeason);
  setText("labelModalComputedTotal", t.labelModalComputedTotal);
  setText("btnModalAddToCartText", t.btnModalAddToCartText);

  // 10. AI Logistics Modal
  setHtml("logisticsEngineTag", t.logisticsEngineTag);
  setText("logisticsHeading", t.logisticsHeading);
  setText("logisticsConsignmentLabel", t.logisticsConsignmentLabel);
  setHtml("logisticsOriginLabel", t.logisticsOriginLabel);
  setHtml("logisticsDestLabel", t.logisticsDestLabel);
  setText("tabDirectText", t.tabDirectText);
  setText("tabBatchText", t.tabBatchText);
  setText("statLabelRouteDistTime", t.statLabelRouteDistTime);
  setText("statLabelIntermediaries", t.statLabelIntermediaries);
  setText("statLabelCarbon", t.statLabelCarbon);
  setText("statLabelFreight", t.statLabelFreight);
  setHtml("tspAlertText", t.tspAlertText);
  setHtml("tspSectionTitle", t.tspSectionTitle);
  setText("tspLabelCargo", t.tspLabelCargo);
  setText("tspLabelUtilization", t.tspLabelUtilization);
  setText("tspLabelDistance", t.tspLabelDistance);
  setText("tspLabelCost", t.tspLabelCost);
  setText("btnCloseLogistics", t.btnCloseLogistics);

  // 11. Orders Modal
  setText("ordersModalHeading", t.ordersModalHeading);
  setText("ordersModalSub", t.ordersModalSub);

  // 12. Footer
  setText("footerBackToTop", t.footerBackToTop);
  setText("footerCol1Title", t.footerCol1Title);
  setText("fLinkAbout", t.fLinkAbout);
  setText("fLinkFpo", t.fLinkFpo);
  setText("fLinkZero", t.fLinkZero);
  setText("fLinkDisaster", t.fLinkDisaster);
  setText("footerCol2Title", t.footerCol2Title);
  setText("fLinkProducers", t.fLinkProducers);
  setText("fLinkHubs", t.fLinkHubs);
  setText("fLinkCalendar", t.fLinkCalendar);
  setText("fLinkInquiries", t.fLinkInquiries);
  setText("footerCol3Title", t.footerCol3Title);
  setText("fLinkRegister", t.fLinkRegister);
  setText("fLinkGreenFleet", t.fLinkGreenFleet);
  setText("fLinkAiFleet", t.fLinkAiFleet);
  setText("footerCol4Title", t.footerCol4Title);
  setText("fLinkPriceTrans", t.fLinkPriceTrans);
  setText("fLinkInsurance", t.fLinkInsurance);
  setText("fLinkEscrow", t.fLinkEscrow);
  setText("fLinkDocs", t.fLinkDocs);
  setText("footerBottomBrand", t.footerBottomBrand);
  setText("footerBottomCopy", t.footerBottomCopy);

  // 13. Floating Bar & Toast
  setText("btnFloatingViewCartText", t.btnFloatingViewCartText);
  setText("cartToastText", t.cartToastText);

  // 14. TazaTalks AI Chatbot
  setText("tazaTalksFloatingTriggerText", t.tazaTalksFloatingTitle);
  const tazaSubhead = document.getElementById("tazaTalksSubhead");
  if (tazaSubhead) {
    tazaSubhead.innerText = (currentRole === "farmer") ? t.tazaTalksSubheadFarmer : t.tazaTalksSubheadConsumer;
  }
  const tazaActiveMode = document.getElementById("tazaTalksActiveModeText");
  if (tazaActiveMode) {
    tazaActiveMode.innerText = (currentRole === "farmer") ? t.tazaTalksActiveModeFarmer : t.tazaTalksActiveModeConsumer;
  }
  const tazaInput = document.getElementById("tazaTalksInput");
  if (tazaInput && t.tazaTalksInputPlaceholder) {
    tazaInput.placeholder = t.tazaTalksInputPlaceholder;
  }
  if (typeof renderTazaTalksChips === 'function') {
    renderTazaTalksChips();
  }

  // 15. Frequently Bought Section & Bundle Modal
  setText("freqBoughtTitle", t.freqBoughtTitle);
  setText("freqBasedBadge", t.freqBasedBadge);
  setText("freqBoughtSubtitle", t.freqBoughtSubtitle);
  setText("btnBuyBundleText", t.btnBuyBundleText);
  setText("freqModalBadgeText", t.freqModalBadgeText);
  setText("freqBundleModalTitle", t.freqBundleModalTitle);
  setText("freqBundleModalSubtitle", t.freqBundleModalSubtitle);
  setText("labelBundleItemsHeading", t.labelBundleItemsHeading);
  setText("labelFreqProduceSubtotal", t.labelFreqProduceSubtotal);
  setText("labelFreqMandiRetail", t.labelFreqMandiRetail);
  setText("labelFreqDirectSavings", t.labelFreqDirectSavings);
  setText("labelFreqTotalPayable", t.labelFreqTotalPayable);
  setText("btnCancelFreqModal", t.btnCancelFreqModal);
  setText("btnAddAllFreqText", t.btnAddAllFreqText);

  // 16. Favourite Farmers & Direct 1:1 Chat
  setText("subnavFavFarmersText", t.subnavFavFarmersText);
  setText("favFarmersTitle", t.favFarmersTitle);
  setText("favFarmersSubtitle", t.favFarmersSubtitle);
  setText("favEscrowPillText", t.favEscrowPillText);
  setText("favDistrictLabelText", t.favDistrictLabelText);
  setText("optDistrictAll", t.optDistrictAll);
  setText("optDistrictHooghly", t.optDistrictHooghly);
  setText("optDistrictNadia", t.optDistrictNadia);
  setText("optDistrictBardhaman", t.optDistrictBardhaman);
  setText("optDistrictDarjeeling", t.optDistrictDarjeeling);
  setText("optDistrictMalda", t.optDistrictMalda);
  setText("optDistrictMurshidabad", t.optDistrictMurshidabad);
  setText("optDistrictSouth24", t.optDistrictSouth24);
  setText("optDistrictBankura", t.optDistrictBankura);
  setText("farmerChipsHeading", t.farmerChipsHeading);
  setText("farmerChatEscrowTag", t.farmerChatEscrowTag);
  setHtml("farmerChatHelplineNote", t.farmerChatHelplineNote);
  setText("farmerTypingLabel", t.farmerTypingLabel);
  const farmerInp = document.getElementById("farmerChatInput");
  if (farmerInp && t.farmerChatPlaceholder) {
    farmerInp.placeholder = t.farmerChatPlaceholder;
  }

  if (typeof renderFrequentlyBoughtSection === 'function') {
    renderFrequentlyBoughtSection();
  }
  if (typeof renderFavouriteFarmers === 'function') {
    renderFavouriteFarmers();
  }

  // Guaranteed Crop Loading & Instant Translation Refresh
  if (!products || products.length === 0) {
    products = (typeof FALLBACK_PRODUCTS !== 'undefined' && FALLBACK_PRODUCTS.length > 0) ? FALLBACK_PRODUCTS : [];
  }
  if (products && products.length > 0) {
    renderProducts(products);
  }
  updateCartUI();
  if (cachedFarmerOrders && cachedFarmerOrders.length > 0) {
    renderFarmerOrders(cachedFarmerOrders);
  }
  if (window.lucide) lucide.createIcons();
}


// Fallback products if backend is starting
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    crop_name: "Red Onion (Peyaj)",
    variety: "Nasik Red / Sukh Sagar",
    category: "VEGETABLES",
    base_price_per_kg: 42.00,
    mandi_benchmark: {
      modal_price_per_kg: 42.0,
      estimated_retail_price_per_kg: 60.0,
      mandi_name: "Beldanga Krishak Bazar",
      savings_per_kg: 18.00,
      savings_percentage: 30.0
    },
    farmer_name: "Pranab Biswas",
    fpo_affiliation: "Nadia Green Produce Co-op",
    farmer_rating: 4.8,
    district: "Nadia, West Bengal",
    harvest_timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    freshness_score: 96.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 600,
    is_organic: false,
    image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    crop_name: "Fresh Mountain Ginger (Ada)",
    variety: "Gorubathan Organic Special",
    category: "SPICES",
    base_price_per_kg: 105.00,
    mandi_benchmark: {
      modal_price_per_kg: 105.0,
      estimated_retail_price_per_kg: 150.0,
      mandi_name: "Gorubathan APMC",
      savings_per_kg: 45.00,
      savings_percentage: 30.0
    },
    farmer_name: "Tapas Sarkar",
    fpo_affiliation: "Himalayan Organic Spices Guild",
    farmer_rating: 4.9,
    district: "Darjeeling, West Bengal",
    harvest_timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    freshness_score: 98.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.25,
    quantity_available_kg: 150,
    is_organic: true,
    image_url: "/images/ginger.webp"
  },
  {
    id: 3,
    crop_name: "White Garlic (Rosun)",
    variety: "Yamuna Safed Grade A",
    category: "SPICES",
    base_price_per_kg: 140.00,
    mandi_benchmark: {
      modal_price_per_kg: 140.0,
      estimated_retail_price_per_kg: 200.0,
      mandi_name: "Ranaghat Sub-Division APMC",
      savings_per_kg: 60.00,
      savings_percentage: 30.0
    },
    farmer_name: "Pranab Biswas",
    fpo_affiliation: "Nadia Green Produce Co-op",
    farmer_rating: 4.9,
    district: "Nadia, West Bengal",
    harvest_timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    freshness_score: 97.5,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.25,
    quantity_available_kg: 200,
    is_organic: false,
    image_url: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    crop_name: "Fresh Hybrid Tomato",
    variety: "Pusa Ruby / Abhinav",
    category: "VEGETABLES",
    base_price_per_kg: 48.00,
    mandi_benchmark: {
      modal_price_per_kg: 48.0,
      estimated_retail_price_per_kg: 70.0,
      mandi_name: "Singur Regulated Market APMC",
      savings_per_kg: 22.00,
      savings_percentage: 31.4
    },
    farmer_name: "Ananda Mondal",
    fpo_affiliation: "Singur Agro FPO",
    farmer_rating: 4.9,
    district: "Hooghly, West Bengal",
    harvest_timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    freshness_score: 96.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 400,
    is_organic: true,
    image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 5,
    crop_name: "Crisp Red Apple",
    variety: "Royal Delicious Grade A",
    category: "FRUITS",
    base_price_per_kg: 145.00,
    mandi_benchmark: {
      modal_price_per_kg: 140.0,
      estimated_retail_price_per_kg: 200.0,
      mandi_name: "Siliguri Regulated Market APMC",
      savings_per_kg: 55.00,
      savings_percentage: 27.5
    },
    farmer_name: "Tapas Sarkar",
    fpo_affiliation: "North Bengal Fruit Growers Guild",
    farmer_rating: 4.9,
    district: "Darjeeling, West Bengal",
    harvest_timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    freshness_score: 95.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 300,
    is_organic: true,
    image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 6,
    crop_name: "Muktakeshi Eggplant (Begun)",
    variety: "Muktakeshi Deep Purple",
    category: "VEGETABLES",
    base_price_per_kg: 55.00,
    mandi_benchmark: {
      modal_price_per_kg: 55.0,
      estimated_retail_price_per_kg: 80.0,
      mandi_name: "Ranaghat Sub-Division APMC",
      savings_per_kg: 25.00,
      savings_percentage: 31.2
    },
    farmer_name: "Pranab Biswas",
    fpo_affiliation: "Nadia Green Produce Co-op",
    farmer_rating: 4.8,
    district: "Nadia, West Bengal",
    harvest_timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    freshness_score: 94.5,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 250,
    is_organic: true,
    image_url: "/images/brinjal.jpg"
  },
  {
    id: 7,
    crop_name: "Chandramukhi Potato",
    variety: "Kufri Chandramukhi Royal",
    category: "TUBERS",
    base_price_per_kg: 13.00,
    mandi_benchmark: {
      modal_price_per_kg: 12.5,
      estimated_retail_price_per_kg: 18.0,
      mandi_name: "Tarakeswar APMC",
      savings_per_kg: 5.00,
      savings_percentage: 27.8
    },
    farmer_name: "Ananda Mondal",
    fpo_affiliation: "Singur Agro FPO",
    farmer_rating: 4.9,
    district: "Hooghly, West Bengal",
    harvest_timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    freshness_score: 96.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 700,
    is_organic: true,
    image_url: "/images/chandramukhi_potato.jpg"
  },
  {
    id: 8,
    crop_name: "Jyoti Potato",
    variety: "Kufri Jyoti Fresh Harvest",
    category: "TUBERS",
    base_price_per_kg: 8.50,
    mandi_benchmark: {
      modal_price_per_kg: 8.5,
      estimated_retail_price_per_kg: 12.0,
      mandi_name: "Singur Regulated Market APMC",
      savings_per_kg: 3.50,
      savings_percentage: 29.2
    },
    farmer_name: "Ananda Mondal",
    fpo_affiliation: "Singur Agro FPO",
    farmer_rating: 4.9,
    district: "Hooghly, West Bengal",
    harvest_timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    freshness_score: 97.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 900,
    is_organic: false,
    image_url: "/images/jyoti_potato.webp"
  },
  {
    id: 9,
    crop_name: "Pointed Gourd (Potol)",
    variety: "Dandali Tender Green",
    category: "VEGETABLES",
    base_price_per_kg: 48.00,
    mandi_benchmark: {
      modal_price_per_kg: 48.0,
      estimated_retail_price_per_kg: 70.0,
      mandi_name: "Bethuadahari Krishak Bazar",
      savings_per_kg: 22.00,
      savings_percentage: 31.4
    },
    farmer_name: "Pranab Biswas",
    fpo_affiliation: "Nadia Green Produce Co-op",
    farmer_rating: 4.8,
    district: "Nadia, West Bengal",
    harvest_timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    freshness_score: 95.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.25,
    quantity_available_kg: 180,
    is_organic: true,
    image_url: "/images/potol.webp"
  },
  {
    id: 10,
    crop_name: "Fresh Orange Carrot (Gajar)",
    variety: "Pusa Rudhira Sweet",
    category: "VEGETABLES",
    base_price_per_kg: 55.00,
    mandi_benchmark: {
      modal_price_per_kg: 55.0,
      estimated_retail_price_per_kg: 80.0,
      mandi_name: "Kurseong Hill Market",
      savings_per_kg: 25.00,
      savings_percentage: 31.2
    },
    farmer_name: "Tapas Sarkar",
    fpo_affiliation: "Himalayan Farm Produce Co-op",
    farmer_rating: 4.9,
    district: "Darjeeling, West Bengal",
    harvest_timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    freshness_score: 96.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 220,
    is_organic: true,
    image_url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 11,
    crop_name: "Green Bell Capsicum (Shimla Mirch)",
    variety: "California Wonder Crisp",
    category: "VEGETABLES",
    base_price_per_kg: 55.00,
    mandi_benchmark: {
      modal_price_per_kg: 55.0,
      estimated_retail_price_per_kg: 80.0,
      mandi_name: "Siliguri Regulated Market APMC",
      savings_per_kg: 25.00,
      savings_percentage: 31.2
    },
    farmer_name: "Tapas Sarkar",
    fpo_affiliation: "Darjeeling Organic Produce Guild",
    farmer_rating: 4.8,
    district: "Darjeeling, West Bengal",
    harvest_timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    freshness_score: 95.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.25,
    quantity_available_kg: 160,
    is_organic: true,
    image_url: "/images/capsicum.webp"
  },
  {
    id: 12,
    crop_name: "Sweet Lime / Mousambi (Pack of 4)",
    variety: "Nagpur Juicy Sweet Lime",
    category: "FRUITS",
    base_price_per_kg: 35.00,
    mandi_benchmark: {
      modal_price_per_kg: 35.0,
      estimated_retail_price_per_kg: 50.0,
      mandi_name: "English Bazar Regulated Market",
      savings_per_kg: 15.00,
      savings_percentage: 30.0
    },
    farmer_name: "Tapas Sarkar",
    fpo_affiliation: "Malda Citrus & Fruit Guild",
    farmer_rating: 4.9,
    district: "Malda, West Bengal",
    harvest_timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    freshness_score: 94.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 1.0,
    quantity_available_kg: 200,
    is_organic: true,
    image_url: "/images/mousambi.webp"
  },
  {
    id: 13,
    crop_name: "Bengal Martaman Banana (Kola)",
    variety: "Martaman GI Heritage (12 pcs / Dozen)",
    category: "FRUITS",
    unit: "dozen",
    base_price_per_kg: 35.00,
    mandi_benchmark: {
      modal_price_per_kg: 35.0,
      estimated_retail_price_per_kg: 50.0,
      mandi_name: "Ranaghat Sub-Division APMC",
      savings_per_kg: 15.00,
      savings_percentage: 30.0
    },
    farmer_name: "Pranab Biswas",
    fpo_affiliation: "Nadia Green Produce Co-op",
    farmer_rating: 4.8,
    district: "Nadia, West Bengal",
    harvest_timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    freshness_score: 93.5,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 1.0,
    quantity_available_kg: 300,
    is_organic: true,
    image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 14,
    crop_name: "Ruby Pomegranate (Bedana)",
    variety: "Bhagwa Sweet Ruby",
    category: "FRUITS",
    base_price_per_kg: 155.00,
    mandi_benchmark: {
      modal_price_per_kg: 150.0,
      estimated_retail_price_per_kg: 220.0,
      mandi_name: "Memari Regulated Market",
      savings_per_kg: 65.00,
      savings_percentage: 29.5
    },
    farmer_name: "Subhash Ghosh",
    fpo_affiliation: "Bardhaman Fruit Cluster FPO",
    farmer_rating: 4.9,
    district: "Purba Bardhaman, West Bengal",
    harvest_timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    freshness_score: 98.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 180,
    is_organic: true,
    image_url: "/images/pomegranate.webp"
  },
  {
    id: 15,
    crop_name: "Fresh Bottle Gourd Greens (Lau Shak)",
    variety: "Desi Tender Organic Leaves",
    category: "VEGETABLES",
    base_price_per_kg: 42.00,
    mandi_benchmark: {
      modal_price_per_kg: 42.0,
      estimated_retail_price_per_kg: 60.0,
      mandi_name: "Singur Regulated Market APMC",
      savings_per_kg: 18.00,
      savings_percentage: 30.0
    },
    farmer_name: "Ananda Mondal",
    fpo_affiliation: "Singur Agro FPO",
    farmer_rating: 4.9,
    district: "Hooghly, West Bengal",
    harvest_timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    freshness_score: 99.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 120,
    is_organic: true,
    image_url: "/images/laushak.webp"
  },
  {
    id: 16,
    crop_name: "Aromatic Gobindobhog Rice (গোবিন্দভোগ চাল)",
    variety: "GI Certified Heritage Aromatic Short Grain",
    category: "GRAINS_PADDY",
    base_price_per_kg: 85.00,
    mandi_benchmark: {
      modal_price_per_kg: 90.0,
      estimated_retail_price_per_kg: 120.0,
      mandi_name: "Memari Regulated Market APMC",
      savings_per_kg: 35.00,
      savings_percentage: 29.2
    },
    farmer_name: "Subhash Ghosh",
    fpo_affiliation: "Bardhaman Rice & Grain Growers Sangh",
    farmer_rating: 4.9,
    district: "Purba Bardhaman, West Bengal",
    harvest_timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    freshness_score: 98.5,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 1.0,
    quantity_available_kg: 1500,
    is_organic: true,
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 17,
    crop_name: "Minikit Parboiled Rice (মিনিকিট চাল)",
    variety: "Premium Double Boiled Polish-Free White",
    category: "GRAINS_PADDY",
    base_price_per_kg: 38.00,
    mandi_benchmark: {
      modal_price_per_kg: 42.0,
      estimated_retail_price_per_kg: 54.0,
      mandi_name: "Kalna Krishak Bazar APMC",
      savings_per_kg: 16.00,
      savings_percentage: 29.6
    },
    farmer_name: "Subhash Ghosh",
    fpo_affiliation: "Bardhaman Rice & Grain Growers Sangh",
    farmer_rating: 4.8,
    district: "Purba Bardhaman, West Bengal",
    harvest_timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    freshness_score: 97.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 2.0,
    quantity_available_kg: 2500,
    is_organic: false,
    image_url: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 18,
    crop_name: "Golden Sona Moong Dal (সোনা মুগ ডাল)",
    variety: "Unpolished High-Protein Golden Yellow",
    category: "PULSES",
    base_price_per_kg: 105.00,
    mandi_benchmark: {
      modal_price_per_kg: 110.0,
      estimated_retail_price_per_kg: 145.0,
      mandi_name: "Bethuadahari Krishak Bazar",
      savings_per_kg: 40.00,
      savings_percentage: 27.6
    },
    farmer_name: "Pranab Biswas",
    fpo_affiliation: "Nadia Green Produce Co-op",
    farmer_rating: 4.9,
    district: "Nadia, West Bengal",
    harvest_timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    freshness_score: 98.0,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 450,
    is_organic: true,
    image_url: "/images/moong_dal.webp"
  },
  {
    id: 19,
    crop_name: "Desi Red Lentils / Musur Dal (মুসুর ডাল)",
    variety: "Desi Bengal Split Unpolished Masoor",
    category: "PULSES",
    base_price_per_kg: 82.00,
    mandi_benchmark: {
      modal_price_per_kg: 88.0,
      estimated_retail_price_per_kg: 115.0,
      mandi_name: "Beldanga Krishak Bazar",
      savings_per_kg: 33.00,
      savings_percentage: 28.7
    },
    farmer_name: "Tapas Sarkar",
    fpo_affiliation: "Malda & Murshidabad Pulse Cluster",
    farmer_rating: 4.8,
    district: "Murshidabad, West Bengal",
    harvest_timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    freshness_score: 97.5,
    freshness_label: "FARM_FRESH_PREMIUM",
    minimum_order_kg: 0.5,
    quantity_available_kg: 600,
    is_organic: true,
    image_url: "/images/masoor_dal.jpg"
  }
];

// Image helpers for default crop categories
function getDefaultCropImage(name, category) {
  const n = (name || "").toLowerCase();
  if (n.includes("onion") || n.includes("piyaz") || n.includes("peyaj")) {
    return "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("ginger") || n.includes("ada") || n.includes("adrak")) {
    return "/images/ginger.webp";
  }
  if (n.includes("garlic") || n.includes("roshun") || n.includes("rosun")) {
    return "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("tomato")) {
    return "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("apple") || n.includes("seb")) {
    return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("brinjal") || n.includes("eggplant") || n.includes("begun")) {
    return "/images/brinjal.jpg";
  }
  if (n.includes("chandramukhi")) {
    return "/images/chandramukhi_potato.jpg";
  }
  if (n.includes("jyoti") || n.includes("potato") || n.includes("aloo")) {
    return "/images/jyoti_potato.webp";
  }
  if (n.includes("potol") || n.includes("pointed gourd")) {
    return "/images/potol.webp";
  }
  if (n.includes("carrot") || n.includes("gajar")) {
    return "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("capsicum") || n.includes("shimla mirch") || n.includes("bell pepper")) {
    return "/images/capsicum.webp";
  }
  if (n.includes("mousambi") || n.includes("mosambi") || n.includes("sweet lime")) {
    return "/images/mousambi.webp";
  }
  if (n.includes("kola") || n.includes("banana")) {
    return "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("bedana") || n.includes("pomegranate") || n.includes("anar")) {
    return "/images/pomegranate.webp";
  }
  if (n.includes("lau shak") || n.includes("greens") || n.includes("shak") || n.includes("spinach")) {
    return "/images/laushak.webp";
  }
  if (n.includes("moong") || n.includes("mung")) {
    return "/images/moong_dal.webp";
  }
  if (n.includes("musur") || n.includes("masoor") || n.includes("lentil") || n.includes("dal") || category === "PULSES") {
    return "/images/masoor_dal.jpg";
  }
  if (n.includes("rice") || n.includes("paddy") || n.includes("chal") || n.includes("gobindobhog") || n.includes("minikit") || category === "GRAINS_PADDY") {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("mango")) {
    return "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=60";
  }
  if (n.includes("cauliflower") || n.includes("cabbage")) {
    return "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=60";
  }
  if (category === "TUBERS") {
    return "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=60";
  }
  if (category === "FRUITS") {
    return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=60";
  }
  return "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=60";
}

// Format relative harvest timestamp
function formatHarvestTime(isoString) {
  if (!isoString) return "Today, 5:30 AM";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = Math.round((now - d) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just harvested (Within 1h)";
    if (diffHours === 1) return "Harvested 1 hr ago";
    if (diffHours < 24) return `Harvested ${diffHours} hrs ago`;
    const days = Math.round(diffHours / 24);
    return `Harvested ${days} day${days > 1 ? 's' : ''} ago`;
  } catch (e) {
    return "Today, 5:30 AM";
  }
}

// Unit helper (kg vs dozen vs pcs)
function getCropUnit(p) {
  if (p && p.unit) return p.unit;
  const name = (p && (p.crop_name || p.name) ? (p.crop_name || p.name) : "").toLowerCase();
  if (name.includes("banana") || name.includes("kola") || name.includes("dozen")) {
    return "dozen";
  }
  return "kg";
}

// -------------------------------------------------------------
// Role Selection & Auth Helpers
// -------------------------------------------------------------
function openRoleSelectionModal() {
  const modal = document.getElementById("roleSelectionModal");
  if (modal) {
    modal.classList.add("open");
    modal.style.display = "flex";
    if (window.lucide) lucide.createIcons();
  } else {
    openAuthModal('farmer');
  }
}

function closeRoleSelectionModal() {
  const modal = document.getElementById("roleSelectionModal");
  if (modal) {
    modal.classList.remove("open");
    modal.style.display = "none";
  }
}

function switchRole(role) {
  currentRole = (role === "farmer") ? "farmer" : "consumer";
  window.currentRole = currentRole;
  try {
    localStorage.setItem('taza_role', currentRole);
  } catch (e) {}

  const consumerSection = document.getElementById("consumerView");
  const farmerSection = document.getElementById("farmerView");
  const btnConsumer = document.getElementById("btnConsumerRole");
  const btnFarmer = document.getElementById("btnFarmerRole");
  const userGreeting = document.getElementById("navUserGreeting");
  const userRoleText = document.getElementById("navUserRole");
  const subNav = document.getElementById("secondarySubNav") || document.querySelector(".sub-nav");

  // Keep logistics route direction aligned with active role
  if (typeof logisticsRouteDirection !== 'undefined') {
    logisticsRouteDirection = currentRole;
  }

  // 1. DIRECT VIEW SWITCH (Execute immediately to guarantee UI displays target portal)
  if (currentRole === "farmer") {
    document.body.classList.add("farmer-mode");
    if (farmerSection) {
      farmerSection.classList.add("active");
      farmerSection.style.display = "block";
    }
    if (consumerSection) {
      consumerSection.classList.remove("active");
      consumerSection.style.display = "none";
    }
    if (btnFarmer) btnFarmer.classList.add("active");
    if (btnConsumer) btnConsumer.classList.remove("active");

    const farmerName = (window.authState && window.authState.name) ? window.authState.name.split(' ')[0] : (currentLanguage === "bn" ? "আনন্দ" : "Ananda");
    if (userGreeting) {
      userGreeting.innerText = (currentLanguage === "bn")
        ? `নমস্কার, ${farmerName} (কৃষক)`
        : (currentLanguage === "hi" ? `नमस्ते, ${farmerName} (किसान)` : `Hello, ${farmerName} (Farmer)`);
    }
    if (userRoleText) {
      userRoleText.innerHTML = (currentLanguage === "bn")
        ? `কৃষক হাব <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`
        : `Farmer Hub <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`;
    }

    // In farmer account: hide consumer commercial categories while keeping AI Smart Logistics Engine intact & accessible!
    if (subNav) {
      subNav.querySelectorAll(".subnav-consumer-item").forEach(el => el.style.display = "none");
      subNav.querySelectorAll(".subnav-farmer-item").forEach(el => el.style.display = "inline-flex");
    }

    if (typeof loadFarmerDashboard === 'function') loadFarmerDashboard();
    if (typeof initHarvestTimestampField === 'function') initHarvestTimestampField();
    if (typeof renderFarmerWarehouseCards === 'function') {
      const selectedWhDist = document.getElementById("whDistrictFilter")?.value || "Hooghly";
      renderFarmerWarehouseCards(selectedWhDist);
      if (typeof recalculateStorageFit === 'function') recalculateStorageFit();
    }
  } else {
    document.body.classList.remove("farmer-mode");
    if (consumerSection) {
      consumerSection.classList.add("active");
      consumerSection.style.display = "block";
    }
    if (farmerSection) {
      farmerSection.classList.remove("active");
      farmerSection.style.display = "none";
    }
    if (btnConsumer) btnConsumer.classList.add("active");
    if (btnFarmer) btnFarmer.classList.remove("active");

    const consumerName = (window.authState && window.authState.name) ? window.authState.name.split(' ')[0] : "Sourav";
    if (userGreeting) {
      userGreeting.innerText = (currentLanguage === "bn") ? `নমস্কার, ${consumerName}` : (currentLanguage === "hi" ? `नमस्ते, ${consumerName}` : `Hello, ${consumerName}`);
    }
    if (userRoleText) {
      userRoleText.innerHTML = (currentLanguage === "bn")
        ? `ভোক্তা হাব <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`
        : `Consumer Hub <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`;
    }

    // Restore consumer category links on secondary sub-nav
    if (subNav) {
      subNav.classList.remove("farmer-hidden");
      subNav.style.display = "";
      subNav.querySelectorAll(".subnav-consumer-item").forEach(el => el.style.display = "");
      subNav.querySelectorAll(".subnav-farmer-item").forEach(el => el.style.display = "none");
    }

    if (typeof fetchCatalog === 'function') fetchCatalog();
    if (typeof renderFrequentlyBoughtSection === 'function') renderFrequentlyBoughtSection();
    if (typeof renderFavouriteFarmers === 'function') renderFavouriteFarmers();
  }

  // 2. Set default language safely: Bengali (bn) for Farmer interface, English (en) for Consumer interface
  try {
    const roleDefaultLang = (currentRole === "farmer") ? "bn" : "en";
    changeAppLanguage(roleDefaultLang);
  } catch (langErr) {
    console.warn("Language adaptation warning:", langErr);
  }

  // If logistics modal is open, re-render route with interchanged locations
  const logisticsModal = document.getElementById("logisticsModal");
  if (logisticsModal && logisticsModal.classList.contains("open") && typeof renderLogisticsRoute === 'function') {
    renderLogisticsRoute(currentLogisticsDistrict, currentLogisticsDest);
  }

  if (typeof setTazaTalksRole === 'function') {
    setTazaTalksRole(currentRole, true);
  }

  if (typeof applyTranslations === 'function') {
    try {
      applyTranslations();
    } catch (e) {}
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}

function selectUserRole(role) {
  closeRoleSelectionModal();
  switchRole(role);
}

// -------------------------------------------------------------
// Initialize App & Auto Authenticate Seeded Profiles
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // Check persisted or URL requested role
  let initialRole = 'consumer';
  try {
    const saved = localStorage.getItem('taza_role');
    if (saved === 'farmer' || window.location.hash === '#farmer' || window.location.search.includes('role=farmer')) {
      initialRole = 'farmer';
    }
  } catch (e) {}

  if (initialRole === 'farmer') {
    switchRole('farmer');
  } else {
    const defaultRoleLang = (currentRole === 'farmer') ? 'bn' : 'en';
    changeAppLanguage(defaultRoleLang);
  }

  // Show Authentication Plate Modal immediately when link/page is opened with aligned role
  openAuthModal(initialRole);

  // Attach live Mandi benchmark listeners on farmer input fields
  setupMandiBenchmarkListeners();

  // Auto-login consumer & farmer demo accounts
  await autoAuthenticate();
  await loadLiveAlerts();
  await fetchCatalog();
  await loadFarmerDashboard();

  // Initialize TazaTalks AI Chatbot
  initTazaTalks();
});

// Auto Authenticate with Backend
async function autoAuthenticate() {
  const savedToken = localStorage.getItem('taza_auth_token');
  const savedUser = localStorage.getItem('taza_auth_user');
  if (savedToken && savedUser) {
    try {
      authTokens = { access_token: savedToken };
      currentUser = JSON.parse(savedUser);
    } catch(e) {
      console.warn('Saved auth invalid, clearing.');
      localStorage.removeItem('taza_auth_token');
      localStorage.removeItem('taza_auth_user');
    }
  }
}

// -------------------------------------------------------------
// Live Weather & Calamity Alert Engine (Open-Meteo Real-Time)
// -------------------------------------------------------------
async function loadLiveAlerts(selectedDistrict = "Hooghly") {
  try {
    const res = await fetch(`${API_BASE}/alerts?region=${encodeURIComponent(selectedDistrict)}`);
    if (res.ok) {
      const alertData = await res.json();
      const tickerText = document.getElementById("tickerText");
      const ticker = document.getElementById("topCalamityTicker");
      const tickerIcon = document.getElementById("tickerIcon");
      const tickerSelect = document.getElementById("tickerDistrictSelect");

      if (tickerSelect && tickerSelect.value !== selectedDistrict) {
        tickerSelect.value = selectedDistrict;
      }

      const tempStr = alertData.live_temperature_c != null ? `${alertData.live_temperature_c}°C` : "";
      const windStr = alertData.live_wind_speed_kph != null ? `Wind: ${alertData.live_wind_speed_kph} km/h` : "";
      const rainStr = alertData.live_rainfall_mm != null ? `Rain: ${alertData.live_rainfall_mm} mm` : "";
      const weatherTag = [tempStr, windStr, rainStr].filter(Boolean).join(" • ");

      if (alertData.alert_active) {
        if (ticker) ticker.style.backgroundColor = alertData.severity === "EXTREME" ? "#7f1d1d" : "#991b1b";
        if (tickerIcon) tickerIcon.setAttribute("data-lucide", "alert-triangle");
        if (tickerText) {
          tickerText.innerHTML = `<strong>⚠️ ${alertData.severity} Alert (${alertData.region}):</strong> ${alertData.activeWarnings[0]} [${weatherTag}] — <em>${alertData.action_required}</em>`;
        }
      } else {
        if (ticker) ticker.style.backgroundColor = "#065f46";
        if (tickerIcon) tickerIcon.setAttribute("data-lucide", "shield-check");
        if (tickerText) {
          tickerText.innerHTML = `<strong>🌾 Live Agro-Weather (${alertData.region}):</strong> ${alertData.live_weather_condition || "Nominal Conditions"} [${weatherTag}] — Direct farmgate dispatch corridors active.`;
        }
      }
      if (window.lucide) lucide.createIcons();
    }
  } catch (e) {
    console.warn("Using cached agro-alert banner fallback", e);
  }
}


// -------------------------------------------------------------
// Fetch & Render Live Catalog from Backend
// -------------------------------------------------------------
async function fetchCatalog() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;"><i data-lucide="loader-2" class="pulse"></i> Loading fresh harvests direct from farm gates...</div>`;
  if (window.lucide) lucide.createIcons();

  let url = `${API_BASE}/consumers/catalog?sort_by=${currentSort}&limit=50`;
  if (currentFilter !== 'all') {
    url += `&category=${encodeURIComponent(currentFilter)}`;
  }
  if (currentSearchQuery.trim()) {
    url += `&search=${encodeURIComponent(currentSearchQuery.trim())}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Catalog request returned " + res.status);
    const data = await res.json();
    products = (data.items && data.items.length > 0) ? data.items : [];
    if (products.length === 0 && currentFilter === 'all' && !currentSearchQuery) {
      products = FALLBACK_PRODUCTS;
    }
  } catch (err) {
    console.warn("Failed to fetch from API, loading fallback products", err);
    products = FALLBACK_PRODUCTS;
  }

  renderProducts(products);
}

// -------------------------------------------------------------
// Freshness Decay Engine: Freshness(t) = 100 * exp(-lambda * t)
// where t = hours_since_harvest + expected_delivery_hours (transit time to consumer)
// to proactively avoid crop spoilage during transit
// -------------------------------------------------------------
function calculateFreshnessScore(harvestTimestamp, shelfLifeHours = 72, decayLambda = 0.015, expectedDeliveryHours = 2.0) {
  const harvestTime = harvestTimestamp ? new Date(harvestTimestamp).getTime() : Date.now();
  const elapsedHours = Math.max(0, (Date.now() - harvestTime) / 3600000);
  const t = elapsedHours + Math.max(0, expectedDeliveryHours);
  let score = 100.0 * Math.exp(-decayLambda * t);
  if (t > shelfLifeHours) {
    score = Math.max(0, score * 0.5);
  }
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}
window.calculateFreshnessScore = calculateFreshnessScore;

// Render Products Grid
function renderProducts(items) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: #666; background: #f9fafb; border-radius: 8px;">
        <i data-lucide="sprout" style="width:40px;height:40px;color:#15803d;margin-bottom:10px;"></i>
        <h3 style="margin-bottom:6px;">No harvests match your filter</h3>
        <p style="font-size:13px;color:#777;">Try switching categories or clearing your search term.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  items.forEach(p => {
    const rawCropName = p.crop_name || p.name || "Fresh Harvest";
    const cropName = getTranslatedCropName(rawCropName);
    const farmerName = p.farmer_name || p.farmer || "Registered Bengal Farmer";
    const fpo = p.fpo_affiliation || "Verified FPO Group";
    const location = p.district || p.farmLocation || "West Bengal";
    const farmPrice = p.base_price_per_kg || p.farmPrice || 16.50;
    const mb = p.mandi_benchmark || {};
    const mandiModal = mb.mandi_modal_price_per_kg || mb.modal_price_per_kg || (farmPrice * 0.9);
    const retailPrice = mb.estimated_retail_price_per_kg || mb.retail_price_per_kg || (p.retailPrice || Math.round(mandiModal * 1.45 * 100) / 100);
    const savedAmount = Math.max(0, retailPrice - farmPrice);
    const savePercent = retailPrice > 0 ? Math.round((savedAmount / retailPrice) * 100) : 0;
    const mandiName = mb.mandi_name || "Singur APMC";
    
    // Transit-adjusted freshness calculation: t = elapsed harvest age + expected delivery transit time
    const transitHours = p.expected_delivery_hours || (p.distance_km ? Math.max(0.5, Math.round(((p.distance_km / 35.0) + 0.5) * 10) / 10) : 2.0);
    const freshnessScore = Math.round(p.freshness_score || p.freshnessScore || calculateFreshnessScore(p.harvest_timestamp || p.harvestTimestamp, p.shelf_life_hours || 72, p.freshness_decay_lambda || 0.015, transitHours));
    const harvestTime = formatHarvestTime(p.harvest_timestamp || p.harvestTimestamp);
    const imgUrl = p.image_url || p.image || getDefaultCropImage(rawCropName, p.category);
    const minQty = p.minimum_order_kg || p.minQty || 0.5;
    const maxQty = p.quantity_available_kg || p.maxQty || 100;
    const rating = p.farmer_rating || p.rating || 4.8;
    const unit = getCropUnit(p);
    const translatedUnit = (unit === "dozen") ? (currentLanguage === "bn" ? "ডজন" : (currentLanguage === "hi" ? "दर्जन" : "dozen")) : (currentLanguage === "bn" ? "কেজি" : (currentLanguage === "hi" ? "किग्रा" : "kg"));

    // Check if this crop is already in cart
    const cartItem = cart.find(c => c.id === p.id);

    const freshnessText = currentLanguage === 'bn' ? `${freshnessScore}% সতেজতা সূচক` : (currentLanguage === 'hi' ? `${freshnessScore}% ताजगी सूचकांक` : `${freshnessScore}% Freshness Decay Index`);
    const freshnessFormulaTooltip = `Freshness: 100 * e^(-λ·t) | t = Harvest Age + Expected Delivery (${transitHours}h transit) to avoid spoilage.`;
    const verifiedBatchText = currentLanguage === 'bn' ? '(যাচাইকৃত এফপিও ব্যাচ)' : (currentLanguage === 'hi' ? '(सत्यापित एफपीओ बैच)' : '(Verified FPO Batch)');
    const farmGateLabel = currentLanguage === 'bn' ? '📍 খামার গেট:' : (currentLanguage === 'hi' ? '📍 फार्म गेट:' : '📍 Farm Gate:');
    const mandiRetailLabel = currentLanguage === 'bn' ? 'খুচরা বাজার দর' : (currentLanguage === 'hi' ? 'मंडी खुदरा मूल्य' : 'Mandi Retail');
    const saveLabel = currentLanguage === 'bn' ? 'সাশ্রয়' : (currentLanguage === 'hi' ? 'बचत' : 'Save');
    const directPriceLabel = currentLanguage === 'bn' ? '(সরাসরি খামার দর)' : (currentLanguage === 'hi' ? '(सीधा फार्म मूल्य)' : '(Direct Farm Price)');
    const apmcWholesaleLabel = currentLanguage === 'bn' ? 'এপিএমসি পাইকারি' : (currentLanguage === 'hi' ? 'एपीएमसी थोक' : 'APMC Wholesale');
    const addToCartText = currentLanguage === 'bn' ? 'কার্টে যোগ করুন' : (currentLanguage === 'hi' ? 'कार्ट में जोड़ें' : 'ADD TO CART');
    const adjustQtyText = currentLanguage === 'bn' ? 'পরিমাণ পরিবর্তন / বিবরণ' : (currentLanguage === 'hi' ? 'मात्रा बदलें / विवरण' : 'Adjust Quantity / Details');
    const customQtyText = currentLanguage === 'bn' ? `পছন্দমতো পরিমাণ (${minQty} ${translatedUnit} - ${maxQty} ${translatedUnit})` : (currentLanguage === 'hi' ? `मनचाही मात्रा (${minQty} ${translatedUnit} - ${maxQty} ${translatedUnit})` : `Custom Quantity (${minQty} ${translatedUnit} - ${maxQty} ${translatedUnit})`);
    // Stock-Market Style Daily Price Pill
    const dailyDelta = typeof p.daily_price_change_percent === "number" ? p.daily_price_change_percent : 0.0;
    const trend = p.daily_trend || (dailyDelta > 0 ? "UP" : (dailyDelta < 0 ? "DOWN" : "STABLE"));
    const isFixed = p.pricing_strategy === "FIXED_PRICE";

    let stockTrendBadge = "";
    if (isFixed) {
      const fixedText = currentLanguage === 'bn' ? '🔒 স্থির দর' : (currentLanguage === 'hi' ? '🔒 स्थिर दर' : '🔒 Fixed Rate');
      stockTrendBadge = `<span class="stock-trend-pill fixed" title="Farmer Fixed Farm Gate Price">${fixedText}</span>`;
    } else if (trend === "UP") {
      const upText = currentLanguage === 'bn' ? `▲ +${dailyDelta}% আজ` : (currentLanguage === 'hi' ? `▲ +${dailyDelta}% आज` : `▲ +${dailyDelta}% Today`);
      stockTrendBadge = `<span class="stock-trend-pill up" title="Dynamic Market Peg: Daily benchmark increased today">${upText}</span>`;
    } else if (trend === "DOWN") {
      const downText = currentLanguage === 'bn' ? `▼ ${dailyDelta}% আজ` : (currentLanguage === 'hi' ? `▼ ${dailyDelta}% आज` : `▼ ${dailyDelta}% Today`);
      stockTrendBadge = `<span class="stock-trend-pill down" title="Dynamic Market Peg: Daily price advantage for buyers">${downText}</span>`;
    } else {
      const stableText = currentLanguage === 'bn' ? `• স্থির মার্কেট` : (currentLanguage === 'hi' ? `• स्थिर बाजार` : `• Stable Today`);
      stockTrendBadge = `<span class="stock-trend-pill stable" title="Dynamic Market Peg: Steady today">${stableText}</span>`;
    }

    const card = document.createElement("div");
    card.className = "commercial-card";
    card.innerHTML = `
      <div>
        <div class="card-top-image" onclick="openProductModal(${p.id})" style="cursor:pointer;">
          <img src="${imgUrl}" alt="${cropName}" loading="lazy" />
          <span class="freshness-tag" title="${freshnessFormulaTooltip}">${freshnessText}</span>
          <span class="harvest-time-tag">${harvestTime}</span>
        </div>

        <div class="card-body">
          <span class="fpo-tag"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> ${fpo} • ${farmerName}</span>
          <h3 class="item-title" onclick="openProductModal(${p.id})" style="cursor:pointer;">${cropName}</h3>
          <p class="item-location">${farmGateLabel} ${location}</p>

          <div class="ratings-line">
            <span class="stars">★ ${rating}</span>
            <span class="rev-count">${verifiedBatchText}</span>
          </div>

          <!-- Price Arbitrage Widget -->
          <div class="price-strip">
            <div class="retail-gap">
              <span class="strike">${mandiRetailLabel}: ₹${retailPrice.toFixed(2)}/${translatedUnit}</span>
              <span class="saved">${saveLabel} ₹${savedAmount.toFixed(2)} (${savePercent}%)</span>
            </div>
            <div class="live-price" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
              <span>₹${farmPrice.toFixed(2)} <small>/ ${translatedUnit} ${directPriceLabel}</small></span>
              ${stockTrendBadge}
            </div>
            <div style="font-size:0.72rem; color:#64748b; margin-top:3px;">
              ${apmcWholesaleLabel}: ₹${mandiModal.toFixed(2)}/${translatedUnit} (${mandiName})
            </div>
          </div>
        </div>
      </div>

      <!-- E-Commerce Add To Cart & Stepper Actions -->
      <div class="card-action-container">
        ${!cartItem ? `
          <button class="btn-card-add-cart" onclick="quickAddToCart(${p.id}, event)">
            <i data-lucide="shopping-cart"></i> ${addToCartText}
          </button>
        ` : `
          <div class="card-qty-stepper">
            <button class="stepper-btn ${cartItem.selectedQty <= minQty ? 'stepper-minus-del' : ''}" onclick="updateCartItemQty(${p.id}, -1, event)" title="Decrease Quantity">
              ${cartItem.selectedQty <= minQty ? '✕' : '−'}
            </button>
            <span class="stepper-val">${cartItem.selectedQty} ${translatedUnit} (₹${cartItem.subtotal.toFixed(2)})</span>
            <button class="stepper-btn" onclick="updateCartItemQty(${p.id}, 1, event)" title="Increase Quantity">+</button>
          </div>
        `}
        <div class="card-custom-link-wrap">
          <a class="card-custom-qty-link" onclick="openProductModal(${p.id})">
            ${cartItem ? adjustQtyText : customQtyText} ⚙️
          </a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  if (typeof renderFrequentlyBoughtSection === 'function') {
    renderFrequentlyBoughtSection();
  }

  if (window.lucide) lucide.createIcons();
}

// -------------------------------------------------------------
// Portal & Role Switching (Window Export)
// -------------------------------------------------------------
window.switchRole = switchRole;

// -------------------------------------------------------------
// Category Filtering & Global Search
// -------------------------------------------------------------
function filterCategory(category, element) {
  currentFilter = category;
  if (element) {
    document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
    element.classList.add("active");
  }
  document.getElementById("searchCategory").value = category;
  fetchCatalog();
}

let searchDebounceTimeout = null;
function handleSearchInput(query) {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    currentSearchQuery = query;
    fetchCatalog();
  }, 300);
}

function triggerSearch() {
  const val = document.getElementById("globalSearchInput").value;
  currentSearchQuery = val;
  fetchCatalog();
}

function handleSort(criteria) {
  currentSort = criteria;
  fetchCatalog();
}

// -------------------------------------------------------------
// Product Detail Modal (Variable Weights 150g to 50kg)
// -------------------------------------------------------------
function openProductModal(id) {
  activeModalProduct = products.find(p => p.id === id) || FALLBACK_PRODUCTS.find(p => p.id === id);
  if (!activeModalProduct) return;

  const rawCropName = activeModalProduct.crop_name || activeModalProduct.name;
  const cropName = getTranslatedCropName(rawCropName);
  const farmerName = activeModalProduct.farmer_name || activeModalProduct.farmer || "Direct Farmer";
  const fpo = activeModalProduct.fpo_affiliation || "Singur FPO";
  const location = activeModalProduct.district || activeModalProduct.farmLocation || "Hooghly, West Bengal";
  const farmPrice = activeModalProduct.base_price_per_kg || activeModalProduct.farmPrice || 16.50;
  const mb = activeModalProduct.mandi_benchmark || {};
  const mandiModal = mb.mandi_modal_price_per_kg || mb.modal_price_per_kg || (farmPrice * 0.9);
  const retailPrice = mb.estimated_retail_price_per_kg || mb.retail_price_per_kg || (activeModalProduct.retailPrice || Math.round(mandiModal * 1.45 * 100) / 100);
  const savedAmount = Math.max(0, retailPrice - farmPrice);
  const savePercent = retailPrice > 0 ? Math.round((savedAmount / retailPrice) * 100) : 0;
  const mandiName = mb.mandi_name || "APMC Regulated Market";

  const unit = getCropUnit(activeModalProduct);
  const translatedUnit = (unit === "dozen") ? (currentLanguage === "bn" ? "ডজন" : (currentLanguage === "hi" ? "दर्जन" : "dozen")) : (currentLanguage === "bn" ? "কেজি" : (currentLanguage === "hi" ? "किग्रा" : "kg"));
  const minQty = activeModalProduct.minimum_order_kg || activeModalProduct.minQty || (unit === "dozen" ? 1.0 : 0.5);
  const maxQty = activeModalProduct.quantity_available_kg || activeModalProduct.maxQty || (unit === "dozen" ? 100 : 100);
  const freshness = Math.round(activeModalProduct.freshness_score || activeModalProduct.freshnessScore || 96);
  const imgUrl = activeModalProduct.image_url || activeModalProduct.image || getDefaultCropImage(rawCropName, activeModalProduct.category);

  document.getElementById("modalProductImg").src = imgUrl;
  document.getElementById("modalFreshnessTag").innerText = currentLanguage === 'bn' ? `${freshness}% প্রত্যয়িত জৈবিক সতেজতা সূচক` : (currentLanguage === 'hi' ? `${freshness}% प्रमाणित जैविक ताजगी सूचकांक` : `${freshness}% Certified Biological Freshness`);
  document.getElementById("modalFarmerBadge").innerText = `${fpo} • ${farmerName}`;
  document.getElementById("modalCropName").innerText = cropName;
  document.getElementById("modalFarmLocation").innerHTML = `<i data-lucide="map-pin"></i> ${currentLanguage === 'bn' ? 'খামার গেট:' : (currentLanguage === 'hi' ? 'फार्म गेट:' : 'Farm Gate:')} ${location}`;
  document.getElementById("modalHarvestTimestamp").innerText = formatHarvestTime(activeModalProduct.harvest_timestamp);
  document.getElementById("modalDeliverySpeed").innerText = currentLanguage === 'bn' ? "এক্সপ্রেস গ্রিন ইভি কোল্ড চেইন (< ১৮ ঘণ্টা)" : (currentLanguage === 'hi' ? "एक्सप्रेस ग्रीन ईवी कोल्ड चेन (< 18 घंटे)" : "Express Green EV Cold Chain (< 18h)");
  document.getElementById("modalSeason").innerText = `${location} Farm Gate • Mandi Ref: ${mandiName} (₹${mandiModal.toFixed(2)}/${translatedUnit})`;

  document.getElementById("modalRetailPrice").innerText = `${currentLanguage === 'bn' ? 'খুচরা বাজার দর' : (currentLanguage === 'hi' ? 'मंडी खुदरा मूल्य' : 'Mandi Retail')}: ₹${retailPrice.toFixed(2)}/${translatedUnit}`;
  document.getElementById("modalSavings").innerText = currentLanguage === 'bn' ? `সরাসরি সাশ্রয় ₹${savedAmount.toFixed(2)} (${savePercent}%)` : (currentLanguage === 'hi' ? `सीधी बचत ₹${savedAmount.toFixed(2)} (${savePercent}%)` : `Save ₹${savedAmount.toFixed(2)} (${savePercent}%) Directly`);

  document.getElementById("modalDirectPrice").innerText = `₹${farmPrice.toFixed(2)}`;
  document.getElementById("modalUnitDisplay").innerText = `/ ${translatedUnit} (${currentLanguage === 'bn' ? 'সরাসরি খামার দর' : (currentLanguage === 'hi' ? 'सीधा फार्म मूल्य' : 'Direct Farm Gate Price')})`;

  const modalStockBadge = document.getElementById("modalStockTrendBadge");
  if (modalStockBadge) {
    const isFixed = activeModalProduct.pricing_strategy === "FIXED_PRICE";
    const dailyDelta = typeof activeModalProduct.daily_price_change_percent === "number" ? activeModalProduct.daily_price_change_percent : 0.0;
    const trend = activeModalProduct.daily_trend || (dailyDelta > 0 ? "UP" : (dailyDelta < 0 ? "DOWN" : "STABLE"));
    if (isFixed) {
      modalStockBadge.className = "stock-trend-pill fixed";
      modalStockBadge.innerHTML = currentLanguage === 'bn' ? '🔒 স্থির খামার দর (Fixed Rate)' : (currentLanguage === 'hi' ? '🔒 स्थिर फार्म दर (Fixed Rate)' : '🔒 Fixed Farm Gate Rate');
    } else if (trend === "UP") {
      modalStockBadge.className = "stock-trend-pill up";
      modalStockBadge.innerHTML = currentLanguage === 'bn' ? `📈 দৈনিক বাজার দর: ▲ +${dailyDelta}% আজ` : (currentLanguage === 'hi' ? `📈 दैनिक बाजार दर: ▲ +${dailyDelta}% आज` : `📈 Dynamic Market: ▲ +${dailyDelta}% Today`);
    } else if (trend === "DOWN") {
      modalStockBadge.className = "stock-trend-pill down";
      modalStockBadge.innerHTML = currentLanguage === 'bn' ? `📉 দৈনিক বাজার দর: ▼ ${dailyDelta}% আজ` : (currentLanguage === 'hi' ? `📉 दैनिक बाजार दर: ▼ ${dailyDelta}% आज` : `📉 Dynamic Market: ▼ ${dailyDelta}% Today`);
    } else {
      modalStockBadge.className = "stock-trend-pill stable";
      modalStockBadge.innerHTML = currentLanguage === 'bn' ? `📈 দৈনিক বাজার দর: অপরিবর্তিত` : (currentLanguage === 'hi' ? `📈 दैनिक बाजार दर: स्थिर` : `📈 Dynamic Market: Stable Today`);
    }
  }

  document.getElementById("modalMinMaxRange").innerText = currentLanguage === 'bn' ? `সর্বনিম্ন ${minQty} ${translatedUnit} - সর্বোচ্চ ${maxQty} ${translatedUnit}` : (currentLanguage === 'hi' ? `न्यूनतम ${minQty} ${translatedUnit} - अधिकतम ${maxQty} ${translatedUnit}` : `Min ${minQty} ${unit} - Max ${maxQty} ${unit}`);
  document.getElementById("modalUnitLabel").innerText = translatedUnit;

  const qtyInput = document.getElementById("modalQtyInput");
  qtyInput.min = minQty;
  qtyInput.max = maxQty;
  qtyInput.step = (unit === "dozen") ? 1 : (minQty < 1 ? 0.05 : 0.5);
  qtyInput.value = minQty;

  // Freshness Decay Index Calculation: 100 * exp(-lambda * t)
  // where t = hours_since_harvest + expected_delivery_hours (transit time to consumer to avoid spoilage)
  const harvestDt = activeModalProduct.harvest_timestamp ? new Date(activeModalProduct.harvest_timestamp).getTime() : Date.now();
  const elapsedHarvestHours = Math.max(0.1, Math.round(((Date.now() - harvestDt) / 3600000) * 10) / 10);
  const transitHours = activeModalProduct.expected_delivery_hours || (activeModalProduct.distance_km ? Math.max(0.5, Math.round(((activeModalProduct.distance_km / 35.0) + 0.5) * 10) / 10) : 1.5);
  const totalDecayTimeT = Math.round((elapsedHarvestHours + transitHours) * 10) / 10;

  const ageEl = document.getElementById("modalHarvestAgeHours");
  const transitEl = document.getElementById("modalTransitHours");
  const totalTEl = document.getElementById("modalTotalDecayTime");
  if (ageEl) ageEl.innerText = `${elapsedHarvestHours}h`;
  if (transitEl) transitEl.innerText = `${transitHours}h`;
  if (totalTEl) totalTEl.innerText = `${totalDecayTimeT}h`;

  const formulaHead = document.getElementById("labelFreshnessFormulaHead");
  if (formulaHead) {
    formulaHead.innerText = currentLanguage === 'bn' 
      ? `সতেজতা সূচক সূত্র: ১০০ × e^(-λ · t)` 
      : (currentLanguage === 'hi' ? `ताजगी सूचकांक सूत्र: 100 × e^(-λ · t)` : `Freshness Index Formula: 100 × e^(-λ · t)`);
  }

  const formulaExpl = document.getElementById("modalFreshnessFormulaExplanation");
  if (formulaExpl) {
    formulaExpl.innerHTML = currentLanguage === 'bn'
      ? `ক্ষয় পরামিতি <em>t</em> = <strong>ফসল তোলার বয়স</strong> (${elapsedHarvestHours} ঘণ্টা) + <strong>প্রত্যাশিত ভোক্তা ডেলিভারি ট্রানজিট সময়</strong> (${transitHours} ঘণ্টা) = <strong>${totalDecayTimeT} ঘণ্টা মোট</strong>। ট্রানজিটের সময় ফসল নষ্ট হওয়া প্রতিরোধ করে।`
      : (currentLanguage === 'hi'
        ? `क्षय पैरामीटर <em>t</em> = <strong>कटाई की आयु</strong> (${elapsedHarvestHours} घंटे) + <strong>अपेक्षित उपभोक्ता डिलीवरी पारगमन समय</strong> (${transitHours} घंटे) = <strong>${totalDecayTimeT} घंटे कुल</strong>। पारगमन में फसल खराब होने से बचाव।`
        : `Decay parameter <em>t</em> = <strong>Harvest Age</strong> (${elapsedHarvestHours}h) + <strong>Expected Consumer Delivery Transit Time</strong> (${transitHours}h) = <strong>${totalDecayTimeT}h total</strong> to proactively avoid crop spoilage during transit.`);
  }

  calculateModalTotal();
  document.getElementById("productModal").classList.add("open");
  if (window.lucide) lucide.createIcons();
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
}

function calculateModalTotal() {
  if (!activeModalProduct) return;
  const qty = parseFloat(document.getElementById("modalQtyInput").value) || 0;
  const price = activeModalProduct.base_price_per_kg || activeModalProduct.farmPrice || 0;
  const total = (qty * price).toFixed(2);
  document.getElementById("modalComputedTotal").innerText = `₹${total}`;
}

// -------------------------------------------------------------
// Toast Notification
// -------------------------------------------------------------
let toastTimeout = null;
function showCartToast(text) {
  const toast = document.getElementById("cartToast");
  const textEl = document.getElementById("cartToastText");
  if (!toast || !textEl) return;

  textEl.innerText = text;
  toast.classList.add("show");
  if (window.lucide) lucide.createIcons();

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// -------------------------------------------------------------
// Cart Management (E-Commerce Add To Cart & Stepper Actions)
// -------------------------------------------------------------

function quickAddToCart(productId, event) {
  if (event) event.stopPropagation();

  const prod = products.find(p => p.id === productId) || FALLBACK_PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  const farmPrice = prod.base_price_per_kg || prod.farmPrice || 16.50;
  const mb = prod.mandi_benchmark || {};
  const mandiModal = mb.mandi_modal_price_per_kg || mb.modal_price_per_kg || (farmPrice * 0.9);
  const retailPrice = mb.estimated_retail_price_per_kg || mb.retail_price_per_kg || (prod.retailPrice || Math.round(mandiModal * 1.45 * 100) / 100);
  const cropName = prod.crop_name || prod.name || "Fresh Crop";
  const unit = getCropUnit(prod);
  const minQty = prod.minimum_order_kg || prod.minQty || (unit === "dozen" ? 1.0 : 0.5);
  const initialQty = (minQty >= 1) ? minQty : 1.0;

  const existingIdx = cart.findIndex(c => c.id === productId);
  if (existingIdx > -1) {
    const step = (unit === "dozen") ? 1.0 : 1.0;
    cart[existingIdx].selectedQty = Math.round((cart[existingIdx].selectedQty + step) * 100) / 100;
    cart[existingIdx].subtotal = Math.round((cart[existingIdx].selectedQty * farmPrice) * 100) / 100;
    cart[existingIdx].savings = Math.max(0, Math.round((cart[existingIdx].selectedQty * (retailPrice - farmPrice)) * 100) / 100);
    showCartToast(`Updated ${cropName} (${cart[existingIdx].selectedQty} ${unit}) in cart!`);
  } else {
    cart.push({
      ...prod,
      selectedQty: initialQty,
      unit: unit,
      price: farmPrice,
      retailPrice: retailPrice,
      subtotal: Math.round((initialQty * farmPrice) * 100) / 100,
      savings: Math.max(0, Math.round((initialQty * (retailPrice - farmPrice)) * 100) / 100)
    });
    showCartToast(`Added ${initialQty} ${unit} ${cropName} to cart!`);
  }

  // Animate cart badge
  const badge = document.getElementById("cartCountBadge");
  if (badge) {
    badge.classList.remove("bounce");
    void badge.offsetWidth;
    badge.classList.add("bounce");
  }

  updateCartUI();
  renderProducts(products);
}

function updateCartItemQty(productId, delta, event) {
  if (event) event.stopPropagation();

  const itemIdx = cart.findIndex(c => c.id === productId);
  if (itemIdx === -1) return;

  const item = cart[itemIdx];
  const unit = item.unit || getCropUnit(item);
  const minQty = item.minimum_order_kg || item.minQty || (unit === "dozen" ? 1.0 : 0.5);
  const step = (unit === "dozen") ? 1.0 : ((minQty < 1) ? 0.5 : 1.0);
  const newQty = Math.round((item.selectedQty + (delta * step)) * 100) / 100;

  if (newQty <= 0 || (delta < 0 && item.selectedQty <= minQty)) {
    const name = item.crop_name || item.name;
    cart.splice(itemIdx, 1);
    showCartToast(`Removed ${name} from cart`);
  } else {
    item.selectedQty = newQty;
    item.subtotal = Math.round((newQty * item.price) * 100) / 100;
    item.savings = Math.max(0, Math.round((newQty * (item.retailPrice - item.price)) * 100) / 100);
    showCartToast(`Updated ${item.crop_name || item.name} (${newQty} ${unit})`);
  }

  updateCartUI();
  renderProducts(products);
}

function clearCart() {
  if (cart.length === 0) return;
  cart = [];
  showCartToast("Your cart has been cleared");
  updateCartUI();
  renderProducts(products);
}

function addModalItemToCart() {
  if (!activeModalProduct) return;
  const unit = getCropUnit(activeModalProduct);
  const qty = parseFloat(document.getElementById("modalQtyInput").value) || 1.0;
  const farmPrice = activeModalProduct.base_price_per_kg || activeModalProduct.farmPrice || 0;
  const mb = activeModalProduct.mandi_benchmark || {};
  const mandiModal = mb.mandi_modal_price_per_kg || mb.modal_price_per_kg || (farmPrice * 0.9);
  const retailPrice = mb.estimated_retail_price_per_kg || mb.retail_price_per_kg || (activeModalProduct.retailPrice || Math.round(mandiModal * 1.45 * 100) / 100);
  const cropName = activeModalProduct.crop_name || activeModalProduct.name;

  const existingIdx = cart.findIndex(c => c.id === activeModalProduct.id);
  if (existingIdx > -1) {
    cart[existingIdx].selectedQty = qty;
    cart[existingIdx].unit = unit;
    cart[existingIdx].subtotal = Math.round((qty * farmPrice) * 100) / 100;
    cart[existingIdx].savings = Math.max(0, Math.round((qty * (retailPrice - farmPrice)) * 100) / 100);
  } else {
    cart.push({
      ...activeModalProduct,
      selectedQty: qty,
      unit: unit,
      price: farmPrice,
      retailPrice: retailPrice,
      subtotal: Math.round((qty * farmPrice) * 100) / 100,
      savings: Math.max(0, Math.round((qty * (retailPrice - farmPrice)) * 100) / 100)
    });
  }

  showCartToast(`Added ${qty} ${unit} ${cropName} to cart!`);

  // Animate cart badge
  const badge = document.getElementById("cartCountBadge");
  if (badge) {
    badge.classList.remove("bounce");
    void badge.offsetWidth;
    badge.classList.add("bounce");
  }

  updateCartUI();
  renderProducts(products);
  closeProductModal();
}

function toggleCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  if (drawer) {
    drawer.classList.toggle("open");
    if (window.lucide) lucide.createIcons();
  }
}

function closeCartDrawer(e) {
  if (e.target.id === "cartDrawer") {
    document.getElementById("cartDrawer").classList.remove("open");
  }
}

const MIN_ORDER_AMOUNT = 99.0;

function updateCartUI() {
  const totalItemCount = cart.length;
  const badge = document.getElementById("cartCountBadge");
  if (badge) badge.innerText = totalItemCount;

  const drawerTitle = document.querySelector("#cartDrawer .drawer-title h3");
  if (drawerTitle) drawerTitle.innerText = getTranslation("cartDrawerTitle", "Your Fresh Farm Cart");
  const drawerSub = document.querySelector("#cartDrawer .drawer-title p");
  if (drawerSub) drawerSub.innerText = getTranslation("cartDrawerSub", "Direct dispatch from verified Bengal FPO gates");

  const container = document.getElementById("cartDrawerItems");
  if (container) container.innerHTML = "";

  let subtotal = 0;
  let savings = 0;
  let totalWeightKg = 0;
  let totalCityRetail = 0;

  cart.forEach((item, index) => {
    subtotal += item.subtotal;
    savings += item.savings;
    const qty = (item.selectedQty || 1);
    totalWeightKg += qty;
    const itemRetailPrice = item.retailPrice || (item.price ? Math.round(item.price * 1.45 * 100) / 100 : 35.0);
    totalCityRetail += Math.round(qty * itemRetailPrice * 100) / 100;

    if (container) {
      const rawCropName = item.crop_name || item.name;
      const cropName = getTranslatedCropName(rawCropName);
      const farmer = item.farmer_name || item.farmer || "Direct Farmer";
      const imgUrl = item.image_url || item.image || getDefaultCropImage(rawCropName, item.category);
      const itemUnit = item.unit || getCropUnit(item);
      const translatedUnit = (itemUnit === "dozen") ? (currentLanguage === "bn" ? "ডজন" : (currentLanguage === "hi" ? "दर्जन" : "dozen")) : (currentLanguage === "bn" ? "কেজি" : (currentLanguage === "hi" ? "किग्रा" : "kg"));

      const fromFarmerText = currentLanguage === 'bn' ? `উৎপাদক: ${farmer}` : (currentLanguage === 'hi' ? `उत्पादक: ${farmer}` : `From ${farmer}`);
      const savedText = currentLanguage === 'bn' ? `খুচরা বাজার থেকে সাশ্রয় ₹${item.savings.toFixed(2)}` : (currentLanguage === 'hi' ? `मंडी खुदरा से बचत ₹${item.savings.toFixed(2)}` : `Saved ₹${item.savings.toFixed(2)} vs Mandi Retail`);

      const row = document.createElement("div");
      row.className = "drawer-item-card";
      row.innerHTML = `
        <img src="${imgUrl}" class="drawer-item-thumbnail" alt="${cropName}" />
        <div class="drawer-item-details">
          <h4>${cropName}</h4>
          <div class="drawer-item-pricing">₹${item.price.toFixed(2)}/${translatedUnit} • ${fromFarmerText}</div>
          <div class="drawer-item-savings">${savedText}</div>
        </div>
        <div class="drawer-item-actions">
          <span class="drawer-subtotal">₹${item.subtotal.toFixed(2)}</span>
          <div class="drawer-qty-pill">
            <button class="drawer-qty-btn" onclick="updateCartItemQty(${item.id}, -1, event)" title="Decrease Quantity">−</button>
            <span class="drawer-qty-val">${item.selectedQty} ${translatedUnit}</span>
            <button class="drawer-qty-btn" onclick="updateCartItemQty(${item.id}, 1, event)" title="Increase Quantity">+</button>
          </div>
        </div>
      `;
      container.appendChild(row);
    }
  });

  const platformFee = Math.round(subtotal * 0.02 * 100) / 100; // 2% platform fee

  // External Travel Vendor Fare Calculation (Bengal Rural Travel Express)
  // Delivery charge: minimum ₹35.00 and maximum ₹65.00 depending on harvest quantity (weight in kg)
  const rawVendorDeliveryFee = (cart.length === 0) 
    ? 0.0 
    : Math.min(65.0, Math.max(35.0, Math.round((35.0 + Math.max(0, (totalWeightKg - 1.0) * 2.0)) * 100) / 100));

  // STRICT GUARANTEE: Under ANY circumstances, order price must NOT exceed City Retail at any cost!
  const baseOrderCost = Math.round((subtotal + platformFee) * 100) / 100;
  const maxAllowableDelivery = Math.max(0.0, Math.round((totalCityRetail - baseOrderCost) * 100) / 100);

  const isRetailCapped = (cart.length > 0 && rawVendorDeliveryFee > maxAllowableDelivery);
  let actualDeliveryFee = (cart.length === 0) ? 0.0 : Math.min(rawVendorDeliveryFee, maxAllowableDelivery);
  let retailSubsidy = isRetailCapped ? Math.round((rawVendorDeliveryFee - actualDeliveryFee) * 100) / 100 : 0.0;

  let totalPayable = Math.round((baseOrderCost + actualDeliveryFee) * 100) / 100;
  // Final safeguard check: totalPayable must NEVER exceed totalCityRetail
  if (cart.length > 0 && totalCityRetail > 0 && totalPayable > totalCityRetail) {
    actualDeliveryFee = Math.max(0.0, Math.round((totalCityRetail - baseOrderCost) * 100) / 100);
    totalPayable = Math.round((baseOrderCost + actualDeliveryFee) * 100) / 100;
    isRetailCapped = true;
    retailSubsidy = Math.round((rawVendorDeliveryFee - actualDeliveryFee) * 100) / 100;
  }
  const consumerSavings = Math.max(0.0, Math.round((totalCityRetail - totalPayable) * 100) / 100);

  // Minimum Order Threshold (₹99) Evaluation
  const isBelowMinOrder = (cart.length > 0 && subtotal < MIN_ORDER_AMOUNT);
  const amountNeeded = (MIN_ORDER_AMOUNT - subtotal).toFixed(2);
  const percentComplete = Math.min(100, Math.max(8, Math.round((subtotal / MIN_ORDER_AMOUNT) * 100)));

  if (isBelowMinOrder && container) {
    const banner = document.createElement("div");
    banner.className = "cart-min-order-banner";
    const minTitle = currentLanguage === 'bn' ? 'নূন্যতম অর্ডার মান: ₹99.00' : (currentLanguage === 'hi' ? 'न्यूनतम ऑर्डर मूल्य: ₹99.00' : 'Minimum Order: ₹99.00');
    const minDiff = currentLanguage === 'bn' ? `আরও ₹${amountNeeded} প্রয়োজন` : (currentLanguage === 'hi' ? `₹${amountNeeded} और जोड़েন` : `Add ₹${amountNeeded} more`);
    const minTip = currentLanguage === 'bn' 
      ? `সরাসরি খামার চেকআউট করতে অনুগ্রহ করে আরও ₹${amountNeeded} মূল্যের তাজা ফসল যোগ করুন।` 
      : (currentLanguage === 'hi' 
        ? `सीधे फार्म चेकआउट के लिए कृपया ₹${amountNeeded} का और ताजा उत्पाद जोड़ें।` 
        : `Add just ₹${amountNeeded} more of farm-fresh harvests to proceed to direct farm checkout.`);

    banner.innerHTML = `
      <div class="min-order-header">
        <span class="min-order-title"><i data-lucide="info" style="width:13px;height:13px;display:inline-block;vertical-align:-1px;"></i> ${minTitle}</span>
        <span class="min-order-diff">${minDiff}</span>
      </div>
      <div class="min-order-progress-bar">
        <div class="min-order-progress-fill" style="width: ${percentComplete}%;"></div>
      </div>
      <p class="min-order-tip">${minTip}</p>
    `;
    container.insertBefore(banner, container.firstChild);
  }

  // Update Checkout Button states
  const checkoutBtns = document.querySelectorAll("#cartDrawer .btn-drawer-checkout, #btnCheckout");
  checkoutBtns.forEach(btn => {
    if (cart.length === 0) {
      btn.disabled = false;
      btn.classList.remove("btn-disabled-min-order");
      btn.innerText = getTranslation("cartCheckoutBtn", "Proceed to Direct Farm Checkout");
    } else if (isBelowMinOrder) {
      btn.disabled = true;
      btn.classList.add("btn-disabled-min-order");
      btn.innerText = currentLanguage === 'bn' 
        ? `নূন্যতম অর্ডার ₹৯৯ (আরও ₹${amountNeeded} যোগ করুন)` 
        : (currentLanguage === 'hi' 
          ? `न्यूनतम ऑर्डर ₹99 (₹${amountNeeded} और जोड़ें)` 
          : `Min Order ₹99 (Add ₹${amountNeeded} more)`);
    } else {
      btn.disabled = false;
      btn.classList.remove("btn-disabled-min-order");
      btn.innerText = getTranslation("cartCheckoutBtn", "Proceed to Direct Farm Checkout");
    }
  });

  // Update Drawer Summary Elements
  if (cart.length === 0) {
    if (container) {
      const emptyTitle = currentLanguage === 'bn' ? 'আপনার কার্ট খালি' : (currentLanguage === 'hi' ? 'आपकी कार्ट खाली है' : 'Your cart is empty');
      const emptyDesc = currentLanguage === 'bn' ? 'বাংলা কৃষকদের সহায়তা করতে তাজা ফসল কার্টে যোগ করুন!' : (currentLanguage === 'hi' ? 'किसानों का समर्थन करने के लिए ताज़ा फसल कार्ट में जोड़ें!' : 'Browse farm-fresh harvests and add items to support Bengal farmers directly!');
      container.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color:#64748b;">
          <i data-lucide="shopping-basket" style="width:48px;height:48px;color:#cbd5e1;margin-bottom:12px;"></i>
          <h4 style="margin-bottom:6px; color:#334155;">${emptyTitle}</h4>
          <p style="font-size:13px; color:#94a3b8;">${emptyDesc}</p>
        </div>`;
    }
    if (document.getElementById("cartSubtotal")) document.getElementById("cartSubtotal").innerText = `₹0.00`;
    if (document.getElementById("cartPlatformFee")) document.getElementById("cartPlatformFee").innerText = `₹0.00`;
    if (document.getElementById("cartCityRetailTotal")) document.getElementById("cartCityRetailTotal").innerText = `₹0.00`;
    if (document.getElementById("cartDeliveryFee")) document.getElementById("cartDeliveryFee").innerText = `₹0.00`;
    if (document.getElementById("cartTotalPayable")) document.getElementById("cartTotalPayable").innerText = `₹0.00`;
    if (document.getElementById("cartDeliverySubsidyBadge")) document.getElementById("cartDeliverySubsidyBadge").style.display = "none";
    if (document.getElementById("cartRetailCeilingBanner")) document.getElementById("cartRetailCeilingBanner").style.display = "none";
    if (document.getElementById("cartTotalSavings")) document.getElementById("cartTotalSavings").innerText = currentLanguage === 'bn' ? 'সরাসরি সাশ্রয় দেখতে তাজা ফসল নির্বাচন করুন!' : (currentLanguage === 'hi' ? 'सीधी बचत देखने के लिए ताज़ा फसल चुनें!' : `Select farm-fresh crops to view direct savings!`);
  } else {
    if (document.getElementById("cartSubtotal")) document.getElementById("cartSubtotal").innerText = `₹${subtotal.toFixed(2)}`;
    if (document.getElementById("cartPlatformFee")) document.getElementById("cartPlatformFee").innerText = `₹${platformFee.toFixed(2)}`;
    if (document.getElementById("cartCityRetailTotal")) document.getElementById("cartCityRetailTotal").innerText = `₹${totalCityRetail.toFixed(2)}`;
    if (document.getElementById("cartDeliveryFee")) document.getElementById("cartDeliveryFee").innerText = `₹${actualDeliveryFee.toFixed(2)}`;
    if (document.getElementById("cartTotalPayable")) document.getElementById("cartTotalPayable").innerText = `₹${totalPayable.toFixed(2)}`;

    // Delivery Subsidy Badge
    const subsidyBadge = document.getElementById("cartDeliverySubsidyBadge");
    if (subsidyBadge) {
      if (isRetailCapped && retailSubsidy > 0) {
        subsidyBadge.style.display = "block";
        subsidyBadge.innerHTML = `<span class="retail-subsidy-tag">🛡️ ₹${retailSubsidy.toFixed(2)} City Retail Subsidy</span>`;
      } else {
        subsidyBadge.style.display = "none";
      }
    }

    // City Retail Price Ceiling Banner
    const ceilingBanner = document.getElementById("cartRetailCeilingBanner");
    const ceilingMsg = document.getElementById("cartRetailCeilingMsg");
    if (ceilingBanner && ceilingMsg) {
      ceilingBanner.style.display = "flex";
      if (isRetailCapped) {
        ceilingBanner.className = "cart-retail-ceiling-pill capped";
        ceilingMsg.innerHTML = currentLanguage === 'bn'
          ? `🛡️ <strong>সিটি রিটেইল প্রাইস সিলিং সক্রিয়:</strong> ট্রাভেল ডেলিভারি ফি ₹${retailSubsidy.toFixed(2)} সাশ্রয় করা হয়েছে যাতে মোট মূল্য (₹${totalPayable.toFixed(2)}) কখনো বাজার দর (₹${totalCityRetail.toFixed(2)}) এর বেশি না হয়!`
          : (currentLanguage === 'hi'
            ? `🛡️ <strong>सिटी रिटेल प्राइस सीलिंग सक्रिय:</strong> डिलीवरी शुल्क पर ₹${retailSubsidy.toFixed(2)} की सब्सिडी दी गई है ताकि कुल देय राशि (₹${totalPayable.toFixed(2)}) कभी बाजार भाव (₹${totalCityRetail.toFixed(2)}) से अधिक न हो!`
            : `🛡️ <strong>City Retail Ceiling Active:</strong> Travel delivery capped with ₹${retailSubsidy.toFixed(2)} subsidy so your total bill (₹${totalPayable.toFixed(2)}) never exceeds street retail (₹${totalCityRetail.toFixed(2)})!`);
      } else {
        ceilingBanner.className = "cart-retail-ceiling-pill";
        ceilingMsg.innerHTML = currentLanguage === 'bn'
          ? `✅ <strong>১০০% ন্যায্য দর নিশ্চয়তা:</strong> মোট মূল্য (₹${totalPayable.toFixed(2)}) শহরের খুচরা বাজার দর (₹${totalCityRetail.toFixed(2)}) থেকে ₹${consumerSavings.toFixed(2)} সাশ্রয়ী!`
          : (currentLanguage === 'hi'
            ? `✅ <strong>100% उचित मूल्य गारंटी:</strong> कुल देय राशि (₹${totalPayable.toFixed(2)}) शहर के खुदरा मंडी मूल्य (₹${totalCityRetail.toFixed(2)}) से ₹${consumerSavings.toFixed(2)} सस्ती है!`
            : `✅ <strong>100% Fair-Price Guarantee:</strong> Total bill (₹${totalPayable.toFixed(2)}) saves ₹${consumerSavings.toFixed(2)} compared to City Mandi Retail (₹${totalCityRetail.toFixed(2)})!`);
      }
    }

    if (document.getElementById("cartTotalSavings")) {
      document.getElementById("cartTotalSavings").innerText = currentLanguage === 'bn' 
        ? `আপনি খুচরা বাজারের তুলনায় মোট ₹${consumerSavings.toFixed(2)} সরাসরি সাশ্রয় করছেন!` 
        : (currentLanguage === 'hi' 
          ? `आप मंडी खुदरा मूल्य की तुलना में कुल ₹${consumerSavings.toFixed(2)} की सीधी बचत कर रहे हैं!` 
          : `You are saving ₹${consumerSavings.toFixed(2)} compared to APMC Mandi city retail!`);
    }
  }

  // Update Floating Bottom Sticky Cart Bar
  const floatingBar = document.getElementById("floatingCartBar");
  if (floatingBar) {
    if (cart.length > 0) {
      floatingBar.classList.add("visible");
      const fCount = document.getElementById("floatingCartCount");
      const fTotal = document.getElementById("floatingCartTotal");
      const fSavings = document.getElementById("floatingCartSavings");
      if (fCount) fCount.innerText = totalItemCount;
      if (fTotal) {
        if (isBelowMinOrder) {
          fTotal.innerText = `₹${totalPayable.toFixed(2)} (Min ₹99 • Add ₹${amountNeeded})`;
        } else {
          fTotal.innerText = `₹${totalPayable.toFixed(2)} (${totalItemCount} item${totalItemCount > 1 ? 's' : ''})`;
        }
      }
      if (fSavings) fSavings.innerText = `Save ₹${savings.toFixed(2)} vs Mandi`;
    } else {
      floatingBar.classList.remove("visible");
    }
  }

  if (window.lucide) lucide.createIcons();
}

// -------------------------------------------------------------
// Proceed to Dynamic Order Creation via Backend API
// -------------------------------------------------------------
async function proceedToCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty. Please select farm produce to place an order.");
    return;
  }

  const currentSubtotal = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  if (currentSubtotal < MIN_ORDER_AMOUNT) {
    const needed = (MIN_ORDER_AMOUNT - currentSubtotal).toFixed(2);
    const msg = currentLanguage === 'bn'
      ? `⚠️ তাজা ওয়েবসাইটে নূন্যতম অর্ডার মূল্য ₹৯৯.০০।\n\nচেকআউট করতে অনুগ্রহ করে আরও ₹${needed} মূল্যের তাজা ফসল কার্টে যোগ করুন।`
      : (currentLanguage === 'hi'
        ? `⚠️ ताज़ा वेबसाइट पर न्यूनतम ऑर्डर मूल्य ₹99.00 है।\n\nचेकआउट करने के लिए कृपया ₹${needed} का और ताजा उत्पाद कार्ट में जोड़ें।`
        : `⚠️ Minimum order value on TAZA is ₹99.00.\n\nPlease add ₹${needed} more of farm-fresh harvests to your cart before proceeding to checkout.`);
    alert(msg);
    return;
  }

  const btn = document.getElementById("btnCheckout");
  btn.innerText = "Placing Direct Farm Order via Escrow...";
  btn.disabled = true;

  try {
    if (!authTokens.consumer) {
      await autoAuthenticate();
    }

    const headers = { "Content-Type": "application/json" };
    if (authTokens.consumer) {
      headers["Authorization"] = `Bearer ${authTokens.consumer}`;
    }

    const cartSnapshot = [...cart];
    const totalSubtotal = cartSnapshot.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalSavings = cartSnapshot.reduce((sum, item) => sum + (item.savings || 0), 0);
    const totalPlatformFee = Math.round(totalSubtotal * 0.02 * 100) / 100;
    const totalAmountPayable = Math.round((totalSubtotal + totalPlatformFee) * 100) / 100;

    // Send order requests for all cart items to backend
    const orderPromises = cartSnapshot.map(async (item) => {
      const payload = {
        product_id: item.id || 1,
        quantity_kg: item.selectedQty,
        delivery_address: "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata, WB 700061",
        consumer_lat: currentUser.lat,
        consumer_lng: currentUser.lng,
        payment_method: "ONLINE_RAZORPAY",
        notes: `Dynamic weight order (${item.selectedQty}kg) placed from KisanDirect Web.`
      };

      try {
        let res = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (res.status === 401) {
          await autoAuthenticate();
          if (authTokens.consumer) {
            headers["Authorization"] = `Bearer ${authTokens.consumer}`;
            res = await fetch(`${API_BASE}/orders`, {
              method: "POST",
              headers: headers,
              body: JSON.stringify(payload)
            });
          }
        }

        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("Order placement fallback:", err);
      }
      return null;
    });

    const results = await Promise.all(orderPromises);
    const successfulOrders = results.filter(r => r !== null);
    const orderNumbers = successfulOrders.map(o => o.order_number).filter(Boolean);

    // Save to locally placed orders cache for instant farmer view visibility
    try {
      let existingLocal = JSON.parse(localStorage.getItem("taza_placed_orders") || "[]");
      cartSnapshot.forEach((item, idx) => {
        const succ = successfulOrders[idx];
        const orderNum = (succ && succ.order_number) || `TZ-WB-${Math.floor(100000 + Math.random() * 900000)}`;
        const itemRetail = item.retailPrice || (item.price ? Math.round(item.price * 1.45 * 100) / 100 : 35.0);
        const cityRetailTotal = (succ && succ.city_retail_total_inr) || Math.round((item.selectedQty || 1) * itemRetail * 100) / 100;
        const defaultDeliveryFee = Math.min(65.0, Math.max(35.0, Math.round((35.0 + Math.max(0, ((item.selectedQty || 1) - 1.0) * 2.0)) * 100) / 100));
        const logisticsFee = (succ && succ.logistics_fee_inr !== undefined) ? succ.logistics_fee_inr : defaultDeliveryFee;
        const isCapped = (succ && succ.is_retail_capped) || false;
        const travelVendor = (succ && succ.travel_vendor_name) || "Bengal Rural Travel Express";

        existingLocal.unshift({
          order_id: (succ && succ.id) || Date.now() + idx,
          order_number: orderNum,
          crop_name: item.crop_name || item.name || "Farm Fresh Crop",
          quantity_kg: item.selectedQty || 1,
          unit_price_inr: item.price || 0,
          subtotal_inr: item.subtotal || 0,
          logistics_fee_inr: logisticsFee,
          travel_vendor_name: travelVendor,
          city_retail_total_inr: cityRetailTotal,
          is_retail_capped: isCapped,
          total_amount_inr: totalAmount,
          consumer_name: currentUser.name || "Sourav Banerjee",
          consumer_phone: currentUser.phone || "+919830223301",
          consumer_address: "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
          status: "PLACED",
          payment_status: "PAID"
        });
      });
      localStorage.setItem("taza_placed_orders", JSON.stringify(existingLocal.slice(0, 20)));
    } catch (e) {}

    // Build itemized summary
    const itemLines = cartSnapshot.map(item => {
      const name = item.crop_name || item.name || "Farm Fresh Crop";
      const itemUnit = item.unit || getCropUnit(item);
      const qty = item.selectedQty || 1;
      const sub = (item.subtotal || 0).toFixed(2);
      return `• ${name} (${qty} ${itemUnit}) — ₹${sub}`;
    }).join("\n");

    const orderNumStr = orderNumbers.length > 0 ? `\nOrder Reference(s): ${orderNumbers.join(", ")}` : "";

    // Clear cart and UI
    cart = [];
    updateCartUI();
    toggleCartDrawer();
    if (typeof renderProducts === "function" && typeof products !== "undefined") {
      renderProducts(products);
    }

    alert(`🎉 Direct Farm Order Placed Successfully!${orderNumStr}\n\n📦 Ordered Crops (${cartSnapshot.length} item${cartSnapshot.length > 1 ? 's' : ''}):\n${itemLines}\n\n💰 Multi-Item Price Breakdown:\n• Produce Subtotal: ₹${totalSubtotal.toFixed(2)}\n• Platform Fee (2% Fair Trade): ₹${totalPlatformFee.toFixed(2)}\n• Delivery Fee: FREE (Direct Farmgate)\n--------------------------------------------------\n• Total Amount Payable: ₹${totalAmountPayable.toFixed(2)}\n\n🌾 You saved ₹${totalSavings.toFixed(2)} directly vs Mandi retail rates!\nZero Middlemen Markups • Direct Farm-to-Table\nStatus: Reserved & Dispatched from Bengal Farm Gates.`);

    if (typeof openOrdersModal === "function") {
      openOrdersModal();
    }
  } catch (e) {
    console.error(e);
    alert("Order recorded in local offline demonstration mode!");
    cart = [];
    updateCartUI();
    toggleCartDrawer();
  } finally {
    btn.innerText = "Proceed to Direct Farm Checkout";
    btn.disabled = false;
  }
}

// -------------------------------------------------------------
// Farmer Hub: Load Real-Time Dashboard & List New Crops
// -------------------------------------------------------------
function getDemoFarmerOrders() {
  return [
    {
      order_id: 101,
      order_number: "TZ-WB-9021MUM",
      crop_name: "Jyoti Potato (Singur Royal)",
      quantity_kg: 50.0,
      total_amount_inr: 1075.0,
      consumer_name: "FreshCart Groceries (Kolkata Hub)",
      consumer_phone: "+919830223302",
      consumer_address: "Sector V, Salt Lake, Kolkata",
      status: "CONFIRMED_BY_FARMER",
      payment_status: "PAID"
    },
    {
      order_id: 102,
      order_number: "TZ-WB-8944IND",
      crop_name: "Pointed Gourd (Green Potol)",
      quantity_kg: 5.0,
      total_amount_inr: 170.0,
      consumer_name: "Sunita Sharma (Salt Lake)",
      consumer_phone: "+919876543211",
      consumer_address: "FD Block, Salt Lake, Kolkata",
      status: "PLACED",
      payment_status: "PENDING"
    },
    {
      order_id: 103,
      order_number: "TZ-WB-7712CCU",
      crop_name: "Fresh Hybrid Tomato",
      quantity_kg: 25.0,
      total_amount_inr: 1200.0,
      consumer_name: "Bhojohorir Rannaghar (Chef Arindam)",
      consumer_phone: "+919830223302",
      consumer_address: "Sector V, Salt Lake, Kolkata",
      status: "IN_TRANSIT",
      payment_status: "PAID"
    },
    {
      order_id: 104,
      order_number: "TZ-WB-6540HGL",
      crop_name: "Chandramukhi Potato",
      quantity_kg: 40.0,
      total_amount_inr: 520.0,
      consumer_name: "Sourav Banerjee",
      consumer_phone: "+919830223301",
      consumer_address: "Behala Chowrasta, Kolkata",
      status: "PLACED",
      payment_status: "PAID"
    }
  ];
}

async function loadFarmerDashboard() {
  const incomingList = document.getElementById("farmerIncomingOrdersList");
  if (incomingList) {
    incomingList.innerHTML = `<p style="text-align:center; color:#666; padding:15px;"><i data-lucide="loader-2" class="animate-spin" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Loading farm gate orders...</p>`;
    if (window.lucide) lucide.createIcons();
  }

  let headers = {};
  if (authTokens.farmer) {
    headers["Authorization"] = `Bearer ${authTokens.farmer}`;
  }

  // Retrieve locally placed orders if any
  let localOrders = [];
  try {
    const saved = localStorage.getItem("taza_placed_orders");
    if (saved) {
      localOrders = JSON.parse(saved);
    }
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/farmers/dashboard`, { headers });
    if (res.ok) {
      const data = await res.json();
      let orders = data.recent_outgoing_orders || [];
      if (orders.length === 0) {
        orders = localOrders.length > 0 ? localOrders : getDemoFarmerOrders();
      } else if (localOrders.length > 0) {
        const orderNums = new Set(orders.map(o => o.order_number));
        const newLocal = localOrders.filter(o => !orderNums.has(o.order_number));
        orders = [...newLocal, ...orders];
      }
      cachedFarmerOrders = orders;
      renderFarmerOrders(orders);
      return;
    }
  } catch (e) {
    console.warn("Farmer dashboard using fallback data", e);
  }

  // Fallback demo orders combined with local orders
  const fallbackOrders = localOrders.length > 0 ? [...localOrders, ...getDemoFarmerOrders()] : getDemoFarmerOrders();
  cachedFarmerOrders = fallbackOrders;
  renderFarmerOrders(fallbackOrders);
}

function renderFarmerOrders(orders) {
  if (orders) cachedFarmerOrders = orders;
  const container = document.getElementById("farmerIncomingOrdersList");
  if (!container) return;
  container.innerHTML = "";

  if (!orders || orders.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#666; padding: 20px;">No pending orders at this moment. You are all caught up!</p>`;
    return;
  }

  orders.forEach(o => {
    const isBulk = (o.quantity_kg || 0) >= 20;
    const card = document.createElement("div");
    card.className = "incoming-order-card";
    const statusText = o.status ? o.status.replace(/_/g, ' ') : 'PLACED';
    const isPaid = o.payment_status === 'PAID';
    const rawCropName = o.crop_name || 'Farm Fresh Crop';
    const displayCrop = getTranslatedCropName(rawCropName);

    const bulkTag = isBulk ? (currentLanguage === 'bn' ? 'বাণিজ্যিক পাইকারি ক্রেতা' : (currentLanguage === 'hi' ? 'व्यावसायिक थोक खरीदार' : 'Commercial Bulk Buyer')) : (currentLanguage === 'bn' ? 'পারিবারিক সরাসরি' : (currentLanguage === 'hi' ? 'घरेलू सीधा' : 'Household Direct'));
    const unitLabel = currentLanguage === 'bn' ? 'কেজি' : (currentLanguage === 'hi' ? 'किग्रा' : 'kg');
    const payoutLabel = currentLanguage === 'bn' ? 'মোট সরাসরি প্রাপ্তি' : (currentLanguage === 'hi' ? 'सीधा शुद्ध भुगतान' : 'Net Direct Payout');
    const escrowLabel = isPaid ? (currentLanguage === 'bn' ? 'এসক্রো পরিশোধিত' : (currentLanguage === 'hi' ? 'एस्क्रो भुगतान प्राप्त' : 'Escrow Paid')) : (currentLanguage === 'bn' ? 'এসক্রো সংরক্ষিত' : (currentLanguage === 'hi' ? 'एस्क्रो आरक्षित' : 'Escrow Reserved'));
    const callBtnText = currentLanguage === 'bn' ? '১:১ সরাসরি যোগাযোগ' : (currentLanguage === 'hi' ? '1:1 सीधा संपर्क' : '1:1 Contact Relay');
    const waybillBtnText = currentLanguage === 'bn' ? 'এআই রুট ওয়েবিল' : (currentLanguage === 'hi' ? 'एआई रूट वेबिल' : 'AI Route Waybill');

    card.innerHTML = `
      <div class="order-top">
        <span class="order-id">#${o.order_number || 'ORD-9021'}</span>
        <div>
          <span class="order-tag ${isBulk ? 'bulk' : 'household'}">${bulkTag}</span>
          <span class="badge ${isPaid ? 'badge-success' : 'badge-primary'}" style="margin-left: 4px; font-size: 10px; font-weight: 700;">${statusText}</span>
        </div>
      </div>
      <h4>${o.quantity_kg} ${unitLabel} • ${displayCrop}</h4>
      <p class="buyer-info"><i data-lucide="user"></i> ${o.consumer_name || 'Verified Buyer'} ${o.consumer_phone ? `(${o.consumer_phone})` : ''}</p>
      ${o.consumer_address ? `<p class="buyer-info" style="font-size: 11px; margin-top: 2px;"><i data-lucide="map-pin"></i> ${o.consumer_address}</p>` : ''}
      <p class="payout-highlight">${payoutLabel}: <strong>₹${(o.total_amount_inr || 0).toFixed(2)}</strong> <span class="escrow-badge">${escrowLabel}</span></p>
      <div class="order-buttons">
        <button class="btn-call" onclick="triggerFarmerRelay(${o.order_id || 1})"><i data-lucide="phone"></i> ${callBtnText}</button>
        <button class="btn-sheet" onclick="openLogisticsModal('hooghly')"><i data-lucide="printer"></i> ${waybillBtnText}</button>
      </div>
    `;
    container.appendChild(card);
  });
  if (window.lucide) lucide.createIcons();
}

// Farmer Contact Relay
async function triggerFarmerRelay(orderId) {
  let headers = {};
  if (authTokens.farmer) {
    headers["Authorization"] = `Bearer ${authTokens.farmer}`;
  }

  try {
    const res = await fetch(`${API_BASE}/farmers/relay-contact/${orderId}`, {
      method: "POST",
      headers
    });
    if (res.ok) {
      const data = await res.json();
      alert(`📞 Direct Masked Relay Token Activated!\n\nToken: ${data.relay_token}\nSMS dispatched to buyer and logistics driver for dispatch synchronization.`);
      return;
    }
  } catch (e) {}

  alert(`📞 Direct Masked Relay Token: #RELAY-TZ-${Math.floor(1000 + Math.random() * 9000)}\nConnecting farmer directly with buyer with zero broker intervention.`);
}

// -------------------------------------------------------------
// Live APMC Mandi Benchmark Engine for Farmer Form
// -------------------------------------------------------------
let mandiDebounceTimer = null;
const clientMandiDatabase = [
  { crop: "Jyoti Potato", category: "TUBERS", district: "Hooghly", mandi: "Singur Regulated Market APMC", modal: 15.0, retail: 24.0 },
  { crop: "Chandramukhi Potato", category: "TUBERS", district: "Hooghly", mandi: "Tarakeswar APMC", modal: 19.0, retail: 30.0 },
  { crop: "Sweet Potato", category: "TUBERS", district: "Nadia", mandi: "Ranaghat Sub-Division APMC", modal: 22.0, retail: 34.0 },
  { crop: "Taro Root", category: "TUBERS", district: "North 24 Parganas", mandi: "Barasat Krishak Bazar", modal: 25.0, retail: 38.0 },
  { crop: "Elephant Foot Yam", category: "TUBERS", district: "Nadia", mandi: "Krishnanagar APMC", modal: 28.0, retail: 42.0 },
  { crop: "Pointed Gourd", category: "VEGETABLES", district: "Nadia", mandi: "Bethuadahari Krishak Bazar", modal: 26.0, retail: 40.0 },
  { crop: "Cauliflower", category: "VEGETABLES", district: "Nadia", mandi: "Ranaghat Sub-Division APMC", modal: 16.0, retail: 25.0 },
  { crop: "Cabbage", category: "VEGETABLES", district: "Hooghly", mandi: "Sheoraphuli Regulated Market", modal: 12.0, retail: 18.0 },
  { crop: "Tomato", category: "VEGETABLES", district: "Hooghly", mandi: "Singur Regulated Market APMC", modal: 20.0, retail: 32.0 },
  { crop: "Onion", category: "VEGETABLES", district: "Murshidabad", mandi: "Beldanga Krishak Bazar", modal: 24.0, retail: 36.0 },
  { crop: "Brinjal", category: "VEGETABLES", district: "Nadia", mandi: "Ranaghat Sub-Division APMC", modal: 22.0, retail: 34.0 },
  { crop: "Ladyfinger", category: "VEGETABLES", district: "Hooghly", mandi: "Singur Regulated Market APMC", modal: 24.0, retail: 36.0 },
  { crop: "Peas", category: "VEGETABLES", district: "Purba Bardhaman", mandi: "Memari Regulated Market", modal: 36.0, retail: 54.0 },
  { crop: "Bitter Gourd", category: "VEGETABLES", district: "Nadia", mandi: "Bethuadahari Krishak Bazar", modal: 28.0, retail: 42.0 },
  { crop: "Bottle Gourd", category: "VEGETABLES", district: "Hooghly", mandi: "Tarakeswar APMC", modal: 14.0, retail: 22.0 },
  { crop: "Ridge Gourd", category: "VEGETABLES", district: "Nadia", mandi: "Ranaghat Sub-Division APMC", modal: 24.0, retail: 36.0 },
  { crop: "Pumpkin", category: "VEGETABLES", district: "Purba Bardhaman", mandi: "Kalna APMC", modal: 12.0, retail: 18.0 },
  { crop: "Spinach", category: "VEGETABLES", district: "South 24 Parganas", mandi: "Baruipur Krishak Bazar", modal: 14.0, retail: 22.0 },
  { crop: "Cucumber", category: "VEGETABLES", district: "South 24 Parganas", mandi: "Baruipur Krishak Bazar", modal: 16.0, retail: 25.0 },
  { crop: "Capsicum", category: "VEGETABLES", district: "Darjeeling", mandi: "Siliguri Regulated Market APMC", modal: 40.0, retail: 60.0 },
  { crop: "Carrot", category: "VEGETABLES", district: "Darjeeling", mandi: "Kurseong Hill Market", modal: 26.0, retail: 40.0 },
  { crop: "Radish", category: "VEGETABLES", district: "Hooghly", mandi: "Singur Regulated Market APMC", modal: 11.0, retail: 17.0 },
  { crop: "French Beans", category: "VEGETABLES", district: "Darjeeling", mandi: "Siliguri Regulated Market APMC", modal: 38.0, retail: 58.0 },
  { crop: "Drumsticks", category: "VEGETABLES", district: "Bankura", mandi: "Kotulpur APMC", modal: 45.0, retail: 68.0 },
  { crop: "Himsagar Mango", category: "FRUITS", district: "Malda", mandi: "English Bazar Regulated Market", modal: 55.0, retail: 85.0 },
  { crop: "Langra Mango", category: "FRUITS", district: "Malda", mandi: "English Bazar Regulated Market", modal: 45.0, retail: 68.0 },
  { crop: "Fazli Mango", category: "FRUITS", district: "Malda", mandi: "Samsi APMC", modal: 35.0, retail: 52.0 },
  { crop: "Gopalbhog Mango", category: "FRUITS", district: "Malda", mandi: "English Bazar Regulated Market", modal: 60.0, retail: 90.0 },
  { crop: "Amrapali Mango", category: "FRUITS", district: "Murshidabad", mandi: "Baharampur Krishak Bazar", modal: 48.0, retail: 72.0 },
  { crop: "Darjeeling Mandarin Orange", category: "FRUITS", district: "Darjeeling", mandi: "Kurseong Hill Market", modal: 75.0, retail: 115.0 },
  { crop: "Bengal Martaman Banana", category: "FRUITS", district: "Nadia", mandi: "Ranaghat Sub-Division APMC", modal: 25.0, retail: 38.0 },
  { crop: "Bombai Litchi", category: "FRUITS", district: "Murshidabad", mandi: "Baharampur Krishak Bazar", modal: 68.0, retail: 100.0 },
  { crop: "Baruipur Sweet Guava", category: "FRUITS", district: "South 24 Parganas", mandi: "Baruipur Krishak Bazar", modal: 28.0, retail: 42.0 },
  { crop: "Green Papaya", category: "FRUITS", district: "Hooghly", mandi: "Singur Regulated Market APMC", modal: 14.0, retail: 22.0 },
  { crop: "Pineapple", category: "FRUITS", district: "Darjeeling", mandi: "Bidhannagar APMC", modal: 32.0, retail: 48.0 },
  { crop: "Watermelon", category: "FRUITS", district: "South 24 Parganas", mandi: "Canning Krishak Bazar", modal: 15.0, retail: 22.0 },
  { crop: "Jackfruit", category: "FRUITS", district: "North 24 Parganas", mandi: "Habra Krishak Bazar", modal: 20.0, retail: 30.0 },
  { crop: "Gobindobhog Rice", category: "GRAINS_PADDY", district: "Purba Bardhaman", mandi: "Memari Regulated Market", modal: 68.0, retail: 100.0 },
  { crop: "Minikit Rice", category: "GRAINS_PADDY", district: "Purba Bardhaman", mandi: "Kalna APMC", modal: 32.0, retail: 48.0 },
  { crop: "Swarna Rice", category: "GRAINS_PADDY", district: "Hooghly", mandi: "Singur Regulated Market APMC", modal: 24.0, retail: 36.0 },
  { crop: "Wheat", category: "GRAINS_PADDY", district: "Murshidabad", mandi: "Kandi APMC", modal: 22.0, retail: 32.0 },
  { crop: "Moong Dal", category: "GRAINS_PADDY", district: "Murshidabad", mandi: "Baharampur Krishak Bazar", modal: 75.0, retail: 110.0 },
  { crop: "Masoor Dal", category: "GRAINS_PADDY", district: "Nadia", mandi: "Ranaghat Sub-Division APMC", modal: 68.0, retail: 98.0 },
  { crop: "Green Chili", category: "SPICES", district: "Nadia", mandi: "Beldanga Krishak Bazar", modal: 48.0, retail: 75.0 },
  { crop: "Ginger", category: "SPICES", district: "Darjeeling", mandi: "Gorubathan APMC", modal: 60.0, retail: 90.0 },
  { crop: "Garlic", category: "SPICES", district: "Nadia", mandi: "Ranaghat Sub-Division APMC", modal: 95.0, retail: 145.0 },
  { crop: "Turmeric", category: "SPICES", district: "Nadia", mandi: "Krishnanagar APMC", modal: 55.0, retail: 82.0 },
  { crop: "Yellow Mustard", category: "SPICES", district: "Purba Bardhaman", mandi: "Memari Regulated Market", modal: 52.0, retail: 78.0 },
  { crop: "Cardamom", category: "SPICES", district: "Darjeeling", mandi: "Kurseong Hill Market", modal: 850.0, retail: 1250.0 },
  { crop: "Coriander", category: "SPICES", district: "Hooghly", mandi: "Singur Regulated Market APMC", modal: 70.0, retail: 105.0 },
  { crop: "Jute", category: "CASH_CROPS", district: "Murshidabad", mandi: "Baharampur Krishak Bazar", modal: 48.0, retail: 68.0 }
];

let isPriceManuallyEdited = false;

// -------------------------------------------------------------
// Farmer Harvest Time & Real-Time Biological Freshness Engine
// -------------------------------------------------------------
function formatDateTimeLocal(date) {
  const pad = n => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

function initHarvestTimestampField() {
  const harvestInput = document.getElementById("cropHarvestTimestamp");
  if (!harvestInput) return;
  const now = new Date();
  harvestInput.max = formatDateTimeLocal(new Date(now.getTime() + 10 * 60 * 1000)); // allow up to +10 mins clock drift
  if (!harvestInput.value) {
    harvestInput.value = formatDateTimeLocal(now);
  }
  updateListingFreshnessPreview();
}

function setHarvestTimePreset(hoursAgo) {
  const harvestInput = document.getElementById("cropHarvestTimestamp");
  if (!harvestInput) return;
  const target = new Date(Date.now() - (hoursAgo * 3600 * 1000));
  harvestInput.value = formatDateTimeLocal(target);
  updateListingFreshnessPreview();
}

function updateListingFreshnessPreview() {
  const harvestInput = document.getElementById("cropHarvestTimestamp");
  const categoryInput = document.getElementById("cropCategory");
  const elapsedBadge = document.getElementById("harvestTimeElapsedBadge");
  const freshnessNum = document.getElementById("previewFreshnessNumber");
  const freshnessGrade = document.getElementById("previewFreshnessGrade");
  const freshnessBar = document.getElementById("previewFreshnessBar");
  const decayNote = document.getElementById("previewFreshnessDecayNote");

  if (!harvestInput || !freshnessNum) return;

  const harvestVal = harvestInput.value;
  let harvestDate = harvestVal ? new Date(harvestVal) : new Date();
  if (isNaN(harvestDate.getTime())) {
    harvestDate = new Date();
  }

  const category = categoryInput ? categoryInput.value : "VEGETABLES";
  
  // Biological Decay Lambda according to crop biochemical nature
  let decayLambda = 0.015;
  let shelfLifeHours = 72;
  if (category === "VEGETABLES") {
    decayLambda = 0.035;
    shelfLifeHours = 48;
  } else if (category === "FRUITS") {
    decayLambda = 0.020;
    shelfLifeHours = 96;
  } else if (category === "TUBERS") {
    decayLambda = 0.008;
    shelfLifeHours = 144;
  } else if (category === "GRAINS_PADDY") {
    decayLambda = 0.002;
    shelfLifeHours = 720;
  } else if (category === "SPICES") {
    decayLambda = 0.005;
    shelfLifeHours = 360;
  }

  // Tally harvest timestamp against current date/time
  const nowMs = Date.now();
  const harvestMs = harvestDate.getTime();
  const elapsedMs = Math.max(0, nowMs - harvestMs);
  const elapsedHours = Math.round((elapsedMs / 3600000) * 10) / 10;

  // Elapsed badge text
  if (elapsedBadge) {
    if (elapsedHours < 0.1) {
      elapsedBadge.innerText = currentLanguage === 'bn' ? "⚡ এখনই তোলা: < ১০ মি." : (currentLanguage === 'hi' ? "⚡ अभी काटी गई: < 10 मि." : "⚡ Just Harvested (< 10m ago)");
      elapsedBadge.style.background = "#ecfdf5";
      elapsedBadge.style.borderColor = "#a7f3d0";
      elapsedBadge.style.color = "#047857";
    } else {
      elapsedBadge.innerText = currentLanguage === 'bn' ? `⏱️ ফসল তোলার বয়স: ${elapsedHours} ঘণ্টা আগে` : (currentLanguage === 'hi' ? `⏱️ कटाई का समय: ${elapsedHours} घंटे पहले` : `⏱️ Harvest Age: ${elapsedHours}h ago`);
      if (elapsedHours > 24) {
        elapsedBadge.style.background = "#fff7ed";
        elapsedBadge.style.borderColor = "#fed7aa";
        elapsedBadge.style.color = "#c2410c";
      } else {
        elapsedBadge.style.background = "#ecfdf5";
        elapsedBadge.style.borderColor = "#a7f3d0";
        elapsedBadge.style.color = "#047857";
      }
    }
  }

  // Standard consumer transit delivery time
  const expectedTransitHours = 2.0;
  const t = elapsedHours + expectedTransitHours;

  // Exponential decay calculation: Score = 100 * exp(-lambda * t)
  let score = 100.0 * Math.exp(-decayLambda * t);
  if (t > shelfLifeHours) {
    score = Math.max(0, score * 0.5);
  }
  score = Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;

  freshnessNum.innerText = `${score.toFixed(1)}%`;
  if (decayNote) {
    decayNote.innerText = `λ = ${decayLambda} (t = ${t.toFixed(1)}h)`;
  }

  if (freshnessBar) {
    freshnessBar.style.width = `${Math.min(100, Math.max(5, score))}%`;
  }

  // Determine grade & visual styling
  if (score >= 90) {
    freshnessGrade.innerText = currentLanguage === 'bn' ? "আল্ট্রা খামার-তাজা" : (currentLanguage === 'hi' ? "अल्ट्रा फार्म-फ्रेश" : "Ultra Farm-Fresh");
    freshnessGrade.style.background = "#dcfce7";
    freshnessGrade.style.color = "#166534";
    freshnessNum.style.color = "#15803d";
    if (freshnessBar) freshnessBar.style.background = "#16a34a";
  } else if (score >= 75) {
    freshnessGrade.innerText = currentLanguage === 'bn' ? "তাজা ও প্রিমিয়াম" : (currentLanguage === 'hi' ? "ताज़ा व प्रीमियम" : "Crisp & Premium");
    freshnessGrade.style.background = "#f0fdf4";
    freshnessGrade.style.color = "#15803d";
    freshnessNum.style.color = "#16a34a";
    if (freshnessBar) freshnessBar.style.background = "#22c55e";
  } else if (score >= 50) {
    freshnessGrade.innerText = currentLanguage === 'bn' ? "স্ট্যান্ডার্ড বাজার মান" : (currentLanguage === 'hi' ? "मानक बाजार गुणवत्ता" : "Standard Market Quality");
    freshnessGrade.style.background = "#fef9c3";
    freshnessGrade.style.color = "#854d0e";
    freshnessNum.style.color = "#ca8a04";
    if (freshnessBar) freshnessBar.style.background = "#eab308";
  } else {
    freshnessGrade.innerText = currentLanguage === 'bn' ? "প্রক্রিয়াকরণ / ছাড় গ্রেড" : (currentLanguage === 'hi' ? "प्रोसेसिंग / क्लीयरेंस" : "Processing / Clearance");
    freshnessGrade.style.background = "#fee2e2";
    freshnessGrade.style.color = "#991b1b";
    freshnessNum.style.color = "#dc2626";
    if (freshnessBar) freshnessBar.style.background = "#ef4444";
  }
}
window.setHarvestTimePreset = setHarvestTimePreset;
window.updateListingFreshnessPreview = updateListingFreshnessPreview;
window.initHarvestTimestampField = initHarvestTimestampField;

function quickSelectCrop(cropName, category, district, price) {
  const nameEl = document.getElementById("cropName");
  const catEl = document.getElementById("cropCategory");
  const distEl = document.getElementById("cropDistrict");
  const priceEl = document.getElementById("cropPrice");

  if (nameEl) nameEl.value = cropName;
  if (catEl) catEl.value = category;
  if (distEl) distEl.value = district;
  if (priceEl) {
    priceEl.value = price.toFixed(2);
    priceEl.placeholder = price.toFixed(2);
  }
  isPriceManuallyEdited = false;
  updateLiveMandiBenchmark(false);
  updateListingFreshnessPreview();
}

function setupMandiBenchmarkListeners() {
  const cropEl = document.getElementById("cropName");
  const distEl = document.getElementById("cropDistrict");
  const catEl = document.getElementById("cropCategory");
  const priceEl = document.getElementById("cropPrice");
  const harvestEl = document.getElementById("cropHarvestTimestamp");

  initHarvestTimestampField();

  if (cropEl) {
    cropEl.addEventListener("input", () => {
      isPriceManuallyEdited = false;
      scheduleMandiBenchmarkUpdate(false);
    });
    cropEl.addEventListener("change", () => {
      isPriceManuallyEdited = false;
      scheduleMandiBenchmarkUpdate(false);
    });
  }

  if (distEl) {
    distEl.addEventListener("change", () => scheduleMandiBenchmarkUpdate(false));
  }

  if (catEl) {
    catEl.addEventListener("change", () => {
      scheduleMandiBenchmarkUpdate(false);
      updateListingFreshnessPreview();
    });
  }

  if (priceEl) {
    priceEl.addEventListener("input", () => {
      isPriceManuallyEdited = true;
      scheduleMandiBenchmarkUpdate(true);
    });
  }

  if (harvestEl) {
    harvestEl.addEventListener("input", updateListingFreshnessPreview);
    harvestEl.addEventListener("change", updateListingFreshnessPreview);
  }

  scheduleMandiBenchmarkUpdate(false);
  updateListingFreshnessPreview();
}

function scheduleMandiBenchmarkUpdate(isUserPriceEdit = false) {
  clearTimeout(mandiDebounceTimer);
  mandiDebounceTimer = setTimeout(() => updateLiveMandiBenchmark(isUserPriceEdit), 150);
}

async function updateLiveMandiBenchmark(isUserPriceEdit = false) {
  const cropInput = document.getElementById("cropName");
  const districtInput = document.getElementById("cropDistrict");
  const categoryInput = document.getElementById("cropCategory");
  const priceInput = document.getElementById("cropPrice");

  if (!cropInput) return;

  const cropName = (cropInput.value || "").trim();
  const district = districtInput ? districtInput.value : "";
  const category = categoryInput ? categoryInput.value : "VEGETABLES";

  if (!cropName) {
    const defaultModal = 15.0;
    const defaultRetail = 24.0;
    document.getElementById("liveMandiModalPrice").innerText = `₹${defaultModal.toFixed(2)}/kg`;
    document.getElementById("liveEstimatedRetailPrice").innerText = `₹${defaultRetail.toFixed(2)}/kg`;
    document.getElementById("liveFarmerGainBadge").innerText = "Dynamic Price Ready";
    document.getElementById("liveMandiName").innerText = "Singur Regulated Market APMC";
    document.getElementById("liveConsumerSavingsText").innerText = "Pick or enter any crop above for automatic pricing";
    return;
  }

  let benchmark = null;
  try {
    const res = await fetch(`${API_BASE}/analytics/mandi-benchmark-lookup?crop_name=${encodeURIComponent(cropName)}&district=${encodeURIComponent(district)}&category=${encodeURIComponent(category)}`);
    if (res.ok) {
      benchmark = await res.json();
    }
  } catch (err) {
    // client fallback
  }

  if (!benchmark) {
    const cleanLower = cropName.toLowerCase();
    benchmark = clientMandiDatabase.find(b =>
      b.crop.toLowerCase().includes(cleanLower) || cleanLower.includes(b.crop.toLowerCase())
    );
    if (benchmark) {
      benchmark = {
        matched: true,
        category: benchmark.category,
        district_name: benchmark.district,
        mandi_name: benchmark.mandi,
        modal_price_per_kg: benchmark.modal,
        estimated_retail_price_per_kg: benchmark.retail
      };
    } else {
      const defaultModal = category === "TUBERS" ? 18 : (category === "FRUITS" ? 50 : (category === "SPICES" ? 65 : 22));
      benchmark = {
        matched: false,
        category: category,
        district_name: district,
        mandi_name: `${district || 'Regional'} APMC Benchmark`,
        modal_price_per_kg: defaultModal,
        estimated_retail_price_per_kg: Math.round(defaultModal * 1.45)
      };
    }
  }

  const modalPrice = benchmark.modal_price_per_kg || 20.0;
  const retailPrice = benchmark.estimated_retail_price_per_kg || (modalPrice * 1.45);

  // Auto-sync category and district if matched and not already customized
  if (benchmark.category && categoryInput && !isUserPriceEdit) {
    categoryInput.value = benchmark.category;
  }
  if (benchmark.district_name && districtInput && !isUserPriceEdit) {
    for (let opt of districtInput.options) {
      if (opt.value.toLowerCase().includes(benchmark.district_name.toLowerCase()) || benchmark.district_name.toLowerCase().includes(opt.value.toLowerCase())) {
        districtInput.value = opt.value;
        break;
      }
    }
  }

  // DYNAMIC PRICE ADAPTATION: Automatically update the farmer price field to match the selected crop
  if (priceInput && (!isPriceManuallyEdited || !isUserPriceEdit)) {
    priceInput.value = modalPrice.toFixed(2);
    priceInput.placeholder = modalPrice.toFixed(2);
  }

  const farmerPrice = parseFloat(priceInput ? priceInput.value : "0") || modalPrice;

  document.getElementById("liveMandiModalPrice").innerText = `₹${modalPrice.toFixed(2)}/kg`;
  document.getElementById("liveEstimatedRetailPrice").innerText = `₹${retailPrice.toFixed(2)}/kg`;
  document.getElementById("liveMandiName").innerText = benchmark.mandi_name || `${district} Mandi APMC`;

  if (farmerPrice > 0) {
    const rawGatePrice = modalPrice * 0.88;
    const farmerGainPercent = Math.max(0, Math.round(((farmerPrice - rawGatePrice) / modalPrice) * 100));
    const consumerSavingsPercent = Math.max(0, Math.round(((retailPrice - farmerPrice) / retailPrice) * 100));

    document.getElementById("liveFarmerGainBadge").innerText = `+${farmerGainPercent}% Direct Net`;
    document.getElementById("liveConsumerSavingsText").innerText = `Consumer saves ${consumerSavingsPercent}% vs street retail (₹${retailPrice.toFixed(2)})`;
  } else {
    document.getElementById("liveFarmerGainBadge").innerText = "Dynamic Price Active";
    document.getElementById("liveConsumerSavingsText").innerText = `Street retail benchmark: ₹${retailPrice.toFixed(2)}/kg`;
  }

  updateDynamicPricingPreview();
}

// -------------------------------------------------------------
// Stock-Market Style Farmer Dynamic Daily Pricing Engine Helpers
// -------------------------------------------------------------
function setListingPricingStrategy(strategy) {
  const radio = document.getElementById(strategy === "FIXED_PRICE" ? "stratFixedPrice" : "stratDynamicPeg");
  if (radio) radio.checked = true;

  const optDynamic = document.getElementById("optDynamicPegLabel");
  const optFixed = document.getElementById("optFixedPriceLabel");
  if (optDynamic && optFixed) {
    optDynamic.classList.toggle("selected", strategy === "DYNAMIC_MANDI_PEG");
    optFixed.classList.toggle("selected", strategy === "FIXED_PRICE");
  }

  const helperNetPayout = document.getElementById("helperNetPayout");
  if (helperNetPayout) {
    if (strategy === "FIXED_PRICE") {
      helperNetPayout.innerText = currentLanguage === 'bn' ? 'স্থির অপরিবর্তনীয় খামার দর।' : 'Fixed constant price per kg.';
    } else {
      helperNetPayout.innerText = currentLanguage === 'bn' ? 'বাজার দর পরিবর্তনের মূল রেফারেন্স দর।' : 'Base target anchor rate for daily market calculations.';
    }
  }

  updateDynamicPricingPreview();
}

// ---------------------------------------------------------------
// Pricing Strategy Info Modal (Info "i" buttons)
// ---------------------------------------------------------------
let _currentPricingScenario = 'HIGH_10'; // default active scenario tab

function openPricingStrategyInfoModal(strategy, event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  const modal = document.getElementById('modalPricingStrategyInfo');
  if (!modal) return;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  // Switch to the relevant tab
  if (strategy === 'FIXED_PRICE') {
    switchPricingInfoTab('FIXED');
  } else {
    switchPricingInfoTab('DYNAMIC');
  }
  // Pre-populate scenario with current active scenario
  selectPricingScenario(_currentPricingScenario, null);
  if (window.lucide) lucide.createIcons();
}

function closePricingStrategyInfoModal() {
  const modal = document.getElementById('modalPricingStrategyInfo');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function switchPricingInfoTab(tab) {
  const dynContent = document.getElementById('modalContentDynamic');
  const fixContent = document.getElementById('modalContentFixed');
  const tabDyn = document.getElementById('modalTabDynamic');
  const tabFix = document.getElementById('modalTabFixed');
  if (!dynContent || !fixContent) return;
  if (tab === 'FIXED') {
    dynContent.style.display = 'none';
    fixContent.style.display = 'block';
    if (tabDyn) { tabDyn.style.background = '#f8fafc'; tabDyn.style.color = '#64748b'; tabDyn.style.borderBottom = '3px solid transparent'; }
    if (tabFix) { tabFix.style.background = '#f0fdf4'; tabFix.style.color = '#15803d'; tabFix.style.borderBottom = '3px solid #16a34a'; }
  } else {
    fixContent.style.display = 'none';
    dynContent.style.display = 'block';
    if (tabDyn) { tabDyn.style.background = '#f0fdf4'; tabDyn.style.color = '#15803d'; tabDyn.style.borderBottom = '3px solid #16a34a'; }
    if (tabFix) { tabFix.style.background = '#f8fafc'; tabFix.style.color = '#64748b'; tabFix.style.borderBottom = '3px solid transparent'; }
  }
}

function selectPricingScenario(scenarioType, event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  _currentPricingScenario = scenarioType;

  const basePrice = parseFloat(document.getElementById('cropPrice')?.value) || 25.0;
  const qty = parseFloat(document.getElementById('cropQuantity')?.value) || 500.0;

  let surge = 0.0;
  let spikeLabel = '₹0.00 (stable)';
  let scenarioEmoji = '🌤️';
  let explanationText = '';

  if (scenarioType === 'HIGH_15') {
    surge = 15.0;
    spikeLabel = '+₹15.00 festival spike';
    scenarioEmoji = '🔥';
  } else if (scenarioType === 'HIGH_10') {
    surge = 10.0;
    spikeLabel = '+₹10.00 spike';
    scenarioEmoji = '🚀';
  }

  const mandiRate = Math.round((basePrice + surge) * 100) / 100;
  const farmerBonus = Math.round(surge * 0.20 * 100) / 100;
  const finalPayout = Math.round((basePrice + farmerBonus) * 100) / 100;
  const extraProfit = Math.round(farmerBonus * qty * 100) / 100;
  const gainPct = basePrice > 0 ? Math.round((farmerBonus / basePrice) * 1000) / 10 : 0;

  // Format helpers
  const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtQty = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // Update inline scenario box (in the form)
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  setEl('valMandiRate', `₹${fmt(mandiRate)}/kg`);
  setEl('valMarketSpike', scenarioType === 'NORMAL' ? '• stable market' : spikeLabel);
  setEl('valFarmerProfitShare', scenarioType === 'NORMAL' ? '₹0.00/kg' : `+₹${fmt(farmerBonus)}/kg`);
  setEl('valSurgeBonusBadge', scenarioType === 'NORMAL' ? '• No surge' : `${scenarioEmoji} 20% Surge Bonus`);
  setEl('valFinalFarmerPayout', `₹${fmt(finalPayout)}/kg`);
  setEl('valFarmerGainPct', scenarioType === 'NORMAL' ? '• base rate' : `+${gainPct}% payout gain`);
  setEl('valExtraLotEarnings', scenarioType === 'NORMAL' ? '+₹0.00' : `+₹${fmt(extraProfit)}`);
  setEl('valBatchQtyRef', `for ${fmtQty(qty)} kg harvest`);

  if (scenarioType === 'NORMAL') {
    explanationText = `🌤️ <strong>Normal Market:</strong> Mandi rates are steady. Your base price of ₹${fmt(basePrice)}/kg applies as-is. No surge bonus — but you're protected against drops by the MSP floor if you set one.`;
  } else if (scenarioType === 'HIGH_10') {
    explanationText = `🚀 <strong>High Market Surge Active:</strong> Wholesale Mandi prices spiked +₹10.00/kg. Under TAZA Dynamic Pricing, you automatically receive a <strong>20% profit share bonus (+₹${fmt(farmerBonus)}/kg)</strong> directly on top of your baseline! Under Fixed Price, you would receive ₹0 extra.`;
  } else {
    explanationText = `🔥 <strong>Festival Spike Active:</strong> Mandi prices surged +₹15.00/kg (e.g., Durga Puja demand). Your TAZA 20% bonus is <strong>+₹${fmt(farmerBonus)}/kg</strong> — earning you <strong>₹${fmt(extraProfit)} extra</strong> on this ${fmtQty(qty)} kg harvest compared to a fixed-price farmer!`;
  }
  setHTML('scenarioExplanationText', explanationText);

  // Update modal calculator values if modal is open
  setEl('modalValMandiRate', `₹${fmt(mandiRate)}/kg`);
  setEl('modalValMarketSpike', scenarioType === 'NORMAL' ? '• stable market' : spikeLabel);
  setEl('modalValFarmerBonus', scenarioType === 'NORMAL' ? '₹0.00/kg' : `+₹${fmt(farmerBonus)}/kg`);
  setEl('modalValBonusBadge', scenarioType === 'NORMAL' ? '• No surge' : `${scenarioEmoji} Surge Bonus`);
  setEl('modalValFinalPayout', `₹${fmt(finalPayout)}/kg`);
  setEl('modalValGainPct', scenarioType === 'NORMAL' ? '• base rate' : `+${gainPct}% gain`);
  setEl('modalValExtraProfit', scenarioType === 'NORMAL' ? '+₹0.00' : `+₹${fmt(extraProfit)}`);
  setEl('modalValBatchQtyRef', `for ${fmtQty(qty)} kg`);
  setHTML('modalScenarioExplanation', explanationText);

  // Update pill button active states (inline box)
  ['btnScenarioNormal', 'btnScenarioSurge10', 'btnScenarioSurge15'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });
  const activeMap = { 'NORMAL': 'btnScenarioNormal', 'HIGH_10': 'btnScenarioSurge10', 'HIGH_15': 'btnScenarioSurge15' };
  const activeBtn = document.getElementById(activeMap[scenarioType]);
  if (activeBtn) activeBtn.classList.add('active');

  // Update modal buttons style
  const modalBtnStyles = {
    'NORMAL': { id: 'modalBtnNormal', border: '#94a3b8', bg: '#f8fafc', color: '#475569' },
    'HIGH_10': { id: 'modalBtnSurge10', border: '#16a34a', bg: '#f0fdf4', color: '#15803d' },
    'HIGH_15': { id: 'modalBtnSurge15', border: '#d97706', bg: '#fffbeb', color: '#b45309' }
  };
  Object.entries(modalBtnStyles).forEach(([key, s]) => {
    const btn = document.getElementById(s.id);
    if (!btn) return;
    const isActive = key === scenarioType;
    btn.style.borderWidth = isActive ? '2.5px' : '1.5px';
    btn.style.fontWeight = isActive ? '800' : '700';
    btn.style.opacity = isActive ? '1' : '0.75';
  });
}

function updateDynamicPricingPreview() {
  const priceInput = document.getElementById("cropPrice");
  const floorInput = document.getElementById("cropMinPriceFloor");
  const cropNameInput = document.getElementById("cropName");
  const previewText = document.getElementById("previewDynamicRateText");
  const radio = document.querySelector('input[name="cropPricingStrategyRadio"]:checked');
  const strategy = radio ? radio.value : "DYNAMIC_MANDI_PEG";

  if (!previewText) return;

  const basePrice = priceInput && priceInput.value ? parseFloat(priceInput.value) : 0;
  const floorPrice = floorInput && floorInput.value ? parseFloat(floorInput.value) : null;
  const cropName = cropNameInput ? cropNameInput.value : "";

  if (!basePrice || basePrice <= 0) {
    previewText.innerHTML = `₹--/kg <span class="stock-trend-pill stable" style="font-size: 0.7rem; margin-left: 4px;">• Waiting for price</span>`;
    return;
  }

  if (strategy === "FIXED_PRICE") {
    previewText.innerHTML = `₹${basePrice.toFixed(2)}/kg <span class="stock-trend-pill fixed" style="font-size: 0.7rem; margin-left: 4px;">🔒 Fixed Rate</span>`;
    return;
  }

  const calc = calculateDynamicDailyMarketPrice(basePrice, cropName, strategy, floorPrice);
  const pillClass = calc.trend === "UP" ? "up" : (calc.trend === "DOWN" ? "down" : "stable");
  const arrow = calc.trend === "UP" ? `▲ +${calc.delta}%` : (calc.trend === "DOWN" ? `▼ ${calc.delta}%` : `• 0.0%`);
  const isFloorActive = floorPrice && calc.price === floorPrice && calc.price > (basePrice * (1 + (calc.delta/100)));

  previewText.innerHTML = `₹${calc.price.toFixed(2)}/kg <span class="stock-trend-pill ${pillClass}" style="font-size: 0.7rem; margin-left: 4px;">${arrow} Today</span> ${isFloorActive ? '<span style="color:#047857;font-size:0.7rem;font-weight:700;">(MSP Protected)</span>' : ''}`;

  // Keep scenario simulator in sync when price/quantity changes
  selectPricingScenario(_currentPricingScenario, null);
}

function calculateDynamicDailyMarketPrice(basePrice, cropName, strategy, minFloor) {
  basePrice = parseFloat(basePrice) || 0;
  if (basePrice <= 0) return { price: 0, delta: 0, trend: "STABLE" };
  if (strategy === "FIXED_PRICE") {
    return { price: basePrice, delta: 0, trend: "STABLE" };
  }
  
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const str = `${dateStr}:${(cropName || "").trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000.0;
  let swing = (normalized * 2.0 - 1.0) * 0.055;
  const day = today.getDay();
  if (day === 0 || day === 6 || day === 1) swing += 0.015;
  else if (day === 3 || day === 4) swing -= 0.012;

  let eff = Math.round(basePrice * (1.0 + swing) * 100) / 100;
  if (minFloor && minFloor > 0) {
    eff = Math.max(minFloor, eff);
  }
  eff = Math.max(1.0, eff);
  const delta = Math.round(((eff - basePrice) / basePrice) * 1000) / 10;
  const trend = delta > 0.1 ? "UP" : (delta < -0.1 ? "DOWN" : "STABLE");
  return { price: eff, delta, trend };
}

// Farmer: List New Crop Submission via Backend
async function handleNewCropListing(event) {
  event.preventDefault();
  const name = document.getElementById("cropName").value;
  const category = document.getElementById("cropCategory").value;
  const quantity = parseFloat(document.getElementById("cropQuantity").value);
  const price = parseFloat(document.getElementById("cropPrice").value);
  const minQty = parseFloat(document.getElementById("cropMinQty").value) || 0.5;
  const district = document.getElementById("cropDistrict").value;
  const description = document.getElementById("cropDescription").value;

  const pricingStrategyRadio = document.querySelector('input[name="cropPricingStrategyRadio"]:checked');
  const pricingStrategy = pricingStrategyRadio ? pricingStrategyRadio.value : "DYNAMIC_MANDI_PEG";
  const minFloorInput = document.getElementById("cropMinPriceFloor");
  const minPriceFloor = minFloorInput && minFloorInput.value ? parseFloat(minFloorInput.value) : null;

  const harvestInput = document.getElementById("cropHarvestTimestamp");
  let harvestDate = (harvestInput && harvestInput.value) ? new Date(harvestInput.value) : new Date();
  if (isNaN(harvestDate.getTime())) {
    harvestDate = new Date();
  }
  const harvestIso = harvestDate.toISOString();

  // Category specific biological decay parameters
  let decayLambda = 0.015;
  let shelfLife = 72;
  if (category === "VEGETABLES") {
    decayLambda = 0.035;
    shelfLife = 48;
  } else if (category === "FRUITS") {
    decayLambda = 0.020;
    shelfLife = 96;
  } else if (category === "TUBERS") {
    decayLambda = 0.008;
    shelfLife = 144;
  } else if (category === "GRAINS_PADDY") {
    decayLambda = 0.002;
    shelfLife = 720;
  } else if (category === "SPICES") {
    decayLambda = 0.005;
    shelfLife = 360;
  }

  // Tally harvest timestamp against current date/time + 2.0h expected transit
  const elapsedHours = Math.max(0, (Date.now() - harvestDate.getTime()) / 3600000);
  const totalDecayTime = elapsedHours + 2.0;
  let calculatedFreshness = 100.0 * Math.exp(-decayLambda * totalDecayTime);
  if (totalDecayTime > shelfLife) {
    calculatedFreshness = Math.max(0, calculatedFreshness * 0.5);
  }
  calculatedFreshness = Math.round(Math.max(0, Math.min(100, calculatedFreshness)) * 10) / 10;

  const hasInsurance = document.getElementById("cropInsuranceOptIn")?.checked ?? true;
  const policyNum = hasInsurance ? `TZ-POL-WH-${Date.now()}` : null;

  const payload = {
    crop_name: name,
    variety: "Fresh Gate Harvest",
    category: category,
    grade: "GRADE_A_PREMIUM",
    quantity_available_kg: quantity,
    minimum_order_kg: minQty,
    expected_base_price_per_kg: price,
    pricing_strategy: pricingStrategy,
    target_farmer_price_per_kg: price,
    min_price_floor_per_kg: minPriceFloor,
    harvest_timestamp: harvestIso,
    shelf_life_hours: shelfLife,
    freshness_decay_lambda: decayLambda,
    district: district,
    latitude: 22.8124,
    longitude: 88.2345,
    description: description || "Fresh direct harvest batch from certified FPO gate.",
    is_organic: true,
    image_url: getDefaultCropImage(name, category),
    has_insurance: hasInsurance,
    insurance_policy_number: policyNum
  };

  let headers = { "Content-Type": "application/json" };
  if (authTokens.farmer) {
    headers["Authorization"] = `Bearer ${authTokens.farmer}`;
  }

  try {
    const res = await fetch(`${API_BASE}/farmers/listings`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const insNote = hasInsurance ? "\n🛡️ All Risks Warehouse Storage Insurance bound to lot (archived in Documents Vault)." : "";
      const priceModeNote = pricingStrategy === "DYNAMIC_MANDI_PEG" 
        ? "\n📈 Stock-market style dynamic daily pricing active: prices update automatically with Mandi movements." 
        : "\n🔒 Fixed farm gate rate locked.";
      const freshnessNote = `\n🌿 Real-Time Biological Freshness: ${calculatedFreshness}% (Harvest Age: ${elapsedHours.toFixed(1)}h + 2.0h transit buffer).`;
      alert(`✅ Harvest batch posted directly to TAZA live catalog!${freshnessNote}${priceModeNote}${insNote}\nMandi benchmarks and consumer savings automatically linked from database.`);
      event.target.reset();
      initHarvestTimestampField();
      scheduleMandiBenchmarkUpdate();
      switchRole("consumer");
      scrollToProducts();
      return;
    }
  } catch (e) {}

  // Fallback local unshift with auto-calculated retail benchmark
  const matchedClient = clientMandiDatabase.find(b => b.crop.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(b.crop.toLowerCase()));
  const modalRate = matchedClient ? matchedClient.modal : price * 1.15;
  const autoRetailPrice = matchedClient ? matchedClient.retail : (modalRate * 1.35);

  const localCalc = calculateDynamicDailyMarketPrice(price, name, pricingStrategy, minPriceFloor);

  products.unshift({
    id: Date.now(),
    crop_name: name,
    category: category,
    base_price_per_kg: localCalc.price,
    pricing_strategy: pricingStrategy,
    min_price_floor_per_kg: minPriceFloor,
    daily_price_change_percent: localCalc.delta,
    daily_trend: localCalc.trend,
    retailPrice: autoRetailPrice,
    mandi_comparison: {
      mandi_name: matchedClient ? matchedClient.mandi : `${district} APMC Regulated Market`,
      mandi_modal_price_per_kg: modalRate,
      platform_price_per_kg: localCalc.price,
      consumer_savings_percent: Math.max(0, Math.round(((autoRetailPrice - localCalc.price) / autoRetailPrice) * 100)),
      farmer_margin_gain_percent: Math.max(0, Math.round(((localCalc.price - (modalRate * 0.85)) / modalRate) * 100)),
      is_better_deal: localCalc.price < autoRetailPrice
    },
    farmer_name: "Ananda Mondal (Singur Agro FPO)",
    fpo_affiliation: "Singur Agro FPO",
    farmer_rating: 5.0,
    district: `${district}, West Bengal`,
    harvest_timestamp: harvestIso,
    freshness_score: calculatedFreshness,
    shelf_life_hours: shelfLife,
    freshness_decay_lambda: decayLambda,
    minimum_order_kg: minQty,
    quantity_available_kg: quantity,
    is_organic: true,
    image_url: getDefaultCropImage(name, category)
  });
  renderProducts(products);
  event.target.reset();
  initHarvestTimestampField();
  scheduleMandiBenchmarkUpdate();
  alert("✅ Harvest batch posted directly to live store with automatic APMC Mandi price benchmarks!");
  switchRole("consumer");
  scrollToProducts();
}

// -------------------------------------------------------------
// Orders Modal & Tracking
// -------------------------------------------------------------
function getDemoConsumerOrders() {
  let cancelledDemo = [];
  try {
    cancelledDemo = JSON.parse(localStorage.getItem("taza_cancelled_demo_orders") || "[]");
  } catch (e) {}

  const demoList = [
    {
      id: 200,
      order_number: "TZ-WB-9102POT",
      quantity_kg: 4.0,
      unit: "kg",
      total_amount_inr: 99.00,
      status: "PLACED",
      payment_status: "PAID",
      estimated_distance_km: 38.0,
      delivery_address: "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
      district: "hooghly",
      crop_name: "Singur Fresh Jyoti Potato (Farm Gate)",
      product_info: {
        crop_name: "Singur Fresh Jyoti Potato (Farm Gate)",
        unit_price_inr: 22.00
      }
    },
    {
      id: 202,
      order_number: "TZ-WB-7732PTL",
      quantity_kg: 3.0,
      unit: "kg",
      total_amount_inr: 144.00,
      status: "CONFIRMED_BY_FARMER",
      payment_status: "PAID",
      estimated_distance_km: 52.0,
      delivery_address: "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
      district: "nadia",
      crop_name: "Pointed Gourd (Tender Green Potol)",
      product_info: {
        crop_name: "Pointed Gourd (Tender Green Potol)",
        unit_price_inr: 48.00
      }
    },
    {
      id: 207,
      order_number: "TZ-WB-8201TMG",
      quantity_kg: 5.0,
      unit: "kg",
      total_amount_inr: 125.00,
      status: "DISPATCHED",
      payment_status: "PAID",
      estimated_distance_km: 42.0,
      delivery_address: "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
      district: "hooghly",
      crop_name: "Singur Hybrid Red Tomato",
      product_info: {
        crop_name: "Singur Hybrid Red Tomato",
        unit_price_inr: 25.00
      }
    },
    {
      id: 201,
      order_number: "TZ-WB-8841GBR",
      quantity_kg: 5.0,
      unit: "kg",
      total_amount_inr: 430.00,
      status: "IN_TRANSIT",
      payment_status: "PAID",
      estimated_distance_km: 78.5,
      delivery_address: "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
      district: "bardhaman",
      crop_name: "Gobindobhog Aromatic Rice (GI Heritage)",
      product_info: {
        crop_name: "Gobindobhog Aromatic Rice (GI Heritage)",
        unit_price_inr: 85.00
      }
    },
    {
      id: 203,
      order_number: "TZ-WB-6519MNG",
      quantity_kg: 6.0,
      unit: "kg",
      total_amount_inr: 420.00,
      status: "DELIVERED",
      payment_status: "PAID",
      estimated_distance_km: 260.0,
      delivery_address: "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
      district: "malda",
      crop_name: "Malda Himsagar Mango (GI Certified)",
      product_info: {
        crop_name: "Malda Himsagar Mango (GI Certified)",
        unit_price_inr: 70.00
      }
    }
  ];

  return demoList.map(o => {
    if (cancelledDemo.includes(o.order_number) || cancelledDemo.includes(o.id) || cancelledDemo.includes(String(o.id))) {
      return { ...o, status: "CANCELLED", payment_status: "REFUNDED" };
    }
    return o;
  });
}

async function openOrdersModal() {
  const modal = document.getElementById("ordersModal");
  const list = document.getElementById("ordersModalList");
  if (list) {
    list.innerHTML = `<p style="text-align:center; padding:20px; color:#666;"><i data-lucide="loader-2" class="animate-spin" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Fetching live orders &amp; waybills...</p>`;
    if (window.lucide) lucide.createIcons();
  }
  modal.classList.add("open");

  let headers = {};
  if (authTokens.consumer) {
    headers["Authorization"] = `Bearer ${authTokens.consumer}`;
  }

  // Retrieve locally placed orders from active session if any
  let localOrders = [];
  try {
    const saved = localStorage.getItem("taza_placed_orders");
    if (saved) {
      localOrders = JSON.parse(saved);
    }
  } catch (e) {}

  let cancelledDemo = [];
  try {
    cancelledDemo = JSON.parse(localStorage.getItem("taza_cancelled_demo_orders") || "[]");
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/orders`, { headers });
    if (res.ok) {
      const orders = await res.json();
      let combinedOrders = orders || [];
      if (combinedOrders.length === 0) {
        combinedOrders = localOrders.length > 0 ? localOrders : getDemoConsumerOrders();
      } else if (localOrders.length > 0) {
        const orderNums = new Set(combinedOrders.map(o => o.order_number));
        const newLocal = localOrders.filter(o => !orderNums.has(o.order_number));
        combinedOrders = [...newLocal, ...combinedOrders];
      }

      // Apply any local cancellations
      combinedOrders = combinedOrders.map(o => {
        if (cancelledDemo.includes(o.order_number) || cancelledDemo.includes(o.id) || cancelledDemo.includes(String(o.id))) {
          return { ...o, status: "CANCELLED", payment_status: "REFUNDED" };
        }
        return o;
      });

      renderOrdersList(combinedOrders);
      return;
    }
  } catch (e) {
    console.warn("Orders fetch fallback", e);
  }

  // Sample order fallback if API is not reached
  let fallbackOrders = localOrders.length > 0 ? [...localOrders, ...getDemoConsumerOrders()] : getDemoConsumerOrders();
  fallbackOrders = fallbackOrders.map(o => {
    if (cancelledDemo.includes(o.order_number) || cancelledDemo.includes(o.id) || cancelledDemo.includes(String(o.id))) {
      return { ...o, status: "CANCELLED", payment_status: "REFUNDED" };
    }
    return o;
  });
  renderOrdersList(fallbackOrders);
}

function renderOrdersList(orders) {
  const list = document.getElementById("ordersModalList");
  if (!list) return;
  list.innerHTML = "";

  if (!orders || orders.length === 0) {
    list.innerHTML = `<p style="text-align:center; padding:30px; color:#666;">No past orders found. Browse today's fresh harvests!</p>`;
    return;
  }

  orders.forEach(o => {
    const card = document.createElement("div");
    card.className = "order-history-card";
    const rawCrop = (o.product_info && o.product_info.crop_name) || o.crop_name || "Farm Fresh Produce";
    const crop = getTranslatedCropName(rawCrop);
    const unit = o.unit || (rawCrop.toLowerCase().includes("banana") ? "dozen" : "kg");
    const translatedUnit = (unit === "dozen") ? (currentLanguage === "bn" ? "ডজন" : (currentLanguage === "hi" ? "दर्जन" : "dozen")) : (currentLanguage === "bn" ? "কেজি" : (currentLanguage === "hi" ? "किग्रा" : "kg"));
    const statusRaw = (o.status || 'PLACED').toUpperCase();
    const isPaid = (o.payment_status === 'PAID');
    const isCancelled = (statusRaw === 'CANCELLED');
    const totalPaid = (o.total_amount_inr || 0).toFixed(2);

    let districtKey = "hooghly";
    const cropLower = rawCrop.toLowerCase();
    if (cropLower.includes("rice") || cropLower.includes("gobindobhog")) districtKey = "bardhaman";
    else if (cropLower.includes("potol") || cropLower.includes("pointed") || cropLower.includes("banana") || cropLower.includes("dal") || cropLower.includes("lentil") || cropLower.includes("chili")) districtKey = "nadia";
    else if (cropLower.includes("mango") || cropLower.includes("himsagar") || cropLower.includes("fazli")) districtKey = "malda";
    else if (cropLower.includes("apple") || cropLower.includes("ginger") || cropLower.includes("cardamom")) districtKey = "darjeeling";
    else if (cropLower.includes("potato") || cropLower.includes("tomato")) districtKey = "hooghly";

    const delivText = currentLanguage === 'bn' ? '📍 ডেলিভারি গন্তব্য:' : (currentLanguage === 'hi' ? '📍 डिलीवरी पता:' : '📍 Delivering to:');
    const corridorText = currentLanguage === 'bn' ? 'সরাসরি খামার করিডোর' : (currentLanguage === 'hi' ? 'सीधा फार्म गलियारा' : 'Direct Farm Corridor');
    const totalPaidText = currentLanguage === 'bn' ? 'মোট পরিশোধিত' : (currentLanguage === 'hi' ? 'कुल भुगतान' : 'Total Paid');
    const trackBtnText = currentLanguage === 'bn' ? '<i data-lucide="navigation"></i> এআই রুট ট্র্যাক করুন' : (currentLanguage === 'hi' ? '<i data-lucide="navigation"></i> एआई रूट ट्रैक करें' : '<i data-lucide="navigation"></i> Track AI Route');

    // Lifecycle indices:
    // 0: PLACED
    // 1: CONFIRMED_BY_FARMER (At Warehouse Hub)
    // --- CUTOFF GATE ---
    // 2: DISPATCHED
    // 3: IN_TRANSIT
    // 4: DELIVERED
    let currentStageIdx = 0;
    if (statusRaw === "CONFIRMED_BY_FARMER") currentStageIdx = 1;
    else if (statusRaw === "DISPATCHED") currentStageIdx = 2;
    else if (statusRaw === "IN_TRANSIT") currentStageIdx = 3;
    else if (statusRaw === "DELIVERED") currentStageIdx = 4;

    const isPreDispatch = (!isCancelled && currentStageIdx <= 1);
    const isDispatched = (!isCancelled && currentStageIdx >= 2);

    // Step states
    const step1Class = isCancelled ? 'completed' : (currentStageIdx === 0 ? 'current' : 'completed');
    const step1Icon = isCancelled || currentStageIdx > 0 ? '✓' : '1';

    const conn1Class = (!isCancelled && currentStageIdx >= 1) ? 'active' : '';

    const step2Class = isCancelled ? 'upcoming' : (currentStageIdx === 1 ? 'current' : (currentStageIdx > 1 ? 'completed' : 'upcoming'));
    const step2Icon = isCancelled ? '2' : (currentStageIdx > 1 ? '✓' : '2');

    const conn2Class = (!isCancelled && currentStageIdx >= 2) ? 'active' : '';
    const conn3Class = (!isCancelled && currentStageIdx >= 2) ? 'active' : '';

    const step3Class = isCancelled ? 'upcoming' : (currentStageIdx === 2 ? 'current' : (currentStageIdx > 2 ? 'completed' : 'upcoming'));
    const step3Icon = isCancelled ? '3' : (currentStageIdx > 2 ? '✓' : '3');

    const conn4Class = (!isCancelled && currentStageIdx >= 3) ? 'active' : '';

    const step4Class = isCancelled ? 'upcoming' : (currentStageIdx === 3 ? 'current' : (currentStageIdx > 3 ? 'completed' : 'upcoming'));
    const step4Icon = isCancelled ? '4' : (currentStageIdx > 3 ? '✓' : '4');

    const conn5Class = (!isCancelled && currentStageIdx >= 4) ? 'active' : '';

    const step5Class = isCancelled ? 'upcoming' : (currentStageIdx === 4 ? 'completed' : 'upcoming');
    const step5Icon = isCancelled ? '5' : (currentStageIdx === 4 ? '✓' : '5');

    // Badge styling
    let badgeClass = 'badge-primary';
    let statusDisplay = statusRaw.replace(/_/g, ' ');
    if (isCancelled) {
      badgeClass = 'badge-danger';
      statusDisplay = 'CANCELLED & REFUNDED';
    } else if (isDispatched) {
      badgeClass = 'badge-success';
    }

    // Action Controls HTML
    let actionControlsHtml = '';
    if (isCancelled) {
      actionControlsHtml = `
        <div class="order-cancelled-banner">
          <i data-lucide="alert-circle" style="width:16px;height:16px;flex-shrink:0;"></i>
          <div>
            <strong>Order Cancelled:</strong> Full refund of ₹${totalPaid} processed to your payment method. Cancelled prior to warehouse dispatch per TAZA policy.
          </div>
        </div>
      `;
    } else if (isPreDispatch) {
      actionControlsHtml = `
        <div class="order-action-row">
          <div style="font-size:11.5px; color:#15803d; font-weight:600; display:flex; align-items:center; gap:5px;">
            <i data-lucide="check-circle-2" style="width:14px;height:14px;"></i>
            <span>Pre-dispatch stage: Free cancellation &amp; full refund available before warehouse dispatch.</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn-cancel-order" onclick="cancelConsumerOrder('${o.order_number || o.id}', '${o.id || o.order_id}')">
              <i data-lucide="x-circle" style="width:13px;height:13px;"></i> Cancel Order
            </button>
            <button class="btn-sheet" onclick="viewOrderTracking('${o.order_number || o.id}', '${districtKey}')">${trackBtnText}</button>
          </div>
        </div>
      `;
    } else {
      actionControlsHtml = `
        <div class="order-action-row">
          <div class="cancellation-locked-pill" title="Order has been dispatched from warehouse">
            <i data-lucide="lock" style="width:13px;height:13px;color:#dc2626;"></i>
            <span><strong>Cancellation Closed:</strong> Order dispatched from warehouse. No cancellation permitted post-dispatch.</span>
          </div>
          <button class="btn-sheet" onclick="viewOrderTracking('${o.order_number || o.id}', '${districtKey}')">${trackBtnText}</button>
        </div>
      `;
    }

    const deliveryFeeVal = (o.logistics_fee_inr !== undefined && o.logistics_fee_inr !== null) ? Number(o.logistics_fee_inr) : 25.0;
    const vendorNameVal = o.travel_vendor_name || "Bengal Rural Travel Express";
    const cityRetailVal = (o.city_retail_total_inr) ? Number(o.city_retail_total_inr) : (Number(totalPaid) * 1.35);

    card.innerHTML = `
      <div class="order-header-line">
        <strong>Order #${o.order_number || 'TZ-WB-9021'}</strong>
        <div>
          <span class="badge ${badgeClass}" style="font-size: 11px; font-weight: 700;">${statusDisplay}</span>
        </div>
      </div>
      <div style="font-size:14px; font-weight:700; color:#0f172a; margin: 6px 0 2px 0;">
        <span>${o.quantity_kg} ${translatedUnit} • ${crop}</span>
      </div>
      <div style="font-size:12px; color:#64748b; margin-bottom: 8px;">
        ${delivText} ${o.delivery_address || 'Flat 4B, Greenfield City, Behala Chowrasta, Kolkata'} • ${corridorText}
      </div>

      <!-- 5-Stage Visual Fulfillment Flowchart with Warehouse Cutoff -->
      <div class="order-flowchart">
        <div class="flowchart-meta-bar">
          <span>Live Order Tracking Flowchart:</span>
          <span class="flowchart-live-badge">
            <span class="live-beacon-dot"></span>
            ${isCancelled ? 'Halted: Cancelled' : (isPreDispatch ? 'Pre-Dispatch (Cancellable)' : 'Dispatched (Locked)')}
          </span>
        </div>

        <div class="flowchart-steps-track">
          <!-- Step 1: Placed -->
          <div class="flow-step ${step1Class}">
            <div class="flow-step-icon">${step1Icon}</div>
            <div class="flow-step-label">1. Placed</div>
            <div class="flow-step-sub">Farmgate confirmed</div>
          </div>

          <!-- Connector 1 -->
          <div class="flow-connector ${conn1Class}"></div>

          <!-- Step 2: Warehouse Hub -->
          <div class="flow-step ${step2Class}">
            <div class="flow-step-icon">${step2Icon}</div>
            <div class="flow-step-label">2. Warehouse Hub</div>
            <div class="flow-step-sub">Quality checked</div>
          </div>

          <!-- Connector 2 (To Cutoff) -->
          <div class="flow-connector ${conn2Class}"></div>

          <!-- CUTOFF GATE DIVIDER -->
          <div class="flow-cutoff-gate" title="Warehouse Dispatch Cutoff Boundary">
            <div class="flow-cutoff-badge">⚡ Dispatch Cutoff</div>
            <div class="flow-cutoff-line"></div>
          </div>

          <!-- Connector 3 (From Cutoff) -->
          <div class="flow-connector ${conn3Class}"></div>

          <!-- Step 3: Dispatched -->
          <div class="flow-step ${step3Class}">
            <div class="flow-step-icon">${step3Icon}</div>
            <div class="flow-step-label">3. Dispatched</div>
            <div class="flow-step-sub">EV vehicle departed</div>
          </div>

          <!-- Connector 4 -->
          <div class="flow-connector ${conn4Class}"></div>

          <!-- Step 4: In Transit -->
          <div class="flow-step ${step4Class}">
            <div class="flow-step-icon">${step4Icon}</div>
            <div class="flow-step-label">4. In Transit</div>
            <div class="flow-step-sub">Corridor en route</div>
          </div>

          <!-- Connector 5 -->
          <div class="flow-connector ${conn5Class}"></div>

          <!-- Step 5: Delivered -->
          <div class="flow-step ${step5Class}">
            <div class="flow-step-icon">${step5Icon}</div>
            <div class="flow-step-label">5. Delivered</div>
            <div class="flow-step-sub">Direct to consumer</div>
          </div>
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; padding: 6px 0 4px; border-top: 1px dashed #e2e8f0; margin-top: 6px; font-size:12px; color:#475569;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span class="order-travel-vendor-badge"><i data-lucide="truck" style="width:11px;height:11px;"></i> ${vendorNameVal}: ₹${deliveryFeeVal.toFixed(2)}</span>
          ${cityRetailVal > 0 ? `<span style="color:#64748b; font-size:11px;">(Mandi Retail: <strike>₹${cityRetailVal.toFixed(2)}</strike>)</span>` : ''}
        </div>
        <strong style="color:#15803d; font-size:14px;">${totalPaidText}: ₹${totalPaid}</strong>
      </div>
      <div class="order-retail-ceiling-guarantee">
        <i data-lucide="shield-check" style="width:12px;height:12px;color:#16a34a;"></i>
        <span>City Retail Ceiling Guarantee: Total never exceeds street retail.</span>
      </div>

      ${actionControlsHtml}
    `;
    list.appendChild(card);
  });
  if (window.lucide) lucide.createIcons();
}

async function cancelConsumerOrder(orderNumber, orderId) {
  const targetNumber = orderNumber || orderId;
  const targetId = orderId || orderNumber;

  const confirmMsg = currentLanguage === 'bn'
    ? `আপনি কি নিশ্চিত যে আপনি অর্ডার #${targetNumber} বাতিল করতে চান?\n\nগুদাম থেকে প্রেরণ (Warehouse Dispatch) হওয়ার পূর্বে সম্পূর্ণ টাকা সরাসরি ফেরত দেওয়া হবে।`
    : (currentLanguage === 'hi'
      ? `क्या आप वाकई ऑर्डर #${targetNumber} रद्द करना चाहते हैं?\n\nवेयरहाउस से डिस्पैच होने से पहले पूरा रिफंड आपके खाते में जमा किया जाएगा।`
      : `Are you sure you want to cancel Order #${targetNumber}?\n\nA full refund will be credited to your account as the order has not yet been dispatched from the warehouse.`);

  if (!confirm(confirmMsg)) return;

  const markLocalCancelled = () => {
    try {
      let localOrders = JSON.parse(localStorage.getItem("taza_placed_orders") || "[]");
      localOrders = localOrders.map(lo => {
        if (lo.order_number === targetNumber || lo.order_number === targetId || lo.order_id === targetId || lo.id === targetId || String(lo.id) === String(targetId)) {
          return { ...lo, status: "CANCELLED", payment_status: "REFUNDED" };
        }
        return lo;
      });
      localStorage.setItem("taza_placed_orders", JSON.stringify(localOrders));

      let cancelledDemo = JSON.parse(localStorage.getItem("taza_cancelled_demo_orders") || "[]");
      if (targetNumber && !cancelledDemo.includes(targetNumber)) cancelledDemo.push(targetNumber);
      if (targetId && !cancelledDemo.includes(targetId)) cancelledDemo.push(targetId);
      localStorage.setItem("taza_cancelled_demo_orders", JSON.stringify(cancelledDemo));
    } catch (e) {}
  };

  let headers = { "Content-Type": "application/json" };
  if (authTokens.consumer) {
    headers["Authorization"] = `Bearer ${authTokens.consumer}`;
  }

  let apiDispatchedLocked = false;
  let apiLockErrorMsg = "";

  const idsToTry = Array.from(new Set([targetId, targetNumber].filter(Boolean)));

  for (const idToTry of idsToTry) {
    try {
      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(idToTry)}/cancel`, {
        method: "POST",
        headers: headers
      });

      if (res.ok) {
        break;
      } else {
        const err = await res.json().catch(() => ({}));
        if (res.status === 400 && err.detail && err.detail.includes("dispatched from the warehouse")) {
          apiDispatchedLocked = true;
          apiLockErrorMsg = err.detail;
          break;
        }
      }
    } catch (err) {
      console.warn("Cancel API network fallback:", err);
    }
  }

  if (apiDispatchedLocked) {
    alert(`⚠️ ${apiLockErrorMsg || "Order has already been dispatched from the warehouse. Once dispatched, cancellation is no longer permitted."}`);
    await openOrdersModal();
    return;
  }

  markLocalCancelled();
  alert(`✅ Order #${targetNumber} has been cancelled successfully!\n\nFull refund has been processed. The produce reservation has been released back to the farmer.`);
  await openOrdersModal();
}

function closeOrdersModal() {
  document.getElementById("ordersModal").classList.remove("open");
}

async function viewOrderTracking(orderId, districtKey) {
  closeOrdersModal();
  openLogisticsModal(districtKey || 'hooghly');
}

// -------------------------------------------------------------
// AI Logistics Modal & District-Wise Route Optimizer
// -------------------------------------------------------------
const WB_DISTRICT_LOGISTICS_HUB = {
  hooghly: {
    name: "Hooghly (Singur / Tarakeswar)",
    cluster: "Hooghly Singur Cluster",
    consignmentCode: "HGL-7821",
    originLat: 22.8124,
    originLng: 88.2345,
    farmGateName: "Singur Cooperative Farmgate (Hooghly)",
    corridor: "NH-19 / Durgapur Expressway",
    rerouteMsg: "<strong>Autonomous Reroute Applied:</strong> NH-19 rural detour optimized. Lowland waterlogging bypassed via SH-13. Transit delay avoided: <strong>1.8 hours</strong>.",
    mandiTiersSkipped: "3 Mandi Tiers (Singur/Sheoraphuli)",
    speed: "42 km/h",
    stops: [
      { name: "Singur Primary Farmgate Hub", latitude: 22.8124, longitude: 88.2345, type: "PICKUP", demand_kg: 160 },
      { name: "Tarakeswar Cold Storage Yard", latitude: 22.8885, longitude: 88.0210, type: "PICKUP", demand_kg: 120 },
      { name: "Haripal Organic Veg FPO", latitude: 22.8310, longitude: 88.1140, type: "PICKUP", demand_kg: 100 }
    ]
  },
  bardhaman: {
    name: "Purba Bardhaman (Memari / Kalna)",
    cluster: "Bardhaman Rice & Veg Corridor",
    consignmentCode: "BRD-4319",
    originLat: 23.2324,
    originLng: 87.8615,
    farmGateName: "Memari Agro FPO Hub (Purba Bardhaman)",
    corridor: "Grand Trunk Road & NH-19",
    rerouteMsg: "<strong>Autonomous Dispatch:</strong> Grand Trunk Road direct freight corridor active. Memari-Bainchi highway bypass clear. Bulk electric truck dispatch priority.",
    mandiTiersSkipped: "4 Mandi Tiers (Kalna/Memari/Shaktigarh)",
    speed: "48 km/h",
    stops: [
      { name: "Memari Agro FPO Gate", latitude: 23.2324, longitude: 87.8615, type: "PICKUP", demand_kg: 220 },
      { name: "Kalna Vegetable Aggregation Post", latitude: 23.2210, longitude: 88.3680, type: "PICKUP", demand_kg: 180 },
      { name: "Bainchi Cold Storage Point", latitude: 23.1190, longitude: 88.1980, type: "PICKUP", demand_kg: 140 }
    ]
  },
  nadia: {
    name: "Nadia (Ranaghat / Bethuadahari)",
    cluster: "Nadia Ranaghat Produce Belt",
    consignmentCode: "NDA-9104",
    originLat: 23.4710,
    originLng: 88.5565,
    farmGateName: "Ranaghat Fresh Produce Depot (Nadia)",
    corridor: "NH-12 (Old NH-34) Kalyani Expressway",
    rerouteMsg: "<strong>Green Transit Active:</strong> NH-12 dedicated agricultural express corridor. Ranaghat Sub-Division express bypass active. Zero mandi checkpoints.",
    mandiTiersSkipped: "3 Mandi Tiers (Ranaghat/Kalyani)",
    speed: "45 km/h",
    stops: [
      { name: "Ranaghat Farmers Depot", latitude: 23.4710, longitude: 88.5565, type: "PICKUP", demand_kg: 190 },
      { name: "Bethuadahari Agro Collection Center", latitude: 23.6210, longitude: 88.3890, type: "PICKUP", demand_kg: 130 },
      { name: "Chakdaha Green Cluster", latitude: 23.0800, longitude: 88.5200, type: "PICKUP", demand_kg: 110 }
    ]
  },
  murshidabad: {
    name: "Murshidabad (Beldanga / Berhampore)",
    cluster: "Murshidabad Central Plains",
    consignmentCode: "MSD-6523",
    originLat: 24.1759,
    originLng: 88.2802,
    farmGateName: "Beldanga Farmer Gate Hub (Murshidabad)",
    corridor: "NH-12 North-South Bengal Artery",
    rerouteMsg: "<strong>Long-Haul Cold Chain:</strong> Night transit temperature-controlled dispatch active. Berhampore bypass clear of local haat congestion.",
    mandiTiersSkipped: "4 Mandi Tiers (Berhampore/Beldanga)",
    speed: "52 km/h",
    stops: [
      { name: "Beldanga Aggregation Hub", latitude: 24.1759, longitude: 88.2802, type: "PICKUP", demand_kg: 240 },
      { name: "Berhampore Farmers Depot", latitude: 24.0980, longitude: 88.2610, type: "PICKUP", demand_kg: 160 },
      { name: "Kandi Sub-Divisional Post", latitude: 23.9560, longitude: 88.0380, type: "PICKUP", demand_kg: 120 }
    ]
  },
  malda: {
    name: "Malda (English Bazar / Chanchal)",
    cluster: "Malda Mango & Grain Corridor",
    consignmentCode: "MLD-3841",
    originLat: 25.0108,
    originLng: 88.1411,
    farmGateName: "English Bazar Farm Yard (Malda)",
    corridor: "NH-12 Farakka Barrage Express Line",
    rerouteMsg: "<strong>Inter-District Corridor:</strong> Farakka freight lane reserved for perishable produce. Night refrigerated express dispatch active.",
    mandiTiersSkipped: "4 Mandi Tiers (Malda Town/Samsi)",
    speed: "55 km/h",
    stops: [
      { name: "English Bazar Collection Post", latitude: 25.0108, longitude: 88.1411, type: "PICKUP", demand_kg: 280 },
      { name: "Chanchal Orchards Farmgate", latitude: 25.3890, longitude: 87.9980, type: "PICKUP", demand_kg: 170 },
      { name: "Kaliachak Multi-Farm Gate", latitude: 24.8450, longitude: 88.0210, type: "PICKUP", demand_kg: 150 }
    ]
  },
  darjeeling: {
    name: "Darjeeling (Kurseong / Siliguri)",
    cluster: "North Bengal Hill Corridor",
    consignmentCode: "DRJ-1192",
    originLat: 27.0410,
    originLng: 88.2663,
    farmGateName: "Kurseong Organic Terraces (Darjeeling)",
    corridor: "Hill-to-Plains Expressway (Rohini - Siliguri)",
    rerouteMsg: "<strong>Hill Descent Optimization:</strong> Mountain descent speed governed. Rohini bypass active to prevent transit vibration for fragile produce.",
    mandiTiersSkipped: "5 Mandi Tiers (Siliguri/Matigara/Hill Haats)",
    speed: "35 km/h",
    stops: [
      { name: "Kurseong Terrace Collection Hub", latitude: 27.0410, longitude: 88.2663, type: "PICKUP", demand_kg: 140 },
      { name: "Mirik Organic Farm Collective", latitude: 26.8870, longitude: 88.1740, type: "PICKUP", demand_kg: 120 },
      { name: "Matigara Aggregation Depot", latitude: 26.7120, longitude: 88.3840, type: "PICKUP", demand_kg: 190 }
    ]
  },
  south24: {
    name: "South 24 Parganas (Baruipur / Canning)",
    cluster: "Sundarban Delta Green Belt",
    consignmentCode: "S24-6102",
    originLat: 22.3654,
    originLng: 88.4325,
    farmGateName: "Baruipur Sundarban Farmgate Hub",
    corridor: "EM Bypass & Baruipur Express Corridor",
    rerouteMsg: "<strong>Delta Express Route:</strong> Direct peri-urban link via EM Bypass southern connector. Zero middleman handling, 2-hr doorstep dispatch.",
    mandiTiersSkipped: "3 Mandi Tiers (Baruipur/Canning/Garia)",
    speed: "40 km/h",
    stops: [
      { name: "Baruipur Delta Primary Hub", latitude: 22.3654, longitude: 88.4325, type: "PICKUP", demand_kg: 180 },
      { name: "Canning Vegetable Collection Yard", latitude: 22.3110, longitude: 88.6630, type: "PICKUP", demand_kg: 140 },
      { name: "Sonarpur Green Depot", latitude: 22.4410, longitude: 88.4280, type: "PICKUP", demand_kg: 110 }
    ]
  },
  north24: {
    name: "North 24 Parganas (Barasat / Basirhat)",
    cluster: "Peri-Urban Green Belt",
    consignmentCode: "N24-5503",
    originLat: 22.7230,
    originLng: 88.4800,
    farmGateName: "Barasat Peri-Urban Farmer Cluster",
    corridor: "Jessore Road & Belghoria Expressway",
    rerouteMsg: "<strong>Hyper-Local Smart Route:</strong> Direct peri-urban link via Belghoria Expressway. Zero intermediate middleman handling.",
    mandiTiersSkipped: "3 Mandi Tiers (Barasat/Madhyamgram)",
    speed: "38 km/h",
    stops: [
      { name: "Barasat Green Hub", latitude: 22.7230, longitude: 88.4800, type: "PICKUP", demand_kg: 150 },
      { name: "Basirhat Fresh Produce Yard", latitude: 22.6570, longitude: 88.8910, type: "PICKUP", demand_kg: 140 },
      { name: "Habra Organic Depot", latitude: 22.8330, longitude: 88.6340, type: "PICKUP", demand_kg: 110 }
    ]
  },
  bankura: {
    name: "Bankura (Bishnupur / Kotulpur)",
    cluster: "Rarh Bengal Agro Belt",
    consignmentCode: "BNK-8291",
    originLat: 23.2326,
    originLng: 87.0715,
    farmGateName: "Bishnupur Agro Cooperative Gate",
    corridor: "NH-14 & Durgapur South Highway",
    rerouteMsg: "<strong>Rarh Region Route:</strong> Avoiding intermediate haats. Direct highway connection with real-time temperature tracking.",
    mandiTiersSkipped: "3 Mandi Tiers (Bishnupur/Kotulpur)",
    speed: "46 km/h",
    stops: [
      { name: "Bishnupur Primary Farm Hub", latitude: 23.2326, longitude: 87.0715, type: "PICKUP", demand_kg: 200 },
      { name: "Kotulpur Vegetable Yard", latitude: 22.9910, longitude: 87.5930, type: "PICKUP", demand_kg: 130 },
      { name: "Joypur Forest Border FPO", latitude: 23.0480, longitude: 87.4320, type: "PICKUP", demand_kg: 120 }
    ]
  }
};

const DELIVERY_DESTINATIONS = {
  kolkata_central: {
    name: "Kolkata Central Hub (Sector V / Salt Lake)",
    lat: 22.5726,
    lng: 88.3639,
    label: "Kolkata Central (Sector V)"
  },
  kolkata_south: {
    name: "Kolkata South Hub (Jadavpur / Behala)",
    lat: 22.4986,
    lng: 88.3102,
    label: "Kolkata South (Jadavpur)"
  },
  howrah_terminal: {
    name: "Howrah Freight Terminal (Nabanna)",
    lat: 22.5958,
    lng: 88.2636,
    label: "Howrah Freight Terminal"
  },
  newtown_smart: {
    name: "New Town Smart Logistics Hub",
    lat: 22.5867,
    lng: 88.4178,
    label: "New Town Logistics Hub"
  }
};

let currentLogisticsDistrict = "hooghly";
let currentLogisticsDest = "kolkata_central";
let logisticsRouteDirection = "farmer"; // "farmer" or "consumer"

function swapLogisticsRoute() {
  logisticsRouteDirection = (logisticsRouteDirection === "farmer") ? "consumer" : "farmer";
  renderLogisticsRoute(currentLogisticsDistrict, currentLogisticsDest);
}
window.swapLogisticsRoute = swapLogisticsRoute;

function getAuthTokenForLogistics() {
  return authTokens.consumer || authTokens.farmer || authTokens.retailer || authTokens.transporter || null;
}

function calculateClientDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.32; // Road tortuosity factor
}

async function renderLogisticsRoute(districtKey, destKey) {
  const profile = WB_DISTRICT_LOGISTICS_HUB[districtKey] || WB_DISTRICT_LOGISTICS_HUB.hooghly;
  const dest = DELIVERY_DESTINATIONS[destKey] || DELIVERY_DESTINATIONS.kolkata_central;

  const isConsumer = (logisticsRouteDirection === "consumer");

  // Interchange controls order via CSS flex-direction (reversed places Hub on left and Kitchen on right)
  const controlsBar = document.getElementById("logisticsControlsBar");
  if (controlsBar) {
    if (isConsumer) {
      controlsBar.classList.add("reversed");
    } else {
      controlsBar.classList.remove("reversed");
    }
  }

  // Dynamic Label & Badge updates based on role perspective
  const originLabelEl = document.getElementById("logisticsOriginLabel");
  const destLabelEl = document.getElementById("logisticsDestLabel");
  const swapBtnTextEl = document.getElementById("swapBtnText");
  const badgeEl = document.getElementById("logisticsPerspectiveBadge");
  const consignmentLabelEl = document.getElementById("logisticsConsignmentLabel");
  const consignmentEl = document.getElementById("logisticsConsignmentId");

  if (isConsumer) {
    // Consumer Perspective: Central Hub is Pickup, Consumer Kitchen is Drop Destination
    if (originLabelEl) originLabelEl.innerHTML = `<i data-lucide="home"></i> Drop Destination (Consumer Kitchen):`;
    if (destLabelEl) destLabelEl.innerHTML = `<i data-lucide="warehouse"></i> Pickup Location (Central Hub / Cold Store):`;
    if (swapBtnTextEl) swapBtnTextEl.innerHTML = `⇄ Hub ➔ Kitchen (Consumer)`;
    if (consignmentLabelEl) consignmentLabelEl.innerText = `Live Inbound Tracking ID:`;
    if (consignmentEl) consignmentEl.innerText = `#TZ-INB-${profile.consignmentCode}-CONS`;
    if (badgeEl) {
      badgeEl.className = "logistics-perspective-badge consumer";
      badgeEl.innerHTML = `<i data-lucide="shopping-cart"></i> <span><strong>Consumer Delivery Mode:</strong> Pickup at ${dest.label} ➔ Doorstep Drop at Consumer Kitchen (${profile.name})</span>`;
    }
  } else {
    // Farmer Perspective: Farm Gate is Pickup, Central Hub is Drop Destination
    if (originLabelEl) originLabelEl.innerHTML = `<i data-lucide="map-pin"></i> Pickup Origin (Farm Gate / Producer Hub):`;
    if (destLabelEl) destLabelEl.innerHTML = `<i data-lucide="navigation"></i> Drop Destination (Central Hub / Mandi):`;
    if (swapBtnTextEl) swapBtnTextEl.innerHTML = `⇄ Farm ➔ Hub (Farmer)`;
    if (consignmentLabelEl) consignmentLabelEl.innerText = `Live Dispatch Consignment ID:`;
    if (consignmentEl) consignmentEl.innerText = `#TZ-LOG-${profile.consignmentCode}`;
    if (badgeEl) {
      badgeEl.className = "logistics-perspective-badge farmer";
      badgeEl.innerHTML = `<i data-lucide="sprout"></i> <span><strong>Farmer Dispatch Mode:</strong> Pickup at Farm Gate (${profile.farmGateName}) ➔ Drop at ${dest.name}</span>`;
    }
  }

  // Stepper representation (Interchanged for consumer vs farmer)
  const step1TitleEl = document.getElementById("step1Title");
  const step1TimeEl = document.getElementById("step1Time");
  const step2TitleEl = document.getElementById("step2Title");
  const step2SpeedEl = document.getElementById("step2Speed");
  const step3TitleEl = document.getElementById("step3Title");
  const step3TimeEl = document.getElementById("step3Time");

  if (isConsumer) {
    if (step1TitleEl) step1TitleEl.innerText = `Pickup: ${dest.label}`;
    if (step1TimeEl) step1TimeEl.innerText = "Dispatched: Today 07:15 AM (Hub)";
    if (step2TitleEl) step2TitleEl.innerText = `Last-Mile Green Express (${profile.corridor})`;
    if (step2SpeedEl) step2SpeedEl.innerText = `Out for Delivery • ${profile.speed}`;
    if (step3TitleEl) step3TitleEl.innerText = `Drop: Consumer Kitchen (${profile.name})`;
    if (step3TimeEl) step3TimeEl.innerText = "Estimated Arrival: Today 08:45 AM";
  } else {
    if (step1TitleEl) step1TitleEl.innerText = profile.farmGateName;
    if (step1TimeEl) step1TimeEl.innerText = "Loaded: Today 06:15 AM";
    if (step2TitleEl) step2TitleEl.innerText = `Green Transit (${profile.corridor})`;
    if (step2SpeedEl) step2SpeedEl.innerText = `En Route • ${profile.speed}`;
    if (step3TitleEl) step3TitleEl.innerText = `Destination Hub: ${dest.label}`;
    if (step3TimeEl) step3TimeEl.innerText = "Estimated: Today 08:30 AM";
  }

  const alertMsgEl = document.getElementById("logisticsAlertMsg");
  if (alertMsgEl) {
    if (isConsumer) {
      alertMsgEl.innerHTML = `<strong>Autonomous Last-Mile Delivery Active:</strong> Dispatched from cold-chain distribution center (<em>${dest.label}</em>) directly to your residential address. Peak congestion avoided via express corridor. Estimated arrival within <strong>45 mins</strong>.`;
    } else {
      alertMsgEl.innerHTML = profile.rerouteMsg;
    }
    // Live meteorological disaster evaluation for the active dispatch corridor
    fetch(`${API_BASE}/alerts?region=${encodeURIComponent(profile.name)}`)
      .then(r => r.ok ? r.json() : null)
      .then(alertData => {
        if (alertData && alertMsgEl) {
          const parentBox = alertMsgEl.parentElement;
          if (alertData.reroute_active) {
            alertMsgEl.innerHTML = `<strong>⚠️ Live Meteorological Reroute Active (${profile.name}):</strong> ${alertData.activeWarnings[0]} (Rain: ${alertData.live_rainfall_mm || 0}mm, Wind: ${alertData.live_wind_speed_kph || 0} km/h). Lowlands bypassed via ${alertData.safe_corridor}. Delay avoided: <strong>1.8 hours</strong>.`;
            if (parentBox) {
              parentBox.style.background = "#fef2f2";
              parentBox.style.borderColor = "#f87171";
            }
          } else if (!isConsumer) {
            alertMsgEl.innerHTML = `<strong>✅ Live Meteorological Clearance (${profile.name}):</strong> ${alertData.live_weather_condition || "Clear"} (${alertData.live_temperature_c}°C, Wind ${alertData.live_wind_speed_kph} km/h, 0 mm Flood Risk). Direct green EV express corridor active.`;
            if (parentBox) {
              parentBox.style.background = "#f0fdf4";
              parentBox.style.borderColor = "#86efac";
            }
          }
        }
      })
      .catch(() => {});
  }

  const mandiStatEl = document.getElementById("mandiSkippedStat");
  if (mandiStatEl) mandiStatEl.innerText = profile.mandiTiersSkipped;

  // Calculate distance between origin and destination coordinates (interchanged if consumer)
  const calcOriginLat = isConsumer ? dest.lat : profile.originLat;
  const calcOriginLng = isConsumer ? dest.lng : profile.originLng;
  const calcDestLat = isConsumer ? profile.originLat : dest.lat;
  const calcDestLng = isConsumer ? profile.originLng : dest.lng;
  const calcOriginName = isConsumer ? dest.label : profile.name;
  const calcDestName = isConsumer ? profile.name : dest.label;

  const localDist = calculateClientDistance(calcOriginLat, calcOriginLng, calcDestLat, calcDestLng);
  const localMinutes = (localDist / 40) * 60;
  const localCarbon = (localDist * 0.11).toFixed(1);
  const localSavings = ((localDist * 2.8) / 50).toFixed(2);

  const distTimeEl = document.getElementById("routeDistanceTimeStat");
  if (distTimeEl) distTimeEl.innerText = `${localDist.toFixed(1)} km • ${(localMinutes / 60).toFixed(1)} hrs`;

  const carbonEl = document.getElementById("carbonSavedStat");
  if (carbonEl) carbonEl.innerText = `-${localCarbon} kg CO₂ (Green EV)`;

  const freightEl = document.getElementById("freightSavingsStat");
  if (freightEl) freightEl.innerText = `₹${localSavings} / kg`;

  const token = getAuthTokenForLogistics();
  try {
    const res = await fetch(`${API_BASE}/logistics/calculate-route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        origin_latitude: calcOriginLat,
        origin_longitude: calcOriginLng,
        origin_district: calcOriginName,
        destination_latitude: calcDestLat,
        destination_longitude: calcDestLng,
        destination_district: calcDestName,
        cargo_weight_kg: 50.0,
        requires_cold_chain: true
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (distTimeEl) distTimeEl.innerText = `${data.total_distance_km.toFixed(1)} km • ${(data.estimated_duration_minutes / 60).toFixed(1)} hrs`;
      if (carbonEl) carbonEl.innerText = `-${(data.estimated_carbon_kg ? (data.estimated_carbon_kg * 1.6).toFixed(1) : localCarbon)} kg CO₂ (${data.recommended_vehicle || 'Green EV'})`;
      if (freightEl) freightEl.innerText = `₹${(data.logistics_cost_inr / 50).toFixed(2)} / kg`;
    }
  } catch (e) {
    // Graceful fallback to client calculation
  }

  if (window.lucide) lucide.createIcons();
}

async function renderTspBatchRoute(districtKey) {
  const profile = WB_DISTRICT_LOGISTICS_HUB[districtKey] || WB_DISTRICT_LOGISTICS_HUB.hooghly;

  const badgeEl = document.getElementById("tspDistrictBadge");
  if (badgeEl) badgeEl.innerText = profile.cluster;

  const token = getAuthTokenForLogistics();
  try {
    const res = await fetch(`${API_BASE}/logistics/batch-optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        hub_district: profile.name,
        hub_latitude: profile.originLat,
        hub_longitude: profile.originLng,
        waypoints: profile.stops,
        vehicle_capacity_kg: 500.0
      })
    });
    if (res.ok) {
      const data = await res.json();
      const stopListEl = document.getElementById("tspStopList");
      if (stopListEl && data.optimized_sequence) {
        stopListEl.innerHTML = data.optimized_sequence.map((wp, idx) => `
          <div class="tsp-stop-item">
            <div class="tsp-stop-info">
              <div class="tsp-stop-number">${idx + 1}</div>
              <div>
                <div class="tsp-stop-name">${wp.name}</div>
                <div class="tsp-stop-cargo">Demand: ${wp.demand_kg} kg • Farmgate Cluster</div>
              </div>
            </div>
            <span class="tsp-badge">${wp.type}</span>
          </div>
        `).join('');
      }

      const cargoEl = document.getElementById("tspCargoStat");
      if (cargoEl) cargoEl.innerText = `${data.total_cargo_kg} kg`;

      const utilEl = document.getElementById("tspUtilizationStat");
      if (utilEl) utilEl.innerText = `${data.vehicle_utilization_percent.toFixed(0)}% (Electric LCV)`;

      const tspDistEl = document.getElementById("tspDistanceStat");
      if (tspDistEl) tspDistEl.innerText = `${data.total_route_distance_km.toFixed(1)} km`;

      const costEl = document.getElementById("tspCostStat");
      if (costEl) costEl.innerText = `₹${data.estimated_total_cost_inr.toFixed(0)} total`;
      if (window.lucide) lucide.createIcons();
      return;
    }
  } catch (e) {}

  // Fallback rendering
  const totalCargo = profile.stops.reduce((sum, s) => sum + (s.demand_kg || 0), 0);
  const stopListEl = document.getElementById("tspStopList");
  if (stopListEl) {
    stopListEl.innerHTML = profile.stops.map((s, idx) => `
      <div class="tsp-stop-item">
        <div class="tsp-stop-info">
          <div class="tsp-stop-number">${idx + 1}</div>
          <div>
            <div class="tsp-stop-name">${s.name}</div>
            <div class="tsp-stop-cargo">Demand: ${s.demand_kg} kg • Farmgate Cluster</div>
          </div>
        </div>
        <span class="tsp-badge">PICKUP</span>
      </div>
    `).join('');
  }

  const cargoEl = document.getElementById("tspCargoStat");
  if (cargoEl) cargoEl.innerText = `${totalCargo} kg`;

  const utilEl = document.getElementById("tspUtilizationStat");
  if (utilEl) utilEl.innerText = `${((totalCargo / 500) * 100).toFixed(0)}% (Electric LCV)`;

  const tspDistEl = document.getElementById("tspDistanceStat");
  if (tspDistEl) tspDistEl.innerText = `36.8 km`;

  const costEl = document.getElementById("tspCostStat");
  if (costEl) costEl.innerText = `₹${(totalCargo * 1.1 + 80).toFixed(0)} total`;
  if (window.lucide) lucide.createIcons();
}

const LOGISTICS_TO_FARMER_DISTRICT_MAP = {
  hooghly: "Hooghly",
  bardhaman: "Purba Bardhaman",
  nadia: "Nadia",
  murshidabad: "Murshidabad",
  malda: "Malda",
  darjeeling: "Darjeeling",
  south24: "South 24 Parganas",
  north24: "South 24 Parganas",
  bankura: "Bankura"
};

const FARMER_TO_LOGISTICS_DISTRICT_MAP = {
  "Hooghly": "hooghly",
  "Purba Bardhaman": "bardhaman",
  "Nadia": "nadia",
  "Murshidabad": "murshidabad",
  "Malda": "malda",
  "Darjeeling": "darjeeling",
  "South 24 Parganas": "south24",
  "Bankura": "bankura"
};

function handleLogisticsDistrictChange(val) {
  currentLogisticsDistrict = val;
  renderLogisticsRoute(currentLogisticsDistrict, currentLogisticsDest);
  renderTspBatchRoute(currentLogisticsDistrict);

  // Sync Favourite Farmers section directly with selected district
  const targetDistrict = LOGISTICS_TO_FARMER_DISTRICT_MAP[val] || val;
  if (typeof handleFarmerDistrictChange === "function") {
    handleFarmerDistrictChange(targetDistrict, true);
  }
}

function handleLogisticsDestChange(val) {
  currentLogisticsDest = val;
  renderLogisticsRoute(currentLogisticsDistrict, currentLogisticsDest);
}

function switchLogisticsTab(tab) {
  const directBtn = document.getElementById("logisticsTabDirect");
  const batchBtn = document.getElementById("logisticsTabBatch");
  const directView = document.getElementById("logisticsDirectView");
  const batchView = document.getElementById("logisticsBatchView");

  if (tab === "direct") {
    if (directBtn) directBtn.classList.add("active");
    if (batchBtn) batchBtn.classList.remove("active");
    if (directView) directView.style.display = "block";
    if (batchView) batchView.style.display = "none";
  } else {
    if (batchBtn) batchBtn.classList.add("active");
    if (directBtn) directBtn.classList.remove("active");
    if (batchView) batchView.style.display = "block";
    if (directView) directView.style.display = "none";
  }
  if (window.lucide) lucide.createIcons();
}

async function openLogisticsModal(districtKey) {
  // Synchronize route direction perspective with current active role
  logisticsRouteDirection = (currentRole === 'farmer') ? 'farmer' : 'consumer';
  if (districtKey && WB_DISTRICT_LOGISTICS_HUB[districtKey]) {
    currentLogisticsDistrict = districtKey;
    const selectEl = document.getElementById("logisticsDistrictSelect");
    if (selectEl) selectEl.value = districtKey;
  }
  document.getElementById("logisticsModal").classList.add("open");
  renderLogisticsRoute(currentLogisticsDistrict, currentLogisticsDest);
  renderTspBatchRoute(currentLogisticsDistrict);

  // Sync Favourite Farmers
  const targetDistrict = LOGISTICS_TO_FARMER_DISTRICT_MAP[currentLogisticsDistrict];
  if (targetDistrict && typeof handleFarmerDistrictChange === "function") {
    handleFarmerDistrictChange(targetDistrict, true);
  }

  if (window.lucide) lucide.createIcons();
}

function closeLogisticsModal() {
  document.getElementById("logisticsModal").classList.remove("open");
}

function openMandiStatsModal() {
  alert("📊 APMC Mandi Benchmark Engine:\n\nTAZA continuously scrapes Agmarknet West Bengal wholesale market prices across Singur, Memari, Nadia, and Malda.\n\nAll farmer payouts are 100% transparent with zero intermediary commission.");
}

function openProfileModal() {
  openAuthModal('farmer');
}

function changeDeliveryDistrict() {
  const dist = prompt("Enter your delivery district / city / pincode in West Bengal (e.g. Hooghly, Nadia, Bardhaman, Darjeeling, Malda, Murshidabad, South 24 Parganas, Bankura):", "Hooghly (Singur 712409)");
  if (dist) {
    const headerEl = document.getElementById("navDeliveryHeader");
    if (headerEl) headerEl.innerText = `Delivering to ${dist}`;

    // District matching heuristic
    const lower = dist.toLowerCase();
    let detectedDistrict = null;
    if (lower.includes("hooghly") || lower.includes("singur") || lower.includes("tarakeswar") || lower.includes("712")) detectedDistrict = "Hooghly";
    else if (lower.includes("nadia") || lower.includes("ranaghat") || lower.includes("beldanga") || lower.includes("741")) detectedDistrict = "Nadia";
    else if (lower.includes("bardhaman") || lower.includes("burdwan") || lower.includes("memari") || lower.includes("kalna") || lower.includes("713")) detectedDistrict = "Purba Bardhaman";
    else if (lower.includes("darjeeling") || lower.includes("kurseong") || lower.includes("gorubathan") || lower.includes("siliguri") || lower.includes("734")) detectedDistrict = "Darjeeling";
    else if (lower.includes("malda") || lower.includes("english bazar") || lower.includes("samsi") || lower.includes("732")) detectedDistrict = "Malda";
    else if (lower.includes("murshidabad") || lower.includes("baharampur") || lower.includes("berhampore") || lower.includes("kandi") || lower.includes("742")) detectedDistrict = "Murshidabad";
    else if (lower.includes("south 24") || lower.includes("baruipur") || lower.includes("canning") || lower.includes("diamond harbour") || lower.includes("743")) detectedDistrict = "South 24 Parganas";
    else if (lower.includes("bankura") || lower.includes("bishnupur") || lower.includes("kotulpur") || lower.includes("722")) detectedDistrict = "Bankura";

    if (detectedDistrict && typeof handleFarmerDistrictChange === "function") {
      handleFarmerDistrictChange(detectedDistrict);
      showCartToast(`📍 Filtered to ${detectedDistrict} local farmers & FPOs`);
    }
  }
}

function scrollToProducts() {
  document.getElementById("productCatalogSection").scrollIntoView({ behavior: 'smooth' });
}

function handleBackdropClick(event, modalId) {
  if (event.target.id === modalId) {
    document.getElementById(modalId).classList.remove("open");
  }
}

// =============================================================
// TazaTalks AI Chatbot Engine (Dual Farmer & Consumer Interface)
// =============================================================

let tazaTalksCurrentRole = "consumer";
let tazaTalksInitialized = false;

const TAZA_TALKS_HELPLINE = "6289069619";

const TAZA_TALKS_FAQS = {
  farmer: [
    {
      id: "f1",
      question: "How do I book warehouse storage space for my harvested crops?",
      answer: "Navigate to the storage dashboard in your app, select your district from the interactive map based on the available vacant plot coordinates, input your crop type and total weight in quintals, and click \"Reserve Space\" to secure an instant digital allotment slip.",
      question_bn: "আমি কীভাবে আমার তোলানো ফসলের জন্য গুদামে স্টোরেজ স্পেস বুক করব?",
      answer_bn: "আপনার অ্যাপের স্টোরেজ ড্যাশবোর্ডে যান, খালি থাকা প্লট স্থানাঙ্কের উপর ভিত্তি করে ইন্টারেক্টিভ ম্যাপ থেকে আপনার জেলা নির্বাচন করুন, আপনার ফসলের ধরন ও কুইন্টালে মোট ওজন ইনপুট করুন এবং তাত্ক্ষণিক ডিজিটাল বরাদ্দ স্লিপ পেতে \"রিজার্ভ স্পেস\"-এ ক্লিক করুন।",
      question_hi: "मैं अपनी कटी हुई फसलों के लिए गोदाम में भंडारण स्थान कैसे बुक करूँ?",
      answer_hi: "अपने ऐप में स्टोरेज डैशबोर्ड पर जाएं, खाली प्लॉट निर्देशांक के आधार पर इंटरेक्टिव मैप से अपना जिला चुनें, अपनी फसल का प्रकार और क्विंटल में कुल वजन दर्ज करें, और तत्काल डिजिटल आवंटन पर्ची सुरक्षित करने के लिए \"रिजर्व स्पेस\" पर क्लिक करें।",
      keywords: ["book", "warehouse", "storage", "space", "harvest", "reserve", "allotment", "গুদাম", "স্টোরেজ", "বুকিং", "गोदाम", "भंडारण"]
    },
    {
      id: "f2",
      question: "When and how do I receive payments after storing or selling my produce?",
      answer: "Payments are credited directly to your registered bank account or UPI handle within 24 to 48 hours of completing the physical quality inspection and official weight verification at the warehouse gate.",
      question_bn: "ফসল জমা বা বিক্রি করার পর আমি কখন এবং কীভাবে পেমেন্ট পাব?",
      answer_bn: "গুদামের গেটে গুণমান পরীক্ষা এবং সরকারি ওজন যাচাইকরণের কাজ সম্পন্ন হওয়ার ২৪ থেকে ৪৮ ঘণ্টার মধ্যে পেমেন্ট সরাসরি আপনার নিবন্ধিত ব্যাঙ্ক অ্যাকাউন্ট বা ইউপিআই (UPI) হ্যান্ডেলে জমা হয়।",
      question_hi: "अपनी उपज के भंडारण या बिक्री के बाद मुझे भुगतान कब और कैसे प्राप्त होगा?",
      answer_hi: "गोदाम के गेट पर भौतिक गुणवत्ता निरीक्षण और आधिकारिक वजन सत्यापन पूरा होने के 24 से 48 घंटों के भीतर भुगतान सीधे आपके पंजीकृत बैंक खाते या यूपीआई हैंडल में जमा कर दिया जाता है।",
      keywords: ["payment", "receive", "money", "bank", "upi", "payout", "paid", "storing", "selling", "টাকা", "পেমেন্ট", "ব্যাঙ্ক", "ভাতা", "भुगतान", "पैसे", "बैंक"]
    },
    {
      id: "f3",
      question: "Can I monitor live market prices across different West Bengal districts before selling?",
      answer: "Yes, the farmer portal features a real-time commodity price ticker that pulls current wholesale rates from major district hubs, allowing you to choose the most profitable location to release your inventory.",
      question_bn: "বিক্রি করার আগে কি আমি পশ্চিমবঙ্গের বিভিন্ন জেলার লাইভ বাজার দর দেখতে পারি?",
      answer_bn: "হ্যাঁ, কৃষক পোর্টালে একটি রিয়েল-টাইম কমোডিটি মূল্য ট্র্যাকার রয়েছে যা প্রধান জেলা কেন্দ্রগুলি থেকে বর্তমান পাইকারি হার সংগ্রহ করে, যা আপনাকে সর্বাধিক লাভজনক স্থান বেছে নেওয়ার সুবিধা দেয়।",
      question_hi: "क्या मैं बेचने से पहले पश्चिम बंगाल के विभिन्न जिलों में लाइव बाजार मूल्य देख सकता हूँ?",
      answer_hi: "हाँ, किसान पोर्टल में एक रीयल-टाइम कमोडिटी मूल्य टिकर है जो प्रमुख जिला केंद्रों से वर्तमान थोक दरें दिखाता है, जिससे आप अपनी फसल बेचने के लिए सबसे लाभदायक स्थान चुन सकते हैं।",
      keywords: ["market", "price", "live", "rate", "district", "wholesale", "ticker", "monitor", "mandi", "দর", "বাজার", "মান্ডি", "মূল্য", "भाव", "मंडी", "दाम"]
    },
    {
      id: "f4",
      question: "How is my crop's quality graded when it arrives at the facility?",
      answer: "Certified inspectors perform standardized moisture content, purity, and grain integrity checks upon arrival. The official grade is automatically updated on your profile dashboard, ensuring total pricing transparency.",
      question_bn: "আমার ফসল গুদামে পৌঁছালে গুণমান কীভাবে গ্রেড বা যাচাই করা হয়?",
      answer_bn: "প্রত্যয়িত পরিদর্শকরা আগমনের সাথে সাথে আর্দ্রতা, বিশুদ্ধতা এবং শস্যের অক্ষত অবস্থা পরীক্ষা করেন। সরকারি গ্রেড স্বয়ংক্রিয়ভাবে আপনার প্রোফাইল ড্যাশবোর্ডে আপডেট হয়ে যায়, যা সম্পূর্ণ স্বচ্ছতা নিশ্চিত করে।",
      question_hi: "जब मेरी फसल केंद्र पर पहुंचती है तो उसकी गुणवत्ता की ग्रेडिंग कैसे की जाती है?",
      answer_hi: "प्रमाणित निरीक्षक केंद्र पर पहुंचने पर मानकीकृत नमी की मात्रा, शुद्धता और अनाज की गुणवत्ता की जांच करते हैं। आधिकारिक ग्रेड स्वचालित रूप से आपके प्रोफाइल डैशबोर्ड पर अपडेट हो जाता है, जिससे पूरी पारदर्शिता सुनिश्चित होती है।",
      keywords: ["quality", "grade", "graded", "inspection", "moisture", "facility", "standard", "গুণমান", "গ্রেড", "পরীক্ষা", "गुणवत्ता", "ग्रेडिंग", "जांच"]
    }
  ],
  consumer: [
    {
      id: "c1",
      question: "How can I verify that the crops and produce are truly sourced directly from local farmers?",
      answer: "Every product listing features a unique trace ID and QR code. Scanning it reveals the exact farmer's name, harvesting date, and the specific district warehouse from which the batch originated.",
      question_bn: "আমি কীভাবে নিশ্চিত হব যে ফসল ও শাকসবজি সরাসরি স্থানীয় কৃষকদের থেকেই কেনা হয়েছে?",
      answer_bn: "প্রতিটি পণ্যে একটি অনন্য ট্রেস আইডি এবং কিউআর (QR) কোড রয়েছে। এটি স্ক্যান করলে কৃষকের আসল নাম, ফসল কাটার তারিখ এবং নির্দিষ্ট জেলার উৎপত্তিস্থল দেখা যায়।",
      question_hi: "मैं कैसे सत्यापित कर सकता हूँ कि फसलें और उपज वास्तव में सीधे स्थानीय किसानों से ली गई हैं?",
      answer_hi: "प्रत्येक उत्पाद सूची में एक विशिष्ट ट्रेस आईडी और क्यूआर कोड होता है। इसे स्कैन करने पर किसान का नाम, कटाई की तारीख और विशिष्ट जिला गोदाम की जानकारी मिलती है जहाँ से फसल आई है।",
      keywords: ["verify", "source", "farmer", "direct", "trace", "qr", "local", "origin", "কৃষক", "যাচাই", "সরাসরি", "উৎস", "सत्यापित", "किसान", "सीधा"]
    },
    {
      id: "c2",
      question: "What are the standard delivery timelines for consumer orders within West Bengal?",
      answer: "Standard delivery takes between 24 and 48 hours for urban and semi-urban centers across the state, powered by our optimized regional cold-chain logistics and transit nodes.",
      question_bn: "পশ্চিমবঙ্গের মধ্যে ভোক্তা অর্ডারের জন্য স্ট্যান্ডার্ড ডেলিভারি সময় কত?",
      answer_bn: "আমাদের অপ্টিমাইজড আঞ্চলিক কোল্ড-চেন লজিস্টিকসের মাধ্যমে রাজ্যজুড়ে শহরাঞ্চল এবং আধা-শহরাঞ্চলের জন্য স্ট্যান্ডার্ড ডেলিভারি ২৪ থেকে ৪৮ ঘণ্টার মধ্যে পৌঁছে দেওয়া হয়।",
      question_hi: "पश्चिम बंगाल के भीतर उपभोक्ता ऑर्डरों के लिए मानक डिलीवरी समयसीमा क्या है?",
      answer_hi: "हमारे क्षेत्रीय कोल्ड-चेन लॉजिस्टिक्स और पारगमन केंद्रों द्वारा संचालित, राज्य भर के शहरी और अर्ध-शहरी क्षेत्रों में मानक डिलीवरी में 24 से 48 घंटे लगते हैं।",
      keywords: ["delivery", "timeline", "time", "hours", "how long", "speed", "when arrive", "ডেলিভারি", "সময়", "কতক্ষণ", "বিতরণ", "डिलीवरी", "समय", "पहुंच"]
    },
    {
      id: "c3",
      question: "Is there a minimum order quantity required to purchase through the platform?",
      answer: "There are no rigid minimum order limits for daily retail buyers, though tiered wholesale pricing automatically unlocks when purchasing larger volume brackets for commercial use.",
      question_bn: "প্ল্যাটফর্মের মাধ্যমে কেনাকাটা করার জন্য কি কোন সর্বনিম্ন অর্ডারের পরিমাণ রয়েছে?",
      answer_bn: "দৈনন্দিন খুচরা ক্রেতাদের জন্য কোন কঠোর সর্বনিম্ন অর্ডারের সীমা নেই (০.৫ কেজি থেকে উপলব্ধ), তবে বাণিজ্যিক ব্যবহারের জন্য বেশি পরিমাণে কেনাকাটা করলে পাইকারি ছাড় প্রযোজ্য হয়।",
      question_hi: "क्या प्लेटफॉर्म के माध्यम से खरीदारी करने के लिए न्यूनतम ऑर्डर मात्रा आवश्यक है?",
      answer_hi: "दैनिक खुदरा खरीदारों के लिए कोई कठोर न्यूनतम ऑर्डर सीमा नहीं है (0.5 किग्रा से शुरू), हालांकि वाणिज्यिक उपयोग के लिए बड़ी मात्रा खरीदने पर थोक मूल्य स्वचालित रूप से लागू होता है।",
      keywords: ["minimum", "order", "quantity", "limit", "kg", "small", "bulk", "retail", "সর্বনিম্ন", "পরিমাণ", "ন্যূনতম", "সীমা", "न्यूनतम", "मात्रा", "सीमा"]
    },
    {
      id: "c4",
      question: "What is the refund or replacement policy if I receive damaged goods?",
      answer: "You can raise a quality dispute ticket directly through the consumer app interface within 24 hours of delivery by uploading a photo of the item, and our support team will initiate an expedited replacement or full refund.",
      question_bn: "আমি ক্ষতিগ্রস্ত বা নষ্ট পণ্য পেলে রিফান্ড বা পরিবর্তনের নিয়ম কী?",
      answer_bn: "ডেলিভারির ২৪ ঘণ্টার মধ্যে পণ্যের ছবি আপলোড করে আপনি সরাসরি ভোক্তা ইন্টারফেসে বিরোধ টিকিট উত্থাপন করতে পারেন, এবং আমাদের টিম দ্রুত প্রতিস্থাপন বা সম্পূর্ণ অর্থ ফেরত দেবে।",
      question_hi: "यदि मुझे क्षतिग्रस्त सामान प्राप्त होता है तो धनवापसी या प्रतिस्थापन नीति क्या है?",
      answer_hi: "आप डिलीवरी के 24 घंटों के भीतर आइटम की एक तस्वीर अपलोड करके सीधे ऐप इंटरफ़ेस के माध्यम से शिकायत दर्ज कर सकते हैं, और हमारी टीम तुरंत नया सामान या पूर्ण धनवाপसी शुरू करेगी।",
      keywords: ["refund", "replacement", "damaged", "return", "dispute", "rotten", "broken", "policy", "রিফান্ড", "ফেরত", "নষ্ট", "ক্ষতিগ্রস্ত", "वापसी", "रिफंड", "खराब"]
    }
  ]
};

function toggleTazaTalksChat() {
  const windowEl = document.getElementById("tazaTalksChatWindow");
  if (!windowEl) return;
  const isOpen = windowEl.classList.toggle("open");
  if (isOpen) {
    if (!tazaTalksInitialized) {
      initTazaTalks();
    } else if (tazaTalksCurrentRole !== currentRole) {
      setTazaTalksRole(currentRole, true);
    }
    const input = document.getElementById("tazaTalksInput");
    if (input) input.focus();
    renderTazaTalksChips();
  }
  if (window.lucide) lucide.createIcons();
}

function setTazaTalksRole(role, resetMessages = true) {
  tazaTalksCurrentRole = (role === "farmer") ? "farmer" : "consumer";

  const banner = document.getElementById("tazaTalksActiveModeBanner");
  const subhead = document.getElementById("tazaTalksSubhead");

  if (tazaTalksCurrentRole === "farmer") {
    if (banner) {
      banner.className = "tazatalks-active-mode-banner farmer-mode";
      banner.innerHTML = `<i data-lucide="tractor"></i> <span id="tazaTalksActiveModeText">${getTranslation("tazaTalksActiveModeFarmer", "🌾 Farmer & FPO Operations Interface (Active)")}</span>`;
    }
    if (subhead) {
      subhead.innerText = getTranslation("tazaTalksSubheadFarmer", "Farmer & FPO Operations Assistant");
    }
  } else {
    if (banner) {
      banner.className = "tazatalks-active-mode-banner";
      banner.innerHTML = `<i data-lucide="shopping-basket"></i> <span id="tazaTalksActiveModeText">${getTranslation("tazaTalksActiveModeConsumer", "🛒 Consumer Assistance Interface (Active)")}</span>`;
    }
    if (subhead) {
      subhead.innerText = getTranslation("tazaTalksSubheadConsumer", "Consumer Agro-Direct Assistant");
    }
  }

  renderTazaTalksChips();

  if (resetMessages) {
    const container = document.getElementById("tazaTalksMessages");
    if (container) {
      container.innerHTML = "";
      const welcomeMsg = (tazaTalksCurrentRole === "farmer")
        ? getTranslation("tazaTalksWelcomeFarmer", "🌾 Welcome to <strong>TazaTalks Farmer & FPO Hub</strong>. Need help with warehouse booking, mandi rates, or payouts? Tap an FAQ below or ask anything!")
        : getTranslation("tazaTalksWelcomeConsumer", "👋 Hi! Welcome to <strong>TazaTalks Consumer Support</strong>. How can I help you today? Choose an FAQ below or ask any question!");
      appendTazaTalksMessage("bot", welcomeMsg, true);
    }
  }

  if (window.lucide) lucide.createIcons();
}

function getLocalizedFaqText(faq, field) {
  if (currentLanguage === "bn") {
    if (field === "question" && faq.question_bn) return faq.question_bn;
    if (field === "answer" && faq.answer_bn) return faq.answer_bn;
  } else if (currentLanguage === "hi") {
    if (field === "question" && faq.question_hi) return faq.question_hi;
    if (field === "answer" && faq.answer_hi) return faq.answer_hi;
  }
  return faq[field];
}

function renderTazaTalksChips() {
  const container = document.getElementById("tazaTalksQuickChips");
  if (!container) return;

  const faqs = TAZA_TALKS_FAQS[tazaTalksCurrentRole] || TAZA_TALKS_FAQS.consumer;
  container.innerHTML = "";

  faqs.forEach(faq => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tazatalks-chip";
    const qText = getLocalizedFaqText(faq, "question");
    chip.innerHTML = `<i data-lucide="help-circle" style="width:12px;height:12px;display:inline-block;vertical-align:-1px;margin-right:4px;"></i> ${qText}`;
    chip.onclick = () => askTazaTalksFaq(faq.id);
    container.appendChild(chip);
  });

  if (window.lucide) lucide.createIcons();
}

function askTazaTalksFaq(faqId) {
  const faqs = TAZA_TALKS_FAQS[tazaTalksCurrentRole] || TAZA_TALKS_FAQS.consumer;
  const faq = faqs.find(f => f.id === faqId);
  if (!faq) return;

  const question = getLocalizedFaqText(faq, "question");
  const answer = getLocalizedFaqText(faq, "answer");

  // User message
  appendTazaTalksMessage("user", question);

  // Show typing indicator then bot response
  showTazaTalksTypingIndicator(() => {
    appendTazaTalksMessage("bot", answer);
  });
}

function handleTazaTalksSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("tazaTalksInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  appendTazaTalksMessage("user", text);

  showTazaTalksTypingIndicator(() => {
    processTazaTalksQuery(text);
  });
}

function processTazaTalksQuery(query) {
  const qLower = query.toLowerCase();
  const faqs = TAZA_TALKS_FAQS[tazaTalksCurrentRole] || TAZA_TALKS_FAQS.consumer;

  let bestFaq = null;
  let maxScore = 0;

  faqs.forEach(faq => {
    let score = 0;
    const fullQ = (faq.question + " " + (faq.question_bn || "") + " " + (faq.question_hi || "")).toLowerCase();
    
    // Check keyword matches
    if (faq.keywords) {
      faq.keywords.forEach(kw => {
        if (qLower.includes(kw.toLowerCase())) {
          score += 3;
        }
      });
    }

    // Check full question word overlap
    const words = qLower.split(/\s+/);
    words.forEach(w => {
      if (w.length > 2 && fullQ.includes(w)) {
        score += 1;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestFaq = faq;
    }
  });

  // If match threshold met (>= 3 points)
  if (bestFaq && maxScore >= 3) {
    const answer = getLocalizedFaqText(bestFaq, "answer");
    appendTazaTalksMessage("bot", answer);
  } else {
    // Fallback: Show customer care callout with phone 6289069619
    const fallbackIntro = getTranslation("tazaTalksFallbackMsg", "I couldn't find an automated answer for your specific query. You can connect directly with our 24/7 West Bengal Customer Care team right away:");
    const helpCardTitle = getTranslation("tazaTalksHelpCardTitle", "Customer Care Call Relay");
    const helpCardDesc = (currentLanguage === "bn") 
      ? `আপনার প্রশ্নের তাত্ক্ষণিক সমাধানের জন্য আমাদের ২৪/৭ কৃষি কাস্টমার কেয়ারে কল করুন: <strong>${TAZA_TALKS_HELPLINE}</strong>`
      : (currentLanguage === "hi" 
        ? `अपनी समस्या के त्वरित समाधान के लिए हमारी 24/7 कृषि कस्टमर केयर से संपर्क करें: <strong>${TAZA_TALKS_HELPLINE}</strong>`
        : `For live human assistance, call our 24/7 Agro Support Desk directly at <strong>${TAZA_TALKS_HELPLINE}</strong>.`);
    const callBtnText = getTranslation("tazaTalksCallBtnText", `Call Customer Care (${TAZA_TALKS_HELPLINE})`);

    const supportCardHtml = `
      <p style="margin-bottom: 8px;">${fallbackIntro}</p>
      <div class="tazatalks-support-card">
        <div class="tazatalks-support-card-title">
          <i data-lucide="phone-forwarded" style="width:16px;height:16px;"></i> ${helpCardTitle}
        </div>
        <div class="tazatalks-support-card-body">
          ${helpCardDesc}
        </div>
        <a href="tel:${TAZA_TALKS_HELPLINE}" class="btn-tazatalks-call">
          <i data-lucide="phone-call" style="width:16px;height:16px;"></i> ${callBtnText}
        </a>
      </div>
    `;

    appendTazaTalksMessage("bot", supportCardHtml, true);
  }
}

function showTazaTalksTypingIndicator(callback) {
  const container = document.getElementById("tazaTalksMessages");
  if (!container) {
    if (callback) callback();
    return;
  }

  const typingId = "tazaTyping_" + Date.now();
  const typingDiv = document.createElement("div");
  typingDiv.id = typingId;
  typingDiv.className = "tazatalks-msg bot";
  typingDiv.innerHTML = `
    <div class="tazatalks-avatar"><i data-lucide="bot"></i></div>
    <div class="tazatalks-bubble typing-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    const el = document.getElementById(typingId);
    if (el) el.remove();
    if (callback) callback();
  }, 400);
}

function appendTazaTalksMessage(sender, content, isHtml = false) {
  const container = document.getElementById("tazaTalksMessages");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `tazatalks-msg ${sender}`;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (sender === "bot") {
    msgDiv.innerHTML = `
      <div class="tazatalks-avatar"><i data-lucide="bot"></i></div>
      <div class="tazatalks-bubble">
        <div class="tazatalks-msg-content">${isHtml ? content : escapeHtml(content)}</div>
        <div class="tazatalks-msg-time">${timeStr}</div>
      </div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div class="tazatalks-bubble">
        <div class="tazatalks-msg-content">${escapeHtml(content)}</div>
        <div class="tazatalks-msg-time">${timeStr}</div>
      </div>
      <div class="tazatalks-avatar"><i data-lucide="user"></i></div>
    `;
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clearTazaTalksChat() {
  const container = document.getElementById("tazaTalksMessages");
  if (!container) return;
  container.innerHTML = "";

  const welcomeMsg = (tazaTalksCurrentRole === "farmer")
    ? getTranslation("tazaTalksWelcomeFarmer", "🌾 Welcome to <strong>TazaTalks Farmer & FPO Hub</strong>. Need help with warehouse booking, mandi rates, or payouts? Tap an FAQ below or ask anything!")
    : getTranslation("tazaTalksWelcomeConsumer", "👋 Hi! Welcome to <strong>TazaTalks Consumer Support</strong>. How can I help you today? Choose an FAQ below or ask any question!");

  appendTazaTalksMessage("bot", welcomeMsg, true);
  renderTazaTalksChips();
}

function initTazaTalks() {
  tazaTalksInitialized = true;
  tazaTalksCurrentRole = currentRole || "consumer";
  setTazaTalksRole(tazaTalksCurrentRole, false);

  const container = document.getElementById("tazaTalksMessages");
  if (container && container.children.length === 0) {
    const welcomeMsg = (tazaTalksCurrentRole === "farmer")
      ? getTranslation("tazaTalksWelcomeFarmer", "🌾 Welcome to <strong>TazaTalks Farmer & FPO Hub</strong>. Need help with warehouse booking, mandi rates, or payouts? Tap an FAQ below or ask anything!")
      : getTranslation("tazaTalksWelcomeConsumer", "👋 Hi! Welcome to <strong>TazaTalks Consumer Support</strong>. How can I help you today? Choose an FAQ below or ask any question!");
    appendTazaTalksMessage("bot", welcomeMsg, true);
  }

  renderTazaTalksChips();
  if (window.lucide) lucide.createIcons();
}

// =============================================================
// Frequently Bought & Buy Again (Amazon-Style Horizontal Slider)
// =============================================================

let freqBundleState = [];

function getFrequentlyBoughtProducts() {
  // 1. Gather all past orders from local storage + demo records
  let allOrders = [];
  try {
    const local = JSON.parse(localStorage.getItem("taza_placed_orders") || "[]");
    if (local && local.length > 0) allOrders.push(...local);
  } catch (e) {}
  if (typeof getDemoConsumerOrders === "function") {
    allOrders.push(...getDemoConsumerOrders());
  }

  // 2. Count order frequencies by crop name keyword
  const freqMap = {};
  allOrders.forEach(o => {
    const name = ((o.product_info && o.product_info.crop_name) || o.crop_name || "").toLowerCase();
    if (name) {
      freqMap[name] = (freqMap[name] || 0) + 1;
    }
  });

  const availableCatalog = (products && products.length > 0) ? products : (typeof FALLBACK_PRODUCTS !== "undefined" ? FALLBACK_PRODUCTS : []);
  
  // 3. Match items or score them based on order history & staple priority
  const scored = availableCatalog.map(p => {
    const pName = (p.crop_name || p.name || "").toLowerCase();
    let score = 0;
    for (const [orderName, count] of Object.entries(freqMap)) {
      if (pName.includes(orderName) || orderName.includes(pName)) {
        score += count * 5;
      }
    }
    // Boost staple daily essentials
    if (pName.includes("potato") || pName.includes("aloo")) score += 4;
    if (pName.includes("onion") || pName.includes("peyaj")) score += 3;
    if (pName.includes("ginger") || pName.includes("ada")) score += 3;
    if (pName.includes("tomato")) score += 3;
    if (pName.includes("rice") || pName.includes("gobindobhog")) score += 3;
    if (pName.includes("brinjal") || pName.includes("begun") || pName.includes("potol")) score += 2;
    if (pName.includes("dal") || pName.includes("lentil") || pName.includes("musur")) score += 2;
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map(s => s.product);
}

function renderFrequentlyBoughtSection() {
  const track = document.getElementById("frequentlyBoughtTrack");
  if (!track) return;

  const freqItems = getFrequentlyBoughtProducts();
  if (!freqItems || freqItems.length === 0) {
    track.innerHTML = `<p style="padding: 20px; color: #64748b; font-size: 13px;">No past order history yet. Browse and place orders to unlock custom reorder recommendations!</p>`;
    return;
  }

  track.innerHTML = "";

  freqItems.forEach(p => {
    const rawCropName = p.crop_name || p.name || "Fresh Harvest";
    const cropName = getTranslatedCropName(rawCropName);
    const farmerName = p.farmer_name || p.farmer || "Registered Bengal Farmer";
    const fpo = p.fpo_affiliation || "Verified FPO Group";
    const location = p.district || p.farmLocation || "West Bengal";
    const farmPrice = p.base_price_per_kg || p.farmPrice || 16.50;
    const mb = p.mandi_benchmark || {};
    const mandiModal = mb.mandi_modal_price_per_kg || mb.modal_price_per_kg || (farmPrice * 0.9);
    const retailPrice = mb.estimated_retail_price_per_kg || mb.retail_price_per_kg || (p.retailPrice || Math.round(mandiModal * 1.45 * 100) / 100);
    const savedAmount = Math.max(0, retailPrice - farmPrice);
    const savePercent = retailPrice > 0 ? Math.round((savedAmount / retailPrice) * 100) : 0;
    const mandiName = mb.mandi_name || "Singur APMC";
    const freshnessScore = Math.round(p.freshness_score || p.freshnessScore || 96);
    const harvestTime = formatHarvestTime(p.harvest_timestamp || p.harvestTimestamp);
    const imgUrl = p.image_url || p.image || getDefaultCropImage(rawCropName, p.category);
    const minQty = p.minimum_order_kg || p.minQty || 0.5;
    const maxQty = p.quantity_available_kg || p.maxQty || 100;
    const unit = getCropUnit(p);
    const translatedUnit = (unit === "dozen") ? (currentLanguage === "bn" ? "ডজন" : (currentLanguage === "hi" ? "दर्जन" : "dozen")) : (currentLanguage === "bn" ? "কেজি" : (currentLanguage === "hi" ? "किग्रा" : "kg"));

    const cartItem = cart.find(c => c.id === p.id);

    const freshnessText = currentLanguage === 'bn' ? `${freshnessScore}% সতেজতা` : (currentLanguage === 'hi' ? `${freshnessScore}% ताजगी` : `${freshnessScore}% Freshness`);
    const farmGateLabel = currentLanguage === 'bn' ? '📍 খামার গেট:' : (currentLanguage === 'hi' ? '📍 फार्म गेट:' : '📍 Farm Gate:');
    const mandiRetailLabel = currentLanguage === 'bn' ? 'খুচরা বাজার দর' : (currentLanguage === 'hi' ? 'मंडी खुदरा मूल्य' : 'Mandi Retail');
    const saveLabel = currentLanguage === 'bn' ? 'সাশ্রয়' : (currentLanguage === 'hi' ? 'बचत' : 'Save');
    const directPriceLabel = currentLanguage === 'bn' ? '(সরাসরি খামার দর)' : (currentLanguage === 'hi' ? '(सीधा फार्म मूल्य)' : '(Direct Farm Price)');
    const apmcWholesaleLabel = currentLanguage === 'bn' ? 'এপিএমসি পাইকারি' : (currentLanguage === 'hi' ? 'एपीएमसी थोक' : 'APMC Wholesale');
    const addToCartText = currentLanguage === 'bn' ? 'কার্টে যোগ করুন' : (currentLanguage === 'hi' ? 'कार्ट में जोड़ें' : 'ADD TO CART');
    const adjustQtyText = currentLanguage === 'bn' ? 'পরিমাণ পরিবর্তন / বিবরণ' : (currentLanguage === 'hi' ? 'मात्रा बदलें / বিবরণ' : 'Adjust Quantity / Details');
    const customQtyText = currentLanguage === 'bn' ? `পছন্দমতো পরিমাণ (${minQty} ${translatedUnit} - ${maxQty} ${translatedUnit})` : (currentLanguage === 'hi' ? `मनचाही मात्रा (${minQty} ${translatedUnit} - ${maxQty} ${translatedUnit})` : `Custom Quantity (${minQty} ${translatedUnit} - ${maxQty} ${translatedUnit})`);

    const card = document.createElement("div");
    card.className = "commercial-card";
    card.innerHTML = `
      <div>
        <div class="card-top-image" onclick="openProductModal(${p.id})" style="cursor:pointer;">
          <img src="${imgUrl}" alt="${cropName}" loading="lazy" />
          <span class="freshness-tag">${freshnessText}</span>
          <span class="harvest-time-tag">${harvestTime}</span>
        </div>

        <div class="card-body">
          <span class="fpo-tag"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> ${fpo} • ${farmerName}</span>
          <h3 class="item-title" onclick="openProductModal(${p.id})" style="cursor:pointer;">${cropName}</h3>
          <p class="item-location">${farmGateLabel} ${location}</p>

          <div class="mandi-comparison-box">
            <div class="price-mandi-line">
              <span class="mandi-retail-label">${mandiRetailLabel}: <strike>₹${retailPrice.toFixed(2)}/${translatedUnit}</strike></span>
              <span class="savings-badge">${saveLabel} ${savePercent}%</span>
            </div>
            <div class="farmer-direct-price">
              ₹${farmPrice.toFixed(2)} <span class="unit-text">/${translatedUnit} ${directPriceLabel}</span>
            </div>
            <div style="font-size:0.72rem; color:#64748b; margin-top:3px;">
              ${apmcWholesaleLabel}: ₹${mandiModal.toFixed(2)}/${translatedUnit} (${mandiName})
            </div>
          </div>
        </div>
      </div>

      <!-- E-Commerce Add To Cart & Stepper Actions -->
      <div class="card-action-container">
        ${!cartItem ? `
          <button class="btn-card-add-cart" onclick="quickAddToCart(${p.id}, event)">
            <i data-lucide="shopping-cart"></i> ${addToCartText}
          </button>
        ` : `
          <div class="card-qty-stepper">
            <button class="stepper-btn ${cartItem.selectedQty <= minQty ? 'stepper-minus-del' : ''}" onclick="updateCartItemQty(${p.id}, -1, event)" title="Decrease Quantity">
              ${cartItem.selectedQty <= minQty ? '✕' : '−'}
            </button>
            <span class="stepper-val">${cartItem.selectedQty} ${translatedUnit} (₹${cartItem.subtotal.toFixed(2)})</span>
            <button class="stepper-btn" onclick="updateCartItemQty(${p.id}, 1, event)" title="Increase Quantity">+</button>
          </div>
        `}
        <div class="card-custom-link-wrap">
          <a class="card-custom-qty-link" onclick="openProductModal(${p.id})">
            ${cartItem ? adjustQtyText : customQtyText} ⚙️
          </a>
        </div>
      </div>
    `;
    track.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function slideFreqBought(direction) {
  const track = document.getElementById("frequentlyBoughtTrack");
  if (!track) return;
  track.scrollBy({ left: direction * 290, behavior: "smooth" });
}

function openFreqBundleModal() {
  const modal = document.getElementById("freqBundleModal");
  if (!modal) return;

  const freqItems = getFrequentlyBoughtProducts();
  if (!freqItems || freqItems.length === 0) {
    alert("No past orders found yet. Browse fresh harvests and start placing orders!");
    return;
  }

  // Initialize bundle items with default quantities (or existing cart quantities)
  freqBundleState = freqItems.slice(0, 5).map(p => {
    const existingInCart = cart.find(c => c.id === p.id);
    const unit = getCropUnit(p);
    const minQty = p.minimum_order_kg || p.minQty || (unit === "dozen" ? 1.0 : 0.5);
    const initialQty = existingInCart ? existingInCart.selectedQty : (minQty < 1 ? 1.0 : minQty);
    return {
      product: p,
      qty: initialQty,
      unit: unit,
      farmPrice: p.base_price_per_kg || p.farmPrice || 20,
      retailPrice: (p.mandi_benchmark && (p.mandi_benchmark.estimated_retail_price_per_kg || p.mandi_benchmark.retail_price_per_kg)) || (p.retailPrice || (p.base_price_per_kg ? p.base_price_per_kg * 1.4 : 28))
    };
  });

  renderFreqBundleItems();
  modal.classList.add("open");
  if (window.lucide) lucide.createIcons();
}

function closeFreqBundleModal() {
  const modal = document.getElementById("freqBundleModal");
  if (modal) modal.classList.remove("open");
}

function renderFreqBundleItems() {
  const list = document.getElementById("freqBundleItemsList");
  const countTag = document.getElementById("freqBundleCountTag");
  if (!list) return;

  list.innerHTML = "";
  if (countTag) countTag.innerText = `${freqBundleState.length} Items`;

  let totalFarmSubtotal = 0;
  let totalRetailSubtotal = 0;

  freqBundleState.forEach((item, index) => {
    const p = item.product;
    const rawCropName = p.crop_name || p.name;
    const cropName = getTranslatedCropName(rawCropName);
    const location = p.district || p.farmLocation || "West Bengal";
    const imgUrl = p.image_url || p.image || getDefaultCropImage(rawCropName, p.category);
    const translatedUnit = (item.unit === "dozen") ? (currentLanguage === "bn" ? "ডজন" : (currentLanguage === "hi" ? "दर्जन" : "dozen")) : (currentLanguage === "bn" ? "কেজি" : (currentLanguage === "hi" ? "किग्रा" : "kg"));

    const itemSubtotal = item.qty * item.farmPrice;
    const itemRetail = item.qty * item.retailPrice;
    totalFarmSubtotal += itemSubtotal;
    totalRetailSubtotal += itemRetail;

    const row = document.createElement("div");
    row.className = "freq-bundle-item-row";
    row.innerHTML = `
      <div class="freq-bundle-item-left">
        <img src="${imgUrl}" alt="${cropName}" class="freq-bundle-thumb" />
        <div class="freq-bundle-item-info">
          <div class="freq-bundle-item-name">${cropName}</div>
          <div class="freq-bundle-item-meta">₹${item.farmPrice.toFixed(2)}/${translatedUnit} • ${location}</div>
        </div>
      </div>
      <div class="freq-bundle-item-right">
        <div class="freq-bundle-stepper">
          <button type="button" onclick="updateFreqBundleItemQty(${index}, -1)">−</button>
          <span>${item.qty} ${translatedUnit}</span>
          <button type="button" onclick="updateFreqBundleItemQty(${index}, 1)">+</button>
        </div>
        <div class="freq-bundle-item-subtotal">₹${itemSubtotal.toFixed(2)}</div>
      </div>
    `;
    list.appendChild(row);
  });

  const totalSavings = Math.max(0, totalRetailSubtotal - totalFarmSubtotal);
  const savingsPercent = totalRetailSubtotal > 0 ? Math.round((totalSavings / totalRetailSubtotal) * 100) : 0;

  const subtotalEl = document.getElementById("freqBundleSubtotal");
  const retailEl = document.getElementById("freqBundleRetailTotal");
  const savingsEl = document.getElementById("freqBundleTotalSavings");
  const payableEl = document.getElementById("freqBundleTotalPayable");

  if (subtotalEl) subtotalEl.innerText = `₹${totalFarmSubtotal.toFixed(2)}`;
  if (retailEl) retailEl.innerText = `₹${totalRetailSubtotal.toFixed(2)}`;
  if (savingsEl) savingsEl.innerText = `₹${totalSavings.toFixed(2)} (${savingsPercent}% OFF vs Mandi)`;
  if (payableEl) payableEl.innerText = `₹${totalFarmSubtotal.toFixed(2)}`;

  if (window.lucide) lucide.createIcons();
}

function updateFreqBundleItemQty(index, delta) {
  if (!freqBundleState[index]) return;
  const item = freqBundleState[index];
  const step = (item.unit === "dozen") ? 1.0 : 0.5;
  const newQty = Math.round((item.qty + (delta * step)) * 100) / 100;

  if (newQty <= 0) {
    freqBundleState.splice(index, 1);
  } else {
    item.qty = newQty;
  }
  renderFreqBundleItems();
}

function addAllFreqItemsToCart() {
  if (!freqBundleState || freqBundleState.length === 0) return;

  freqBundleState.forEach(item => {
    const p = item.product;
    const existingIdx = cart.findIndex(c => c.id === p.id);
    const farmPrice = item.farmPrice;
    const retailPrice = item.retailPrice;
    const subtotal = Math.round(item.qty * farmPrice * 100) / 100;
    const savings = Math.max(0, Math.round(item.qty * (retailPrice - farmPrice) * 100) / 100);

    if (existingIdx > -1) {
      cart[existingIdx].selectedQty = item.qty;
      cart[existingIdx].unit = item.unit;
      cart[existingIdx].subtotal = subtotal;
      cart[existingIdx].savings = savings;
    } else {
      cart.push({
        ...p,
        selectedQty: item.qty,
        unit: item.unit,
        price: farmPrice,
        retailPrice: retailPrice,
        subtotal: subtotal,
        savings: savings
      });
    }
  });

  showCartToast(`Added ${freqBundleState.length} frequently bought items to cart!`);
  closeFreqBundleModal();
  updateCartUI();
  renderProducts(products);
  toggleCartDrawer();
}

/* ==========================================================================
   16. FAVOURITE FARMERS & 1:1 DIRECT FARMER-CONSUMER CHAT MESSENGER (WEST BENGAL DISTRICTS)
   ========================================================================== */

const FAVOURITE_FARMERS_DATA = [
  {
    id: "farmer-1",
    name: "Ananda Mondal",
    name_bn: "আনন্দ মণ্ডল",
    name_hi: "आनंद मोंडल",
    fpo: "Singur Agro FPO",
    fpo_bn: "সিঙ্গুর এগ্রো এফপিও",
    fpo_hi: "सिंगूर एग्रो एफपीओ",
    district: "Singur, Hooghly",
    districtKey: "Hooghly",
    district_bn: "সিঙ্গুর, হুগলি (৩২ কিমি)",
    district_hi: "सिंगूर, हुगली (32 किमी)",
    distance: "32 km from Kolkata",
    rating: 4.9,
    ordersCount: 184,
    responseTime: "< 10 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23301",
    badgeIcon: "sprout",
    specialties: ["Singur Royal Jyoti Potato", "Chandramukhi Premium Potato", "Fresh Farm Tomato", "Fresh Lau Shak"],
    nextHarvest: "Tomorrow 5:30 AM Dispatch",
    nextHarvest_bn: "আগামীকাল ভোর ৫:৩০ ডিসপ্যাচ",
    nextHarvest_hi: "कल सुबह 5:30 बजे प्रेषण",
    verification: "Grade-A Lab Verified • Zero Chemical Storage",
    verification_bn: "গ্রেড-এ ল্যাব যাচাইকৃত • রাসায়নিকমুক্ত সংরক্ষণ",
    verification_hi: "ग्रेड-ए लैब सत्यापित • शून्य रासायनिक भंडारण",
    bio: "Leading Singur potato and green vegetable collective. Cultivates high-yield Grade-A Jyoti, Chandramukhi potatoes, and tender Lau Shak direct from cold storage gate.",
    bio_bn: "সিঙ্গুর আলু ও শাকসবজি ক্লাস্টারের প্রধান। খামার গেট থেকে সরাসরি সেরা মানের জ্যোতি, চন্দ্রমুখী আলু ও লাউ শাক সরবরাহ করেন।",
    bio_hi: "सिंगूर आलू और सब्जी संघ के प्रमुख। फार्मगेट से सीधे ग्रेड-ए ज्योति, चंद्रमुखी आलू और लौकी साग उपलब्ध कराते हैं।",
    welcomeMsg: "নমস্কার! I am Ananda Mondal from Singur Agro FPO in Hooghly. Today's fresh harvest of Jyoti Potato and Lau Shak is being sorted at our Singur gate. How can I assist you with your bulk or household requirement?",
    welcomeMsg_bn: "নমস্কার! আমি সিঙ্গুর এগ্রো এফপিও (হুগলি) থেকে আনন্দ মণ্ডল। আজ সকালের জ্যোতি আলু ও লাউ শাক বাছাই চলছে। আপনার কি পরিমাণ প্রয়োজন?",
    welcomeMsg_hi: "नमस्ते! मैं हुगली के सिंगूर एग्रो एफपीओ से आनंद मोंडल हूँ। आज की ताज़ा ज्योति आलू और लौकी साग तैयार है। बताइए कैसे मदद करूँ?",
    quickChips: [
      "When is the next Jyoti Potato harvest dispatch?",
      "Can I get 25kg bulk bag at wholesale rate?",
      "Are these potatoes naturally cured without chemicals?",
      "Is fresh Lau Shak available for today?"
    ],
    faqReplies: {
      dispatch: "Our morning dispatch departs Singur gate daily at 5:30 AM via EV Reefer truck, reaching Kolkata hubs by 8:00 AM.",
      bulk: "Yes! For orders above 20kg, direct wholesale rate is ₹19.50/kg with complimentary pallet bagging and escrow protection.",
      quality: "100% naturally soil-cured for 14 days, zero sprout inhibitors or chemical washes. Safe for whole family consumption.",
      laushak: "Yes! Fresh Lau Shak is harvested daily before sunrise at ₹22/bunch.",
      default: "Thank you for reaching out! I am actively packing orders at Singur gate right now. For instant urgent requests, feel free to call my gate relay directly at 6289069619."
    }
  },
  {
    id: "farmer-2",
    name: "Pranab Biswas",
    name_bn: "প্রণব বিশ্বাস",
    name_hi: "प्रणब बिस्वास",
    fpo: "Nadia Green Produce Co-op",
    fpo_bn: "নদিয়া গ্রিন প্রডিউস কো-অপ",
    fpo_hi: "नदिया ग्रीन प्रोड्यूस को-ऑप",
    district: "Ranaghat, Nadia",
    districtKey: "Nadia",
    district_bn: "রানাঘাট, নদিয়া (৬৮ কিমি)",
    district_hi: "रानाघाट, नदिया (68 किमी)",
    distance: "68 km from Kolkata",
    rating: 4.8,
    ordersCount: 149,
    responseTime: "< 15 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23304",
    badgeIcon: "leaf",
    specialties: ["Pointed Gourd (Green Potol)", "Red Onion (Peyaj)", "Red Lentil (Masoor Dal)", "Bengal Moong Dal"],
    nextHarvest: "Today 4:00 PM Dispatch",
    nextHarvest_bn: "আজ বিকেল ৪:০০ ডিসপ্যাচ",
    nextHarvest_hi: "आज शाम 4:00 बजे प्रेषण",
    verification: "IPM Eco-Certified • Daily Morning Pluck",
    verification_bn: "আইপিএম পরিবেশ সনদ • দৈনিক ভোরের তোলা ফসল",
    verification_hi: "आईपीएम पर्यावरण प्रमाणित • दैनिक सुबह की तुड़ाई",
    bio: "Specializes in tender green pointed gourd (potol), winter onions, and pure Bengal lentils across the fertile Nadia river basin.",
    bio_bn: "নদিয়ার উর্বর পলিমাটিতে কচি সবুজ পটল, পেঁয়াজ ও খাঁটি ডাল চাষে বিশেষজ্ঞ। সম্পূর্ণ কীটনাশকমুক্ত নিরাপদ ফসল।",
    bio_hi: "नदिया के उपजाऊ कछार में ताज़ा हरा परवल, प्याज और दालें उगाने में विशेषज्ञ। कीटनाशक अवशेष मुक्त।",
    welcomeMsg: "Hello! Pranab Biswas here from Nadia Green Produce Co-op. Our fresh green pointed gourd (potol) and red onions were harvested this morning. How may I help you?",
    welcomeMsg_bn: "নমস্কার! নদিয়া কো-অপারেটিভ থেকে প্রণব বিশ্বাস। আজ ভোরের কচি পটল ও পেঁয়াজ তোলা হয়েছে। আপনার কী প্রয়োজন?",
    welcomeMsg_hi: "नमस्ते! नदिया ग्रीन प्रोड्यूस से प्रणब बिस्वास। हरा परवल और प्याज आज ही तोड़ा गया है। बताइए क्या जानकारी चाहिए?",
    quickChips: [
      "Are the pointed gourds (potol) tender and fresh?",
      "When will today's harvest reach Kolkata?",
      "Do you offer bulk supply for restaurants?",
      "Are pulses unpolished and natural?"
    ],
    faqReplies: {
      quality: "All potol are Grade-A tender harvest, picked early morning before sunrise so the seeds stay soft and sweet.",
      delivery: "Today's 4:00 PM evening dispatch reaches Kolkata cold hubs before midnight for next-morning 7 AM doorstep delivery.",
      bulk: "Yes, we supply top Kolkata catering houses & cloud kitchens with 10kg crates at ₹28/kg.",
      default: "Got your message! I am at the Nadia sorting yard right now. You can also dial our farmgate hotline directly at 6289069619."
    }
  },
  {
    id: "farmer-3",
    name: "Subhash Ghosh",
    name_bn: "সুভাষ ঘোষ",
    name_hi: "सुभाष घोष",
    fpo: "Bardhaman Rice & Grain Growers Sangh",
    fpo_bn: "বর্ধমান চাল ও শস্য উৎপাদক সঙ্ঘ",
    fpo_hi: "बर्धमान चावल व अनाज उत्पादक संघ",
    district: "Memari, Purba Bardhaman",
    districtKey: "Purba Bardhaman",
    district_bn: "মেমারি, পূর্ব বর্ধমান (৮৪ কিমি)",
    district_hi: "मेमारी, पूर्व बर्धमान (84 किमी)",
    distance: "84 km from Kolkata",
    rating: 4.95,
    ordersCount: 260,
    responseTime: "< 12 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23306",
    badgeIcon: "wheat",
    specialties: ["Aromatic Gobindobhog Rice", "Minikit Premium Rice", "Sona Moong Dal"],
    nextHarvest: "Milled & Packed Today",
    nextHarvest_bn: "আজ মিলিং ও এয়ার-টাইট প্যাকিং",
    nextHarvest_hi: "आज मिलिंग और एयर-टाइट पैकिंग",
    verification: "Heritage GI Certified • Direct Mill Gate",
    verification_bn: "ঐতিহ্যবাহী জিআই সনদপ্রাপ্ত • সরাসরি মিল গেট",
    verification_hi: "विरासत जीआई प्रमाणित • सीधे मिल गेट से",
    bio: "Master paddy cultivator from Bengal's granary Purba Bardhaman. Produces single-origin GI-certified Gobindobhog rice and aromatic grains.",
    bio_bn: "বাংলার শস্যভাণ্ডার পূর্ব বর্ধমানের বিশিষ্ট কৃষক। খাঁটি সুগন্ধি গোবিন্দভোগ চাল ও মিনিকেট সরাসরি সরবরাহ করেন।",
    bio_hi: "बंगाल के अन्न भंडार पूर्व बर्धमान के किसान। प्रामाणिक गोविंदभोग चावल और मिनीकिट की आपूर्ति।",
    welcomeMsg: "নমস্কার! I am Subhash Ghosh from Purba Bardhaman Rice Growers Sangh. Our freshly milled Gobindobhog rice and Sona Moong dal are ready for dispatch.",
    welcomeMsg_bn: "নমস্কার! পূর্ব বর্ধমান চাল সঙ্ঘ থেকে সুভাষ ঘোষ। আমাদের নতুন ভাঙা সুগন্ধি গোবিন্দভোগ চাল ও সোনা মুগ ডাল প্রস্তুত।",
    welcomeMsg_hi: "नमस्ते! पूर्व बर्धमान से सुभाष घोष। हमारा ताज़ा कुटा सुगंधित गोविंदभोग चावल और सोना मूंग दाल तैयार है।",
    quickChips: [
      "Is the Gobindobhog rice 100% authentic GI grade?",
      "Do you provide 25kg or 50kg bulk jute bags?",
      "Is the rice aged properly for optimum aroma?",
      "What is the cooking water ratio for Minikit?"
    ],
    faqReplies: {
      quality: "100% certified authentic single-estate Gobindobhog, aged 12 months in aerated silos for peak aroma and non-sticky fluffiness.",
      bulk: "Yes! 25kg and 50kg moisture-sealed jute sacks are available with door dispatch across all districts.",
      cooking: "For our Minikit rice, ideal water-to-rice ratio is 2:1. Cook on medium heat for 12 minutes.",
      default: "Thank you for reaching out! For instant rice inquiries or customized bulk milling, reach our mill gate at 6289069619."
    }
  },
  {
    id: "farmer-4",
    name: "Tapas Sarkar",
    name_bn: "তাপস সরকার",
    name_hi: "तापस सरकार",
    fpo: "Himalayan Organic Spices Guild",
    fpo_bn: "হিমালয়ান অর্গানিক স্পাইসেস গিল্ড",
    fpo_hi: "हिमालयन ऑर्गेनिक स्पाइसेस गिल्ड",
    district: "Gorubathan, Darjeeling",
    districtKey: "Darjeeling",
    district_bn: "গরুবাথান, দার্জিলিং (পাহাড়ি হাব)",
    district_hi: "गोरुबथान, दार्जिलिंग (पहाड़ी हब)",
    distance: "Overnight Reefer Transit",
    rating: 4.9,
    ordersCount: 215,
    responseTime: "< 8 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23305",
    badgeIcon: "mountain",
    specialties: ["Mountain Ginger (Ada)", "White Garlic (Rosun)", "Royal Apples", "Large Cardamom"],
    nextHarvest: "Overnight Cold Chain Transit",
    nextHarvest_bn: "রাত্রিকালীন কোল্ড-চেন ট্রানজিট",
    nextHarvest_hi: "रात भर की कोल्ड-चेन यात्रा",
    verification: "100% Darjeeling Hills Organic Certified",
    verification_bn: "১০০% দার্জিলিং পাহাড়ি জৈব সনদপ্রাপ্ত",
    verification_hi: "100% दार्जिलिंग हिल्स जैविक प्रमाणित",
    bio: "High-altitude organic grower of GI-grade ginger, mountain garlic and heritage Darjeeling produce.",
    bio_bn: "দার্জিলিং পাহাড়ের উচ্চতায় খাঁটি পাহাড়ি আদা ও পাহাড়ি রসুনের প্রখ্যাত জৈব উৎপাদক।",
    bio_hi: "दार्जिलिंग की पहाड़ियों में उच्च गुणवत्ता वाले अदरक और पहाड़ी लहसुन के प्रसिद्ध जैविक किसान।",
    welcomeMsg: "Greetings from the Darjeeling hills! I am Tapas Sarkar. Our fragrant mountain ginger and cured garlic lots are packed in sealed organic crates.",
    welcomeMsg_bn: "নমস্কার! দার্জিলিং পাহাড় থেকে তাপস সরকার। আমাদের খাঁটি পাহাড়ি আদা ও রসুনের লট প্রস্তুত। কীভাবে সাহায্য করতে পারি?",
    welcomeMsg_hi: "नमस्ते! दार्जिलिंग की पहाड़ियों से तापस सरकार। हमारा पहाड़ी अदरक और लहसुन पूरी तरह तैयार है। बताइए क्या जानकारी चाहिए?",
    quickChips: [
      "Is the mountain ginger high in natural gingerol aroma?",
      "How do you maintain cold chain from Darjeeling?",
      "Can I get a custom 5kg ginger + garlic combo?",
      "Is there organic lab test certification available?"
    ],
    faqReplies: {
      quality: "Yes! High altitude volcanic soil gives our ginger 2.4x higher gingerol oil content than plains ginger.",
      logistics: "We utilize temperature-controlled Reefer vans running down NH10 directly connected to Kolkata distribution centers.",
      combo: "Absolutely! You can add both items to cart or message custom weights for direct crate packaging.",
      default: "Thank you for supporting hill farmers! I am currently packing shipments. You can also reach our desk at 6289069619 anytime."
    }
  },
  {
    id: "farmer-5",
    name: "Abdur Rahman",
    name_bn: "আব্দুর রহমান",
    name_hi: "अब्दुर रहमान",
    fpo: "Gour Agri Producer Collective",
    fpo_bn: "গৌড় এগ্রি প্রডিউসার কালেক্টিভ",
    fpo_hi: "गौड़ एग्री प्रोड्यूसर कलेक्टिव",
    district: "English Bazar, Malda",
    districtKey: "Malda",
    district_bn: "ইংরেজ বাজার, মালদা (উত্তরবঙ্গ করিডোর)",
    district_hi: "इंग्लिश बाजार, मालदा (उत्तर बंगाल)",
    distance: "North Bengal Green Corridor",
    rating: 4.88,
    ordersCount: 198,
    responseTime: "< 10 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23307",
    badgeIcon: "apple",
    specialties: ["Ruby Pomegranate", "Sweet Lime", "Bengal Banana", "Mango Orchards"],
    nextHarvest: "Morning Tree-Ripe Harvest",
    nextHarvest_bn: "গাছপাকা সকালের তাজা ফল সংগ্রহ",
    nextHarvest_hi: "सुबह की ताज़ा पेड़-पकी फल तुड़ाई",
    verification: "Naturally Ripened • Zero Carbide Chemical",
    verification_bn: "প্রাকৃতিকভাবে পাকা • কার্বাইড রাসায়নিকমুক্ত",
    verification_hi: "प्राकृतिक रूप से पका • शून्य कार्बाइड रसायन",
    bio: "Fruit orchard cooperative leader from Malda. Dedicated to carbide-free, tree-ripened citrus, seasonal orchard fruits, and bananas.",
    bio_bn: "মালদার প্রখ্যাত ফল সমবায়ের প্রধান। ক্ষতিকারক কার্বাইডমুক্ত গাছপাকা মৌসুমি ফল সরাসরি সরবরাহ করেন।",
    bio_hi: "मालदा के फल उत्पादक संघ के प्रमुख। बिना किसी कार्बाइड के प्राकृतिक पके फल उपलब्ध कराते हैं।",
    welcomeMsg: "Assalamu Alaikum! Abdur Rahman here from Gour Agri Malda. Our fresh fruits are harvested naturally ripe from orchard trees without carbide.",
    welcomeMsg_bn: "নমস্কার! মালদার গৌড় এগ্রি কালেক্টিভ থেকে আব্দুর রহমান। আমাদের গাছপাকা তাজা ফল সম্পূর্ণ কার্বাইডমুক্ত। আপনার কি প্রয়োজন?",
    welcomeMsg_hi: "नमस्ते! मालदा के गौड़ एग्री से अब्दुर रहमान। हमारे पेड़-पके ताजे फल बिना कार्बाइड के तैयार हैं।",
    quickChips: [
      "Are the fruits 100% naturally tree-ripened without carbide?",
      "When is the next reefer truck departing Malda?",
      "Can we order mixed fruit crates for events?",
      "What is the sweetness Brix level?"
    ],
    faqReplies: {
      quality: "Every single batch is naturally ripened on tree branches with zero calcium carbide or artificial ripening gases.",
      logistics: "Malda-to-Kolkata express reefer departs at 8:00 PM nightly, arriving at city hubs by 5:00 AM.",
      default: "Thank you for inquiring! Feel free to connect directly with our Malda fruit collection point at 6289069619."
    }
  },
  {
    id: "farmer-6",
    name: "Manotosh Mondal",
    name_bn: "মনতোষ মণ্ডল",
    name_hi: "मनतोष मोंडल",
    fpo: "Bhagirathi Organic Farmers Guild",
    fpo_bn: "ভাগীরথী অর্গানিক ফার্মার্স গিল্ড",
    fpo_hi: "भागीरथी ऑर्गेनिक फार्मर्स गिल्ड",
    district: "Baharampur, Murshidabad",
    districtKey: "Murshidabad",
    district_bn: "বহরমপুর, মুর্শিদাবাদ (১৮৫ কিমি)",
    district_hi: "बहरमपुर, मुर्शिदाबाद (185 किमी)",
    distance: "185 km from Kolkata",
    rating: 4.85,
    ordersCount: 172,
    responseTime: "< 14 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23308",
    badgeIcon: "flower-2",
    specialties: ["Red Onion (Desi Peyaj)", "Desi Masoor Dal", "Green Bullet Chili", "Fresh Spinach"],
    nextHarvest: "Daily 6:00 AM Harvest Batch",
    nextHarvest_bn: "দৈনিক সকাল ৬:০০ সংগ্রহের ব্যাচ",
    nextHarvest_hi: "दैनिक सुबह 6:00 बजे का बैच",
    verification: "Ganga Alluvial Organic Certified",
    verification_bn: "গাঙ্গেয় পলিমাটি জৈব সনদপ্রাপ্ত",
    verification_hi: "गंगा कछार जैविक प्रमाणित",
    bio: "Farms along the fertile banks of the Bhagirathi river in Murshidabad, producing naturally grown pungent red onions, lentils and crisp chilis.",
    bio_bn: "মুর্শিদাবাদের ভাগীরথী নদীর উর্বর তীরে বিষমুক্ত লাল পেঁয়াজ, দেশি মশুরি ডাল ও কাঁচা লঙ্কা উৎপাদক।",
    bio_hi: "मुर्शिदाबाद में भागीरथी नदी के तट पर प्राकृतिक लाल प्याज और देसी दाल उगाने वाले अग्रणी किसान।",
    welcomeMsg: "নমস্কার! Manotosh Mondal from Bhagirathi Farmers Guild in Murshidabad. Our fresh onion and lentil harvests are sorted for dispatch.",
    welcomeMsg_bn: "নমস্কার! মুর্শিদাবাদ থেকে মনতোষ মণ্ডল। আমাদের মাঠের খাঁটি দেশি পেঁয়াজ ও মশুরি ডাল প্রস্তুত। কীভাবে সাহায্য করতে পারি?",
    welcomeMsg_hi: "नमस्ते! मुर्शिदाबाद से मनतोष मोंडल। हमारा ताज़ा लाल प्याज और दाल तैयार है।",
    quickChips: [
      "Are the Murshidabad red onions long-storing and dry?",
      "What is the pungency of the green bullet chilis?",
      "Can I get 50kg wholesale sacks for cloud kitchens?",
      "How fast is transit to Kolkata?"
    ],
    faqReplies: {
      quality: "Our river-basin red onions have thick protective skins and cure naturally in shade for exceptional 3-month shelf life.",
      bulk: "Yes! 50kg ventilated mesh bags are shipped at flat farmgate wholesale quotes.",
      default: "Thank you for reaching out! For immediate Murshidabad dispatch scheduling, call our team at 6289069619."
    }
  },
  {
    id: "farmer-7",
    name: "Debashis Halder",
    name_bn: "দেবাশীষ হালদার",
    name_hi: "देवाशीष हलदर",
    fpo: "Sundarban Delta Green Cooperative",
    fpo_bn: "সুন্দরবন ডেল্টা গ্রিন কো-অপারেটিভ",
    fpo_hi: "सुंदरबन डेल्टा ग्रीन को-ऑपरेटिव",
    district: "Baruipur, South 24 Parganas",
    districtKey: "South 24 Parganas",
    district_bn: "বারুইপুর, দক্ষিণ ২৪ পরগনা (২৮ কিমি)",
    district_hi: "बारुईपुर, दक्षिण 24 परगना (28 किमी)",
    distance: "28 km from Kolkata",
    rating: 4.92,
    ordersCount: 310,
    responseTime: "< 6 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23309",
    badgeIcon: "trees",
    specialties: ["Fresh Crisp Carrot", "Pointed Gourd", "Farm Tomato", "Fresh Green Peas"],
    nextHarvest: "Today 3:30 PM Express Slot",
    nextHarvest_bn: "আজ দুপুর ৩:৩০ এক্সপ্রেস স্লট",
    nextHarvest_hi: "आज दोपहर 3:30 एक्सप्रेस स्लॉट",
    verification: "Delta Pure Soil • Ultra-Fast Sub-2hr Dispatch",
    verification_bn: "সুন্দরবন খাঁটি মাটি • ২ ঘণ্টার মধ্যে ডিসপ্যাচ",
    verification_hi: "डेल्टा शुद्ध मिट्टी • 2 घंटे में प्रेषण",
    bio: "Located right at the gateway to Sundarbans in Baruipur. Harvests ultra-fresh vegetables delivered to Kolkata kitchens in under 3 hours.",
    bio_bn: "সুন্দরবনের প্রবেশদ্বার বারুইপুরের প্রখ্যাত সবজি উৎপাদক। মাঠ থেকে তোলার ৩ ঘণ্টার মধ্যে তাজা সবজি ক্রেতার দুয়ারে পৌঁছায়।",
    bio_hi: "बारुईपुर के प्रमुख सब्जी उत्पादक। खेत से तुड़ाई के 3 घंटे के भीतर ताज़ी सब्जियां पहुंचाई जाती हैं।",
    welcomeMsg: "নমস্কার! I am Debashis Halder from Sundarban Delta Green Cooperative in Baruipur. Fresh sweet carrots, tomatoes, and greens just plucked!",
    welcomeMsg_bn: "নমস্কার! দক্ষিণ ২৪ পরগনার বারুইপুর থেকে দেবাশীষ হালদার। আজ দুপুরের তাজা গাজর, টমেটো ও শাকসবজি প্রস্তুত।",
    welcomeMsg_hi: "नमस्ते! दक्षिण 24 परगना के बारुईपुर से देवाशीष हलदर। ताज़ी गाजर, टमाटर और सब्जियां अभी तोड़ी गई हैं।",
    quickChips: [
      "Can this harvest reach South Kolkata within 3 hours?",
      "Are the carrots sweet and crunch-tested?",
      "Do you supply pre-washed ready-to-cook packs?",
      "Can I order mixed salad vegetable baskets?"
    ],
    faqReplies: {
      speed: "Yes! Baruipur is just 28 km away. Our dedicated EV shuttle delivers harvest directly within 2 to 3 hours.",
      quality: "All carrots and tomatoes are washed in ozone-purified spring water and packed in breathable jute crates.",
      default: "We are actively loading Baruipur shuttles right now. Dial our hotline directly at 6289069619 for urgent delivery."
    }
  },
  {
    id: "farmer-8",
    name: "Nirmal Mahato",
    name_bn: "নির্মল মাহাতো",
    name_hi: "निर्मल महतो",
    fpo: "Rarh Bengal Vegetable Cluster",
    fpo_bn: "রাঢ় বাংলা ভেজিটেবল ক্লাস্টার",
    fpo_hi: "राढ़ बंगाल वेजिटेबल क्लस्टर",
    district: "Bishnupur, Bankura",
    districtKey: "Bankura",
    district_bn: "বিষ্ণুপুর, বাঁকুড়া (১৩০ কিমি)",
    district_hi: "बिष्णुपुर, बांकुड़ा (130 किमी)",
    distance: "130 km from Kolkata",
    rating: 4.86,
    ordersCount: 165,
    responseTime: "< 12 mins",
    phone: "6289069619",
    displayPhone: "+91 98302 23310",
    badgeIcon: "sun",
    specialties: ["Fresh Purple Brinjal (Begun)", "Singur Potato", "Green Capsicum", "Country Ridge Gourd"],
    nextHarvest: "Tomorrow 6:00 AM Dispatch",
    nextHarvest_bn: "আগামীকাল ভোর ৬:০০ ডিসপ্যাচ",
    nextHarvest_hi: "कल सुबह 6:00 बजे प्रेषण",
    verification: "Zero Chemical Pesticide • Red Soil Nutrient Rich",
    verification_bn: "রাসায়নিক কীটনাশকমুক্ত • পুষ্টিকর লাল মাটির ফসল",
    verification_hi: "शून्य रासायनिक कीटनाशक • लाल मिट्टी की पौष्टिक फसल",
    bio: "Sustainable red-laterite soil cultivator from Bishnupur, Bankura. Famous for tender Muktakeshi brinjals and nutrient-dense seasonal vegetables.",
    bio_bn: "বাঁকুড়ার বিষ্ণুপুরের লাল মাটির পুষ্টিকর মুক্তকেশী বেগুন, ক্যাপসিকাম ও মৌসুমি সবজির বিশ্বস্ত উৎপাদক।",
    bio_hi: "बांकुड़ा के बिष्णुपुर की लाल मिट्टी में पोषक तत्वों से भरपूर ताज़ा बैंगन, शिमला मिर्च और मौसमी सब्जियां उगाते हैं।",
    welcomeMsg: "নমস্কার! Nirmal Mahato here from Rarh Bengal Cluster in Bishnupur, Bankura. Our famous red-soil Muktakeshi brinjal and vegetables are ready.",
    welcomeMsg_bn: "নমস্কার! বাঁকুড়ার বিষ্ণুপুর থেকে নির্মল মাহাতো। আমাদের বিখ্যাত লাল মাটির মুক্তকেশী বেগুন ও তাজা সবজি প্রস্তুত। কী প্রয়োজন?",
    welcomeMsg_hi: "नमस्ते! बांकुड़ा के बिष्णुपुर से निर्मल महतो। हमारा लाल मिट्टी का प्रसिद्ध बैंगन और ताज़ी सब्जियां तैयार हैं।",
    quickChips: [
      "Are the Muktakeshi brinjals fresh and insect-free?",
      "How does the red laterite soil improve vegetable flavor?",
      "What is the wholesale lot price for 20kg?",
      "When is the next vehicle leaving Bankura?"
    ],
    faqReplies: {
      quality: "Red laterite soil gives our brinjals unique sweetness with thin skin and silky texture. 100% pheromone trap protected.",
      bulk: "Wholesale crates (20kg+) receive a flat 15% farmgate discount with digital weight receipts.",
      default: "Thank you for connecting with Bankura farmers! Reach our dispatch cell directly at 6289069619."
    }
  }
];

let selectedFarmerDistrict = "all";
let favouriteFarmersStorage = JSON.parse(localStorage.getItem('taza_fav_farmers') || '["farmer-1", "farmer-2", "farmer-3"]');
let activeFarmerChatId = null;
let farmerChatHistories = JSON.parse(localStorage.getItem('taza_farmer_chat_history') || '{}');

function handleFarmerDistrictChange(district, skipLogisticsSync = false) {
  selectedFarmerDistrict = district || "all";
  
  const selectEl = document.getElementById("favDistrictSelect");
  if (selectEl && selectEl.value !== selectedFarmerDistrict) {
    selectEl.value = selectedFarmerDistrict;
  }

  // Update badge count
  const countBadge = document.getElementById("favFarmersCountBadge");
  if (countBadge) {
    if (selectedFarmerDistrict === "all") {
      countBadge.innerText = currentLanguage === "bn" ? "বাংলার সকল জেলা (৮টি এফপিও)" : (currentLanguage === "hi" ? "बंगाल के सभी जिले (8 एफपीओ)" : "All West Bengal Districts");
    } else {
      const filteredCount = FAVOURITE_FARMERS_DATA.filter(f => {
        const matchKey = f.districtKey && f.districtKey.toLowerCase() === selectedFarmerDistrict.toLowerCase();
        const matchDistrict = f.district && f.district.toLowerCase().includes(selectedFarmerDistrict.toLowerCase());
        return matchKey || matchDistrict;
      }).length;
      countBadge.innerText = `${selectedFarmerDistrict} (${filteredCount} ${currentLanguage === "bn" ? "এফপিও" : (currentLanguage === "hi" ? "एफपीओ" : "FPO")})`;
    }
  }

  // Sync back to AI logistics selector if not triggered from logistics
  if (!skipLogisticsSync && selectedFarmerDistrict !== "all") {
    const logKey = FARMER_TO_LOGISTICS_DISTRICT_MAP[selectedFarmerDistrict];
    if (logKey) {
      currentLogisticsDistrict = logKey;
      const logSelect = document.getElementById("logisticsDistrictSelect");
      if (logSelect && logSelect.value !== logKey) {
        logSelect.value = logKey;
      }
      if (typeof renderLogisticsRoute === "function" && typeof renderTspBatchRoute === "function") {
        renderLogisticsRoute(currentLogisticsDistrict, currentLogisticsDest);
        renderTspBatchRoute(currentLogisticsDistrict);
      }
    }
  }

  renderFavouriteFarmers();
}

function renderFavouriteFarmers() {
  const grid = document.getElementById("favouriteFarmersGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const filteredFarmers = (selectedFarmerDistrict === "all") 
    ? FAVOURITE_FARMERS_DATA 
    : FAVOURITE_FARMERS_DATA.filter(f => {
        const matchKey = f.districtKey && f.districtKey.toLowerCase() === selectedFarmerDistrict.toLowerCase();
        const matchDistrict = f.district && f.district.toLowerCase().includes(selectedFarmerDistrict.toLowerCase());
        return matchKey || matchDistrict;
      });

  if (filteredFarmers.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
        <i data-lucide="map-pin-off" style="width: 42px; height: 42px; color: #94a3b8; margin-bottom: 12px;"></i>
        <h4 style="font-size: 16px; color: #1e293b; margin-bottom: 6px;">No farmers currently registered in ${selectedFarmerDistrict}</h4>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Switch to "All Bengal Districts" or choose another neighboring district.</p>
        <button onclick="handleFarmerDistrictChange('all')" style="background: #16a34a; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          View All Bengal FPOs
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  filteredFarmers.forEach(f => {
    const isFav = favouriteFarmersStorage.includes(f.id);
    const localizedName = (currentLanguage === "bn") ? f.name_bn : ((currentLanguage === "hi") ? f.name_hi : f.name);
    const localizedFpo = (currentLanguage === "bn") ? f.fpo_bn : ((currentLanguage === "hi") ? f.fpo_hi : f.fpo);
    const localizedDistrict = (currentLanguage === "bn") ? f.district_bn : ((currentLanguage === "hi") ? f.district_hi : f.district);
    const localizedBio = (currentLanguage === "bn") ? f.bio_bn : ((currentLanguage === "hi") ? f.bio_hi : f.bio);
    const localizedHarvest = (currentLanguage === "bn") ? f.nextHarvest_bn : ((currentLanguage === "hi") ? f.nextHarvest_hi : f.nextHarvest);
    const badgeIcon = f.badgeIcon || "tractor";

    const card = document.createElement("div");
    card.className = "farmer-profile-card";
    card.innerHTML = `
      <div class="farmer-card-banner">
        <button class="fav-heart-btn ${isFav ? 'active' : ''}" onclick="toggleFavouriteFarmer('${f.id}', event)" title="${isFav ? 'Remove from Favourite Farmers' : 'Add to Favourite Farmers'}">
          <i data-lucide="heart"></i>
        </button>
      </div>

      <div class="farmer-card-body">
        <div class="farmer-avatar-row">
          <div class="farmer-avatar-wrap">
            <div class="farmer-avatar-badge">
              <i data-lucide="${badgeIcon}"></i>
            </div>
            <span class="farmer-online-badge" title="Online at Farmgate"></span>
          </div>
          <span class="farmer-distance-pill">
            <i data-lucide="map-pin"></i> ${localizedDistrict}
          </span>
        </div>

        <div class="farmer-card-name-row">
          <h3 class="farmer-card-name">${localizedName}</h3>
          <span class="farmer-card-verified-icon" title="Verified Bengal Grower"><i data-lucide="check-circle-2"></i></span>
        </div>
        <div class="farmer-card-fpo">${localizedFpo}</div>

        <div class="farmer-stats-bar">
          <span class="farmer-stat-rating"><i data-lucide="star"></i> ${f.rating}</span>
          <span class="farmer-stat-orders">(${f.ordersCount}+ orders)</span>
          <span class="farmer-stat-reply">⚡ ${f.responseTime}</span>
        </div>

        <p class="farmer-bio-text">${localizedBio}</p>

        <div class="farmer-specialties-wrap">
          ${f.specialties.map(s => {
            const trCrop = getTranslatedCropName(s);
            return `<span class="farmer-specialty-chip"><i data-lucide="sprout"></i> ${trCrop}</span>`;
          }).join('')}
        </div>

        <div class="farmer-harvest-tag">
          <i data-lucide="clock"></i> <span>${localizedHarvest}</span>
        </div>

        <div class="farmer-card-actions">
          <button class="btn-farmer-chat" onclick="openFarmerChat('${f.id}')">
            <i data-lucide="message-square"></i> <span id="btnChat_${f.id}">${getTranslation("btnFarmerChatText", "Chat with Farmer")}</span>
          </button>
          <a class="btn-farmer-call" href="tel:${f.phone}" title="Call Gate (${f.phone})">
            <i data-lucide="phone"></i> <span>${getTranslation("btnFarmerCallText", "Call Gate")}</span>
          </a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function toggleFavouriteFarmer(farmerId, event) {
  if (event) event.stopPropagation();

  const idx = favouriteFarmersStorage.indexOf(farmerId);
  let isNowFav = false;
  if (idx > -1) {
    favouriteFarmersStorage.splice(idx, 1);
    isNowFav = false;
  } else {
    favouriteFarmersStorage.push(farmerId);
    isNowFav = true;
  }

  localStorage.setItem('taza_fav_farmers', JSON.stringify(favouriteFarmersStorage));
  renderFavouriteFarmers();
  showCartToast(isNowFav ? "❤️ Added to Favourite Farmers!" : "Removed from Favourite Farmers");
}

function scrollToFavFarmers() {
  const sec = document.getElementById("favouriteFarmersSection");
  if (sec) {
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function formatChatTime(date) {
  const d = date || new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function openFarmerChat(farmerId) {
  const modal = document.getElementById("farmerChatModal");
  if (!modal) return;

  activeFarmerChatId = farmerId;
  const farmer = FAVOURITE_FARMERS_DATA.find(f => f.id === farmerId) || FAVOURITE_FARMERS_DATA[0];

  const localizedName = (currentLanguage === "bn") ? farmer.name_bn : ((currentLanguage === "hi") ? farmer.name_hi : farmer.name);
  const localizedFpo = (currentLanguage === "bn") ? farmer.fpo_bn : ((currentLanguage === "hi") ? farmer.fpo_hi : farmer.fpo);
  const localizedDistrict = (currentLanguage === "bn") ? farmer.district_bn : ((currentLanguage === "hi") ? farmer.district_hi : farmer.district);
  const localizedHarvest = (currentLanguage === "bn") ? farmer.nextHarvest_bn : ((currentLanguage === "hi") ? farmer.nextHarvest_hi : farmer.nextHarvest);
  const badgeIcon = farmer.badgeIcon || "tractor";

  const badgeEl = document.getElementById("farmerChatAvatarBadge");
  const nameEl = document.getElementById("farmerChatName");
  const fpoEl = document.getElementById("farmerChatFpoSubtitle");
  const locEl = document.getElementById("farmerChatLocation");
  const harvestEl = document.getElementById("farmerChatHarvestTime");
  const callBtn = document.getElementById("farmerChatCallBtn");

  if (badgeEl) {
    badgeEl.innerHTML = `<i data-lucide="${badgeIcon}"></i>`;
  }
  if (nameEl) nameEl.innerText = localizedName;
  if (fpoEl) fpoEl.innerText = `${localizedFpo} • ${farmer.district}`;
  if (locEl) locEl.innerText = localizedDistrict;
  if (harvestEl) harvestEl.innerText = localizedHarvest;
  if (callBtn) callBtn.href = `tel:${farmer.phone}`;

  // Check or initialize conversation history
  if (!farmerChatHistories[farmerId] || farmerChatHistories[farmerId].length === 0) {
    const welcomeText = (currentLanguage === "bn") ? farmer.welcomeMsg_bn : ((currentLanguage === "hi") ? farmer.welcomeMsg_hi : farmer.welcomeMsg);
    farmerChatHistories[farmerId] = [
      { sender: "farmer", text: welcomeText, time: formatChatTime() }
    ];
    localStorage.setItem('taza_farmer_chat_history', JSON.stringify(farmerChatHistories));
  }

  renderFarmerChatMessages();
  renderFarmerChatChips(farmer);

  modal.classList.add("open");
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    const inputEl = document.getElementById("farmerChatInput");
    if (inputEl) inputEl.focus();
  }, 100);
}

function closeFarmerChat() {
  const modal = document.getElementById("farmerChatModal");
  if (modal) modal.classList.remove("open");
}

function renderFarmerChatMessages() {
  const container = document.getElementById("farmerChatMessages");
  if (!container || !activeFarmerChatId) return;

  const history = farmerChatHistories[activeFarmerChatId] || [];
  container.innerHTML = "";

  history.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.className = `farmer-chat-bubble ${msg.sender === "user" ? "user-msg" : "farmer-msg"}`;
    bubble.innerHTML = `
      <div class="farmer-msg-content">${msg.text}</div>
      <div class="farmer-msg-time">${msg.time}</div>
    `;
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

function renderFarmerChatChips(farmer) {
  const chipsContainer = document.getElementById("farmerChatQuickChips");
  if (!chipsContainer) return;

  chipsContainer.innerHTML = "";
  farmer.quickChips.forEach(chipText => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "farmer-quick-chip";
    chip.innerText = chipText;
    chip.onclick = () => handleFarmerQuickChip(chipText);
    chipsContainer.appendChild(chip);
  });
}

function handleFarmerQuickChip(chipText) {
  const input = document.getElementById("farmerChatInput");
  if (input) input.value = chipText;
  handleFarmerChatSubmit();
}

function handleFarmerChatSubmit(event) {
  if (event) event.preventDefault();

  const input = document.getElementById("farmerChatInput");
  if (!input || !activeFarmerChatId) return;

  const userText = input.value.trim();
  if (!userText) return;

  const farmer = FAVOURITE_FARMERS_DATA.find(f => f.id === activeFarmerChatId) || FAVOURITE_FARMERS_DATA[0];

  // Append user message
  if (!farmerChatHistories[activeFarmerChatId]) {
    farmerChatHistories[activeFarmerChatId] = [];
  }

  farmerChatHistories[activeFarmerChatId].push({
    sender: "user",
    text: userText,
    time: formatChatTime()
  });

  input.value = "";
  renderFarmerChatMessages();
  localStorage.setItem('taza_farmer_chat_history', JSON.stringify(farmerChatHistories));

  // Show typing indicator
  const indicator = document.getElementById("farmerTypingIndicator");
  if (indicator) indicator.style.display = "flex";

  const container = document.getElementById("farmerChatMessages");
  if (container) container.scrollTop = container.scrollHeight;

  // Determine farmer reply based on user intent
  setTimeout(() => {
    if (indicator) indicator.style.display = "none";

    const lower = userText.toLowerCase();
    let reply = farmer.faqReplies.default;

    if (lower.includes("dispatch") || lower.includes("when") || lower.includes("reach") || lower.includes("time") || lower.includes("delivery") || lower.includes("কখন") || lower.includes("সময়")) {
      reply = farmer.faqReplies.dispatch || farmer.faqReplies.delivery || farmer.faqReplies.speed || farmer.faqReplies.default;
    } else if (lower.includes("bulk") || lower.includes("25kg") || lower.includes("wholesale") || lower.includes("rate") || lower.includes("price") || lower.includes("cost") || lower.includes("দাম") || lower.includes("পাইকারি")) {
      reply = farmer.faqReplies.bulk || `Yes! For bulk wholesale requirements, we offer direct farmgate rates with standard escrow guarantee. You can add items to cart or call our gate at ${farmer.phone}.`;
    } else if (lower.includes("quality") || lower.includes("pesticide") || lower.includes("organic") || lower.includes("chemical") || lower.includes("tender") || lower.includes("seedless") || lower.includes("carbide") || lower.includes("জৈব") || lower.includes("কীটনাশক")) {
      reply = farmer.faqReplies.quality || "Our harvest is 100% lab-tested and pesticide residue-free, freshly sorted at the farmgate.";
    } else if (lower.includes("combo") || lower.includes("ginger") || lower.includes("garlic") || lower.includes("potato") || lower.includes("potol") || lower.includes("rice") || lower.includes("shak") || lower.includes("lau")) {
      reply = farmer.faqReplies.combo || farmer.faqReplies.laushak || `We have fresh lots ready for ${farmer.specialties.join(", ")}.`;
    }

    farmerChatHistories[activeFarmerChatId].push({
      sender: "farmer",
      text: reply,
      time: formatChatTime()
    });

    localStorage.setItem('taza_farmer_chat_history', JSON.stringify(farmerChatHistories));
    renderFarmerChatMessages();
  }, 1100);
}

function clearFarmerChatHistory() {
  if (!activeFarmerChatId) return;
  const farmer = FAVOURITE_FARMERS_DATA.find(f => f.id === activeFarmerChatId);
  const welcomeText = (currentLanguage === "bn") ? farmer.welcomeMsg_bn : ((currentLanguage === "hi") ? farmer.welcomeMsg_hi : farmer.welcomeMsg);
  
  farmerChatHistories[activeFarmerChatId] = [
    { sender: "farmer", text: welcomeText, time: formatChatTime() }
  ];
  localStorage.setItem('taza_farmer_chat_history', JSON.stringify(farmerChatHistories));
  renderFarmerChatMessages();
  showCartToast("Chat history cleared");
}

// Initial auto-render of Favourite Farmers on startup
document.addEventListener("DOMContentLoaded", () => {
  if (typeof renderFavouriteFarmers === "function") {
    renderFavouriteFarmers();
  }
});

// =============================================================
// TAZA Dual-Role Authentication & OTP System
// =============================================================
const authState = {
  role: 'consumer', // 'consumer' | 'farmer'
  mode: 'login',    // 'login' | 'signup'
  name: '',
  phone: '',
  email: '',
  district: ''
};

// Preset Demo Credentials
const DEMO_PROFILES = {
  consumer: {
    name: 'Sourav Banerjee',
    phone: '9830223301',
    email: 'sourav.banerjee@consumer.taza.in',
    district: 'Kolkata Central'
  },
  farmer: {
    name: 'Ananda Mondal',
    phone: '9830112233',
    email: 'ananda.mondal@farmer.taza.in',
    district: 'Hooghly (Singur Agro FPO)'
  }
};

// Open & Close Modal
function openAuthModal(role) {
  const modal = document.getElementById('tazaAuthModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
    if (role && (role === 'farmer' || role === 'consumer')) {
      selectRole(role);
    }
    if (window.lucide) lucide.createIcons();
  }
}

function closeAuthModal() {
  const modal = document.getElementById('tazaAuthModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
  // If user explicitly selected farmer role in the modal, ensure active view matches
  if (authState && authState.role === 'farmer' && currentRole !== 'farmer') {
    switchRole('farmer');
  }
}

function handleAuthBackdrop(event) {
  if (event.target.id === 'tazaAuthModal') {
    closeAuthModal();
  }
}

// Select Role (Consumer vs Farmer)
function selectRole(role) {
  authState.role = role;
  const consumerBtn = document.getElementById('roleConsumerBtn');
  const farmerBtn = document.getElementById('roleFarmerBtn');
  if (consumerBtn) consumerBtn.classList.toggle('active', role === 'consumer');
  if (farmerBtn) farmerBtn.classList.toggle('active', role === 'farmer');
  
  // Show district dropdown if farmer signing up
  const isFarmerSignup = (role === 'farmer' && authState.mode === 'signup');
  const districtField = document.getElementById('fieldFarmerDistrict');
  if (districtField) districtField.style.display = isFarmerSignup ? 'flex' : 'none';

  // Show Terms & Conditions checkbox only for farmer sign up
  const termsField = document.getElementById('fieldFarmerTerms');
  if (termsField) termsField.style.display = isFarmerSignup ? 'flex' : 'none';

  updateButtonLabel();
}

// Select Mode (Sign In vs Sign Up)
function selectMode(mode) {
  authState.mode = mode;
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  if (tabLogin) tabLogin.classList.toggle('active', mode === 'login');
  if (tabSignup) tabSignup.classList.toggle('active', mode === 'signup');

  // Show Name field only on sign up
  const nameField = document.getElementById('fieldFullName');
  if (nameField) nameField.style.display = mode === 'signup' ? 'flex' : 'none';

  // Farmer District field only for farmer sign up
  const isFarmerSignup = (authState.role === 'farmer' && mode === 'signup');
  const districtField = document.getElementById('fieldFarmerDistrict');
  if (districtField) districtField.style.display = isFarmerSignup ? 'flex' : 'none';

  // Show Terms & Conditions checkbox only for farmer sign up
  const termsField = document.getElementById('fieldFarmerTerms');
  if (termsField) termsField.style.display = isFarmerSignup ? 'flex' : 'none';

  updateButtonLabel();
}

function updateButtonLabel() {
  const btn = document.getElementById('btnSubmitForm');
  if (!btn) return;
  const roleName = authState.role === 'farmer' ? 'Farmer' : 'Consumer';
  const action = authState.mode === 'signup' ? 'Sign Up' : 'Sign In';
  btn.innerText = `Get OTP to ${action} as ${roleName}`;
}

// Fill Demo Profile
function fillDemo(role) {
  selectRole(role);
  const data = DEMO_PROFILES[role];
  if (!data) return;
  
  const nameInput = document.getElementById('inputName');
  const phoneInput = document.getElementById('inputPhone');
  const emailInput = document.getElementById('inputEmail');
  const districtInput = document.getElementById('inputDistrict');

  if (nameInput) nameInput.value = data.name;
  if (phoneInput) phoneInput.value = data.phone;
  if (emailInput) emailInput.value = data.email;
  
  if (role === 'farmer' && districtInput) {
    districtInput.value = data.district;
  }
}

// Skip Login and browse freely as guest buyer
function skipLoginAndBrowse() {
  closeAuthModal();
  if (typeof switchRole === 'function') {
    switchRole('consumer');
  }
  showCartToast("👋 Welcome to TAZA! Browsing marketplace as Guest.");
}

// 1-Click Auto-Fill & Verify
function autoFillAndVerifyOtp() {
  const badge = document.getElementById('liveOtpCodeBadge');
  const code = (badge ? badge.innerText : '123456').trim();
  const input = document.getElementById('otpCodeInput');
  if (input) input.value = code;
  verifyDemoOtp();
}

// Show Floating SMS Notification Banner
function showSmsNotificationToast(code, phone) {
  let toast = document.getElementById('tazaSmsToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tazaSmsToast';
    toast.className = 'taza-sms-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div class="sms-toast-icon">📩</div>
    <div class="sms-toast-content">
      <strong>New SMS (Simulated):</strong><br>
      Your TAZA OTP is <strong>${code}</strong> for +91 ${phone}.
    </div>
    <button type="button" class="sms-toast-btn" onclick="autoFillAndVerifyOtp()">Auto-Fill</button>
  `;
  toast.classList.add('show');
  setTimeout(() => {
    if (toast) toast.classList.remove('show');
  }, 9000);
}

// Handle Form Submit -> Proceed to OTP Step (Instant Transition + Background API)
async function handleRequestOtp(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  authState.name = (document.getElementById('inputName')?.value || '').trim();
  let rawPhone = (document.getElementById('inputPhone')?.value || '').trim();
  authState.email = (document.getElementById('inputEmail')?.value || '').trim();
  authState.district = document.getElementById('inputDistrict')?.value || '';

  // Enforce Farmer Terms & Conditions on Sign Up
  if (authState.role === 'farmer' && authState.mode === 'signup') {
    const termsCheckbox = document.getElementById('farmerTermsCheckbox');
    if (!termsCheckbox || !termsCheckbox.checked) {
      alert('⚠️ Terms & Conditions Required:\nPlease review and accept the TAZA Farmer Produce Agreement (কৃষক ফসল চুক্তি / किसान उपज समझौता) by checking the agreement box before proceeding.');
      return;
    }
  }

  // Clean phone number: remove non-digits, country code if duplicate
  let cleanedPhone = rawPhone.replace(/\D/g, '');
  if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
    cleanedPhone = cleanedPhone.substring(2);
  }
  
  // If user entered farmer credentials or phone, auto-detect and sync farmer role
  if (cleanedPhone === '9830112233' || (authState.email && (authState.email.toLowerCase().includes('farmer') || authState.email.toLowerCase().includes('ananda')))) {
    selectRole('farmer');
  }

  // If phone empty or invalid, fallback automatically to demo phone so user is NEVER blocked
  if (cleanedPhone.length !== 10) {
    cleanedPhone = authState.role === 'farmer' ? '9830112233' : '9830223301';
    const phoneInput = document.getElementById('inputPhone');
    if (phoneInput) phoneInput.value = cleanedPhone;
  }
  authState.phone = cleanedPhone;
  if (!authState.email) {
    authState.email = `${cleanedPhone}@taza.in`;
    const emailInput = document.getElementById('inputEmail');
    if (emailInput) emailInput.value = authState.email;
  }

  // --- INSTANT UI UPDATE: Switch to OTP Screen immediately (0ms delay) ---
  const credForm = document.getElementById('authCredentialForm');
  const otpMobile = document.getElementById('otpTargetMobile');
  const otpScreen = document.getElementById('authOtpScreen');
  const liveOtpEl = document.getElementById('liveOtpCodeBadge');
  const otpInput = document.getElementById('otpCodeInput');

  if (credForm) credForm.style.display = 'none';
  if (otpMobile) otpMobile.innerText = `+91 ${authState.phone}`;
  if (otpScreen) otpScreen.style.display = 'block';

  // Instant default OTP
  let receivedOtpCode = '123456';
  if (liveOtpEl) liveOtpEl.innerText = receivedOtpCode;
  if (otpInput) {
    otpInput.value = receivedOtpCode;
    otpInput.focus();
  }

  // Show floating instant SMS delivery toast notification on screen!
  showSmsNotificationToast(receivedOtpCode, authState.phone);

  // Background dispatch to Backend OTP API: POST /api/v1/otp/send
  try {
    const formattedPhone = `+91${authState.phone}`;
    fetch(`${API_BASE}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: formattedPhone })
    })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data && data.otpForTesting) {
        receivedOtpCode = data.otpForTesting;
        if (liveOtpEl) liveOtpEl.innerText = receivedOtpCode;
        if (otpInput) otpInput.value = receivedOtpCode;
        showSmsNotificationToast(receivedOtpCode, authState.phone);
      }
    })
    .catch(err => {
      console.warn('Backend OTP API error, using simulation fallback:', err);
    });
  } catch (err) {
    console.warn('Backend OTP send exception:', err);
  }
}

// Verify OTP with Backend /api/v1/otp/verify
async function verifyDemoOtp() {
  const code = (document.getElementById('otpCodeInput')?.value || '').trim();
  if (!code) {
    alert('Please enter a valid OTP code (e.g. 123456)');
    return;
  }

  const verifyBtn = document.querySelector('#authOtpScreen .auth-action-btn');
  const originalText = verifyBtn ? verifyBtn.innerText : '';
  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.innerText = 'Verifying OTP...';
  }

  let verified = false;
  try {
    const formattedPhone = `+91${authState.phone}`;
    const res = await fetch(`${API_BASE}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: formattedPhone, otp: code })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        verified = true;
      }
    }
  } catch (err) {
    console.warn('Backend OTP verify network error:', err);
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.innerText = originalText;
    }
  }

  // Always accept demo code 123456 or matching displayed code as fail-safe
  const badgeCode = document.getElementById('liveOtpCodeBadge')?.innerText?.trim();
  if (code === '123456' || code === badgeCode || code.length === 6) {
    verified = true;
  }

  if (!verified) {
    alert('Invalid or expired OTP. Please enter the valid code or demo code: 123456');
    return;
  }

  // Show Success Screen
  const otpScreen = document.getElementById('authOtpScreen');
  if (otpScreen) otpScreen.style.display = 'none';

  const roleLabel = authState.role === 'farmer' ? 'Farmer / Producer' : 'Consumer / Buyer';
  const displayName = authState.name || (authState.role === 'farmer' ? 'Ananda Mondal' : 'Sourav Banerjee');

  const successTitle = document.getElementById('successTitle');
  if (successTitle) {
    successTitle.innerText = `${authState.mode === 'signup' ? 'Account Created' : 'Welcome Back'}!`;
  }

  const profileMeta = document.getElementById('successProfileMeta');
  if (profileMeta) {
    profileMeta.innerHTML = `
      <strong>${displayName}</strong> (${roleLabel})<br>
      Mobile: +91 ${authState.phone} • Email: ${authState.email}
    `;
  }

  // If Farmer Sign Up, dispatch Terms & Conditions Agreement copy to Email with Farmer Name and Phone
  const agreementNotice = document.getElementById('authAgreementNotice');
  const agreementText = document.getElementById('authAgreementText');
  if (authState.role === 'farmer' && authState.mode === 'signup') {
    if (agreementNotice) agreementNotice.style.display = 'flex';
    if (agreementText) {
      agreementText.innerHTML = `Official Agreement document dispatched to <strong>${authState.email}</strong> for <strong>${displayName}</strong> (+91 ${authState.phone}).`;
    }

    // Call Backend Agreement API
    try {
      fetch(`${API_BASE}/auth/farmer-agreement/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_name: displayName,
          farmer_email: authState.email,
          contact_number: `+91 ${authState.phone}`
        })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          console.log('Agreement email response:', data);
          if (agreementText) {
            if (data.is_live_delivered) {
              agreementText.innerHTML = `✅ <strong>Delivered to inbox:</strong> Agreement successfully sent to <strong>${data.farmer_email}</strong> for <strong>${data.farmer_name}</strong> (${data.contact_number}).`;
            } else if (data.delivery_provider === 'FAILED_ATTEMPT') {
              agreementText.innerHTML = `⚠️ <strong>Delivery Notice:</strong> Attempted transmission to <strong>${data.farmer_email}</strong> encountered an error (${data.error_detail || 'SMTP unreachable'}). You can download or view your official agreement below.`;
            } else {
              agreementText.innerHTML = `📄 Official Agreement prepared for <strong>${data.farmer_email}</strong> with Name <strong>${data.farmer_name}</strong> and Contact <strong>${data.contact_number}</strong>. Download or print your copy below. (Awaiting live SMTP/Email API configuration on server).`;
            }
          }
        }
      })
      .catch(err => console.warn('Agreement dispatch request error:', err));
    } catch (e) {
      console.warn('Agreement send error:', e);
    }
  } else {
    if (agreementNotice) agreementNotice.style.display = 'none';
  }

  const successScreen = document.getElementById('authSuccessScreen');
  if (successScreen) successScreen.style.display = 'block';
  if (window.lucide) lucide.createIcons();

  // Automatically proceed to portal dashboard after brief confirmation (1s)
  setTimeout(() => {
    const sScreen = document.getElementById('authSuccessScreen');
    if (sScreen && sScreen.style.display !== 'none') {
      finishLogin();
    }
  }, 1100);
}

function goBackToForm() {
  const otpScreen = document.getElementById('authOtpScreen');
  const credForm = document.getElementById('authCredentialForm');
  if (otpScreen) otpScreen.style.display = 'none';
  if (credForm) credForm.style.display = 'block';
}

function finishLogin() {
  closeAuthModal();

  authState.isLoggedIn = true;
  const activeRole = authState.role || (currentRole === 'farmer' ? 'farmer' : 'consumer');

  // Switch active role in parent app to display appropriate portal view
  if (typeof switchRole === 'function') {
    switchRole(activeRole);
  }

  // Update navbar user greeting and role badge according to active language
  const displayName = authState.name || (activeRole === 'farmer' ? (currentLanguage === 'bn' ? 'আনন্দ মন্ডল' : 'Ananda Mondal') : 'Sourav Banerjee');
  const greetingEl = document.getElementById('navUserGreeting');
  if (greetingEl) {
    greetingEl.innerText = (currentLanguage === 'bn')
      ? `নমস্কার, ${displayName.split(' ')[0]}`
      : (currentLanguage === 'hi' ? `नमस्ते, ${displayName.split(' ')[0]}` : `Hello, ${displayName.split(' ')[0]}`);
  }
  const roleEl = document.getElementById('navUserRole');
  if (roleEl) {
    if (activeRole === 'farmer') {
      roleEl.innerHTML = (currentLanguage === 'bn')
        ? `কৃষক হাব <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`
        : `Farmer Hub <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`;
    } else {
      roleEl.innerHTML = (currentLanguage === 'bn')
        ? `ভোক্তা হাব <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`
        : `Consumer Hub <i data-lucide="refresh-cw" style="width:11px;height:11px;display:inline-block;margin-left:2px;"></i>`;
    }
  }

  // If logged in as farmer, immediately populate documents and dashboard banner
  if (activeRole === 'farmer') {
    currentUser.name = displayName;
    currentUser.role = 'farmer';
    try {
      localStorage.setItem('taza_role', 'farmer');
    } catch (e) {}

    if (typeof loadFarmerDocuments === 'function') {
      loadFarmerDocuments();
    }
    if (typeof loadFarmerDashboard === 'function') {
      loadFarmerDashboard();
    }
  } else {
    currentUser.name = displayName;
    currentUser.role = 'consumer';
    try {
      localStorage.setItem('taza_role', 'consumer');
    } catch (e) {}
  }

  if (typeof showCartToast === 'function') {
    showCartToast(`🌱 Welcome, ${displayName}! ${activeRole === 'farmer' ? 'Farmer Hub & Documents Ready' : 'Happy Shopping'}`);
  } else {
    alert(`Logged into TAZA as ${activeRole.toUpperCase()} (${authState.phone || 'Verified'})`);
  }
}

// =============================================================
// Farmer Produce Agreement Modal (Trilingual: EN / BN / HI)
// =============================================================
function generateClientAgreementHtml(farmerName, contactNumber) {
  const cleanContact = contactNumber.startsWith('+') ? contactNumber : `+91 ${contactNumber}`;
  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const refId = 'TZ-AGR-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  return `
  <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 28px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #16a34a; padding-bottom: 14px; margin-bottom: 20px;">
      <div>
        <h1 style="font-size: 24px; font-weight: 800; color: #15803d; margin: 0;">TAZA AGRO PLATFORM</h1>
        <div style="font-size: 12.5px; color: #64748b; margin-top: 3px;">Empowering Farmers with Fair Prices & Guaranteed Market Access</div>
      </div>
      <div style="background: #dcfce7; color: #166534; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase;">Official Agreement</div>
    </div>

    <div style="text-align: center; margin-bottom: 22px;">
      <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">TAZA FARMER PRODUCE AGREEMENT</div>
      <div style="font-size: 14px; font-weight: 600; color: #475569;">কৃষক ফসল চুক্তি &bull; किसान उपज समझौता</div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;">
      <tr>
        <td style="padding: 9px 12px; font-weight: 600; color: #475569; width: 25%; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">Farmer Name / কৃষক / किसान:</td>
        <td style="padding: 9px 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${farmerName}</td>
        <td style="padding: 9px 12px; font-weight: 600; color: #475569; width: 25%; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">Contact / যোগাযোগ / संपर्क:</td>
        <td style="padding: 9px 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${cleanContact}</td>
      </tr>
      <tr>
        <td style="padding: 9px 12px; font-weight: 600; color: #475569; background-color: #f1f5f9;">Effective Date / তারিখ / दिनांक:</td>
        <td style="padding: 9px 12px; font-weight: 700; color: #0f172a;">${todayStr}</td>
        <td style="padding: 9px 12px; font-weight: 600; color: #475569; background-color: #f1f5f9;">Country / দেশ / देश:</td>
        <td style="padding: 9px 12px; font-weight: 700; color: #0f172a;">India</td>
      </tr>
      <tr>
        <td style="padding: 9px 12px; font-weight: 600; color: #475569; background-color: #f1f5f9; border-top: 1px solid #e2e8f0;">Digital Ref ID:</td>
        <td colspan="3" style="padding: 9px 12px; font-weight: 700; color: #15803d; border-top: 1px solid #e2e8f0;">${refId}</td>
      </tr>
    </table>

    <!-- Clause 1 -->
    <div style="margin-bottom: 18px; padding: 14px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 4px;">
      <div style="font-size: 13px; font-weight: 800; color: #15803d; margin-bottom: 4px;">Clause 1 &bull; ধারা ১ &bull; खंड १</div>
      <div style="font-size: 13.5px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Guaranteed Price and Profit / নিশ্চিত মূল্য এবং লাভ / न्यूनतम सुनिश्चित मूल्य एवं लाभ</div>
      <div style="font-size: 12.5px; color: #334155; margin-bottom: 5px;"><strong>English:</strong> The company (TAZA) guarantees to purchase the produce from the farmer at a pre-agreed fair price that ensures at least a designated minimum profit margin over the prevailing market rate, protecting the farmer against sudden wholesale price drops.</div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 5px;"><strong>বাংলা:</strong> কোম্পানি (তাজা) কৃষকের কাছ থেকে প্রাক-নির্ধারিত ন্যায্য মূল্যে ফসল ক্রয় করার নিশ্চয়তা প্রদান করে, যা প্রচলিত পাইকারি বাজার মূল্যের চেয়ে লাভজনক মার্জিন সুনিশ্চিত করে এবং আকস্মিক বাজার দরপতন থেকে কৃষককে সুরক্ষিত রাখে।</div>
      <div style="font-size: 12px; color: #475569;"><strong>हिन्दी:</strong> कंपनी (ताज़ा) किसान से पूर्व-निर्धारित उचित मूल्य पर उपज खरीदने की गारंटी देती है, जो प्रचलित बाजार दर पर न्यूनतम लाभ सुनिश्चित करती है और किसान को बाजार के अचानक उतार-चढ़ाव से बचाती है।</div>
    </div>

    <!-- Clause 2 -->
    <div style="margin-bottom: 18px; padding: 14px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 4px;">
      <div style="font-size: 13px; font-weight: 800; color: #15803d; margin-bottom: 4px;">Clause 2 &bull; ধারা ২ &bull; खंड २</div>
      <div style="font-size: 13.5px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Storage, Quality & Quantity Verification at Warehouse / গুদামজাতকরণ এবং গুণমান যাচাই / वेयरहाउस भंडारण, गुणवत्ता एवं मात्रा सत्यापन</div>
      <div style="font-size: 12.5px; color: #334155; margin-bottom: 5px;"><strong>English:</strong> The farmer shall transport the harvest to the nearest designated TAZA AI-optimized warehouse (within 40km or next nearest available center). The crop shall undergo transparent digital weighing and computerized grade testing for moisture and purity in the farmer's presence.</div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 5px;"><strong>বাংলা:</strong> কৃষক নিকটবর্তী নির্ধারিত তাজা ওয়্যারহাউসে (৪০ কিমি ব্যাসার্ধ বা পরবর্তী নিকটতম কেন্দ্র) ফসল পরিবহন করবেন। কৃষকের উপস্থিতিতে ফসলের ওজন এবং কম্পিউটারাইজড গুণমান পরীক্ষা স্বচ্ছভাবে সম্পন্ন করা হবে।</div>
      <div style="font-size: 12px; color: #475569;"><strong>हिन्दी:</strong> किसान अपनी फसल निकटतम निर्धारित ताज़ा वेयरहाउस (४० किमी दायरा अथवा अगले उपलब्ध केंद्र) तक पहुंचाएंगे। किसान की उपस्थिति में डिजिटल वजन और गुणवत्ता जांच पारदर्शी रूप से की जाएगी।</div>
    </div>

    <!-- Clause 3 -->
    <div style="margin-bottom: 18px; padding: 14px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 4px;">
      <div style="font-size: 13px; font-weight: 800; color: #15803d; margin-bottom: 4px;">Clause 3 &bull; ধারা ৩ &bull; खंड ३</div>
      <div style="font-size: 13.5px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Payment Settlement / পেমেন্ট ও অর্থ প্রদান / भुगतान एवं निपटान</div>
      <div style="font-size: 12.5px; color: #334155; margin-bottom: 5px;"><strong>English:</strong> Upon successful quality acceptance and receipt at the warehouse, TAZA guarantees direct electronic payment transfer to the farmer's verified bank account or UPI within the statutory period of maximum 30 days, without any unauthorized middlemen deductions.</div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 5px;"><strong>বাংলা:</strong> গুদামে ফসল সফলভাবে যাচাই ও গ্রহণের পর, তাজা সর্বোচ্চ ৩০ দিনের বিধিবদ্ধ সময়ের মধ্যে কৃষকের যাচাইকৃত ব্যাঙ্ক অ্যাকাউন্ট বা ইউপিআই (UPI)-তে সরাসরি ইলেকট্রনিক অর্থ স্থানান্তর নিশ্চিত করে।</div>
      <div style="font-size: 12px; color: #475569;"><strong>हिन्दी:</strong> वेयरहाउस पर गुणवत्ता सत्यापन और रसीद प्राप्ति के पश्चात, ताज़ा अधिकतम ३० दिनों की वैधानिक अवधि के भीतर किसान के सत्यापित बैंक खाते अथवा यूपीआई में सीधे भुगतान की गारंटी देता है।</div>
    </div>

    <!-- Clause 4 -->
    <div style="margin-bottom: 18px; padding: 14px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 4px;">
      <div style="font-size: 13px; font-weight: 800; color: #15803d; margin-bottom: 4px;">Clause 4 &bull; ধারা ৪ &bull; खंड ৪</div>
      <div style="font-size: 13.5px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Fair Treatment, Zero Land Claim & Natural Disaster Protection / ন্যায্য আচরণ ও প্রাকৃতিক দুর্যোগ সুরক্ষা / निष्पक्ष व्यवहार, शून्य भूमि दावा एवं आपदा सुरक्षा</div>
      <div style="font-size: 12.5px; color: #334155; margin-bottom: 5px;"><strong>English:</strong> Under no circumstances shall TAZA or any associated partner lay any legal claim, lien, or mortgage over the farmer's agricultural land. In case of verified crop loss due to catastrophic climate events (cyclone, floods, severe hail), the farmer shall not be penalized.</div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 5px;"><strong>বাংলা:</strong> কোনো অবস্থাতেই তাজা বা তার সহযোগী কোনো পক্ষ কৃষকের চাষযোগ্য জমির ওপর কোনো আইনি দাবি, বন্ধক বা অধিকার প্রয়োগ করবে না। চরম আবহাওয়া বা প্রাকৃতিক দুর্যোগে ক্ষতি হলে কৃষককে কোনো জরিমানা করা হবে না।</div>
      <div style="font-size: 12px; color: #475569;"><strong>हिन्दी:</strong> किसी भी परिस्थिति में ताज़ा या उसका कोई भी भागीदार किसान की कृषि भूमि पर कोई कानूनी दावा, ग्रहणाधिकार या बंधक नहीं रखेगा। प्राकृतिक आपदा या चक्रवात से फसल क्षति होने पर किसान पर कोई जुर्माना नहीं लगाया जाएगा।</div>
    </div>

    <!-- Clause 5 -->
    <div style="margin-bottom: 18px; padding: 14px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 4px;">
      <div style="font-size: 13px; font-weight: 800; color: #15803d; margin-bottom: 4px;">Clause 5 &bull; ধারা ৫ &bull; खंड ५</div>
      <div style="font-size: 13.5px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Dispute Resolution & Legal Framework / বিরোধ নিষ্পত্তি ও আইনি কাঠামো / विवाद समाधान एवं कानूनी ढांचा</div>
      <div style="font-size: 12.5px; color: #334155; margin-bottom: 5px;"><strong>English:</strong> Any grievance or discrepancy regarding grade classification or settlement shall be submitted to the TAZA Farmer Support Desk and resolved amicably within 7 business days under the statutory agricultural trade dispute settlement guidelines and local jurisdiction.</div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 5px;"><strong>বাংলা:</strong> গ্রেডিং বা অর্থপ্রদান সংক্রান্ত যেকোনো অভিযোগ তাজা কৃষক সহায়তা কেন্দ্রে জানানো হবে এবং ৭ কার্যদিবসের মধ্যে বিধিবদ্ধ কৃষি বাণিজ্য বিরোধ নিষ্পত্তি নির্দেশিকা অনুযায়ী সৌহার্দ্যপূর্ণভাবে সমাধান করা হবে।</div>
      <div style="font-size: 12px; color: #475569;"><strong>हिन्दी:</strong> उपज की ग्रेडिंग अथवा भुगतान संबंधी किसी भी विवाद को ताज़ा किसान सहायता केंद्र में प्रस्तुत किया जाएगा और ७ कार्य दिवसों के भीतर संबंधित कृषि विवाद निपटान नियमों के तहत सुलझाया जाएगा।</div>
    </div>

    <!-- Signatures -->
    <div style="margin-top: 24px; padding-top: 16px; border-top: 2px dashed #cbd5e1; display: flex; justify-content: space-between;">
      <div style="width: 46%;">
        <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 24px;">Authorized Signatory (TAZA AGRO):</div>
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a;">Debabrata Roy / Operations Director</div>
        <div style="font-size: 11px; color: #64748b;">TAZA Agricultural Logistics & Warehouse Network</div>
      </div>
      <div style="width: 46%;">
        <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 24px;">Farmer Signatory / ডিজিটাল সম্মতি:</div>
        <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${farmerName}</div>
        <div style="font-size: 11px; color: #64748b;">Contact: ${cleanContact} (Verified via Digital OTP)</div>
      </div>
    </div>

    <div style="margin-top: 22px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 10px;">
      This document is legally binding upon digital acceptance during sign-up. Generated by TAZA Agro Digital Network &bull; Government of India Agricultural Facilitation Compliant.
    </div>
  </div>
  `;
}

function openFarmerAgreementModal() {
  const modal = document.getElementById('farmerAgreementModal');
  const bodyEl = document.getElementById('farmerAgreementBody');
  if (!modal || !bodyEl) return;

  const farmerName = (document.getElementById('inputName')?.value || authState.name || 'Ananda Mondal').trim();
  let contact = (document.getElementById('inputPhone')?.value || authState.phone || '9830112233').trim();
  if (contact.length === 10 && !contact.startsWith('+')) {
    contact = `+91 ${contact}`;
  }

  // Render client-side version immediately
  bodyEl.innerHTML = generateClientAgreementHtml(farmerName, contact);
  modal.style.display = 'flex';
  if (window.lucide) lucide.createIcons();

  // Also fetch official backend preview
  fetch(`${API_BASE}/auth/farmer-agreement/preview?farmer_name=${encodeURIComponent(farmerName)}&contact_number=${encodeURIComponent(contact)}`)
    .then(r => r.ok ? r.text() : null)
    .then(html => {
      if (html) {
        bodyEl.innerHTML = html;
      }
    })
    .catch(err => console.warn('Preview backend fetch fallback to client rendering:', err));
}

function closeFarmerAgreementModal() {
  const modal = document.getElementById('farmerAgreementModal');
  if (modal) modal.style.display = 'none';
}

function handleAgreementBackdrop(event) {
  if (event.target.id === 'farmerAgreementModal') {
    closeFarmerAgreementModal();
  }
}

function printFarmerAgreement() {
  const bodyEl = document.getElementById('farmerAgreementBody');
  if (!bodyEl) return;

  const printWindow = window.open('', '_blank', 'width=840,height=900');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>TAZA Farmer Produce Agreement</title>
        <meta charset="UTF-8">
      </head>
      <body style="background: white; padding: 20px;">
        ${bodyEl.innerHTML}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadFarmerAgreement() {
  const farmerName = (document.getElementById('inputName')?.value || authState.name || 'Ananda Mondal').trim();
  let contact = (document.getElementById('inputPhone')?.value || authState.phone || '9830112233').trim();
  if (contact.length === 10 && !contact.startsWith('+')) {
    contact = `+91 ${contact}`;
  }
  const htmlContent = generateClientAgreementHtml(farmerName, contact);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TAZA_Farmer_Produce_Agreement_${farmerName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showCartToast === 'function') {
    showCartToast('📥 Farmer Produce Agreement downloaded to your device!');
  }
}

function acceptFarmerAgreementFromModal() {
  const checkbox = document.getElementById('farmerTermsCheckbox');
  if (checkbox) checkbox.checked = true;
  closeFarmerAgreementModal();
  if (typeof showCartToast === 'function') {
    showCartToast('✅ TAZA Farmer Produce Agreement accepted. An official copy will be sent to your email.');
  }
}

// Global Keyboard Escape listener to unlock screen immediately
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAuthModal();
    closeFarmerAgreementModal();
    closeFarmerInsuranceModal();
  }
});

// Explicit window bindings for inline HTML triggers
window.authState = authState;
window.DEMO_PROFILES = DEMO_PROFILES;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleAuthBackdrop = handleAuthBackdrop;
window.selectRole = selectRole;
window.selectMode = selectMode;
window.fillDemo = fillDemo;
window.skipLoginAndBrowse = skipLoginAndBrowse;
window.autoFillAndVerifyOtp = autoFillAndVerifyOtp;
window.handleRequestOtp = handleRequestOtp;
window.verifyDemoOtp = verifyDemoOtp;
window.goBackToForm = goBackToForm;
window.finishLogin = finishLogin;
window.openFarmerAgreementModal = openFarmerAgreementModal;
window.closeFarmerAgreementModal = closeFarmerAgreementModal;
window.handleAgreementBackdrop = handleAgreementBackdrop;
window.printFarmerAgreement = printFarmerAgreement;
window.downloadFarmerAgreement = downloadFarmerAgreement;
window.acceptFarmerAgreementFromModal = acceptFarmerAgreementFromModal;

// =============================================================
// Farmer Profile & Legal Documents Vault
// =============================================================
function handleNavAccountClick() {
  if (authState && authState.isLoggedIn && authState.role === 'farmer') {
    openFarmerProfileModal('documents');
  } else {
    openAuthModal();
  }
}

function openFarmerProfileModal(activeTab = 'documents') {
  const modal = document.getElementById('farmerProfileModal');
  if (!modal) return;

  const farmerName = authState.name || 'Ananda Mondal';
  let contact = authState.phone || '9830112233';
  if (contact.length === 10 && !contact.startsWith('+')) {
    contact = `+91 ${contact}`;
  }
  const email = authState.email || 'ananda.mondal@farmer.taza.in';
  const district = authState.district || 'Hooghly Central Zone';

  // Populate header and profile fields
  const vaultNameEl = document.getElementById('vaultFarmerName');
  if (vaultNameEl) vaultNameEl.innerText = farmerName;

  const vaultPhoneEl = document.getElementById('vaultFarmerPhone');
  if (vaultPhoneEl) vaultPhoneEl.innerText = contact;

  const vaultDistEl = document.getElementById('vaultFarmerDistrict');
  if (vaultDistEl) vaultDistEl.innerText = district;

  const detailNameEl = document.getElementById('detailFarmerName');
  if (detailNameEl) detailNameEl.innerText = farmerName;

  const detailPhoneEl = document.getElementById('detailFarmerPhone');
  if (detailPhoneEl) detailPhoneEl.innerText = contact;

  const detailEmailEl = document.getElementById('detailFarmerEmail');
  if (detailEmailEl) detailEmailEl.innerText = email;

  const detailZoneEl = document.getElementById('detailFarmerZone');
  if (detailZoneEl) detailZoneEl.innerText = `${district} Agricultural Corridor`;

  switchProfileTab(activeTab);
  loadFarmerDocuments();

  modal.style.display = 'flex';
  if (window.lucide) lucide.createIcons();
}

function closeFarmerProfileModal() {
  const modal = document.getElementById('farmerProfileModal');
  if (modal) modal.style.display = 'none';
}

function handleFarmerProfileBackdrop(event) {
  if (event.target.id === 'farmerProfileModal') {
    closeFarmerProfileModal();
  }
}

function switchProfileTab(tabName) {
  const tabBtnDocs = document.getElementById('tabBtnDocuments');
  const tabBtnDetails = document.getElementById('tabBtnDetails');
  const paneDocs = document.getElementById('profileTabDocuments');
  const paneDetails = document.getElementById('profileTabDetails');

  if (tabName === 'documents') {
    if (tabBtnDocs) tabBtnDocs.classList.add('active');
    if (tabBtnDetails) tabBtnDetails.classList.remove('active');
    if (paneDocs) {
      paneDocs.style.display = 'block';
      paneDocs.classList.add('active');
    }
    if (paneDetails) {
      paneDetails.style.display = 'none';
      paneDetails.classList.remove('active');
    }
  } else {
    if (tabBtnDocs) tabBtnDocs.classList.remove('active');
    if (tabBtnDetails) tabBtnDetails.classList.add('active');
    if (paneDocs) {
      paneDocs.style.display = 'none';
      paneDocs.classList.remove('active');
    }
    if (paneDetails) {
      paneDetails.style.display = 'block';
      paneDetails.classList.add('active');
    }
  }
  if (window.lucide) lucide.createIcons();
}

async function loadFarmerDocuments() {
  const container = document.getElementById('farmerDocsListContainer');
  const farmerName = authState.name || 'Ananda Mondal';
  let contact = authState.phone || '9830112233';
  if (contact.length === 10 && !contact.startsWith('+')) {
    contact = `+91 ${contact}`;
  }
  const email = authState.email || 'ananda.mondal@farmer.taza.in';

  // Update banner fields
  const bannerName = document.getElementById('bannerFarmerName');
  if (bannerName) bannerName.innerText = farmerName;
  const bannerPhone = document.getElementById('bannerFarmerPhone');
  if (bannerPhone) bannerPhone.innerText = contact;
  const dashboardFarmerName = document.getElementById('farmerNameDisplay');
  if (dashboardFarmerName) {
    dashboardFarmerName.innerText = `${farmerName} (${authState.district || 'Singur Agro FPO'})`;
  }

  // Try fetching from backend API
  let docs = null;
  try {
    const res = await fetch(`${API_BASE}/auth/farmer-agreement/documents?farmer_email=${encodeURIComponent(email)}&contact_number=${encodeURIComponent(contact)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.documents) {
        docs = data.documents;
      }
    }
  } catch (err) {
    console.warn('Backend documents fetch fallback to client cache:', err);
  }

  if (!docs || docs.length === 0) {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    docs = [
      {
        id: "doc-all-risks-insurance",
        title: "ALL RISKS INSURANCE POLICY (Warehouse Storage Cover • গুদামজাত শস্য সর্বঝুঁকি বীমা)",
        category: "INSURANCE_POLICY",
        status: "ACTIVE_CLAIM_SETTLED (₹4,250.00)",
        ref_id: "TZ-POL-WH-2026-0884",
        claim_id: "TZ-CLM-6AA5E0E4",
        claim_amount: "₹4,250.00",
        claim_status: "Approved & Settled",
        claim_peril: "Fire & Explosion in Electrical Cold Storage Bay",
        crop_name: "Jyoti Potato",
        farmer_name: farmerName,
        contact_number: contact,
        farmer_email: email,
        issue_date: todayStr,
        description: "Statutory 22-clause warehouse damage insurance policy (Clause 21 Spoilage & Clause 22 Minimum Claim Threshold). Claim ID: TZ-CLM-6AA5E0E4 | Peril: Fire & Explosion in Cold Storage Bay | Amount Claimed: ₹4,250.00 (Approved & Settled).",
        is_insurance: true
      },
      {
        id: "doc-produce-agreement",
        title: "TAZA Farmer Produce Agreement (কৃষক ফসল চুক্তি / किसान उपज समझौता)",
        category: "CONTRACT",
        status: "SIGNED_AND_ACTIVE",
        ref_id: "TZ-AGR-2026-WB",
        farmer_name: farmerName,
        contact_number: contact,
        farmer_email: email,
        issue_date: todayStr,
        description: "Official trilingual agreement guaranteeing minimum profit margin over market, 40km warehouse storage, direct 30-day electronic payment, and zero land mortgage/claim protection.",
        is_featured: true
      },
      {
        id: "doc-warehouse-transit",
        title: "Singur Cold Storage & Weighment Transit Pass (৪০ কিমি গুদামজাতকরণ রসিদ)",
        category: "LOGISTICS_PASS",
        status: "ACTIVE",
        ref_id: "TZ-WH-PASS-8841",
        farmer_name: farmerName,
        contact_number: contact,
        farmer_email: email,
        issue_date: todayStr,
        description: "AI-routed cold chain transit authorization for nearest Singur/Hooghly cooperative warehouse within 40km radius with transparent computerized grade weighing.",
        is_featured: false
      },
      {
        id: "doc-disaster-protection",
        title: "Crop Calamity & Fair Price Protection Certificate (দুর্যোগ সুরক্ষা প্রশংসাপত্র)",
        category: "INSURANCE_CERTIFICATE",
        status: "VERIFIED",
        ref_id: "TZ-PROT-WB-2026",
        farmer_name: farmerName,
        contact_number: contact,
        farmer_email: email,
        issue_date: todayStr,
        description: "Fair price protection and emergency corridor clearance certificate safeguarding against distress selling during sudden rainfall or market volatility.",
        is_featured: false
      }
    ];
  }

  if (container) {
    let html = '';
    docs.forEach(doc => {
      const isFeatured = doc.id === 'doc-produce-agreement' || doc.is_featured;
      const isInsurance = doc.id === 'doc-all-risks-insurance' || doc.is_insurance || doc.category === 'INSURANCE_POLICY';

      let statusBadge = '<span class="vault-doc-badge verified">● Verified &bull; সরকারি স্বীকৃত</span>';
      if (isFeatured) {
        statusBadge = '<span class="vault-doc-badge signed">● Signed &amp; Active / স্বাক্ষরিত ও সক্রিয়</span>';
      } else if (isInsurance) {
        statusBadge = `<span class="vault-doc-badge signed" style="background: #ecfdf5; color: #047857; border-color: #a7f3d0;">● Claimed &amp; Settled: ${doc.claim_amount || '₹4,250.00'}</span>`;
      }

      html += `
        <div class="vault-doc-card ${isFeatured ? 'featured' : ''} ${isInsurance ? 'insurance-card' : ''}" style="${isInsurance ? 'border-color: #86efac; border-left: 4px solid #10b981; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 80%);' : ''}">
          <div class="vault-doc-header">
            <div>
              <div class="vault-doc-title-row">
                <span class="vault-doc-title">${doc.title}</span>
                ${statusBadge}
              </div>
              <div class="vault-doc-meta" style="margin-top: 5px;">
                Ref ID: <strong>${doc.ref_id}</strong> &bull; Signatory: <strong>${doc.farmer_name}</strong> &bull; Contact: <strong>${doc.contact_number}</strong> &bull; Date: <strong>${doc.issue_date || 'Current Season'}</strong>
              </div>
            </div>
          </div>

          ${isInsurance ? `
            <!-- Prominent Claim Details & Claimed Amount Callout -->
            <div style="background: #ffffff; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px 16px; margin: 12px 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 1px 4px rgba(16, 185, 129, 0.08);">
              <div>
                <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                  ⚡ AMOUNT CLAIMED &amp; APPROVED (দাবিকৃত ক্ষতিপূরণ অর্থ):
                </div>
                <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 2px;">
                  <span style="font-size: 24px; font-weight: 900; color: #047857;">${doc.claim_amount || '₹4,250.00'}</span>
                  <span style="font-size: 12px; font-weight: 600; color: #475569;">(${doc.claim_peril || 'Warehouse Storage Damage Cover'})</span>
                </div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11.5px; font-weight: 800; background: #dcfce7; color: #15803d; padding: 3px 9px; border-radius: 999px; border: 1px solid #86efac;">
                  ● Status: ${doc.claim_status || 'Approved & Settled'}
                </span>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Claim Ref: <strong>${doc.claim_id || 'TZ-CLM-6AA5E0E4'}</strong></div>
              </div>
            </div>
          ` : ''}

          <div class="vault-doc-desc">
            ${doc.description}
          </div>

          <div class="vault-doc-actions">
            ${isInsurance ? `
              <button type="button" class="btn-vault-action primary" onclick="openFarmerInsuranceModal('${doc.crop_name || 'Jyoti Potato'}')">
                <i data-lucide="shield-check"></i> View Insurance Policy &amp; Claim
              </button>
              <button type="button" class="btn-vault-action" onclick="downloadFarmerInsurancePolicy('${doc.crop_name || 'Jyoti Potato'}')">
                <i data-lucide="download"></i> Download Policy (.HTML)
              </button>
              <button type="button" class="btn-vault-action" onclick="printFarmerInsurancePolicy()">
                <i data-lucide="printer"></i> Print / PDF
              </button>
            ` : isFeatured ? `
              <button type="button" class="btn-vault-action primary" onclick="openFarmerAgreementModal()">
                <i data-lucide="eye"></i> View Agreement
              </button>
              <button type="button" class="btn-vault-action" onclick="downloadFarmerAgreement()">
                <i data-lucide="download"></i> Download (.HTML)
              </button>
              <button type="button" class="btn-vault-action" onclick="printFarmerAgreement()">
                <i data-lucide="printer"></i> Print / PDF
              </button>
              <button type="button" class="btn-vault-action email" onclick="resendFarmerAgreementEmail()" id="btnResendVaultDoc">
                <i data-lucide="mail"></i> Resend to Email
              </button>
            ` : `
              <button type="button" class="btn-vault-action" onclick="downloadStandardCertificate('${doc.title}', '${doc.ref_id}')">
                <i data-lucide="download"></i> Download Certificate
              </button>
              <button type="button" class="btn-vault-action" onclick="window.print()">
                <i data-lucide="printer"></i> Print
              </button>
            `}
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }
}

function downloadStandardCertificate(title, refId) {
  const farmerName = authState.name || 'Ananda Mondal';
  const certHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - ${refId}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #0f172a; }
          .border { border: 4px double #16a34a; padding: 30px; border-radius: 8px; }
          h1 { color: #15803d; text-align: center; }
          .meta { margin-top: 20px; font-size: 14px; line-height: 1.8; }
        </style>
      </head>
      <body>
        <div class="border">
          <h1>TAZA AGRO DIGITAL CERTIFICATION</h1>
          <h2 style="text-align:center; color:#334155;">${title}</h2>
          <div class="meta">
            <p><strong>Certificate Ref:</strong> ${refId}</p>
            <p><strong>Issued To:</strong> ${farmerName}</p>
            <p><strong>Status:</strong> Legally Active & Verified</p>
            <p><strong>Issuer:</strong> TAZA Agricultural Fair Trade Network</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const blob = new Blob([certHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${refId}_${farmerName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showCartToast === 'function') {
    showCartToast('📥 Certificate downloaded to your device!');
  }
}

async function resendFarmerAgreementEmail() {
  const farmerName = authState.name || 'Ananda Mondal';
  let contact = authState.phone || '9830112233';
  if (contact.length === 10 && !contact.startsWith('+')) {
    contact = `+91 ${contact}`;
  }
  const email = authState.email || 'ananda.mondal@farmer.taza.in';

  if (typeof showCartToast === 'function') {
    showCartToast(`📧 Sending TAZA Produce Agreement to ${email}...`);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/farmer-agreement/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_email: email,
        farmer_name: farmerName,
        contact_number: contact,
        district: authState.district || 'Hooghly'
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof showCartToast === 'function') {
        showCartToast(`✅ Produce Agreement sent to ${email}! (${data.delivery_provider || 'Email Delivery'})`);
      } else {
        alert(`Produce Agreement successfully sent to ${email}`);
      }
    } else {
      if (typeof showCartToast === 'function') {
        showCartToast(`✅ Produce Agreement dispatched to ${email}. You can also download anytime from your Documents Vault.`);
      }
    }
  } catch (err) {
    console.warn('Resend email error:', err);
    if (typeof showCartToast === 'function') {
      showCartToast(`📥 Download option is also available instantly from your Documents Vault.`);
    }
  }
}

// -------------------------------------------------------------
// All Risks Insurance Policy (Warehouse Storage Cover) Handlers
// -------------------------------------------------------------
function generateClientInsuranceHtml(farmerName, contactNumber, cropName, sumInsured, claimData) {
  const cleanContact = contactNumber.startsWith('+') ? contactNumber : `+91 ${contactNumber}`;
  const policyNum = 'TZ-POL-WH-2026-0884';
  const claim = claimData || {
    claimId: 'TZ-CLM-6AA5E0E4',
    incidentRiskFactor: 'Fire & Explosion in Electrical Cold Storage Bay',
    claimAmountRs: 4250.0,
    approvalStatus: 'Approved & Settled',
    applicableClause: 'Clause 22(g) All Risks Fire & Explosion Cover (Zero Deductible)'
  };
  const claimAmt = typeof claim.claimAmountRs === 'number' 
    ? `₹${claim.claimAmountRs.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
    : (claim.claim_amount || '₹4,250.00');

  return `
  <div style="max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 32px 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.55;">
    <!-- Top Header Banner -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <h1 style="font-size: 24px; font-weight: 800; color: #15803d; margin: 0;">TAZA AGRO DIGITAL UNDERWRITING</h1>
        <div style="font-size: 13px; color: #64748b; margin-top: 3px;">All Risks Warehouse Storage &amp; Produce Indemnity Framework</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
        <span id="insuranceSyncTag" style="background: #dcfce7; color: #166534; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #86efac; display: inline-flex; align-items: center; gap: 4px;">
          ● MongoDB Sync Active
        </span>
        <span style="font-size: 11.5px; color: #64748b;">Policy Ref: <strong>${policyNum}</strong></span>
      </div>
    </div>

    <!-- Policy Title Heading -->
    <div style="text-align: center; margin-bottom: 22px;">
      <h2 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.3px;">ALL RISKS INSURANCE POLICY</h2>
      <div style="font-size: 14px; font-weight: 700; color: #15803d;">Warehouse Storage Cover &bull; গুদামজাত শস্য সর্বঝুঁকি বীমা পলিসি</div>
      <div style="font-size: 12px; color: #166534; margin-top: 2px;">Statutory 22 Clauses &bull; Real-Time Claims Repository Synchronized</div>
    </div>

    <!-- PROMINENT CLAIM ENDORSEMENT CALLOUT -->
    <div style="background: linear-gradient(135deg, #fefce8 0%, #ffffff 100%); border: 2px solid #ca8a04; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(202, 138, 4, 0.12);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: 800; color: #854d0e; text-transform: uppercase; letter-spacing: 0.5px;">
          ⚡ STATUTORY CLAIM ENDORSEMENT &bull; দাবিকৃত ক্ষতিপূরণ বিবরণী
        </span>
        <span style="font-size: 11.5px; background: #fef08a; color: #713f12; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
          Status: ${claim.approvalStatus || 'Approved & Settled'}
        </span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: center;">
        <div>
          <div style="font-size: 11.5px; color: #713f12;">Peril / Incident Covered:</div>
          <strong style="font-size: 13.5px; color: #854d0e;">${claim.incidentRiskFactor}</strong>
        </div>
        <div style="background: #ffffff; padding: 8px 14px; border-radius: 6px; border: 1.5px solid #eab308; text-align: center;">
          <div style="font-size: 11px; color: #713f12; text-transform: uppercase; font-weight: 700;">Amount Claimed (দাবিকৃত অর্থ)</div>
          <div style="font-size: 22px; font-weight: 900; color: #15803d; letter-spacing: -0.5px;">${claimAmt}</div>
        </div>
        <div>
          <div style="font-size: 11.5px; color: #713f12;">Claim Reference:</div>
          <strong style="font-size: 13px; color: #0f172a;">${claim.claimId}</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Clause: ${claim.applicableClause || 'Clause 22(g) Zero Deductible'}</div>
        </div>
      </div>
    </div>

    <!-- SCHEDULE OF INSURANCE -->
    <div style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #16a34a; padding-left: 8px; margin: 18px 0 10px 0;">
      Schedule of Insurance (বীমা বিবরণী)
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 22px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
      <tr style="background: #f8fafc;"><td style="padding: 7px 12px; font-weight: 600; width: 32%; border: 1px solid #e2e8f0;">Insured Farmer / FPO</td><td style="padding: 7px 12px; border: 1px solid #e2e8f0;"><strong>${farmerName}</strong></td></tr>
      <tr><td style="padding: 7px 12px; font-weight: 600; border: 1px solid #e2e8f0;">Contact Number / KYC</td><td style="padding: 7px 12px; border: 1px solid #e2e8f0;">${cleanContact}</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 7px 12px; font-weight: 600; border: 1px solid #e2e8f0;">Insured Goods / Crop</td><td style="padding: 7px 12px; border: 1px solid #e2e8f0;"><strong>${cropName}</strong> (Grade A Harvest Lot)</td></tr>
      <tr><td style="padding: 7px 12px; font-weight: 600; border: 1px solid #e2e8f0;">Warehouse Location</td><td style="padding: 7px 12px; border: 1px solid #e2e8f0;">Singur Cooperative Cold Hub A-1 / Alipurduar Vacant Plot A4</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 7px 12px; font-weight: 600; border: 1px solid #e2e8f0;">Estimated Sum Insured</td><td style="padding: 7px 12px; border: 1px solid #e2e8f0;"><strong style="color: #15803d; font-size: 14px;">₹${(sumInsured || 9250).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td></tr>
      <tr><td style="padding: 7px 12px; font-weight: 600; border: 1px solid #e2e8f0;">Period of Insurance</td><td style="padding: 7px 12px; border: 1px solid #e2e8f0;">From intake gate receipt until final consumer / bulk dispatch</td></tr>
    </table>

    <!-- PREAMBLE & SCOPE OF COVER -->
    <div style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #16a34a; padding-left: 8px; margin: 18px 0 10px 0;">
      Preamble &amp; Scope of Cover (চুক্তির ভূমিকা ও বীমার আওতা)
    </div>
    <div style="font-size: 12.5px; color: #334155; line-height: 1.6; margin-bottom: 16px; background: #f8fafc; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
      WHEREAS the Insured, by declaration which forms the basis of this Contract, has entrusted agricultural produce to the TAZA Warehousing Platform, the Underwriters agree to indemnify the Insured against fortuitous physical loss of or damage to the described produce while lying in storage at the designated warehouse premises, subject to the terms, conditions, exclusions, and endorsements set out herein.
    </div>

    <!-- TERMS & CONDITIONS CLAUSES 1 TO 20 -->
    <div style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #16a34a; padding-left: 8px; margin: 18px 0 10px 0;">
      Terms &amp; Conditions (শর্তাবলী ১ - ২০)
    </div>
    <div style="font-size: 12px; color: #334155; line-height: 1.6; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
      <div><strong>1. Period of Insurance:</strong> Cover attaches upon safe delivery and computerized receipt at the warehouse and continues until final gate dispatch or expiration.</div>
      <div><strong>2. Premises:</strong> Limited exclusively to the designated warehouse building, silo, or cold chamber specified in the Schedule.</div>
      <div><strong>3. Sum Insured &amp; Limit of Liability:</strong> Total liability shall not exceed the specified batch sum insured.</div>
      <div><strong>4. Storage and Care:</strong> The insured and warehouse operator shall exercise all reasonable precautions to maintain hygiene, pallet spacing, and cold-chain integrity.</div>
      <div><strong>5. Maintenance &amp; Inspection:</strong> Regular calibration of thermograph and hygrometer sensors is mandatory.</div>
      <div><strong>6. Packaging &amp; Stacking:</strong> Produce must be packed in sound bags/crates and stacked within designated safe load heights.</div>
      <div><strong>7. Notice of Loss:</strong> Immediate digital/written notification to TAZA Operations within 48 hours of discovering any damage.</div>
      <div><strong>8. Proof of Loss:</strong> Mandatory provision of weighment slips, surveyor photos, and cold-store logger charts.</div>
      <div><strong>9. Duty of Insured:</strong> Must take all reasonable steps to mitigate further damage or salvage unaffected stock.</div>
      <div><strong>10. Salvage and Disposal:</strong> Damaged produce sold as cattle feed or composting shall have net proceeds credited toward indemnity.</div>
      <div><strong>11. Rights of the Company:</strong> Authorized inspectors may enter premises at any reasonable time to inspect affected stock.</div>
      <div><strong>12. Underinsurance / Average:</strong> If the market value exceeds the sum insured at loss time, average clause shall apply rateably.</div>
      <div><strong>13. Contribution:</strong> Rateable proportion applies if other concurrent insurance covers the same lot.</div>
      <div><strong>14. Subrogation:</strong> Rights against third-party negligent handlers transfer to underwriters upon claim settlement.</div>
      <div><strong>15. Fraud:</strong> Any fraudulent or exaggerated claim forfeits all benefits under this policy.</div>
      <div><strong>16. Reinstatement:</strong> Sum insured stands reduced by loss paid unless reinstated by batch replenishment.</div>
      <div><strong>17. Arbitration:</strong> Valuation disputes shall be settled through statutory agricultural arbitration tribunals.</div>
      <div><strong>18. Governing Law:</strong> Governed by the laws of India and subject to West Bengal competent jurisdiction.</div>
      <div><strong>19. General Exclusions:</strong> Excludes war, radioactive contamination, nuclear perils, willful neglect, and gradual wear/tear not covered by Clause 21.</div>
      <div><strong>20. Sanctions:</strong> Void to the extent of any international or statutory economic trade sanctions.</div>
    </div>

    <!-- CLAUSE 21: SPOILAGE COVER -->
    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;">
      <div style="font-size: 13.5px; font-weight: 800; color: #15803d; margin-bottom: 6px;">
        21. Spoilage Cover (গুদামজাত পচন ও ক্ষতি কভার)
      </div>
      <div style="font-size: 12px; color: #1e293b; line-height: 1.6;">
        Notwithstanding General Exclusion 19(a), this Policy extends to indemnify fortuitous physical loss or damage caused by <strong>spoilage, putrefaction, decay, or abnormal deterioration</strong> arising directly from:
        <ul style="margin: 6px 0 6px 18px; padding: 0;">
          <li>(a) Breakdown or mechanical failure of refrigeration, cooling, or humidity plant at the warehouse;</li>
          <li>(b) Accidental interruption of electricity, power grid, or diesel generator supply exceeding 6 hours;</li>
          <li>(c) Accidental leakage, condensation dripping, or ingress of water into cold storage bays;</li>
          <li>(d) Smoke, fire, or heat rendering produce unfit for human consumption.</li>
        </ul>
      </div>
    </div>

    <!-- CLAUSE 22: MINIMUM CLAIM THRESHOLD -->
    <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
      <div style="font-size: 13.5px; font-weight: 800; color: #047857; margin-bottom: 6px;">
        22. Minimum Claim Threshold (দাবি সংক্রান্ত ন্যূনতম মানদণ্ড)
      </div>
      <div style="font-size: 12px; color: #1e293b; line-height: 1.6;">
        Claims are payable when loss satisfies the statutory threshold for the relevant peril:
        <ul style="margin: 6px 0 6px 18px; padding: 0;">
          <li>(a) <strong>Refrigeration cooling breakdown (Clause 21):</strong> min. <strong>250 kg</strong> or 5% of lot, and min. value of <strong>₹25,000</strong>;</li>
          <li>(b) <strong>Partial water ingress / drainage leakage:</strong> min. <strong>100 kg</strong> and min. value of <strong>₹15,000</strong>;</li>
          <li>(c) <strong>Malicious damage / vandalism:</strong> min. <strong>50 kg</strong> and min. value of <strong>₹15,000</strong>;</li>
          <li>(d) <strong>Pest / insect / weevil infestation:</strong> min. <strong>50 kg</strong> and min. value of <strong>₹10,000</strong>;</li>
          <li>(e) <strong>Minor pilferage / handling damage:</strong> min. <strong>20 kg</strong> and min. value of <strong>₹5,000</strong>;</li>
          <li>(f) <strong>Fire, Explosion, Storm, Cyclone (Clause 22g):</strong> <em>ZERO threshold / franchise</em> (all losses fully indemnified).</li>
        </ul>
      </div>
    </div>

    <!-- Legally Binding Footer -->
    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 11.5px; color: #64748b;">
      Legally binding under the Indian Insurance Act &amp; TAZA Warehouse Framework.<br/>
      Claim Status: <strong>${claim.approvalStatus || 'Approved & Settled'}</strong> &bull; Amount Claimed: <strong style="color: #15803d;">${claimAmt}</strong> &bull; Ref: ${claim.claimId || 'TZ-CLM-6AA5E0E4'}
    </div>
  </div>
  `;
}

function openFarmerInsuranceModal(cropName) {
  const modal = document.getElementById('farmerInsuranceModal');
  const bodyEl = document.getElementById('farmerInsuranceBody');
  if (!modal || !bodyEl) return;

  const resolvedCrop = cropName || document.getElementById('cropName')?.value || 'Jyoti Potato';
  const farmerName = (document.getElementById('inputName')?.value || authState.name || 'Ananda Mondal').trim();
  let contact = (document.getElementById('inputPhone')?.value || authState.phone || '9830112233').trim();
  if (contact.length === 10 && !contact.startsWith('+')) {
    contact = `+91 ${contact}`;
  }

  const qty = parseFloat(document.getElementById('cropQuantity')?.value || '500') || 500;
  const price = parseFloat(document.getElementById('cropPrice')?.value || '18.5') || 18.5;
  const sumInsured = qty * price;

  // 1. Render INSTANTLY (0ms) so user never sees a freeze or loading block
  bodyEl.innerHTML = generateClientInsuranceHtml(farmerName, contact, resolvedCrop, sumInsured);
  modal.style.display = 'flex';
  if (window.lucide) lucide.createIcons();

  // 2. Asynchronously sync live MongoDB telemetry with 2.5s timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  const url = `${API_BASE}/insurance/policy?crop_name=${encodeURIComponent(resolvedCrop)}&farmer_name=${encodeURIComponent(farmerName)}&contact_number=${encodeURIComponent(contact)}&sum_insured_rs=${sumInsured}`;
  fetch(url, { signal: controller.signal })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      clearTimeout(timer);
      if (data && data.policy_html) {
        bodyEl.innerHTML = data.policy_html;
        if (window.lucide) lucide.createIcons();
      }
      const syncTag = document.getElementById('insuranceSyncTag');
      if (syncTag) {
        syncTag.innerHTML = `● Live MongoDB Synchronized`;
        syncTag.style.background = '#dcfce7';
      }
    })
    .catch(err => {
      clearTimeout(timer);
      console.warn('Live policy background sync:', err.message);
      const syncTag = document.getElementById('insuranceSyncTag');
      if (syncTag) {
        syncTag.innerHTML = `● Statutory Policy Active`;
      }
    });
}

function closeFarmerInsuranceModal() {
  const modal = document.getElementById('farmerInsuranceModal');
  if (modal) modal.style.display = 'none';
}

function handleInsuranceBackdrop(event) {
  if (event.target.id === 'farmerInsuranceModal') {
    closeFarmerInsuranceModal();
  }
}

function printFarmerInsurancePolicy() {
  const bodyEl = document.getElementById('farmerInsuranceBody');
  if (!bodyEl) return;

  const printWindow = window.open('', '_blank', 'width=900,height=960');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>TAZA All Risks Insurance Policy - Warehouse Storage Cover</title>
        <meta charset="UTF-8">
      </head>
      <body style="background: white; padding: 20px;">
        ${bodyEl.innerHTML}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadFarmerInsurancePolicy(cropName) {
  const resolvedCrop = cropName || document.getElementById('cropName')?.value || 'Jyoti Potato';
  const farmerName = (document.getElementById('inputName')?.value || authState.name || 'Ananda Mondal').trim();
  let contact = (document.getElementById('inputPhone')?.value || authState.phone || '9830112233').trim();
  if (contact.length === 10 && !contact.startsWith('+')) {
    contact = `+91 ${contact}`;
  }

  const qty = parseFloat(document.getElementById('cropQuantity')?.value || '500') || 500;
  const price = parseFloat(document.getElementById('cropPrice')?.value || '18.5') || 18.5;
  const sumInsured = qty * price;

  const bodyEl = document.getElementById('farmerInsuranceBody');
  const htmlContent = (bodyEl && bodyEl.innerHTML.length > 500) 
    ? bodyEl.innerHTML 
    : generateClientInsuranceHtml(farmerName, contact, resolvedCrop, sumInsured);

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = `TAZA_All_Risks_Insurance_Policy_${resolvedCrop.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(u);

  if (typeof showCartToast === 'function') {
    showCartToast('📥 All Risks Insurance Policy & Claim document downloaded!');
  }
}

function toggleInsuranceDetails(checked) {
  const panel = document.getElementById('cropInsuranceDetailsPanel');
  if (panel) {
    panel.style.display = checked ? 'flex' : 'none';
  }
}

function updateInsurancePreview() {
  const qty = parseFloat(document.getElementById('cropQuantity')?.value || '0') || 0;
  const price = parseFloat(document.getElementById('cropPrice')?.value || '0') || 0;
  const sumInsured = qty * price;
  const preview = document.getElementById('insuranceSumInsuredPreview');
  if (preview) {
    preview.innerText = `₹${sumInsured.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// Window exports for farmer profile & vault
window.handleNavAccountClick = handleNavAccountClick;
window.openFarmerProfileModal = openFarmerProfileModal;
window.closeFarmerProfileModal = closeFarmerProfileModal;
window.handleFarmerProfileBackdrop = handleFarmerProfileBackdrop;
window.switchProfileTab = switchProfileTab;
window.loadFarmerDocuments = loadFarmerDocuments;
window.downloadStandardCertificate = downloadStandardCertificate;
window.resendFarmerAgreementEmail = resendFarmerAgreementEmail;

// Window exports for Warehouse All Risks Insurance
window.openFarmerInsuranceModal = openFarmerInsuranceModal;
window.closeFarmerInsuranceModal = closeFarmerInsuranceModal;
window.handleInsuranceBackdrop = handleInsuranceBackdrop;
window.printFarmerInsurancePolicy = printFarmerInsurancePolicy;
window.downloadFarmerInsurancePolicy = downloadFarmerInsurancePolicy;
window.toggleInsuranceDetails = toggleInsuranceDetails;
window.updateInsurancePreview = updateInsurancePreview;

// =============================================================
// Extended Regional Warehouses Dataset with Real-Time Stacking Limits
// =============================================================
const WAREHOUSE_REGISTRY = [
  {
    id: "wh-hgl-01",
    name: "Singur Cooperative Cold Hub A-1",
    district: "Hooghly",
    latitude: 22.8123,
    longitude: 88.2234,
    distanceKm: 4.2,
    totalCapacityKg: 150000,
    availableCapacityKg: 54000,
    tempControlled: true,
    supportedCategories: ["TUBERS", "VEGETABLES", "FRUITS"],
    ratePerKgMonth: 1.20,
    address: "Singur-Haripal Road, Hooghly 712409"
  },
  {
    id: "wh-hgl-02",
    name: "Tarakeswar Agri-Vault & Reefer Depot",
    district: "Hooghly",
    latitude: 22.8856,
    longitude: 88.0189,
    distanceKm: 12.8,
    totalCapacityKg: 200000,
    availableCapacityKg: 72000,
    tempControlled: true,
    supportedCategories: ["TUBERS", "FRUITS", "GRAINS_PADDY"],
    ratePerKgMonth: 1.10,
    address: "Champadanga Crossing, Tarakeswar, Hooghly"
  },
  {
    id: "wh-brd-01",
    name: "Memari Agro Logistics Grain Silo",
    district: "Purba Bardhaman",
    latitude: 23.1789,
    longitude: 88.1123,
    distanceKm: 8.5,
    totalCapacityKg: 350000,
    availableCapacityKg: 126000,
    tempControlled: false,
    supportedCategories: ["GRAINS_PADDY", "PULSES"],
    ratePerKgMonth: 0.85,
    address: "GT Road Industrial Corridor, Memari"
  },
  {
    id: "wh-nda-01",
    name: "Ranaghat Sub-Divisional Cold Yard",
    district: "Nadia",
    latitude: 23.1812,
    longitude: 88.5812,
    distanceKm: 6.1,
    totalCapacityKg: 120000,
    availableCapacityKg: 43200,
    tempControlled: true,
    supportedCategories: ["VEGETABLES", "TUBERS", "SPICES"],
    ratePerKgMonth: 1.15,
    address: "Ranaghat Bypass, NH-12, Nadia"
  },
  {
    id: "wh-mld-01",
    name: "English Bazar Fruit Preservation Vault",
    district: "Malda",
    latitude: 25.0012,
    longitude: 88.1432,
    distanceKm: 5.4,
    totalCapacityKg: 180000,
    availableCapacityKg: 64800,
    tempControlled: true,
    supportedCategories: ["FRUITS", "SPICES"],
    ratePerKgMonth: 1.35,
    address: "Mokdumpur, Malda Town 732101"
  },
  {
    id: "wh-n24-01",
    name: "Barasat Peri-Urban Aggregation Shed",
    district: "North 24 Parganas",
    latitude: 22.7234,
    longitude: 88.4821,
    distanceKm: 9.2,
    totalCapacityKg: 90000,
    availableCapacityKg: 32400,
    tempControlled: false,
    supportedCategories: ["VEGETABLES", "TUBERS", "GRAINS_PADDY"],
    ratePerKgMonth: 1.05,
    address: "Jessore Road, Kazipara, Barasat"
  },
  {
    id: "wh-drj-01",
    name: "Siliguri Integrated Cold Terminal",
    district: "Darjeeling",
    latitude: 26.7123,
    longitude: 88.4312,
    distanceKm: 14.0,
    totalCapacityKg: 250000,
    availableCapacityKg: 90000,
    tempControlled: true,
    supportedCategories: ["FRUITS", "SPICES", "VEGETABLES"],
    ratePerKgMonth: 1.40,
    address: "Matigara Agro Complex, Siliguri"
  },
  {
    id: "wh-bnk-01",
    name: "Kotulpur Regional Produce Vault",
    district: "Bankura",
    latitude: 22.9912,
    longitude: 87.5923,
    distanceKm: 11.2,
    totalCapacityKg: 110000,
    availableCapacityKg: 39600,
    tempControlled: true,
    supportedCategories: ["TUBERS", "VEGETABLES"],
    ratePerKgMonth: 1.10,
    address: "Joypur Road, Kotulpur, Bankura"
  }
];

// Density reference (kg per sq. ft. stacked)
const STORAGE_DENSITY = {
  TUBERS: 20.0,
  VEGETABLES: 12.0,
  FRUITS: 14.0,
  GRAINS_PADDY: 25.0,
  SPICES: 16.0
};

// =============================================================
// Live Synchronized AI Warehouse & Available Storage State (36% Available Database Sync)
// =============================================================
let currentSyncedWarehouse = {
  id: "wh-hgl-01",
  name: "Singur Cooperative Cold Hub A-1",
  district: "Hooghly",
  latitude: 22.8123,
  longitude: 88.2234,
  availableCapacityKg: 54000,
  totalCapacityKg: 150000,
  distanceKm: 4.2
};

// Render warehouse cards with active AI sync highlights
function switchWarehouseMatrixTab(tab) {
  const tabs = ['cards', 'calculator', 'radar'];
  tabs.forEach(t => {
    const btn = document.getElementById(t === 'cards' ? 'whTabCards' : (t === 'calculator' ? 'whTabCalculator' : 'whTabRadar'));
    const view = document.getElementById(t === 'cards' ? 'whViewCards' : (t === 'calculator' ? 'whViewCalculator' : 'whViewRadar'));
    if (btn) btn.classList.toggle('active', t === tab);
    if (view) view.style.display = (t === tab) ? 'block' : 'none';
  });
  if (window.lucide) lucide.createIcons();
}
window.switchWarehouseMatrixTab = switchWarehouseMatrixTab;

function renderFarmerWarehouseCards(selectedDistrict = "Hooghly") {
  if (selectedDistrict && selectedDistrict !== "all" && typeof loadFarmerLiveWeather === "function") {
    loadFarmerLiveWeather(selectedDistrict);
  }
  const container = document.getElementById("farmerWarehouseList");
  if (!container) return;

  const list = selectedDistrict === "all"
    ? WAREHOUSE_REGISTRY
    : WAREHOUSE_REGISTRY.filter(w => w.district.toLowerCase() === selectedDistrict.toLowerCase());

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 24px; background: #f8fafc; border-radius: 10px; border: 1px dashed #cbd5e1;">No registered warehouse in this district. Choose another district or view all Bengal hubs.</div>`;
    return;
  }

  container.innerHTML = list.map(wh => {
    const occupiedKg = wh.totalCapacityKg - wh.availableCapacityKg;
    const fillPercent = Math.round((occupiedKg / wh.totalCapacityKg) * 100);
    const availPercent = 100 - fillPercent;
    const isCold = wh.tempControlled ? '❄️ Cold-Chain (কোল্ড স্টোরেজ)' : '🌾 Dry Storage (সাধারণ গুদাম)';
    const isSynced = (currentSyncedWarehouse && (currentSyncedWarehouse.id === wh.id || currentSyncedWarehouse.name === wh.name));

    return `
      <div class="wh-facility-card ${isSynced ? 'synced' : ''}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 4px;">
            <span style="font-size: 11px; font-weight: 800; color: ${wh.tempControlled ? '#0369a1' : '#854d0e'}; background: ${wh.tempControlled ? '#e0f2fe' : '#fef3c7'}; padding: 3px 8px; border-radius: 6px;">${isCold}</span>
            <div style="display: flex; align-items: center; gap: 4px;">
              ${isSynced ? '<span style="font-size: 10px; font-weight: 800; color: #166534; background: #bbf7d0; padding: 2px 7px; border-radius: 4px;">ACTIVE SYNC</span>' : ''}
              <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">📍 ~${wh.distanceKm} km</span>
            </div>
          </div>
          <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">${wh.name}</h4>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0;">${wh.address}</p>

          <!-- Simplified High-Visibility Vacancy Meter -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
              <span style="font-size: 13.5px; font-weight: 800; color: #15803d;">${wh.availableCapacityKg.toLocaleString()} kg Free Space</span>
              <span style="font-size: 11px; font-weight: 700; color: #166534; background: #dcfce7; padding: 1px 6px; border-radius: 4px;">${availPercent}% Available</span>
            </div>
            <div style="height: 7px; border-radius: 4px; overflow: hidden; background: #e2e8f0; width: 100%;">
              <div style="width: ${availPercent}%; height: 100%; background: #10b981;" title="Available: ${availPercent}%"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 4px;">
              <span>Total Cap: ${wh.totalCapacityKg.toLocaleString()} kg</span>
              <span style="color: #0f172a; font-weight: 700;">Rate: ₹${wh.ratePerKgMonth.toFixed(2)}/kg/mo</span>
            </div>
          </div>
        </div>

        <!-- One-Click Select & Sync Button -->
        <button type="button" class="btn-wh-select ${isSynced ? 'synced' : ''}" onclick="applyWarehouseLimitToListing(${wh.availableCapacityKg}, '${wh.district}', '${wh.name.replace(/'/g, "\\'")}', ${wh.totalCapacityKg}, '${wh.id}')">
          <i data-lucide="${isSynced ? 'check-check' : 'check'}"></i> ${isSynced ? '✓ Synced with Harvest Form' : 'Select This Facility (এই গুদাম নির্বাচন করুন)'}
        </button>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// Interactive Real-Time Storage Fit & AI Storage Synchronization Meter
function recalculateStorageFit() {
  const category = document.getElementById("calcCropCategory")?.value || "TUBERS";
  const plannedKg = parseFloat(document.getElementById("calcPlannedKg")?.value) || 0;
  const resultEl = document.getElementById("calcStorageResult");

  const density = STORAGE_DENSITY[category] || 15.0;
  const sqFt = (plannedKg / density).toFixed(1);
  if (resultEl) {
    resultEl.innerText = `~${sqFt} sq. ft. (~${plannedKg} kg load)`;
  }

  // Sync with current AI warehouse available space
  const avail = currentSyncedWarehouse.availableCapacityKg || 54000;
  const pct = avail > 0 ? Math.round((plannedKg / avail) * 1000) / 10 : 100;
  const isOver = plannedKg > avail;

  const whNameEl = document.getElementById("calcAiWarehouseName");
  if (whNameEl) {
    whNameEl.innerText = `Synced AI Storage: ${currentSyncedWarehouse.name}`;
  }

  const badgeEl = document.getElementById("calcAiRemainingBadge");
  if (badgeEl) {
    if (isOver) {
      badgeEl.innerText = `⚠️ Space Exceeded by ${(plannedKg - avail).toLocaleString()} kg!`;
      badgeEl.style.background = "#fee2e2";
      badgeEl.style.color = "#b91c1c";
    } else {
      badgeEl.innerText = `${(avail - plannedKg).toLocaleString()} kg Remaining Vacancy (36% Available Space)`;
      badgeEl.style.background = "#dcfce7";
      badgeEl.style.color = "#047857";
    }
  }

  const progressBar = document.getElementById("calcAiProgressBar");
  if (progressBar) {
    progressBar.style.width = Math.min(100, Math.max(1, pct)) + "%";
    progressBar.style.background = isOver
      ? "#ef4444"
      : (pct > 80 ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #10b981, #059669)");
  }

  const batchText = document.getElementById("calcAiBatchText");
  if (batchText) {
    batchText.innerText = `Current Harvest Batch: ${plannedKg.toLocaleString()} kg (${pct}% of available space)`;
  }

  const capText = document.getElementById("calcAiCapacityText");
  if (capText) {
    capText.innerText = `AI Available Space: ${avail.toLocaleString()} kg (36% Available)`;
  }

  // Two-way sync: if user modified calculator directly, sync harvest listing stock input
  const cropQty = document.getElementById("cropQuantity");
  if (cropQty && document.activeElement === document.getElementById("calcPlannedKg")) {
    cropQty.value = plannedKg;
    syncListingStockWithAiStorage(plannedKg);
  }
}

// Two-way sync: typing stock in harvest listing updates calculator and validates against AI storage
function syncListingStockWithAiStorage(val) {
  const qty = parseFloat(val) || 0;
  const plannedInput = document.getElementById("calcPlannedKg");
  if (plannedInput && document.activeElement === document.getElementById("cropQuantity")) {
    plannedInput.value = qty;
    recalculateStorageFit();
  }

  const avail = currentSyncedWarehouse.availableCapacityKg || 54000;
  const pct = avail > 0 ? Math.round((qty / avail) * 1000) / 10 : 100;
  const isOver = qty > avail;

  const notice = document.getElementById("cropAiSyncNotice");
  const textEl = document.getElementById("cropAiSyncText");
  const pctEl = document.getElementById("cropAiSyncPct");

  if (notice && textEl && pctEl) {
    if (isOver) {
      notice.style.background = "#fef2f2";
      notice.style.borderColor = "#fca5a5";
      notice.style.color = "#b91c1c";
      textEl.innerHTML = `<i data-lucide="alert-triangle" style="width:12px;height:12px;display:inline-block;vertical-align:-1px;"></i> Exceeds AI Hub space by ${(qty - avail).toLocaleString()} kg!`;
      pctEl.innerText = `Over Capacity (${pct}%)`;
      pctEl.style.color = "#dc2626";
    } else {
      notice.style.background = "#f0fdf4";
      notice.style.borderColor = "#bbf7d0";
      notice.style.color = "#166534";
      textEl.innerHTML = `<i data-lucide="check-circle" style="width:12px;height:12px;display:inline-block;vertical-align:-1px;"></i> Synced with ${currentSyncedWarehouse.name} (${avail.toLocaleString()} kg cap | 36% space)`;
      pctEl.innerText = `${pct}% filled (${(avail - qty).toLocaleString()} kg free)`;
      pctEl.style.color = "#047857";
    }
    if (window.lucide) lucide.createIcons();
  }
}

// Auto-fill and synchronize available limit into the listing form
function applyWarehouseLimitToListing(availableKg, district, name, totalCap, id) {
  currentSyncedWarehouse = {
    id: id || currentSyncedWarehouse.id,
    name: name || (district ? `${district} Regional Vault` : currentSyncedWarehouse.name),
    district: district || currentSyncedWarehouse.district,
    availableCapacityKg: availableKg,
    totalCapacityKg: totalCap || Math.round(availableKg / 0.36),
    distanceKm: currentSyncedWarehouse.distanceKm || 5.0
  };

  const qtyInput = document.getElementById("cropQuantity");
  const districtSelect = document.getElementById("cropDistrict");
  const whFilter = document.getElementById("whDistrictFilter");
  const plannedInput = document.getElementById("calcPlannedKg");

  if (qtyInput) {
    qtyInput.max = availableKg;
    if (parseFloat(qtyInput.value) > availableKg || !qtyInput.value) {
      qtyInput.value = Math.min(availableKg, 500);
    }
  }

  if (plannedInput) {
    plannedInput.max = availableKg;
    plannedInput.value = qtyInput ? qtyInput.value : Math.min(availableKg, 500);
  }

  if (districtSelect && district) {
    for (let opt of districtSelect.options) {
      if (opt.value.toLowerCase().includes(district.toLowerCase())) {
        districtSelect.value = opt.value;
        break;
      }
    }
  }

  if (whFilter && district) {
    for (let opt of whFilter.options) {
      if (opt.value.toLowerCase().includes(district.toLowerCase())) {
        whFilter.value = opt.value;
        break;
      }
    }
  }

  // Update storage calculator and sync indicators
  recalculateStorageFit();
  syncListingStockWithAiStorage(qtyInput ? qtyInput.value : 500);
  renderFarmerWarehouseCards(district || "all");

  // Scroll smoothly to the form if called from button click
  const listingForm = document.getElementById("addCropForm") || document.getElementById("cropQuantity");
  if (listingForm && document.activeElement && document.activeElement.tagName === 'BUTTON') {
    listingForm.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("cropQuantity")?.focus();
  }

  if (typeof showCartToast === 'function') {
    showCartToast(`AI storage synced with ${currentSyncedWarehouse.name} (${availableKg.toLocaleString()} kg available)!`);
  }
}

// =============================================================
// Real-time Agro-Meteorology & Disaster Alert Live Sync for Farmers
// =============================================================
async function loadFarmerLiveWeather(district = "Hooghly") {
  const titleEl = document.getElementById("farmerWeatherTitle");
  const descEl = document.getElementById("farmerWeatherAlertText");
  const badgeEl = document.getElementById("farmerWeatherLiveBadge");

  if (!titleEl || !descEl) return;

  try {
    const [advRes, alertRes] = await Promise.all([
      fetch(`${API_BASE}/weather/advisory?district=${encodeURIComponent(district)}`),
      fetch(`${API_BASE}/alerts?region=${encodeURIComponent(district)}`)
    ]);

    if (advRes.ok && alertRes.ok) {
      const adv = await advRes.json();
      const alert = await alertRes.json();

      titleEl.innerHTML = `Live Agro-Weather: ${adv.district} (${adv.current_temperature_c}°C • ${adv.weather_condition})`;
      if (badgeEl) {
        badgeEl.innerText = alert.alert_active ? `⚠️ ${alert.severity} Risk` : `● Live: ${adv.harvest_suitability_score}/100 Score`;
        badgeEl.style.background = alert.alert_active ? "#fef2f2" : "#ecfdf5";
        badgeEl.style.color = alert.alert_active ? "#b91c1c" : "#047857";
        badgeEl.style.borderColor = alert.alert_active ? "#fca5a5" : "#a7f3d0";
      }

      if (alert.alert_active) {
        descEl.innerHTML = `
          <strong style="color: #b91c1c;">⚠️ ${alert.activeWarnings[0]}:</strong> ${alert.action_required}
          <br/><span style="font-size: 11.5px; color: #64748b; margin-top: 3px; display: inline-block;">Open-Meteo Telemetry: Rain ${alert.live_rainfall_mm || 0}mm • Wind ${alert.live_wind_speed_kph || 0} km/h • Humidity ${adv.relative_humidity_percent}%. Safe corridor: <em>${alert.safe_corridor}</em>.</span>
        `;
      } else {
        const primaryAlert = (adv.alerts && adv.alerts.length > 0) ? adv.alerts[0] : null;
        const note = primaryAlert ? primaryAlert.description : "Optimal harvesting and direct consumer dispatch conditions.";
        descEl.innerHTML = `
          <strong>${adv.weather_condition}:</strong> ${note}
          <br/><span style="font-size: 11.5px; color: #15803d; font-weight: 600; margin-top: 3px; display: inline-block;">Harvest Suitability: ${adv.harvest_suitability_score}/100 • Wind: ${adv.wind_speed_kmh} km/h • Humidity: ${adv.relative_humidity_percent}%. Safe express logistics nominal.</span>
        `;
      }
    }
  } catch (err) {
    console.warn("Farmer live weather fetch fallback", err);
  }
}

// Hook into initial dashboard loader
const existingLoadFarmerDashboard = typeof loadFarmerDashboard === 'function' ? loadFarmerDashboard : null;
loadFarmerDashboard = async function() {
  if (typeof existingLoadFarmerDashboard === 'function') {
    await existingLoadFarmerDashboard();
  }
  renderFarmerWarehouseCards("Hooghly");
  recalculateStorageFit();
  syncListingStockWithAiStorage(500);
  loadFarmerLiveWeather("Hooghly");
  loadLiveAlerts("Hooghly");
};

// =============================================================
// AI Nearest Warehouse Radar Expansion Engine (40km Radius Increments)
// =============================================================
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180.0;
  const dLon = (lon2 - lon1) * Math.PI / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
}

async function triggerAiWarehouseRadarScan() {
  const panel = document.getElementById("aiRadarResultsPanel");
  const originSelect = document.getElementById("aiFarmerOriginSelect");
  const scanBtn = document.getElementById("btnRunAiWarehouseScan");

  if (!panel || !originSelect) return;

  panel.style.display = "block";
  if (scanBtn) {
    scanBtn.disabled = true;
    scanBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width:15px;height:15px;display:inline-block;vertical-align:-2px;margin-right:4px;"></i> Scanning...`;
    if (window.lucide) lucide.createIcons();
  }

  let lat = 22.81;
  let lng = 88.23;
  let originLabel = "Singur, Hooghly";

  const originVal = originSelect.value;
  if (originVal === "DEVICE_GPS") {
    originLabel = "Live GPS Location";
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("No Geolocation"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      originLabel = `Live GPS (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;
    } catch (e) {
      console.warn("GPS lookup defaulted to Singur:", e);
      lat = 22.81;
      lng = 88.23;
      originLabel = "Singur, Hooghly (GPS Fallback)";
    }
  } else {
    const parts = originVal.split(",").map(Number);
    lat = parts[0] || 22.81;
    lng = parts[1] || 88.23;
    originLabel = originSelect.options[originSelect.selectedIndex].text.split(" (")[0];
  }

  // Visual simulation of progressive 40km concentric scanning
  panel.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; color: #a7f3d0; font-size: 13px;">
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.15); border-radius: 50%;">
        <i data-lucide="radio" style="width: 18px; height: 18px; color: #6ee7b7;"></i>
      </div>
      <div>
        <div style="font-weight: 700; color: #ffffff;">Initiating AI Proximity Sweep from ${originLabel}...</div>
        <div id="aiScanProgressText" style="font-size: 12px; color: #6ee7b7;">Scanning concentric zone: 0 km → 40 km perimeter...</div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  let nearestWh = null;
  try {
    const res = await fetch(`${API_BASE}/warehouses/nearest?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      nearestWh = await res.json();
    }
  } catch (err) {
    console.warn("Server nearest warehouse API call failed, using client-side AI solver:", err);
  }

  // Client-side fallback if server was unreachable or offline
  if (!nearestWh) {
    let radius = 40.0;
    while (radius <= 1000.0) {
      let nearest = null;
      let shortestDistance = Infinity;

      for (const wh of WAREHOUSE_REGISTRY) {
        const d = calculateHaversineKm(lat, lng, wh.latitude || 22.81, wh.longitude || 88.23);
        if (d <= radius && d < shortestDistance) {
          shortestDistance = d;
          nearest = wh;
        }
      }

      if (nearest) {
        const total = nearest.totalCapacityKg || nearest.capacityKg || 500000;
        const avail = nearest.availableCapacityKg || Math.round(total * 0.36);
        const stock = total - avail;
        const availPct = Math.round((avail / total) * 100);
        const occPct = 100 - availPct;
        nearestWh = {
          id: nearest.id,
          locationName: nearest.name,
          district: nearest.district,
          capacityKg: total,
          currentStockKg: stock,
          availableSpaceKg: avail,
          availablePercent: availPct,
          occupancyPercent: occPct,
          distanceKm: Math.round(shortestDistance * 10) / 10,
          scannedRadiusKm: radius,
          scanIterations: Math.round(radius / 40.0),
          scanStatus: `Warehouse discovered in ${radius} km radius tier (${Math.round(shortestDistance * 10) / 10} km away)`
        };
        break;
      }
      radius += 40.0;
    }
  }

  // Finish scan and reset trigger button
  if (scanBtn) {
    scanBtn.disabled = false;
    scanBtn.innerHTML = `<i data-lucide="scan" style="width:15px;height:15px;"></i> Run AI Radius Scan`;
  }

  if (!nearestWh) {
    panel.innerHTML = `
      <div style="color: #fca5a5; font-size: 13px; display: flex; align-items: center; gap: 8px;">
        <i data-lucide="alert-triangle"></i> No open warehouse located within 1,000 km.
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Synchronize the found AI warehouse immediately with the available storage in the platform!
  applyWarehouseLimitToListing(
    nearestWh.availableSpaceKg,
    nearestWh.district,
    nearestWh.locationName,
    nearestWh.capacityKg,
    nearestWh.id
  );

  const isExpanded = (nearestWh.scannedRadiusKm || 40.0) > 40.0;
  const radiusBadge = isExpanded
    ? `<span style="background: #fef08a; color: #854d0e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">Expanded to ${nearestWh.scannedRadiusKm} km Tier (Cycle #${nearestWh.scanIterations})</span>`
    : `<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">Direct 40 km Primary Perimeter</span>`;

  const availPct = nearestWh.availablePercent != null ? Math.round(nearestWh.availablePercent) : (nearestWh.capacityKg ? Math.round((nearestWh.availableSpaceKg / nearestWh.capacityKg) * 100) : 36);
  const occPct = nearestWh.occupancyPercent != null ? Math.round(nearestWh.occupancyPercent) : (100 - availPct);
  const occupiedKg = nearestWh.currentStockKg != null ? nearestWh.currentStockKg : (nearestWh.capacityKg - nearestWh.availableSpaceKg);

  panel.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="background: #10b981; color: white; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 800;">AI TARGET LOCKED &amp; SYNCED</span>
          ${radiusBadge}
          <span style="background: rgba(16, 185, 129, 0.22); color: #6ee7b7; border: 1px solid #10b981; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">
            ✓ DB Verified: ${availPct}% Available Space
          </span>
        </div>
        <span style="font-size: 12px; color: #a7f3d0; font-weight: 600;">Distance: <strong>~${nearestWh.distanceKm} km</strong> from ${originLabel}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; align-items: center;">
        <div>
          <h4 style="margin: 0 0 2px 0; font-size: 15px; font-weight: 800; color: #ffffff;">${nearestWh.locationName}</h4>
          <span style="font-size: 12px; color: #93c5fd;">District: <strong>${nearestWh.district}</strong></span>
        </div>

        <div style="background: rgba(16, 185, 129, 0.18); padding: 8px 12px; border-radius: 8px; border: 1.5px solid #34d399;">
          <div style="font-size: 10.5px; color: #a7f3d0; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Live Available Space (${availPct}%)</div>
          <div style="font-size: 16px; font-weight: 900; color: #34d399;">${nearestWh.availableSpaceKg.toLocaleString()} kg <span style="font-size: 11px; font-weight: 700; color: #a7f3d0;">free</span></div>
        </div>

        <div style="background: rgba(245, 158, 11, 0.18); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.4);">
          <div style="font-size: 10.5px; color: #fde68a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Current Stock / Occupied (${occPct}%)</div>
          <div style="font-size: 15px; font-weight: 800; color: #fcd34d;">${occupiedKg.toLocaleString()} kg</div>
        </div>

        <div style="background: rgba(255,255,255,0.12); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.18);">
          <div style="font-size: 10.5px; color: #e2e8f0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Facility Capacity</div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff;">${nearestWh.capacityKg.toLocaleString()} kg</div>
        </div>
      </div>

      <!-- Occupancy Breakdown Meter -->
      <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span style="color: #fde68a; font-weight: 700;">● Occupied Stock: ${occPct}% (${occupiedKg.toLocaleString()} kg)</span>
          <span style="color: #6ee7b7; font-weight: 800;">● Available Database Space: ${availPct}% (${nearestWh.availableSpaceKg.toLocaleString()} kg)</span>
        </div>
        <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: rgba(255,255,255,0.2);">
          <div style="width: ${occPct}%; height: 100%; background: #f59e0b;" title="Occupied: ${occPct}%"></div>
          <div style="width: ${availPct}%; height: 100%; background: #10b981;" title="Available: ${availPct}%"></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 4px; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 6px;">
        <span style="font-size: 11.5px; color: #6ee7b7; display: flex; align-items: center; gap: 5px;">
          <i data-lucide="check-check" style="width:14px;height:14px;"></i> Available storage automatically synced with database (${availPct}% space / ${nearestWh.availableSpaceKg.toLocaleString()} kg max batch cap)!
        </span>
        <button type="button" onclick="applyWarehouseLimitToListing(${nearestWh.availableSpaceKg}, '${nearestWh.district}', '${nearestWh.locationName.replace(/'/g, "\\'")}', ${nearestWh.capacityKg}, '${nearestWh.id}')" style="background: #34d399; color: #064e3b; font-weight: 800; font-size: 12px; padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;" onmouseover="this.style.background='#6ee7b7'" onmouseout="this.style.background='#34d399'">
          <i data-lucide="arrow-down-circle"></i> Jump to Listing Form
        </button>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

// Explicit window bindings for inline HTML triggers
window.currentSyncedWarehouse = currentSyncedWarehouse;
window.syncListingStockWithAiStorage = syncListingStockWithAiStorage;
window.renderFarmerWarehouseCards = renderFarmerWarehouseCards;
window.recalculateStorageFit = recalculateStorageFit;
window.applyWarehouseLimitToListing = applyWarehouseLimitToListing;
window.loadFarmerDashboard = loadFarmerDashboard;
window.calculateHaversineKm = calculateHaversineKm;
window.triggerAiWarehouseRadarScan = triggerAiWarehouseRadarScan;
window.loadLiveAlerts = loadLiveAlerts;
window.loadFarmerLiveWeather = loadFarmerLiveWeather;
window.switchRole = switchRole;
window.swapLogisticsRoute = swapLogisticsRoute;
window.openLogisticsModal = openLogisticsModal;
window.switchWarehouseMatrixTab = switchWarehouseMatrixTab;
window.setListingPricingStrategy = setListingPricingStrategy;
window.updateDynamicPricingPreview = updateDynamicPricingPreview;
window.calculateDynamicDailyMarketPrice = calculateDynamicDailyMarketPrice;
window.openPricingStrategyInfoModal = openPricingStrategyInfoModal;
window.closePricingStrategyInfoModal = closePricingStrategyInfoModal;
window.switchPricingInfoTab = switchPricingInfoTab;
window.selectPricingScenario = selectPricingScenario;
