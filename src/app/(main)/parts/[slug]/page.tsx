import type { Metadata } from "next";
import { PartDetail } from "@/components/parts/part-detail";
import { getPartBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const part = await getPartBySlug(params.slug);
  if (!part) return { title: "Part not found" };
  const description = `Buy ${part.name} by ${part.brand} in Ghana. Compatible with ${part.compatibleMakes.join(
    ", ",
  )}.`;
  return {
    title: `${part.name} — ${part.brand}`,
    description,
    alternates: { canonical: `/parts/${part.slug}` },
    openGraph: {
      type: "website",
      title: `${part.name} — ${part.brand}`,
      description,
      url: `/parts/${part.slug}`,
      images: [{ url: part.image, alt: part.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${part.name} — ${part.brand}`,
      description,
      images: [part.image],
    },
  };
}

/** The public, indexable listing. Signed-in users get the same view in-shell. */
export default function PartDetailPage({ params }: { params: { slug: string } }) {
  return <PartDetail slug={params.slug} />;
}
