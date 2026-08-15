import Link from "next/link";
import { AlertCircle, BadgeCheck, Clock, ShieldAlert, Ship } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecordClearance } from "@/components/clearing/record-clearance";
import { AGENT_ASSIGNABLE_STAGES } from "@/lib/clearing";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * The clearing agent's workspace: the cars sitting at the port with their name
 * on them.
 *
 * Deliberately a queue rather than a dashboard. An agent opens this to answer
 * one question — what do I have to clear today — and every other number would
 * be in the way of it.
 */
export default async function ClearingConsolePage() {
  const user = await getCurrentUser();
  const agent = user
    ? await prisma.clearingAgent.findUnique({
        where: { userId: user.id },
        select: { id: true, businessName: true, verified: true, licenceNumber: true },
      })
    : null;

  if (!agent) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed p-12 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No clearing agent profile yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile is created when a clearing agent application is approved.
        </p>
        <Button asChild variant="gradient" className="mt-5">
          <Link href="/dashboard/upgrade">Apply to become a clearing agent</Link>
        </Button>
      </div>
    );
  }

  const [waiting, cleared] = await Promise.all([
    prisma.importRequest.findMany({
      where: {
        clearingAgentId: agent.id,
        stage: { in: [...AGENT_ASSIGNABLE_STAGES] },
        clearedAt: null,
      },
      orderBy: { updatedAt: "asc" },
      select: {
        id: true,
        requestNumber: true,
        make: true,
        model: true,
        year: true,
        stage: true,
        quotedDuty: true,
        estimatedArrival: true,
        listing: { select: { make: true, model: true, year: true, chassisNumber: true } },
      },
    }),
    prisma.importRequest.count({ where: { clearingAgentId: agent.id, clearedAt: { not: null } } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Verification is the first thing an agent should see, because without
          it they are invisible to buyers and this queue will stay empty. */}
      {!agent.verified && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold">Not yet verified</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Buyers are only offered verified agents, so no vehicles will reach you until an
              administrator has checked your Customs licence
              {agent.licenceNumber
                ? " against the number on file."
                : " — send them your licence number so it can be recorded."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Waiting on you" value={waiting.length} hint="At the port, not yet cleared" />
        <Stat label="Cleared" value={cleared} hint="Entries you have recorded" />
        <Stat
          label="Status"
          value={agent.verified ? "Verified" : "Pending"}
          hint={agent.verified ? "Offered to buyers" : "Not offered yet"}
        />
      </div>

      <div>
        <h2 className="font-display text-lg font-bold">Vehicles at the port</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Record the entry number and the duty you actually paid. The buyer sees it against what
          they were quoted.
        </p>

        {waiting.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
            <Ship className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">Nothing waiting</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vehicles appear here when a buyer engages you at the port.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {waiting.map((car) => {
              const title = `${car.listing?.year ?? car.year} ${car.listing?.make ?? car.make} ${
                car.listing?.model ?? car.model
              }`;
              return (
                <li
                  key={car.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-soft"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {car.requestNumber}
                      {car.listing?.chassisNumber ? ` · ${car.listing.chassisNumber}` : ""}
                      {car.estimatedArrival ? ` · arrived ${formatDate(car.estimatedArrival)}` : ""}
                    </p>
                    {car.quotedDuty != null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estimated duty {formatCurrency(Number(car.quotedDuty))}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={car.stage === "CUSTOMS_CLEARANCE" ? "brand" : "secondary"}>
                      {car.stage === "CUSTOMS_CLEARANCE" ? "With customs" : "At port"}
                    </Badge>
                    <RecordClearance
                      importId={car.id}
                      title={title}
                      estimatedDuty={car.quotedDuty != null ? Number(car.quotedDuty) : null}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
