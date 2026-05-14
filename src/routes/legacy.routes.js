/**
 * Backward-compatible paths for existing static HTML / js/app.js
 */
const express = require("express");
const aiService = require("../services/aiService");
const questionsRepo = require("../repositories/questionsRepo");
const marketRepo = require("../repositories/marketRepo");
const dashboardController = require("../controllers/dashboardController");
const { upload } = require("../middleware/upload");
const { optionalAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post(
  "/ask",
  asyncHandler(async (req, res) => {
    const question = req.body.question || "";
    const result = await aiService.chat({
      question,
      region: req.body.region,
      language: req.body.language || "en",
      agroEcology: req.body.agroEcology,
    });
    res.json({ answer: result.answer });
  })
);

router.post(
  "/ask-question",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { name, question } = req.body || {};
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }
    const farmerId = req.user?.id || null;
    const row = await questionsRepo.createQuestion({
      farmerId,
      guestName: farmerId ? null : name || "Farmer",
      body: question,
      cropHint: null,
    });
    res.json({ status: "saved", entry: row });
  })
);

router.get(
  "/market-data",
  asyncHandler(async (req, res) => {
    const rows = await marketRepo.listProducts({ limit: 200 });
    const legacy = rows.map((p) => ({
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
      location: p.location,
      type: p.type,
      image: p.image_url || "",
    }));
    res.json(legacy);
  })
);

router.get(
  "/dashboard-stats",
  asyncHandler(async (req, res) => {
    const data = await questionsRepo.dashboardCounts();
    res.json({
      pendingQuestions: data.pendingQuestions,
      answeredToday: data.answeredToday,
      activeExperts: data.activeExperts,
      totalQuestions: data.totalQuestions,
    });
  })
);

router.post(
  "/detect",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required." });
    }
    res.json({
      status: "received",
      filename: req.file.filename,
      message: "Image received. Use POST /api/v1/detect/pest for the new pipeline contract.",
    });
  })
);

module.exports = router;
