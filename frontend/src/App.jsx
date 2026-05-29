import { motion } from "framer-motion";
import {
  Bot,
  CloudSun,
  GraduationCap,
  HandHelping,
  Loader2,
  Sprout,
  Tractor,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ExpertCard from "./components/ExpertCard";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import StatsCard from "./components/StatsCard";
import AuthSection from "./components/AuthSection";
import UploadSection from "./components/UploadSection";
import Badge from "./components/ui/Badge";
import Button from "./components/ui/Button";
import { Input, Select } from "./components/ui/Input";
import { API_BASE, apiAuthGetJson, apiAuthPostJson, apiGetJson, apiPostJson, apiUrl, postChat } from "./lib/api";
import { getStoredSession } from "./lib/session";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80";

const experts = [
  {
    name: "Dr. Selam Desta",
    specialization: "Crop Disease Specialist",
    rating: "4.9",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Eng. Mekbib Alemu",
    specialization: "Irrigation Advisor",
    rating: "4.8",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Dr. Hiwot Tadesse",
    specialization: "Market & Value Chain",
    rating: "4.9",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
];

const services = [
  { title: "AI Crop Advisory", icon: Bot },
  { title: "Weather Updates", icon: CloudSun },
  { title: "Market Prices", icon: TrendingUp },
  { title: "Inputs & Machinery", icon: Tractor },
  { title: "Expert Consultation", icon: HandHelping },
  { title: "Training & Resources", icon: GraduationCap },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const EXPERT_ROLES = new Set(["expert", "admin"]);

function isExpertRole(role) {
  return EXPERT_ROLES.has(role);
}

function resolveImageUrl(raw) {
  if (!raw) return PLACEHOLDER_IMG;
  const s = String(raw).trim();
  if (!s) return PLACEHOLDER_IMG;
  if (s.startsWith("http")) return s;
  const path = s.replace(/^\.?\//, "");
  if (path.startsWith("assets/")) {
    return `/${path}`;
  }
  if (path.startsWith("uploads/")) {
    return API_BASE ? `${API_BASE}/${path}` : `/${path}`;
  }
  return API_BASE ? `${API_BASE}/${path}` : `/${path}`;
}

function scrollToSection(sectionId) {
  if (!sectionId) return;

  window.requestAnimationFrame(() => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  });
}

async function cleanupLegacyBrowserState() {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      /* ignore service worker cleanup failures */
    }
  }

  if (typeof window !== "undefined" && window.caches?.keys) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    } catch {
      /* ignore cache cleanup failures */
    }
  }
}

