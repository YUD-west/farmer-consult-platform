/**
 * Placeholder pipeline for future pest/disease model or partner API.
 */
async function analyzePest(req, res, _next) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "Image file is required." });
  }
  res.json({
    status: "pending_integration",
    requestId: `det-${Date.now()}`,
    filename: file.filename,
    message:
      "Image stored. Connect a trained vision model or external API here; contract is stable for clients.",
    suggestedNextSteps: [
      "Return crop/part + confidence + treatment hints from your model service.",
      "POST result webhook to /api/v1/detect/callback (to be implemented).",
    ],
  });
}

module.exports = { analyzePest };
