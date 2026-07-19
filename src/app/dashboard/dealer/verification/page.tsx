import { redirect } from "next/navigation";
import { BadgeCheck, Clock, ShieldCheck, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDealerVerification } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { VerificationForm } from "@/components/dealer/verification-form";

export const dynamic = "force-dynamic";

export default async function DealerVerificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/dealer/verification");

  const v = await getDealerVerification(user.id);

  if (!v.isDealer) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold">Verification</h1>
        <p className="mt-2 text-muted-foreground">
          Only dealer accounts can apply for verification. Set up your dealer profile first.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-brand-600" />
        <h1 className="font-display text-2xl font-bold">Get verified</h1>
      </div>
      <p className="text-muted-foreground">
        Verified dealers earn a trust badge and rank higher in search. Submit your business details
        for review — it usually takes a day or two.
      </p>

      {/* Current status */}
      {v.verified ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
          <BadgeCheck className="h-5 w-5 text-success" />
          <span className="font-medium">You&apos;re a verified dealer.</span>
        </div>
      ) : v.status === "PENDING" ? (
        <div className="flex items-center gap-2 rounded-xl border p-4 text-sm">
          <Clock className="h-5 w-5 text-brand-600" />
          <span>Your submission is under review.</span>
          <Badge variant="warning" className="ml-auto">
            Pending
          </Badge>
        </div>
      ) : v.status === "REJECTED" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="font-medium">Not approved yet.</span>
          </div>
          {v.reviewNote && <p className="mt-2 text-muted-foreground">{v.reviewNote}</p>}
          <p className="mt-2 text-muted-foreground">Update your details below and resubmit.</p>
        </div>
      ) : null}

      {!v.verified && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold">
            {v.status ? "Update your submission" : "Business details"}
          </h2>
          <VerificationForm initial={v.fields} />
        </div>
      )}
    </div>
  );
}
