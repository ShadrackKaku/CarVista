import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getAdminBlogPosts } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Blog</h1>
          <p className="mt-1 text-muted-foreground">Manage articles and guides.</p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4" /> New post
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <p className="font-semibold">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Write your first article to get started.</p>
          <Button asChild variant="gradient" className="mt-5">
            <Link href="/admin/blog/new">
              <Plus className="h-4 w-4" /> New post
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-soft"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={p.cover} alt={p.title} fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{p.category}</Badge>
                  <Badge variant={p.published ? "success" : "warning"}>
                    {p.published ? "Published" : "Draft"}
                  </Badge>
                  {p.featured && <Badge variant="secondary">Featured</Badge>}
                  <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                </div>
                {p.published ? (
                  <Link
                    href={`/blog/${p.slug}`}
                    className="mt-1 block truncate font-medium hover:text-brand-600"
                  >
                    {p.title}
                  </Link>
                ) : (
                  <span className="mt-1 block truncate font-medium">{p.title}</span>
                )}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/blog/${p.id}/edit`}>Edit</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
