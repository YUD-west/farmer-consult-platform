const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usersRepo = require("../repositories/usersRepo");

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      verifiedExpert: user.verified_expert,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function register(req, res, next) {
  try {
    const { email, password, fullName, phone, region } = req.body;
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await usersRepo.createUser({
      email,
      phone,
      passwordHash,
      fullName,
      role: "farmer",
      region,
    });
    const token = signToken({ ...user, verified_expert: user.verified_expert });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        region: user.region,
        verifiedExpert: user.verified_expert,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await usersRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        region: user.region,
        verifiedExpert: user.verified_expert,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = await usersRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      role: user.role,
      region: user.region,
      verifiedExpert: user.verified_expert,
      createdAt: user.created_at,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, me };
