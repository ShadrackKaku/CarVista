import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getUserMessages } from "@/lib/queries";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  const messages = user ? await getUserMessages(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-muted-foreground">Enquiries from buyers and other members.</p>

      {messages.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When someone messages you about a listing, it'll show up here.
          </p>
        </div>
      ) : (
        <div className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-soft">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-4 p-4">
              <Avatar className="h-11 w-11">
                <AvatarFallback>{getInitials(m.sender)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{m.sender}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(m.date)}
                  </span>
                </div>
                {m.subject && <p className="text-sm font-medium">{m.subject}</p>}
                <p className="mt-0.5 text-sm text-muted-foreground">{m.body}</p>
              </div>
              {!m.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
