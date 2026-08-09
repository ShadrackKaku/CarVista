/**
 * Data-access layer.
 *
 * These functions read from the live PostgreSQL database via Prisma and map the
 * records into the display shapes used by the UI. Every function degrades
 * gracefully: if the database is unreachable OR has no rows yet, it falls back
 * to the built-in sample catalogue so the site is never broken or empty.
 *
 * As real dealers/sellers add listings, those records take over automatically.
 */
import { cache } from "react";
import type { SupplierCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { formatNumber } from "@/lib/utils";
import { isMilestonePayable } from "@/lib/escrow";
import { holdingWhere } from "@/lib/reservations";
import {
  getExpandedVehicles,
  SAMPLE_PARTS,
  SAMPLE_DEALERS,
  SAMPLE_SERVICES,
  SAMPLE_BLOG_POSTS,
  HOME_STATS,
  type SampleVehicle,
  type SamplePart,
  type SampleDealer,
  type SampleService,
  type SampleBlogPost,
} from "@/lib/sample-data";
import { SERVICE_TYPES } from "@/lib/constants";

const PLACEHOLDER_VEHICLE =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_PART =
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1562141961-b5d1dc5c1e9b?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_LOGO =
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80";

const num = (d: Prisma.Decimal | number | null | undefined) =>
  d == null ? 0 : typeof d === "number" ? d : Number(d);

// ── Vehicles ──────────────────────────────────────────────────
const vehicleInclude = {
  brand: true,
  model: true,
  images: { orderBy: { order: "asc" } },
  videos: { orderBy: { order: "asc" }, take: 1 },
  dealer: { select: { businessName: true, slug: true, verified: true } },
  seller: { select: { name: true } },
} satisfies Prisma.VehicleInclude;

type VehicleRow = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;

function mapVehicle(v: VehicleRow): SampleVehicle {
  const images = v.images.length ? v.images.map((i) => i.url) : [PLACEHOLDER_VEHICLE];
  return {
    id: v.id,
    slug: v.slug,
    title: v.title,
    brand: v.brand.name,
    model: v.model?.name ?? "",
    year: v.year,
    price: num(v.price),
    mileage: v.mileage,
    fuelType: v.fuelType,
    transmission: v.transmission,
    engineSize: v.engineSize ?? 0,
    bodyType: v.bodyType,
    color: v.color ?? "",
    condition: v.condition,
    importStatus: v.importStatus,
    city: v.city ?? "",
    region: v.region ?? undefined,
    countryOfOrigin: v.countryOfOrigin ?? undefined,
    location: v.location ?? v.city ?? "",
    featured: v.featured,
    verified: v.verified,
    sellerId: v.sellerId,
    auctionGrade: v.auctionGrade ?? undefined,
    vin: v.vin ?? undefined,
    images,
    dealer: {
      name: v.dealer?.businessName ?? v.seller.name ?? "Private Seller",
      slug: v.dealer?.slug ?? "",
      verified: v.dealer?.verified ?? false,
    },
    features: v.features ?? [],
    description: v.description ?? "",
    videoUrl: v.videos[0]?.url,
  };
}

export const getVehicles = cache(async (): Promise<SampleVehicle[]> => {
  try {
    const rows = await prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      include: vehicleInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 120,
    });
    return rows.length ? rows.map(mapVehicle) : getExpandedVehicles();
  } catch {
    return getExpandedVehicles();
  }
});

export const getVehicleBySlug = cache(async (slug: string): Promise<SampleVehicle | null> => {
  try {
    const row = await prisma.vehicle.findUnique({ where: { slug }, include: vehicleInclude });
    if (row) return mapVehicle(row);
  } catch {
    // fall through to sample
  }
  return getExpandedVehicles().find((v) => v.slug === slug) ?? null;
});

export async function getFeaturedVehicles(limit = 8): Promise<SampleVehicle[]> {
  const all = await getVehicles();
  const featured = all.filter((v) => v.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/**
 * Discovery: vehicles similar to the one at `slug`, ranked by shared
 * brand/body/condition and price proximity. Works over the same catalogue as
 * the marketplace, so it degrades gracefully with the sample fallback.
 */
export async function getSimilarVehicles(slug: string, limit = 4): Promise<SampleVehicle[]> {
  const all = await getVehicles();
  const base = all.find((v) => v.slug === slug) ?? (await getVehicleBySlug(slug));
  if (!base) return [];
  return all
    .filter((v) => v.slug !== slug)
    .map((v) => {
      let score = 0;
      if (v.brand === base.brand) score += 3;
      if (v.bodyType === base.bodyType) score += 2;
      if (v.condition === base.condition) score += 1;
      const priceGap = Math.abs(v.price - base.price) / Math.max(base.price, 1);
      if (priceGap <= 0.25) score += 2;
      else if (priceGap <= 0.5) score += 1;
      return { v, score, priceGap };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.priceGap - b.priceGap)
    .slice(0, limit)
    .map((x) => x.v);
}

// ── Trust & verification ──────────────────────────────────────
export interface DealerVerificationView {
  isDealer: boolean;
  verified: boolean;
  status: string | null; // PENDING | APPROVED | REJECTED | null (never submitted)
  reviewNote: string | null;
  submittedAt: Date | null;
  fields: {
    businessRegNumber: string;
    taxId: string | null;
    contactName: string;
    contactPhone: string;
    idType: string;
    idNumber: string;
    documentUrl: string | null;
    notes: string | null;
  } | null;
}

/** The signed-in dealer's own verification state, for their KYC page. */
export async function getDealerVerification(userId: string): Promise<DealerVerificationView> {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { userId },
      select: { verified: true, verification: true },
    });
    if (!dealer) {
      return { isDealer: false, verified: false, status: null, reviewNote: null, submittedAt: null, fields: null };
    }
    const v = dealer.verification;
    return {
      isDealer: true,
      verified: dealer.verified,
      status: v?.status ?? null,
      reviewNote: v?.reviewNote ?? null,
      submittedAt: v?.submittedAt ?? null,
      fields: v
        ? {
            businessRegNumber: v.businessRegNumber,
            taxId: v.taxId,
            contactName: v.contactName,
            contactPhone: v.contactPhone,
            idType: v.idType,
            idNumber: v.idNumber,
            documentUrl: v.documentUrl,
            notes: v.notes,
          }
        : null,
    };
  } catch {
    return { isDealer: false, verified: false, status: null, reviewNote: null, submittedAt: null, fields: null };
  }
}

export interface AdminVerificationRow {
  id: string;
  dealerName: string;
  businessRegNumber: string;
  contactName: string;
  contactPhone: string;
  idType: string;
  idNumber: string;
  documentUrl: string | null;
  notes: string | null;
  status: string;
  submittedAt: Date;
}

/** All dealer verifications for the admin review queue (pending first). */
export async function getAdminVerifications(): Promise<AdminVerificationRow[]> {
  try {
    const rows = await prisma.dealerVerification.findMany({
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      take: 200,
      include: { dealer: { select: { businessName: true } } },
    });
    return rows.map((v) => ({
      id: v.id,
      dealerName: v.dealer?.businessName ?? "—",
      businessRegNumber: v.businessRegNumber,
      contactName: v.contactName,
      contactPhone: v.contactPhone,
      idType: v.idType,
      idNumber: v.idNumber,
      documentUrl: v.documentUrl,
      notes: v.notes,
      status: v.status,
      submittedAt: v.submittedAt,
    }));
  } catch {
    return [];
  }
}

export interface AdminAssessmentRow {
  id: string;
  chassisNumber: string | null;
  vehicle: string; // "2016 Toyota Corolla LE"
  engineSizeCc: number | null;
  fuelType: string | null;
  hsCode: string | null;
  hdv: number | null;
  cifNcy: number | null;
  totalTax: number;
  exchangeRate: number | null;
  assessedAt: Date | null;
  port: string;
  source: string;
  status: string;
  documentUrls: string[];
  notes: string | null;
  submittedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
}

