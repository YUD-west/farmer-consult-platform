/**
 * Backend base URL (Render).
 * Prefer VITE_API_URL in Vercel (Production + Preview). It is baked in at build time.
 * If you omit it, production builds fall back to the default Render host below.
 */
const PRODUCTION_DEFAULT_API = "https://farmer-consult-platform.onrender.com";

export const API_BASE = String(
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PRODUCTION_DEFAULT_API : "")
).replace(/\/$/, "");

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

export async function apiGetJson(path) {
  const res = await fetch(apiUrl(path), { headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function apiPostJson(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

/** AI chat: prefer v1, fall back to legacy /ask */
export async function postChat({ question, language = "en", region, agroEcology }) {
  const payload = { question, language, region, agroEcology };
  try {
    const data = await apiPostJson("/api/v1/ai/chat", payload);
    if (data.answer) return { answer: data.answer, source: "api" };
  } catch {
    /* try legacy */
  }
  const legacy = await apiPostJson("/ask", payload);
  return { answer: legacy.answer || "No answer returned.", source: "legacy" };
}

export function externalPage(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
