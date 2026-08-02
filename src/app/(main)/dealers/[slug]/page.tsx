import type { Metadata } from "next";
import { DealerDetail } from "@/components/dealers/dealer-detail";
import { getDealerBySlug } from "@/lib/queries";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dealer = await getDealerBySlug(params.slug);
  if (!dealer) return { title: "Dealer not found" };
  const title = `${dealer.name} — Car Dealer in ${dealer.city}`;
  return {
    title,
    description: dealer.description,
    alternates: { canonical: `/dealers/${dealer.slug}` },
    openGraph: {
      type: "website",
      title,
      description: dealer.description,
      url: `/dealers/${dealer.slug}`,
      images: [{ url: dealer.cover, alt: dealer.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: dealer.description,
      images: [dealer.cover],
    },
  };
}

/** The public, indexable profile. Signed-in users get the same view in-shell. */
export default function DealerDetailPage({ params }: { params: { slug: string } }) {
  return <DealerDetail slug={params.slug} />;
}
