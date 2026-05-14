require("dotenv").config();
const { createApp } = require("./src/expressApp");

const port = process.env.PORT || 3000;

// Fail fast if DB is required but missing (all API routes use PostgreSQL).
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Copy .env.example to .env and configure PostgreSQL.");
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("Set JWT_SECRET in .env (at least 16 characters).");
  process.exit(1);
}

const app = createApp();
app.listen(port, () => {
  console.log(`YegnaFarm AI server http://localhost:${port}`);
});
