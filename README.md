<div align="center">

# 🚗 CarVista

### Ghana's Complete Automotive Marketplace & Car Import Platform

Buy, sell & import vehicles · Shop genuine car parts · Calculate import duties · Find verified dealers & automotive services — all in one place.

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

</div>

---

## ✨ Overview

CarVista is a production-ready, full-stack automotive platform purpose-built for the Ghanaian
market. It combines eight products in one:

1. **Vehicle Marketplace** — browse, search & filter new, foreign-used and Ghana-used cars
2. **Vehicle Import Platform** — source from global auctions, track imports end to end
3. **Car Parts Marketplace** — genuine & OEM parts with vehicle-fitment search
4. **Dealer Management System** — verified dealer profiles, inventory & analytics
5. **Duty & Shipping Calculators** — accurate Ghana import duty, shipping & financing estimates
6. **Automotive Services Marketplace** — mechanics, detailers, electricians and more
7. **Customer Dashboards** — saved vehicles, imports, orders, messages
8. **Admin Management System** — users, listings, duty rates, orders, content

## 🧰 Tech Stack

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| Framework      | **Next.js 14** (App Router, RSC, Route Handlers)                  |
| Language       | **TypeScript** (strict)                                           |
| Styling        | **Tailwind CSS** + custom design system, **Framer Motion**       |
| UI             | **shadcn/ui** (Radix primitives), **lucide-react** icons          |
| Database       | **PostgreSQL** + **Prisma ORM**                                   |
| Auth           | **NextAuth** (credentials + Google), RBAC, email verification     |
| State          | **Zustand** (cart & wishlist), React Server Components            |
| Validation     | **Zod**                                                            |
| Payments       | Paystack + Mobile Money + bank transfer (integration-ready)       |
| Email          | Nodemailer (SMTP)                                                  |

## 🎨 Design

A premium, mobile-first design system built around a periwinkle/indigo brand palette
(`#5a5fe0`) with full **light & dark mode**, accessible Radix components, and smooth
Framer Motion transitions.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.17
- PostgreSQL ≥ 14 (local, or a hosted DB such as Neon / Supabase / Railway)

### 1. Install

```bash
git clone https://github.com/ShadrackKaku/CarVista.git
cd CarVista
npm install
```

> The project uses `legacy-peer-deps` (configured in `.npmrc`) for NextAuth v4 compatibility.

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and, optionally, Google
OAuth, SMTP, Paystack and Cloudinary keys. See [`.env.example`](./.env.example) for the full list.

### 3. Set up the database

```bash
npm run prisma:generate     # generate the Prisma client
npm run prisma:migrate      # create tables (dev)  — or: npm run prisma:deploy (prod)
npm run db:seed             # load demo data + accounts
```

### 4. Run

```bash
npm run dev
```

Open **http://localhost:3000**.

### Demo accounts (after seeding)

| Role     | Email                        | Password      |
| -------- | ---------------------------- | ------------- |
| Admin    | `admin@carvista.com.gh`      | `Password123` |
| Dealer   | `dealer@carvista.com.gh`     | `Password123` |
| Seller   | `seller@carvista.com.gh`     | `Password123` |
| Customer | `customer@carvista.com.gh`   | `Password123` |

> The public pages render from a built-in sample catalogue, so the site is fully browsable even
> before you connect a database.

## 📜 Scripts

| Script                    | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start the dev server                     |
| `npm run build`           | Generate Prisma client + production build|
| `npm start`               | Start the production server              |
| `npm run lint`            | Lint with ESLint                         |
| `npm run typecheck`       | Type-check with `tsc`                    |
| `npm run prisma:migrate`  | Run migrations (dev)                     |
| `npm run prisma:deploy`   | Apply migrations (prod)                  |
| `npm run prisma:studio`   | Open Prisma Studio                       |
| `npm run db:seed`         | Seed demo data                           |

## 🗂️ Project Structure

```
CarVista/
├── prisma/
│   ├── schema.prisma          # 40+ models (users, vehicles, parts, orders, imports…)
│   └── seed.ts                # demo data
├── src/
│   ├── app/
│   │   ├── (main)/            # public site (marketplace, calculators, content…)
│   │   ├── (auth)/            # login / register / password reset
│   │   ├── dashboard/         # customer / dealer / seller dashboards
│   │   ├── admin/             # admin management system
│   │   └── api/               # route handlers (auth, vehicles, orders, duty…)
│   ├── components/            # UI, layout, feature components
│   ├── lib/                   # prisma, auth, calculators, utils, sample data
│   ├── store/                 # Zustand stores (cart, wishlist)
│   └── types/                 # TypeScript definitions
├── docs/                      # API & deployment docs
├── Dockerfile / docker-compose.yml
└── ...
```

## 🇬🇭 The Ghana Import Duty Calculator

CarVista's signature feature computes the **total landed cost** of importing a vehicle using
current GRA levies — Import Duty, VAT, NHIL, GETFund, COVID-19 Levy, ECOWAS Levy, examination &
processing fees — plus an **over-age penalty** for vehicles older than 10 years, and logistics
(shipping, port, clearing, delivery). All rates are **admin-configurable** via the admin panel
(`/admin/duty-rates`) and stored in the `DutyRate` table. See
[`src/lib/duty-calculator.ts`](./src/lib/duty-calculator.ts).

> ⚠️ Estimates are for planning only — final assessment is done by GRA Customs via ICUMS.

## 🔐 Security

- Passwords hashed with **bcrypt** (12 rounds)
- **Role-based access control** enforced in middleware + API routes
- **Zod** validation on every mutating endpoint
- **Rate limiting** on auth & sensitive routes
- Prisma parameterised queries (SQL-injection safe) & React auto-escaping (XSS safe)
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, CSP-ready)
- Email verification & secure password-reset tokens

## 🚢 Deployment

Deploy to **Vercel**, **Railway**, or **Docker**. See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
for step-by-step guides. API reference: [`docs/API.md`](./docs/API.md).

```bash
# Docker (app + PostgreSQL)
docker compose up --build
```

## 📄 License

Proprietary — © CarVista. All rights reserved.

<div align="center">
Made with ❤️ in Ghana 🇬🇭
</div>
