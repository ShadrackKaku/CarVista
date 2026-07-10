import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { SAMPLE_VEHICLES, SAMPLE_PARTS, SAMPLE_DEALERS, SAMPLE_BLOG_POSTS } from "@/lib/sample-data";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const vehicleRoutes = SAMPLE_VEHICLES.map((v) => ({
    url: `${base}/vehicles/${v.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const partRoutes = SAMPLE_PARTS.map((p) => ({
    url: `${base}/parts/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const dealerRoutes = SAMPLE_DEALERS.map((d) => ({
    url: `${base}/dealers/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const blogRoutes = SAMPLE_BLOG_POSTS.map((b) => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: new Date(b.date),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...vehicleRoutes, ...partRoutes, ...dealerRoutes, ...blogRoutes];
}
