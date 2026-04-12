/**
 * Loads data/guides.json and data/market-products.json into PostgreSQL.
 * Run after migrate.js. Uses ON CONFLICT / truncate patterns where needed.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getPool } = require("../src/db/pool");

const guideKeywords = [
  { key: "pre-planting", guide: "prePlantingPreparation" },
  { key: "preplanting", guide: "prePlantingPreparation" },
  { key: "planting", guide: "plantingSowing" },
  { key: "sowing", guide: "plantingSowing" },
  { key: "maintenance", guide: "cropMaintenance" },
  { key: "crop maintenance", guide: "cropMaintenance" },
  { key: "harvest", guide: "harvesting" },
  { key: "harvesting", guide: "harvesting" },
  { key: "marketing", guide: "marketingSelling" },
  { key: "selling", guide: "marketingSelling" },
  { key: "troubleshooting", guide: "troubleshooting" },
  { key: "problem solving", guide: "troubleshooting" },
  { key: "cattle", guide: "cattleBreedingSafety" },
  { key: "breeding", guide: "cattleBreedingSafety" },
  { key: "agroforestry", guide: "agroforestrySoilConservation" },
  { key: "soil conservation", guide: "agroforestrySoilConservation" },
  { key: "irrigation", guide: "waterIrrigationManagement" },
  { key: "water", guide: "waterIrrigationManagement" },
  { key: "climate", guide: "climateWeatherAwareness" },
  { key: "weather", guide: "climateWeatherAwareness" },
  { key: "finance", guide: "farmFinanceRecordKeeping" },
  { key: "record keeping", guide: "farmFinanceRecordKeeping" },
];

async function main() {
  const pool = getPool();
  const guidesPath = path.join(__dirname, "..", "data", "guides.json");
  const marketPath = path.join(__dirname, "..", "data", "market-products.json");
  const guides = JSON.parse(fs.readFileSync(guidesPath, "utf8"));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE guide_keyword_routes, guide_keyword_qa, guide_details, guide_families RESTART IDENTITY CASCADE");

    let order = 0;
    for (const name of guides.families || []) {
      await client.query(
        "INSERT INTO guide_families (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order",
        [name, order++]
      );
    }

    for (const row of guides.questions || []) {
      await client.query("INSERT INTO guide_keyword_qa (keyword, response) VALUES ($1, $2)", [
        row.keyword,
        row.response,
      ]);
    }

    const details = guides.details || {};
    for (const [slug, g] of Object.entries(details)) {
      await client.query(
        "INSERT INTO guide_details (slug, title, steps) VALUES ($1, $2, $3::jsonb) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, steps = EXCLUDED.steps",
        [slug, g.title, JSON.stringify(g.steps || [])]
      );
    }

    for (const { key, guide } of guideKeywords) {
      await client.query("INSERT INTO guide_keyword_routes (keyword, guide_slug) VALUES ($1, $2)", [key, guide]);
    }

    if (fs.existsSync(marketPath)) {
      const products = JSON.parse(fs.readFileSync(marketPath, "utf8"));
      await client.query("DELETE FROM market_products WHERE seller_id IS NULL");
      for (const p of products) {
        await client.query(
          `INSERT INTO market_products (name, price, unit, location, region, type, image_url, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
          [
            p.name,
            p.price,
            p.unit || "ETB",
            p.location,
            p.region || p.location,
            p.type || "crops",
            p.image || p.image_url || null,
          ]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Seed complete (guides + market).");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
