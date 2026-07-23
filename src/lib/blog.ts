import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/** Estimate reading time in minutes from post content (~200 words per minute).
 *  HTML tags are stripped first so rich-text markup doesn't inflate the count. */
export function estimateReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Resolve a BlogCategory id from a free-text name, creating the category if it
 * doesn't exist yet. Returns null for an empty/blank name (category is optional).
 */
export async function resolveBlogCategoryId(name?: string): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const existing = await prisma.blogCategory.findFirst({
    where: { OR: [{ slug }, { name: trimmed }] },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.blogCategory.create({ data: { name: trimmed, slug } });
  return created.id;
}
