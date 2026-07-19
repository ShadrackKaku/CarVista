import Link from "next/link";
import { MessageSquare, Car, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDealerLeads } from "@/lib/queries";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealerLeadsPage() {
  const user = await getCurrentUser();
  const leads = user ? await getDealerLeads(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Leads</h1>
        <p className="mt-1 text-muted-foreground">
          Buyers who reached out about your listings — newest first.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No leads yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            When a buyer messages you about a vehicle, it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/messages/${lead.id}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-soft transition-colors hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{lead.buyer}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(lead.lastMessageAt)}
                  </span>
                </div>
                {lead.vehicleTitle && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-600">
                    <Car className="h-3.5 w-3.5" /> {lead.vehicleTitle}
                  </p>
                )}
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {lead.lastMessage ?? lead.subject ?? "New enquiry"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
