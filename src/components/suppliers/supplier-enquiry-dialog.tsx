"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPLIER_CATEGORIES, SUPPLIER_CATEGORY_LABELS } from "@/lib/suppliers";

/**
 * Ask a supplier to quote.
 *
 * Wholesale has no price to click "buy" on — quantity and terms are negotiated
 * — so this opens a conversation rather than an order.
 */
export function SupplierEnquiryDialog({
  supplierId,
  supplierName,
}: {
  supplierId: string;
  supplierName: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ item: "", quantity: "", category: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/supplier-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, supplierId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send your enquiry");
        return;
      }
      toast.success(`Sent to ${supplierName}. Their reply lands in your enquiries.`);
      setOpen(false);
      setForm({ item: "", quantity: "", category: "", message: "" });
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full">
          <Send className="h-4 w-4" /> Request a quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a quote from {supplierName}</DialogTitle>
          <DialogDescription>
            Tell them what you need and roughly how much. They reply with pricing and terms.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="enquiry-item">What do you need?</Label>
            <Input
              id="enquiry-item"
              required
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              placeholder="Toyota Corolla brake pads, 2015–2020"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="enquiry-quantity">Quantity</Label>
              <Input
                id="enquiry-quantity"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="200 sets"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enquiry-category">Category</Label>
              <select
                id="enquiry-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Not sure</option>
                {SUPPLIER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {SUPPLIER_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enquiry-message">Anything else?</Label>
            <Textarea
              id="enquiry-message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Delivery location, how soon you need it, whether this would be a repeat order."
            />
          </div>

          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send enquiry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
