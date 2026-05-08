const { getPool } = require("../db/pool");
const { isDbUnavailableError } = require("../lib/dbError");
const {
  getGuideBundle: getFallbackGuideBundle,
  getGuideRoutes: getFallbackGuideRoutes,
  getGuideDetail: getFallbackGuideDetail,
} = require("../lib/fallbackStore");

function shouldUseFallbackBundle(bundle) {
  return (
    !bundle ||
    !bundle.families?.length ||
    !bundle.questions?.length ||
    !Object.keys(bundle.details || {}).length
  );
}

async function getBundle() {
  try {
    const pool = getPool();
    const [families, qa, detailsRows] = await Promise.all([
      pool.query("SELECT name FROM guide_families ORDER BY sort_order, name"),
      pool.query("SELECT keyword, response FROM guide_keyword_qa ORDER BY id"),
      pool.query("SELECT slug, title, steps FROM guide_details"),
    ]);

    const bundle = {
      families: families.rows.map((row) => row.name),
      questions: qa.rows,
      details: detailsRows.rows.reduce((acc, row) => {
        acc[row.slug] = { title: row.title, steps: row.steps };
        return acc;
      }, {}),
    };

    return shouldUseFallbackBundle(bundle) ? getFallbackGuideBundle() : bundle;
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackGuideBundle();
    }
    throw error;
  }
}

async function getKeywordRoutes() {
  try {
    const rows = await getPool().query(
      "SELECT keyword, guide_slug FROM guide_keyword_routes ORDER BY LENGTH(keyword) DESC"
    );
    return rows.length ? rows : getFallbackGuideRoutes();
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackGuideRoutes();
    }
    throw error;
  }
}

async function getGuideDetail(slug) {
  try {
    const { rows } = await getPool().query(
      "SELECT slug, title, steps FROM guide_details WHERE slug = $1",
      [slug]
    );
    if (rows[0]) {
      return rows[0];
    }
    return getFallbackGuideDetail(slug);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackGuideDetail(slug);
    }
    throw error;
  }
}

module.exports = { getBundle, getKeywordRoutes, getGuideDetail };