/** Duty-assessment submissions for the admin verification queue (pending first). */
export async function getAdminAssessments(): Promise<AdminAssessmentRow[]> {
  try {
    const rows = await prisma.dutyAssessment.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: { submittedBy: { select: { name: true, email: true } } },
    });
    return rows.map((a) => ({
      id: a.id,
      chassisNumber: a.chassisNumber,
      vehicle: [a.yearOfManufacture, a.make, a.modelType, a.trimLevel]
        .filter(Boolean)
        .join(" "),
      engineSizeCc: a.engineSizeCc,
      fuelType: a.fuelType,
      hsCode: a.hsCode,
      hdv: a.hdv ? Number(a.hdv) : null,
      cifNcy: a.cifNcy ? Number(a.cifNcy) : null,
      totalTax: Number(a.totalTax),
      exchangeRate: a.exchangeRate ? Number(a.exchangeRate) : null,
      assessedAt: a.assessedAt,
      port: a.port,
      source: a.source,
      status: a.status,
      documentUrls: a.documentUrls,
      notes: a.notes,
      submittedBy: a.submittedBy?.name ?? a.submittedBy?.email ?? null,
      rejectionReason: a.rejectionReason,
      createdAt: a.createdAt,
    }));
  } catch {
    return [];
  }
}

/** Verified customs observations for a model cohort (year ±1) + the latest
 *  observed customs FX rate — the inputs to buildCohortQuote(). */
export async function getLandedCostCohort(params: {
  make: string;
  model: string;
  year: number;
  icumsMakeCode?: string;
  icumsModelCode?: string;
}): Promise<{
  observations: import("@/lib/landed-cost").CohortObservation[];
  fxRate: number | null;
  fxAsOf: Date | null;
} | null> {
  try {
    // Match on the ICUMS codes OR the names — never codes alone. Observations
    // arrive from several routes (pasted checker rows, community tax bills,
    // agent logs) and only some carry codes, so a code-exclusive filter would
    // silently ignore perfectly good records for the same vehicle.
    const matchers: {
      make?: { equals: string; mode: "insensitive" };
      modelType?: { equals: string; mode: "insensitive" };
      icumsMakeCode?: string;
      icumsModelCode?: string;
    }[] = [
      {
        make: { equals: params.make, mode: "insensitive" },
        modelType: { equals: params.model, mode: "insensitive" },
      },
    ];
    if (params.icumsMakeCode && params.icumsModelCode) {
      matchers.push({
        icumsMakeCode: params.icumsMakeCode,
        icumsModelCode: params.icumsModelCode,
      });
    }

    const rows = await prisma.dutyAssessment.findMany({
      where: {
        status: "VERIFIED",
        yearOfManufacture: { gte: params.year - 1, lte: params.year + 1 },
        OR: matchers,
      },
      orderBy: { assessedAt: "desc" },
      take: 40,
      select: {
        trimLevel: true,
        yearOfManufacture: true,
        hdv: true,
        cifNcy: true,
        totalTax: true,
        exchangeRate: true,
        assessedAt: true,
        port: true,
      },
    });

    // Latest observed customs FX rate across ALL verified assessments — the
    // rate is national (weekly), not model-specific.
    const latestFx = await prisma.dutyAssessment.findFirst({
      where: { status: "VERIFIED", exchangeRate: { not: null } },
      orderBy: { assessedAt: "desc" },
      select: { exchangeRate: true, assessedAt: true },
    });

    return {
      observations: rows.map((r) => ({
        trimLevel: r.trimLevel,
        yearOfManufacture: r.yearOfManufacture,
        hdv: r.hdv ? Number(r.hdv) : null,
        cifNcy: r.cifNcy ? Number(r.cifNcy) : null,
        totalTax: Number(r.totalTax),
        exchangeRate: r.exchangeRate ? Number(r.exchangeRate) : null,
        assessedAt: r.assessedAt,
        port: r.port,
      })),
      fxRate: latestFx?.exchangeRate ? Number(latestFx.exchangeRate) : null,
      fxAsOf: latestFx?.assessedAt ?? null,
    };
  } catch {
    return null;
  }
}

/** Inputs for the HDV-anchored estimate: the vehicle's stored HDV plus the
 *  observations to calibrate the tax ratio from. */
export async function getHdvQuoteInputs(params: {
  make: string;
  model: string;
  year: number;
  trim?: string;
}): Promise<{
  hdv: number;
  hdvCurrency: string;
  hsCode: string | null;
  exactTrim: boolean;
  /** Trims we hold an HDV for, so the UI can offer them. */
  availableTrims: string[];
  observations: import("@/lib/landed-cost").CalibrationObservation[];
  fxRate: number | null;
  fxAsOf: Date | null;
} | null> {
  try {
    const make = params.make.trim().toUpperCase();
    const model = params.model.trim().toUpperCase();

    const refs = await prisma.hdvReference.findMany({
      where: { make, model, year: params.year },
      select: { trim: true, hdv: true, currency: true, hsCode: true },
    });
    if (refs.length === 0) return null;

    const wantTrim = params.trim?.trim().toUpperCase();
    const exact = wantTrim ? refs.find((r) => r.trim === wantTrim) : undefined;
    // Without a trim (or on an unknown one) the model-year median is the fair
    // central estimate — trims differ in value, so we say so in the tier.
    const chosenHdv = exact
      ? Number(exact.hdv)
      : medianOf(refs.map((r) => Number(r.hdv)));
    const chosen = exact ?? refs[0];

    const hsCode = (exact ?? refs.find((r) => r.hsCode))?.hsCode ?? null;

    // Calibrate from assessments of the same HS class (the ratio is a property
    // of the tax regime, not the model), falling back to the same vehicle.
    const observations = await prisma.dutyAssessment.findMany({
      where: {
        status: "VERIFIED",
        hdv: { not: null },
        exchangeRate: { not: null },
        ...(hsCode
          ? { OR: [{ hsCode }, { make: { equals: params.make, mode: "insensitive" } }] }
          : { make: { equals: params.make, mode: "insensitive" } }),
      },
      orderBy: { assessedAt: "desc" },
      take: 200,
      select: {
        hsCode: true,
        hdv: true,
        cifNcy: true,
        totalTax: true,
        exchangeRate: true,
        yearOfManufacture: true,
        assessedAt: true,
      },
    });

    const latestFx = await prisma.dutyAssessment.findFirst({
      where: { status: "VERIFIED", exchangeRate: { not: null } },
      orderBy: { assessedAt: "desc" },
      select: { exchangeRate: true, assessedAt: true },
    });

    return {
      hdv: chosenHdv,
      hdvCurrency: chosen.currency,
      hsCode,
      exactTrim: Boolean(exact),
      availableTrims: refs.map((r) => r.trim).filter(Boolean).sort(),
      observations: observations.map((o) => ({
        hsCode: o.hsCode,
        hdv: o.hdv ? Number(o.hdv) : null,
        cifNcy: o.cifNcy ? Number(o.cifNcy) : null,
        totalTax: Number(o.totalTax),
        exchangeRate: o.exchangeRate ? Number(o.exchangeRate) : null,
        yearOfManufacture: o.yearOfManufacture,
        assessedAt: o.assessedAt,
      })),
      fxRate: latestFx?.exchangeRate ? Number(latestFx.exchangeRate) : null,
      fxAsOf: latestFx?.assessedAt ?? null,
    };
  } catch {
    return null;
  }
}

/** Every verified observation the engine could learn from, for the accuracy
 *  backtest. Labelled so the admin view can name the worst misses. */
export async function getBacktestObservations(): Promise<
  { observation: import("@/lib/landed-cost").CalibrationObservation; label: string }[]
