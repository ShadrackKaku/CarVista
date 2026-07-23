import Image from "next/image";
import { Quote } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import type { SampleTestimonial } from "@/lib/sample-data";

export function TestimonialCard({ testimonial }: { testimonial: SampleTestimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft">
      <Quote className="h-8 w-8 text-brand-200" />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
        “{testimonial.quote}”
      </blockquote>
      <StarRating rating={testimonial.rating} size={14} className="mt-4" />
      <figcaption className="mt-4 flex items-center gap-3 border-t pt-4">
        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-muted">
          <Image src={testimonial.avatar} alt={testimonial.name} fill sizes="44px" className="object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">
            {testimonial.role} · {testimonial.location}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
