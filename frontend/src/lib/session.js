const SESSION_STORAGE_KEY = "yegnafarm_session";

function readRawSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeSession(session) {
  if (!session || typeof session !== "object") return null;

  const token = typeof session.token === "string" ? session.token.trim() : "";
  const user = session.user && typeof session.user === "object" ? session.user : null;

  if (!token || !user) return null;

  return {
    token,
    user: {
      id: user.id ?? null,
      email: typeof user.email === "string" ? user.email : "",
      fullName: typeof user.fullName === "string" ? user.fullName : "",
      role: typeof user.role === "string" ? user.role : "farmer",
      region: typeof user.region === "string" ? user.region : "",
      verifiedExpert: Boolean(user.verifiedExpert),
    },
  };
}

export function getStoredSession() {
  return normalizeSession(readRawSession());
}

export function saveStoredSession(session) {
  if (typeof window === "undefined") return;

  const normalized = normalizeSession(session);
  if (!normalized) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export { SESSION_STORAGE_KEY };
