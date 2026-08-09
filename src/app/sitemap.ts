import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import {
  getSitemapEntries,
  getVehicles,
  getParts,
  getDealers,
  getServices,
  getBlogPosts,
  getImportStock,
} from "@/lib/queries";

// Rebuild the sitemap at most hourly so newly listed vehicles/parts get indexed
// without regenerating it on every crawl.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/vehicles",
    "/parts",
    "/import",
    "/import/stock",
    "/dealers",
    "/suppliers",
    "/services",
    // The individual calculators moved into the authenticated app and their
    // old public URLs now 301 here, so only the marketing page is listed —
    // a sitemap full of redirects burns crawl budget and reads as a soft error.
    "/calculators",
    "/blog",
    "/about",
    "/features",
    "/pricing",
    "/resources",
    "/contact",
    "/faq",
    "/testimonials",
    "/terms",
    "/privacy",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  // Prefer real per-record updatedAt so <lastmod> is accurate. Falls back to the
  // sample catalogue (stamped "now") when the DB is empty or unavailable, e.g.
  // during a build without a database connection.
  const entries = await getSitemapEntries();

  let vehicleRoutes: MetadataRoute.Sitemap;
  let partRoutes: MetadataRoute.Sitemap;
  let dealerRoutes: MetadataRoute.Sitemap;
  let serviceRoutes: MetadataRoute.Sitemap;
  let blogRoutes: MetadataRoute.Sitemap;

  if (entries) {
    vehicleRoutes = entries.vehicles.map((v) => ({
      url: `${base}/vehicles/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
    partRoutes = entries.parts.map((p) => ({
      url: `${base}/parts/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    dealerRoutes = entries.dealers.map((d) => ({
      url: `${base}/dealers/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    serviceRoutes = entries.services.map((s) => ({
      url: `${base}/services/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    blogRoutes = entries.posts.map((b) => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } else {
    const [vehicles, parts, dealers, services, posts] = await Promise.all([
      getVehicles(),
      getParts(),
      getDealers(),
      getServices(),
      getBlogPosts(),
    ]);
    vehicleRoutes = vehicles.map((v) => ({
      url: `${base}/vehicles/${v.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
    partRoutes = parts.map((p) => ({
      url: `${base}/parts/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    dealerRoutes = dealers.map((d) => ({
      url: `${base}/dealers/${d.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    serviceRoutes = services.map((s) => ({
      url: `${base}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    blogRoutes = posts.map((b) => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: new Date(b.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  }

  // Import stock is listed straight from the live table rather than through
  // getSitemapEntries: it is a small set, it turns over quickly, and a car that
  // sold last week should drop out of the sitemap on the next hourly rebuild.
  const stockRoutes: MetadataRoute.Sitemap = (await getImportStock().catch(() => [])).map(
    (l) => ({
      url: `${base}/import/stock/${l.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }),
  );

  return [
    ...staticRoutes,
    ...stockRoutes,
    ...vehicleRoutes,
    ...partRoutes,
    ...dealerRoutes,
    ...serviceRoutes,
    ...blogRoutes,
  ];
}
