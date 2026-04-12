const express = require("express");
const authRoutes = require("./auth.routes");
const questionsRoutes = require("./questions.routes");
const marketRoutes = require("./market.routes");
const guidesRoutes = require("./guides.routes");
const aiRoutes = require("./ai.routes");
const dashboardRoutes = require("./dashboard.routes");
const analyticsRoutes = require("./analytics.routes");
const detectRoutes = require("./detect.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/questions", questionsRoutes);
router.use("/market", marketRoutes);
router.use("/guides", guidesRoutes);
router.use("/ai", aiRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/detect", detectRoutes);

module.exports = router;
