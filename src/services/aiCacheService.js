const crypto = require("crypto");
const { getPool } = require("../db/pool");
const { isDbUnavailableError } = require("../lib/dbError");

const memoryCache = new Map();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function makeKey(parts) {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

function readMemoryCache(cacheKey) {
  const entry = memoryCache.get(cacheKey);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    memoryCache.delete(cacheKey);
    return null;
  }
  return entry.response;
}

function writeMemoryCache(cacheKey, response, model) {
  memoryCache.set(cacheKey, {
    response,
    model: model || "cache",
    createdAt: Date.now(),
  });
}

async function getCachedAnswer(cacheKey) {
  try {
    const { rows } = await getPool().query(
      "SELECT response FROM ai_response_cache WHERE cache_key = $1 AND created_at > NOW() - INTERVAL '7 days'",
      [cacheKey]
    );
    if (rows[0]?.response) {
      writeMemoryCache(cacheKey, rows[0].response, rows[0].model);
      return rows[0].response;
    }
  } catch (error) {
    if (!isDbUnavailableError(error)) {
      throw error;
    }
  }

  return readMemoryCache(cacheKey);
}

async function setCachedAnswer(cacheKey, response, model) {
  writeMemoryCache(cacheKey, response, model || "cache");

  try {
    await getPool().query(
      `INSERT INTO ai_response_cache (cache_key, response, model) VALUES ($1, $2, $3)
       ON CONFLICT (cache_key) DO UPDATE SET response = EXCLUDED.response, model = EXCLUDED.model, created_at = NOW()`,
      [cacheKey, response, model || "cache"]
    );
  } catch (error) {
    if (!isDbUnavailableError(error)) {
      throw error;
    }
  }
}

module.exports = { makeKey, getCachedAnswer, setCachedAnswer };
