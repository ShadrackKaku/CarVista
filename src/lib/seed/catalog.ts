/**
 * Shared, idempotent catalogue seeder.
 *
 * Creates a realistic starting marketplace exactly as if the businesses had
 * signed up themselves: each dealer / vendor / service provider is a real User
 * (role + bcrypt password) with its own profile row and live listings.
 *
 * Safe to run repeatedly — every write is an upsert keyed on a unique field, so
 * re-running never duplicates and a partial run can simply be resumed.
 *
 * Used by both `prisma/seed.ts` (CLI: `npm run db:seed`) and the guarded
 * `/api/dev/seed` route. Uses only relative imports + an injected PrismaClient
 * so it runs under `tsx` and inside Next alike.
 */
import bcrypt from "bcryptjs";
import type {
  PrismaClient,
  FuelType,
  Transmission,
  BodyType,
  VehicleCondition,
  ImportStatus,
  PartCondition,
  ServiceType,
} from "@prisma/client";
import { SAMPLE_VEHICLES, SAMPLE_PARTS, SAMPLE_SERVICES } from "../sample-data";

export const DEMO_PASSWORD = "Password123";

export interface SeedSummary {
  dealers: number;
  vehicles: number;
  vendors: number;
  parts: number;
  services: number;
  demoPassword: string;
  sampleLogins: string[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-");
}

// Known-good Unsplash images, reused from the sample catalogue.
const VEHICLE_IMAGES = SAMPLE_VEHICLES.flatMap((v) => v.images);
const PART_IMAGES = SAMPLE_PARTS.map((p) => p.image);
const pick = <T>(arr: T[], i: number) => arr[((i % arr.length) + arr.length) % arr.length];

const CITIES = [
  { city: "Accra", region: "Greater Accra", area: "East Legon" },
  { city: "Kumasi", region: "Ashanti", area: "Adum" },
  { city: "Tema", region: "Greater Accra", area: "Community 1" },
  { city: "Takoradi", region: "Western", area: "Market Circle" },
  { city: "Tamale", region: "Northern", area: "Central" },
  { city: "Cape Coast", region: "Central", area: "Pedu" },
];

const COLORS = [
  "Pearl White",
  "Metallic Grey",
  "Obsidian Black",
  "Silver",
  "Midnight Blue",
  "Gunmetal",
  "Deep Red",
];

const VEHICLE_FEATURES = [
  "Reverse Camera",
  "Apple CarPlay",
  "Alloy Wheels",
  "Leather Seats",
  "Cruise Control",
  "Sunroof",
  "Lane Assist",
  "Push Start",
  "Blind Spot Monitor",
  "Heated Seats",
  "Keyless Entry",
  "Bluetooth",
];

interface VehicleTemplate {
  brand: string;
  model: string;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  engineSize: number;
  basePrice: number;
}

const VEHICLE_TEMPLATES: VehicleTemplate[] = [
  { brand: "Toyota", model: "Camry", bodyType: "SEDAN", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 2.5, basePrice: 285000 },
  { brand: "Toyota", model: "Corolla", bodyType: "SEDAN", fuelType: "PETROL", transmission: "CVT", engineSize: 1.8, basePrice: 210000 },
  { brand: "Toyota", model: "RAV4", bodyType: "SUV", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 2.5, basePrice: 340000 },
  { brand: "Toyota", model: "Highlander", bodyType: "SUV", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 3.5, basePrice: 460000 },
  { brand: "Honda", model: "CR-V", bodyType: "SUV", fuelType: "PETROL", transmission: "CVT", engineSize: 1.5, basePrice: 320000 },
  { brand: "Honda", model: "Accord", bodyType: "SEDAN", fuelType: "PETROL", transmission: "CVT", engineSize: 1.5, basePrice: 300000 },
  { brand: "Hyundai", model: "Tucson", bodyType: "SUV", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 2.0, basePrice: 295000 },
  { brand: "Hyundai", model: "Elantra", bodyType: "SEDAN", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 2.0, basePrice: 205000 },
  { brand: "Kia", model: "Sportage", bodyType: "SUV", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 2.0, basePrice: 300000 },
  { brand: "Kia", model: "Rio", bodyType: "HATCHBACK", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 1.4, basePrice: 165000 },
  { brand: "Nissan", model: "Rogue", bodyType: "SUV", fuelType: "PETROL", transmission: "CVT", engineSize: 2.5, basePrice: 290000 },
  { brand: "Mercedes-Benz", model: "C300", bodyType: "SEDAN", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 2.0, basePrice: 410000 },
  { brand: "BMW", model: "X5", bodyType: "SUV", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 3.0, basePrice: 620000 },
  { brand: "Ford", model: "Ranger", bodyType: "PICKUP", fuelType: "DIESEL", transmission: "AUTOMATIC", engineSize: 3.2, basePrice: 380000 },
  { brand: "Lexus", model: "RX 350", bodyType: "SUV", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 3.5, basePrice: 540000 },
  { brand: "Mazda", model: "CX-5", bodyType: "SUV", fuelType: "PETROL", transmission: "AUTOMATIC", engineSize: 2.5, basePrice: 285000 },
];

const CONDITIONS: VehicleCondition[] = ["FOREIGN_USED", "FOREIGN_USED", "GHANA_USED", "NEW"];
const IMPORT_STATUSES: ImportStatus[] = ["CLEARED", "CLEARED", "AVAILABLE_FOR_IMPORT"];

interface DealerDef {
  name: string;
  cityIdx: number;
  years: number;
}

const DEALERS: DealerDef[] = [
  { name: "Prime Motors Ghana", cityIdx: 0, years: 12 },
  { name: "Kumasi Auto Hub", cityIdx: 1, years: 9 },
  { name: "Tema Motors Ltd", cityIdx: 2, years: 7 },
  { name: "West Coast Autos", cityIdx: 3, years: 6 },
  { name: "Capital Cars Ghana", cityIdx: 0, years: 10 },
  { name: "Northern Auto Traders", cityIdx: 4, years: 5 },
];

interface PartTemplate {
  name: string;
  category: string;
  brand: string;
  basePrice: number;
  condition: PartCondition;
  makes: string[];
  oem?: string;
}

const PART_TEMPLATES: PartTemplate[] = [
  { name: "Front Brake Pads — Ceramic", category: "Brake Parts", brand: "Bosch", basePrice: 420, condition: "NEW", makes: ["Toyota", "Honda"], oem: "04465-02220" },
  { name: "Brake Discs (Pair)", category: "Brake Parts", brand: "Brembo", basePrice: 780, condition: "NEW", makes: ["Toyota", "Nissan", "Kia"] },
  { name: "Car Battery 74Ah", category: "Batteries", brand: "Bosch", basePrice: 950, condition: "NEW", makes: ["Toyota", "Honda", "Nissan", "Kia", "Hyundai"] },
  { name: "Michelin Primacy 4 — 205/55 R16", category: "Tyres & Wheels", brand: "Michelin", basePrice: 1150, condition: "NEW", makes: ["Toyota", "Honda", "Volkswagen"] },
  { name: "Denso Oil Filter", category: "Filters", brand: "Denso", basePrice: 85, condition: "NEW", makes: ["Toyota", "Lexus"] },
  { name: "Air Filter — High Flow", category: "Filters", brand: "K&N", basePrice: 260, condition: "NEW", makes: ["Honda", "Nissan"] },
  { name: "Front Shock Absorber", category: "Suspension", brand: "KYB", basePrice: 640, condition: "NEW", makes: ["Toyota", "Hyundai"] },
  { name: "Headlight Assembly (LED)", category: "Lighting", brand: "Depo", basePrice: 1350, condition: "NEW", makes: ["Toyota", "Kia"] },
  { name: "Iridium Spark Plugs (Set of 4)", category: "Engine Parts", brand: "NGK", basePrice: 320, condition: "NEW", makes: ["Toyota", "Honda", "Mazda"] },
  { name: "Alternator 12V", category: "Electrical", brand: "Bosch", basePrice: 1450, condition: "REFURBISHED", makes: ["Nissan", "Hyundai"] },
  { name: "Timing Belt Kit", category: "Engine Parts", brand: "Gates", basePrice: 890, condition: "NEW", makes: ["Toyota", "Honda"] },
  { name: "Aluminium Radiator", category: "Cooling", brand: "Koyorad", basePrice: 1100, condition: "NEW", makes: ["Toyota", "Nissan"] },
  { name: "Engine Oil 5W-30 (5L)", category: "Fluids & Oils", brand: "Mobil", basePrice: 380, condition: "NEW", makes: ["Toyota", "Honda", "Kia", "Hyundai"] },
  { name: "Wiper Blades (Pair)", category: "Body Parts", brand: "Bosch", basePrice: 140, condition: "NEW", makes: ["Toyota", "Honda", "Nissan"] },
  { name: "Electric Fuel Pump", category: "Engine Parts", brand: "Denso", basePrice: 720, condition: "NEW", makes: ["Toyota", "Lexus"] },
  { name: "Clutch Kit", category: "Engine Parts", brand: "Exedy", basePrice: 1650, condition: "NEW", makes: ["Kia", "Hyundai"] },
];

const VENDORS: { name: string; cityIdx: number }[] = [
  { name: "GenuineParts GH", cityIdx: 0 },
  { name: "PowerCell Ghana", cityIdx: 1 },
  { name: "TyrePro Accra", cityIdx: 0 },
  { name: "AutoLux Parts", cityIdx: 2 },
  { name: "SpeedSpares Ghana", cityIdx: 3 },
];

const SERVICES: { name: string; type: ServiceType; cityIdx: number; services: string[]; priceRange: string }[] = [
  { name: "AutoFix Master Mechanics", type: "MECHANIC", cityIdx: 0, services: ["Engine Repair", "Diagnostics", "Servicing", "Suspension"], priceRange: "GHS 150 – 2,500" },
  { name: "Sparkle Auto Detailing", type: "DETAILING", cityIdx: 0, services: ["Interior Detailing", "Ceramic Coating", "Paint Correction"], priceRange: "GHS 200 – 1,800" },
  { name: "Voltage Auto Electricals", type: "AUTO_ELECTRICIAN", cityIdx: 1, services: ["Wiring", "ECU Repair", "AC Systems", "Battery"], priceRange: "GHS 100 – 1,200" },
  { name: "SafeDrive Driving School", type: "DRIVING_SCHOOL", cityIdx: 2, services: ["DVLA Licensing", "Manual & Auto", "Defensive Driving"], priceRange: "GHS 800 – 2,000" },
  { name: "QuickWash Car Care", type: "CAR_WASH", cityIdx: 3, services: ["Exterior Wash", "Underbody Wash", "Vacuum", "Wax"], priceRange: "GHS 30 – 250" },
  { name: "CrystalCoat Spray Painting", type: "SPRAY_PAINTER", cityIdx: 0, services: ["Full Respray", "Panel Beating", "Scratch Repair", "Oven Baking"], priceRange: "GHS 400 – 6,000" },
];

const VEHICLES_PER_DEALER = 9;
const PARTS_PER_VENDOR = 9;

/** Run an async mapper over items in small batches to bound DB concurrency. */
async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

export async function seedCatalog(prisma: PrismaClient): Promise<SeedSummary> {
  const password = await bcrypt.hash(DEMO_PASSWORD, 12);
  const now = new Date();

  // ── Reference: an admin owner + brands + part categories ─────
  await prisma.user.upsert({
    where: { email: "admin@carvista.com.gh" },
    update: {},
    create: {
      name: "CarVista Admin",
      email: "admin@carvista.com.gh",
      hashedPassword: password,
      role: "ADMIN",
      emailVerified: now,
    },
  });

  const brandNames = Array.from(new Set(VEHICLE_TEMPLATES.map((t) => t.brand)));
  const brandIdByName = new Map<string, string>();
  await inBatches(brandNames, 8, async (name) => {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        featured: ["Toyota", "Honda", "Kia", "Hyundai"].includes(name),
      },
    });
    brandIdByName.set(name, brand.id);
  });

  const categoryNames = Array.from(new Set(PART_TEMPLATES.map((t) => t.category)));
  const categoryIdByName = new Map<string, string>();
  await inBatches(categoryNames, 8, async (name) => {
    const cat = await prisma.partCategory.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categoryIdByName.set(name, cat.id);
  });

  // ── Dealers + their vehicles ─────────────────────────────────
  const sampleLogins: string[] = [];
  let vehicleCount = 0;

  for (let di = 0; di < DEALERS.length; di++) {
    const d = DEALERS[di];
    const slug = slugify(d.name);
    const loc = CITIES[d.cityIdx];
    const email = `${slug}@dealers.carvista.com.gh`;
    if (di === 0) sampleLogins.push(`${email} (dealer)`);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: d.name,
        email,
        hashedPassword: password,
        role: "DEALER",
        emailVerified: now,
        phone: `+2332${(4 + di).toString()}${(1000000 + di).toString().slice(0, 7)}`,
        city: loc.city,
        region: loc.region,
      },
    });

    const dealer = await prisma.dealer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: d.name,
        slug,
        description: `${d.name} is a trusted CarVista dealer in ${loc.city} with ${d.years} years selling quality foreign-used and brand-new vehicles.`,
        coverImage: pick(VEHICLE_IMAGES, di),
        logo: `https://i.pravatar.cc/160?u=${slug}`,
        phone: `+2332${(4 + di).toString()}${(1000000 + di).toString().slice(0, 7)}`,
        whatsapp: `+2332${(4 + di).toString()}${(1000000 + di).toString().slice(0, 7)}`,
        address: `${loc.area}, ${loc.city}`,
        city: loc.city,
        region: loc.region,
        verified: di % 3 !== 0 ? true : di === 0, // most verified
        featured: di < 2,
        rating: Math.round((4.3 + (di % 5) * 0.12) * 10) / 10,
        reviewCount: 40 + di * 17,
        yearsInBusiness: d.years,
      },
    });

    const vehicles = Array.from({ length: VEHICLES_PER_DEALER }, (_, i) => {
      const t = pick(VEHICLE_TEMPLATES, di * VEHICLES_PER_DEALER + i);
      const year = 2018 + ((di + i) % 7);
      const condition = pick(CONDITIONS, di + i);
      const importStatus = condition === "NEW" ? ("NOT_IMPORTED" as ImportStatus) : pick(IMPORT_STATUSES, di + i);
      const price = t.basePrice + i * 6000 - di * 4000 + (year - 2020) * 8000;
      const imgStart = (di * VEHICLES_PER_DEALER + i) * 2;
      return {
        slug: `${year}-${slugify(t.brand)}-${slugify(t.model)}-d${di + 1}-${i + 1}`,
        title: `${year} ${t.brand} ${t.model}`,
        brandId: brandIdByName.get(t.brand)!,
        year,
        price,
        mileage: (2025 - year) * 15000 + i * 1200,
        fuelType: t.fuelType,
        transmission: t.transmission,
        engineSize: t.engineSize,
        bodyType: t.bodyType,
        condition,
        color: pick(COLORS, di + i),
        city: loc.city,
        region: loc.region,
        location: `${loc.area}, ${loc.city}`,
        importStatus,
        countryOfOrigin: importStatus === "AVAILABLE_FOR_IMPORT" ? "United States" : null,
        description: `Clean ${year} ${t.brand} ${t.model} available at ${d.name}. ${condition === "NEW" ? "Brand new with full warranty." : "Foreign-used, accident-free with service history."} Duty paid and ready for registration.`,
        features: VEHICLE_FEATURES.slice((di + i) % 4, ((di + i) % 4) + 5),
        verified: dealer.verified && i % 4 !== 0,
        featured: i < 2 && di < 3,
        images: [pick(VEHICLE_IMAGES, imgStart), pick(VEHICLE_IMAGES, imgStart + 1)],
      };
    });

    await inBatches(vehicles, 6, async (v) => {
      await prisma.vehicle.upsert({
        where: { slug: v.slug },
        update: {},
        create: {
          slug: v.slug,
          title: v.title,
          brandId: v.brandId,
          year: v.year,
          price: v.price,
          mileage: v.mileage,
          fuelType: v.fuelType,
          transmission: v.transmission,
          engineSize: v.engineSize,
          bodyType: v.bodyType,
          condition: v.condition,
          color: v.color,
          city: v.city,
          region: v.region,
          location: v.location,
          importStatus: v.importStatus,
          countryOfOrigin: v.countryOfOrigin,
          description: v.description,
          features: v.features,
          verified: v.verified,
          featured: v.featured,
          status: "ACTIVE",
          sellerId: user.id,
          dealerId: dealer.id,
          images: {
            create: v.images.map((url, i) => ({
              url,
              isPrimary: i === 0,
              order: i,
              category: i === 0 ? "exterior" : "interior",
            })),
          },
        },
      });
      vehicleCount++;
    });
  }

  // ── Vendors (parts stores) + their parts ─────────────────────
  let partCount = 0;

  for (let vi = 0; vi < VENDORS.length; vi++) {
    const vendor = VENDORS[vi];
    const slug = slugify(vendor.name);
    const loc = CITIES[vendor.cityIdx];
    const email = `${slug}@stores.carvista.com.gh`;
    if (vi === 0) sampleLogins.push(`${email} (parts vendor)`);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: vendor.name,
        email,
        hashedPassword: password,
        role: "PARTS_SELLER",
        emailVerified: now,
        city: loc.city,
        region: loc.region,
      },
    });

    const store = await prisma.partsStore.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        storeName: vendor.name,
        slug,
        description: `${vendor.name} stocks genuine and OEM parts in ${loc.city} with nationwide delivery.`,
        logo: `https://i.pravatar.cc/160?u=${slug}`,
        city: loc.city,
        region: loc.region,
        verified: vi % 4 !== 3,
        rating: Math.round((4.5 + (vi % 4) * 0.1) * 10) / 10,
        reviewCount: 30 + vi * 14,
      },
    });

    const parts = Array.from({ length: PARTS_PER_VENDOR }, (_, i) => {
      const t = pick(PART_TEMPLATES, vi * PARTS_PER_VENDOR + i);
      const price = t.basePrice + i * 25;
      const hasDiscount = i % 3 === 0;
      return {
        slug: `${slugify(t.brand)}-${slugify(t.name)}-v${vi + 1}-${i + 1}`,
        name: t.name,
        categoryId: categoryIdByName.get(t.category)!,
        brand: t.brand,
        oemNumber: t.oem ?? null,
        condition: t.condition,
        price,
        discountPrice: hasDiscount ? Math.round(price * 0.88) : null,
        stock: 8 + ((vi + i) % 5) * 9,
        compatibleMakes: t.makes,
        rating: Math.round((4.4 + (i % 5) * 0.1) * 10) / 10,
        reviewCount: 12 + i * 6,
        featured: i < 2,
        image: pick(PART_IMAGES, vi * PARTS_PER_VENDOR + i),
      };
    });

    await inBatches(parts, 6, async (p) => {
      await prisma.part.upsert({
        where: { slug: p.slug },
        update: {},
        create: {
          slug: p.slug,
          name: p.name,
          categoryId: p.categoryId,
          brand: p.brand,
          oemNumber: p.oemNumber,
          condition: p.condition,
          price: p.price,
          discountPrice: p.discountPrice,
          stock: p.stock,
          compatibleMakes: p.compatibleMakes,
          rating: p.rating,
          reviewCount: p.reviewCount,
          featured: p.featured,
          status: "ACTIVE",
          sellerId: user.id,
          storeId: store.id,
          images: { create: [{ url: p.image, isPrimary: true, order: 0 }] },
        },
      });
      partCount++;
    });
  }

  // ── Service providers ────────────────────────────────────────
  await inBatches(
    SERVICES.map((s, i) => ({ s, i })),
    6,
    async ({ s, i }) => {
      const slug = slugify(s.name);
      const loc = CITIES[s.cityIdx];
      const email = `${slug}@services.carvista.com.gh`;
      if (i === 0) sampleLogins.push(`${email} (service provider)`);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: s.name,
          email,
          hashedPassword: password,
          role: "SERVICE_PROVIDER",
          emailVerified: now,
          city: loc.city,
          region: loc.region,
        },
      });

      await prisma.serviceProvider.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          businessName: s.name,
          slug,
          serviceType: s.type,
          description: `${s.name} provides professional ${s.services.join(", ").toLowerCase()} services in ${loc.city}.`,
          coverImage: pick(SAMPLE_SERVICES.map((x) => x.image), i),
          logo: `https://i.pravatar.cc/160?u=${slug}`,
          phone: `+2332${(4 + i).toString()}${(2000000 + i).toString().slice(0, 7)}`,
          whatsapp: `+2332${(4 + i).toString()}${(2000000 + i).toString().slice(0, 7)}`,
          address: `${loc.area}, ${loc.city}`,
          city: loc.city,
          region: loc.region,
          verified: i % 5 !== 4,
          rating: Math.round((4.5 + (i % 4) * 0.1) * 10) / 10,
          reviewCount: 40 + i * 22,
          priceRange: s.priceRange,
          services: s.services,
        },
      });
    },
  );

  return {
    dealers: DEALERS.length,
    vehicles: vehicleCount,
    vendors: VENDORS.length,
    parts: partCount,
    services: SERVICES.length,
    demoPassword: DEMO_PASSWORD,
    sampleLogins,
  };
}
