import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { CategoryStrip } from "@/components/home/category-strip";
import { Features } from "@/components/home/features";
import { ImportPreview } from "@/components/home/import-preview";
import { SectionBackdrop } from "@/components/home/section-backdrop";
import { SectionHeading } from "@/components/section-heading";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { PartCard } from "@/components/parts/part-card";
import { DealerCard } from "@/components/dealers/dealer-card";
import { ServiceCard } from "@/components/services/service-card";
import { TestimonialCard } from "@/components/testimonial-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_TESTIMONIALS } from "@/lib/sample-data";
import {
  getFeaturedVehicles,
  getLatestImports,
  getFeaturedParts,
  getDealers,
  getServices,
  getBlogPosts,
  getHomeStats,
} from "@/lib/queries";
import { formatDate } from "@/lib/utils";

// Cache the homepage and revalidate every 60s (ISR) for fast loads.
export const revalidate = 60;

// Section background pictures (royalty-free Unsplash automotive photos).
const bg = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=60`;
const SECTION_BG = {
  vehicles: bg("photo-1503376780353-7e6692767b70"),
  imports: bg("photo-1494412574643-ff11b0a5c1c3"),
  parts: bg("photo-1486262715619-67b85e0b08d3"),
  dealers: bg("photo-1568844293986-8d0400bd4745"),
  services: bg("photo-1487754180451-c456f719a1fc"),
  testimonials: bg("photo-1449965408869-eaa3f722e40d"),
  blog: bg("photo-1519641471654-76ce0107ad1b"),
};

export default async function HomePage() {
  const [featuredVehicles, latestImports, featuredParts, dealers, services, blogPosts, homeStats] =
    await Promise.all([
      getFeaturedVehicles(8),
      getLatestImports(4),
      getFeaturedParts(5),
      getDealers(),
      getServices(),
      getBlogPosts(),
      getHomeStats(),
    ]);
  const testimonials = SAMPLE_TESTIMONIALS;

  return (
    <>
      <Hero stats={homeStats} />
      <CategoryStrip />

      {/* Featured vehicles */}
      <SectionBackdrop
        image={SECTION_BG.vehicles}
        heading={
          <SectionHeading
            onImage
            eyebrow="Handpicked"
            title="Featured Vehicles"
            description="Premium, verified cars ready for the road."
            action={{ label: "Browse all vehicles", href: "/vehicles" }}
          />
        }
      >
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredVehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      </SectionBackdrop>

      <ImportPreview />

      {/* Latest imports */}
      <SectionBackdrop
        image={SECTION_BG.imports}
        heading={
          <SectionHeading
            onImage
            eyebrow="Fresh off the ship"
            title="Latest Imported Cars"
            description="Newly arrived and duty-cleared vehicles from top auctions."
            action={{ label: "See all imports", href: "/vehicles?importStatus=CLEARED" }}
          />
        }
      >
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latestImports.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      </SectionBackdrop>

      {/* Parts highlights */}
      <SectionBackdrop
        image={SECTION_BG.parts}
        heading={
          <SectionHeading
            onImage
            eyebrow="Genuine & OEM"
            title="Popular Car Parts"
            description="Shop quality spare parts with fitment search for your exact vehicle."
            action={{ label: "Shop all parts", href: "/parts" }}
          />
        }
      >
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {featuredParts.map((p) => (
            <PartCard key={p.id} part={p} />
          ))}
        </div>
      </SectionBackdrop>

      <Features />

      {/* Verified dealers */}
      <SectionBackdrop
        image={SECTION_BG.dealers}
        heading={
          <SectionHeading
            onImage
            eyebrow="Trusted partners"
            title="Verified Dealers"
            description="Buy with confidence from Ghana's most trusted dealerships."
            action={{ label: "View dealer directory", href: "/dealers" }}
          />
        }
      >
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dealers.slice(0, 4).map((d) => (
            <DealerCard key={d.id} dealer={d} />
          ))}
        </div>
      </SectionBackdrop>

      {/* Services */}
      <SectionBackdrop
        image={SECTION_BG.services}
        heading={
          <SectionHeading
            onImage
            eyebrow="Keep moving"
            title="Automotive Services"
            description="Mechanics, detailers, electricians and more — near you."
            action={{ label: "Find services", href: "/services" }}
          />
        }
      >
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.slice(0, 4).map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </SectionBackdrop>

      {/* Testimonials */}
      <SectionBackdrop
        image={SECTION_BG.testimonials}
        heading={
          <SectionHeading
            onImage
            eyebrow="Loved by thousands"
            title="What our customers say"
            align="center"
          />
        }
      >
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </SectionBackdrop>

      {/* Blog */}
      <SectionBackdrop
        image={SECTION_BG.blog}
        heading={
          <SectionHeading
            onImage
            eyebrow="Insights & guides"
            title="From the CarVista Blog"
            description="Expert advice on buying, importing and maintaining vehicles in Ghana."
            action={{ label: "Read the blog", href: "/blog" }}
          />
        }
      >
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {blogPosts.slice(0, 4).map((post) => (
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
      </SectionBackdrop>

      {/* CTA */}
      <section className="container-page py-16">
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
