"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ArrowLeftRight } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE } from "@/lib/constants";

// Event types an owner/admin would log by hand (import/shipping milestones are
// written automatically by the ops flow).
const LOGGABLE_EVENTS: { value: string; label: string }[] = [
  { value: "SERVICED", label: "Serviced" },
  { value: "REPAIRED", label: "Repaired" },
  { value: "MILEAGE_UPDATE", label: "Mileage update" },
  { value: "INSPECTED", label: "Inspected" },
  { value: "INSURED", label: "Insured" },
  { value: "REGISTERED", label: "Registered" },
  { value: "NOTE", label: "Note" },
];

/**
 * Owner/admin controls for a vehicle's passport: log a new history event, or
 * transfer ownership. Visibility is gated client-side by the session; the APIs
 * enforce the real authorization.
 */
export function PassportManager({
  vehicleId,
  sellerId,
}: {
  vehicleId: string;
  sellerId?: string | null;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;
  const canManage = !!user && (user.role === "ADMIN" || (!!sellerId && user.id === sellerId));

  const [eventOpen, setEventOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  if (!canManage) return null;

  return (
    <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
      <Button variant="outline" size="sm" onClick={() => setEventOpen(true)}>
        <Plus className="h-4 w-4" /> Log event
      </Button>
      <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
        <ArrowLeftRight className="h-4 w-4" /> Transfer ownership
      </Button>

      <LogEventDialog
        vehicleId={vehicleId}
        open={eventOpen}
        onOpenChange={setEventOpen}
        onDone={() => router.refresh()}
      />
      <TransferDialog
        vehicleId={vehicleId}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onDone={() => router.refresh()}
      />
    </div>
  );
}

function LogEventDialog({
  vehicleId,
  open,
  onOpenChange,
  onDone,
}: {
  vehicleId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [type, setType] = useState("SERVICED");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, notes: notes || undefined, occurredAt: occurredAt || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not add the event");
        return;
      }
      toast.success("Event added to the passport");
      setTitle("");
      setNotes("");
      setOccurredAt("");
      onOpenChange(false);
      onDone();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a passport event</DialogTitle>
          <DialogDescription>
            Add to this vehicle&apos;s permanent history. Your entries show as unverified until an
            admin confirms them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOGGABLE_EVENTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full service at 90,000 km"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Date (optional)</Label>
            <Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" variant="gradient" disabled={busy || title.trim().length < 2}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Add event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({
  vehicleId,
  open,
  onOpenChange,
  onDone,
}: {
  vehicleId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm(`Transfer ownership to ${email}? This can't be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note: note || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not transfer");
        return;
      }
      toast.success("Ownership transferred");
      setEmail("");
      setNote("");
      onOpenChange(false);
      onDone();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer ownership</DialogTitle>
          <DialogDescription>
            Hand this vehicle to another {SITE.name} member. It records a verified transfer on the
            passport and moves the listing to them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>New owner&apos;s email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Sold privately, Jul 2026"
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="gradient" disabled={busy || !email}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
