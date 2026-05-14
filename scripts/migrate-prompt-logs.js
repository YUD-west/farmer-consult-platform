#!/usr/bin/env node
require("dotenv").config();
const { getPool } = require("../src/db/pool");

async function main() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_prompt_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      prompt_version VARCHAR(16) NOT NULL DEFAULT 'v2.2',
      event_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      region VARCHAR(100),
      season VARCHAR(32),
      source VARCHAR(64),
      used_openai BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_prompt_logs_event_ts
    ON ai_prompt_logs (event_ts DESC);
  `);
  console.log("Prompt logs migration applied.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
