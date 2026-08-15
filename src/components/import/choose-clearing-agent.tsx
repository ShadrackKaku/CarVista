"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  businessName: string;
  city: string | null;
  ports: string[];
  turnaroundDays: number | null;
  rating: number;
  reviewCount: number;
  licensed: boolean;
}

/**
 * Choosing the broker who will clear your car.
 *
 * The buyer picks, not an administrator. That is the difference between a
 * marketplace and a concierge service: agents win work by being verified and
 * fast, and the platform does not have to stand in the middle of every
 * shipment.
 *
 * Only verified agents are ever listed. The whole reason to engage a broker
 * here rather than through a number somebody passed you at the port is that
 * their licence has been checked — an unverified name in this list would give
 * away the only thing being sold.
 */
export function ChooseClearingAgent({ importId }: { importId: string }) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/import-requests/${importId}/agent`)
      .then((r) => r.json())
      .then((d) => {
        if (live) setAgents(d.agents ?? []);
      })
      .catch(() => {
        if (live) setAgents([]);
      });
    return () => {
      live = false;
    };
  }, [importId]);

  async function engage() {
    if (!chosen) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/import-requests/${importId}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearingAgentId: chosen }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not engage that agent");
        return;
      }
      toast.success(`${data.agent.businessName} is on it.`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-6 shadow-soft dark:border-brand-900 dark:bg-brand-950/30">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold">Your car is at the port</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Choose a licensed clearing agent. Every agent here has had their Customs licence checked by
        us, and they record the duty they actually pay against the entry number.
      </p>

      {agents === null ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding agents at Tema…
        </div>
      ) : agents.length === 0 ? (
        <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          No verified agents are available right now. Your import agent will arrange clearance and
          you will see the entry number here when it is done.
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                aria-pressed={chosen === agent.id}
                onClick={() => setChosen(agent.id)}
                className={cn(
                  "block w-full rounded-xl border bg-card p-4 text-left transition-colors",
                  chosen === agent.id ? "border-brand-600 ring-1 ring-brand-600" : "hover:bg-accent",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {agent.businessName}
                  {agent.licensed && (
                    <BadgeCheck className="h-4 w-4 text-success" aria-label="Licence on file" />
                  )}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {agent.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {agent.city}
                    </span>
                  )}
                  {agent.turnaroundDays != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Usually {agent.turnaroundDays} days
                    </span>
                  )}
                  {agent.reviewCount > 0 && (
                    <span>
                      {agent.rating.toFixed(1)} ★ ({agent.reviewCount})
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <Button
            variant="gradient"
            className="mt-5"
            disabled={!chosen || busy}
            onClick={engage}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Engage this agent
          </Button>
        </>
      )}
    </div>
  );
}
