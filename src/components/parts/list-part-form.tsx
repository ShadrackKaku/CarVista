"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ImageUploader } from "@/components/image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PART_CATEGORIES } from "@/lib/constants";

const PART_CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "USED", label: "Used" },
  { value: "REFURBISHED", label: "Refurbished" },
] as const;

export interface PartFormInitial {
  name?: string;
  categorySlug?: string;
  brand?: string;
  oemNumber?: string;
  partNumber?: string;
  condition?: string;
  price?: string;
  discountPrice?: string;
  stock?: number;
  sku?: string;
  compatibleMakes?: string[];
  compatibleModels?: string[];
  yearFrom?: string;
  yearTo?: string;
  fitmentPosition?: string;
  description?: string;
  images?: string[];
}

export function ListPartForm({
  initial,
  partId,
}: {
  initial?: PartFormInitial;
  partId?: string;
} = {}) {
  const isEdit = !!partId;
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    categorySlug: initial?.categorySlug ?? "",
    brand: initial?.brand ?? "",
    oemNumber: initial?.oemNumber ?? "",
    partNumber: initial?.partNumber ?? "",
    condition: initial?.condition ?? "NEW",
    price: initial?.price ?? "",
    discountPrice: initial?.discountPrice ?? "",
    stock: initial?.stock != null ? String(initial.stock) : "1",
    sku: initial?.sku ?? "",
    yearFrom: initial?.yearFrom ?? "",
    yearTo: initial?.yearTo ?? "",
    fitmentPosition: initial?.fitmentPosition ?? "",
    description: initial?.description ?? "",
  });
  const [makes, setMakes] = useState(initial?.compatibleMakes?.join(", ") ?? "");
  const [models, setModels] = useState(initial?.compatibleModels?.join(", ") ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const toList = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please sign in to list a part");
      router.push("/login?callbackUrl=/dashboard/seller/products/new");
      return;
    }
    if (!form.categorySlug) {
      toast.error("Please choose a category");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/parts/${partId}` : "/api/parts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          categorySlug: form.categorySlug,
          brand: form.brand || undefined,
          oemNumber: form.oemNumber || undefined,
          partNumber: form.partNumber || undefined,
          condition: form.condition,
          price: Number(form.price),
          discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
          stock: Number(form.stock || 0),
          sku: form.sku || undefined,
          compatibleMakes: toList(makes),
          compatibleModels: toList(models),
          yearFrom: form.yearFrom ? Number(form.yearFrom) : undefined,
          yearTo: form.yearTo ? Number(form.yearTo) : undefined,
          fitmentPosition: form.fitmentPosition || undefined,
          description: form.description || undefined,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? (isEdit ? "Could not update product" : "Could not create product"));
        return;
      }
      toast.success(isEdit ? "Product updated" : "Product listed");
      router.push("/dashboard/seller/products");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Product details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Product name</Label>
            <Input
              required
              placeholder="e.g. Toyota Corolla Front Brake Pads"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.categorySlug} onValueChange={(v) => update("categorySlug", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PART_CATEGORIES.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(v) => update("condition", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PART_CONDITIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Manufacturer / brand</Label>
            <Input placeholder="Bosch, Denso…" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>OEM number</Label>
            <Input placeholder="04465-02220" value={form.oemNumber} onChange={(e) => update("oemNumber", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Part number</Label>
            <Input value={form.partNumber} onChange={(e) => update("partNumber", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input value={form.sku} onChange={(e) => update("sku", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <RichTextEditor value={form.description} onChange={(html) => update("description", html)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Pricing & stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Price (GHS)</Label>
            <Input type="number" required min="0" step="0.01" placeholder="450" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Discount price (GHS)</Label>
            <Input type="number" min="0" step="0.01" placeholder="Optional" value={form.discountPrice} onChange={(e) => update("discountPrice", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Stock quantity</Label>
            <Input type="number" required min="0" step="1" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Compatibility</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help buyers find the right part. Separate multiple entries with commas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Compatible makes</Label>
            <Input placeholder="Toyota, Honda, Nissan" value={makes} onChange={(e) => setMakes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Compatible models</Label>
            <Input placeholder="Corolla, Camry" value={models} onChange={(e) => setModels(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Year from</Label>
            <Input type="number" placeholder="2015" value={form.yearFrom} onChange={(e) => update("yearFrom", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Year to</Label>
            <Input type="number" placeholder="2021" value={form.yearTo} onChange={(e) => update("yearTo", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Fitment position</Label>
            <Input placeholder="Front, rear, left, right…" value={form.fitmentPosition} onChange={(e) => update("fitmentPosition", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Photos</h2>
        <div className="mt-4">
          <ImageUploader
            value={images}
            onChange={setImages}
            max={12}
            label="Upload photos"
            hint="Clear photos of the part — up to 12 images, 10 MB each."
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        {isEdit ? (
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="gradient" size="lg" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Publish product"}
        </Button>
      </div>
    </form>
  );
}
