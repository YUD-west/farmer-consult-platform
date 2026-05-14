(function () {
  const loginForm = document.getElementById("expertLoginForm");
  const loginBtn = document.getElementById("expertLoginBtn");
  const logoutBtn = document.getElementById("expertLogoutBtn");
  const statusEl = document.getElementById("expertAuthStatus");
  const queueSection = document.getElementById("expertQueueSection");
  const queueList = document.getElementById("expertQuestionList");
  const refreshBtn = document.getElementById("expertRefreshQueueBtn");

  const statPending = document.getElementById("dashboardStatPending");
  const statAnswered = document.getElementById("dashboardStatAnswered");
  const statExperts = document.getElementById("dashboardStatExperts");

  function setLoginBusy(busy) {
    if (!loginBtn) return;
    loginBtn.disabled = busy;
    loginBtn.textContent = busy ? "Logging in..." : "Log In";
  }

  function formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function renderQueue(items) {
    if (!queueList) return;
    queueList.innerHTML = "";
    if (!items.length) {
      queueList.innerHTML = '<div class="expert-question-card"><p>No pending questions right now.</p></div>';
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "expert-question-card";
      const asker = item.farmer_name || item.guest_name || item.farmer_email || "Farmer";
      const crop = item.crop_hint ? `<span class="tag">${item.crop_hint}</span>` : "";
      card.innerHTML = `
        <div class="expert-question-meta">
          <strong>${asker}</strong>
          <span>${formatDate(item.created_at)}</span>
          ${crop}
        </div>
        <p>${item.body}</p>
        <form class="expert-answer-form" data-question-id="${item.id}">
          <textarea name="answer" rows="3" minlength="3" required placeholder="Write your expert answer..."></textarea>
          <button class="primary-btn" type="submit">Send Answer</button>
        </form>
      `;
      queueList.appendChild(card);
    });
  }

  async function loadPrivateStats() {
    try {
      const stats = await window.YegnaAPI.request("/dashboard/stats");
      if (statPending) statPending.textContent = String(stats.pendingQuestions ?? "0");
      if (statAnswered) statAnswered.textContent = String(stats.answeredToday ?? "0");
      if (statExperts) statExperts.textContent = String(stats.activeExperts ?? "0");
    } catch (error) {
      // Leave public fallback stats from app.js if secure endpoint is not available.
    }
  }

  async function loadQueue() {
    try {
      const questions = await window.YegnaAPI.request("/questions?status=pending&limit=50");
      renderQueue(Array.isArray(questions) ? questions : []);
    } catch (error) {
      showYegnaToast(error.message || "Could not load pending questions.", "error");
    }
  }

  function setAuthedUI(user) {
    if (!statusEl || !queueSection || !loginBtn || !logoutBtn) return;
    statusEl.textContent = `Logged in as ${user.fullName || user.email} (${user.role}).`;
    queueSection.hidden = false;
    loginBtn.hidden = true;
    logoutBtn.hidden = false;
  }

  function setGuestUI() {
    if (!statusEl || !queueSection || !loginBtn || !logoutBtn) return;
    statusEl.textContent = "Log in as an expert/admin to manage incoming farmer questions.";
    queueSection.hidden = true;
    loginBtn.hidden = false;
    logoutBtn.hidden = true;
  }

  async function initializeSession() {
    const token = window.YegnaAPI.getToken();
    if (!token) {
      setGuestUI();
      return;
    }
    try {
      const me = await window.YegnaAPI.request("/auth/me");
      if (me.role !== "expert" && me.role !== "admin") {
        setGuestUI();
        showYegnaToast("Your account is not an expert/admin account.", "info");
        return;
      }
      setAuthedUI(me);
      await Promise.all([loadPrivateStats(), loadQueue()]);
    } catch (error) {
      window.YegnaAPI.logout();
      setGuestUI();
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("expertLoginEmail")?.value.trim();
      const password = document.getElementById("expertLoginPassword")?.value || "";
      setLoginBusy(true);
      try {
        const data = await window.YegnaAPI.login(email, password);
        if (data.user.role !== "expert" && data.user.role !== "admin") {
          showYegnaToast("This dashboard is for expert/admin accounts.", "error");
          return;
        }
        showYegnaToast("Expert session active.", "success");
        setAuthedUI(data.user);
        await Promise.all([loadPrivateStats(), loadQueue()]);
      } catch (error) {
        showYegnaToast(error.message || "Login failed.", "error");
      } finally {
        setLoginBusy(false);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.YegnaAPI.logout();
      setGuestUI();
      if (queueList) queueList.innerHTML = "";
      showYegnaToast("Logged out.", "info");
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await Promise.all([loadPrivateStats(), loadQueue()]);
      showYegnaToast("Queue refreshed.", "info", 2000);
    });
  }

  if (queueList) {
    queueList.addEventListener("submit", async (event) => {
      const form = event.target.closest(".expert-answer-form");
      if (!form) return;
      event.preventDefault();
      const questionId = form.getAttribute("data-question-id");
      const textarea = form.querySelector("textarea");
      const button = form.querySelector("button[type='submit']");
      const body = textarea?.value.trim();
      if (!body || !questionId) return;
      if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
      }
      try {
        await window.YegnaAPI.request(`/questions/${questionId}/answers`, {
          method: "POST",
          body: { body },
        });
        showYegnaToast("Answer submitted.", "success");
        await Promise.all([loadPrivateStats(), loadQueue()]);
      } catch (error) {
        showYegnaToast(error.message || "Could not submit answer.", "error");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = "Send Answer";
        }
      }
    });
  }

  initializeSession();
})();
