const aiService = require("../services/aiService");
const { recommend } = require("../services/recommendationsService");

async function chat(req, res, next) {
  try {
    const { question, region, language, agroEcology } = req.body;
    const result = await aiService.chat({
      question,
      region: region || req.user?.region,
      language: language || "en",
      agroEcology: agroEcology || req.user?.agroEcology,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function recommendations(req, res, next) {
  try {
    const { crop, season } = req.query;
    res.json(recommend({ crop, season }));
  } catch (e) {
    next(e);
  }
}

const ONBOARDING_STEPS = [
  { id: 1, title: "Choose your language", hint: "Use the header language switcher." },
  { id: 2, title: "Set your region", hint: "Add region in your profile (coming soon) for better AI context." },
  { id: 3, title: "Ask the AI", hint: "Open Ask / Chat and describe your crop and problem." },
  { id: 4, title: "Browse guides offline", hint: "Install the app (PWA) for cached guides when signal is weak." },
];

function onboarding(req, res) {
  res.json({ steps: ONBOARDING_STEPS });
}

module.exports = { chat, recommendations, onboarding };
