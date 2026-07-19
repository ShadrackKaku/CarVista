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
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { formatNumber } from "@/lib/utils";
import { isMilestonePayable } from "@/lib/escrow";
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
