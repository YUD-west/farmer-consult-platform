#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const mustHave = [
  "server.js",
  "src/expressApp.js",
  "api/index.js",
  "vercel.json",
  "render.yaml",
  "js/api-config.js",
  "js/yegna-api.js",
];
const errors = [];
const warnings = [];

for (const rel of mustHave) {
  const abs = path.join(process.cwd(), rel);
  if (!fs.existsSync(abs)) errors.push(`Missing required file: ${rel}`);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  warnings.push("JWT_SECRET is missing or too short (min 16 chars). Set it on Render/Vercel before production.");
}

if (!process.env.DATABASE_URL) {
  warnings.push("DATABASE_URL is not set. DB connection check skipped.");
}

async function checkDbIfPossible() {
  if (!process.env.DATABASE_URL) return;
  try {
    const { getPool } = require(path.join(process.cwd(), "src", "db", "pool"));
    const pool = getPool();
    await pool.query("SELECT 1");
  } catch (error) {
    errors.push(`Database connectivity check failed: ${error.message}`);
  }
}

async function main() {
  await checkDbIfPossible();

  const strict = process.env.STRICT_PREFLIGHT === "1";
  if (strict) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      errors.push("STRICT_PREFLIGHT=1: JWT_SECRET is required (min 16 chars).");
    }
    if (!process.env.DATABASE_URL) {
      errors.push("STRICT_PREFLIGHT=1: DATABASE_URL is required.");
    }
  }

  if (warnings.length) {
    warnings.forEach((w) => console.warn(`WARN: ${w}`));
  }

  if (errors.length) {
    errors.forEach((e) => console.error(`ERROR: ${e}`));
    process.exit(1);
  }

  console.log("Preflight passed.");
}

main().catch((error) => {
  console.error("ERROR: Preflight crashed.", error);
  process.exit(1);
});
