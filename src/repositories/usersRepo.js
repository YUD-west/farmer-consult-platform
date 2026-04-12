const { getPool } = require("../db/pool");

async function findByEmail(email) {
  const { rows } = await getPool().query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await getPool().query(
    "SELECT id, email, phone, full_name, role, region, verified_expert, created_at FROM users WHERE id = $1",
    [id]
  );
  return rows[0] || null;
}

async function createUser({ email, phone, passwordHash, fullName, role, region }) {
  const { rows } = await getPool().query(
    `INSERT INTO users (email, phone, password_hash, full_name, role, region)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, phone, full_name, role, region, verified_expert, created_at`,
    [email.toLowerCase(), phone || null, passwordHash, fullName, role || "farmer", region || null]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, createUser };
