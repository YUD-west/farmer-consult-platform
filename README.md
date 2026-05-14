# YegnaFarm AI

Digital agricultural support for Ethiopia: guides, market listings, farmer questions, hybrid AI (guides + optional OpenAI + cache), expert workflow scaffolding, and PWA-friendly static pages.

## GitHub & hosting

Push this folder to GitHub, then deploy:

- **Easiest full-stack (recommended):** [Render](https://render.com) — connect the repo, set `DATABASE_URL` + `JWT_SECRET`, run migrate/seed. See `render.yaml`.
- **Vercel:** Import the repo; `vercel.json` + `api/index.js` route API traffic only (static HTML/CSS/JS stay on the CDN). Read caveats in **`docs/DEPLOY.md`**.
- Step-by-step (Git init, env vars, checklist): **`docs/DEPLOY.md`**.

## Quick start (local)

You need **PostgreSQL** somewhere and a **`DATABASE_URL`**. If Docker is not an option, use **Option A** (recommended) or **Option B**.

### Option A — Cloud Postgres (no Docker, no local install)

Free tiers work fine for development.

1. **Supabase** (simple UI): [supabase.com](https://supabase.com) → New project → wait until the database is ready → **Project Settings → Database → Connection string → URI**. Copy the string and replace `[YOUR-PASSWORD]` with your database password.  
2. **Neon** (serverless): [neon.tech](https://neon.tech) → New project → copy the **connection string** they show.  
3. **Railway / Render / ElephantSQL** — create a Postgres instance and copy the **Postgres URL** they provide.

Put the URI in `.env` as `DATABASE_URL=...`. The app **turns on TLS automatically** for non-`localhost` hosts (see `src/db/pool.js`). If your provider still fails to connect, set `DATABASE_SSL=true` in `.env`.

Then continue from **Environment** below.

### Option B — PostgreSQL installed on Windows (no Docker)

1. Download the installer: [PostgreSQL Windows downloads](https://www.postgresql.org/download/windows/) (or use the EDB installer linked there).  
2. During setup, note the **password** for user `postgres` and keep the default port **5432**.  
3. Open **SQL Shell (psql)** or **pgAdmin** and run:

   ```sql
   CREATE DATABASE yegnafarm;
   ```

4. In `.env`:

   ```env
   DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/yegnafarm
   ```

   If SSL errors appear on localhost (rare), set `DATABASE_SSL=false`.

### Option C — Docker (if you use it later)

```bash
docker compose up -d
```

Use `DATABASE_URL=postgres://postgres:dev@localhost:5432/yegnafarm` as in `.env.example`.

---

### Environment

Copy `.env.example` to `.env` and set at least:

- `DATABASE_URL` — from Option A, B, or C  
- `JWT_SECRET` — a long random string (16+ characters)  
- Optional: `OPENAI_API_KEY`, `FRONTEND_ORIGIN` (production CORS)

### Schema & seed

From the project folder (same machine where Node runs — it must reach the database URL):

```bash
npm run migrate
npm run seed
```

### Admin user (optional)

PowerShell:

```powershell
$env:ADMIN_EMAIL="you@example.com"
$env:ADMIN_PASSWORD="your-secure-password"
npm run create-admin
```

### Experts — promote in SQL (until admin UI exists)

Run in Supabase SQL editor, pgAdmin, or `psql`:

```sql
UPDATE users SET role = 'expert', verified_expert = TRUE WHERE email = 'expert@example.com';
```

### Run

```bash
npm start
```

Open `http://localhost:3000/`

Health checks:

- `GET /health` -> app process is alive
- `GET /health/db` -> app can reach PostgreSQL

Before deployment, run:

```bash
npm run preflight
```

---

## Folder structure (new modular backend)

```
├── server.js                 # Entry: env checks + listen
├── src/
│   ├── expressApp.js         # Express factory (not named app.js — Vercel reserves that path)
│   ├── controllers/          # HTTP handlers (thin)
│   ├── middleware/           # auth, validate (Zod), errors, multer uploads
│   ├── routes/
│   │   ├── legacy.routes.js  # /ask, /ask-question, /market-data, /dashboard-stats, /detect
│   │   └── v1/               # Versioned JSON API
│   ├── repositories/         # SQL data access (pg)
│   ├── services/             # AI, guide matching, recommendations, cache
│   ├── validation/schemas.js
│   └── db/
│       ├── pool.js
│       └── schema.sql
├── scripts/
│   ├── migrate.js
│   ├── seed-from-json.js
│   └── create-admin.js
├── data/                     # Legacy JSON (seed source)
├── js/                       # Front-end (incremental upgrade)
├── locales/                  # Future: split i18n (en.json started)
└── docker-compose.yml
```

---

## API reference (`/api/v1`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | — | Farmer signup (JWT) |
| POST | `/auth/login` | — | Login |
| GET | `/auth/me` | JWT | Profile |
| GET | `/guides` | — | Structured guides (same shape as old JSON) |
| GET | `/guides/:slug` | — | Single guide detail |
| POST | `/ai/chat` | — | Hybrid Q&A (guides → cache → OpenAI) |
| GET | `/ai/recommendations` | — | Rule-based crop/season hints |
| GET | `/ai/onboarding` | — | Onboarding steps JSON |
| GET | `/market` | — | List products (`region`, `type`, `q`) |
| POST | `/market` | JWT farmer/expert/admin | Create listing |
| PATCH | `/market/:id` | JWT owner or admin | Update listing |
| POST | `/questions` | Optional JWT | Farmer question (guest name if anonymous) |
| GET | `/questions` | expert/admin | Queue |
| GET | `/questions/:id` | expert/admin | Detail + answers |
| POST | `/questions/:id/answers` | expert/admin | Post answer |
| POST | `/questions/answers/:answerId/ratings` | JWT | Rate answer (1–5) |
| GET | `/dashboard/stats` | expert/admin | Live metrics |
| GET | `/analytics/overview` | admin | Basic aggregates |
| POST | `/detect/pest` | — | Image upload + **placeholder** response for future model |

**Legacy paths** still supported for existing HTML: `POST /ask`, `POST /ask-question`, `GET /market-data`, `GET /dashboard-stats`, `POST /detect`.

---

## Security & ops

- **Helmet**, **CORS** (`FRONTEND_ORIGIN`), **global rate limit** + tighter limits on `/auth/*`.
- **JWT** for authenticated routes; passwords hashed with **bcrypt** (cost 12).
- **Zod** validation on API bodies/queries.
- **Morgan** request logging (disabled when `NODE_ENV=test`).

---

## Step-by-step implementation plan (remaining work)

Completed in this upgrade: PostgreSQL schema, seed from JSON, modular API v1, JWT auth, hybrid AI + cache table, legacy compatibility, hero UX + toast/API helpers, SW cache bump + network-first for `/api/*`, guides/market loaded from DB via existing pages.

| Phase | Focus |
|-------|--------|
| **1** | **Expert UI**: dashboard lists pending questions, answer form, call `POST /questions/:id/answers`; show `verified_expert` badge from `/auth/me`. |
| **2** | **Signup/login pages** wired to `YegnaAPI` + token storage; protect `dashboard.html` client-side redirect if not expert/admin. |
| **3** | **Marketplace**: seller “My listings”, image upload to `/detect` or dedicated `/market/image`, WhatsApp `wa.me` links, **Chart.js** price history (new table `price_observations`). |
| **4** | **i18n**: move all `translations` in `app.js` to `locales/{en,am,om}.json`, lazy-load; keep language switcher. |
| **5** | **Offline sync**: IndexedDB queue for `POST /questions` when offline; flush on `online` event. |
| **6** | **Vision API**: replace `POST /api/v1/detect/pest` stub with your model service + signed webhooks. |
| **7** | **Deploy**: e.g. API on Railway/Render/Fly + managed Postgres; static site on Vercel/Netlify with `FRONTEND_ORIGIN`; enable HTTPS for camera on real devices. |

---

## Product notes

- **Trust**: `verified_expert` is boolean on `users`; ratings on `expert_answers` support a future reputation layer.
- **Cost**: AI responses are cached (7-day TTL) keyed by normalized question + region + language.
- **Ethiopia context**: System prompt and recommendations service are region-aware; extend with woreda/elevation when you have data.

---

## License

ISC (same as `package.json`).
