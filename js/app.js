const DEFAULT_API_ORIGIN = "https://farmer-consult-platform.onrender.com";

const apiOrigin = (() => {
  if (typeof window === "undefined") return DEFAULT_API_ORIGIN.replace(/\/$/, "");
  if (typeof window.__YEGNA_API_ORIGIN__ === "string") {
    return String(window.__YEGNA_API_ORIGIN__).trim().replace(/\/$/, "");
  }
  const helperOrigin = window.YegnaAPI?.apiOrigin;
  const explicitOrigin =
    window.YEGNA_API_ORIGIN || window.YEGNAFARM_API_ORIGIN || helperOrigin || DEFAULT_API_ORIGIN;
  return String(explicitOrigin).replace(/\/$/, "");
})();

const apiUrl = (path) => {
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiOrigin}${normalizedPath}`;
};

/** Resolve product image URL when API returns a path like /uploads/... (needs API origin on Vercel). */
function resolveMarketImageSrc(raw) {
  const s = raw && String(raw).trim() ? String(raw).trim() : "";
  if (!s) return "assets/maize.png";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return apiUrl(s);
  return s;
}

const guideImageMap = {
  Cereals:
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
  "Legumes (Pulses)":
    "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80",
  "Root & Tuber Crops":
    "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=800&q=80",
  Vegetables:
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
  Fruits: "assets/fruit.png",
  "Oil & Special Crops":
    "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80",
  "Cattle Breeds":
    "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80",
};

const defaultGuideFamilies = [
  "Cereals",
  "Legumes (Pulses)",
  "Root & Tuber Crops",
  "Vegetables",
  "Fruits",
  "Oil & Special Crops",
  "Cattle Breeds",
];

let guideData = defaultGuideFamilies.map((family) => ({
  title: family,
  description: "Explore crops, best practices, and local tips.",
  image: guideImageMap[family] || guideImageMap.Cereals,
}));
let guideQuestions = [];
let guideDetails = {};

const defaultMarketData = [
  {
    name: "Teff",
    price: 7800,
    location: "Addis Ababa",
    type: "crops",
    image:
      "assets/teff.png",
  },
  {
    name: "Maize",
    price: 3500,
    location: "Bahir Dar",
    type: "crops",
    image:
      "assets/maize.png",
  },
  {
    name: "Tomato",
    price: 420,
    location: "Adama",
    type: "crops",
    image:
      "assets/tomato.png",
  },
  {
    name: "Mangoes",
    price: 3,
    location: "Hawassa",
    type: "crops",
    image:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Organic Fertilizer",
    price: 5,
    location: "Dire Dawa",
    type: "crops",
    image:
      "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cattle (Local Breed)",
    price: 52000,
    location: "Hawassa",
    type: "livestock",
    image:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80",
  },
];

let marketData = defaultMarketData.slice();

const expertData = [
  {
    name: "Dr. Abera",
    specialty: "Soil & Crop Specialist",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    contact: "abera@example.com",
  },
  {
    name: "Dr. Selam",
    specialty: "Seed & Planting Advisor",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
    contact: "selam@example.com",
  },
  {
    name: "Dr. Mekdes",
    specialty: "Market & Value Chain",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    contact: "mekdes@example.com",
  },
  {
    name: "Dr. Kibrom",
    specialty: "Livestock & Cattle Health",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    contact: "kibrom@example.com",
  },
];

const responseLibrary = [
  {
    keywords: ["teff", "soil", "plant"],
    response:
      "For teff, prepare a fine seedbed and plant early in the rainy season. Keep rows 20 cm apart and avoid deep planting. Apply nitrogen in split doses for best yields.",
  },
  {
    keywords: ["maize", "fertilizer", "urea"],
    response:
      "For maize, apply DAP at planting and top dress with urea when plants reach knee height. Use drought-tolerant varieties in low rainfall areas.",
  },
  {
    keywords: ["tomato", "pest", "disease"],
    response:
      "For tomato, rotate crops, remove infected leaves, and use botanical sprays or approved pesticides. Keep plants well-spaced for airflow.",
  },
  {
    keywords: ["insect", "insects", "aphid", "armyworm", "worm", "caterpillar", "whitefly"],
    response:
      "- Immediate Action: Inspect leaf undersides and crop tops now; remove heavily infested leaves and crush visible insects.\n- Next 7 Days Plan: Scout early morning daily, keep field weed-free, and install yellow sticky traps where possible.\n- Control Option: Start with soap/neem spray or other approved biopesticide; only escalate to registered pesticide if infestation rises.\n- Safety Warning: Follow label dose exactly, wear gloves/mask, and avoid spraying near water sources or in strong wind.\nSource: [YegnaFarm Advisory - Pest Management]",
  },
  {
    keywords: ["onion", "irrigation"],
    response:
      "Onion prefers light, frequent irrigation. Avoid waterlogging and stop irrigation 10-14 days before harvest for better storage.",
  },
  {
    keywords: ["cow", "cattle", "mastitis", "milk"],
    response:
      "For dairy cattle, keep housing clean and dry to prevent mastitis. Provide balanced feed, clean water, and regular health checks.",
  },
  {
    keywords: ["price", "market"],
    response:
      "You can check market prices in the Market Prices section. We update key crops and livestock values regularly.",
  },
];

const defaultResponse =
  "Thanks for your question. Please share the crop/livestock, location, and current season. Meanwhile, check soil moisture, use clean tools, and monitor pests weekly.";

const guideCards = document.getElementById("guideCards");
const guideInfo = document.getElementById("guideInfo");
const marketCards = document.getElementById("marketCards");
const expertCards = document.getElementById("expertCards");

const marketSearch = document.getElementById("marketSearch");
const marketType = document.getElementById("marketType");
const marketMin = document.getElementById("marketMin");
const marketMax = document.getElementById("marketMax");

const assistantForm = document.getElementById("assistantForm");
const assistantName = document.getElementById("assistantName");
const assistantInput = document.getElementById("assistantInput");
const assistantLog = document.getElementById("assistantLog");
const askCameraBtn = document.getElementById("askCameraBtn");
const askCameraInput = document.getElementById("askCameraInput");

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const chatBubbleLog = document.getElementById("chatBubbleLog");
const chatBubbleInput = document.getElementById("chatBubbleInput");
const chatBubbleSend = document.getElementById("chatBubbleSend");
const chatModeHint = document.getElementById("chatModeHint");
const languageSelect = document.getElementById("languageSelect");
const offlineQueueHint = document.getElementById("offlineQueueHint");
const OFFLINE_QUESTION_QUEUE_KEY = "yegnafarm_offline_question_queue";
const ASK_CAPTURE_STORAGE_KEY = "yegnafarm_pending_capture_image";

const showToast = (message, variant = "info", ms = 4200) => {
  if (typeof window.showYegnaToast === "function") {
    window.showYegnaToast(message, variant, ms);
  }
};

const loadQueuedQuestions = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUESTION_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const updateOfflineQueueHint = () => {
  if (!offlineQueueHint) return;
  const queuedCount = loadQueuedQuestions().length;
  if (queuedCount > 0) {
    offlineQueueHint.hidden = false;
    offlineQueueHint.textContent = `${queuedCount} question(s) waiting for internet sync.`;
  } else {
    offlineQueueHint.hidden = true;
    offlineQueueHint.textContent = "";
  }
};

const saveQueuedQuestions = (entries) => {
  localStorage.setItem(OFFLINE_QUESTION_QUEUE_KEY, JSON.stringify(entries));
  updateOfflineQueueHint();
};

const queueQuestionForSync = (entry) => {
  const current = loadQueuedQuestions();
  current.push(entry);
  saveQueuedQuestions(current);
};

const submitQuestionToBackend = async ({ name, question }) => {
  if (window.YegnaAPI?.request) {
    return window.YegnaAPI.request("/questions", {
      method: "POST",
      body: {
        body: question,
        guestName: name || "Farmer",
      },
    });
  }
  return fetch(apiUrl("/ask-question"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, question }),
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to submit question.");
    }
    return data;
  });
};

const flushQueuedQuestions = async () => {
  if (!navigator.onLine) return;
  const queued = loadQueuedQuestions();
  if (!queued.length) return;
  const remaining = [];
  for (const entry of queued) {
    try {
      await submitQuestionToBackend(entry);
    } catch (error) {
      remaining.push(entry);
    }
  }
  saveQueuedQuestions(remaining);
  if (!remaining.length) {
    showToast("Offline questions synced.", "success", 2500);
  }
};

const loadGuidesData = async () => {
  try {
    const apiRes = await fetch(apiUrl("/api/v1/guides"));
    if (apiRes.ok) {
      const data = await apiRes.json();
      guideData = (data.families || []).map((family) => ({
        title: family,
        description: "Explore crops, best practices, and local tips.",
        image: guideImageMap[family] || guideImageMap.Cereals,
      }));
      guideQuestions = data.questions || [];
      guideDetails = data.details || {};
      return;
    }
  } catch (error) {
    /* try static file */
  }
  try {
    const response = await fetch("data/guides.json");
    if (!response.ok) return;
    const data = await response.json();
    guideData = (data.families || []).map((family) => ({
      title: family,
      description: "Explore crops, best practices, and local tips.",
      image: guideImageMap[family] || guideImageMap.Cereals,
    }));
    guideQuestions = data.questions || [];
    guideDetails = data.details || {};
  } catch (error) {
    // Keep defaults if data fails to load.
  }
};

const loadMarketData = async () => {
  try {
    const response = await fetch(apiUrl("/market-data"));
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return;
    marketData = data.map((item) => ({
      name: item.name,
      price: Number(item.price),
      location: item.location,
      type: item.type || "crops",
      image: item.image || "",
      unit: item.unit || "ETB",
    }));
  } catch (error) {
    marketData = defaultMarketData.slice();
  }
};

const renderGuides = () => {
  if (!guideCards) return;
  guideCards.innerHTML = "";
  guideData.forEach((guide) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${guide.image}" alt="${guide.title}" />
      <div class="card-body">
        <h3>${guide.title}</h3>
        <p>${guide.description}</p>
        <button class="icon-btn" type="button" data-guide-title="${guide.title}">→</button>
      </div>
    `;
    guideCards.appendChild(card);
  });
  wireGuideCards();
};

