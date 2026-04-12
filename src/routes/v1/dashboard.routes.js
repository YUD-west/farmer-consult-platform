const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const dashboardController = require("../../controllers/dashboardController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.get("/stats", requireAuth("expert", "admin"), asyncHandler(dashboardController.stats));

module.exports = router;
