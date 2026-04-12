const express = require("express");
const { validate } = require("../../middleware/validate");
const { requireAuth, optionalAuth } = require("../../middleware/auth");
const {
  questionCreateSchema,
  answerCreateSchema,
  ratingSchema,
  questionsListQuerySchema,
} = require("../../validation/schemas");
const questionsController = require("../../controllers/questionsController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.post("/", optionalAuth, validate(questionCreateSchema), asyncHandler(questionsController.create));
router.get(
  "/",
  requireAuth("expert", "admin"),
  validate(questionsListQuerySchema, "query"),
  asyncHandler(questionsController.list)
);
router.post(
  "/answers/:answerId/ratings",
  requireAuth(),
  validate(ratingSchema),
  asyncHandler(questionsController.rateAnswer)
);
router.get("/:id", requireAuth("expert", "admin"), asyncHandler(questionsController.getOne));
router.post(
  "/:id/answers",
  requireAuth("expert", "admin"),
  validate(answerCreateSchema),
  asyncHandler(questionsController.answer)
);

module.exports = router;
