"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POPULAR_BRANDS,
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_CONDITIONS,
  GHANA_REGIONS,
} from "@/lib/constants";

export function ListVehicleForm() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    title: "",
    brandId: "",
    year: new Date().getFullYear() - 3,
    price: "",
    mileage: "",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: "",
    bodyType: "SEDAN",
    condition: "FOREIGN_USED",
    color: "",
    city: "",
    region: "Greater Accra",
    description: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  function update(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please sign in to list a vehicle");
      router.push("/login?callbackUrl=/vehicles/new");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          brandId: form.brandId,
          year: Number(form.year),
          price: Number(form.price),
          mileage: Number(form.mileage),
          engineSize: form.engineSize ? Number(form.engineSize) : undefined,
          images,
          videoUrl: videoUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create listing");
        return;
      }
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h3 className="mt-4 font-display text-xl font-bold">Listing submitted!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your vehicle has been submitted. Dealer listings go live instantly; private listings are
          reviewed within 24 hours.
        </p>
        <Button asChild variant="gradient" className="mt-6">
          <a href="/dashboard">Go to dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Vehicle details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Listing title</Label>
            <Input required placeholder="e.g. 2021 Toyota Camry SE" value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select value={form.brandId} onValueChange={(v) => update("brandId", v)}>
              <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {POPULAR_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Price (GHS)</Label>
            <Input type="number" required placeholder="285000" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mileage (km)</Label>
            <Input type="number" required placeholder="42000" value={form.mileage} onChange={(e) => update("mileage", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fuel type</Label>
            <Select value={form.fuelType} onValueChange={(v) => update("fuelType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FUEL_TYPES.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Transmission</Label>
            <Select value={form.transmission} onValueChange={(v) => update("transmission", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSMISSIONS.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body type</Label>
            <Select value={form.bodyType} onValueChange={(v) => update("bodyType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BODY_TYPES.map((b) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(v) => update("condition", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VEHICLE_CONDITIONS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Engine size (L)</Label>
            <Input type="number" step="0.1" placeholder="2.5" value={form.engineSize} onChange={(e) => update("engineSize", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Colour</Label>
            <Input placeholder="Pearl White" value={form.color} onChange={(e) => update("color", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input placeholder="Accra" value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={form.region} onValueChange={(v) => update("region", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GHANA_REGIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={4} placeholder="Describe the vehicle, its condition, service history and features..." value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Media upload */}
      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add clear photos — exterior, interior and engine. Great photos sell faster.
        </p>
        <div className="mt-4">
          <ImageUploader
            value={images}
            onChange={setImages}
            max={20}
            label="Upload photos"
            hint="Exterior, interior, engine — up to 20 images, 10 MB each."
          />
        </div>
        <div className="mt-6">
          <Label className="text-xs">Video walk-around (YouTube / Vimeo URL)</Label>
          <Input
            placeholder="https://youtube.com/watch?v=..."
            className="mt-1.5"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">Save draft</Button>
        <Button type="submit" variant="gradient" size="lg" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish listing
        </Button>
      </div>
    </form>
  );
}
