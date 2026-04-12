# Deploy YegnaFarm (GitHub + hosting)

Your app is a **Node.js + Express + PostgreSQL** project. That is **not** the same as a static site: the database and API must run somewhere with a real server (or serverless with limits).

## 1. Push to GitHub

From the project folder (PowerShell):

```powershell
git init
git add .
git status
git commit -m "Initial commit: YegnaFarm AI"
```

Create an empty repo on GitHub (no README if you already have one locally), then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Do **not** commit `.env` (it is in `.gitignore`). Secrets live only on the host.

---

## 2. PostgreSQL (cloud — no Docker)

Use **Supabase**, **Neon**, or **Render Postgres**. Copy the **connection string** into the host’s environment as `DATABASE_URL`.

After the first deploy (or from your PC with that URL in `.env`):

```bash
npm run migrate
npm run seed
```

On a host without a shell, run migrate/seed once from your machine pointing at the **production** `DATABASE_URL`, or add a one-off Render “Shell” / local script.

---

## 3. Recommended: **Render** (full app, one service)

1. [render.com](https://render.com) → sign in with GitHub.  
2. **New + Web Service** → select this repo.  
3. **Build:** `npm install` · **Start:** `npm start`  
4. **Environment variables:**

   | Name | Example |
   |------|---------|
   | `DATABASE_URL` | `postgres://...` |
   | `JWT_SECRET` | long random string (16+ chars) |
   | `OPENAI_API_KEY` | optional |
   | `FRONTEND_ORIGIN` | `https://your-service.onrender.com` |

5. Deploy. Open the `.onrender.com` URL.

**Pros:** Same layout as local dev, file uploads work the same (within disk limits), no Vercel routing tricks.

---

## 4. **Vercel** (optional)

Vercel runs your API as **serverless functions**. This repo includes `api/index.js` + `vercel.json` so that:

- **Static** pages and assets (`/`, `/css/…`, `/js/…`, HTML files) are served by Vercel’s CDN.  
- **API** traffic goes to Express: `/api/*`, plus legacy paths `/ask`, `/market-data`, `/dashboard-stats`, `/detect`, `/ask-question`.

**Caveats**

- **Uploaded images** (`/uploads`, `/detect`) do not persist on serverless disks; use S3 / Supabase Storage for production.  
- Cold starts and **execution time limits** apply on the free tier.  
- Set the same env vars as on Render (`DATABASE_URL`, `JWT_SECRET`, etc.).  
- Set `FRONTEND_ORIGIN` to your Vercel URL, e.g. `https://your-app.vercel.app`.

**Steps**

1. [vercel.com](https://vercel.com) → Import Git Repository.  
2. Framework preset: **Other**; root directory: repo root.  
3. Add environment variables.  
4. Deploy.

---

## 5. “Frontend on Vercel, API on Render” (advanced)

- Host the **API** on Render (this repo or API-only).  
- Host **static HTML** on Vercel from the same repo **or** a `public/` export.  
- Set `FRONTEND_ORIGIN` on the API to the Vercel URL.  
- Change the browser `fetch` base URL to the Render API URL (or use a single env-injected script).  

Only needed if you insist on Vercel for pages but want a long-running API elsewhere.

---

## Checklist

- [ ] GitHub repo created and code pushed  
- [ ] `DATABASE_URL` + `JWT_SECRET` set on the host  
- [ ] `npm run migrate` + `npm run seed` run against that database  
- [ ] `npm run create-admin` (optional) with production `DATABASE_URL`  
- [ ] `FRONTEND_ORIGIN` matches your real site URL (for CORS)
