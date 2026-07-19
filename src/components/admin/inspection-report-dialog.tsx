"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Loader2 } from "lucide-react";
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

export function InspectionReportDialog({
  id,
  ref: bookingRef,
  initial,
}: {
  id: string;
  ref: string;
  initial: { overallGrade: string | null; reportSummary: string | null; reportUrl: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(initial.overallGrade ?? "");
  const [summary, setSummary] = useState(initial.reportSummary ?? "");
  const [url, setUrl] = useState(initial.reportUrl ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/inspections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overallGrade: grade, reportSummary: summary, reportUrl: url || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the report");
        return;
      }
      toast.success("Report saved");
      setOpen(false);
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
        <Button size="sm" variant="outline">
          <ClipboardCheck className="h-4 w-4" /> {initial.reportSummary ? "Edit report" : "Add report"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inspection report · {bookingRef}</DialogTitle>
          <DialogDescription>
            Filing a report marks the inspection complete and notifies the customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Overall grade</Label>
            <Input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. A / B / 4.5"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Summary</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="Key findings: bodywork, engine, mileage authenticity, accident history…"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Full report link (optional)</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… (PDF)"
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="gradient" disabled={busy || grade.trim() === "" || summary.trim().length < 2}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
