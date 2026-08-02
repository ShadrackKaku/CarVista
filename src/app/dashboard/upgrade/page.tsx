import { redirect } from "next/navigation";
import { Clock, ShieldCheck, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { RoleApplicationForm } from "@/components/account/role-application-form";
import { roleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Applying for a specialised role.
 *
 * Registration deliberately offers no account-type picker (anyone could have
 * self-assigned DEALER by posting one), so this is where that choice moved —
 * behind a sign-in, and subject to review.
 */
export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/upgrade");

  const applications = await prisma.roleApplication
    .findMany({ where: { userId: user.id }, orderBy: { submittedAt: "desc" } })
    .catch(() => []);

  const pending = applications.find((a) => a.status === "PENDING");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" />
        <p className="text-sm text-muted-foreground">
          Your account is <span className="font-semibold text-foreground">{roleLabel(user.role)}</span>.
          Specialised roles are granted after review — they are never assigned at sign-up.
        </p>
      </div>

      {pending ? (
        <div className="rounded-2xl border border-warning/40 bg-warning/5 p-6">
          <p className="flex items-center gap-2 font-semibold">
            <Clock className="h-4 w-4 text-warning" />
            Your {roleLabel(pending.requestedRole)} application is under review
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Submitted {formatDate(pending.submittedAt)}. We&apos;ll email you as soon as an
            administrator has looked at it. You can hold one application at a time.
          </p>
        </div>
      ) : (
        <RoleApplicationForm currentRole={user.role} />
      )}

      {applications.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Your applications</h2>
          <div className="mt-4 space-y-3">
            {applications.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{roleLabel(a.requestedRole)}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted {formatDate(a.submittedAt)}
                    {a.reviewedAt ? ` · reviewed ${formatDate(a.reviewedAt)}` : ""}
                  </p>
                  {a.reviewNote && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      {a.status === "REJECTED" && (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      )}
                      {a.reviewNote}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    a.status === "APPROVED"
                      ? "success"
                      : a.status === "REJECTED"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
