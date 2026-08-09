import { BlogPostForm } from "@/components/admin/blog-post-form";
import { guardPage } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  await guardPage("blog:write");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BlogPostForm />
    </div>
  );
}
