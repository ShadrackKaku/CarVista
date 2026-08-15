/**
 * One car, all the way through.
 *
 *   npm run db:seed:demo
 *
 * Seeds a single vehicle that has genuinely traversed the whole chain — bought
 * at a Japanese auction, shipped, cleared at Tema by a licensed broker who
 * recorded the duty actually paid, taken into a dealer's inventory and
 * published — so the marketplace has something real to show rather than
 * "Test Dealer 1".
 *
 * It builds that history through the same helpers the application uses:
 * `passportBackfill`, `assessmentFromClearance`, `vehicleTitleFor`,
 * `conditionForImport` and `landedCostOf`. Nothing here hand-rolls a parallel
 * version of the logic, so the demo cannot quietly drift away from what the
 * product actually does — if the seed looks right, the product is right.
 *
 * Scoped and repeatable: it removes its own accounts first (by the addresses
 * below) and rebuilds them, so running it twice is safe and it never touches
 * anything else in the database.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SITE } from "../src/lib/constants";
import {
  conditionForImport,
  landedCostOf,
  passportBackfill,
  vehicleTitleFor,
} from "../src/lib/import-to-inventory";
import { assessmentFromClearance } from "../src/lib/clearing";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

const PASSWORD = "Password123";

const PEOPLE = {
  dealer: { name: "Kwame Asante", email: `kwame.asante@${SITE.domain}` },
  importer: { name: "Yaw Boateng", email: `yaw.boateng@${SITE.domain}` },
  agent: { name: "Ama Owusu", email: `ama.owusu@${SITE.domain}` },
};

/**
 * Real figures, in the shape a Ghanaian importer actually quotes them.
 *
 * A 2019 Harrier is the single most recognisable Japanese import on Accra
 * roads, which is the point — a dealer watching the demo should see a car they
 * have personally bought and sold.
 */
const MONEY = {
  fobJpy: 1_450_000,
  /** Cedis per yen, as the importer quotes it. */
  fxRateToGhs: 0.1033,
  serviceFeeGhs: 8_000,
  freightGhs: 22_000,
  quotedCif: 149_785,
  quotedDuty: 78_000,
  quotedShipping: 22_000,
  quotedTotal: 257_785,
  /** What customs actually charged — the number the whole engine predicts. */
  actualDuty: 82_450,
  /** What the dealer put it on the market at. */
  askingPrice: 289_000,
};

const PHOTOS = [
  "https://images.unsplash.com/photo-1550355291-bbee04a92027",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7",
];

/** The shipment, dated as it really would have run. */
const JOURNEY = [
  { stage: "REQUESTED" as const, title: "Request received", location: null, at: "2026-05-28" },
  { stage: "QUOTED" as const, title: "Landed cost quoted", location: null, at: "2026-05-30" },
  { stage: "PURCHASED" as const, title: "Won at auction — grade 4.5", location: "Nagoya", at: "2026-06-03" },
  { stage: "SHIPPING_PENDING" as const, title: "Booked on MV Grande Lagos", location: "Yokohama", at: "2026-06-09" },
  { stage: "IN_TRANSIT" as const, title: "Vessel departed Yokohama", location: "Yokohama", at: "2026-06-12" },
  { stage: "IN_TRANSIT" as const, title: "Passed Cape Town", location: "At sea", at: "2026-06-26" },
  { stage: "ARRIVED_AT_PORT" as const, title: "Berthed at Tema", location: "Tema", at: "2026-07-01" },
];

const CLEARED_ON = new Date("2026-07-04");
const ENTRY_NUMBER = "TEMA-2026-114857";

