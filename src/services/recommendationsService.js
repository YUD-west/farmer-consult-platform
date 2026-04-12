/**
 * Rule-based seasonal hints for Ethiopia (illustrative — tune with agronomy partners).
 */
function recommend({ crop, season }) {
  const c = (crop || "").toLowerCase();
  const s = (season || "").toLowerCase();
  const tips = [];

  if (c.includes("teff") || c.includes("wheat") || c.includes("barley")) {
    tips.push("Cereals: finalize land prep before kiremt rains; use certified seed and split nitrogen.");
  }
  if (c.includes("maize")) {
    tips.push("Maize: plant with reliable soil moisture; watch for fall armyworm — scout weekly.");
  }
  if (c.includes("tomato") || c.includes("onion")) {
    tips.push("Vegetables: ensure drainage; avoid overhead irrigation late day to reduce fungal risk.");
  }
  if (s.includes("kiremt") || s.includes("main")) {
    tips.push("Main season: prioritize soil conservation and stagger planting to spread labor.");
  }
  if (s.includes("belg")) {
    tips.push("Belg season: choose short-cycle varieties; monitor water stress on lighter soils.");
  }
  if (!tips.length) {
    tips.push("Share your crop, woreda/region, and growth stage for tailored next steps.");
  }

  return {
    crop: crop || null,
    season: season || null,
    recommendations: tips,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { recommend };
