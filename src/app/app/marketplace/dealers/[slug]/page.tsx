import type { Metadata } from "next";
import { DealerDetail } from "@/components/dealers/dealer-detail";
import { getDealerBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dealer = await getDealerBySlug(params.slug);
  return { title: dealer?.name ?? "Dealer" };
}

export default function AppDealerDetailPage({ params }: { params: { slug: string } }) {
  return <DealerDetail slug={params.slug} inShell />;
}
