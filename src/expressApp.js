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
const UPLOADS_DIR = path.join(PUBLIC_ROOT, "uploads");
const FRONTEND_ORIGIN = normalizeOrigin(process.env.FRONTEND_ORIGIN || "");

function frontendUrl(pathname = "/") {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return FRONTEND_ORIGIN ? `${FRONTEND_ORIGIN}${path}` : path;
}

const LEGACY_REDIRECTS = {
  "/chat.html": frontendUrl("/?section=chat"),
  "/signup.html": frontendUrl("/?section=signup"),
  "/upload.html": frontendUrl("/?section=upload"),
  "/market.html": frontendUrl("/?section=market"),
  "/dashboard.html": frontendUrl("/?section=expert-dashboard"),
  "/crop-guide.html": frontendUrl("/?section=guides"),
};

/** Normalize browser origin (no trailing slash). */
function normalizeOrigin(origin) {
  if (!origin || typeof origin !== "string") return "";
  return origin.trim().replace(/\/$/, "");
}

/**
 * Comma-separated FRONTEND_ORIGIN on Render, e.g.
 * https://myapp.vercel.app,https://myapp-git-main-user.vercel.app
 * If at least one entry is a vercel.app URL, any https://*.vercel.app is allowed (previews + production).
 * If unset, all origins are allowed (dev / same-host).
 */
function buildCorsOptions() {
  const raw = (process.env.FRONTEND_ORIGIN || "").trim();
  const list = raw
    .split(",")
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);

  if (list.length === 0) {
    return { origin: true, credentials: false };
  }

  const allowVercelWildcard = list.some((o) => o.includes("vercel.app"));

  const mistakenApi = list.some((o) => /onrender\.com/i.test(o));
  if (mistakenApi) {
    console.warn(
      "[cors] FRONTEND_ORIGIN looks like a Render/API host. Set it to your site URL (e.g. https://your-app.vercel.app), not the API URL."
    );
  }

  return {
    origin(requestOrigin, callback) {
      if (!requestOrigin) return callback(null, true);
      const o = normalizeOrigin(requestOrigin);
      if (list.includes(o)) return callback(null, true);
      if (allowVercelWildcard) {
        try {
          const { protocol, hostname } = new URL(requestOrigin);
          if (protocol === "https:" && (hostname.endsWith(".vercel.app") || hostname === "vercel.app")) {
            return callback(null, true);
          }
        } catch (_) {
          /* ignore */
        }
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  };
}

function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors(buildCorsOptions()));

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

  app.get("/index.html", (req, res) => {
    const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
    res.redirect(302, frontendUrl(query || "/"));
  });

  Object.entries(LEGACY_REDIRECTS).forEach(([from, to]) => {
    app.get(from, (_req, res) => {
      res.redirect(302, to);
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

  app.use("/uploads", express.static(UPLOADS_DIR));

  // Serve React homepage when frontend build exists.
  if (FRONTEND_ORIGIN) {
    app.get("/", (req, res) => {
      const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
      res.redirect(302, `${FRONTEND_ORIGIN}/${query}`);
    });
  } else if (HAS_FRONTEND_DIST) {
    app.use(express.static(FRONTEND_DIST, { index: false }));
    app.get("/", (_req, res) => {
      res.sendFile(FRONTEND_INDEX);
    });
  }

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
