"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
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

export function InspectionBookingDialog({
  vehicleTitle,
  triggerLabel = "Book an inspection",
  triggerVariant = "outline",
  className,
}: {
  vehicleTitle?: string;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  className?: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(vehicleTitle ?? "");
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please sign in to book an inspection");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleInfo, location, scheduledAt, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not book");
        return;
      }
      toast.success(`Inspection booked! Ref ${data.bookingNumber}`);
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
        <Button variant={triggerVariant} className={className}>
          <ClipboardCheck className="h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a vehicle inspection</DialogTitle>
          <DialogDescription>
            Our certified inspectors will check the vehicle and send you a report.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle</Label>
            <Input
              required
              placeholder="e.g. 2019 Mercedes-Benz C300"
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Inspection location</Label>
            <Input
              required
              placeholder="e.g. East Legon, Accra"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
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
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm inspection
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
