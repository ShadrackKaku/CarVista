import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TestimonialCard } from "@/components/testimonial-card";
import { SAMPLE_TESTIMONIALS } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "Hear from thousands of Ghanaians who trust CarVista to buy, import and maintain their vehicles.",
  alternates: { canonical: "/testimonials" },
};

export default function TestimonialsPage() {
  // Repeat the sample set to fill the page nicely.
  const all = [...SAMPLE_TESTIMONIALS, ...SAMPLE_TESTIMONIALS.map((t) => ({ ...t, id: t.id + "-2" }))];
  return (
    <div>
      <PageHeader
        eyebrow="Testimonials"
        title="Loved by drivers across Ghana"
        description="Real stories from customers who've bought, imported and sold with CarVista."
      />
      <div className="container-page py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
