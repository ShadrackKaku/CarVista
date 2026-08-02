"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Answer one enquiry, or close it. A quote must carry the actual quote. */
export function EnquiryReply({ id }: { id: string }) {
  const router = useRouter();
  const [quoting, setQuoting] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (quoting) ref.current?.focus();
  }, [quoting]);

  async function send(status: "QUOTED" | "DECLINED" | "CLOSED") {
    setLoading(status);
    try {
      const res = await fetch(`/api/supplier-enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, response: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save your reply");
        return;
      }
      toast.success(status === "QUOTED" ? "Quote sent" : "Enquiry closed");
      setQuoting(false);
      setText("");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (quoting) {
    return (
      <div className="mt-4 space-y-2 border-t pt-4">
        <Textarea
          ref={ref}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Unit price, minimum quantity, lead time, delivery terms — whatever they need to decide."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="gradient"
            disabled={!text.trim() || loading !== null}
            onClick={() => send("QUOTED")}
          >
            {loading === "QUOTED" && <Loader2 className="h-4 w-4 animate-spin" />}
            Send quote
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setQuoting(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
      <Button size="sm" variant="gradient" onClick={() => setQuoting(true)}>
        Quote this
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground"
        disabled={loading !== null}
        onClick={() => send("DECLINED")}
      >
        {loading === "DECLINED" && <Loader2 className="h-4 w-4 animate-spin" />}
        Can&apos;t supply this
      </Button>
    </div>
  );
}
