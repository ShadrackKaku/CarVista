/**
 * CarVista database seed.
 * Run with: npm run db:seed
 *
 * Populates the database with a realistic starting catalogue (dealers, vehicles,
 * parts vendors, parts, service providers) via the shared `seedCatalog` used by
 * the /api/dev/seed route, plus reference data (duty & shipping rates, site
 * settings) and blog posts. Idempotent: safe to run multiple times.
 */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedCatalog } from "../src/lib/seed/catalog";
import { SAMPLE_BLOG_POSTS } from "../src/lib/sample-data";

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-");
}

async function main() {
  console.log("🌱 Seeding CarVista database...");
  const password = await bcrypt.hash("Password123", 12);

  // Dealers, vehicles, parts vendors, parts, service providers, brands & categories.
  const summary = await seedCatalog(prisma);

  // ── A demo customer account ──────────────────────────────────
  await prisma.user.upsert({
    where: { email: "customer@carvista.com.gh" },
    update: {},
    create: {
      name: "Kwame Mensah",
      email: "customer@carvista.com.gh",
      hashedPassword: password,
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  });

  const admin = await prisma.user.findUnique({ where: { email: "admin@carvista.com.gh" } });

  // ── Blog ─────────────────────────────────────────────────────
  if (admin) {
    for (const b of SAMPLE_BLOG_POSTS) {
      const category = await prisma.blogCategory.upsert({
        where: { slug: slugify(b.category) },
        update: {},
        create: { name: b.category, slug: slugify(b.category) },
      });
      await prisma.blogPost.upsert({
        where: { slug: b.slug },
        update: {},
        create: {
          slug: b.slug,
          title: b.title,
          excerpt: b.excerpt,
          content:
            "Full article content. Replace this with the complete post body from your CMS or editor.",
          coverImage: b.cover,
          published: true,
          featured: b.id === SAMPLE_BLOG_POSTS[0].id,
          readTime: b.readTime,
          authorId: admin.id,
          categoryId: category.id,
          publishedAt: new Date(b.date),
          tags: [b.category.toLowerCase()],
        },
      });
    }
  }

  // ── Duty rates ───────────────────────────────────────────────
  await prisma.dutyRate.createMany({
    data: [
      {
        category: "SALOON_SUV_STANDARD",
        label: "Saloon / SUV (standard)",
        engineMin: 0,
        engineMax: 3000,
        bodyTypes: ["SEDAN", "SUV", "HATCHBACK", "COUPE", "WAGON"],
        fuelTypes: ["PETROL", "DIESEL", "HYBRID"],
        importDutyRate: 20,
        vatRate: 15,
        nhilRate: 2.5,
        getfundRate: 2.5,
        ecowasLevyRate: 0.5,
        auLevyRate: 0.2,
        eximLevyRate: 0.75,
        specialImportLevyRate: 2,
        examinationFee: 1,
        networkCharge: 0.4,
      },
      {
        category: "COMMERCIAL",
        label: "Commercial / Pickup",
        bodyTypes: ["PICKUP", "TRUCK", "VAN"],
        fuelTypes: ["PETROL", "DIESEL"],
        importDutyRate: 10,
        vatRate: 15,
        nhilRate: 2.5,
        getfundRate: 2.5,
        ecowasLevyRate: 0.5,
        auLevyRate: 0.2,
        eximLevyRate: 0.75,
        specialImportLevyRate: 2,
        examinationFee: 1,
        networkCharge: 0.4,
      },
      {
        category: "EV",
        label: "Electric Vehicle",
        bodyTypes: ["SEDAN", "SUV", "HATCHBACK"],
        fuelTypes: ["ELECTRIC"],
        importDutyRate: 10,
        vatRate: 15,
        nhilRate: 2.5,
        getfundRate: 2.5,
        ecowasLevyRate: 0.5,
        auLevyRate: 0.2,
        eximLevyRate: 0.75,
        specialImportLevyRate: 2,
        examinationFee: 1,
        networkCharge: 0.4,
      },
    ],
    skipDuplicates: true,
  });

  // ── Shipping rates ───────────────────────────────────────────
  await prisma.shippingRate.createMany({
    data: [
      { originCountry: "United States", originPort: "New Jersey", method: "RORO", vehicleClass: "SEDAN", cost: 1150, transitDaysMin: 28, transitDaysMax: 45 },
      { originCountry: "Germany", originPort: "Bremerhaven", method: "RORO", vehicleClass: "SEDAN", cost: 950, transitDaysMin: 18, transitDaysMax: 30 },
      { originCountry: "United Kingdom", originPort: "Southampton", method: "RORO", vehicleClass: "SEDAN", cost: 900, transitDaysMin: 16, transitDaysMax: 28 },
      { originCountry: "Japan", originPort: "Yokohama", method: "RORO", vehicleClass: "SEDAN", cost: 1300, transitDaysMin: 35, transitDaysMax: 55 },
    ],
    skipDuplicates: true,
  });

  // ── Site settings ────────────────────────────────────────────
  await prisma.siteSetting.upsert({
    where: { key: "exchange_rate_usd_ghs" },
    update: {},
    create: { key: "exchange_rate_usd_ghs", value: "15.5" },
  });

  console.log("✅ Seed complete.");
  console.log(
    `   Dealers: ${summary.dealers} · Vehicles: ${summary.vehicles} · Vendors: ${summary.vendors} · Parts: ${summary.parts} · Services: ${summary.services}`,
  );
  console.log(`   Demo password for all seeded accounts: ${summary.demoPassword}`);
  console.log("   Admin login: admin@carvista.com.gh / Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