const guideSummaries = {
  "Cereals":
    "Cereals include teff, maize, wheat, and barley. Focus on good seedbed prep, proper spacing, and split fertilizer use.",
  "Legumes (Pulses)":
    "Legumes improve soil fertility. Use Rhizobium inoculation, avoid excess nitrogen, and keep weeds low early.",
  "Root & Tuber Crops":
    "Use loose soil and good drainage. Plant healthy seed tubers and avoid waterlogging.",
  "Vegetables":
    "Vegetables need frequent watering and pest control. Use compost and monitor diseases weekly.",
  "Fruits":
    "Fruit crops need pruning, mulching, and pest control. Maintain soil moisture and good airflow.",
  "Oil & Special Crops":
    "Oil crops need clean seed, timely planting, and weed control during early growth.",
  "Cattle Breeds":
    "Choose breeds suited to your region, provide clean water, balanced feed, and regular health checks.",
};

const wireGuideCards = () => {
  if (!guideInfo) return;
  guideCards.querySelectorAll(".icon-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const title = button.getAttribute("data-guide-title");
      const text = guideSummaries[title] || "General guidance will be added soon.";
      guideInfo.innerHTML = `<h3>${title}</h3><p>${text}</p>`;
      guideInfo.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
};

const renderMarket = () => {
  if (!marketCards || !marketSearch || !marketType || !marketMin || !marketMax) {
    return;
  }
  const query = marketSearch.value.trim().toLowerCase();
  const type = marketType.value;
  const minPrice = Number(marketMin.value) || 0;
  const maxPrice = Number(marketMax.value) || Infinity;

  const filtered = marketData.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query);
    const matchesType = type === "all" ? true : item.type === type;
    const matchesPrice = item.price >= minPrice && item.price <= maxPrice;
    return matchesQuery && matchesType && matchesPrice;
  });

  marketCards.innerHTML = "";
  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card market-card";
    const unit = item.name === "Organic Fertilizer" ? "/bag" : "/kg";
    const imgSrc = resolveMarketImageSrc(item.image);
    card.innerHTML = `
      <img src="${imgSrc}" alt="${item.name}" loading="lazy" />
      <div class="card-body">
        <h3>${item.name}</h3>
        <div class="market-meta">
          <span>${item.unit || "ETB"} ${item.price}${unit}</span>
          <span class="tag">${item.location}</span>
        </div>
        <button class="primary-btn" type="button">Buy / View</button>
      </div>
    `;
    marketCards.appendChild(card);
  });
};

