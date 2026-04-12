const jwt = require("jsonwebtoken");

function requireAuth(...allowedRoles) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const token = header.slice(7);
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET is not configured");
      }
      const payload = jwt.verify(token, secret);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        verifiedExpert: payload.verifiedExpert,
      };
      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: "Insufficient permissions." });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  };
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }
  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return next();
    const payload = jwt.verify(token, secret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      verifiedExpert: payload.verifiedExpert,
    };
  } catch {
    /* ignore */
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
