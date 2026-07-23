import { prisma } from "@/lib/prisma";
import { PART_CATEGORIES } from "@/lib/constants";

/** Human-readable category name from a slug, e.g. "brake-parts" → "Brake Parts". */
export function categoryNameFromSlug(slug: string): string {
  const known = PART_CATEGORIES.find((c) => c.slug === slug);
  if (known) return known.name;
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

/**
 * Resolve a PartCategory id from the slug the form submits, creating the
 * category record if it doesn't exist yet (categories are a fixed taxonomy, but
 * the DB may not be seeded).
 */
export async function resolvePartCategoryId(categorySlug: string): Promise<string> {
  const existing = await prisma.partCategory.findFirst({
    where: { OR: [{ slug: categorySlug }, { id: categorySlug }, { name: categorySlug }] },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.partCategory.create({
    data: { name: categoryNameFromSlug(categorySlug), slug: categorySlug },
  });
  return created.id;
}
