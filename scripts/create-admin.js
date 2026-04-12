/**
 * Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="Admin" node scripts/create-admin.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { getPool } = require("../src/db/pool");

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME || "Admin";
  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.");
    process.exit(1);
  }
  const pool = getPool();
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, verified_expert)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [email.toLowerCase(), hash, fullName]
  );
  console.log("Admin user ready:", email.toLowerCase());
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
