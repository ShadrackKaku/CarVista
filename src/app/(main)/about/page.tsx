import type { Metadata } from "next";
import Link from "next/link";
import { Award, Globe, HeartHandshake, Target, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { HOME_STATS } from "@/lib/sample-data";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description: `${SITE.name} is Ghana's complete automotive marketplace and import platform — built to make buying, importing and maintaining vehicles simple and transparent.`,
  alternates: { canonical: "/about" },
};

const values = [
  { icon: HeartHandshake, title: "Trust first", desc: "Verified dealers, transparent pricing and buyer protection at every step." },
  { icon: Globe, title: "Global reach, local roots", desc: "We connect Ghanaian buyers to auctions worldwide, with on-the-ground support." },
  { icon: Target, title: "Transparency", desc: "No hidden fees. Our calculators show the true landed cost before you commit." },
  { icon: TrendingUp, title: "Empowering sellers", desc: "We give dealers, parts sellers and mechanics the tools to grow their business." },
];

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Our Story"
        title="Driving Ghana's automotive future"
        description={`${SITE.name} was founded to fix a broken, opaque car-buying experience — bringing trust, transparency and technology to Ghana's automotive market.`}
      />
      <div className="container-page py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl border bg-card p-6 text-center shadow-soft">
              <p className="font-display text-3xl font-bold text-brand-700 dark:text-brand-400">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Our mission</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              For too long, buying or importing a car in Ghana meant uncertainty — unclear duties,
              hidden fees and no way to verify who you were dealing with. We built {SITE.name} to change
              that. Whether you're buying your first car, importing a dream vehicle from an overseas
              auction, sourcing genuine parts, or running a dealership, {SITE.name} gives you the tools,
              transparency and trust to do it with confidence.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              From our live Ghana import duty calculator to verified dealer badges and end-to-end
              import tracking, every feature is designed around one goal: making Ghana's automotive
              market work better for everyone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild variant="gradient">
                <Link href="/vehicles">Explore vehicles</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Get in touch</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border bg-card p-5 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-center text-white">
          <Award className="mx-auto h-10 w-10" />
          <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
            Join thousands of happy customers
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Whether you're buying, selling, importing or servicing — {SITE.name} is your trusted
            automotive partner in Ghana.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              <Link href="/register">Create free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
              <Link href="/dealers">
                <Users className="h-4 w-4" /> Become a dealer
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
