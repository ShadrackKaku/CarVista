import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { blogPostSchema } from "@/lib/validations";
import { resolveBlogCategoryId, estimateReadTime } from "@/lib/blog";

/** PATCH /api/admin/blog/[id] — edit a blog post (admins only). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const existing = await prisma.blogPost.findUnique({
      where: { id: params.id },
      select: { id: true, publishedAt: true },
    });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const parsed = blogPostSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const categoryId = await resolveBlogCategoryId(d.category);
    const published = d.published ?? false;
    // Stamp publishedAt the first time a post goes live; keep the original date
    // on later edits; clear it if the post is unpublished back to a draft.
    const publishedAt = published ? (existing.publishedAt ?? new Date()) : null;

    // The slug is intentionally left unchanged so existing URLs stay valid.
    await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        title: d.title,
        excerpt: d.excerpt || null,
        content: d.content,
        coverImage: d.coverImage || null,
        categoryId,
        tags: d.tags ?? [],
        readTime: d.readTime ?? estimateReadTime(d.content),
        published,
        featured: d.featured ?? false,
        publishedAt,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin:blog:PATCH]", e);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}
