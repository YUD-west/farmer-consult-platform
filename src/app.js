const path = require("path");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const v1Routes = require("./routes/v1");
const legacyRoutes = require("./routes/legacy.routes");
const errorHandler = require("./middleware/errorHandler");

/** Project root (works locally and on Vercel serverless — do not rely on process.cwd()). */
const PUBLIC_ROOT = path.join(__dirname, "..");

function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || true,
      credentials: Boolean(process.env.FRONTEND_ORIGIN),
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", authLimiter);

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }

  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1", v1Routes);
  app.use(legacyRoutes);

  app.use(express.static(PUBLIC_ROOT, { extensions: ["html"] }));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
