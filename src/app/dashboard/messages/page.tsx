import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getUserConversations } from "@/lib/queries";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  const conversations = user ? await getUserConversations(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-muted-foreground">
        Your conversations with buyers and sellers. Tap one to reply.
      </p>

      {conversations.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No conversations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When you message a seller or someone messages you about a listing, the thread shows up here.
          </p>
        </div>
      ) : (
        <div className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-soft">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/messages/${c.id}`}
              className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <Avatar className="h-11 w-11">
                <AvatarFallback>{getInitials(c.otherParty)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("truncate", c.unread > 0 ? "font-bold" : "font-semibold")}>
                    {c.otherParty}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(c.lastMessageAt)}
                  </span>
                </div>
                {c.context ? (
                  <p className="truncate text-xs text-brand-600">Re: {c.context.label}</p>
                ) : (
                  c.subject && <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                )}
                <p
                  className={cn(
                    "mt-0.5 truncate text-sm",
                    c.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {c.lastMessage || "No messages yet"}
                </p>
              </div>
              {c.unread > 0 && (
                <span className="mt-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                  {c.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
