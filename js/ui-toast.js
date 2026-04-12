(function () {
  const TOAST_ID = "yegna-toast-host";

  function ensureHost() {
    let el = document.getElementById(TOAST_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = TOAST_ID;
      el.setAttribute("aria-live", "polite");
      el.className = "yegna-toast-host";
      document.body.appendChild(el);
    }
    return el;
  }

  /**
   * @param {string} message
   * @param {"info"|"error"|"success"} variant
   * @param {number} ms
   */
  window.showYegnaToast = function showYegnaToast(message, variant = "info", ms = 4200) {
    const host = ensureHost();
    const t = document.createElement("div");
    t.className = "yegna-toast yegna-toast--" + variant;
    t.textContent = message;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add("yegna-toast--visible"));
    const remove = () => {
      t.classList.remove("yegna-toast--visible");
      setTimeout(() => t.remove(), 300);
    };
    setTimeout(remove, ms);
  };
})();
