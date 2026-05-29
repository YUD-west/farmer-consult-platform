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

async function requestJson(path, { method = "GET", body, headers = {}, token = "", cache = "no-store" } = {}) {
  const requestHeaders = { Accept: "application/json", ...headers };
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
  const options = {
    method,
    headers: requestHeaders,
    cache,
  };
  if (body !== undefined) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      requestHeaders["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
  }
  const res = await fetch(apiUrl(path), options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function apiGetJson(path, options = {}) {
  return requestJson(path, { ...options, method: "GET" });
}

export async function apiPostJson(path, body, options = {}) {
  return requestJson(path, { ...options, method: "POST", body });
}

export async function apiAuthGetJson(path, token, options = {}) {
  return requestJson(path, { ...options, method: "GET", token });
}

export async function apiAuthPostJson(path, body, token, options = {}) {
  return requestJson(path, { ...options, method: "POST", body, token });
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
