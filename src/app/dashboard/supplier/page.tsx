import Link from "next/link";
import { AlertCircle, Inbox, MessageSquare, Settings, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getSupplierForUser } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SupplierOverviewPage() {
  const user = await getCurrentUser();
  const supplier = user ? await getSupplierForUser(user.id) : null;

  if (!supplier) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed p-12 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No supplier profile yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile is created when a supplier application is approved.
        </p>
        <Button asChild variant="gradient" className="mt-5">
          <Link href="/dashboard/upgrade">Apply to become a supplier</Link>
        </Button>
      </div>
    );
  }

  const counts = await prisma.supplierEnquiry
    .groupBy({
      by: ["status"],
      where: { supplierId: supplier.id },
      _count: true,
    })
    .catch(() => [] as { status: string; _count: number }[]);

  const open = counts.find((c) => c.status === "OPEN")?._count ?? 0;
  const quoted = counts.find((c) => c.status === "QUOTED")?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  // A profile with no categories is invisible to the category filter, which is
  // how most buyers narrow the directory — worth saying out loud.
  const incomplete = supplier.categories.length === 0 || !supplier.description;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            {supplier.name}
            {supplier.verified ? (
              <Badge variant="success">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Buyers find you at /suppliers/{supplier.slug}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/supplier/profile">
            <Settings className="h-4 w-4" /> Edit profile
          </Link>
        </Button>
      </div>

      {incomplete && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">Finish your profile</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {supplier.categories.length === 0
                ? "You haven't said what you supply, so you don't appear when buyers filter by category."
                : "Add a description so buyers know what you're good for."}{" "}
              <Link href="/dashboard/supplier/profile" className="font-medium text-brand-600 hover:underline">
                Fix it now
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Waiting on you", value: open, icon: Inbox },
          { label: "Quoted", value: quoted, icon: MessageSquare },
          { label: "All enquiries", value: total, icon: Inbox },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card p-5">
            <stat.icon className="h-5 w-5 text-brand-600" />
            <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <Button asChild variant="gradient" size="lg">
        <Link href="/dashboard/supplier/enquiries">
          <Inbox className="h-4 w-4" /> Open enquiries
        </Link>
      </Button>
    </div>
  );
}
