const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const guidesSeed = require("../../data/guides.json");
const marketSeed = require("../../data/market-products.json");
const questionsSeed = require("../../data/questions.json");
const expertsSeed = require("../../data/experts.json");

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("password123", 10);
const MINUTE_MS = 60_000;

const GUIDE_KEYWORD_ROUTES = [
  { keyword: "pre-planting", guide_slug: "prePlantingPreparation" },
  { keyword: "preplanting", guide_slug: "prePlantingPreparation" },
  { keyword: "crop maintenance", guide_slug: "cropMaintenance" },
  { keyword: "problem solving", guide_slug: "troubleshooting" },
  { keyword: "soil conservation", guide_slug: "agroforestrySoilConservation" },
  { keyword: "record keeping", guide_slug: "farmFinanceRecordKeeping" },
  { keyword: "planting", guide_slug: "plantingSowing" },
  { keyword: "sowing", guide_slug: "plantingSowing" },
  { keyword: "maintenance", guide_slug: "cropMaintenance" },
  { keyword: "harvesting", guide_slug: "harvesting" },
  { keyword: "harvest", guide_slug: "harvesting" },
  { keyword: "marketing", guide_slug: "marketingSelling" },
  { keyword: "selling", guide_slug: "marketingSelling" },
  { keyword: "troubleshooting", guide_slug: "troubleshooting" },
  { keyword: "cattle", guide_slug: "cattleBreedingSafety" },
  { keyword: "breeding", guide_slug: "cattleBreedingSafety" },
  { keyword: "agroforestry", guide_slug: "agroforestrySoilConservation" },
  { keyword: "irrigation", guide_slug: "waterIrrigationManagement" },
  { keyword: "water", guide_slug: "waterIrrigationManagement" },
  { keyword: "climate", guide_slug: "climateWeatherAwareness" },
  { keyword: "weather", guide_slug: "climateWeatherAwareness" },
  { keyword: "finance", guide_slug: "farmFinanceRecordKeeping" },
].sort((a, b) => b.keyword.length - a.keyword.length);

const clone = (value) => JSON.parse(JSON.stringify(value));
const nowIso = (offsetMinutes = 0) =>
  new Date(Date.now() - offsetMinutes * MINUTE_MS).toISOString();