const dashboardStatPending = document.getElementById("dashboardStatPending");
const dashboardStatAnswered = document.getElementById("dashboardStatAnswered");
const dashboardStatExperts = document.getElementById("dashboardStatExperts");

const loadDashboardStats = async () => {
  if (!dashboardStatPending || !dashboardStatAnswered || !dashboardStatExperts) {
    return;
  }
  try {
    const response = await fetch(apiUrl("/dashboard-stats"));
    if (!response.ok) return;
    const data = await response.json();
    dashboardStatPending.textContent = data.pendingQuestions ?? "0";
    dashboardStatAnswered.textContent = data.answeredToday ?? "0";
    dashboardStatExperts.textContent = data.activeExperts ?? "0";
  } catch (error) {
    dashboardStatPending.textContent = "—";
    dashboardStatAnswered.textContent = "—";
    dashboardStatExperts.textContent = "—";
  }
};

const renderExperts = () => {
  if (!expertCards) return;
  expertCards.innerHTML = "";
  expertData.forEach((expert) => {
    const card = document.createElement("div");
    card.className = "expert-card";
    card.innerHTML = `
      <img src="${expert.image}" alt="${expert.name}" />
      <div class="expert-body">
        <h3>${expert.name}</h3>
        <span>${expert.specialty}</span>
        <button class="primary-btn" type="button">Contact</button>
      </div>
    `;
    expertCards.appendChild(card);
  });
};

