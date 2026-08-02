"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Approve or reject one application.
 *
 * Rejection opens a note field first: the API requires a reason, because an
 * applicant who is told "no" without one has nothing to act on and will simply
 * re-apply identically.
 */
export function RoleApplicationActions({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // The Reject button unmounts when the note opens, so focus would otherwise
  // fall back to <body> and strand a keyboard user at the top of the queue.
  useEffect(() => {
    if (rejecting) noteRef.current?.focus();
  }, [rejecting]);

  async function submit(action: "APPROVE" | "REJECT") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/role-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote: note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not record the decision");
        return;
      }
      toast.success(action === "APPROVE" ? `Granted ${role}` : "Application rejected");
      setRejecting(false);
      setNote("");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (rejecting) {
    return (
      <div className="w-full space-y-2 sm:w-80">
        <Textarea
          ref={noteRef}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why is this being rejected? The applicant sees this."
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={!note.trim() || loading !== null}
            onClick={() => submit("REJECT")}
          >
            {loading === "REJECT" && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm rejection
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button size="sm" variant="gradient" disabled={loading !== null} onClick={() => submit("APPROVE")}>
        {loading === "APPROVE" && <Loader2 className="h-4 w-4 animate-spin" />}
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => setRejecting(true)}
      >
        Reject
      </Button>
    </div>
  );
}
