/**
 * Applies src/db/schema.sql (idempotent-safe only if you drop DB first).
 * For upgrades later, switch to numbered migrations.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getPool } = require("../src/db/pool");

async function main() {
  const pool = getPool();
  const sqlPath = path.join(__dirname, "..", "src", "db", "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);
  console.log("Migration applied.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
