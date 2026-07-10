# Deployment Guide

CarVista can be deployed to **Vercel**, **Railway**, or any Docker host. All options need a
PostgreSQL database and the environment variables listed in [`.env.example`](../.env.example).

---

## 1. Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ (prod) | Your public URL, e.g. `https://carvista.com.gh` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Google sign-in |
| `EMAIL_SERVER_*` / `EMAIL_FROM` | optional | SMTP for verification & reset emails |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` | optional | Payments |
| `NEXT_PUBLIC_CLOUDINARY_*` / `CLOUDINARY_*` | optional | Media uploads |
| `NEXT_PUBLIC_APP_URL` | ✅ | Used for canonical URLs, sitemap, emails |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | optional | Click-to-chat number |

---

## 2. Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel, **Import Project** → select the repo.
3. Add the environment variables above (Project → Settings → Environment Variables).
4. **Build command** is already `prisma generate && next build` (from `package.json`).
5. Provision a Postgres database (Neon, Supabase, or Vercel Postgres) and set `DATABASE_URL`.
6. After the first deploy, run migrations against the production DB:
   ```bash
   npx prisma migrate deploy
   npm run db:seed        # optional: seed reference data (brands, duty rates…)
   ```
   You can run these locally with the production `DATABASE_URL`, or via a one-off Vercel job.

> **Tip:** Set `.npmrc` `legacy-peer-deps=true` is committed, so Vercel installs cleanly.

---

## 3. Deploy to Railway

1. Create a new Railway project and add a **PostgreSQL** plugin.
2. Add a service from your GitHub repo.
3. Railway injects `DATABASE_URL` automatically — add the remaining env vars.
4. Set the **start command** to `npm run start` and **build** to `npm run build`.
5. Add a deploy hook / one-off command to run `npx prisma migrate deploy && npm run db:seed`.

---

## 4. Deploy with Docker

The repo ships a multi-stage `Dockerfile` (Next.js standalone output) and a
`docker-compose.yml` that also starts PostgreSQL.

```bash
# Build & run app + database
docker compose up --build -d

# Run migrations + seed inside the app container
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

The app is served on **http://localhost:3000**.

To build the image standalone:

```bash
docker build -t carvista .
docker run -p 3000:3000 --env-file .env carvista
```

> `next.config.mjs` should set `output: "standalone"` for the smallest Docker image. It is left
> at the default for flexibility; uncomment the line in the Dockerfile comments if you enable it.

---

## 5. Post-deploy checklist

- [ ] `DATABASE_URL` points to production DB and migrations are applied
- [ ] `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` set to the public domain
- [ ] Google OAuth redirect URI added: `https://YOUR_DOMAIN/api/auth/callback/google`
- [ ] SMTP credentials verified (test registration email)
- [ ] Paystack keys set and webhook configured (if using payments)
- [ ] `robots.txt` and `sitemap.xml` reachable
- [ ] Seed reference data (brands, categories, duty & shipping rates)

---

## 6. Database migrations

```bash
# Create a new migration during development
npm run prisma:migrate -- --name add_feature

# Apply pending migrations in production
npm run prisma:deploy
```
