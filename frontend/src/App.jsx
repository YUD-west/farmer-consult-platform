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
import Badge from "./components/ui/Badge";
import Button from "./components/ui/Button";
import { Input, Select } from "./components/ui/Input";
import { API_BASE, apiGetJson, apiPostJson, apiUrl, externalPage, postChat } from "./lib/api";

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

function resolveImageUrl(raw) {
  if (!raw) return PLACEHOLDER_IMG;
  const s = String(raw).trim();
  if (!s) return PLACEHOLDER_IMG;
  if (s.startsWith("http")) return s;
  const path = s.replace(/^\//, "");
  if (API_BASE) return `${API_BASE}/${path}`;
  return `/${path}`;
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

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await apiGetJson("/health");
        if (!cancelled) setHealthOk(true);
      } catch {
        if (!cancelled) setHealthOk(false);
      }
      try {
        const d = await apiGetJson("/health/db");
        if (!cancelled) setDbOk(d.status === "ok" && d.database === "reachable");
      } catch {
        if (!cancelled) setDbOk(false);
      }
      try {
        const g = await apiGetJson("/api/v1/guides");
        if (!cancelled) setGuidesFamilies(Array.isArray(g.families) ? g.families : []);
      } catch {
        if (!cancelled) setGuidesFamilies([]);
      } finally {
        if (!cancelled) setGuidesLoading(false);
      }
      try {
        const m = await apiGetJson("/market-data");
        if (!cancelled && Array.isArray(m)) setMarketRaw(m);
      } catch {
        /* use empty; UI still works */
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
      try {
        const s = await apiGetJson("/dashboard-stats");
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

  const signupHref = externalPage("/signup.html");
  const uploadHref = externalPage("/upload.html");

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
                <Button as="a" href={signupHref}>
                  Get Started Free
                </Button>
                <Button as="a" href="#market" variant="outline">
                  Explore Marketplace
                </Button>
                <Button as="a" href={uploadHref} variant="outline">
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
                src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1200&q=80"
                alt="Farmer using smartphone in field"
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
                    <Button as="a" href={externalPage("/crop-guide.html")} variant="outline" className="mt-4 w-full">
                      Open legacy guide hub
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
                <p className="mt-3 text-sm text-green-50">Use the full market tools on the classic site or API.</p>
                <Button as="a" href={externalPage("/market.html")} className="mt-6 w-full">
                  Open full market page
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
              <Button as="a" href={externalPage("/dashboard.html")} variant="secondary">
                Expert dashboard
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white/70 px-4 py-16 md:px-6">
          <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {statItems.map(([label, value]) => (
                <StatsCard key={label} label={label} value={value} />
              ))}
            </div>
            <article className="rounded-3xl border border-green-100 bg-white/80 p-7 shadow-lg backdrop-blur">
              <Badge>Platform activity</Badge>
              <p className="mt-4 text-lg font-medium text-brand-text">
                Dashboard stats load from GET /dashboard-stats when the database is connected.
              </p>
              <p className="mt-4 text-sm text-brand-muted">If numbers show placeholders, API is up but stats endpoint returned empty.</p>
            </article>
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
                <Button as="a" href={externalPage("/chat.html")} variant="outline" className="mt-3 w-full">
                  Open full chat page
                </Button>
              </article>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-12 text-center text-white">
            <h2 className="heading-font text-4xl font-bold">Ready to grow smarter?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-green-50">Same backend powers this React UI and the classic HTML pages.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button as="a" href={signupHref}>
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
              ["Market (classic)", externalPage("/market.html")],
              ["Upload / detect", uploadHref],
              ["Health", apiUrl("/health")],
            ]],
            ["Account", [
              ["Sign up", signupHref],
              ["Dashboard", externalPage("/dashboard.html")],
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
