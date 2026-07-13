"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ServiceBookingDialog({
  serviceProviderId,
  serviceName,
}: {
  serviceProviderId: string;
  serviceName: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please sign in to book");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceProviderId, scheduledAt, vehicleInfo, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not book");
        return;
      }
      toast.success(`Booking confirmed! Ref ${data.bookingNumber}`);
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full">
          <CalendarCheck className="h-4 w-4" /> Book an appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book with {serviceName}</DialogTitle>
          <DialogDescription>Pick a time and tell them about your vehicle.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Preferred date & time</Label>
            <Input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle (optional)</Label>
            <Input
              placeholder="e.g. 2018 Toyota Corolla"
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              rows={3}
              placeholder="What do you need done?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm booking
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
