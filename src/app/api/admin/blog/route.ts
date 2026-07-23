import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { blogPostSchema } from "@/lib/validations";
import { resolveBlogCategoryId, estimateReadTime } from "@/lib/blog";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { slugify, generateReference } from "@/lib/utils";

/** POST /api/admin/blog — create a blog post (admins only). */
export async function POST(req: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const parsed = blogPostSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;

    const categoryId = await resolveBlogCategoryId(d.category);
    const slug = `${slugify(d.title)}-${generateReference("").slice(1, 6).toLowerCase()}`;
    const published = d.published ?? false;
    const content = sanitizeRichHtml(d.content);

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: d.title,
        excerpt: d.excerpt || null,
        content,
        coverImage: d.coverImage || null,
        categoryId,
        authorId: user.id,
        tags: d.tags ?? [],
        readTime: d.readTime ?? estimateReadTime(content),
        published,
        featured: d.featured ?? false,
        publishedAt: published ? new Date() : null,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    console.error("[admin:blog:POST]", e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
