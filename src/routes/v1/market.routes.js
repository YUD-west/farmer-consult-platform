const express = require("express");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { marketCreateSchema, marketUpdateSchema, marketListQuerySchema } = require("../../validation/schemas");
const marketController = require("../../controllers/marketController");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.get("/", validate(marketListQuerySchema, "query"), asyncHandler(marketController.list));
router.post(
  "/",
  requireAuth("farmer", "expert", "admin"),
  validate(marketCreateSchema),
  asyncHandler(marketController.create)
);
router.patch(
  "/:id",
  requireAuth("farmer", "expert", "admin"),
  validate(marketUpdateSchema),
  asyncHandler(marketController.update)
);

module.exports = router;
