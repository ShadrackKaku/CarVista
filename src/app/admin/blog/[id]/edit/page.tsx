import { notFound } from "next/navigation";
import { getBlogPostForEdit } from "@/lib/queries";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  // The /admin layout already restricts this route to admins.
  const post = await getBlogPostForEdit(params.id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Edit post</h1>
        <p className="mt-1 text-muted-foreground">Update the article, then save or publish.</p>
      </div>
      <BlogPostForm
        postId={post.id}
        initial={{
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          coverImage: post.coverImage,
          tags: post.tags,
          readTime: post.readTime,
          published: post.published,
          featured: post.featured,
        }}
      />
    </div>
  );
}
