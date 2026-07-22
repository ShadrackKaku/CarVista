import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getBlogPosts, getBlogPostBySlug } from "@/lib/queries";
import { formatDate, safeJsonLd } from "@/lib/utils";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      images: [{ url: post.cover, alt: post.title }],
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.cover],
    },
  };
}

// Rich placeholder body rendered as sections for each article.
const bodyParagraphs = (title: string) => [
  `${title} — this guide walks you through everything you need to know, tailored specifically for the Ghanaian market. Whether you're a first-time buyer or a seasoned importer, understanding the details can save you thousands of cedis and a great deal of stress.`,
  "Ghana's automotive market has evolved rapidly. With more buyers importing vehicles directly from overseas auctions and a growing network of verified local dealers, having accurate, transparent information has never been more important. That's exactly what CarVista is built to provide.",
  "Before making any decision, always calculate your total landed cost using our import duty and shipping calculators. These tools use current GRA rates and real shipping lanes so you know the full picture before committing — no surprises at the port.",
  "Finally, remember that trust matters. Look for verified badges, read genuine reviews, inspect vehicles in person, and never make full payment before seeing what you're buying. Following these principles will keep your automotive journey smooth and secure.",
];

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const related = (await getBlogPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.cover,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "CarVista" },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
  };

  return (
    <div className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title },
            ]),
          ),
        }}
      />
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>

        <Badge variant="brand" className="mt-6">{post.category}</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span>{post.author}</span>
          <span>·</span>
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {post.readTime} min read
          </span>
        </p>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border bg-muted">
          <Image src={post.cover} alt={post.title} fill priority className="object-cover" />
        </div>

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p className="text-xl font-medium text-foreground">{post.excerpt}</p>
          {bodyParagraphs(post.title).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>

      <section className="mx-auto mt-16 max-w-5xl">
        <h2 className="mb-6 text-2xl font-bold">Related articles</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {related.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image src={p.cover} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-brand-600">
                  {p.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