> {
  try {
    const rows = await prisma.dutyAssessment.findMany({
      where: { status: "VERIFIED", hdv: { not: null }, exchangeRate: { not: null } },
      orderBy: { assessedAt: "desc" },
      take: 500,
      select: {
        hsCode: true,
        hdv: true,
        cifNcy: true,
        totalTax: true,
        exchangeRate: true,
        yearOfManufacture: true,
        assessedAt: true,
        make: true,
        modelType: true,
        trimLevel: true,
      },
    });
    return rows.map((r) => ({
      observation: {
        hsCode: r.hsCode,
        hdv: r.hdv ? Number(r.hdv) : null,
        cifNcy: r.cifNcy ? Number(r.cifNcy) : null,
        totalTax: Number(r.totalTax),
        exchangeRate: r.exchangeRate ? Number(r.exchangeRate) : null,
        yearOfManufacture: r.yearOfManufacture,
        assessedAt: r.assessedAt,
      },
      label: [r.yearOfManufacture, r.make, r.modelType, r.trimLevel]
        .filter(Boolean)
        .join(" "),
    }));
  } catch {
    return [];
  }
}

/** How much reference data we hold — the coverage half of the scoreboard. */
export async function getCoverageStats(): Promise<{
  assessments: number;
  verified: number;
  hdvReferences: number;
  distinctModels: number;
}> {
  try {
    const [assessments, verified, hdvReferences, grouped] = await Promise.all([
      prisma.dutyAssessment.count(),
      prisma.dutyAssessment.count({ where: { status: "VERIFIED" } }),
      prisma.hdvReference.count(),
      prisma.hdvReference.groupBy({ by: ["make", "model"], _count: true }),
    ]);
    return { assessments, verified, hdvReferences, distinctModels: grouped.length };
  } catch {
    return { assessments: 0, verified: 0, hdvReferences: 0, distinctModels: 0 };
  }
}

/** Local median so this file doesn't depend on the estimator module. */
function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface InspectionRow {
  id: string;
  ref: string;
  customer: string | null;
  vehicleInfo: string;
  location: string;
  scheduledAt: Date;
  status: string;
  overallGrade: string | null;
  reportSummary: string | null;
  reportUrl: string | null;
  inspectedAt: Date | null;
}

function mapInspection(b: {
  id: string;
  bookingNumber: string;
  vehicleInfo: string;
  location: string;
  scheduledAt: Date;
  status: string;
  overallGrade: string | null;
  reportSummary: string | null;
  reportUrl: string | null;
  inspectedAt: Date | null;
  user?: { name: string | null } | null;
}): InspectionRow {
  return {
    id: b.id,
    ref: b.bookingNumber,
    customer: b.user?.name ?? null,
    vehicleInfo: b.vehicleInfo,
    location: b.location,
    scheduledAt: b.scheduledAt,
    status: b.status,
    overallGrade: b.overallGrade,
    reportSummary: b.reportSummary,
    reportUrl: b.reportUrl,
    inspectedAt: b.inspectedAt,
  };
}

/** All inspection bookings for the admin ops view. */
export async function getAdminInspections(): Promise<InspectionRow[]> {
  try {
    const rows = await prisma.inspectionBooking.findMany({
      orderBy: { scheduledAt: "desc" },
      take: 200,
      include: { user: { select: { name: true } } },
    });
    return rows.map(mapInspection);
  } catch {
    return [];
  }
}

/** A customer's own inspections + reports. */
export async function getUserInspections(userId: string): Promise<InspectionRow[]> {
  try {
    const rows = await prisma.inspectionBooking.findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });
    return rows.map((b) => mapInspection(b));
  } catch {
    return [];
  }
}

export interface SavedSearchView {
  id: string;
  name: string;
  query: string;
  createdAt: Date;
}

export async function getUserSavedSearches(userId: string): Promise<SavedSearchView[]> {
  try {
    return await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, query: true, createdAt: true },
    });
  } catch {
    return [];
  }
}

export async function getLatestImports(limit = 4): Promise<SampleVehicle[]> {
  const all = await getVehicles();
  return all.filter((v) => v.importStatus !== "NOT_IMPORTED").slice(0, limit);
}

// ── Parts ─────────────────────────────────────────────────────
const partInclude = {
  category: true,
  images: { orderBy: { order: "asc" } },
  store: { select: { storeName: true, slug: true, verified: true } },
  seller: { select: { name: true } },
} satisfies Prisma.PartInclude;

type PartRow = Prisma.PartGetPayload<{ include: typeof partInclude }>;

function mapPart(p: PartRow): SamplePart {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.name,
    categorySlug: p.category.slug,
    brand: p.brand ?? "OEM",
    price: num(p.price),
    discountPrice: p.discountPrice ? num(p.discountPrice) : undefined,
    condition: p.condition,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    oemNumber: p.oemNumber ?? undefined,
    compatibleMakes: p.compatibleMakes ?? [],
    image: p.images[0]?.url ?? PLACEHOLDER_PART,
    store: {
      name: p.store?.storeName ?? p.seller.name ?? "CarVista Store",
      slug: p.store?.slug ?? "",
      verified: p.store?.verified ?? false,
    },
    featured: p.featured,
    description: p.description ?? undefined,
  };
}

export const getParts = cache(async (): Promise<SamplePart[]> => {
  try {
    const rows = await prisma.part.findMany({
      where: { status: "ACTIVE" },
      include: partInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 120,
    });
    return rows.length ? rows.map(mapPart) : SAMPLE_PARTS;
  } catch {
    return SAMPLE_PARTS;
  }
});

export const getPartBySlug = cache(async (slug: string): Promise<SamplePart | null> => {
  try {
    const row = await prisma.part.findUnique({ where: { slug }, include: partInclude });
    if (row) return mapPart(row);
  } catch {
    // fall through
  }
  return SAMPLE_PARTS.find((p) => p.slug === slug) ?? null;
});

export interface PartEditData {
  id: string;
  sellerId: string;
  name: string;
  categorySlug: string;
  brand: string;
  oemNumber: string;
  partNumber: string;
  condition: string;
  price: string;
  discountPrice: string;
  stock: number;
  sku: string;
  compatibleMakes: string[];
  compatibleModels: string[];
  yearFrom: string;
  yearTo: string;
  fitmentPosition: string;
  description: string;
  images: string[];
}

/**
 * Full editable shape of a part for the seller edit form (all fields, not just
 * the trimmed SamplePart). Ownership is checked by the caller against sellerId.
 * Returns null when the part doesn't exist or the DB is unavailable.
 */
export async function getPartForEdit(id: string): Promise<PartEditData | null> {
  try {
    const p = await prisma.part.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true } },
        images: { orderBy: { order: "asc" } },
      },
    });
    if (!p) return null;
    return {
      id: p.id,
      sellerId: p.sellerId,
      name: p.name,
      categorySlug: p.category.slug,
      brand: p.brand ?? "",
      oemNumber: p.oemNumber ?? "",
      partNumber: p.partNumber ?? "",
      condition: p.condition,
      price: String(num(p.price)),
      discountPrice: p.discountPrice ? String(num(p.discountPrice)) : "",
      stock: p.stock,
      sku: p.sku ?? "",
      compatibleMakes: p.compatibleMakes ?? [],
      compatibleModels: p.compatibleModels ?? [],
      yearFrom: p.yearFrom ? String(p.yearFrom) : "",
      yearTo: p.yearTo ? String(p.yearTo) : "",
      fitmentPosition: p.fitmentPosition ?? "",
      description: p.description ?? "",
      images: p.images.map((i) => i.url),
    };
  } catch {
    return null;
  }
}

