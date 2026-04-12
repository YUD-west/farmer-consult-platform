const express = require("express");
const { validate } = require("../../middleware/validate");
const { recommendQuerySchema, chatSchema } = require("../../validation/schemas");
const aiController = require("../../controllers/aiController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.post("/chat", validate(chatSchema), asyncHandler(aiController.chat));
router.get(
  "/recommendations",
  validate(recommendQuerySchema, "query"),
  asyncHandler(aiController.recommendations)
);
router.get("/onboarding", aiController.onboarding);

module.exports = router;
