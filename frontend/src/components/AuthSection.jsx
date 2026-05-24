import { BadgeCheck, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "./ui/Button";
import { Input } from "./ui/Input";
import { apiPostJson } from "../lib/api";
import { clearStoredSession, getStoredSession, saveStoredSession } from "../lib/session";

const initialSignup = {
  fullName: "",
  email: "",
  phone: "",
  region: "",
  password: "",
};

const initialLogin = {
  email: "",
  password: "",
};

function scrollToDashboard() {
  window.requestAnimationFrame(() => {
    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export default function AuthSection({ onSessionChange }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [signupForm, setSignupForm] = useState(initialSignup);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [signupBusy, setSignupBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    onSessionChange?.(session?.user ?? null);
  }, [onSessionChange, session]);

  function updateSignupField(field) {
    return (event) => setSignupForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function updateLoginField(field) {
    return (event) => setLoginForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function syncSession(nextSession) {
    setSession(nextSession);
    saveStoredSession(nextSession);
    onSessionChange?.(nextSession?.user ?? null);
  }

  async function handleSignup(event) {
    event.preventDefault();
    if (signupBusy) return;

    setSignupBusy(true);
    setSignupMessage("");

    try {
      const data = await apiPostJson("/api/v1/auth/register", signupForm);
      syncSession({ token: data.token, user: data.user });
      setSignupForm(initialSignup);
      setSignupMessage(`Welcome, ${data.user?.fullName || "farmer"}.`);
      scrollToDashboard();
    } catch (error) {
      setSignupMessage(error.message || "Could not create the account.");
    } finally {
      setSignupBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (loginBusy) return;

    setLoginBusy(true);
    setLoginMessage("");

    try {
      const data = await apiPostJson("/api/v1/auth/login", loginForm);
      syncSession({ token: data.token, user: data.user });
      setLoginForm(initialLogin);
      setLoginMessage(`Signed in as ${data.user?.fullName || data.user?.email || "user"}.`);
      scrollToDashboard();
    } catch (error) {
      setLoginMessage(error.message || "Login failed.");
    } finally {
      setLoginBusy(false);
    }
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
    setSignupMessage("");
    setLoginMessage("");
    onSessionChange?.(null);
  }

  return (
    <section id="signup" className="scroll-mt-24 px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <BadgeCheck className="text-brand-primary" />
            <h2 className="heading-font mt-3 text-3xl font-bold text-brand-text">Sign up or log in</h2>
            <p className="mt-2 max-w-2xl text-sm text-brand-muted">
              One frontend path now handles the full account flow. No separate signup page is needed.
            </p>
          </div>
          {session ? (
            <div className="rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="font-semibold text-brand-text">Active session</p>
              <p className="mt-1 text-brand-muted">{session.user.fullName || session.user.email}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr_0.9fr]">
          <article className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-brand-primary" />
              <div>
                <h3 className="heading-font text-lg font-semibold text-brand-text">Create account</h3>
                <p className="text-sm text-brand-muted">Farmers, buyers, and experts all start here.</p>
              </div>
            </div>
            <form className="mt-5 space-y-3" onSubmit={handleSignup}>
              <Input
                placeholder="Full name"
                value={signupForm.fullName}
                onChange={updateSignupField("fullName")}
                autoComplete="name"
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={updateSignupField("email")}
                autoComplete="email"
                required
              />
              <Input
                placeholder="Phone number"
                value={signupForm.phone}
                onChange={updateSignupField("phone")}
                autoComplete="tel"
              />
              <Input
                placeholder="Region"
                value={signupForm.region}
                onChange={updateSignupField("region")}
                autoComplete="address-level1"
              />
              <Input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={updateSignupField("password")}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <Button type="submit" className="w-full" disabled={signupBusy}>
                {signupBusy ? "Creating account..." : "Sign up"}
              </Button>
              {signupMessage ? <p className="text-sm text-brand-muted">{signupMessage}</p> : null}
            </form>
          </article>

          <article className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserRound className="text-brand-primary" />
              <div>
                <h3 className="heading-font text-lg font-semibold text-brand-text">Sign in</h3>
                <p className="text-sm text-brand-muted">Return to your dashboard or switch accounts.</p>
              </div>
            </div>
            <form className="mt-5 space-y-3" onSubmit={handleLogin}>
              <Input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={updateLoginField("email")}
                autoComplete="email"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={updateLoginField("password")}
                autoComplete="current-password"
                required
              />
              <Button type="submit" variant="secondary" className="w-full" disabled={loginBusy}>
                {loginBusy ? "Signing in..." : "Log in"}
              </Button>
              {loginMessage ? <p className="text-sm text-brand-muted">{loginMessage}</p> : null}
            </form>
          </article>

          <aside className="rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary p-6 text-white shadow-xl">
            <h3 className="heading-font text-2xl font-bold">Why this path?</h3>
            <ul className="mt-4 space-y-3 text-sm text-green-50">
              <li>One React app handles the full customer journey.</li>
              <li>Old HTML pages now redirect into the same UI.</li>
              <li>Render and Vercel both point at the same frontend code.</li>
            </ul>
            {session ? (
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full border-white bg-transparent text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </Button>
            ) : (
              <Button
                as="a"
                href="#dashboard"
                variant="outline"
                className="mt-6 w-full border-white bg-transparent text-white hover:bg-white/10"
              >
                Review dashboard
              </Button>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
