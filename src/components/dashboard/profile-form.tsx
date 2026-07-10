"use client";

import { useState } from "react";
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
import { GHANA_REGIONS } from "@/lib/constants";

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { name: string; email: string };
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: defaultValues.name,
    phone: "",
    city: "",
    region: "Greater Accra",
    bio: "",
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border bg-card p-6 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={defaultValues.email} disabled />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input placeholder="0201234567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={form.region} onValueChange={(v) => update("region", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GHANA_REGIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea placeholder="Tell us a bit about yourself..." value={form.bio} onChange={(e) => update("bio", e.target.value)} />
      </div>
      <Button type="submit" variant="gradient" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
