const express = require("express");
const guidesController = require("../../controllers/guidesController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(guidesController.getAll));
router.get("/:slug", asyncHandler(guidesController.getDetail));

module.exports = router;