export async function getFeaturedParts(limit = 5): Promise<SamplePart[]> {
  const all = await getParts();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

// ── Homepage stats ────────────────────────────────────────────
export interface HomeStat {
  label: string;
  value: string;
}

/** Live homepage hero figures. Falls back to marketing numbers if the DB is
 * empty or unavailable so the hero never shows zeros. */
export const getHomeStats = cache(async (): Promise<HomeStat[]> => {
  try {
    const [vehicles, dealers, imported, customers] = await Promise.all([
      prisma.vehicle.count(),
      prisma.dealer.count({ where: { verified: true } }),
      prisma.vehicle.count({ where: { importStatus: "CLEARED" } }),
      prisma.user.count(),
    ]);

    // Nothing meaningful in the DB yet → keep the placeholder figures.
    if (vehicles === 0 && dealers === 0 && customers === 0) return HOME_STATS;

    return [
      { label: "Vehicles Listed", value: `${formatNumber(vehicles)}+` },
      { label: "Verified Dealers", value: `${formatNumber(dealers)}+` },
      { label: "Cars Imported", value: `${formatNumber(imported)}+` },
      { label: "Happy Customers", value: `${formatNumber(customers)}+` },
    ];
  } catch {
    return HOME_STATS;
  }
});

// ── Vehicle Passport ──────────────────────────────────────────
export interface PassportEvent {
  id: string;
  type: string;
  title: string;
  notes: string | null;
  occurredAt: Date;
  verified: boolean;
  recordedBy: string | null;
}

export interface VehiclePassportView {
  vin: string;
  events: PassportEvent[];
}

/** The public trust timeline for a listed vehicle, newest first. */
export async function getVehiclePassport(vehicleId: string): Promise<VehiclePassportView | null> {
  try {
    const passport = await prisma.vehiclePassport.findUnique({
      where: { vehicleId },
      include: {
        events: {
          orderBy: { occurredAt: "desc" },
          include: { recordedBy: { select: { name: true } } },
        },
      },
    });
    if (!passport) return null;
    return {
      vin: passport.vin,
      events: passport.events.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        notes: e.notes,
        occurredAt: e.occurredAt,
        verified: e.verified,
        recordedBy: e.recordedBy?.name ?? null,
      })),
    };
  } catch {
    return null;
  }
}

// ── Dealers ───────────────────────────────────────────────────
const dealerInclude = {
  _count: { select: { vehicles: true } },
} satisfies Prisma.DealerInclude;

type DealerRow = Prisma.DealerGetPayload<{ include: typeof dealerInclude }>;

function mapDealer(d: DealerRow): SampleDealer {
  return {
    id: d.id,
    slug: d.slug,
    name: d.businessName,
    city: d.city ?? "",
    region: d.region ?? "",
    verified: d.verified,
    rating: d.rating,
    reviewCount: d.reviewCount,
    vehicleCount: d._count.vehicles,
    yearsInBusiness: d.yearsInBusiness ?? 1,
    logo: d.logo ?? PLACEHOLDER_LOGO,
    cover: d.coverImage ?? PLACEHOLDER_COVER,
    description: d.description ?? "",
  };
}

export async function getDealers(): Promise<SampleDealer[]> {
  try {
    const rows = await prisma.dealer.findMany({
      include: dealerInclude,
      orderBy: [{ verified: "desc" }, { rating: "desc" }],
      take: 60,
    });
    return rows.length ? rows.map(mapDealer) : SAMPLE_DEALERS;
  } catch {
    return SAMPLE_DEALERS;
  }
}

export const getDealerBySlug = cache(async (slug: string): Promise<SampleDealer | null> => {
  try {
    const row = await prisma.dealer.findUnique({ where: { slug }, include: dealerInclude });
    if (row) return mapDealer(row);
  } catch {
    // fall through
  }
  return SAMPLE_DEALERS.find((d) => d.slug === slug) ?? null;
});

// ── Services ──────────────────────────────────────────────────
function serviceTypeLabel(type: string): string {
  return SERVICE_TYPES.find((t) => t.value === type)?.label.replace(/s$/, "") ?? "Service";
}

function mapService(s: Prisma.ServiceProviderGetPayload<object>): SampleService {
  return {
    id: s.id,
    slug: s.slug,
    name: s.businessName,
    type: s.serviceType,
    typeLabel: serviceTypeLabel(s.serviceType),
    city: s.city ?? "",
    region: s.region ?? "",
    verified: s.verified,
    rating: s.rating,
    reviewCount: s.reviewCount,
    image: s.coverImage ?? s.logo ?? PLACEHOLDER_COVER,
    services: s.services ?? [],
    priceRange: s.priceRange ?? "Contact for quote",
  };
}

export async function getServices(): Promise<SampleService[]> {
  try {
    const rows = await prisma.serviceProvider.findMany({
      orderBy: [{ verified: "desc" }, { rating: "desc" }],
      take: 60,
    });
    return rows.length ? rows.map(mapService) : SAMPLE_SERVICES;
  } catch {
    return SAMPLE_SERVICES;
  }
}

export const getServiceBySlug = cache(async (slug: string): Promise<SampleService | null> => {
  try {
    const row = await prisma.serviceProvider.findUnique({ where: { slug } });
    if (row) return mapService(row);
  } catch {
    // fall through
  }
  return SAMPLE_SERVICES.find((s) => s.slug === slug) ?? null;
});

// ── Blog ──────────────────────────────────────────────────────
const blogInclude = {
  author: { select: { name: true } },
  category: true,
} satisfies Prisma.BlogPostInclude;

type BlogRow = Prisma.BlogPostGetPayload<{ include: typeof blogInclude }>;

function mapBlog(b: BlogRow): SampleBlogPost {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt ?? "",
    category: b.category?.name ?? "Article",
    cover: b.coverImage ?? PLACEHOLDER_COVER,
    author: b.author?.name ?? "CarVista Editorial",
    date: (b.publishedAt ?? b.createdAt).toISOString().slice(0, 10),
    readTime: b.readTime,
    content: b.content,
  };
}

export async function getBlogPosts(): Promise<SampleBlogPost[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      include: blogInclude,
      orderBy: { publishedAt: "desc" },
      take: 30,
    });
    return rows.length ? rows.map(mapBlog) : SAMPLE_BLOG_POSTS;
  } catch {
    return SAMPLE_BLOG_POSTS;
  }
}

export const getBlogPostBySlug = cache(async (slug: string): Promise<SampleBlogPost | null> => {
  try {
    const row = await prisma.blogPost.findUnique({ where: { slug }, include: blogInclude });
    if (row) return mapBlog(row);
  } catch {
    // fall through
  }
  return SAMPLE_BLOG_POSTS.find((b) => b.slug === slug) ?? null;
});

export interface AdminBlogRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  cover: string;
  date: string;
  published: boolean;
  featured: boolean;
}

/**
 * All blog posts (drafts included) for the admin manager — unlike getBlogPosts,
 * which returns only published posts for the public site. Returns [] when the DB
 * is empty/unavailable (the admin list shows real, editable rows only, never the
 * read-only sample catalogue).
 */
export async function getAdminBlogPosts(): Promise<AdminBlogRow[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      include: blogInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      category: b.category?.name ?? "Article",
      cover: b.coverImage ?? PLACEHOLDER_COVER,
      date: (b.publishedAt ?? b.createdAt).toISOString().slice(0, 10),
      published: b.published,
      featured: b.featured,
    }));
  } catch {
    return [];
  }
}

export interface BlogPostEditData {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  tags: string[];
  readTime: number;
  published: boolean;
  featured: boolean;
}

