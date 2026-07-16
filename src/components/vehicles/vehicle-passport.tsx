import {
  ShieldCheck,
  Ship,
  ClipboardCheck,
  Tag,
  BadgeCheck,
  Users,
  Wrench,
  FileText,
  Gauge,
  StickyNote,
  Shield,
  Anchor,
  type LucideIcon,
} from "lucide-react";
import { getVehiclePassport } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const EVENT_ICON: Record<string, LucideIcon> = {
  IMPORTED: Ship,
  SHIPPED: Anchor,
  CLEARED: ShieldCheck,
  INSPECTED: ClipboardCheck,
  LISTED: Tag,
  PRICE_CHANGE: Tag,
  SOLD: BadgeCheck,
  OWNERSHIP_TRANSFER: Users,
  SERVICED: Wrench,
  REPAIRED: Wrench,
  INSURED: Shield,
  REGISTERED: FileText,
  MILEAGE_UPDATE: Gauge,
  NOTE: StickyNote,
};

const EVENT_LABEL: Record<string, string> = {
  IMPORTED: "Imported",
  SHIPPED: "Shipped",
  CLEARED: "Customs cleared",
  INSPECTED: "Inspected",
  LISTED: "Listed",
  PRICE_CHANGE: "Price change",
  SOLD: "Sold",
  OWNERSHIP_TRANSFER: "Ownership transfer",
  SERVICED: "Serviced",
  REPAIRED: "Repaired",
  INSURED: "Insured",
  REGISTERED: "Registered",
  MILEAGE_UPDATE: "Mileage update",
  NOTE: "Note",
};

export async function VehiclePassport({ vehicleId }: { vehicleId: string }) {
  const passport = await getVehiclePassport(vehicleId);
  const events = passport?.events ?? [];

  return (
    <section className="mt-8">
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <h2 className="text-xl font-bold">CarVista Passport</h2>
          </div>
          {passport && (
            <span className="font-mono text-xs text-muted-foreground">VIN&nbsp;{passport.vin}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          The vehicle's verified history — every milestone recorded once and portable for life.
        </p>

        {events.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            This vehicle's passport is being established. Verified history will appear here.
          </div>
        ) : (
          <ol className="mt-6">
            {events.map((e, i) => {
              const Icon = EVENT_ICON[e.type] ?? StickyNote;
              const last = i === events.length - 1;
              return (
                <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!last && (
                    <span className="absolute bottom-0 left-[19px] top-10 w-px bg-border" aria-hidden />
                  )}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-brand-600">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{e.title}</span>
                      {e.verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="muted">Unverified</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {EVENT_LABEL[e.type] ?? e.type} · {formatDate(e.occurredAt)}
                      {e.recordedBy ? ` · by ${e.recordedBy}` : ""}
                    </p>
                    {e.notes && <p className="mt-1.5 text-sm text-muted-foreground">{e.notes}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