async function main() {
  const emails = Object.values(PEOPLE).map((p) => p.email);

  // Scoped cleanup: these three accounts and everything hanging off them.
  await prisma.user.deleteMany({ where: { email: { in: emails } } });

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  // ── the people ────────────────────────────────────────────
  const dealerUser = await prisma.user.create({
    data: {
      ...PEOPLE.dealer,
      hashedPassword,
      role: "DEALER",
      phone: "0244518870",
      city: "Accra",
      region: "Greater Accra",
    },
  });
  const dealer = await prisma.dealer.create({
    data: {
      userId: dealerUser.id,
      businessName: "Adom Motors",
      slug: "adom-motors",
      description:
        "Foreign-used vehicles at East Legon, trading since 2014. Every car we sell we imported ourselves.",
      phone: "0244518870",
      whatsapp: "233244518870",
      city: "Accra",
      region: "Greater Accra",
      address: "Boundary Road, East Legon, Accra",
      verified: true,
      yearsInBusiness: 12,
      rating: 4.8,
      reviewCount: 63,
    },
  });

  const importerUser = await prisma.user.create({
    data: { ...PEOPLE.importer, hashedPassword, role: "IMPORTER", phone: "0209934112" },
  });
  const importer = await prisma.importer.create({
    data: {
      userId: importerUser.id,
      businessName: "Achimota Auto Imports",
      slug: "achimota-auto-imports",
      description: "Japanese stock sourced from USS and TAA auctions, door to Tema in 6–8 weeks.",
      sourceMarkets: ["Japan", "United Kingdom"],
      leadTimeDays: 45,
      phone: "0209934112",
      city: "Accra",
      region: "Greater Accra",
      verified: true,
      rating: 4.7,
      reviewCount: 41,
    },
  });

  const agentUser = await prisma.user.create({
    data: { ...PEOPLE.agent, hashedPassword, role: "CLEARING_AGENT", phone: "0277401556" },
  });
  const agent = await prisma.clearingAgent.create({
    data: {
      userId: agentUser.id,
      businessName: "Owusu Clearing & Forwarding",
      slug: "owusu-clearing-forwarding",
      description: "Licensed customs brokerage at Tema Port. Vehicles cleared in five working days.",
      licenceNumber: "GRA-CB-2024-0881",
      licenceExpiry: new Date("2027-12-31"),
      ports: ["Tema"],
      phone: "0277401556",
      whatsapp: "233277401556",
      city: "Tema",
      region: "Greater Accra",
      turnaroundDays: 5,
      verified: true,
      rating: 4.9,
      reviewCount: 28,
    },
  });

  // ── the stock the importer published ──────────────────────
  const SPEC = {
    make: "Toyota",
    model: "Harrier",
    trim: "Premium",
    year: 2019,
    mileage: 62_400,
    fuelType: "HYBRID" as const,
    transmission: "CVT" as const,
    bodyType: "SUV" as const,
    engineSize: 2.5,
    color: "Pearl White",
    drivetrain: "AWD",
    chassisNumber: "ZSU60-0123456",
    auctionGrade: "4.5",
  };

  const listing = await prisma.importListing.create({
    data: {
      slug: "2019-toyota-harrier-premium-nagoya",
      importerId: importer.id,
      title: "2019 Toyota Harrier Premium — Grade 4.5, USS Nagoya",
      ...SPEC,
      description:
        "Grade 4.5 auction sheet with a clean inspection. Two previous owners, full Toyota service history, no accident record. Sunroof, half-leather interior, 360° camera and radar cruise.",
      features: [
        "Sunroof",
        "Half-leather interior",
        "360° camera",
        "Radar cruise control",
        "Push start",
        "Alloy wheels",
      ],
      countryOfOrigin: "Japan",
      portOfLoading: "Yokohama",
      auctionSource: "USS Nagoya",
      fobAmount: MONEY.fobJpy,
      fobCurrency: "JPY",
      fxRateToGhs: MONEY.fxRateToGhs,
      serviceFeeGhs: MONEY.serviceFeeGhs,
      freightGhs: MONEY.freightGhs,
      quantity: 1,
      etaDays: 45,
      status: "SOLD_OUT",
      images: {
        create: PHOTOS.map((url, i) => ({
          url,
          alt: `${SPEC.year} ${SPEC.make} ${SPEC.model}`,
          position: i,
        })),
      },
    },
  });

  // ── the import, cleared ───────────────────────────────────
  const request = await prisma.importRequest.create({
    data: {
      requestNumber: "IMP-2026-0147",
      userId: dealerUser.id,
      listingId: listing.id,
      countryOfOrigin: "Japan",
      auctionSource: "USS Nagoya",
      make: SPEC.make,
      model: SPEC.model,
      year: SPEC.year,
      stage: "READY_FOR_DELIVERY",
      quotedCif: MONEY.quotedCif,
      quotedDuty: MONEY.quotedDuty,
      quotedShipping: MONEY.quotedShipping,
      quotedTotal: MONEY.quotedTotal,
      trackingNumber: "GRNDLGS-2606-8823",
      estimatedArrival: new Date("2026-07-01"),
      clearingAgentId: agent.id,
      actualDutyGhs: new Prisma.Decimal(MONEY.actualDuty),
      customsEntryNumber: ENTRY_NUMBER,
      clearedAt: CLEARED_ON,
      clearedById: agentUser.id,
      trackingEvents: {
        create: [
          ...JOURNEY.map((e) => ({
            stage: e.stage,
            title: e.title,
            location: e.location,
            timestamp: new Date(e.at),
          })),
          {
            stage: "CUSTOMS_CLEARANCE" as const,
            title: "Customs cleared",
            description: `Entry ${ENTRY_NUMBER}. Duty paid GH₵${MONEY.actualDuty.toLocaleString()}.`,
            location: "Tema",
            timestamp: CLEARED_ON,
          },
        ],
      },
    },
    include: { trackingEvents: true },
  });

  // The clearance as training data — exactly what the route writes.
  await prisma.dutyAssessment.create({
    data: assessmentFromClearance({
      make: SPEC.make,
      modelType: SPEC.model,
      yearOfManufacture: SPEC.year,
      chassisNumber: SPEC.chassisNumber,
      engineSizeCc: Math.round(SPEC.engineSize * 1000),
      fuelType: SPEC.fuelType,
      port: "Tema",
      totalTax: MONEY.actualDuty,
      predictedTotalTax: MONEY.quotedDuty,
      cifNcy: MONEY.quotedCif,
      customsEntryNumber: ENTRY_NUMBER,
      assessedAt: CLEARED_ON,
      submittedById: agentUser.id,
    }),
  });

  // ── into inventory, and onto the market ───────────────────
  const title = vehicleTitleFor({ ...SPEC });
  const landedCost = landedCostOf({
    quotedTotal: MONEY.quotedTotal,
    quotedCif: MONEY.quotedCif,
    quotedDuty: MONEY.quotedDuty,
    quotedShipping: MONEY.quotedShipping,
    actualDuty: MONEY.actualDuty,
  });

  const brand = await prisma.brand.upsert({
    where: { name: SPEC.make },
    create: { name: SPEC.make, slug: slugify(SPEC.make) },
    update: {},
  });
  const model = await prisma.vehicleModel.upsert({
    where: { brandId_slug: { brandId: brand.id, slug: slugify(SPEC.model) } },
    create: { brandId: brand.id, name: SPEC.model, slug: slugify(SPEC.model), bodyType: SPEC.bodyType },
    update: {},
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      slug: "2019-toyota-harrier-premium-adom",
      title,
      brandId: brand.id,
      modelId: model.id,
      year: SPEC.year,
      price: new Prisma.Decimal(MONEY.askingPrice),
      mileage: SPEC.mileage,
      fuelType: SPEC.fuelType,
      transmission: SPEC.transmission,
      bodyType: SPEC.bodyType,
      engineSize: SPEC.engineSize,
      color: SPEC.color,
      drivetrain: SPEC.drivetrain,
      condition: conditionForImport({ year: SPEC.year, mileage: SPEC.mileage }),
      vin: SPEC.chassisNumber,
      auctionGrade: SPEC.auctionGrade,
      description:
        "Imported by us from the USS Nagoya auction and cleared at Tema — the full history is on the passport below. Grade 4.5 sheet, two owners, full service history. Sunroof, half-leather, 360° camera, radar cruise.",
      features: [
        "Sunroof",
        "Half-leather interior",
        "360° camera",
        "Radar cruise control",
        "Push start",
        "Alloy wheels",
      ],
      countryOfOrigin: "Japan",
      importStatus: "CLEARED",
      status: "ACTIVE",
      verified: true,
      featured: true,
      city: "Accra",
      region: "Greater Accra",
      location: "East Legon, Accra",
      sellerId: dealerUser.id,
      dealerId: dealer.id,
      images: {
        create: PHOTOS.map((url, i) => ({ url, alt: title, isPrimary: i === 0, order: i })),
      },
    },
  });

  await prisma.importRequest.update({
    where: { id: request.id },
    data: { vehicleId: vehicle.id },
  });

  // ── the passport, replayed from the shipment ──────────────
  const passport = await prisma.vehiclePassport.create({
    data: { vin: SPEC.chassisNumber, vehicleId: vehicle.id, make: SPEC.make, model: SPEC.model, year: SPEC.year },
  });

  const backfill = passportBackfill(request.trackingEvents, { clearedById: agentUser.id });
  for (const event of backfill) {
    await prisma.vehicleEvent.create({
      data: {
        passportId: passport.id,
        type: event.type,
        title: event.title,
        notes: event.notes,
        occurredAt: event.occurredAt,
        verified: true,
        source: "import",
        recordedById: event.recordedById,
      },
    });
  }
  await prisma.vehicleEvent.create({
    data: {
      passportId: passport.id,
      type: "LISTED",
      title: "Listed for sale",
      notes: `Listed by ${dealer.businessName} · ${request.requestNumber}`,
      occurredAt: new Date("2026-07-08"),
      verified: true,
      source: "system",
      recordedById: dealerUser.id,
    },
  });

  const variance = MONEY.actualDuty - MONEY.quotedDuty;
  console.log("\n✅ Demo chain seeded\n");
  console.log(`   ${title}`);
  console.log(`   /vehicles/${vehicle.slug}\n`);
  console.log(`   Estimated duty   GH₵${MONEY.quotedDuty.toLocaleString()}`);
  console.log(`   Actually paid    GH₵${MONEY.actualDuty.toLocaleString()}  (+GH₵${variance.toLocaleString()})`);
  console.log(`   Landed cost      GH₵${landedCost?.toLocaleString()}`);
  console.log(`   Asking price     GH₵${MONEY.askingPrice.toLocaleString()}`);
  console.log(`   Passport events  ${backfill.length + 1}\n`);
  console.log("   Sign in as any of these (password: Password123):");
  console.log(`     dealer   ${PEOPLE.dealer.email}`);
  console.log(`     importer ${PEOPLE.importer.email}`);
  console.log(`     agent    ${PEOPLE.agent.email}\n`);
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