function HomePage() {
  const [healthOk, setHealthOk] = useState(null);
  const [dbOk, setDbOk] = useState(null);
  const [guidesFamilies, setGuidesFamilies] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [marketRaw, setMarketRaw] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketType, setMarketType] = useState("all");

  const [aiMessages, setAiMessages] = useState([
    { role: "ai", text: "Selam! Ask about crops, soil, pests, or market prices." },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [qName, setQName] = useState("");
  const [qBody, setQBody] = useState("");
  const [qBusy, setQBusy] = useState(false);
  const [qStatus, setQStatus] = useState("");
  const [currentUser, setCurrentUser] = useState(() => getStoredSession()?.user ?? null);
  const [expertQuestions, setExpertQuestions] = useState([]);
  const [expertQuestionsLoading, setExpertQuestionsLoading] = useState(false);
  const [expertQuestionsStatus, setExpertQuestionsStatus] = useState("");
  const [expertAnswerDrafts, setExpertAnswerDrafts] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await cleanupLegacyBrowserState();

      const retryJson = async (loader, attempts = 2, delayMs = 400) => {
        let lastError = null;
        for (let index = 0; index < attempts; index += 1) {
          try {
            return await loader();
          } catch (error) {
            lastError = error;
            if (index < attempts - 1) {
              await new Promise((resolve) => window.setTimeout(resolve, delayMs * (index + 1)));
            }
          }
        }
        throw lastError;
      };

      try {
        await retryJson(() => apiGetJson("/health", { cache: "no-store" }));
        if (!cancelled) setHealthOk(true);
      } catch {
        if (!cancelled) setHealthOk(false);
      }
      try {
        const d = await retryJson(() => apiGetJson("/health/db", { cache: "no-store" }));
        if (!cancelled) setDbOk(d.status === "ok" && d.database === "reachable");
      } catch {
        if (!cancelled) setDbOk(false);
      }
      try {
        const g = await apiGetJson("/api/v1/guides", { cache: "no-store" });
        if (!cancelled) setGuidesFamilies(Array.isArray(g.families) ? g.families : []);
      } catch {
        if (!cancelled) setGuidesFamilies([]);
      } finally {
        if (!cancelled) setGuidesLoading(false);
      }
      try {
        const m = await apiGetJson("/market-data", { cache: "no-store" });
        if (!cancelled && Array.isArray(m)) setMarketRaw(m);
      } catch {
        /* use empty; UI still works */
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
      try {
        const s = await apiGetJson("/dashboard-stats", { cache: "no-store" });
        if (!cancelled) setStats(s);
      } catch {
        if (!cancelled) setStats(null);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sectionFromQuery = new URLSearchParams(window.location.search).get("section");
    const sectionFromHash = window.location.hash.replace(/^#/, "");
    const sectionId = sectionFromQuery || sectionFromHash;

    if (sectionId) {
      scrollToSection(sectionId);
    }
    return undefined;
  }, []);

  const products = useMemo(
    () =>
      marketRaw.map((item) => ({
        name: item.name,
        location: item.location || "—",
        price: `ETB ${Number(item.price).toLocaleString()}${item.unit ? ` ${item.unit}` : ""}`,
        trend: "Live",
        image: resolveImageUrl(item.image),
        type: item.type || "crops",
      })),
    [marketRaw]
  );

  const filteredProducts = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
      const matchT = marketType === "all" || p.type === marketType;
      return matchQ && matchT;
    });
  }, [products, marketSearch, marketType]);

  const statItems = stats
    ? [
        ["Pending questions", String(stats.pendingQuestions ?? "—")],
        ["Answered today", String(stats.answeredToday ?? "—")],
        ["Active experts", String(stats.activeExperts ?? "—")],
        ["Total questions", String(stats.totalQuestions ?? "—")],
      ]
    : [
        ["Active Farmers", "25K+"],
        ["Verified Experts", "3K+"],
        ["Happy Buyers", "8K+"],
        ["Satisfaction Rate", "95%"],
      ];
  const dashboardTitle = isExpertRole(currentUser?.role) ? "Expert dashboard" : "User dashboard";

  async function sendAi() {
    const text = aiInput.trim();
    if (!text || aiBusy) return;
    setAiMessages((m) => [...m, { role: "user", text }]);
    setAiInput("");
    setAiBusy(true);
    try {
      const { answer } = await postChat({ question: text, language: "en" });
      setAiMessages((m) => [...m, { role: "ai", text: answer }]);
    } catch (e) {
      setAiMessages((m) => [...m, { role: "ai", text: e.message || "AI request failed." }]);
    } finally {
      setAiBusy(false);
    }
  }

  async function loadExpertQueue() {
    if (!isExpertRole(currentUser?.role)) {
      setExpertQuestions([]);
      setExpertQuestionsStatus("");
      return;
    }

    const token = getStoredSession()?.token ?? "";
    if (!token) {
      setExpertQuestions([]);
      setExpertQuestionsStatus("Expert session expired. Please sign in again.");
      return;
    }

    setExpertQuestionsLoading(true);
    setExpertQuestionsStatus("");
    try {
      const questions = await apiAuthGetJson("/api/v1/questions?status=pending&limit=8", token, {
        cache: "no-store",
      });
      if (Array.isArray(questions)) {
        setExpertQuestions(questions);
      } else {
        setExpertQuestions([]);
      }
    } catch (error) {
      setExpertQuestions([]);
      setExpertQuestionsStatus(error.message || "Could not load the expert queue.");
    } finally {
      setExpertQuestionsLoading(false);
    }
  }

  async function submitExpertAnswer(questionId) {
    const body = String(expertAnswerDrafts[questionId] ?? "").trim();
    if (!body) return;

    const token = getStoredSession()?.token ?? "";
    if (!token) {
      setExpertQuestionsStatus("Expert session expired. Please sign in again.");
      return;
    }

    try {
      await apiAuthPostJson(`/api/v1/questions/${questionId}/answers`, { body }, token, {
        cache: "no-store",
      });
      setExpertQuestionsStatus("Answer submitted successfully.");
      setExpertAnswerDrafts((current) => {
        const next = { ...current };
        delete next[questionId];
        return next;
      });
      await loadExpertQueue();
    } catch (error) {
      setExpertQuestionsStatus(error.message || "Could not submit the answer.");
    }
  }

  useEffect(() => {
    loadExpertQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  async function submitExpertQuestion(ev) {
    ev.preventDefault();
    if (!qBody.trim() || qBusy) return;
    setQBusy(true);
    setQStatus("");
    try {
      await apiPostJson("/ask-question", {
        name: qName.trim() || "Farmer",
        question: qBody.trim(),
      });
      setQStatus("Sent — an expert can pick this up from the dashboard.");
      setQBody("");
    } catch (e) {
      setQStatus(e.message || "Could not submit question.");
    } finally {
      setQBusy(false);
    }
  }

  return (
    <div className="bg-brand-bg">
      <div className="border-b border-green-100 bg-white/90 px-4 py-2 text-center text-sm">
        {healthOk === null ? (
          <span className="text-brand-muted">Checking API…</span>
        ) : healthOk ? (
          <span className="text-green-800">
            API online
            {dbOk === true ? " · Database OK" : dbOk === false ? " · Database check failed (see Render env)" : ""}
            {API_BASE ? ` · ${API_BASE}` : " · using dev proxy (local)"}
          </span>
        ) : (
          <span className="text-red-800">
            Cannot reach API from this site. (1) Vercel env:{" "}
            <code className="rounded bg-red-50 px-1">VITE_API_URL=https://farmer-consult-platform.onrender.com</code> then
            redeploy. (2) Render env: <code className="rounded bg-red-50 px-1">FRONTEND_ORIGIN</code> must be this page&apos;s
            origin (your Vercel URL), not the Render URL — comma-separated for multiple URLs. Then redeploy Render.
          </span>
        )}
      </div>

      <Navbar
        onSearchFocus={() => {
          document.getElementById("market-search")?.focus();
          document.getElementById("market")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <main>
        <section id="home" className="relative overflow-hidden px-4 pb-20 pt-14 md:px-6">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(46,125,50,0.15),_transparent_55%)]" />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-6"
            >
              <Badge>AI Powered. Ethiopia Focused.</Badge>
              <h1 className="heading-font text-4xl font-extrabold leading-tight text-brand-text sm:text-5xl">
                Smarter Farming. Stronger Futures.
              </h1>
              <p className="max-w-xl text-lg text-brand-muted">
                YegnaFarm AI connects farmers, buyers, and experts with local insights, market intelligence, and practical
                support — powered by your live Render API.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button as="a" href="#signup">
                  Get Started Free
                </Button>
                <Button as="a" href="#market" variant="outline">
                  Explore Marketplace
                </Button>
                <Button as="a" href="#upload" variant="outline">
                  Photo diagnosis
                </Button>
              </div>
              <p className="text-sm font-medium text-brand-muted">Trusted by farmers, buyers, and experts across Ethiopia</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="/assets/hero.jpg"
                alt="Smiling farmer holding a tablet in a crop field"
                className="h-[420px] w-full rounded-3xl object-cover shadow-2xl"
              />
              <div className="absolute -left-4 top-6 rounded-2xl bg-white/95 px-4 py-2 text-sm font-semibold shadow-lg">
                Live market data
              </div>
              <div className="absolute -right-4 top-24 rounded-2xl bg-white/95 px-4 py-2 text-sm font-semibold shadow-lg">
                AI + expert queue
              </div>
              <div className="absolute bottom-6 left-6 rounded-2xl bg-white/95 px-4 py-2 text-sm font-semibold shadow-lg">
                Guides from /api/v1/guides
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-12 md:px-6">
          <div className="mx-auto grid w-full max-w-7xl gap-5 md:grid-cols-3">
            {[
              ["For Farmers", "Better field decisions with practical AI guidance.", Sprout],
              ["For Buyers", "Reliable sourcing and transparent market information.", Wheat],
              ["For Experts", "Reach more farmers and share verified recommendations.", GraduationCap],
            ].map(([title, body, Icon]) => (
              <article
                key={title}
                className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <Icon className="mb-4 text-brand-primary" />
                <h3 className="heading-font text-xl font-semibold text-brand-text">{title}</h3>
                <p className="mt-2 text-brand-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="px-4 py-16 md:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="heading-font text-3xl font-bold text-brand-text">Services</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(({ title, icon: Icon }) => (
                <motion.article
                  key={title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Icon className="mb-3 text-brand-primary" />
                  <h3 className="heading-font text-lg font-semibold text-brand-text">{title}</h3>
                  <p className="mt-1 text-sm text-brand-muted">Connected to your YegnaFarm backend when deployed.</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <AuthSection onSessionChange={setCurrentUser} />

        <section id="guides" className="bg-white/60 px-4 py-16 md:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="heading-font text-3xl font-bold text-brand-text">Guides</h2>
            <p className="mt-2 text-brand-muted">Loaded from GET /api/v1/guides (database bundle).</p>
            {guidesLoading ? (
              <p className="mt-6 text-sm text-brand-muted">Loading guides…</p>
            ) : guidesFamilies.length === 0 ? (
              <p className="mt-6 text-sm text-brand-muted">No guide families returned — run DB seed/migrate on Render.</p>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {guidesFamilies.map((family) => (
                  <article
                    key={family}
                    className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <h3 className="heading-font text-lg font-semibold text-brand-text">{family}</h3>
                    <p className="mt-2 text-sm text-brand-muted">Crop families and tips from your API.</p>
                    <Button as="a" href="#chat" variant="outline" className="mt-4 w-full">
                      Ask about this guide
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="market" className="px-4 py-16 md:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="heading-font text-3xl font-bold text-brand-text">Marketplace Preview</h2>
            <p className="mt-2 text-sm text-brand-muted">Data from GET /market-data</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              <Input
                id="market-search"
                placeholder="Search product or location..."
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
              />
              <Select value={marketType} onChange={(e) => setMarketType(e.target.value)}>
                <option value="all">All types</option>
                <option value="crops">Crops</option>
                <option value="livestock">Livestock</option>
              </Select>
              <div className="flex items-center text-sm text-brand-muted md:col-span-2">
                {marketLoading ? "Loading listings…" : `${filteredProducts.length} listing(s)`}
              </div>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_320px]">
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
                {filteredProducts.length === 0 && !marketLoading ? (
                  <p className="col-span-full text-sm text-brand-muted">No products match. Check DB seed or filters.</p>
                ) : (
                  filteredProducts.map((product) => <ProductCard key={`${product.name}-${product.location}`} product={product} />)
                )}
              </div>
              <aside className="rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary p-6 text-white shadow-xl">
                <h3 className="heading-font text-2xl font-bold">Join thousands of buyers and sellers</h3>
                <p className="mt-3 text-sm text-green-50">Use the full market tools on this page or the API.</p>
                <Button as="a" href="#signup" className="mt-6 w-full">
                  Create seller account
                </Button>
              </aside>
            </div>
          </div>
        </section>

        <section id="experts" className="bg-white/60 px-4 py-16 md:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="heading-font text-3xl font-bold text-brand-text">Meet Our Experts</h2>
            <p className="mt-2 text-sm text-brand-muted">Showcase cards — book flow uses signup + dashboard on backend.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {experts.map((expert) => (
                <ExpertCard key={expert.name} expert={expert} />
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Button as="a" href="#dashboard" variant="secondary">
                Open dashboard
              </Button>
            </div>
          </div>
        </section>

        <section id="dashboard" className="scroll-mt-24 bg-white/70 px-4 py-16 md:px-6">
          <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {statItems.map(([label, value]) => (
                <StatsCard key={label} label={label} value={value} />
              ))}
            </div>
            <article className="rounded-3xl border border-green-100 bg-white/80 p-7 shadow-lg backdrop-blur">
              <Badge>{currentUser ? dashboardTitle : "Account"}</Badge>
              {currentUser ? (
                <>
                  <p className="mt-4 text-lg font-medium text-brand-text">
                    Welcome back, {currentUser.fullName || currentUser.email}. This is your {dashboardTitle.toLowerCase()}.
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm text-brand-muted sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-brand-text">Role</dt>
                      <dd>{currentUser.role || "farmer"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-brand-text">Region</dt>
                      <dd>{currentUser.region || "Not set"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-brand-text">Verified expert</dt>
                      <dd>{currentUser.verifiedExpert ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-brand-text">Email</dt>
                      <dd>{currentUser.email}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm text-brand-muted">
                    {isExpertRole(currentUser.role)
                      ? "The expert queue lives just below this card, so expert accounts can answer questions without leaving the SPA."
                      : "Your account summary lives here, and the old dashboard route now resolves to the same frontend path."}
                  </p>
                  {isExpertRole(currentUser.role) ? (
                    <Button as="a" href="#expert-dashboard" variant="secondary" className="mt-5 w-full">
                      Open expert queue
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-4 text-lg font-medium text-brand-text">
                    Create an account or sign in to save questions, track activity, and unlock expert tools.
                  </p>
                  <p className="mt-4 text-sm text-brand-muted">
                    Dashboard stats load from GET /dashboard-stats when the database is connected.
                  </p>
                </>
              )}
            </article>
          </div>
        </section>

        <section id="expert-dashboard" className="bg-white/60 px-4 py-16 md:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge>Expert dashboard</Badge>
                <h2 className="heading-font mt-3 text-3xl font-bold text-brand-text">Pending questions queue</h2>
                <p className="mt-2 max-w-2xl text-sm text-brand-muted">
                  Expert and admin accounts can review farmer questions, answer them, and keep the support flow inside the
                  same frontend path.
                </p>
              </div>
              {isExpertRole(currentUser?.role) ? (
                <Button type="button" variant="outline" onClick={loadExpertQueue}>
                  Refresh queue
                </Button>
              ) : (
                <Button as="a" href="#signup" variant="outline">
                  Sign in to access
                </Button>
              )}
            </div>

            <div className="mt-8 rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
              {isExpertRole(currentUser?.role) ? (
                <>
                  {expertQuestionsLoading ? (
                    <p className="text-sm text-brand-muted">Loading expert queue…</p>
                  ) : expertQuestions.length === 0 ? (
                    <p className="text-sm text-brand-muted">No pending questions right now.</p>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {expertQuestions.map((question) => {
                        const asker = question.farmer_name || question.guest_name || question.farmer_email || "Farmer";
                        const cropHint = question.crop_hint ? (
                          <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                            {question.crop_hint}
                          </span>
                        ) : null;
                        const draft = expertAnswerDrafts[question.id] || "";

                        return (
                          <article
                            key={question.id}
                            className="rounded-3xl border border-green-100 bg-green-50/60 p-5 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="heading-font text-lg font-semibold text-brand-text">{asker}</h3>
                                <p className="text-xs text-brand-muted">
                                  {question.created_at ? new Date(question.created_at).toLocaleString() : "New question"}
                                </p>
                              </div>
                              {cropHint}
                            </div>
                            <p className="mt-4 text-sm text-brand-text">{question.body}</p>
                            <div className="mt-4 space-y-3">
                              <textarea
                                className="min-h-[110px] w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted/80 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                                placeholder="Write your expert answer..."
                                value={draft}
                                onChange={(event) =>
                                  setExpertAnswerDrafts((current) => ({
                                    ...current,
                                    [question.id]: event.target.value,
                                  }))
                                }
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                className="w-full"
                                onClick={() => submitExpertAnswer(question.id)}
                              >
                                Send answer
                              </Button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                  {expertQuestionsStatus ? <p className="mt-4 text-sm text-brand-muted">{expertQuestionsStatus}</p> : null}
                </>
              ) : (
                <p className="text-sm text-brand-muted">
                  Sign in as an expert or admin to see the question queue and answer incoming farmer requests.
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="chat" className="px-4 py-16 md:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="heading-font text-3xl font-bold text-brand-text">Ask AI & experts</h2>
            <p className="mt-2 text-sm text-brand-muted">
              AI: POST /api/v1/ai/chat (fallback /ask). Expert queue: POST /ask-question.
            </p>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
                <h3 className="heading-font text-lg font-semibold text-brand-text">Expert question</h3>
                <form className="mt-4 space-y-3" onSubmit={submitExpertQuestion}>
                  <Input placeholder="Your name" value={qName} onChange={(e) => setQName(e.target.value)} />
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted/80 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Describe your farm issue…"
                    value={qBody}
                    onChange={(e) => setQBody(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="secondary" className="w-full" disabled={qBusy}>
                    {qBusy ? "Sending…" : "Submit to experts"}
                  </Button>
                  {qStatus ? <p className="text-sm text-brand-muted">{qStatus}</p> : null}
                </form>
              </article>

              <article className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
                <h3 className="heading-font text-lg font-semibold text-brand-text">AI quick chat</h3>
                <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-xl bg-green-50/80 p-3 text-sm">
                  {aiMessages.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                      <span
                        className={`inline-block rounded-2xl px-3 py-2 ${
                          m.role === "user" ? "bg-brand-primary text-white" : "bg-white text-brand-text shadow-sm"
                        }`}
                      >
                        {m.text}
                      </span>
                    </div>
                  ))}
                  {aiBusy ? (
                    <div className="flex items-center gap-2 text-brand-muted">
                      <Loader2 className="animate-spin" size={18} /> Thinking…
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Ask the AI…"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), sendAi())}
                  />
                  <Button type="button" onClick={sendAi} disabled={aiBusy}>
                    Send
                  </Button>
                </div>
                <Button as="a" href="#upload" variant="outline" className="mt-3 w-full">
                  Try photo diagnosis
                </Button>
              </article>
            </div>
          </div>
        </section>

        <UploadSection />

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-12 text-center text-white">
            <h2 className="heading-font text-4xl font-bold">Ready to grow smarter?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-green-50">
              Same backend powers this React UI, and the retired HTML routes now point back here.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button as="a" href="#signup">
                Get Started Free
              </Button>
              <Button as="a" href="#market" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10">
                Explore Marketplace
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-green-100 bg-white px-4 py-12 md:px-6">
        <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="heading-font text-2xl font-bold text-brand-primary">YegnaFarm AI</p>
            <p className="mt-2 text-sm text-brand-muted">Frontend: Vercel · API: Render · Set VITE_API_URL + FRONTEND_ORIGIN for CORS.</p>
            <p className="mt-2 text-xs text-brand-muted">
              API base: {API_BASE || "(dev proxy → see vite.config)"} · Health:{" "}
              <a className="underline" href={apiUrl("/health")} target="_blank" rel="noreferrer">
                /health
              </a>
            </p>
          </div>
          {[
            ["Platform", [
              ["Market", "#market"],
              ["Upload / detect", "#upload"],
              ["Health", apiUrl("/health")],
            ]],
            ["Account", [
              ["Sign up", "#signup"],
              ["Dashboard", "#dashboard"],
            ]],
          ].map(([title, links]) => (
            <div key={title}>
              <p className="heading-font text-sm font-semibold text-brand-text">{title}</p>
              <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="hover:text-brand-primary">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="heading-font text-sm font-semibold text-brand-text">Newsletter</p>
            <div className="mt-3 space-y-2">
              <Input placeholder="Enter your email" type="email" />
              <Button variant="secondary" className="w-full" type="button">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
