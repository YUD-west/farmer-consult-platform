const { getPool } = require("../db/pool");

async function savePromptLog(logEntry) {
  const {
    query,
    response,
    promptVersion = "v2.1",
    timestamp = new Date(),
    region = null,
    season = null,
    source = null,
    usedOpenAI = false,
  } = logEntry || {};

  const { rows } = await getPool().query(
    `INSERT INTO ai_prompt_logs
      (query, response, prompt_version, event_ts, region, season, source, used_openai)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, prompt_version, event_ts`,
    [query || "", response || "", promptVersion, timestamp, region, season, source, Boolean(usedOpenAI)]
  );
  return rows[0];
}

module.exports = { savePromptLog };
