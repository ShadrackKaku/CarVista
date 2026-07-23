"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/image-uploader";

export interface BlogPostInitial {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number;
  published?: boolean;
  featured?: boolean;
}

export function BlogPostForm({
  initial,
  postId,
}: {
  initial?: BlogPostInitial;
  postId?: string;
} = {}) {
  const isEdit = !!postId;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    category: initial?.category ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    readTime: initial?.readTime != null ? String(initial.readTime) : "",
  });
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "");
  const [cover, setCover] = useState<string[]>(initial?.coverImage ? [initial.coverImage] : []);
  const [published, setPublished] = useState(initial?.published ?? false);
  const [featured, setFeatured] = useState(initial?.featured ?? false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/blog/${postId}` : "/api/admin/blog", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category || undefined,
          excerpt: form.excerpt || undefined,
          content: form.content,
          coverImage: cover[0] || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          readTime: form.readTime ? Number(form.readTime) : undefined,
          published,
          featured,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? (isEdit ? "Could not update post" : "Could not create post"));
        return;
      }
      toast.success(isEdit ? "Post saved" : published ? "Post published" : "Draft saved");
      router.push("/admin/blog");
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input
              required
              placeholder="e.g. How to import a car into Ghana in 2026"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              placeholder="Buying Guides, Import Tips…"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Read time (minutes)</Label>
            <Input
              type="number"
              min="1"
              placeholder="Auto from content"
              value={form.readTime}
              onChange={(e) => update("readTime", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Excerpt</Label>
            <Textarea
              rows={2}
              placeholder="A short summary shown on cards and in search results."
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Tags</Label>
            <Input
              placeholder="import, duty, toyota (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <Label>Content</Label>
        <Textarea
          required
          rows={16}
          className="mt-2 font-mono text-sm"
          placeholder="Write the full article here…"
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
        />
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Cover image</h2>
        <div className="mt-4">
          <ImageUploader
            value={cover}
            onChange={setCover}
            max={1}
            label="Upload cover"
            hint="One landscape image works best (16:9)."
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Publishing</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={published} onCheckedChange={(v) => setPublished(v === true)} />
            <span>
              <span className="font-medium">Published</span> — visible on the public blog. Leave off
              to save as a draft.
            </span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={featured} onCheckedChange={(v) => setFeatured(v === true)} />
            <span>
              <span className="font-medium">Featured</span> — highlight this post on the blog.
            </span>
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient" size="lg" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create post"}
        </Button>
      </div>
    </form>
  );
}
