import type { Metadata } from "next";
import { DealerDirectory } from "@/components/dealers/dealer-directory";
import { getDealers } from "@/lib/queries";

export const metadata: Metadata = { title: "Dealers" };
export const dynamic = "force-dynamic";

export default async function AppDealersPage() {
  const dealers = await getDealers();
  return <DealerDirectory dealers={dealers} basePath="/app/marketplace/dealers" />;
}
