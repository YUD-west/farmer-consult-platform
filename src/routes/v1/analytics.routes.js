const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const analyticsController = require("../../controllers/analyticsController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.get("/overview", requireAuth("admin"), asyncHandler(analyticsController.overview));

module.exports = router;
