# CarVista — Codebase Walkthrough

> A plain-English tour of what you own, written so you can **read the code, find
> things, and question changes** — not so you can memorise it. Pair this with the
> [Engineering Playbook](./ENGINEERING_PLAYBOOK.md). When anything here is
> unclear, the right move is always: *"explain this like I'm not an engineer."*

---

## 1. What CarVista is, in one breath

A single **Next.js** web application (React + TypeScript) that renders pages on
the server, talks to a **PostgreSQL** database through **Prisma**, and is
deployed on **Vercel** with the database hosted on **Neon**.

| Piece | Tool | Job |
| --- | --- | --- |
| Framework | Next.js 14 (App Router) | Pages, routing, server + API in one app |
| Language | TypeScript | Types catch mistakes before they run |
| Styling | Tailwind CSS | Utility classes in the markup |
| Database | PostgreSQL (Neon) | The source of truth |
| DB access | Prisma | Type-safe queries; no hand-written SQL |
| Auth | NextAuth | Sign-in, sessions, roles |
| Payments | Paystack + Mobile Money | Taking money safely |
| Media | Cloudinary | Image uploads |
| Email | Resend | Transactional email |
| Hosting | Vercel | Build + deploy on every push to `main` |

---

## 2. The mental model

Three ideas explain 90% of the code:

1. **It's a modular monolith.** One codebase, one deploy. Not microservices.
   This is deliberate and correct for our stage.
2. **Server-first.** Most pages are **Server Components** — they run on the
   server, fetch data directly, and send finished HTML. Only the bits that need
   interactivity (buttons, forms, dialogs) are **Client Components** (marked
   `"use client"` at the top of the file).
3. **One data layer with a safety net.** Almost all reads go through
   `src/lib/queries.ts`, and each query **falls back to sample data** if the
   database is unavailable — so the site never shows a blank page.

---

## 3. The folder map

```
src/
  app/                     ← every URL is a folder here (App Router)
    (main)/                ← the public site: /, /vehicles, /parts, /dealers ...
    (auth)/                ← login, register, password reset
    dashboard/             ← signed-in customer/dealer/seller area
    admin/                 ← admin-only area (guarded)
    api/                   ← backend endpoints (see §8)
  components/
    ui/                    ← low-level building blocks (Button, Badge, Dialog...)
    home/ vehicles/ parts/ dealers/ services/   ← feature UI
    dashboard/ admin/ messages/ reviews/ bookings/ skeletons/
  lib/                     ← the brains (see below)
prisma/
  schema.prisma            ← the database shape (all tables)
  migrations/              ← the ordered history of DB changes
  seed.ts                  ← fills a database with realistic data
```

The most important files in `src/lib/`:

| File | What it does |
| --- | --- |
| **`queries.ts`** | Every database **read**. The heart of the app. |
| `prisma.ts` | The single database client everything shares. |
| `sample-data.ts` | The fallback data when the DB is down. |
| `auth.ts`, `session.ts` | Who is signed in, and what role they have. |
| `validations.ts` | Zod schemas — the input rules for every form/endpoint. |
| `paystack.ts`, `fulfill-order.ts` | Taking payment and fulfilling orders. |
| `passport.ts` | Writing to the **Vehicle Passport** timeline (see §9). |
| `duty-calculator.ts`, `shipping-calculator.ts`, `financing-calculator.ts` | The Ghana import math. |
| `admin-guard.ts`, `rate-limit.ts` | Security helpers used by API routes. |
| `seed/catalog.ts` | The sample dealers/vehicles/parts generator. |

---

## 4. How a page renders — trace one request

When someone opens **`/vehicles/2021-toyota-camry-...`**:

1. Next matches the folder `src/app/(main)/vehicles/[slug]/page.tsx`.
2. That page is an `async` Server Component. It calls
   `getVehicleBySlug(slug)` from `queries.ts`.
3. `queries.ts` asks Prisma for the vehicle; if the DB is unreachable it returns
   a matching **sample** vehicle instead (the safety net).
4. The page also renders child components — the gallery, the seller contact
   dialog, the financing widget, the **Vehicle Passport** timeline, reviews.
5. Finished HTML is sent to the browser. Interactive pieces (like "Save",
   "Contact seller") are Client Components that hydrate and handle clicks.

Two performance settings you'll see at the top of pages:

- `export const revalidate = 60` → the page is cached and rebuilt at most once a
  minute (fast, slightly stale — good for content).
- `export const dynamic = "force-dynamic"` → always fresh (used for dashboards
  and anything user-specific).

---

## 5. The data layer (`queries.ts`) — read this file first

This is the file to understand before any other. The pattern repeats everywhere:

```ts
export async function getVehicles() {
  try {
    const rows = await prisma.vehicle.findMany({ /* ...filters... */ });
    return rows.length ? rows.map(mapVehicle) : getExpandedVehicles(); // fallback
  } catch {
    return getExpandedVehicles(); // DB down → sample data
  }
}
```

- **`prisma.vehicle.findMany(...)`** is a database read.
- **`mapVehicle`** converts a raw DB row into the clean shape the UI expects.
- The **`catch`** is the safety net.

Hot queries are wrapped in React's `cache()` so calling them twice in one request
only hits the database once (a small speed win we added deliberately).

---

## 6. The database (Prisma)

- **`prisma/schema.prisma`** describes every table (called a `model`) and how
  they relate. Read it top-to-bottom and you'll understand the whole data model:
  `User`, `Vehicle`, `Dealer`, `Part`, `Order`, `Payment`, `Conversation`,
  `Review`, and now `VehiclePassport` / `VehicleEvent`.
