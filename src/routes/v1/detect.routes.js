const express = require("express");
const { upload } = require("../../middleware/upload");
const detectController = require("../../controllers/detectController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.post("/pest", upload.single("image"), asyncHandler(detectController.analyzePest));

module.exports = router;
