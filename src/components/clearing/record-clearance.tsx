"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Stamp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { dutyVariance, varianceSummary } from "@/lib/clearing";
import { formatCurrency } from "@/lib/utils";

/**
 * Recording a clearance.
 *
 * Two fields, because two fields is all an agent standing at the counter will
 * fill in: the entry number and what they paid. Everything else about the
 * vehicle is already known.
 *
 * The variance appears live as they type, before they submit. That is
 * deliberate — an agent who has just entered 820,000 instead of 82,000 sees
 * "951% more than we estimated" while the number is still editable, and a
 * transposed digit here would otherwise go on to drag every future estimate
 * for that model.
 */
export function RecordClearance({
  importId,
  title,
  estimatedDuty,
}: {
  importId: string;
  title: string;
  estimatedDuty: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entry, setEntry] = useState("");
  const [duty, setDuty] = useState("");
  const [notes, setNotes] = useState("");

  const parsedDuty = Number(duty);
  const variance =
    duty && !Number.isNaN(parsedDuty) ? dutyVariance(estimatedDuty, parsedDuty) : null;
  const summary = varianceSummary(variance);
  const wildlyOff = variance != null && Math.abs(variance.percent) > 100;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/clearing/${importId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customsEntryNumber: entry,
          actualDutyGhs: parsedDuty,
          notes: notes || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not record the clearance");
        return;
      }
      toast.success("Cleared. The buyer has been told.");
      setOpen(false);
      setEntry("");
      setDuty("");
      setNotes("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Stamp className="h-4 w-4" /> Record clearance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear {title}</DialogTitle>
          <DialogDescription>
            What customs actually charged, against the entry number on the bill.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="entry">Customs entry number</Label>
            <Input
              id="entry"
              required
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="e.g. TEMA-2026-114857"
            />
            <p className="text-xs text-muted-foreground">
              This is what makes the figure checkable rather than just stated.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duty">Duty actually paid (GHS)</Label>
            <Input
              id="duty"
              type="number"
              min="0"
              step="0.01"
              required
              value={duty}
              onChange={(e) => setDuty(e.target.value)}
              placeholder="82000"
            />
            {estimatedDuty != null && (
              <p className="text-xs text-muted-foreground">
                We estimated {formatCurrency(estimatedDuty)}.
                {summary ? ` ${summary}` : ""}
              </p>
            )}
            {wildlyOff && (
              <p className="text-xs font-medium text-warning">
                That is a long way from the estimate — worth checking the figure before you save.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the buyer should know about the clearance."
            />
          </div>

          <DialogFooter>
            <Button type="submit" variant="gradient" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Record clearance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
