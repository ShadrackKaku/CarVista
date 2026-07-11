# CarVista — How It Works & How to Run It (Plain-English Guide)

This guide explains, in non-jargon terms, **how the project works, what each technology does, how
to take it live, how to maintain it, and how to add new features.** Read it top to bottom once —
after that it's a reference you can jump around in.

---

## 1. The big picture — how a web app like this works

Think of CarVista as a **restaurant**:

- **The dining room (Frontend)** — what customers see and touch: pages, buttons, forms, the car
  listings. This runs in the visitor's **web browser**.
- **The kitchen (Backend)** — where orders are actually processed: checking passwords, saving an
  order, calculating import duty. This runs on a **server** (a computer in the cloud).
- **The pantry (Database)** — where everything is stored permanently: users, vehicles, parts,
  orders. Nothing is "remembered" without it.

When someone visits your site, this happens in about half a second:

```
Visitor's browser  →  asks the Server for a page
Server (kitchen)   →  maybe asks the Database for data (e.g. "give me all Toyotas")
Database           →  returns the data
Server             →  builds the page and sends it back
Browser            →  displays it
```

Next.js (our framework) is special because it can do the "kitchen" and "dining room" work
**together**, which makes the site fast and good for Google search.

---

## 2. The technology stack — what each piece does

| Technology | Restaurant analogy | What it actually does in CarVista |
|---|---|---|
| **Next.js** | The whole building + head chef | The framework that runs everything — pages, routing, and the backend API. |
| **React** | The waiters | Builds the interactive interface (buttons, forms, image galleries). |
| **TypeScript** | The recipe checker | A safer version of JavaScript that catches mistakes *before* customers see them. |
| **Tailwind CSS** | The interior designer | Controls all styling — colours, spacing, the periwinkle theme, dark mode. |
| **shadcn/ui + Radix** | Pre-built furniture | Ready-made, accessible components (dropdowns, dialogs, tabs). |
| **Framer Motion** | The ambiance/lighting | Smooth animations and transitions. |
| **PostgreSQL** | The pantry (storage) | The database that permanently stores all your data. |
| **Prisma** | The pantry manager | Translates our code into database queries safely; defines the data "shape". |
| **NextAuth** | The doorman / ID check | Handles sign-up, login, Google login, passwords, and who's allowed where. |
| **Zod** | The bouncer | Validates every form/input so bad or malicious data is rejected. |
| **Zustand** | The customer's shopping basket | Remembers the cart & wishlist in the browser. |
| **Nodemailer** | The mail clerk | Sends emails (verification, password reset). |
| **Paystack / Mobile Money** | The cashier | Takes payments (integration-ready). |

**In one sentence:** *Next.js runs the site, React draws it, Tailwind styles it, Prisma+PostgreSQL
remember everything, NextAuth guards the doors, and Zod keeps bad data out.*

---

## 3. How the code is organised (the folder map)

```
CarVista/
├── prisma/
│   ├── schema.prisma      ← THE DATA BLUEPRINT. Defines every table (users, vehicles, orders…)
│   └── seed.ts            ← Fills the database with starter/demo data
│
├── src/
│   ├── app/               ← EVERY PAGE + EVERY API LIVES HERE (Next.js App Router)
│   │   ├── (main)/        ← Public pages: home, marketplace, calculators, parts, dealers…
│   │   ├── (auth)/        ← Login, register, password reset
│   │   ├── dashboard/     ← Logged-in area (customer / dealer / seller)
│   │   ├── admin/         ← Admin control panel
│   │   └── api/           ← The "kitchen": backend endpoints (login, orders, duty calc…)
│   │
│   ├── components/        ← Reusable UI building blocks (cards, buttons, forms, header/footer)
│   ├── lib/               ← The "brains": duty calculator, auth config, database connection, utils
│   ├── store/             ← Cart & wishlist memory
│   └── types/             ← TypeScript definitions
│
├── docs/                  ← Documentation (this file, API.md, DEPLOYMENT.md)
├── Dockerfile             ← Recipe to package the app into a container
├── package.json           ← The project's "shopping list" of dependencies + commands
└── .env.example           ← Template for your secret settings (database URL, keys…)
```

