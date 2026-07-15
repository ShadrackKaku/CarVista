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
  ref: string;
  title: string;
  origin: string;
  stage: string;
  total: number;
  eta: Date | null;
}

export async function getUserImports(userId: string): Promise<ImportSummary[]> {
  try {
    const rows = await prisma.importRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      ref: r.requestNumber,
      title: `${r.year} ${r.make} ${r.model}`,
      origin: r.countryOfOrigin,
      stage: r.stage,
      total: num(r.quotedTotal),
      eta: r.estimatedArrival,
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
  number: string;
  date: Date;
  customer: string;
  items: number;
  total: number;
  status: string;
  method: string;
}

export async function getAllOrders(): Promise<AdminOrderRow[]> {
  try {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { items: true } }, payment: { select: { method: true } } },
    });
    return rows.map((o) => ({
      number: o.orderNumber,
      date: o.createdAt,
      customer: o.fullName,
      items: o._count.items,
      total: num(o.total),
      status: o.status,
      method: o.payment?.method ?? "—",
    }));
  } catch {
    return [];
  }
}

export interface AdminImportRow {
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