const appendMessage = (logElement, role, name, text) => {
  const message = document.createElement("div");
  message.className = `assistant-message ${role}`;
  message.innerHTML = `<span>${role === "ai" ? "AI assistant" : name}</span><p>${text}</p>`;
  logElement.appendChild(message);
  logElement.scrollTop = logElement.scrollHeight;
};

const addMessage = (role, name, text) => {
  if (assistantLog) appendMessage(assistantLog, role, name, text);
  if (chatBubbleLog) appendMessage(chatBubbleLog, role, name, text);
};

const updateChatModeHint = (mode) => {
  const label =
    mode === "backend"
      ? "AI mode: Live backend response"
      : "Offline guidance mode: Local advisory response";
  if (chatModeHint) chatModeHint.textContent = label;
  if (offlineQueueHint && !offlineQueueHint.hidden) return;
  if (!offlineQueueHint) return;
  offlineQueueHint.hidden = false;
  offlineQueueHint.textContent = label;
};

const getResponse = (question) => {
  const query = question.toLowerCase();
  const guideMatch = findGuideResponse(query);
  if (guideMatch) return guideMatch;
  const guideAnswer = findQuestionResponse(query);
  if (guideAnswer) return guideAnswer;
  const match = responseLibrary.find((entry) =>
    entry.keywords.some((word) => query.includes(word))
  );
  if (match) return match.response;
  return getGeneralAdvice(query);
};

