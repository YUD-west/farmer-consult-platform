const { getPool } = require("../db/pool");
const { isDbUnavailableError } = require("../lib/dbError");
const {
  listMarketProducts: listFallbackProducts,
  createMarketProduct: createFallbackProduct,
  getMarketProduct: getFallbackProduct,
  updateMarketProduct: updateFallbackProduct,
} = require("../lib/fallbackStore");

async function listProducts({ region, type, q, limit = 100 }) {
  try {
    const pool = getPool();
    const params = [];
    const cond = ["active = TRUE"];
    if (region) {
      params.push(`%${region}%`);
      cond.push(`(region ILIKE $${params.length} OR location ILIKE $${params.length})`);
    }
    if (type && type !== "all") {
      params.push(type);
      cond.push(`type = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      cond.push(`(name ILIKE $${params.length})`);
    }
    params.push(Math.min(limit, 200));
    const lim = `$${params.length}`;
    const where = cond.length ? `WHERE ${cond.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT id, seller_id, name, price, unit, location, region, type, image_url, phone, whatsapp, created_at
       FROM market_products ${where}
       ORDER BY created_at DESC
       LIMIT ${lim}`,
      params
    );
    return rows.length ? rows : listFallbackProducts({ region, type, q, limit });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return listFallbackProducts({ region, type, q, limit });
    }
    throw error;
  }
}

async function createProduct(data) {
  try {
    const { rows } = await getPool().query(
      `INSERT INTO market_products
       (seller_id, name, price, unit, location, region, type, image_url, phone, whatsapp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.sellerId,
        data.name,
        data.price,
        data.unit || "ETB",
        data.location,
        data.region || data.location,
        data.type || "crops",
        data.imageUrl || null,
        data.phone || null,
        data.whatsapp || null,
      ]
    );
    return rows[0];
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return createFallbackProduct(data);
    }
    throw error;
  }
}

async function getProduct(id) {
  try {
    const { rows } = await getPool().query(
      "SELECT * FROM market_products WHERE id = $1 AND active = TRUE",
      [id]
    );
    if (rows[0]) {
      return rows[0];
    }
    return getFallbackProduct(id);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackProduct(id);
    }
    throw error;
  }
}

async function updateProduct(id, patch, { sellerId, isAdmin }) {
  try {
    const allowed = [
      "name",
      "price",
      "unit",
      "location",
      "region",
      "type",
      "image_url",
      "phone",
      "whatsapp",
      "active",
    ];
    const keys = Object.keys(patch).filter((key) => allowed.includes(key));
    if (!keys.length) {
      return getProduct(id);
    }
    const base = [id];
    let where = "WHERE id = $1";
    if (!isAdmin) {
      base.push(sellerId);
      where += ` AND seller_id = $${base.length}`;
    }
    const sets = keys.map((key, index) => `${key} = $${base.length + index + 1}`);
    const values = keys.map((key) => patch[key]);
    const { rows } = await getPool().query(
      `UPDATE market_products SET ${sets.join(", ")}, updated_at = NOW() ${where} RETURNING *`,
      [...base, ...values]
    );
    if (rows[0]) {
      return rows[0];
    }
    return updateFallbackProduct(id, patch, { sellerId, isAdmin });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return updateFallbackProduct(id, patch, { sellerId, isAdmin });
    }
    throw error;
  }
}

module.exports = { listProducts, createProduct, getProduct, updateProduct };
