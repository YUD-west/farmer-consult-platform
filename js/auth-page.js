(function () {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  function setBusy(button, busy, idleText, busyText) {
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? busyText : idleText;
  }

  function redirectByRole(user) {
    const role = user?.role || "farmer";
    if (role === "expert" || role === "admin") {
      window.location.href = "dashboard.html";
      return;
    }
    window.location.href = "index.html";
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = document.getElementById("registerSubmitBtn");
      const payload = {
        fullName: document.getElementById("registerFullName")?.value.trim(),
        email: document.getElementById("registerEmail")?.value.trim(),
        phone: document.getElementById("registerPhone")?.value.trim(),
        region: document.getElementById("registerRegion")?.value.trim(),
        password: document.getElementById("registerPassword")?.value || "",
      };

      setBusy(submitBtn, true, "Sign Up", "Creating account...");
      try {
        const data = await window.YegnaAPI.register(payload);
        showYegnaToast("Account created successfully.", "success");
        redirectByRole(data.user);
      } catch (error) {
        showYegnaToast(error.message || "Sign-up failed.", "error");
      } finally {
        setBusy(submitBtn, false, "Sign Up", "Creating account...");
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = document.getElementById("loginSubmitBtn");
      const email = document.getElementById("loginEmail")?.value.trim();
      const password = document.getElementById("loginPassword")?.value || "";

      setBusy(submitBtn, true, "Log In", "Logging in...");
      try {
        const data = await window.YegnaAPI.login(email, password);
        showYegnaToast("Welcome back.", "success");
        redirectByRole(data.user);
      } catch (error) {
        showYegnaToast(error.message || "Login failed.", "error");
      } finally {
        setBusy(submitBtn, false, "Log In", "Logging in...");
      }
    });
  }
})();
