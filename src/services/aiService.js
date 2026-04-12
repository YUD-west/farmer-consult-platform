const guidesRepo = require("../repositories/guidesRepo");
const { matchGuideContent } = require("./guideMatcher");
const { makeKey, getCachedAnswer, setCachedAnswer } = require("./aiCacheService");

function buildSystemPrompt(region, language) {
  const loc = region || "Ethiopia (general)";
  const lang = language === "am" ? "Amharic where natural, else English" : language === "om" ? "Afaan Oromo where natural, else English" : "English";
  return `You are YegnaFarm AI, a farmer-friendly agriculture advisor focused on ${loc}.
Respond in ${lang}. Keep answers short, practical, and stepwise with bullet points when helpful.
If unsure, suggest local extension services and safe general practices.`;
}

function buildUserPrompt(question, guideExcerpt) {
  if (!guideExcerpt) return question;
  return `Farmer question:\n${question}\n\nRelevant official guide excerpt (use if helpful, do not contradict):\n${guideExcerpt.slice(0, 6000)}`;
}

async function runOpenAIChat(systemPrompt, userPrompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.35,
    }),
  });
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  return reply || null;
}

const FALLBACK =
  "I can’t find that in the guide, but here’s general advice: check soil moisture, inspect crops weekly, and ask your local extension office if the issue persists.";

/**
 * Hybrid: keyword/guide DB first, then cache, then OpenAI with guide context.
 */
async function chat({ question, region, language }) {
  const trimmed = (question || "").trim();
  if (!trimmed) {
    const err = new Error("Question is required.");
    err.status = 400;
    throw err;
  }

  const [bundle, routes] = await Promise.all([guidesRepo.getBundle(), guidesRepo.getKeywordRoutes()]);
  const local = matchGuideContent(trimmed, bundle, routes);
  if (local) {
    return {
      answer: local.answer,
      source: local.source,
      usedOpenAI: false,
    };
  }

  const excerpt = ""; // could attach top guide by embedding later
  const cacheKey = makeKey([
    trimmed.toLowerCase().slice(0, 500),
    region || "",
    language || "en",
    "v1",
  ]);
  const cached = await getCachedAnswer(cacheKey);
  if (cached) {
    return { answer: cached, source: "cache", usedOpenAI: false };
  }

  const systemPrompt = buildSystemPrompt(region, language);
  const userPrompt = buildUserPrompt(trimmed, excerpt);

  const ai = await runOpenAIChat(systemPrompt, userPrompt);
  if (ai) {
    await setCachedAnswer(cacheKey, ai, process.env.OPENAI_MODEL || "gpt-4o-mini");
    return { answer: ai, source: "openai", usedOpenAI: true };
  }

  return { answer: FALLBACK, source: "fallback", usedOpenAI: false };
}

module.exports = { chat, buildSystemPrompt };
