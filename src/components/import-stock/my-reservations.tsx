import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TimeLeft } from "@/components/import-stock/time-left";
import { formatSourceAmount } from "@/lib/import-stock";
import { refundDue } from "@/lib/reservations";
import { formatCurrency } from "@/lib/utils";
import type { MyReservationRow } from "@/lib/queries";

/**
 * What a buyer has paid to hold, and what they must do next.
 *
 * This is a receipt for real money, so it states the three things a buyer would
 * otherwise have to ask for: how long is left, what the fee is worth if they
 * proceed, and what comes back if they don't. The importer's contact details
 * sit on the live holds — the next step is a bank transfer arranged with a
 * person, and burying the phone number would strand them mid-purchase.
 */
export function MyReservations({ reservations }: { reservations: MyReservationRow[] }) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground">You have no reservations yet.</p>
        <Link
          href="/app/imports/stock"
          className="mt-3 inline-block font-medium text-brand-600 hover:underline"
        >
          Browse cars ready to import
        </Link>
      </div>
    );
  }

  const live = reservations.filter((r) => r.status === "ACTIVE");
  const past = reservations.filter((r) => r.status !== "ACTIVE");

  return (
    <div className="space-y-8">
      {live.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold">Holds running now</h2>
          {live.map((r) => (
            <LiveHold key={r.id} reservation={r} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Earlier reservations</h2>
          {past.map((r) => (
            <PastHold key={r.id} reservation={r} />
          ))}
        </section>
      )}
    </div>
  );
}

function LiveHold({ reservation: r }: { reservation: MyReservationRow }) {
  const { importer } = r.listing;
  const backIfLapsed = refundDue(r.feeGhs, r.refundRate);

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/app/imports/stock/${r.listing.slug}`}
            className="font-semibold hover:text-brand-600"
          >
            {r.listing.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatSourceAmount(r.listing.fobAmount, r.listing.fobCurrency)} FOB · held with{" "}
            {importer.name}
          </p>
        </div>
        <Badge variant="success">Holding one unit</Badge>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
        <Clock className="h-4 w-4 shrink-0 text-brand-600" />
        {r.expiresAt ? (
          <span>
            <TimeLeft deadline={r.expiresAt.toISOString()} /> to pay the FOB
            {r.graceApplied && (
              <span className="text-muted-foreground"> · extended around a public holiday</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">Waiting for the fee to clear</span>
        )}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <div>
            <dt className="font-medium">Pay in time</dt>
            <dd className="text-muted-foreground">
              The whole {formatCurrency(r.feeGhs)} comes off the FOB.
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <dt className="font-medium">Miss the window</dt>
            <dd className="text-muted-foreground">
              {backIfLapsed > 0 ? (
                <>
                  {formatCurrency(backIfLapsed)} is refunded; the car goes back on the market.
                </>
              ) : (
                <>The fee is forfeited and the car goes back on the market.</>
              )}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-sm">
        <span className="text-muted-foreground">Arrange the transfer with {importer.name}:</span>
        {importer.phone && (
          <a href={`tel:${importer.phone}`} className="flex items-center gap-1.5 font-medium hover:text-brand-600">
            <Phone className="h-3.5 w-3.5" />
            {importer.phone}
          </a>
        )}
        {importer.whatsapp && (
          <a
            href={`https://wa.me/${importer.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium hover:text-brand-600"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        )}
        {importer.email && (
          <a href={`mailto:${importer.email}`} className="flex items-center gap-1.5 font-medium hover:text-brand-600">
            <Mail className="h-3.5 w-3.5" />
            Email
          </a>
        )}
        {!importer.phone && !importer.whatsapp && !importer.email && (
          <span className="text-muted-foreground">
            No contact on file — message us and we&apos;ll put you in touch.
          </span>
        )}
      </div>

      <p className="mt-3 font-mono text-xs text-muted-foreground">{r.reference}</p>
    </article>
  );
}

const PAST_LABEL: Record<string, { text: string; variant: "secondary" | "brand" | "outline" }> = {
  PENDING_PAYMENT: { text: "Payment not completed — holds nothing", variant: "secondary" },
  CONVERTED: { text: "Went through to purchase", variant: "brand" },
  EXPIRED: { text: "Window closed", variant: "outline" },
  CANCELLED: { text: "Cancelled", variant: "outline" },
};

function PastHold({ reservation: r }: { reservation: MyReservationRow }) {
  const label = PAST_LABEL[r.status] ?? { text: r.status.toLowerCase(), variant: "outline" as const };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm">
      <div className="min-w-0">
        <Link
          href={`/app/imports/stock/${r.listing.slug}`}
          className="font-medium hover:text-brand-600"
        >
          {r.listing.title}
        </Link>
        <p className="font-mono text-xs text-muted-foreground">{r.reference}</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Stated whenever money came back, so the buyer is never left
            wondering whether the refund actually happened. */}
        {r.refundedGhs != null && r.refundedGhs > 0 && (
          <span className="text-muted-foreground">
            {formatCurrency(r.refundedGhs)} refunded
          </span>
        )}
        <Badge variant={label.variant}>{label.text}</Badge>
      </div>
    </div>
  );
}
