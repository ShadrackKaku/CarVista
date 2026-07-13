import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getConversation } from "@/lib/queries";
import { MessageThread } from "@/components/messages/message-thread";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/dashboard/messages/${params.id}`);

  const convo = await getConversation(params.id, user.id);
  if (!convo) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/messages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All messages
      </Link>
      <MessageThread
        conversationId={convo.id}
        otherParty={convo.otherParty}
        subject={convo.subject}
        context={convo.context}
        initialMessages={convo.messages}
      />
    </div>
  );
}
