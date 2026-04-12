const express = require("express");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { registerSchema, loginSchema } = require("../../validation/schemas");
const authController = require("../../controllers/authController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.post("/register", validate(registerSchema), asyncHandler(authController.register));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.get("/me", requireAuth(), asyncHandler(authController.me));

module.exports = router;