/** Full editable shape of a blog post for the admin edit form. */
export async function getBlogPostForEdit(id: string): Promise<BlogPostEditData | null> {
  try {
    const b = await prisma.blogPost.findUnique({
      where: { id },
      include: { category: { select: { name: true } } },
    });
    if (!b) return null;
    return {
      id: b.id,
      title: b.title,
      excerpt: b.excerpt ?? "",
      content: b.content,
      category: b.category?.name ?? "",
      coverImage: b.coverImage ?? "",
      tags: b.tags ?? [],
      readTime: b.readTime,
      published: b.published,
      featured: b.featured,
    };
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
//  USER-SCOPED (dashboard) queries — real data per logged-in user
// ══════════════════════════════════════════════════════════════

export interface DashboardStats {
  saved: number;
  imports: number;
  orders: number;
  unread: number;
}

export async function getCustomerStats(userId: string): Promise<DashboardStats> {
  try {
    const [saved, imports, orders, unread] = await Promise.all([
      prisma.savedVehicle.count({ where: { userId } }),
      prisma.importRequest.count({ where: { userId } }),
      prisma.order.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return { saved, imports, orders, unread };
  } catch {
    return { saved: 0, imports: 0, orders: 0, unread: 0 };
  }
}

export async function getSavedVehicles(userId: string): Promise<SampleVehicle[]> {
  try {
    const rows = await prisma.savedVehicle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { vehicle: { include: vehicleInclude } },
    });
    return rows.map((r) => mapVehicle(r.vehicle));
  } catch {
    return [];
  }
}

export interface OrderSummary {
  number: string;
  date: Date;
  status: string;
  items: number;
  total: number;
}

export async function getUserOrders(userId: string): Promise<OrderSummary[]> {
  try {
    const rows = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
    return rows.map((o) => ({
      number: o.orderNumber,
      date: o.createdAt,
      status: o.status,
      items: o._count.items,
      total: num(o.total),
    }));
  } catch {
    return [];
  }
}

export interface ImportSummary {
  id: string;
  ref: string;
  title: string;
  origin: string;
  stage: string;
  total: number;
  eta: Date | null;
  lastUpdate: { title: string; date: Date } | null;
}

export async function getUserImports(userId: string): Promise<ImportSummary[]> {
  try {
    const rows = await prisma.importRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { trackingEvents: { orderBy: { timestamp: "desc" }, take: 1 } },
    });
    return rows.map((r) => ({
      id: r.id,
      ref: r.requestNumber,
      title: `${r.year} ${r.make} ${r.model}`,
      origin: r.countryOfOrigin,
      stage: r.stage,
      total: num(r.quotedTotal),
      eta: r.estimatedArrival,
      lastUpdate: r.trackingEvents[0]
        ? { title: r.trackingEvents[0].title, date: r.trackingEvents[0].timestamp }
        : null,
    }));
  } catch {
    return [];
  }
}

export async function getDealerListings(userId: string): Promise<SampleVehicle[]> {
  try {
    const rows = await prisma.vehicle.findMany({
      where: { sellerId: userId },
      include: vehicleInclude,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapVehicle);
  } catch {
    return [];
  }
}

/** Best-effort view counter — fire-and-forget from the vehicle detail beacon. */
export async function incrementVehicleViews(vehicleId: string): Promise<void> {
  try {
    await prisma.vehicle.updateMany({ where: { id: vehicleId }, data: { views: { increment: 1 } } });
  } catch {
    // sample-data vehicles have no DB row — nothing to count.
  }
}

export interface DealerListingRow {
  id: string;
  slug: string;
  title: string;
  price: number;
  year: number;
  city: string | null;
  bodyType: string;
  status: string;
  views: number;
  featured: boolean;
  verified: boolean;
  image: string;
}

/** A dealer's inventory with the operational fields their tools need. */
export async function getDealerInventory(userId: string): Promise<DealerListingRow[]> {
  try {
    const rows = await prisma.vehicle.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    });
    return rows.map((v) => ({
      id: v.id,
      slug: v.slug,
      title: v.title,
      price: num(v.price),
      year: v.year,
      city: v.city,
      bodyType: v.bodyType,
      status: v.status,
      views: v.views,
      featured: v.featured,
      verified: v.verified,
      image: v.images[0]?.url ?? "/placeholder-car.jpg",
    }));
  } catch {
    return [];
  }
}

export interface DealerStats {
  listings: number;
  active: number;
  sold: number;
  totalViews: number;
  avgViews: number;
  inventoryValue: number;
  featured: number;
  verified: number;
  leads: number;
}

export async function getDealerStats(userId: string): Promise<DealerStats> {
  try {
    const [rows, leads] = await Promise.all([
      prisma.vehicle.findMany({
        where: { sellerId: userId },
        select: { price: true, status: true, views: true, featured: true, verified: true },
      }),
      prisma.conversation.count({ where: { sellerId: userId } }),
    ]);
    const listings = rows.length;
    const totalViews = rows.reduce((s, r) => s + r.views, 0);
    return {
      listings,
      active: rows.filter((r) => r.status === "ACTIVE").length,
      sold: rows.filter((r) => r.status === "SOLD").length,
      totalViews,
      avgViews: listings ? Math.round(totalViews / listings) : 0,
      inventoryValue: rows.reduce((s, r) => s + num(r.price), 0),
      featured: rows.filter((r) => r.featured).length,
      verified: rows.filter((r) => r.verified).length,
      leads,
    };
  } catch {
    return {
      listings: 0,
      active: 0,
      sold: 0,
      totalViews: 0,
      avgViews: 0,
      inventoryValue: 0,
      featured: 0,
      verified: 0,
      leads: 0,
    };
  }
}

export interface DealerLeadRow {
  id: string;
  buyer: string;
  subject: string | null;
  vehicleTitle: string | null;
  vehicleSlug: string | null;
  lastMessage: string | null;
  lastMessageAt: Date;
}

/** Buyer conversations on a dealer's listings — their lead pipeline. */
export async function getDealerLeads(userId: string): Promise<DealerLeadRow[]> {
  try {
    const rows = await prisma.conversation.findMany({
      where: { sellerId: userId },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        buyer: { select: { name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
      },
    });

    // Conversation stores vehicleId as a scalar (no relation), so resolve the
    // referenced vehicles in one extra query.
    const vehicleIds = [...new Set(rows.map((r) => r.vehicleId).filter((x): x is string => !!x))];
    const vehicles = vehicleIds.length
      ? await prisma.vehicle.findMany({
          where: { id: { in: vehicleIds } },
          select: { id: true, title: true, slug: true },
        })
      : [];
    const byId = new Map(vehicles.map((v) => [v.id, v]));

    return rows.map((c) => {
      const v = c.vehicleId ? byId.get(c.vehicleId) : undefined;
      return {
        id: c.id,
        buyer: c.buyer?.name ?? "Buyer",
        subject: c.subject,
        vehicleTitle: v?.title ?? null,
        vehicleSlug: v?.slug ?? null,
        lastMessage: c.messages[0]?.body ?? null,
        lastMessageAt: c.lastMessageAt,
      };
    });
  } catch {
    return [];
  }
}

export async function getSellerProducts(userId: string): Promise<SamplePart[]> {
  try {
    const rows = await prisma.part.findMany({
      where: { sellerId: userId },
      include: partInclude,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapPart);
  } catch {
    return [];
  }
}

export interface SellerOrderRow {
  number: string;
  date: Date;
  status: string;
  customer: string;
  items: number;
  total: number;
}

/** Orders that contain at least one product belonging to this seller. */
export async function getSellerOrders(userId: string): Promise<SellerOrderRow[]> {
  try {
    const rows = await prisma.order.findMany({
      where: { items: { some: { part: { sellerId: userId } } } },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { part: { select: { sellerId: true } } } } },
    });
    return rows.map((o) => {
      const mine = o.items.filter((i) => i.part.sellerId === userId);
      return {
        number: o.orderNumber,
        date: o.createdAt,
        status: o.status,
        customer: o.fullName,
        items: mine.reduce((s, i) => s + i.quantity, 0),
        total: mine.reduce((s, i) => s + num(i.price) * i.quantity, 0),
      };
    });
  } catch {
    return [];
  }
}

export interface AdminStats {
  users: number;
  vehicles: number;
  dealers: number;
  parts: number;
  imports: number;
  orders: number;
  pendingVehicles: number;
  reviews: number;
}

export interface AdminOrderRow {
  id: string;
  number: string;
  date: Date;
  customer: string;
  items: number;
  total: number;
  status: string;
  method: string;
  /** Payment/refund state for the refund control. */
  paymentStatus: string | null;
  refundStatus: string;
  refundable: boolean;
}

