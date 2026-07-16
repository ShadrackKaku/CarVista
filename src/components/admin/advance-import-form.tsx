"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMPORT_STAGES } from "@/lib/constants";

export function AdvanceImportForm({ id, currentStage }: { id: string; currentStage: string }) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eta, setEta] = useState("");
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a short title for this update");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/imports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          stage,
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          estimatedArrival: eta || undefined,
          trackingNumber: tracking.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not post the update");
        return;
      }
      toast.success("Update posted — the customer and passport are updated");
      setTitle("");
      setDescription("");
      setLocation("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Stage</Label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {IMPORT_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Location (optional)</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Tema Port" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Update title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Vehicle loaded onto vessel MV Grande"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Details (optional)</Label>
        <Textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Anything the customer should know about this step."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Est. arrival (optional)</Label>
          <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tracking no. (optional)</Label>
          <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Shipping/BL number" />
        </div>
      </div>
      <Button type="submit" variant="gradient" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Post update &amp; advance stage
      </Button>
    </form>
  );
}
