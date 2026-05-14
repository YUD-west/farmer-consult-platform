const path = require("path");
const fs = require("fs");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const v1Routes = require("./routes/v1");
const legacyRoutes = require("./routes/legacy.routes");
const errorHandler = require("./middleware/errorHandler");
const { getPool } = require("./db/pool");

/** Project root (works locally and on Vercel serverless — do not rely on process.cwd()). */
const PUBLIC_ROOT = path.join(__dirname, "..");
const FRONTEND_DIST = path.join(PUBLIC_ROOT, "frontend", "dist");
const FRONTEND_INDEX = path.join(FRONTEND_DIST, "index.html");
const HAS_FRONTEND_DIST = fs.existsSync(FRONTEND_INDEX);

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
  app.use(express.urlencoded({ extended: true }));

  app.get(["/health", "/api/v1/health"], (req, res) => {
    res.json({
      status: "ok",
      service: "yegnafarm-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.get(["/health/db", "/api/v1/health/db"], async (req, res) => {
    try {
      const pool = getPool();
      await pool.query("SELECT 1");
      res.json({
        status: "ok",
        database: "reachable",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: "degraded",
        database: "unreachable",
        error: process.env.NODE_ENV === "production" ? "Database check failed." : error.message,
      });
    }
  });

  app.use("/api/v1", v1Routes);
  app.use(legacyRoutes);

  // Serve React homepage when frontend build exists.
  if (HAS_FRONTEND_DIST) {
    app.use(express.static(FRONTEND_DIST, { index: false }));
    app.get("/", (_req, res) => {
      res.sendFile(FRONTEND_INDEX);
    });
  }

  app.use(express.static(PUBLIC_ROOT, { extensions: ["html"] }));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
