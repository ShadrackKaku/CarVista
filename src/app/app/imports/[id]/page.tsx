import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Car, MessageCircle, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getUserImportDetail } from "@/lib/queries";
import { ImportTimeline } from "@/components/import/import-timeline";
import { ImportMilestones } from "@/components/import/import-milestones";
import { EscrowPlanCard } from "@/components/import/escrow-plan-card";
import { TakeIntoInventory } from "@/components/import/take-into-inventory";
import { ChooseClearingAgent } from "@/components/import/choose-clearing-agent";
import { ClearanceReceipt } from "@/components/import/clearance-receipt";
import { canEnterInventory, landedCostOf } from "@/lib/import-to-inventory";
import { canAssignAgent } from "@/lib/clearing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IMPORT_STAGES, SITE } from "@/lib/constants";
import { formatCurrency, formatDate, whatsappUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

function stageLabel(stage: string) {
  return IMPORT_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export default async function CustomerImportDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/dashboard/imports/${params.id}`);

  const imp = await getUserImportDetail(params.id, user.id);
  if (!imp) notFound();

  const q = imp.quote;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/app/imports/mine"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My imports
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">{imp.vehicle}</h2>
          <p className="mt-1 text-muted-foreground">
            Ref {imp.ref} · From {imp.origin}
            {imp.estimatedArrival ? ` · ETA ${formatDate(imp.estimatedArrival)}` : ""}
            {imp.trackingNumber ? ` · Tracking ${imp.trackingNumber}` : ""}
          </p>
        </div>
        <Badge variant={imp.stage === "CANCELLED" ? "destructive" : "brand"}>
          {stageLabel(imp.stage)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: progress + real milestones */}
        <div className="space-y-6">
          {/* At the port with no broker engaged: the one decision the buyer has
              to make before the car can move. */}
          {canAssignAgent(imp.stage) && !imp.clearance.agent && (
            <ChooseClearingAgent importId={imp.id} />
          )}

          {/* The end of the import and the start of ownership. Shown only once
              customs is behind them, and only until they take it — after that
              the sidebar carries a link to the car itself. */}
          {!imp.vehicleSlug && canEnterInventory(imp.stage) && (
            <TakeIntoInventory
              importId={imp.id}
              // The real bill once it exists: a dealer setting a price against
              // a landed cost we know to be stale is the one mistake this
              // whole chain is built to prevent.
              landedCost={landedCostOf({
                quotedTotal: q.total,
                quotedCif: q.cif,
                quotedDuty: q.duty,
                quotedShipping: q.shipping,
                actualDuty: imp.clearance.actualDuty,
              })}
            />
          )}

          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-semibold">Journey</h2>
            <div className="mt-4">
              <ImportTimeline currentStage={imp.stage} />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-semibold">Updates</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Every milestone your agent posts, newest first.
            </p>
            <div className="mt-4">
              <ImportMilestones events={imp.events} />
            </div>
          </div>

          {imp.escrow && (imp.escrow.status === "ACTIVE" || imp.escrow.status === "COMPLETED") && (
            <EscrowPlanCard importId={imp.id} plan={imp.escrow} />
          )}
        </div>

        {/* Right: quote + vehicle + contact */}
        <aside className="space-y-5">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold">Guaranteed landed cost</h2>
            </div>
            {q.total ? (
              <>
                <dl className="mt-4 space-y-2 text-sm">
                  {q.cif != null && <QuoteRow label="CIF value" value={formatCurrency(q.cif)} />}
                  {q.duty != null && <QuoteRow label="Import duty" value={formatCurrency(q.duty)} />}
                  {q.shipping != null && (
                    <QuoteRow label="Shipping" value={formatCurrency(q.shipping)} />
                  )}
                </dl>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-display text-xl font-bold text-brand-700 dark:text-brand-400">
                    {formatCurrency(q.total)}
                  </span>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  The all-in figure we stand behind — no surprises at the port.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Your quote is being prepared — you'll see the guaranteed total here.
              </p>
            )}
          </div>

          {/* Once the bill is real, the estimate is judged against it. */}
          <ClearanceReceipt
            estimatedDuty={q.duty ?? null}
            actualDuty={imp.clearance.actualDuty}
            entryNumber={imp.clearance.entryNumber}
            agent={imp.clearance.agent}
            agentLicensed={imp.clearance.agentLicensed}
            clearedAt={imp.clearance.clearedAt}
          />

          {imp.vehicleSlug && (
            <Link
              href={`/app/marketplace/vehicles/${imp.vehicleSlug}`}
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-colors hover:bg-accent/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40">
                <Car className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">View listing &amp; Passport</p>
                <p className="text-xs text-muted-foreground">See this vehicle's verified history</p>
              </div>
            </Link>
          )}

          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-semibold">Questions?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Chat with your dedicated import agent for anything about your shipment.
            </p>
            <Button asChild className="mt-4 w-full bg-[#25D366] text-white hover:bg-[#20bd5a]">
              <a
                href={whatsappUrl(SITE.whatsapp, `Hi, I'd like an update on import ${imp.ref}.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