export async function getAllOrders(): Promise<AdminOrderRow[]> {
  try {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { items: true } },
        payment: { select: { method: true, status: true, refundStatus: true } },
      },
    });
    return rows.map((o) => ({
      id: o.id,
      number: o.orderNumber,
      date: o.createdAt,
      customer: o.fullName,
      items: o._count.items,
      total: num(o.total),
      status: o.status,
      method: o.payment?.method ?? "—",
      paymentStatus: o.payment?.status ?? null,
      refundStatus: o.payment?.refundStatus ?? "NONE",
      refundable: o.payment?.status === "SUCCESS" && o.payment?.refundStatus === "NONE",
    }));
  } catch {
    return [];
  }
}

export interface AdminImportRow {
  id: string;
  ref: string;
  date: Date;
  customer: string;
  vehicle: string;
  origin: string;
  stage: string;
}

export async function getAllImportRequests(): Promise<AdminImportRow[]> {
  try {
    const rows = await prisma.importRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      ref: r.requestNumber,
      date: r.createdAt,
      customer: r.user?.name ?? "—",
      vehicle: `${r.year} ${r.make} ${r.model}`,
      origin: r.countryOfOrigin,
      stage: r.stage,
    }));
  } catch {
    return [];
  }
}

export interface AdminEscrowRow {
  importId: string;
  ref: string;
  customer: string;
  status: string;
  total: number;
  paid: number;
  refunded: number;
  outstanding: number;
  milestonesPaid: number;
  milestonesTotal: number;
  createdAt: Date;
}

export interface AdminEscrowOverview {
  plans: AdminEscrowRow[];
  totals: { collected: number; outstanding: number; refunded: number; activePlans: number };
}

/** All escrow plans with money rolled up — the admin overview dashboard. */
export async function getAdminEscrowPlans(): Promise<AdminEscrowOverview> {
  try {
    const plans = await prisma.escrowPlan.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        importRequest: {
          select: { id: true, requestNumber: true, user: { select: { name: true } } },
        },
        milestones: { select: { amount: true, status: true, refundStatus: true } },
      },
    });

    const rows: AdminEscrowRow[] = plans.map((p) => {
      const total = num(p.totalAmount);
      const paid = p.milestones
        .filter((m) => m.status === "PAID" && m.refundStatus !== "REFUNDED")
        .reduce((s, m) => s + num(m.amount), 0);
      const refunded = p.milestones
        .filter((m) => m.refundStatus === "REFUNDED")
        .reduce((s, m) => s + num(m.amount), 0);
      return {
        importId: p.importRequest.id,
        ref: p.importRequest.requestNumber,
        customer: p.importRequest.user?.name ?? "—",
        status: p.status,
        total,
        paid,
        refunded,
        outstanding: Math.max(0, total - paid - refunded),
        milestonesPaid: p.milestones.filter((m) => m.status === "PAID").length,
        milestonesTotal: p.milestones.length,
        createdAt: p.createdAt,
      };
    });

    const totals = {
      collected: rows.reduce((s, r) => s + r.paid, 0),
      outstanding: rows
        .filter((r) => r.status === "ACTIVE")
        .reduce((s, r) => s + r.outstanding, 0),
      refunded: rows.reduce((s, r) => s + r.refunded, 0),
      activePlans: rows.filter((r) => r.status === "ACTIVE").length,
    };

    return { plans: rows, totals };
  } catch {
    return { plans: [], totals: { collected: 0, outstanding: 0, refunded: 0, activePlans: 0 } };
  }
}

export interface ImportTrackingEventView {
  id: string;
  stage: string;
  title: string;
  description: string | null;
  location: string | null;
  timestamp: Date;
}

export interface EscrowMilestoneView {
  id: string;
  sequence: number;
  label: string;
  description: string | null;
  amount: number;
  unlockStage: string;
  status: string;
  /** Computed: can the buyer pay this installment right now? */
  payable: boolean;
  paidAt: Date | null;
  refundStatus: string;
  refundedAt: Date | null;
}

export interface EscrowPlanView {
  id: string;
  status: string;
  currency: string;
  totalAmount: number;
  /** Net paid: sum of PAID installments that have NOT been refunded. */
  paidAmount: number;
  /** Sum of installments refunded back to the buyer. */
  refundedAmount: number;
  milestones: EscrowMilestoneView[];
}

export interface ImportRequestDetail {
  id: string;
  ref: string;
  stage: string;
  customer: string;
  customerEmail: string | null;
  vehicle: string;
  vehicleId: string | null;
  vehicleSlug: string | null;
  origin: string;
  auctionSource: string | null;
  budget: number | null;
  notes: string | null;
  trackingNumber: string | null;
  estimatedArrival: Date | null;
  quote: { cif: number | null; duty: number | null; shipping: number | null; total: number | null };
  createdAt: Date;
  events: ImportTrackingEventView[];
  escrow: EscrowPlanView | null;
}

/** Full import request with its timeline — for the admin management view. */
const importDetailInclude = {
  user: { select: { name: true, email: true } },
  vehicle: { select: { id: true, slug: true } },
  trackingEvents: { orderBy: { timestamp: "desc" } },
  escrowPlan: { include: { milestones: { orderBy: { sequence: "asc" } } } },
} satisfies Prisma.ImportRequestInclude;

function mapImportDetail(
  r: Prisma.ImportRequestGetPayload<{ include: typeof importDetailInclude }>,
): ImportRequestDetail {
  return {
    id: r.id,
    ref: r.requestNumber,
    stage: r.stage,
    customer: r.user?.name ?? "—",
    customerEmail: r.user?.email ?? null,
    vehicle: `${r.year} ${r.make} ${r.model}`,
    vehicleId: r.vehicle?.id ?? null,
    vehicleSlug: r.vehicle?.slug ?? null,
    origin: r.countryOfOrigin,
    auctionSource: r.auctionSource,
    budget: r.budget ? num(r.budget) : null,
    notes: r.notes,
    trackingNumber: r.trackingNumber,
    estimatedArrival: r.estimatedArrival,
    quote: {
      cif: r.quotedCif ? num(r.quotedCif) : null,
      duty: r.quotedDuty ? num(r.quotedDuty) : null,
      shipping: r.quotedShipping ? num(r.quotedShipping) : null,
      total: r.quotedTotal ? num(r.quotedTotal) : null,
    },
    createdAt: r.createdAt,
    events: r.trackingEvents.map((e) => ({
      id: e.id,
      stage: e.stage,
      title: e.title,
      description: e.description,
      location: e.location,
      timestamp: e.timestamp,
    })),
    escrow: r.escrowPlan
      ? {
          id: r.escrowPlan.id,
          status: r.escrowPlan.status,
          currency: r.escrowPlan.currency,
          totalAmount: num(r.escrowPlan.totalAmount),
          // Net of refunds: an installment counts as paid only if it wasn't
          // refunded back to the buyer.
          paidAmount: r.escrowPlan.milestones
            .filter((m) => m.status === "PAID" && m.refundStatus !== "REFUNDED")
            .reduce((s, m) => s + num(m.amount), 0),
          refundedAmount: r.escrowPlan.milestones
            .filter((m) => m.refundStatus === "REFUNDED")
            .reduce((s, m) => s + num(m.amount), 0),
          milestones: r.escrowPlan.milestones.map((m) => ({
            id: m.id,
            sequence: m.sequence,
            label: m.label,
            description: m.description,
            amount: num(m.amount),
            unlockStage: m.unlockStage,
            status: m.status,
            payable: isMilestonePayable(m, r.stage, r.escrowPlan!.status),
            paidAt: m.paidAt,
            refundStatus: m.refundStatus,
            refundedAt: m.refundedAt,
          })),
        }
      : null,
  };
}

export async function getImportRequestDetail(id: string): Promise<ImportRequestDetail | null> {
  try {
    const r = await prisma.importRequest.findUnique({ where: { id }, include: importDetailInclude });
    return r ? mapImportDetail(r) : null;
  } catch {
    return null;
  }
}

