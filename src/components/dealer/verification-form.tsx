"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ID_TYPES = ["Ghana Card", "Passport", "Driver's License", "Voter ID"];

type Fields = {
  businessRegNumber: string;
  taxId: string | null;
  contactName: string;
  contactPhone: string;
  idType: string;
  idNumber: string;
  documentUrl: string | null;
  notes: string | null;
} | null;

export function VerificationForm({ initial }: { initial: Fields }) {
  const router = useRouter();
  const [form, setForm] = useState({
    businessRegNumber: initial?.businessRegNumber ?? "",
    taxId: initial?.taxId ?? "",
    contactName: initial?.contactName ?? "",
    contactPhone: initial?.contactPhone ?? "",
    idType: initial?.idType ?? ID_TYPES[0],
    idNumber: initial?.idNumber ?? "",
    documentUrl: initial?.documentUrl ?? "",
    notes: initial?.notes ?? "",
  });
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/dealer/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not submit");
        return;
      }
      toast.success("Submitted for review — we'll be in touch.");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Business registration no.</Label>
          <Input
            value={form.businessRegNumber}
            onChange={(e) => set("businessRegNumber", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tax ID (optional)</Label>
          <Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Contact name</Label>
          <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Contact phone</Label>
          <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>ID type</Label>
          <Select value={form.idType} onValueChange={(v) => set("idType", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>ID number</Label>
          <Input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Document link (optional)</Label>
        <Input
          type="url"
          placeholder="https://…  (business cert / ID scan)"
          value={form.documentUrl}
          onChange={(e) => set("documentUrl", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Anything else (optional)</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
      </div>
      <Button type="submit" variant="gradient" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit for verification
      </Button>
    </form>
  );
}
