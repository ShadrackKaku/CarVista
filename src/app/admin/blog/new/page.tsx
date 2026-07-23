import { BlogPostForm } from "@/components/admin/blog-post-form";

export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">New post</h1>
        <p className="mt-1 text-muted-foreground">Write a new article or guide for the blog.</p>
      </div>
      <BlogPostForm />
    </div>
  );
}
