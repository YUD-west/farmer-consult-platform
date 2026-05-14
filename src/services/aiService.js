const guidesRepo = require("../repositories/guidesRepo");
const { matchGuideContent } = require("./guideMatcher");
const { makeKey, getCachedAnswer, setCachedAnswer } = require("./aiCacheService");
const { savePromptLog } = require("../repositories/promptLogsRepo");
const { evalSet } = require("../config/evalSet");
const { YEGNAFARM_PROMPT_V22 } = require("../config/prompts/v2.2");

const PROMPT_VERSION = "v2.2";

function buildSystemPrompt(region, language) {
  const loc = region || "Ethiopia (general)";
  const lang = language === "am" ? "Amharic where natural, else English" : language === "om" ? "Afaan Oromo where natural, else English" : "English";
  return `You are YegnaFarm AI, a farmer-friendly agriculture advisor focused on ${loc}.
Respond in ${lang}. Keep answers short, practical, and stepwise with bullet points when helpful.
If unsure, suggest local extension services and safe general practices.`;
}

function getSeasonByMonth(month) {
  if (["February", "March", "April", "May"].includes(month)) return "Belg";
  if (["June", "July", "August", "September"].includes(month)) return "Meher";
  return "Dry season";
}

function buildUserContext(region, agroEcology) {
  const currentMonth = new Date().toLocaleString("en-US", { month: "long", timeZone: "Africa/Addis_Ababa" });
  const season = getSeasonByMonth(currentMonth);
  return {
    currentMonth,
    season,
  };
}

async function runOpenAICompatibleChat({ apiKey, baseUrl, model, systemPrompt, userPrompt }) {
  if (!apiKey) return null;
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.35,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `OpenAI request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  const reply = data?.choices?.[0]?.message?.content;
  return reply || null;
}

async function runClaudeChat({ systemPrompt, userPrompt }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.35,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Anthropic request failed with status ${res.status}`);
  }
  return data?.content?.[0]?.text || null;
}

