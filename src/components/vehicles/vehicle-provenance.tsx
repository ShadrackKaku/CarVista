import { Anchor, BadgeCheck, Gavel, Landmark, ShieldCheck, Ship } from "lucide-react";
import { getVehicleProvenance } from "@/lib/queries";
import { provenanceHeadline } from "@/lib/provenance";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Where this car came from, and what we can prove.
 *
 * Rendered only for vehicles the platform actually imported, which is the
 * point: an ordinary private listing has no panel at all, so the presence of
 * one is itself the signal. A buyer scrolling a marketplace learns to look for
 * it.
 *
 * Every fact here is a by-product of owning the chain end to end — the auction
 * grade from the importer who bought it, the duty from the licensed broker who
 * paid it, the entry number from ICUMS. None of it is something a seller types
 * in, which is precisely why it is worth trusting.
 */
export async function VehicleProvenance({ vehicleId }: { vehicleId: string }) {
  const p = await getVehicleProvenance(vehicleId);
  if (!p) return null;

  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/40 shadow-soft dark:border-brand-900 dark:bg-brand-950/30">
        <div className="border-b border-brand-200/60 p-6 dark:border-brand-900/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <h2 className="text-xl font-bold">Verified import history</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{provenanceHeadline(p)}</p>
        </div>

        <dl className="grid gap-px bg-border sm:grid-cols-2">
          {(p.auctionSource || p.auctionGrade) && (
            <Fact
              icon={<Gavel className="h-4 w-4" />}
              label="Bought at"
              value={p.auctionSource ?? "Auction"}
              detail={
                p.auctionGrade
                  ? `Auction grade ${p.auctionGrade}${
                      p.purchasedAt ? ` · ${formatDate(p.purchasedAt)}` : ""
                    }`
                  : p.purchasedAt
                    ? formatDate(p.purchasedAt)
                    : null
              }
            />
          )}

          {p.origin && (
            <Fact
              icon={<Ship className="h-4 w-4" />}
              label="Shipped from"
              value={p.origin}
              detail={p.arrivedAt ? `Arrived ${formatDate(p.arrivedAt)}` : null}
            />
          )}

          {p.customsVerified && (
            <Fact
              icon={<Landmark className="h-4 w-4" />}
              label="Cleared customs"
              value={p.clearedAt ? formatDate(p.clearedAt) : "Cleared"}
              detail={
                <>
                  {p.dutyPaid != null && (
                    <>
                      Duty paid{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(p.dutyPaid)}
                      </span>
                      {" · "}
                    </>
                  )}
                  Entry {p.entryNumber}
                </>
              }
            />
          )}

          {p.agentName && (
            <Fact
              icon={<Anchor className="h-4 w-4" />}
              label="Cleared by"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {p.agentName}
                  {p.agentLicensed && (
                    <BadgeCheck className="h-4 w-4 text-success" aria-label="Licensed broker" />
                  )}
                </span>
              }
              detail={p.agentLicensed ? "Licensed customs broker, verified by us" : null}
            />
          )}
        </dl>

        {p.chassisNumber && (
          <p className="bg-card px-6 py-3 text-xs text-muted-foreground">
            Chassis <span className="font-mono text-foreground">{p.chassisNumber}</span> — check it
            against the plate on the car.
          </p>
        )}
      </div>
    </section>
  );
}

function Fact({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="bg-card p-5">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="text-brand-600">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 font-semibold">{value}</dd>
      {detail && <dd className="mt-0.5 text-xs text-muted-foreground">{detail}</dd>}
    </div>
  );
}
