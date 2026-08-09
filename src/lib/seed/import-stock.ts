import type { PrismaClient } from "@prisma/client";

/**
 * A working importer, their shelf, and the clearance history that prices it.
 *
 * Without the DutyAssessment rows the stock pages are technically fine and
 * practically useless: every car reports "we can't give a full landed cost",
 * because the landed-cost engine has nothing to calibrate against. The duty
 * figure is the whole reason to browse stock here rather than on SBT, so a
 * seed that cannot show it does not demonstrate the feature.
 *
 * Everything is dated relative to today. `buildCohortQuote` ignores anything
 * older than 270 days, so hardcoded dates would quietly stop producing quotes
 * a few months after they were written — the seed would rot into exactly the
 * "no estimate" state it exists to prevent.
 */

/** HS heading for spark-ignition cars, 1500–3000cc — what these all clear as. */
const HS_CODE = "8703.23.90";

/** GHS per USD applied by customs. Near the seeded retail rate, not identical. */
const CUSTOMS_FX = 15.2;

/**
 * Tax as a multiple of the HDV in cedis. Real ICUMS rows for a Camry land at
 * 0.4340 for three of four; the jitter below keeps the cohort from looking
 * synthetic while staying inside the observed spread.
 */
const TAX_RATIO = 0.43;

/** JPY→GHS, consistent with CUSTOMS_FX at roughly ¥148 to the dollar. */
const JPY_TO_GHS = 0.102;