/** Owner-scoped import detail — returns null if it isn't this user's request. */
export async function getUserImportDetail(
  id: string,
  userId: string,
): Promise<ImportRequestDetail | null> {
  try {
    const r = await prisma.importRequest.findFirst({
      where: { id, userId },
      include: importDetailInclude,
    });
    return r ? mapImportDetail(r) : null;
  } catch {
    return null;
  }
}

export interface AdminReviewRow {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: Date;
  verified: boolean;
}

export async function getAllReviews(): Promise<AdminReviewRow[]> {
  try {
    const rows = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { author: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      author: r.author?.name ?? "Anonymous",
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt,
      verified: r.verified,
    }));
  } catch {
    return [];
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const [users, vehicles, dealers, parts, imports, orders, pendingVehicles, reviews] =
      await Promise.all([
        prisma.user.count(),
        prisma.vehicle.count(),
        prisma.dealer.count({ where: { verified: true } }),
        prisma.part.count(),
        prisma.importRequest.count(),
        prisma.order.count(),
        prisma.vehicle.count({ where: { status: "PENDING" } }),
        prisma.review.count(),
      ]);
    return { users, vehicles, dealers, parts, imports, orders, pendingVehicles, reviews };
  } catch {
    return {
      users: 0,
      vehicles: 0,
      dealers: 0,
      parts: 0,
      imports: 0,
      orders: 0,
      pendingVehicles: 0,
      reviews: 0,
    };
  }
}

export interface AdminVehicleRow {
  id: string;
  slug: string;
  title: string;
  image: string;
  city: string;
  dealer: string;
  price: number;
  status: string;
  verified: boolean;
}

export async function getAdminVehicles(): Promise<AdminVehicleRow[]> {
  try {
    const rows = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        dealer: { select: { businessName: true } },
        seller: { select: { name: true } },
      },
    });
    if (rows.length) {
      return rows.map((v) => ({
        id: v.id,
        slug: v.slug,
        title: v.title,
        image: v.images[0]?.url ?? PLACEHOLDER_VEHICLE,
        city: v.city ?? "",
        dealer: v.dealer?.businessName ?? v.seller?.name ?? "Private seller",
        price: num(v.price),
        status: v.status,
        verified: v.verified,
      }));
    }
  } catch {
    // fall through to sample data
  }
  return getExpandedVehicles().map((v) => ({
    id: v.id,
    slug: v.slug,
    title: v.title,
    image: v.images[0],
    city: v.city,
    dealer: v.dealer.name,
    price: v.price,
    status: "ACTIVE",
    verified: v.verified,
  }));
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: Date;
}

export async function getAllUsers(): Promise<AdminUserRow[]> {
  try {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
    return rows.map((u) => ({
      id: u.id,
      name: u.name ?? "Unnamed user",
      email: u.email,
      role: u.role,
      status: u.status,
      joined: u.createdAt,
    }));
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
//  REVIEWS & MESSAGES (M5)
// ══════════════════════════════════════════════════════════════

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  title: string | null;
  comment: string;
  date: Date;
  verified: boolean;
}

const REVIEW_FIELD = {
  vehicle: "vehicleId",
  part: "partId",
  dealer: "dealerId",
  service: "serviceProviderId",
} as const;

export async function getReviews(
  targetType: keyof typeof REVIEW_FIELD,
  targetId: string,
): Promise<ReviewItem[]> {
  try {
    const rows = await prisma.review.findMany({
      where: { [REVIEW_FIELD[targetType]]: targetId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      author: r.author?.name ?? "Anonymous",
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      date: r.createdAt,
      verified: r.verified,
    }));
  } catch {
    return [];
  }
}

// ── Messaging (two-way conversations) ─────────────────────────
export interface ConversationContext {
  label: string;
  href: string;
}

export interface ConversationSummary {
  id: string;
  otherParty: string;
  subject: string | null;
  context: ConversationContext | null;
  lastMessage: string;
  lastMessageAt: Date;
  unread: number;
}

export interface ThreadMessage {
  id: string;
  body: string;
  mine: boolean;
  senderName: string;
  read: boolean;
  createdAt: Date;
}

export interface ConversationDetail {
  id: string;
  otherParty: string;
  subject: string | null;
  context: ConversationContext | null;
  messages: ThreadMessage[];
}

/** Resolve vehicle/part ids to a display label + link, batched to avoid N+1. */
async function resolveContexts(
  vehicleIds: string[],
  partIds: string[],
): Promise<Map<string, ConversationContext>> {
  const map = new Map<string, ConversationContext>();
  const [vehicles, parts] = await Promise.all([
    vehicleIds.length
      ? prisma.vehicle.findMany({
          where: { id: { in: vehicleIds } },
          select: { id: true, title: true, slug: true },
        })
      : Promise.resolve([]),
    partIds.length
      ? prisma.part.findMany({
          where: { id: { in: partIds } },
          select: { id: true, name: true, slug: true },
        })
      : Promise.resolve([]),
  ]);
  for (const v of vehicles) map.set(v.id, { label: v.title, href: `/vehicles/${v.slug}` });
  for (const p of parts) map.set(p.id, { label: p.name, href: `/parts/${p.slug}` });
  return map;
}

export async function getUserConversations(userId: string): Promise<ConversationSummary[]> {
  try {
    const rows = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: {
            messages: { where: { read: false, senderId: { not: userId } } },
          },
        },
      },
    });

    const contexts = await resolveContexts(
      rows.map((r) => r.vehicleId).filter((x): x is string => Boolean(x)),
      rows.map((r) => r.partId).filter((x): x is string => Boolean(x)),
    );

    return rows.map((r) => {
      const other = r.buyerId === userId ? r.seller : r.buyer;
      const last = r.messages[0];
      const ctxId = r.vehicleId ?? r.partId ?? "";
      return {
        id: r.id,
        otherParty: other?.name ?? "CarVista member",
        subject: r.subject,
        context: contexts.get(ctxId) ?? null,
        lastMessage: last?.body ?? "",
        lastMessageAt: last?.createdAt ?? r.lastMessageAt,
        unread: r._count.messages,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Load a full conversation thread for a participant and mark the other side's
 * messages as read. Returns null if the conversation doesn't exist or the user
 * isn't a participant (so callers can 404 / redirect).
 */
export async function getConversation(
  id: string,
  userId: string,
): Promise<ConversationDetail | null> {
  try {
    const convo = await prisma.conversation.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { name: true } } },
        },
      },
    });
    if (!convo || (convo.buyerId !== userId && convo.sellerId !== userId)) return null;

    // Mark the counterpart's unread messages as read now that we're viewing them.
    if (convo.messages.some((m) => m.senderId !== userId && !m.read)) {
      await prisma.message.updateMany({
        where: { conversationId: id, senderId: { not: userId }, read: false },
        data: { read: true },
      });
    }

    const other = convo.buyerId === userId ? convo.seller : convo.buyer;
    const contexts = await resolveContexts(
      convo.vehicleId ? [convo.vehicleId] : [],
      convo.partId ? [convo.partId] : [],
    );

    return {
      id: convo.id,
      otherParty: other?.name ?? "CarVista member",
      subject: convo.subject,
      context: contexts.get(convo.vehicleId ?? convo.partId ?? "") ?? null,
      messages: convo.messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderId === userId,
        senderName: m.sender?.name ?? "Member",
        read: m.read,
        createdAt: m.createdAt,
      })),
    };
  } catch {
    return null;
  }
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    return await prisma.message.count({
      where: {
        read: false,
        senderId: { not: userId },
        conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      },
    });
  } catch {
    return 0;
  }
}

// ── Sitemap ───────────────────────────────────────────────────
export interface SitemapEntry {
  slug: string;
  updatedAt: Date;
}
export interface SitemapEntries {
  vehicles: SitemapEntry[];
  parts: SitemapEntry[];
  dealers: SitemapEntry[];
  services: SitemapEntry[];
  posts: SitemapEntry[];
}

