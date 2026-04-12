const questionsRepo = require("../repositories/questionsRepo");

async function stats(req, res, next) {
  try {
    const data = await questionsRepo.dashboardCounts();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = { stats };