/** N days back, snapped to midnight UTC so re-runs produce identical dates. */
function daysAgo(n: number): Date {
  const d = new Date(Date.now() - n * 86_400_000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export interface ImportStockSeedSummary {
  importers: number;
  listings: number;
  assessments: number;
}

export async function seedImportStock(
  prisma: PrismaClient,
  hashedPassword: string,
): Promise<ImportStockSeedSummary> {
  const thisYear = new Date().getFullYear();

  const user = await prisma.user.upsert({
    where: { email: "importer@carvista.com.gh" },
    update: { role: "IMPORTER" },
    create: {
      email: "importer@carvista.com.gh",
      name: "Kojo Mensah",
      role: "IMPORTER",
      hashedPassword,
      emailVerified: new Date(),
    },
  });

  const importer = await prisma.importer.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      businessName: "Sunrise Motors Japan",
      slug: "sunrise-motors-japan",
      description:
        "Direct from Japanese auctions since 2016. We buy grade 4 and above, ship RORO to Tema, and clear in our own name.",
      sourceMarkets: ["Japan"],
      leadTimeDays: 45,
      phone: "0244000111",
      city: "Accra",
      region: "Greater Accra",
      verified: true,
    },
  });

  // ── Stock ───────────────────────────────────────────────────
  // Deliberately mixed: three fully priced cars covering the exact-trim,
  // model-median and cohort estimation tiers, and one with no exchange rate so
  // the "we can't total this yet" path is visible in the demo too.
  const stock = [
    {
      title: `${thisYear - 7} Toyota Harrier Premium — Grade 4.5`,
      make: "Toyota", model: "Harrier", trim: "Premium", year: thisYear - 7,
      bodyType: "SUV" as const, fob: 2_450_000, fx: JPY_TO_GHS,
      freight: 21_000, fee: 4_500, qty: 3, grade: "4.5", mileage: 48_000,
    },
    {
      title: `${thisYear - 8} Honda Vezel Hybrid Z — Grade 4`,
      make: "Honda", model: "Vezel", trim: "Hybrid Z", year: thisYear - 8,
      bodyType: "SUV" as const, fob: 1_180_000, fx: JPY_TO_GHS,
      freight: 19_500, fee: 4_000, qty: 2, grade: "4", mileage: 62_000,
    },
    {
      title: `${thisYear - 6} Toyota Corolla Fielder — Grade 4.5`,
      make: "Toyota", model: "Corolla", trim: "Fielder", year: thisYear - 6,
      bodyType: "WAGON" as const, fob: 1_320_000, fx: JPY_TO_GHS,
      freight: 19_000, fee: 3_500, qty: 5, grade: "4.5", mileage: 71_000,
    },
    {
      title: `${thisYear - 5} Nissan X-Trail — rate pending`,
      make: "Nissan", model: "X-Trail", trim: null, year: thisYear - 5,
      bodyType: "SUV" as const, fob: 2_050_000, fx: null,
      freight: 22_000, fee: 5_000, qty: 1, grade: "4", mileage: 39_000,
    },
  ];

  for (const s of stock) {
    const slug = `${s.year}-${s.make}-${s.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.importListing.upsert({
      where: { slug },
      update: {},
      create: {
        importerId: importer.id,
        slug,
        title: s.title,
        make: s.make,
        model: s.model,
        trim: s.trim,
        year: s.year,
        mileage: s.mileage,
        fuelType: "PETROL",
        transmission: "AUTOMATIC",
        bodyType: s.bodyType,
        countryOfOrigin: "Japan",
        portOfLoading: "Nagoya",
        auctionGrade: s.grade,
        fobAmount: s.fob,
        fobCurrency: "JPY",
        fxRateToGhs: s.fx,
        freightGhs: s.freight,
        serviceFeeGhs: s.fee,
        quantity: s.qty,
        etaDays: 45,
        status: "ACTIVE",
        features: [],
      },
    });
  }

  // ── Clearance history ───────────────────────────────────────
  // The Harrier rows carry an HdvReference too, so it quotes from GRA's own
  // reference value (EXACT tier). The Vezel and Corolla have no reference, so
  // they fall through to the cohort median — which is what most cars will do
  // until the HDV catalogue fills out.
  const assessments = [
    // Harrier: three rows, all at age 7, which is what the listing needs to
    // calibrate against.
    { ref: "HAR-1", make: "Toyota", model: "Harrier", trim: "Premium", age: 7, days: 55, hdv: 18_500, jitter: 1.0 },
    { ref: "HAR-2", make: "Toyota", model: "Harrier", trim: "Elegance", age: 7, days: 130, hdv: 17_400, jitter: 0.995 },
    { ref: "HAR-3", make: "Toyota", model: "Harrier", trim: "Premium", age: 7, days: 235, hdv: 18_500, jitter: 1.004 },
    // Vezel: three of the listing's own year, enough for the HIGH cohort tier.
    { ref: "VEZ-1", make: "Honda", model: "Vezel", trim: "Hybrid Z", age: 8, days: 40, hdv: 11_500, jitter: 1.002 },
    { ref: "VEZ-2", make: "Honda", model: "Vezel", trim: "Hybrid X", age: 8, days: 120, hdv: 11_500, jitter: 0.997 },
    { ref: "VEZ-3", make: "Honda", model: "Vezel", trim: "Hybrid Z", age: 8, days: 210, hdv: 11_200, jitter: 1.006 },
    // Corolla: only two, so it lands on MEDIUM — the tier badge earns its keep.
    { ref: "COR-1", make: "Toyota", model: "Corolla", trim: "Fielder", age: 6, days: 70, hdv: 9_800, jitter: 1.0 },
    { ref: "COR-2", make: "Toyota", model: "Corolla", trim: "Fielder", age: 7, days: 180, hdv: 9_200, jitter: 0.998 },
  ];

  let written = 0;
  for (const a of assessments) {
    const assessedAt = daysAgo(a.days);
    const yearOfManufacture = assessedAt.getFullYear() - a.age;
    const hdvGhs = a.hdv * CUSTOMS_FX;
    const totalTax = Math.round(hdvGhs * TAX_RATIO * a.jitter * 100) / 100;

    // Real assessments are identified by chassis, so a synthetic one is the
    // natural key here. Trim and year are NOT enough: two Vezels of the same
    // trim and year clearing months apart are two different cars, and keying
    // on those silently drops the second. The SEED- prefix keeps demo rows
    // distinguishable from community submissions, and deletable in one query.
    const chassisNumber = `SEED-${a.ref}`;
    const existing = await prisma.dutyAssessment.findFirst({
      where: { chassisNumber },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.dutyAssessment.create({
      data: {
        chassisNumber,
        make: a.make,
        modelType: a.model,
        trimLevel: a.trim,
        yearOfManufacture,
        vehicleType: "SUV",
        hsCode: HS_CODE,
        hsDescription: "Motor cars, spark-ignition, 1500–3000cc",
        hdv: a.hdv,
        hdvCurrency: "USD",
        cifNcy: Math.round(hdvGhs * 1.12 * 100) / 100,
        totalTax,
        exchangeRate: CUSTOMS_FX,
        assessedAt,
        port: "Tema",
        source: "ICUMS_LOOKUP",
        status: "VERIFIED",
        documentUrls: [],
      },
    });
    written += 1;
  }

  // GRA reference values for the Harrier only, so one car demonstrates the
  // HDV-anchored path and the rest demonstrate the fallback.
  const harrierYear = thisYear - 7;
  for (const ref of [
    { trim: "PREMIUM", hdv: 18_500 },
    { trim: "ELEGANCE", hdv: 17_400 },
  ]) {
    await prisma.hdvReference.upsert({
      where: {
        make_model_year_trim: {
          make: "TOYOTA",
          model: "HARRIER",
          year: harrierYear,
          trim: ref.trim,
        },
      },
      update: { hdv: ref.hdv, hsCode: HS_CODE, lastObservedAt: daysAgo(55) },
      create: {
        make: "TOYOTA",
        model: "HARRIER",
        year: harrierYear,
        trim: ref.trim,
        hdv: ref.hdv,
        currency: "USD",
        hsCode: HS_CODE,
        lastObservedAt: daysAgo(55),
      },
    });
  }

  return { importers: 1, listings: stock.length, assessments: written };
}
