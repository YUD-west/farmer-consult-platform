const { getPool } = require("../db/pool");
const { isDbUnavailableError } = require("../lib/dbError");
const {
  findUserByEmail: findFallbackUserByEmail,
  findUserById: findFallbackUserById,
  createUser: createFallbackUser,
} = require("../lib/fallbackStore");

async function findByEmail(email) {
  try {
    const { rows } = await getPool().query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (rows[0]) {
      return rows[0];
    }
    return findFallbackUserByEmail(email);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return findFallbackUserByEmail(email);
    }
    throw error;
  }
}

async function findById(id) {
  try {
    const { rows } = await getPool().query(
      "SELECT id, email, phone, full_name, role, region, verified_expert, created_at FROM users WHERE id = $1",
      [id]
    );
    if (rows[0]) {
      return rows[0];
    }
    return findFallbackUserById(id);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return findFallbackUserById(id);
    }
    throw error;
  }
}

async function createUser({ email, phone, passwordHash, fullName, role, region }) {
  try {
    const { rows } = await getPool().query(
      `INSERT INTO users (email, phone, password_hash, full_name, role, region)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, phone, full_name, role, region, verified_expert, created_at`,
      [email.toLowerCase(), phone || null, passwordHash, fullName, role || "farmer", region || null]
    );
    return rows[0];
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return createFallbackUser({
        email,
        phone,
        passwordHash,
        fullName,
        role,
        region,
      });
    }
    throw error;
  }
}

module.exports = { findByEmail, findById, createUser };
