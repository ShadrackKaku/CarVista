import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { CategoryStrip } from "@/components/home/category-strip";
import { Features } from "@/components/home/features";
import { ImportPreview } from "@/components/home/import-preview";
import { SectionHeading } from "@/components/section-heading";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { PartCard } from "@/components/parts/part-card";
import { DealerCard } from "@/components/dealers/dealer-card";
import { ServiceCard } from "@/components/services/service-card";
import { TestimonialCard } from "@/components/testimonial-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SAMPLE_VEHICLES,
  SAMPLE_PARTS,
  SAMPLE_DEALERS,
  SAMPLE_SERVICES,
  SAMPLE_TESTIMONIALS,
  SAMPLE_BLOG_POSTS,
} from "@/lib/sample-data";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

export default function HomePage() {
  const featuredVehicles = SAMPLE_VEHICLES.filter((v) => v.featured).slice(0, 8);
  const latestImports = SAMPLE_VEHICLES.filter(
    (v) => v.importStatus !== "NOT_IMPORTED",
  ).slice(0, 4);
  const featuredParts = SAMPLE_PARTS.filter((p) => p.featured).slice(0, 5);

  return (
    <>
      <Hero />
      <CategoryStrip />

      {/* Featured vehicles */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Handpicked"
          title="Featured Vehicles"
          description="Premium, verified cars ready for the road."
          action={{ label: "Browse all vehicles", href: "/vehicles" }}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredVehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      </section>

      <ImportPreview />

      {/* Latest imports */}
      <section className="bg-muted/30 py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Fresh off the ship"
            title="Latest Imported Cars"
            description="Newly arrived and duty-cleared vehicles from top auctions."
            action={{ label: "See all imports", href: "/vehicles?importStatus=CLEARED" }}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latestImports.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </div>
      </section>

      {/* Parts highlights */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Genuine & OEM"
          title="Popular Car Parts"
          description="Shop quality spare parts with fitment search for your exact vehicle."
          action={{ label: "Shop all parts", href: "/parts" }}
        />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {featuredParts.map((p) => (
            <PartCard key={p.id} part={p} />
          ))}
        </div>
      </section>

      <Features />

      {/* Verified dealers */}
      <section className="bg-muted/30 py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Trusted partners"
            title="Verified Dealers"
            description="Buy with confidence from Ghana's most trusted dealerships."
            action={{ label: "View dealer directory", href: "/dealers" }}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_DEALERS.map((d) => (
              <DealerCard key={d.id} dealer={d} />
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Keep moving"
          title="Automotive Services"
          description="Mechanics, detailers, electricians and more — near you."
          action={{ label: "Find services", href: "/services" }}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Loved by thousands"
            title="What our customers say"
            align="center"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Insights & guides"
          title="From the CarVista Blog"
          description="Expert advice on buying, importing and maintaining vehicles in Ghana."
          action={{ label: "Read the blog", href: "/blog" }}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_BLOG_POSTS.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
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
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-14 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            Ready to find, import or sell your next car?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Join thousands of Ghanaians who trust CarVista for a smarter automotive experience.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              <Link href="/vehicles">
                Browse Vehicles <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/register">Create free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
