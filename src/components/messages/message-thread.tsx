"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ThreadMessage, ConversationContext } from "@/lib/queries";
import { getInitials, formatRelativeTime, cn } from "@/lib/utils";

export function MessageThread({
  conversationId,
  otherParty,
  subject,
  context,
  initialMessages,
}: {
  conversationId: string;
  otherParty: string;
  subject: string | null;
  context: ConversationContext | null;
  initialMessages: ThreadMessage[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever the thread grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  // Light polling so incoming replies appear without a manual reload.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = setInterval(tick, 12_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not send your message");
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  // Only the last of my own messages shows a read receipt.
  let lastMineIndex = -1;
  for (let i = initialMessages.length - 1; i >= 0; i--) {
    if (initialMessages[i].mine) {
      lastMineIndex = i;
      break;
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[26rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(otherParty)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{otherParty}</p>
          {context ? (
            <Link href={context.href} className="truncate text-xs text-brand-600 hover:underline">
              Re: {context.label}
            </Link>
          ) : (
            subject && <p className="truncate text-xs text-muted-foreground">{subject}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {initialMessages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello 👋
          </p>
        ) : (
          initialMessages.map((m, i) => (
            <div key={m.id} className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm",
                  m.mine
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                {m.body}
              </div>
              <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                {formatRelativeTime(m.createdAt)}
                {m.mine && i === lastMineIndex && (m.read ? " · Read" : " · Sent")}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Write a reply…"
            className="max-h-32 min-h-[2.75rem] flex-1 resize-none"
          />
          <Button
            onClick={send}
            disabled={sending || !body.trim()}
            size="icon"
            variant="gradient"
            className="h-11 w-11 shrink-0"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
