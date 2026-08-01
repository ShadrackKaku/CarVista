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
  return { title: part?.name ?? "Part" };
}

export default function AppPartDetailPage({ params }: { params: { slug: string } }) {
  return <PartDetail slug={params.slug} inShell />;
}
