const questionsRepo = require("../repositories/questionsRepo");

async function create(req, res, next) {
  try {
    const { body, guestName, cropHint } = req.body;
    const farmerId = req.user?.id || null;
    const name = guestName || (farmerId ? undefined : "Farmer");
    const row = await questionsRepo.createQuestion({
      farmerId,
      guestName: farmerId ? null : name,
      body,
      cropHint,
    });
    res.status(201).json({ status: "saved", entry: row });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const { status, limit } = req.query;
    const rows = await questionsRepo.listQuestions({ status, limit });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function getOne(req, res, next) {
  try {
    const row = await questionsRepo.getQuestionById(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found." });
    const answers = await questionsRepo.getAnswersForQuestion(req.params.id);
    res.json({ question: row, answers });
  } catch (e) {
    next(e);
  }
}

async function answer(req, res, next) {
  try {
    const { body } = req.body;
    const result = await questionsRepo.addAnswer({
      questionId: req.params.id,
      expertId: req.user.id,
      body,
    });
    if (result.error === "not_found") return res.status(404).json({ error: "Question not found." });
    if (result.error === "already_answered") {
      return res.status(409).json({ error: "Question already answered." });
    }
    res.status(201).json(result.answer);
  } catch (e) {
    next(e);
  }
}

async function rateAnswer(req, res, next) {
  try {
    const { stars } = req.body;
    const answerId = req.params.answerId;
    const row = await questionsRepo.addRating({
      answerId,
      userId: req.user.id,
      stars,
    });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list, getOne, answer, rateAnswer };