function createSeedUsers() {
  const timestamp = nowIso();
  const users = [
    {
      id: "demo-admin",
      email: "admin@yegnafarm.local",
      phone: null,
      password_hash: DEFAULT_PASSWORD_HASH,
      full_name: "Demo Admin",
      role: "admin",
      region: "Oromia",
      verified_expert: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: "demo-farmer",
      email: "farmer@yegnafarm.local",
      phone: null,
      password_hash: DEFAULT_PASSWORD_HASH,
      full_name: "Demo Farmer",
      role: "farmer",
      region: "Oromia",
      verified_expert: false,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ];

  expertsSeed.forEach((expert, index) => {
    const createdAt = nowIso(index + 1);
    users.push({
      id: `expert-${index + 1}`,
      email: String(expert.contact || "").toLowerCase(),
      phone: null,
      password_hash: DEFAULT_PASSWORD_HASH,
      full_name: expert.name,
      role: "expert",
      region: null,
      verified_expert: true,
      created_at: createdAt,
      updated_at: createdAt,
    });
  });

  return users;
}

function createSeedQuestions() {
  return questionsSeed.map((question, index) => ({
    id: question.id || crypto.randomUUID(),
    farmer_id: null,
    guest_name: question.name || "Farmer",
    body: question.question,
    crop_hint: null,
    status: "pending",
    assigned_expert_id: null,
    created_at: question.createdAt || nowIso(index + 5),
    answered_at: null,
  }));
}

function createSeedMarketProducts() {
  return marketSeed.map((product, index) => {
    const timestamp = nowIso(index + 1);
    return {
      id: crypto.randomUUID(),
      seller_id: null,
      name: product.name,
      price: Number(product.price),
      unit: product.unit || "ETB",
      location: product.location,
      region: product.region || product.location,
      type: product.type || "crops",
      image_url: product.image || product.image_url || null,
      phone: null,
      whatsapp: null,
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
    };
  });
}

const state = {
  users: createSeedUsers(),
  questions: createSeedQuestions(),
  answers: [],
  ratings: [],
  marketProducts: createSeedMarketProducts(),
};

function getGuideBundle() {
  return clone({
    families: guidesSeed.families || [],
    questions: guidesSeed.questions || [],
    details: guidesSeed.details || {},
  });
}

function getGuideRoutes() {
  return clone(GUIDE_KEYWORD_ROUTES);
}

function getGuideDetail(slug) {
  const detail = (guidesSeed.details || {})[slug];
  return detail ? clone({ title: detail.title, steps: detail.steps || [] }) : null;
}

function findUserByEmail(email) {
  const needle = String(email || "").toLowerCase();
  const user = state.users.find((row) => row.email === needle);
  return user ? clone(user) : null;
}

function findUserById(id) {
  const needle = String(id);
  const user = state.users.find((row) => String(row.id) === needle);
  return user ? clone(user) : null;
}

function createUser({ email, phone, passwordHash, fullName, role, region }) {
  const timestamp = nowIso();
  const user = {
    id: crypto.randomUUID(),
    email: String(email || "").toLowerCase(),
    phone: phone || null,
    password_hash: passwordHash,
    full_name: fullName,
    role: role || "farmer",
    region: region || null,
    verified_expert: role === "expert" || role === "admin",
    created_at: timestamp,
    updated_at: timestamp,
  };
  state.users.push(user);
  return clone(user);
}

function mapQuestionRow(question) {
  const farmer = question.farmer_id
    ? state.users.find((user) => String(user.id) === String(question.farmer_id))
    : null;
  return {
    ...clone(question),
    farmer_name: farmer?.full_name || question.guest_name || null,
    farmer_email: farmer?.email || null,
  };
}

function listQuestions({ status, limit = 100 }) {
  const lim = Math.min(Number(limit) || 100, 500);
  let rows = [...state.questions];
  if (status) {
    rows = rows.filter((question) => question.status === status);
  }
  return rows
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, lim)
    .map(mapQuestionRow);
}

function getQuestionById(id) {
  const question = state.questions.find((row) => String(row.id) === String(id));
  return question ? clone(question) : null;
}

function createQuestion({ farmerId, guestName, body, cropHint }) {
  const timestamp = nowIso();
  const question = {
    id: crypto.randomUUID(),
    farmer_id: farmerId || null,
    guest_name: guestName || null,
    body,
    crop_hint: cropHint || null,
    status: "pending",
    assigned_expert_id: null,
    created_at: timestamp,
    answered_at: null,
  };
  state.questions.push(question);
  return clone({
    id: question.id,
    farmer_id: question.farmer_id,
    guest_name: question.guest_name,
    body: question.body,
    crop_hint: question.crop_hint,
    status: question.status,
    created_at: question.created_at,
  });
}

function addAnswer({ questionId, expertId, body }) {
  const question = state.questions.find((row) => String(row.id) === String(questionId));
  if (!question) {
    return { error: "not_found" };
  }
  if (question.status === "answered") {
    return { error: "already_answered" };
  }

  const answer = {
    id: crypto.randomUUID(),
    question_id: question.id,
    expert_id: expertId,
    body,
    created_at: nowIso(),
  };
  state.answers.push(answer);
  question.status = "answered";
  question.answered_at = nowIso();
  question.assigned_expert_id = expertId;
  return { answer: clone(answer) };
}

function addRating({ answerId, userId, stars }) {
  const answer = state.answers.find((row) => String(row.id) === String(answerId));
  if (!answer) {
    const error = new Error("Answer not found.");
    error.status = 404;
    throw error;
  }

  const existing = state.ratings.find(
    (row) => String(row.answer_id) === String(answerId) && String(row.user_id) === String(userId)
  );
  if (existing) {
    existing.stars = stars;
    existing.created_at = nowIso();
    return clone(existing);
  }

  const rating = {
    id: crypto.randomUUID(),
    answer_id: answerId,
    user_id: userId,
    stars,
    created_at: nowIso(),
  };
  state.ratings.push(rating);
  return clone(rating);
}