/**
 * Lightweight slug + updatedAt lists for the sitemap, so each URL's <lastmod>
 * reflects when the record actually changed (better crawl signals than stamping
 * everything with "now"). Returns null when the DB is empty or unavailable, in
 * which case the sitemap falls back to the sample catalogue.
 */
export async function getSitemapEntries(): Promise<SitemapEntries | null> {
  try {
    const [vehicles, parts, dealers, services, posts] = await Promise.all([
      prisma.vehicle.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.part.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.dealer.findMany({ select: { slug: true, updatedAt: true }, take: 5000 }),
      prisma.serviceProvider.findMany({ select: { slug: true, updatedAt: true }, take: 5000 }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
    ]);
    const total =
      vehicles.length + parts.length + dealers.length + services.length + posts.length;
    if (total === 0) return null;
    return { vehicles, parts, dealers, services, posts };
  } catch {
    return null;
  }
}

// ── Suppliers ─────────────────────────────────────────────────
export interface SupplierRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string;
  cover: string;
  city: string;
  region: string;
  categories: string[];
  minimumOrder: string | null;
  servesRegions: string[];
  leadTimeDays: number | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
}

const SUPPLIER_PLACEHOLDER_LOGO = "/placeholder-dealer.jpg";
const SUPPLIER_PLACEHOLDER_COVER = "/placeholder-car.jpg";

function mapSupplier(s: Prisma.SupplierGetPayload<object>): SupplierRow {
  return {
    id: s.id,
    slug: s.slug,
    name: s.businessName,
    description: s.description ?? "",
    logo: s.logo ?? SUPPLIER_PLACEHOLDER_LOGO,
    cover: s.coverImage ?? SUPPLIER_PLACEHOLDER_COVER,
    city: s.city ?? "",
    region: s.region ?? "",
    categories: s.categories,
    minimumOrder: s.minimumOrder,
    servesRegions: s.servesRegions,
    leadTimeDays: s.leadTimeDays,
    verified: s.verified,
    rating: s.rating,
    reviewCount: s.reviewCount,
    phone: s.phone,
    whatsapp: s.whatsapp,
    website: s.website,
  };
}

/**
 * Suppliers, verified first.
 *
 * Unlike vehicles and parts there is no sample catalogue to fall back on: a
 * wholesale directory with invented businesses in it would put buyers in touch
 * with companies that do not exist. An empty list is the honest answer, and the
 * page says so.
 */
export async function getSuppliers(category?: SupplierCategory): Promise<SupplierRow[]> {
  try {
    const rows = await prisma.supplier.findMany({
      where: category ? { categories: { has: category } } : undefined,
      orderBy: [{ verified: "desc" }, { featured: "desc" }, { rating: "desc" }],
      take: 60,
    });
    return rows.map(mapSupplier);
  } catch {
    return [];
  }
}

export const getSupplierBySlug = cache(async (slug: string): Promise<SupplierRow | null> => {
  try {
    const row = await prisma.supplier.findUnique({ where: { slug } });
    return row ? mapSupplier(row) : null;
  } catch {
    return null;
  }
});

/** The signed-in user's own supplier profile, for the console. */
export async function getSupplierForUser(userId: string): Promise<SupplierRow | null> {
  try {
    const row = await prisma.supplier.findUnique({ where: { userId } });
    return row ? mapSupplier(row) : null;
  } catch {
    return null;
  }
}

// ── Import stock ──────────────────────────────────────────────

export interface ImportStockRow {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  mileage: number | null;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string | null;
  countryOfOrigin: string;
  portOfLoading: string | null;
  auctionGrade: string | null;
  fobAmount: number;
  fobCurrency: string;
  fxRateToGhs: number | null;
  serviceFeeGhs: number | null;
  freightGhs: number | null;
  quantity: number;
  /** Units currently held by a paid reservation. */
  held: number;
  etaDays: number | null;
  status: string;
  featured: boolean;
  images: string[];
  importer: { id: string; slug: string; name: string; verified: boolean };
}

type ImportListingWithRelations = Prisma.ImportListingGetPayload<{
  include: {
    images: true;
    importer: { select: { id: true; slug: true; businessName: true; verified: true } };
    _count: { select: { reservations: true } };
  };
}>;

function mapImportListing(
  row: ImportListingWithRelations,
  held: number,
): ImportStockRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    make: row.make,
    model: row.model,
    trim: row.trim,
    year: row.year,
    mileage: row.mileage,
    fuelType: row.fuelType,
    transmission: row.transmission,
    bodyType: row.bodyType,
    color: row.color,
    countryOfOrigin: row.countryOfOrigin,
    portOfLoading: row.portOfLoading,
    auctionGrade: row.auctionGrade,
    fobAmount: Number(row.fobAmount),
    fobCurrency: row.fobCurrency,
    fxRateToGhs: row.fxRateToGhs ? Number(row.fxRateToGhs) : null,
    serviceFeeGhs: row.serviceFeeGhs ? Number(row.serviceFeeGhs) : null,
    freightGhs: row.freightGhs ? Number(row.freightGhs) : null,
    quantity: row.quantity,
    held,
    etaDays: row.etaDays,
    status: row.status,
    featured: row.featured,
    images: row.images.sort((a, b) => a.position - b.position).map((i) => i.url),
    importer: {
      id: row.importer.id,
      slug: row.importer.slug,
      name: row.importer.businessName,
      verified: row.importer.verified,
    },
  };
}

const importListingInclude = {
  images: true,
  importer: { select: { id: true, slug: true, businessName: true, verified: true } },
  _count: { select: { reservations: true } },
} as const;

/**
 * Published stock, newest first, with the held count each listing needs to say
 * how many units are actually free.
 *
 * The held figure is counted per listing rather than derived from a column on
 * the row: a stored counter drifts the first time an expiry job dies halfway
 * through, and a listing that claims availability it does not have sells the
 * same chassis twice.
 */
export async function getImportStock(): Promise<ImportStockRow[]> {
  try {
    const rows = await prisma.importListing.findMany({
      where: { status: { in: ["ACTIVE", "FULLY_RESERVED"] } },
      include: importListingInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 120,
    });
    if (rows.length === 0) return [];

    const holds = await prisma.importReservation.groupBy({
      by: ["listingId"],
      where: { listingId: { in: rows.map((r) => r.id) }, ...holdingWhere() },
      _count: { _all: true },
    });
    const heldBy = new Map(holds.map((h) => [h.listingId, h._count._all]));
    return rows.map((row) => mapImportListing(row, heldBy.get(row.id) ?? 0));
  } catch {
    return [];
  }
}

export const getImportStockBySlug = cache(async (slug: string): Promise<ImportStockRow | null> => {
  try {
    const row = await prisma.importListing.findUnique({
      where: { slug },
      include: importListingInclude,
    });
    if (!row) return null;
    const held = await prisma.importReservation.count({
      where: { listingId: row.id, ...holdingWhere() },
    });
    return mapImportListing(row, held);
  } catch {
    return null;
  }
});

/** An importer's own stock, including drafts, for their console. */
export async function getImporterStock(importerId: string): Promise<ImportStockRow[]> {
  try {
    const rows = await prisma.importListing.findMany({
      where: { importerId },
      include: importListingInclude,
      orderBy: { createdAt: "desc" },
    });
    if (rows.length === 0) return [];
    const holds = await prisma.importReservation.groupBy({
      by: ["listingId"],
      where: { listingId: { in: rows.map((r) => r.id) }, ...holdingWhere() },
      _count: { _all: true },
    });
    const heldBy = new Map(holds.map((h) => [h.listingId, h._count._all]));
    return rows.map((row) => mapImportListing(row, heldBy.get(row.id) ?? 0));
  } catch {
    return [];
  }
}

/** The importer profile for a signed-in user, or null if they have none. */
export async function getImporterForUser(userId: string) {
  try {
    return await prisma.importer.findUnique({ where: { userId } });
  } catch {
    return null;
  }
}
