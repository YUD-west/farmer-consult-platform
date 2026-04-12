const crypto = require("crypto");
const { getPool } = require("../db/pool");

function makeKey(parts) {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

async function getCachedAnswer(cacheKey) {
  const { rows } = await getPool().query(
    "SELECT response FROM ai_response_cache WHERE cache_key = $1 AND created_at > NOW() - INTERVAL '7 days'",
    [cacheKey]
  );
  return rows[0]?.response || null;
}

async function setCachedAnswer(cacheKey, response, model) {
  await getPool().query(
    `INSERT INTO ai_response_cache (cache_key, response, model) VALUES ($1, $2, $3)
     ON CONFLICT (cache_key) DO UPDATE SET response = EXCLUDED.response, model = EXCLUDED.model, created_at = NOW()`,
    [cacheKey, response, model || "cache"]
  );
}

module.exports = { makeKey, getCachedAnswer, setCachedAnswer };
