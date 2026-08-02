import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Calculator, FileCheck2, Ship } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBlogPosts } from "@/lib/queries";
import { TOOLS } from "@/lib/tools";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, calculators and real customs data to help you buy, import and clear a vehicle in Ghana without guesswork.",
  alternates: { canonical: "/resources" },
};

export const revalidate = 3600;

/** Things a visitor can use before they have an account. */
const STARTING_POINTS = [
  {
    icon: Calculator,
    title: "Work out what a car will really cost",
    body: "Duty, NHIL, GETFund, VAT, the AU and ECOWAS levies, the examination fee and the flat charges — the whole GRA stack, on your own figures.",
    href: "/calculators",
    cta: "Open the calculators",
  },
  {
    icon: FileCheck2,
    title: "Share a duty bill, sharpen everyone's estimate",
    body: "Our estimates are calibrated against real ICUMS assessments importers have shared. Add yours and the next person's quote gets closer to the truth.",
    href: "/import/duty-check",
    cta: "Share an assessment",
  },
  {
    icon: Ship,
    title: "Follow an import that's already moving",
    body: "Auction to port to clearance to your driveway — check where a shipment is with its tracking reference.",
    href: "/import/track",
    cta: "Track an import",
  },
];

export default async function ResourcesPage() {
  const posts = await getBlogPosts().catch(() => []);
  const featured = posts.slice(0, 6);
  const liveTools = TOOLS.filter((t) => t.status === "LIVE");

  return (
    <div>
      <PageHeader
        eyebrow="Resources"
        title="Know the numbers before you commit"
        description="Importing a car in Ghana goes wrong in the same few places every time. These are the guides, tools and data we built to stop that happening to you."
      />

      <div className="container-page py-12">
        <section className="grid gap-6 lg:grid-cols-3">
          {STARTING_POINTS.map((item) => (
            <div key={item.href} className="flex flex-col rounded-2xl border bg-card p-6 shadow-soft">
              <item.icon className="h-6 w-6 text-brand-600" />
              <h2 className="mt-4 font-display text-lg font-bold">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link href={item.href}>
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </section>

        {featured.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold">Guides &amp; articles</h2>
                <p className="mt-1 text-muted-foreground">
                  Written by the people who clear these cars for a living.
                </p>
              </div>
              <Button asChild variant="ghost">
                <Link href="/blog">
                  All articles <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <Image
                      src={post.cover}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary">{post.category}</Badge>
                    <h3 className="mt-2 font-semibold leading-tight transition-colors group-hover:text-brand-600">
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
          </section>
        )}

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Every calculator</h2>
          <p className="mt-1 text-muted-foreground">
            Free to try. Sign in to save a quote or share it with your clearing agent.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((tool) => (
              <div key={tool.href} className="rounded-xl border bg-card p-5">
                <tool.icon className="h-5 w-5 text-brand-600" />
                <p className="mt-3 font-semibold">{tool.short}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tool.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border bg-gradient-to-br from-brand-50 to-background p-8 text-center dark:from-brand-900/20">
          <BookOpen className="mx-auto h-6 w-6 text-brand-600" />
          <h2 className="mt-3 font-display text-2xl font-bold">The rest lives inside the app</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Saved quotes, search alerts, inspection bookings and the full marketplace open up as
            soon as you have an account. It&apos;s free.
          </p>
          <Button asChild variant="gradient" size="lg" className="mt-6">
            <Link href="/register">
              Create a free account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
