const { getPool } = require("../db/pool");

async function getBundle() {
  const pool = getPool();
  const [families, qa, detailsRows] = await Promise.all([
    pool.query("SELECT name FROM guide_families ORDER BY sort_order, name"),
    pool.query("SELECT keyword, response FROM guide_keyword_qa ORDER BY id"),
    pool.query("SELECT slug, title, steps FROM guide_details"),
  ]);
  const details = {};
  for (const row of detailsRows.rows) {
    details[row.slug] = { title: row.title, steps: row.steps };
  }
  return {
    families: families.rows.map((r) => r.name),
    questions: qa.rows,
    details,
  };
}

async function getKeywordRoutes() {
  const { rows } = await getPool().query(
    "SELECT keyword, guide_slug FROM guide_keyword_routes ORDER BY LENGTH(keyword) DESC"
  );
  return rows;
}

async function getGuideDetail(slug) {
  const { rows } = await getPool().query("SELECT slug, title, steps FROM guide_details WHERE slug = $1", [slug]);
  return rows[0] || null;
}

module.exports = { getBundle, getKeywordRoutes, getGuideDetail };
