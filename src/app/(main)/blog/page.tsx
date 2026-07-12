import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getBlogPosts } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog — Automotive Insights & Guides for Ghana",
  description: "Expert advice on buying, importing, financing and maintaining vehicles in Ghana.",
  alternates: { canonical: "/blog" },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [featured, ...rest] = await getBlogPosts();

  return (
    <div>
      <PageHeader
        eyebrow="Blog"
        title="Automotive insights & guides"
        description="Expert advice to help you buy, import, finance and maintain your vehicle in Ghana."
      />
      <div className="container-page py-12">
        {/* Featured */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group grid overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:shadow-card lg:grid-cols-2"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto">
            <Image src={featured.cover} alt={featured.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col justify-center p-8">
            <Badge variant="brand" className="w-fit">{featured.category}</Badge>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight transition-colors group-hover:text-brand-600 sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {featured.author} · {formatDate(featured.date)} · {featured.readTime} min read
            </p>
          </div>
        </Link>

        {/* Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image src={post.cover} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <Badge variant="brand">{post.category}</Badge>
                <h3 className="mt-2 line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-brand-600">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatDate(post.date)} · {post.readTime} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
