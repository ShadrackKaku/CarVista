"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

export function ContactSellerDialog({
  recipientId,
  vehicleId,
  vehicleTitle,
}: {
  recipientId?: string;
  vehicleId?: string;
  vehicleTitle: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(`Hi, is the ${vehicleTitle} still available?`);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please sign in to message the seller");
      router.push("/login");
      return;
    }
    if (!recipientId) {
      toast.info("Use WhatsApp or call to reach this seller.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          subject: `Enquiry: ${vehicleTitle}`,
          body,
          vehicleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send message");
        return;
      }
      toast.success("Message sent! The seller will get back to you.");
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
        <Button variant="ghost" className="w-full">
          <Mail className="h-4 w-4" /> Send a message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message the seller</DialogTitle>
          <DialogDescription>
            About <span className="font-medium text-foreground">{vehicleTitle}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Your message</Label>
            <Textarea rows={5} required value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send message
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
