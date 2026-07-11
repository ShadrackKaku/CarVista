# Deploy CarVista to Vercel — Step by Step

The simplest way to take CarVista live. Total time: ~15 minutes. No terminal required.

> Stack: **Vercel** (hosting) + **Neon** (PostgreSQL database) + optional Cloudinary/Paystack.

---

## Step 1 — Create a free database (Neon)

1. Go to **https://neon.tech** and sign up (free).
2. **Create a project** → name it `carvista`.
3. On the project dashboard, copy the **connection string**. It looks like:
   ```
   postgresql://user:password@ep-xxxx.eu-central-1.aws.neon.tech/carvista?sslmode=require
   ```
4. Keep this — it's your `DATABASE_URL`.

*(Supabase works the same way — use its "Connection string → URI" value.)*

---

## Step 2 — Import the project into Vercel

1. Go to **https://vercel.com** and sign up **with your GitHub account**.
2. Click **Add New… → Project**.
3. Find **`ShadrackKaku/CarVista`** and click **Import**.
4. Vercel auto-detects Next.js — leave the build settings as they are (a `vercel.json` is included
   that runs database migrations automatically on each deploy).

---

## Step 3 — Add environment variables

Before deploying, expand **Environment Variables** and add these (minimum to run):

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon string from Step 1 |
| `NEXTAUTH_SECRET` | a long random string — generate at https://generate-secret.vercel.app/32 |
| `NEXTAUTH_URL` | leave blank for now, or `https://carvista.vercel.app` (update after first deploy) |
| `NEXT_PUBLIC_APP_URL` | same as `NEXTAUTH_URL` |

Then click **Deploy**. Vercel builds the app and creates all database tables automatically. 🎉

---

## Step 4 — Point the URLs at your live site

1. After the first deploy, Vercel shows your live URL, e.g. `https://carvista-xyz.vercel.app`.
2. Go to **Project → Settings → Environment Variables** and set **`NEXTAUTH_URL`** and
   **`NEXT_PUBLIC_APP_URL`** to that exact URL.
3. **Redeploy** (Deployments tab → ⋯ → Redeploy) so the change takes effect.

---

## Step 5 — Seed starter data (one time, optional)

The tables are created automatically, but they start empty. To load reference data (brands,
part categories, duty & shipping rates, and demo accounts):

**Easiest way — from your computer, once:**
```bash
# in the project folder, with the Neon DATABASE_URL in a local .env file
npm install
npm run db:seed
```

This creates the demo logins (change these passwords in production!):
- Admin: `admin@carvista.com.gh` / `Password123`

---

## Step 6 (optional) — Turn on the extras

Add these environment variables in Vercel when you're ready, then redeploy:

| Feature | Variables |
|---|---|
| **Google login** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (redirect URL: `https://YOURSITE/api/auth/callback/google`) |
| **Emails** | `EMAIL_SERVER_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM` (e.g. via Resend or SendGrid) |
| **Payments** | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY` |
| **Image uploads** | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

---

## Step 7 (optional) — Custom domain

1. Buy a domain (Namecheap, GoDaddy, or a Ghana registrar).
2. Vercel → **Project → Settings → Domains** → add `carvista.com.gh` → follow the DNS steps.
3. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the new domain and redeploy.

---

## From now on

Every time you push to the **`main`** branch (or merge a PR), Vercel **automatically rebuilds and
redeploys**. That's your whole release process. ✅

**Troubleshooting**
- *Build fails on database step* → check `DATABASE_URL` is correct and the Neon project is active.
- *Login doesn't work* → make sure `NEXTAUTH_URL` matches your real site URL exactly.
- *Images don't show* → the sample images load from Unsplash; for your own uploads, configure Cloudinary.
