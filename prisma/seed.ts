/**
 * CarVista database seed.
 * Run with: npm run db:seed
 */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  // ── Users ────────────────────────────────────────────────────
  const password = await bcrypt.hash("Password123", 12);

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

  const dealerUser = await prisma.user.upsert({
    where: { email: "dealer@carvista.com.gh" },
    update: {},
    create: {
      name: "Prime Motors Ghana",
      email: "dealer@carvista.com.gh",
      hashedPassword: password,
      role: UserRole.DEALER,
      emailVerified: new Date(),
      phone: "0201234567",
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@carvista.com.gh" },
    update: {},
    create: {
      name: "GenuineParts GH",
      email: "seller@carvista.com.gh",
      hashedPassword: password,
      role: UserRole.PARTS_SELLER,
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

  // ── Brands & models ──────────────────────────────────────────
  const brands = [
    "Toyota",
    "Honda",
    "Hyundai",
    "Kia",
    "Nissan",
    "Mercedes-Benz",
    "BMW",
    "Ford",
    "Lexus",
    "Volkswagen",
  ];
  for (const name of brands) {
    await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name), featured: ["Toyota", "Honda", "Kia"].includes(name) },
    });
  }
  const toyota = await prisma.brand.findUnique({ where: { slug: "toyota" } });
  if (toyota) {
    for (const model of ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma"]) {
      await prisma.vehicleModel.upsert({
        where: { brandId_slug: { brandId: toyota.id, slug: slugify(model) } },
        update: {},
        create: { name: model, slug: slugify(model), brandId: toyota.id },
      });
    }
  }

  // ── Dealer profile ───────────────────────────────────────────
  const dealer = await prisma.dealer.upsert({
    where: { userId: dealerUser.id },
    update: {},
    create: {
      userId: dealerUser.id,
      businessName: "Prime Motors Ghana",
      slug: "prime-motors-ghana",
      description: "Ghana's premier importer of luxury and executive vehicles.",
      city: "Accra",
      region: "Greater Accra",
      verified: true,
      featured: true,
      rating: 4.8,
      reviewCount: 214,
      yearsInBusiness: 12,
      phone: "0201234567",
      whatsapp: "233201234567",
    },
  });

  // ── Parts store ──────────────────────────────────────────────
  const store = await prisma.partsStore.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      storeName: "GenuineParts GH",
      slug: "genuineparts-gh",
      description: "Genuine OEM parts for all makes and models.",
      city: "Accra",
      region: "Greater Accra",
      verified: true,
      rating: 4.7,
      reviewCount: 96,
    },
  });

  // ── Part categories ──────────────────────────────────────────
  const categories = [
    "Engine Parts",
    "Body Parts",
    "Electrical Parts",
    "Brake Parts",
    "Suspension Parts",
    "Tyres & Wheels",
    "Batteries",
    "Filters",
    "Lights",
    "Accessories",
    "Car Electronics",
    "Interior Accessories",
  ];
  for (const name of categories) {
    await prisma.partCategory.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  // ── Sample vehicle ───────────────────────────────────────────
  if (toyota) {
    await prisma.vehicle.upsert({
      where: { slug: "2021-toyota-camry-se-seed" },
      update: {},
      create: {
        slug: "2021-toyota-camry-se-seed",
        title: "2021 Toyota Camry SE",
        brandId: toyota.id,
        year: 2021,
        price: 285000,
        mileage: 42000,
        fuelType: "PETROL",
        transmission: "AUTOMATIC",
        engineSize: 2.5,
        bodyType: "SEDAN",
        condition: "FOREIGN_USED",
        color: "Pearl White",
        city: "Accra",
        region: "Greater Accra",
        importStatus: "CLEARED",
        countryOfOrigin: "United States",
        description: "Clean 2021 Toyota Camry SE, foreign used, accident-free.",
        features: ["Reverse Camera", "Apple CarPlay", "Alloy Wheels", "Leather Seats"],
        verified: true,
        featured: true,
        sellerId: dealerUser.id,
        dealerId: dealer.id,
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
              isPrimary: true,
              category: "exterior",
            },
          ],
        },
      },
    });
  }

  // ── Sample part ──────────────────────────────────────────────
  const brakeCategory = await prisma.partCategory.findUnique({ where: { slug: "brake-parts" } });
  if (brakeCategory) {
    await prisma.part.upsert({
      where: { slug: "toyota-corolla-front-brake-pads-seed" },
      update: {},
      create: {
        slug: "toyota-corolla-front-brake-pads-seed",
        name: "Front Brake Pads — Ceramic",
        description: "Premium ceramic front brake pads for Toyota Corolla.",
        categoryId: brakeCategory.id,
        brand: "Bosch",
        oemNumber: "04465-02220",
        condition: "NEW",
        price: 420,
        discountPrice: 350,
        stock: 34,
        compatibleMakes: ["Toyota"],
        compatibleModels: ["Corolla", "Camry"],
        yearFrom: 2014,
        yearTo: 2019,
        fitmentPosition: "Front",
        featured: true,
        sellerId: sellerUser.id,
        storeId: store.id,
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
              isPrimary: true,
            },
          ],
        },
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

  // ── Blog ─────────────────────────────────────────────────────
  await prisma.blogPost.upsert({
    where: { slug: "ghana-car-import-duty-guide-2025" },
    update: {},
    create: {
      slug: "ghana-car-import-duty-guide-2025",
      title: "The Complete Guide to Ghana Car Import Duty in 2025",
      excerpt: "Everything you need to know about calculating import duty, VAT and levies in Ghana.",
      content: "Full article content...",
      coverImage: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      published: true,
      featured: true,
      readTime: 8,
      authorId: admin.id,
      publishedAt: new Date(),
      tags: ["import", "duty", "ghana"],
    },
  });

  // ── Site settings ────────────────────────────────────────────
  await prisma.siteSetting.upsert({
    where: { key: "exchange_rate_usd_ghs" },
    update: { value: "15.5" },
    create: { key: "exchange_rate_usd_ghs", value: "15.5" },
  });

  console.log("✅ Seed complete.");
  console.log("   Admin:    admin@carvista.com.gh / Password123");
  console.log("   Dealer:   dealer@carvista.com.gh / Password123");
  console.log("   Seller:   seller@carvista.com.gh / Password123");
  console.log("   Customer: customer@carvista.com.gh / Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