**Rule of thumb:**
- Want to change how a **page looks**? → `src/app/…/page.tsx` and `src/components/…`
- Want to change a **calculation or business rule**? → `src/lib/…`
- Want to change **what data is stored**? → `prisma/schema.prisma`
- Want to change a **backend action** (save order, login)? → `src/app/api/…`

---

## 4. The path to going LIVE (step by step)

Here is the complete journey from "code on GitHub" to "the public can use it."

### Step 0 — What you need
- Your GitHub repo (✅ done — it's on `main`).
- A **hosting account** (where the app runs) — **Vercel** recommended.
- A **database** (PostgreSQL) — **Neon** or **Supabase** (both have free tiers).
- Optional: a **domain name** (e.g. `carvista.com.gh`) from a registrar.

### Step 1 — Create the database (≈5 min)
1. Sign up at **neon.tech** (or **supabase.com**).
2. Create a new project → it gives you a **connection string** that looks like
   `postgresql://user:password@host/dbname`.
3. Copy it — this is your `DATABASE_URL`.

### Step 2 — Connect the code to Vercel (≈5 min)
1. Sign up at **vercel.com** with your GitHub account.
2. **Add New → Project → import `ShadrackKaku/CarVista`**.
3. In **Environment Variables**, add at minimum:
   - `DATABASE_URL` = the string from Step 1
   - `NEXTAUTH_SECRET` = a random string (generate one: run `openssl rand -base64 32`, or use any
     password generator for a long random value)
   - `NEXTAUTH_URL` = your site URL (Vercel gives you one, e.g. `https://carvista.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` = same URL
4. Click **Deploy**. Vercel builds it and gives you a live URL. 🎉

### Step 3 — Set up the database tables (one time)
Your database is empty until you create the tables. Two easy ways:
- **From your computer** (once): put the production `DATABASE_URL` in a local `.env`, then run
  `npm run prisma:deploy` and `npm run db:seed`.
- Or add these as a build/deploy command in Vercel.

### Step 4 — Turn on the extras (optional, when ready)
- **Google login:** create OAuth credentials in Google Cloud Console, add `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET`, and set the redirect URL to `https://YOURSITE/api/auth/callback/google`.
- **Emails:** add SMTP details (`EMAIL_SERVER_*`) — use a provider like Resend, SendGrid, or Mailtrap.
- **Payments:** add your **Paystack** keys.
- **Image uploads:** add **Cloudinary** keys.

### Step 5 — Add your own domain (optional)
1. Buy a domain (Namecheap, GoDaddy, or a Ghana registrar).
2. In Vercel → Project → **Domains** → add `carvista.com.gh` and follow the DNS instructions.
3. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the new domain.

**That's it — the site is now public.** Every time you push to `main`, Vercel automatically
rebuilds and redeploys. No terminal needed after setup.

---

## 5. Where to host it — your options compared

| Option | Best for | Pros | Cons | Cost |
|---|---|---|---|---|
| **Vercel** ⭐ | This project (made by Next.js team) | Easiest, auto-deploys from GitHub, fast, free to start | Database is separate (use Neon/Supabase) | Free tier → ~$20/mo Pro |
| **Railway** | All-in-one (app + database together) | Hosts the database too, simple | Slightly less Next.js-optimised | ~$5/mo usage-based |
| **Render** | Budget all-in-one | App + Postgres, cheap | Free tier "sleeps" when idle | Free → ~$7/mo |
| **VPS (DigitalOcean, Hetzner) + Docker** | Full control / scale | Total control, predictable cost | You manage servers, updates, security yourself | ~$6–12/mo |

**Recommendation for launching CarVista:**
- **Vercel** (app) **+ Neon** (database) — cheapest, fastest, least maintenance. Start here.
- Move to Railway or a VPS later only if you need to (e.g. very high traffic or cost tuning).

For a database, you also want file/image storage for listing photos → **Cloudinary** (free tier)
is already wired in.

---

## 6. Maintaining the site (day-to-day)

Once live, "maintenance" is mostly light:

- **Backups:** Neon/Supabase back up your database automatically. Confirm this is on. This protects
  all your users, listings and orders.
- **Monitoring:** Vercel shows you traffic, errors and logs in its dashboard. Check occasionally.
- **Security updates:** Dependencies (the "shopping list") get updates. Every month or two, run
  `npm outdated` and update, test, and redeploy. GitHub also emails you about security alerts.
- **Content:** Use the **Admin dashboard** (`/admin`) to manage users, approve listings, and — very
  importantly — **update the import duty rates** when GRA changes them (`/admin/duty-rates`).
- **Costs:** Watch your Vercel + database usage as traffic grows; upgrade tiers when needed.

You do **not** need to touch the server manually — Vercel handles scaling, SSL certificates
(the padlock 🔒), and uptime for you.

---

## 7. Making changes & adding new features (the workflow)

This is the professional cycle you'll repeat for every change:

```
1. Create a branch      →  git checkout -b feature/whatsapp-alerts
2. Make your changes     →  edit files in src/…
3. Test locally          →  npm run dev   (see it work at localhost:3000)
                            npm run typecheck   (catch mistakes)
                            npm run build       (make sure it still builds)
4. Commit                →  git add -A && git commit -m "Add WhatsApp alerts"
5. Push                  →  git push -u origin feature/whatsapp-alerts
6. Open a Pull Request    →  on GitHub, PR your branch into main
7. Merge                 →  merge the PR → Vercel auto-deploys to production
```

**Why branches + PRs?** So your live site never breaks: you build and test on a *copy* (the
branch), and only merge into `main` (which is live) when it's ready. If something's wrong, you just
don't merge.

**Where to make common changes:**
- New page → add a folder with `page.tsx` under `src/app/(main)/`
- Change a price/tax rule → `src/lib/duty-calculator.ts` (or the admin panel for rates)
- New database field → edit `prisma/schema.prisma`, then run `npm run prisma:migrate`
- New API action → add a `route.ts` under `src/app/api/`

**Tip:** You can ask an AI assistant (like me, in a Claude Code session on this repo) to build a
feature on a branch and open the PR for you — then you just review and merge.

---

## 8. A realistic launch checklist

- [ ] Database created (Neon/Supabase) and `DATABASE_URL` set
- [ ] Deployed to Vercel; `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` set
- [ ] `prisma:deploy` run (tables created) + `db:seed` (starter data)
- [ ] Created your real **admin account** (or changed the seeded one's password)
- [ ] Reviewed/updated **import duty rates** in `/admin/duty-rates`
- [ ] (Optional) Google login, email sending, Paystack, Cloudinary configured
- [ ] (Optional) Custom domain connected
- [ ] Replaced sample/demo content with real listings
- [ ] Tested: register → login → search a car → add a part to cart → checkout
- [ ] Confirmed database backups are on

---

## 9. Rough monthly cost to run (starting out)

| Item | Free tier? | Paid (as you grow) |
|---|---|---|
| Vercel (hosting) | Yes | ~$20/mo |
| Neon/Supabase (database) | Yes | ~$0–25/mo |
| Cloudinary (images) | Yes | ~$0+ |
| Domain name | No | ~$10–15/**year** |
| Email (Resend/SendGrid) | Yes (limited) | ~$0–20/mo |

**You can genuinely launch for ~$0–15/month to start**, then pay more only as real traffic and
usage grow.

---

*Questions? Open this project in a Claude Code session and ask — or reach out to any Next.js
developer; this is a completely standard, modern stack they'll recognise instantly.*
