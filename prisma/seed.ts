/**
 * CarVista database seed.
 * Run with: npm run db:seed
 *
 * Populates the database with a full, realistic starting catalogue (dealers,
 * vehicles, parts stores, parts, service providers, blog) plus reference data
 * (brands, categories, duty & shipping rates) and demo accounts. Idempotent:
 * safe to run multiple times.
 */
import {
  PrismaClient,
  UserRole,
  type FuelType,
  type Transmission,
  type BodyType,
  type VehicleCondition,
  type ImportStatus,
  type PartCondition,
  type ServiceType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  SAMPLE_VEHICLES,
  SAMPLE_PARTS,
  SAMPLE_DEALERS,
  SAMPLE_SERVICES,
  SAMPLE_BLOG_POSTS,
} from "../src/lib/sample-data";

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

  // ── Core demo accounts ───────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@carvista.com.gh" },
    update: {},
    create: {
      name: "CarVista Admin",
      email: "admin@carvista.com.gh",
      hashedPassword: password,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  await prisma.user.upsert({
    where: { email: "customer@carvista.com.gh" },
    update: {},
    create: {
      name: "Kwame Mensah",
      email: "customer@carvista.com.gh",
      hashedPassword: password,
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
    },
  });

  // ── Brands (from the catalogue) ──────────────────────────────
  const brandNames = Array.from(new Set(SAMPLE_VEHICLES.map((v) => v.brand)));
  const brandBySlug = new Map<string, string>();
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name), featured: ["Toyota", "Honda", "Kia"].includes(name) },
    });
    brandBySlug.set(name, brand.id);
  }

  // ── Part categories ──────────────────────────────────────────
  const categoryNames = Array.from(
    new Map(SAMPLE_PARTS.map((p) => [p.categorySlug, p.category])).entries(),
  );
  const categoryBySlug = new Map<string, string>();
  for (const [slug, name] of categoryNames) {
    const cat = await prisma.partCategory.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    categoryBySlug.set(slug, cat.id);
  }

  // ── Dealers (each backed by a user) ──────────────────────────
  const dealerBySlug = new Map<string, string>();
  for (const d of SAMPLE_DEALERS) {
    const user = await prisma.user.upsert({
      where: { email: `${d.slug}@dealers.carvista.com.gh` },
      update: {},
      create: {
        name: d.name,
        email: `${d.slug}@dealers.carvista.com.gh`,
        hashedPassword: password,
        role: UserRole.DEALER,
        emailVerified: new Date(),
        city: d.city,
        region: d.region,
      },
    });
    const dealer = await prisma.dealer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: d.name,
        slug: d.slug,
        description: d.description,
        logo: d.logo,
        coverImage: d.cover,
        city: d.city,
        region: d.region,
        verified: d.verified,
        featured: true,
        rating: d.rating,
        reviewCount: d.reviewCount,
        yearsInBusiness: d.yearsInBusiness,
      },
    });
    dealerBySlug.set(d.slug, dealer.id);
  }

  // ── Vehicles ─────────────────────────────────────────────────
  for (const v of SAMPLE_VEHICLES) {
    const brandId = brandBySlug.get(v.brand);
    if (!brandId) continue;
    const dealerId = dealerBySlug.get(v.dealer.slug);
    const dealerUser = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: { userId: true },
    });
    const sellerId = dealerUser?.userId ?? admin.id;

    await prisma.vehicle.upsert({
      where: { slug: v.slug },
      update: {},
      create: {
        slug: v.slug,
        title: v.title,
        brandId,
        year: v.year,
        price: v.price,
        mileage: v.mileage,
        fuelType: v.fuelType as FuelType,
        transmission: v.transmission as Transmission,
        engineSize: v.engineSize,
        bodyType: v.bodyType as BodyType,
        condition: v.condition as VehicleCondition,
        color: v.color,
        city: v.city,
        region: v.region ?? null,
        location: v.location,
        importStatus: v.importStatus as ImportStatus,
        countryOfOrigin: v.countryOfOrigin ?? null,
        auctionGrade: v.auctionGrade ?? null,
        vin: v.vin ?? null,
        description: v.description,
        features: v.features,
        verified: v.verified,
        featured: v.featured,
        status: "ACTIVE",
        sellerId,
        dealerId: dealerId ?? null,
        images: {
          create: v.images.map((url, i) => ({
            url,
            isPrimary: i === 0,
            order: i,
            category: i === 0 ? "exterior" : undefined,
          })),
        },
      },
    });
  }

  // ── Parts stores (each backed by a user) ─────────────────────
  const storeBySlug = new Map<string, string>();
  const storeMeta = new Map(SAMPLE_PARTS.map((p) => [p.store.slug, p.store]));
  for (const [slug, store] of storeMeta) {
    const user = await prisma.user.upsert({
      where: { email: `${slug}@stores.carvista.com.gh` },
      update: {},
      create: {
        name: store.name,
        email: `${slug}@stores.carvista.com.gh`,
        hashedPassword: password,
        role: UserRole.PARTS_SELLER,
        emailVerified: new Date(),
      },
    });
    const partsStore = await prisma.partsStore.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        storeName: store.name,
        slug,
        verified: store.verified,
        rating: 4.7,
        reviewCount: 60,
      },
    });
    storeBySlug.set(slug, partsStore.id);
  }

  // ── Parts ────────────────────────────────────────────────────
  for (const p of SAMPLE_PARTS) {
    const categoryId = categoryBySlug.get(p.categorySlug);
    if (!categoryId) continue;
    const storeId = storeBySlug.get(p.store.slug);
    const storeUser = await prisma.partsStore.findUnique({
      where: { id: storeId },
      select: { userId: true },
    });
    const sellerId = storeUser?.userId ?? admin.id;

    await prisma.part.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        categoryId,
        brand: p.brand,
        oemNumber: p.oemNumber ?? null,
        condition: p.condition as PartCondition,
        price: p.price,
        discountPrice: p.discountPrice ?? null,
        stock: p.stock,
        compatibleMakes: p.compatibleMakes,
        rating: p.rating,
        reviewCount: p.reviewCount,
        featured: p.featured,
        status: "ACTIVE",
        sellerId,
        storeId: storeId ?? null,
        images: { create: [{ url: p.image, isPrimary: true, order: 0 }] },
      },
    });
  }

  // ── Service providers (each backed by a user) ────────────────
  for (const s of SAMPLE_SERVICES) {
    const user = await prisma.user.upsert({
      where: { email: `${s.slug}@services.carvista.com.gh` },
      update: {},
      create: {
        name: s.name,
        email: `${s.slug}@services.carvista.com.gh`,
        hashedPassword: password,
        role: UserRole.SERVICE_PROVIDER,
        emailVerified: new Date(),
        city: s.city,
        region: s.region,
      },
    });
    await prisma.serviceProvider.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: s.name,
        slug: s.slug,
        serviceType: s.type as ServiceType,
        coverImage: s.image,
        city: s.city,
        region: s.region,
        verified: s.verified,
        rating: s.rating,
        reviewCount: s.reviewCount,
        priceRange: s.priceRange,
        services: s.services,
      },
    });
  }

  // ── Blog ─────────────────────────────────────────────────────
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
        covidLevyRate: 1,
        ecowasLevyRate: 0.5,
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
        covidLevyRate: 1,
        ecowasLevyRate: 0.5,
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
        covidLevyRate: 1,
        ecowasLevyRate: 0.5,
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

  const counts = await Promise.all([
    prisma.vehicle.count(),
    prisma.part.count(),
    prisma.dealer.count(),
    prisma.serviceProvider.count(),
    prisma.blogPost.count(),
  ]);
  console.log("✅ Seed complete.");
  console.log(
    `   Vehicles: ${counts[0]} · Parts: ${counts[1]} · Dealers: ${counts[2]} · Services: ${counts[3]} · Posts: ${counts[4]}`,
  );
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
