(function () {
  const TOKEN_KEY = "yegnafarm_token";

  window.YegnaAPI = {
    TOKEN_KEY,
    basePath: "/api/v1",

    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    },

    async request(path, options = {}) {
      const url = path.startsWith("http") ? path : this.basePath + path;
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
