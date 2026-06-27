# Deployment Guide

This project deploys as two separate services:
- **Backend** (Express API) → [Render](https://render.com)
- **Frontend** (Vite React app) → [Vercel](https://vercel.com)

Never commit your real `Backend/.env` file. Use `Backend/.env.example` and
`frontend/.env.example` as templates — fill the real values directly in the
Render/Vercel dashboards instead.

---

## 1. Push to GitHub How to push in to github 
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`node_modules`, `dist`, and `.env` are already excluded via `.gitignore` — both
Render and Vercel run their own `npm install` on Linux, so don't upload your
local `node_modules` (they often contain OS-specific binaries that won't run
on the deploy servers).

---

## 2. Deploy the backend on Render

1. Go to Render → **New** → **Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory**: `Backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. Add these **Environment Variables** (Settings → Environment), using your
   real values:

   | Key | Value |
   |---|---|
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |
   | `DB_URL` | your MongoDB Atlas connection string |
   | `SECRET_KEY` | a long random string (e.g. `openssl rand -base64 32`) |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
   | `RAZORPAY_KEY_ID` | from Razorpay dashboard |
   | `RAZORPAY_KEY_SECRET` | from Razorpay dashboard |
   | `FRONTEND_URL` | your Vercel URL, e.g. `https://your-app.vercel.app` (set this *after* step 3 — you can come back and edit it) |

4. Deploy. Once live, note your backend URL, e.g.
   `https://artisan-marketplace-backend.onrender.com`.

**MongoDB Atlas Network Access**: go to Atlas → Network Access → Add IP
Address → allow `0.0.0.0/0` (Render's outbound IPs are dynamic), or add
Render's specific IPs if you prefer tighter security.

---

## 3. Deploy the frontend on Vercel

1. Go to Vercel → **Add New** → **Project** → import the same GitHub repo.
2. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
3. Add an **Environment Variable**:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | your Render backend URL, e.g. `https://artisan-marketplace-backend.onrender.com` |

4. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.

The included `vercel.json` rewrites all paths to `index.html` so client-side
routes (`/login`, `/cart`, `/product/:id`, etc.) work on refresh/direct visit.

---

## 4. Connect the two

1. Copy your Vercel URL.
2. Back in Render → your backend service → Environment → set `FRONTEND_URL`
   to that Vercel URL (comma-separate multiple values if you add a custom
   domain later) → save (this triggers a redeploy).
3. Visit your Vercel site and test register/login — cookies should now work
   cross-site because:
   - `NODE_ENV=production` makes the login cookie `secure` + `sameSite: none`.
   - `app.set("trust proxy", 1)` in `server.js` makes that work correctly
     behind Render's proxy.
   - The CORS check in `server.js` allows any `*.vercel.app` origin plus
     whatever you put in `FRONTEND_URL`.

---

## 5. Common issues after deploy

- **CORS error in browser console**: the frontend's origin isn't in the
  allow-list. Double check `FRONTEND_URL` on Render matches your exact
  Vercel URL (including `https://`, no trailing slash).
- **Login works but session doesn't persist**: confirm `NODE_ENV=production`
  is set on Render — without it, cookies are `sameSite: lax` and won't be
  sent cross-site.
- **500 on profile/KYC save**: Cloudinary env vars are missing/incorrect on
  Render — re-check `CLOUDINARY_*` values.
- **Mongo connection errors on Render**: check Atlas Network Access allows
  `0.0.0.0/0`, the cluster isn't paused, and `DB_URL` credentials are correct.
- **Razorpay errors**: confirm `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are
  set on Render, and that the frontend loads
  `https://checkout.razorpay.com/v1/checkout.js` (already in `index.html`).
