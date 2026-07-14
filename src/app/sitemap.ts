import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getVehicles, getParts, getDealers, getServices, getBlogPosts } from "@/lib/queries";

// Rebuild the sitemap at most hourly so newly listed vehicles/parts get indexed
// without regenerating it on every crawl.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date();

  const staticRoutes = [
    "",
    "/vehicles",
    "/parts",
    "/import",
    "/dealers",
    "/services",
    "/calculators/import-duty",
    "/calculators/shipping",
    "/calculators/financing",
    "/blog",
    "/about",
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

  // Pull live listings (these helpers fall back to sample data if the DB is
  // unavailable, e.g. during a build without a database connection).
  const [vehicles, parts, dealers, services, posts] = await Promise.all([
    getVehicles(),
    getParts(),
    getDealers(),
    getServices(),
    getBlogPosts(),
  ]);

  const vehicleRoutes = vehicles.map((v) => ({
    url: `${base}/vehicles/${v.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const partRoutes = parts.map((p) => ({
    url: `${base}/parts/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const dealerRoutes = dealers.map((d) => ({
    url: `${base}/dealers/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${base}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const blogRoutes = posts.map((b) => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: new Date(b.date),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...vehicleRoutes,
    ...partRoutes,
    ...dealerRoutes,
    ...serviceRoutes,
    ...blogRoutes,
  ];
}