function getAnswersForQuestion(questionId) {
  return state.answers
    .filter((row) => String(row.question_id) === String(questionId))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((row) => {
      const expert = state.users.find((user) => String(user.id) === String(row.expert_id));
      return {
        ...clone(row),
        expert_name: expert?.full_name || null,
        verified_expert: Boolean(expert?.verified_expert),
      };
    });
}

function dashboardCounts() {
  const today = new Date().toISOString().slice(0, 10);
  const pendingQuestions = state.questions.filter((question) => question.status === "pending").length;
  const answeredToday = state.questions.filter(
    (question) => question.status === "answered" && String(question.answered_at || "").slice(0, 10) === today
  ).length;
  const activeExperts = state.users.filter((user) => user.role === "expert").length;
  const totalQuestions = state.questions.length;
  return { pendingQuestions, answeredToday, activeExperts, totalQuestions };
}

function analyticsOverview() {
  const sample = [...state.questions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map((question) => ({
      body: question.body,
      created_at: question.created_at,
    }));

  return { recentQuestions: state.questions.length, sample };
}

function listMarketProducts({ region, type, q, limit = 100 }) {
  const lim = Math.min(Number(limit) || 100, 200);
  const regionNeedle = String(region || "").toLowerCase();
  const typeNeedle = String(type || "").toLowerCase();
  const queryNeedle = String(q || "").toLowerCase();

  return state.marketProducts
    .filter((product) => product.active !== false)
    .filter((product) => {
      if (!regionNeedle) return true;
      return (
        String(product.region || "").toLowerCase().includes(regionNeedle) ||
        String(product.location || "").toLowerCase().includes(regionNeedle)
      );
    })
    .filter((product) => {
      if (!typeNeedle || typeNeedle === "all") return true;
      return String(product.type || "").toLowerCase() === typeNeedle;
    })
    .filter((product) => {
      if (!queryNeedle) return true;
      return String(product.name || "").toLowerCase().includes(queryNeedle);
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, lim)
    .map((product) => clone(product));
}

function createMarketProduct(data) {
  const timestamp = nowIso();
  const product = {
    id: crypto.randomUUID(),
    seller_id: data.sellerId || null,
    name: data.name,
    price: data.price,
    unit: data.unit || "ETB",
    location: data.location,
    region: data.region || data.location,
    type: data.type || "crops",
    image_url: data.imageUrl || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
  state.marketProducts.push(product);
  return clone(product);
}

function getMarketProduct(id) {
  const product = state.marketProducts.find(
    (row) => String(row.id) === String(id) && row.active !== false
  );
  return product ? clone(product) : null;
}

function updateMarketProduct(id, patch, { sellerId, isAdmin }) {
  const product = state.marketProducts.find((row) => String(row.id) === String(id));
  if (!product) {
    return null;
  }
  if (!isAdmin && String(product.seller_id || "") !== String(sellerId || "")) {
    return null;
  }

  const allowed = [
    "name",
    "price",
    "unit",
    "location",
    "region",
    "type",
    "image_url",
    "phone",
    "whatsapp",
    "active",
  ];
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      product[key] = patch[key];
    }
  }
  product.updated_at = nowIso();
  return clone(product);
}

module.exports = {
  getGuideBundle,
  getGuideRoutes,
  getGuideDetail,
  findUserByEmail,
  findUserById,
  createUser,
  listQuestions,
  getQuestionById,
  createQuestion,
  addAnswer,
  addRating,
  getAnswersForQuestion,
  dashboardCounts,
  analyticsOverview,
  listMarketProducts,
  createMarketProduct,
  getMarketProduct,
  updateMarketProduct,
};
