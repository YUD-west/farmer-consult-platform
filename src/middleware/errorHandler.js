module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.name === "MulterError" || /image uploads/i.test(err.message || "")) {
    return res.status(400).json({ error: err.message || "Invalid upload." });
  }
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong."
      : err.message || "Server error";
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message, code: err.code });
};