const fetchBackendResponse = async (message) => {
  const lang = (localStorage.getItem("yegnafarm_lang") || "en").slice(0, 2);
  const language = lang === "am" ? "am" : lang === "om" ? "om" : "en";
  const region =
    localStorage.getItem("yegnafarm_region") ||
    localStorage.getItem("region") ||
    undefined;
  const agroEcology =
    localStorage.getItem("yegnafarm_agroEcology") ||
    localStorage.getItem("yegnafarm_agro_ecology") ||
    undefined;
  try {
    const response = await fetch(apiUrl("/api/v1/ai/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message, language, region, agroEcology }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.answer ? { answer: data.answer, mode: "backend" } : null;
  } catch (error) {
    /* fall through */
  }
  try {
    const response = await fetch(apiUrl("/ask"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message, language, region, agroEcology }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.answer ? { answer: data.answer, mode: "backend" } : null;
  } catch (error) {
    return null;
  }
};

const getChatResponse = async (question) => {
  const backendReply = await fetchBackendResponse(question);
  if (backendReply) return backendReply;
  return { answer: getResponse(question), mode: "offline" };
};

const findQuestionResponse = (query) => {
  const match = guideQuestions.find((item) =>
    query.includes(item.keyword.toLowerCase())
  );
  return match ? match.response : null;
};

const guideKeywords = [
  { key: "pre-planting", guide: "prePlantingPreparation" },
  { key: "preplanting", guide: "prePlantingPreparation" },
  { key: "planting", guide: "plantingSowing" },
  { key: "sowing", guide: "plantingSowing" },
  { key: "maintenance", guide: "cropMaintenance" },
  { key: "crop maintenance", guide: "cropMaintenance" },
  { key: "harvest", guide: "harvesting" },
  { key: "harvesting", guide: "harvesting" },
  { key: "marketing", guide: "marketingSelling" },
  { key: "selling", guide: "marketingSelling" },
  { key: "troubleshooting", guide: "troubleshooting" },
  { key: "problem solving", guide: "troubleshooting" },
  { key: "cattle", guide: "cattleBreedingSafety" },
  { key: "breeding", guide: "cattleBreedingSafety" },
  { key: "agroforestry", guide: "agroforestrySoilConservation" },
  { key: "soil conservation", guide: "agroforestrySoilConservation" },
  { key: "irrigation", guide: "waterIrrigationManagement" },
  { key: "water", guide: "waterIrrigationManagement" },
  { key: "climate", guide: "climateWeatherAwareness" },
  { key: "weather", guide: "climateWeatherAwareness" },
  { key: "finance", guide: "farmFinanceRecordKeeping" },
  { key: "record keeping", guide: "farmFinanceRecordKeeping" },
];

const formatGuideDetails = (guide) => {
  const lines = guide.steps.flatMap((step) => [
    `${step.title}:`,
    ...step.points.map((point) => `- ${point}`),
  ]);
  return `${guide.title}\n${lines.join("\n")}`;
};

const findGuideResponse = (query) => {
  const match = guideKeywords.find((entry) => query.includes(entry.key));
  if (!match) return null;
  const guide = guideDetails[match.guide];
  if (!guide) return null;
  return formatGuideDetails(guide);
};

const generalAdviceBank = [
  "Check soil moisture 5–10 cm deep before watering.",
  "Start with clean seed, clean tools, and healthy soil.",
  "Rotate crops each season to reduce pests and disease.",
  "Apply fertilizer in split doses rather than all at once.",
  "Scout fields weekly for pests and disease signs.",
  "Use mulch to retain moisture and reduce weeds.",
];

const agricultureKeywords = [
  "crop",
  "crops",
  "farm",
  "farming",
  "agriculture",
  "seed",
  "plant",
  "planting",
  "harvest",
  "soil",
  "pest",
  "insect",
  "disease",
  "irrigation",
  "rain",
  "fertilizer",
  "teff",
  "maize",
  "wheat",
  "barley",
  "tomato",
  "onion",
  "potato",
  "livestock",
  "cattle",
  "cow",
  "goat",
  "sheep",
  "poultry",
  "market",
  "price",
];

const translations = {
  en: {
    navHome: "Home",
    navGuides: "Guides",
    navMarket: "Market",
    navExperts: "Experts",
    navAsk: "Ask Questions",
    navSignup: "Sign Up",
    heroTitle: "Smart Guidance for Every Farmer",
    heroSubtitle: "Grow Smarter • Sell Better • Earn More",
    heroAskAi: "Ask AI",
    heroBrowseCrops: "Browse crops",
    heroSell: "Market",
    heroCta: "Guides overview",
    heroExplore: "Scroll to prices",
    guidesTitle: "Guides",
    guidesSubtitle: "Practical crop guides for better yields and healthier harvests.",
    marketTitle: "Market",
    marketSubtitle: "Find products, compare prices, and connect to buyers.",
    marketSearch: "Search by crop or location",
    marketAll: "All types",
    marketCrops: "Crops",
    marketLivestock: "Livestock",
    marketMin: "Min price",
    marketMax: "Max price",
    marketViewAll: "View All Products",
    expertsTitle: "Experts",
    expertsSubtitle: "Reach agronomists and livestock advisors for quick support.",
    askTitle: "Ask Questions",
    askSubtitle: "Send your question and get practical guidance.",
    askName: "Your name",
    askQuestion: "Ask about crops, chemicals, or market...",
    askSubmit: "Submit",
    askCamera: "Take Photo",
    askCameraNote: "Capture from camera and analyze instantly.",
    chatTitle: "YegnaFarm Chatbot",
    chatSubtitle: "Ask quick questions and get instant farming tips.",
    chatPlaceholder: "Type your question...",
    chatAsk: "Ask Now",
    chatCamera: "Use Camera",
    footerEmail: "Email for updates",
    footerSubscribe: "Subscribe",
    footerCopyright: "© 2026 YegnaFarm. All rights reserved.",
  },
  am: {
    navHome: "መነሻ",
    navGuides: "መመሪያዎች",
    navMarket: "ገበያ",
    navExperts: "ባለሞያዎች",
    navAsk: "ጥያቄ ይጠይቁ",
    navSignup: "ተመዝገብ",
    heroTitle: "ለእያንዳንዱ ገበሬ ብልህ መመሪያ",
    heroSubtitle: "ይበልጥ ያበቃ • ይበልጥ ይሽጡ • ይበልጥ ይሰብስቡ",
    heroAskAi: "AI ጠይቅ",
    heroBrowseCrops: "ሰብሎች",
    heroSell: "ገበያ",
    heroCta: "መመሪያ አጠቃላይ",
    heroExplore: "ዋጋዎች ዝርዝር",
    guidesTitle: "መመሪያዎች",
    guidesSubtitle: "ለተሻለ ምርት ተግባራዊ የሰብል መመሪያዎች።",
    marketTitle: "ገበያ",
    marketSubtitle: "ዋጋ ያወዳድሩ እና ገዢዎችን ያግኙ።",
    marketSearch: "በሰብል ወይም ቦታ ይፈልጉ",
    marketAll: "ሁሉም",
    marketCrops: "ሰብሎች",
    marketLivestock: "እንስሳት",
    marketMin: "ዝቅተኛ ዋጋ",
    marketMax: "ከፍተኛ ዋጋ",
    marketViewAll: "ሁሉንም ይመልከቱ",
    expertsTitle: "ባለሞያዎች",
    expertsSubtitle: "ለፈጣን ድጋፍ አብራሪዎችን ያግኙ።",
    askTitle: "ጥያቄ ይጠይቁ",
    askSubtitle: "ጥያቄዎን ይላኩ እና መመሪያ ያግኙ።",
    askName: "ስምዎ",
    askQuestion: "ስለ ሰብል ወይም ገበያ ጠይቁ...",
    askSubmit: "ላክ",
    askCamera: "ፎቶ አንሳ",
    askCameraNote: "ከካሜራ አንሳ እና በፍጥነት አስተካክል።",
    chatTitle: "የYegnaFarm ቻትቦት",
    chatSubtitle: "ፈጣን ጥያቄ ይጠይቁ።",
    chatPlaceholder: "ጥያቄዎን ይጻፉ...",
    chatAsk: "ጠይቅ",
    chatCamera: "ካሜራ ተጠቀም",
    footerEmail: "ለዜና ኢሜይል",
    footerSubscribe: "ይመዝገቡ",
    footerCopyright: "© 2026 YegnaFarm. መብት የተጠበቀ።",
  },
  om: {
    navHome: "Fuula jalqabaa",
    navGuides: "Qajeelfamoota",
    navMarket: "Gabaa",
    navExperts: "Ogeessota",
    navAsk: "Gaaffii gaafadhu",
    navSignup: "Galmaa'i",
    heroTitle: "Qajeelfama hojii qonnaa nama hundaaf",
    heroSubtitle: "Cimfachi • Gurguri • Bu'aa argadhu",
    heroAskAi: "AI gaafadhu",
    heroBrowseCrops: "Midhaan ilaali",
    heroSell: "Gabaa",
    heroCta: "Qajeelfama walitti qabi",
    heroExplore: "Gatii gadi bu'aa",
    guidesTitle: "Qajeelfamoota",
    guidesSubtitle: "Qajeelfamoota qonnaa salphaa fi faayidaa qabu.",
    marketTitle: "Gabaa",
    marketSubtitle: "Gatii wal bira qabii bittoota waliin wal qunnam.",
    marketSearch: "Midhaan ykn bakka barbaadi",
    marketAll: "Hunda",
    marketCrops: "Midhaan",
    marketLivestock: "Beeyladaa",
    marketMin: "Gatii xiqqaa",
    marketMax: "Gatii guddaa",
    marketViewAll: "Meeshaa hunda ilaali",
    expertsTitle: "Ogeessota",
    expertsSubtitle: "Deeggarsa saffisaa argachuuf ogeessota waliin wal qunnam.",
    askTitle: "Gaaffii gaafadhu",
    askSubtitle: "Gaaffii kee ergi gorsa argadhu.",
    askName: "Maqaa kee",
    askQuestion: "Midhaan, qoricha, gabaa irratti gaafadhu...",
    askSubmit: "Ergi",
    askCamera: "Suuraa kaasi",
    askCameraNote: "Kaameraadhaan kaasiitii saffisaan xiinxali.",
    chatTitle: "YegnaFarm Chatbot",
    chatSubtitle: "Gaaffii saffisaa gaafadhu.",
    chatPlaceholder: "Gaaffii kee barreessi...",
    chatAsk: "Gaafadhu",
    chatCamera: "Kaamera fayyadami",
    footerEmail: "Imayilii odeeffannoo",
    footerSubscribe: "Galmaa'i",
    footerCopyright: "© 2026 YegnaFarm. Mirgi hunda eegamaa.",
  },
};

const applyTranslations = (lang) => {
  const dictionary = translations[lang] || translations.en;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dictionary[key]) {
      el.textContent = dictionary[key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dictionary[key]) {
      el.setAttribute("placeholder", dictionary[key]);
    }
  });
  guideData = guideData.map((item) => ({
    ...item,
    description: dictionary.guidesSubtitle || item.description,
  }));
  renderGuides();
};

const getGeneralAdvice = (query) => {
  if (
    query.includes("insect") ||
    query.includes("insects") ||
    query.includes("aphid") ||
    query.includes("armyworm") ||
    query.includes("worm") ||
    query.includes("whitefly")
  ) {
    return "- Immediate Action: Check 20-30 plants now, especially new leaves and undersides, and remove heavily infested parts.\n- Next 7 Days Plan: Monitor every day, keep the field clean, and record whether infestation is increasing or decreasing.\n- Control Option: Use botanical or biological control first; apply approved pesticide only when threshold is high.\n- Safety Warning: Use protective gear, spray at calm hours, and follow product label rate and pre-harvest interval.\nSource: [YegnaFarm Advisory - Insect Control]";
  }
  if (query.includes("fertilizer")) {
    return "Use a balanced fertilizer at planting, then top-dress nitrogen during early growth. Mix with compost for better soil health.";
  }
  if (query.includes("water") || query.includes("irrigation")) {
    return "Water early morning or late evening. Keep soil moist but not waterlogged, and avoid wetting leaves at midday.";
  }
  if (query.includes("pest") || query.includes("disease")) {
    return "Inspect weekly, remove affected leaves early, and use approved pesticides only when necessary. Rotate crops each season.";
  }
  const seemsAgricultureQuestion = agricultureKeywords.some((word) => query.includes(word));
  if (seemsAgricultureQuestion) {
    return "- Immediate Action: Share crop/livestock name, current growth stage, and your location so guidance can be tailored.\n- Next 7 Days Plan: Monitor field/livestock daily, record weather and symptoms, and compare changes after each action.\n- Practical Advice: Keep field hygiene, use clean tools, and prioritize low-risk integrated pest and soil management.\n- Safety Warning: For any chemical input, follow product label rate exactly and use protective gear.\nSource: [YegnaFarm Advisory - General Agriculture]";
  }
  const tip = generalAdviceBank[Math.floor(Math.random() * generalAdviceBank.length)];
  return `${defaultResponse} Quick tip: ${tip}`;
};

if (assistantForm) {
  assistantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = assistantName.value.trim() || "Farmer";
    const question = assistantInput.value.trim();
    if (!question) return;
    addMessage("user", name, question);
    try {
      await submitQuestionToBackend({ name, question });
    } catch (error) {
      queueQuestionForSync({ name, question });
      showToast("Saved offline. It will sync automatically when internet is back.", "info");
    }
    const response = await getChatResponse(question);
    updateChatModeHint(response.mode);
    addMessage("ai", "AI assistant", response.answer);
    assistantInput.value = "";
  });
}

