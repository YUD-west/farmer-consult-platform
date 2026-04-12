const questionsRepo = require("../repositories/questionsRepo");

async function overview(req, res, next) {
  try {
    const counts = await questionsRepo.dashboardCounts();
    const extra = await questionsRepo.analyticsOverview();
    res.json({ ...counts, ...extra });
  } catch (e) {
    next(e);
  }
}

module.exports = { overview };
