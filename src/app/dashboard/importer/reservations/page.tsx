import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getImporterForUser } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  ACTIVE: "success",
  PENDING_PAYMENT: "secondary",
  CONVERTED: "brand",
  EXPIRED: "outline",
  CANCELLED: "outline",
} as const;

/**
 * Who is holding what, and until when.
 *
 * PENDING_PAYMENT rows are shown but marked as holding nothing — an importer
 * looking at this page needs to know the difference between a unit that is
 * actually off the market and a checkout someone opened and abandoned.
 */
export default async function ImporterReservationsPage() {
  const user = await getCurrentUser();
  const importer = user ? await getImporterForUser(user.id) : null;

  const reservations = importer
    ? await prisma.importReservation
        .findMany({
          where: { listing: { importerId: importer.id } },
          include: {
            listing: { select: { title: true, slug: true } },
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
        .catch(() => [])
    : [];

  if (reservations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No reservations yet. They appear here the moment a buyer&apos;s fee clears.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[48rem] text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Car</th>
            <th className="p-3 font-medium">Buyer</th>
            <th className="p-3 font-medium">Fee</th>
            <th className="p-3 font-medium">Holds until</th>
            <th className="p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="p-3">
                <Link
                  href={`/app/imports/stock/${r.listing.slug}`}
                  className="font-medium hover:text-brand-600"
                >
                  {r.listing.title}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">{r.reference}</p>
              </td>
              <td className="p-3">
                {r.user.name ?? "—"}
                <p className="text-xs text-muted-foreground">{r.user.email}</p>
              </td>
              <td className="p-3 tabular-nums">
                {formatCurrency(Number(r.feeGhs))}
                {r.refundedGhs != null && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(r.refundedGhs))} refunded
                  </p>
                )}
              </td>
              <td className="p-3">
                {r.status === "PENDING_PAYMENT" ? (
                  <span className="text-muted-foreground">Not paid — holds nothing</span>
                ) : r.expiresAt ? (
                  <>
                    {r.expiresAt.toISOString().slice(0, 16).replace("T", " ")}
                    {r.graceApplied && (
                      <p className="text-xs text-muted-foreground">Extended around a holiday</p>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3">
                <Badge variant={STATUS_VARIANT[r.status as keyof typeof STATUS_VARIANT]}>
                  {r.status.replace("_", " ").toLowerCase()}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
