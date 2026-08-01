import { BlogPostForm } from "@/components/admin/blog-post-form";

export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BlogPostForm />
    </div>
  );
}