if (askCameraBtn && askCameraInput) {
  askCameraBtn.addEventListener("click", () => {
    askCameraInput.click();
  });

  askCameraInput.addEventListener("change", () => {
    const file = askCameraInput.files && askCameraInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        sessionStorage.setItem(ASK_CAPTURE_STORAGE_KEY, String(event.target?.result || ""));
      } catch (error) {
        // ignore storage errors and just open camera page
      }
      window.location.href = "upload.html?camera=1&prefill=1";
    };
    reader.readAsDataURL(file);
  });
}

const handleChatBubbleSubmit = async () => {
  if (!chatBubbleInput) return;
  const question = chatBubbleInput.value.trim();
  if (!question) return;
  addMessage("user", "Farmer", question);
  const response = await getChatResponse(question);
  updateChatModeHint(response.mode);
  addMessage("ai", "AI assistant", response.answer);
  chatBubbleInput.value = "";
};

if (chatBubbleSend) {
  chatBubbleSend.addEventListener("click", handleChatBubbleSubmit);
}

if (chatBubbleInput) {
  chatBubbleInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleChatBubbleSubmit();
    }
  });
}

[marketSearch, marketType, marketMin, marketMax].forEach((input) => {
  if (!input) return;
  input.addEventListener("input", renderMarket);
  input.addEventListener("change", renderMarket);
});

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

if (languageSelect) {
  const savedLang = localStorage.getItem("yegnafarm_lang") || "en";
  languageSelect.value = savedLang;
  applyTranslations(savedLang);
  languageSelect.addEventListener("change", (event) => {
    const lang = event.target.value;
    localStorage.setItem("yegnafarm_lang", lang);
    applyTranslations(lang);
  });
} else {
  applyTranslations("en");
}


document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.scroll);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
    if (navLinks) navLinks.classList.remove("open");
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}

addMessage("ai", "AI assistant", "Selam! Ask me about crops, livestock, or market.");

const init = async () => {
  updateOfflineQueueHint();
  await loadGuidesData();
  await loadMarketData();
  if (!languageSelect) {
    renderGuides();
  }
  renderMarket();
  renderExperts();
  await loadDashboardStats();
  await flushQueuedQuestions();
};

init();

window.addEventListener("online", () => {
  flushQueuedQuestions();
});
