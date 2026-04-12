const { Pool } = require("pg");
const { parse } = require("pg-connection-string");

let pool;

function isLocalPostgres(url) {
  try {
    const cfg = parse(url);
    const host = (cfg.host || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and set a Postgres URL (cloud or local — see README)."
    );
  }
  if (!pool) {
    const conn = process.env.DATABASE_URL;
    const forceSsl = process.env.DATABASE_SSL === "true";
    const forceNoSsl = process.env.DATABASE_SSL === "false";
    const remote = !isLocalPostgres(conn);
    let ssl;
    if (forceNoSsl) ssl = false;
    else if (forceSsl || remote) ssl = { rejectUnauthorized: false };

    pool = new Pool({
      connectionString: conn,
      max: 20,
      idleTimeoutMillis: 30_000,
      ...(ssl !== undefined ? { ssl } : {}),
    });
  }
  return pool;
}

module.exports = { getPool };