- **Changing the database is a two-step ritual:** edit `schema.prisma`, then add
  a matching SQL file under `prisma/migrations/`. On deploy, Vercel runs
  `prisma migrate deploy` to apply any new migration. **Migrations are ordered
  and forward-only** — we never edit an old one.
- A migration that only **adds** tables/columns is safe. One that **drops or
  renames** needs a plan (this is a red flag in the playbook).

---

## 7. Auth & roles

- `src/lib/auth.ts` configures **NextAuth** (email/password + Google). Passwords
  are stored **hashed** (bcrypt), never in plain text.
- `src/lib/session.ts` gives server code the current user: `getCurrentUser()`,
  and role guards like `requireRole()`.
- Roles: `CUSTOMER`, `DEALER`, `PARTS_SELLER`, `SERVICE_PROVIDER`, `ADMIN`.
- The `/admin` area is protected in `src/app/admin/layout.tsx` (non-admins are
  redirected) **and** every admin API route re-checks via
  `requireAdmin()` in `src/lib/admin-guard.ts`. Defence in depth — the UI check
  is convenience; the API check is the real security.

---

## 8. The backend (`src/app/api/*`)

Each folder with a `route.ts` is an endpoint. The important ones:

| Endpoint | Purpose |
| --- | --- |
| `auth/*` | Register, verify email, password reset (NextAuth handles sign-in). |
| `orders` | Create an order — **recomputes prices server-side** (never trusts the browser). |
| `payments/paystack/verify`, `webhooks/paystack` | Confirm payment. **Idempotent** — safe to run twice, no double-charge. |
| `reviews`, `messages`, `bookings/*` | The M5 community features. |
| `admin/*` | Verify dealers, approve/reject vehicles, moderate reviews — all `requireAdmin`. |
| `vehicles/[id]/events` | **New:** append an event to a vehicle's passport. |
| `dev/seed` | One-off, secret-guarded data seeder. |

Every endpoint that changes data follows the same spine: **rate-limit → check
who you are → validate the input (Zod) → do the work → return.** If you read one
route, read `src/app/api/reviews/route.ts` — it's the clearest example.

---

## 9. The Vehicle Passport (the newest, most important addition)

This is the foundational asset from the blueprints — a **permanent, VIN-anchored
timeline of a car's life**. It's what turns CarVista from a listings site into a
trust platform.

- **Schema:** `VehiclePassport` (one per vehicle, keyed by VIN) and
  `VehicleEvent` (an append-only list of things that happened: imported,
  cleared, inspected, listed, serviced, sold…). See `prisma/schema.prisma`.
- **Writing to it:** `src/lib/passport.ts` — `addVehicleEvent(...)` creates the
  passport lazily if needed, then appends an event. Any flow can call it.
- **It's already wired into a real action:** when an admin **approves** a
  vehicle, the system logs a verified "Inspected / approved" event
  (`src/app/api/admin/vehicles/[id]/route.ts`). This is the "every action feeds
  the graph" principle in practice.
- **Reading it:** `getVehiclePassport(vehicleId)` in `queries.ts`, rendered by
  `src/components/vehicles/vehicle-passport.tsx` on the vehicle detail page.
- **Why append-only matters:** history you can trust is history you can't quietly
  edit. Events are added, never changed — that's the whole point.

---

## 10. Where the security guarantees live

So you can see them, not just trust them:

- **Never trust the client:** order prices are recomputed in `api/orders`.
- **Authorization:** `requireAdmin()` / role checks at the top of protected routes.
- **Idempotent payments:** `src/lib/fulfill-order.ts` (`confirmPaidPayment`).
- **Input validation:** every schema in `src/lib/validations.ts`.
- **Rate limiting:** `src/lib/rate-limit.ts`, used at the top of sensitive routes.
- **Secrets:** only in Vercel env vars — never in the repo (see `.env.example`).

---

## 11. Running & deploying

- **Local:** `npm install`, set up `.env` from `.env.example`, `npm run dev`.
- **Checks:** `npm run typecheck`, `npm run lint`, `npm run build` — all three
  must be green before anything merges (CI enforces this).
- **Seed data:** `npm run db:seed` locally, or the guarded `/api/dev/seed` on the
  live site.
- **Deploy:** push to `main` → Vercel builds
  (`prisma generate → migrate deploy → next build`) and ships. See
  [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md).

---

## 12. "Where do I look for…?"

| I want to change… | Look in |
| --- | --- |
| A page's content/layout | `src/app/.../page.tsx` |
| How data is fetched | `src/lib/queries.ts` |
| The database shape | `prisma/schema.prisma` (+ a new migration) |
| A form's rules | `src/lib/validations.ts` |
| A reusable button/badge/dialog | `src/components/ui/` |
| Who can do what | `src/lib/session.ts`, `admin-guard.ts` |
| Payment logic | `src/lib/paystack.ts`, `fulfill-order.ts` |
| The import math | `src/lib/duty-calculator.ts` |
| The vehicle history timeline | `src/lib/passport.ts`, `components/vehicles/vehicle-passport.tsx` |

---

## 13. Glossary

- **Server Component** — code that runs on the server and returns HTML. Default.
- **Client Component** — `"use client"`; runs in the browser for interactivity.
- **Prisma model** — one database table, described in `schema.prisma`.
- **Migration** — one ordered, forward-only change to the database.
- **ISR** (`revalidate`) — cache a page and rebuild it periodically.
- **Idempotent** — safe to run more than once with the same result (vital for money).
- **Zod schema** — a rule that validates and shapes incoming data.
- **RBAC** — role-based access control (what each role is allowed to do).

---

_A living document. As the codebase grows, this grows with it._
