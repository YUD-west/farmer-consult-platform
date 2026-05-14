(function () {
  const TOKEN_KEY = "yegnafarm_token";
  const DEFAULT_API_ORIGIN = "https://farmer-consult-platform-1.onrender.com";

  const resolveApiOrigin = () => {
    if (typeof window === "undefined") return DEFAULT_API_ORIGIN.replace(/\/$/, "");
    if (typeof window.__YEGNA_API_ORIGIN__ === "string") {
      return String(window.__YEGNA_API_ORIGIN__).trim().replace(/\/$/, "");
    }
    return String(
      window.YEGNA_API_ORIGIN || window.YEGNAFARM_API_ORIGIN || DEFAULT_API_ORIGIN
    ).replace(/\/$/, "");
  };

  window.YegnaAPI = {
    TOKEN_KEY,
    basePath: "/api/v1",

    get apiOrigin() {
      return resolveApiOrigin();
    },

    url(path) {
      if (path.startsWith("http")) return path;
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${resolveApiOrigin()}${normalizedPath}`;
    },

    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    },

    async request(path, options = {}) {
      const url = path.startsWith("http") ? path : this.url(this.basePath + path);
      const headers = {
        Accept: "application/json",
        ...(options.headers || {}),
      };
      if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(options.body);
      }
      const t = this.getToken();
      if (t) headers.Authorization = "Bearer " + t;
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || res.statusText || "Request failed");
        err.status = res.status;
        err.details = data.details;
        throw err;
      }
      return data;
    },

    async login(email, password) {
      const data = await this.request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (data.token) this.setToken(data.token);
      return data;
    },

    async register(payload) {
      const data = await this.request("/auth/register", {
        method: "POST",
        body: payload,
      });
      if (data.token) this.setToken(data.token);
      return data;
    },

    logout() {
      this.setToken(null);
    },
  };
})();
