/**
 * When the UI is hosted on Vercel (static) and the API on Render, all /api/* and
 * legacy paths must use the absolute backend origin. Local dev (same host as API) uses "".
 */
(function () {
  if (typeof window === "undefined") return;

  function normalizeOrigin(origin) {
    if (!origin || typeof origin !== "string") return "";
    return origin.trim().replace(/\/$/, "");
  }

  var meta = document.querySelector('meta[name="yegna-api-origin"]');
  var fromMeta = meta && meta.getAttribute("content") ? normalizeOrigin(meta.getAttribute("content")) : "";

  if (typeof window.__YEGNA_API_ORIGIN__ === "string" && window.__YEGNA_API_ORIGIN__.length > 0) {
    window.__YEGNA_API_ORIGIN__ = normalizeOrigin(window.__YEGNA_API_ORIGIN__);
  } else if (fromMeta) {
    window.__YEGNA_API_ORIGIN__ = fromMeta;
  } else {
    var host = window.location.hostname || "";
    if (host.endsWith(".vercel.app") || host === "vercel.app") {
      window.__YEGNA_API_ORIGIN__ = "https://farmer-consult-platform.onrender.com";
    } else {
      window.__YEGNA_API_ORIGIN__ = "";
    }
  }

  window.yegnaApiUrl = function yegnaApiUrl(path) {
    if (!path) return "";
    if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) return path;
    var p = path.charAt(0) === "/" ? path : "/" + path;
    var origin = window.__YEGNA_API_ORIGIN__ || "";
    return origin ? origin + p : p;
  };
})();
