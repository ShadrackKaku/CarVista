import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getSupplierForUser } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { EnquiryReply } from "@/components/suppliers/enquiry-reply";
import { SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "warning" | "success" | "muted"> = {
  OPEN: "warning",
  QUOTED: "success",
  CLOSED: "muted",
  DECLINED: "muted",
};

export default async function SupplierEnquiriesPage() {
  const user = await getCurrentUser();
  const supplier = user ? await getSupplierForUser(user.id) : null;

  const enquiries = supplier
    ? await prisma.supplierEnquiry
        .findMany({
          where: { supplierId: supplier.id },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 100,
          include: { buyer: { select: { name: true, email: true } } },
        })
        .catch(() => [])
    : [];

  if (enquiries.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed p-12 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No enquiries yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When a dealer or store asks you to quote, it lands here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {enquiries.map((e) => (
        <div key={e.id} className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{e.item}</p>
              <p className="text-sm text-muted-foreground">
                {e.buyer.name ?? e.buyer.email}
                {e.quantity ? ` · ${e.quantity}` : ""}
                {e.category ? ` · ${SUPPLIER_CATEGORY_LABELS[e.category] ?? e.category}` : ""}
                {` · ${formatDate(e.createdAt)}`}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[e.status] ?? "muted"}>{e.status}</Badge>
          </div>

          {e.message && (
            <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {e.message}
            </p>
          )}

          {e.response ? (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your reply
              </p>
              <p className="mt-1.5 text-sm">{e.response}</p>
            </div>
          ) : (
            e.status === "OPEN" && <EnquiryReply id={e.id} />
          )}
        </div>
      ))}
    </div>
  );
}
