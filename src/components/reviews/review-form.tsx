"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ReviewForm({
  targetType,
  targetId,
}: {
  targetType: "vehicle" | "part" | "dealer" | "service";
  targetId: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please sign in to leave a review");
      router.push("/login");
      return;
    }
    if (rating < 1) {
      toast.error("Please choose a star rating");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, rating, title, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not submit review");
        return;
      }
      toast.success("Thanks for your review!");
      setRating(0);
      setTitle("");
      setComment("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold">Write a review</h3>
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hover || rating) >= n ? "fill-warning text-warning" : "fill-muted text-muted",
                )}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Title (optional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your experience" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Your review</Label>
          <Textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share the details of your experience…"
          />
        </div>
      </div>
      <Button type="submit" variant="gradient" className="mt-4" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit review
      </Button>
    </form>
  );
}
