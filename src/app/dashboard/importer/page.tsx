import Link from "next/link";
import { AlertCircle, Car, Clock, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getImporterForUser } from "@/lib/queries";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ImporterOverviewPage() {
  const user = await getCurrentUser();
  const importer = user ? await getImporterForUser(user.id) : null;

  if (!importer) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed p-12 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No importer profile yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile is created when an importer application is approved.
        </p>
        <Button asChild variant="gradient" className="mt-5">
          <Link href="/dashboard/upgrade">Apply to become an importer</Link>
        </Button>
      </div>
    );
  }

  const [published, drafts, holds] = await Promise.all([
    prisma.importListing.count({
      where: { importerId: importer.id, status: { in: ["ACTIVE", "FULLY_RESERVED"] } },
    }),
    prisma.importListing.count({ where: { importerId: importer.id, status: "DRAFT" } }),
    prisma.importReservation.count({
      where: { listing: { importerId: importer.id }, status: "ACTIVE" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Published" value={published} hint="Visible to buyers" />
        <Stat label="Drafts" value={drafts} hint="Not yet on the market" />
        <Stat label="Units on hold" value={holds} hint="Buyers arranging their FOB" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="gradient">
          <Link href="/dashboard/importer/stock/new">
            <Plus className="h-4 w-4" /> List a car
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/importer/stock">
            <Car className="h-4 w-4" /> My stock
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/importer/reservations">
            <Clock className="h-4 w-4" /> Reservations
          </Link>
        </Button>
      </div>

      {published === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-semibold">Nothing published yet</p>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
            Buyers see the FOB you set plus our estimate of duty and levies, drawn from real
            customs assessments — so they can judge the landed cost before they commit.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