async function runGeminiChat({ systemPrompt, userPrompt }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: { temperature: 0.35 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini request failed with status ${res.status}`);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function runAIProviders(systemPrompt, userPrompt) {
  const order = (process.env.PREFERRED_AI_PROVIDERS || "openai,claude,gemini,grok,deepseek")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const provider of order) {
    try {
      if (provider === "openai") {
        const reply = await runOpenAICompatibleChat({
          apiKey: process.env.OPENAI_API_KEY,
          baseUrl: "https://api.openai.com/v1/chat/completions",
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          systemPrompt,
          userPrompt,
        });
        if (reply) return { reply, provider, model: process.env.OPENAI_MODEL || "gpt-4o-mini" };
      }
      if (provider === "grok") {
        const reply = await runOpenAICompatibleChat({
          apiKey: process.env.GROK_API_KEY,
          baseUrl: "https://api.x.ai/v1/chat/completions",
          model: process.env.GROK_MODEL || "grok-2-latest",
          systemPrompt,
          userPrompt,
        });
        if (reply) return { reply, provider, model: process.env.GROK_MODEL || "grok-2-latest" };
      }
      if (provider === "deepseek") {
        const reply = await runOpenAICompatibleChat({
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseUrl: "https://api.deepseek.com/chat/completions",
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          systemPrompt,
          userPrompt,
        });
        if (reply) return { reply, provider, model: process.env.DEEPSEEK_MODEL || "deepseek-chat" };
      }
      if (provider === "claude") {
        const reply = await runClaudeChat({ systemPrompt, userPrompt });
        if (reply) return { reply, provider, model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest" };
      }
      if (provider === "gemini") {
        const reply = await runGeminiChat({ systemPrompt, userPrompt });
        if (reply) return { reply, provider, model: process.env.GEMINI_MODEL || "gemini-1.5-flash" };
      }
    } catch (error) {
      // try the next provider
    }
  }
  return null;
}

const FALLBACK =
  "I can’t find that in the guide, but here’s general advice: check soil moisture, inspect crops weekly, and ask your local extension office if the issue persists.";

function needsSafetyWarning(text) {
  const hay = String(text || "").toLowerCase();
  return ["chemical", "chemicals", "pesticide", "pesticides", "fertilizer", "fertilizers"].some((word) =>
    hay.includes(word)
  );
}

function toStructuredResponse(answer, question) {
  const guidance = String(answer || "").trim();
  const query = String(question || "").trim();
  const lines = [
    "- Immediate Action: Check soil moisture and inspect the field/livestock today. Focus first on visible stress, pest signs, and water status.",
    "- Next 7 Days Plan: Monitor daily, apply only needed inputs, and keep notes on changes to decide the next action safely.",
  ];

  if (guidance) {
    lines.push(`- Local Guidance: ${guidance}`);
  }
  if (query) {
    lines.push(`- Context Used: Based on your question: "${query.slice(0, 180)}${query.length > 180 ? "..." : ""}"`);
  }
  if (needsSafetyWarning(`${guidance} ${query}`)) {
    lines.push("- Safety Warning: Use protective gear, follow label rates exactly, and keep chemicals away from children, animals, and water sources.");
  }
  lines.push("- Next Step: If symptoms worsen, contact your local extension office with crop/livestock type, location, and recent weather details.");
  return lines.slice(0, 6).join("\n");
}

function searchGuidesByKeywords(userQuery, bundle, routes) {
  return matchGuideContent(userQuery, bundle, routes);
}

function formatGuideResponse(guideMatch, userQuery) {
  if (!guideMatch) return null;
  return appendCitation(
    toStructuredResponse(guideMatch.answer, userQuery),
    guideMatch.source || "Guide Match - Local Guidance"
  );
}

function formatCitationSource(source) {
  if (source && typeof source === "object") {
    const title = String(source.title || "").trim();
    const section = String(source.section || "").trim();
    if (title && section) return `${title} - ${section}`;
    if (title) return `${title} - General`;
    if (section) return `YegnaFarm Guide - ${section}`;
  }
  if (typeof source === "string" && source.trim()) {
    return source.trim();
  }
  return "YegnaFarm Context - General Guidance";
}

function appendCitation(answer, sourceLabel) {
  const text = String(answer || "").trim();
  const source = formatCitationSource(sourceLabel);
  if (!text) return `Source: [${source}]`;
  if (/^Source:\s*\[.+\]$/m.test(text)) return text;
  return `${text}\nSource: [${source}]`;
}

function validateResponse(response) {
  const text = String(response || "").trim();
  const bullets = (text.match(/^\s*[-*•]\s+/gm) || []).length;
  const hasImmediateAction = /Immediate Action/i.test(text);
  const hasNext7DaysPlan = /Next 7 Days Plan/i.test(text);
  const hasCitation = /^Source:\s*\[[^\]]+\]\s*$/m.test(text);
  const mentionsChemicals = /(pesticide|pesticides|herbicide|herbicides|fertilizer|fertilizers|chemical|chemicals)/i.test(
    text
  );
  const hasSafetyWarning = /Safety Warning/i.test(text);
  return {
    isValid: bullets <= 6 && hasImmediateAction && hasNext7DaysPlan && hasCitation && (!mentionsChemicals || hasSafetyWarning),
  };
}

function ensureValidResponse(response, { question, citationSource }) {
  const withCitation = appendCitation(response, citationSource);
  const firstPass = validateResponse(withCitation);
  if (firstPass.isValid) return withCitation;
  const reformatted = appendCitation(toStructuredResponse(withCitation, question), citationSource);
  const secondPass = validateResponse(reformatted);
  if (secondPass.isValid) return reformatted;
  return appendCitation(
    `- Immediate Action: Check local agricultural office for guidance.
- Next 7 Days Plan: Monitor crop condition and weather changes.
- Tip: Try rephrasing your question for better help.`,
    "YegnaFarm General Advisory"
  );
}

/**
 * Hybrid: keyword/guide DB first, then cache, then multi-provider AI with guide context.
 */
async function chat({ question, region, language, agroEcology }) {
  const trimmed = (question || "").trim();
  if (!trimmed) {
    const err = new Error("Question is required.");
    err.status = 400;
    throw err;
  }

  const [bundle, routes] = await Promise.all([guidesRepo.getBundle(), guidesRepo.getKeywordRoutes()]);
  const local = matchGuideContent(trimmed, bundle, routes);

  const excerpt = `
YegnaFarm is a digital agricultural platform designed to connect farmers, buyers, and agricultural service providers across Ethiopia. The platform enables users to:

- Discover and trade farm products (crops, livestock, and organic goods)
- Access verified market prices and demand trends
- Connect directly with buyers without intermediaries
- Get agricultural guidance, best practices, and seasonal farming tips
- Promote sustainable and efficient farming methods

Target users include smallholder farmers, cooperatives, agri-businesses, and consumers looking for fresh, local farm products.

Key principles:
- Simplicity: Keep explanations clear and easy to understand
- Practicality: Focus on actionable advice, not theory
- Local relevance: Consider Ethiopian farming conditions, seasons, and challenges
- Trust: Avoid speculation; provide reliable and realistic guidance

When responding:
- Tailor answers specifically to agriculture, farming, or marketplace interactions
- Use examples relevant to Ethiopian farmers when possible
- Avoid generic AI responses; make outputs feel like a knowledgeable local advisor
- If the query is unclear, make reasonable assumptions but stay within the YegnaFarm context
`;
  const context = buildUserContext(region, agroEcology);
  const guideContext = local
    ? {
        title: "YegnaFarm Guide",
        section: String(local.source || "Matched Guidance"),
        content: String(local.answer || excerpt).slice(0, 6000),
      }
    : {
        title: "YegnaFarm Platform Guide",
        section: "Core Context",
        content: excerpt,
      };
  const cacheKey = makeKey([
    trimmed.toLowerCase().slice(0, 500),
    region || "",
    agroEcology || "",
    language || "en",
    context.season,
    context.currentMonth,
    PROMPT_VERSION,
  ]);
  const cached = await getCachedAnswer(cacheKey);
  if (cached) {
    const answer = ensureValidResponse(cached, {
      question: trimmed,
      citationSource: local?.source || "YegnaFarm Context - Cached Guidance",
    });
    void savePromptLog({
      query: trimmed,
      response: answer,
      promptVersion: PROMPT_VERSION,
      timestamp: new Date(),
      region: region || null,
      season: context.season,
        source: local?.source || "cache",
      usedOpenAI: false,
    }).catch(() => {});
    return {
      answer,
      source: local?.source || "cache",
      usedOpenAI: false,
    };
  }

  const systemPrompt = buildSystemPrompt(region, language);
  const userPrompt = YEGNAFARM_PROMPT_V22({
    userQuery: trimmed,
    user: { region: region || "Unknown", agroEcology: agroEcology || "Unknown" },
    season: context.season,
    currentMonth: context.currentMonth,
    guideContext,
  });

  try {
    const ai = await runAIProviders(systemPrompt, userPrompt);
    if (ai?.reply) {
      const aiWithCitation = ensureValidResponse(ai.reply, {
        question: trimmed,
        citationSource: "YegnaFarm Platform Guide - Core Context",
      });
      await setCachedAnswer(cacheKey, aiWithCitation, ai.model || "multi-provider");
      void savePromptLog({
        query: trimmed,
        response: aiWithCitation,
        promptVersion: PROMPT_VERSION,
        timestamp: new Date(),
        region: region || null,
        season: context.season,
        source: ai.provider || "ai",
        usedOpenAI: true,
      }).catch(() => {});
      return { answer: aiWithCitation, source: ai.provider || "ai", usedOpenAI: true };
    }
  } catch (error) {
    const guideMatch = local || searchGuidesByKeywords(trimmed, bundle, routes);
    if (guideMatch) {
      const answer = ensureValidResponse(formatGuideResponse(guideMatch, trimmed), {
        question: trimmed,
        citationSource: guideMatch.source || "Guide Match - Local Guidance",
      });
      void savePromptLog({
        query: trimmed,
        response: answer,
        promptVersion: PROMPT_VERSION,
        timestamp: new Date(),
        region: region || null,
        season: context.season,
        source: guideMatch.source || "guide-fallback",
        usedOpenAI: false,
      }).catch(() => {});
      return {
        answer,
        source: guideMatch.source || "guide-fallback",
        usedOpenAI: false,
      };
    }

    const advisory = `- Immediate Action: Check local agricultural office for guidance.
- Next 7 Days: Monitor crop condition and weather changes.
- Tip: Try rephrasing your question for better help.`;
    const answer = ensureValidResponse(advisory, {
      question: trimmed,
      citationSource: "YegnaFarm General Advisory",
    });
    void savePromptLog({
      query: trimmed,
      response: answer,
      promptVersion: PROMPT_VERSION,
      timestamp: new Date(),
      region: region || null,
      season: context.season,
      source: "fallback",
      usedOpenAI: false,
    }).catch(() => {});
    return {
      answer,
      source: "fallback",
      usedOpenAI: false,
    };
  }

  const fallbackAnswer = ensureValidResponse(toStructuredResponse(FALLBACK, trimmed), {
    question: trimmed,
    citationSource: "YegnaFarm Platform Guide - Core Context",
  });
  void savePromptLog({
    query: trimmed,
    response: fallbackAnswer,
    promptVersion: PROMPT_VERSION,
    timestamp: new Date(),
    region: region || null,
    season: context.season,
    source: "fallback",
    usedOpenAI: false,
  }).catch(() => {});
  return {
    answer: fallbackAnswer,
    source: "fallback",
    usedOpenAI: false,
  };
}

module.exports = { chat, evalSet };
