const guidesRepo = require("../repositories/guidesRepo");

async function getAll(req, res, next) {
  try {
    const bundle = await guidesRepo.getBundle();
    res.json(bundle);
  } catch (e) {
    next(e);
  }
}

async function getDetail(req, res, next) {
  try {
    const row = await guidesRepo.getGuideDetail(req.params.slug);
    if (!row) return res.status(404).json({ error: "Guide not found." });
    res.json({ slug: row.slug, title: row.title, steps: row.steps });
  } catch (e) {
    next(e);
  }
}

module.exports = { getAll, getDetail };
