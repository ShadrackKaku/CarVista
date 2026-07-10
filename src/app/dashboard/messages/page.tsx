import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

const conversations = [
  {
    id: "1",
    name: "Prime Motors Ghana",
    preview: "Yes, the Camry is still available. When would you like to inspect it?",
    time: new Date(Date.now() - 1000 * 60 * 30),
    unread: true,
  },
  {
    id: "2",
    name: "GenuineParts GH",
    preview: "Your brake pads have been dispatched. Tracking: GP-2291.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5),
    unread: true,
  },
  {
    id: "3",
    name: "CarVista Import Team",
    preview: "Your Highlander has departed the port of Baltimore.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unread: false,
  },
];

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-muted-foreground">Your conversations with sellers and dealers.</p>

      <div className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-soft">
        {conversations.map((c) => (
          <button
            key={c.id}
            className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-accent"
          >
            <Avatar className="h-11 w-11">
              <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{c.name}</p>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(c.time)}</span>
              </div>
              <p className="truncate text-sm text-muted-foreground">{c.preview}</p>
            </div>
            {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <MessageSquare className="h-6 w-6" />
        <p className="mt-2">Select a conversation to view the full thread.</p>
      </div>
    </div>
  );
}
