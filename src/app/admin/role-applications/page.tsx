import { UserCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { RoleApplicationActions } from "@/components/admin/role-application-actions";
import { roleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** The approval queue: pending first, then everything already decided. */
export default async function AdminRoleApplicationsPage() {
  const applications = await prisma.roleApplication
    .findMany({
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      take: 200,
      include: {
        user: { select: { name: true, email: true, role: true } },
        reviewer: { select: { name: true } },
      },
    })
    .catch(() => []);

  const pending = applications.filter((a) => a.status === "PENDING");
  const decided = applications.filter((a) => a.status !== "PENDING");

  if (applications.length === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center rounded-2xl border border-dashed p-12 text-center">
        <UserCheck className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No applications yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests to become a dealer, seller, service provider, supplier or importer land here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section>
        <h2 className="text-lg font-semibold">
          Awaiting review{pending.length > 0 && ` (${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing waiting. Good.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {a.user.name ?? a.user.email}{" "}
                      <span className="font-normal text-muted-foreground">
                        wants to be a {roleLabel(a.requestedRole)}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.user.email} · currently {roleLabel(a.user.role)} · applied{" "}
                      {formatDate(a.submittedAt)}
                    </p>
                  </div>
                  <RoleApplicationActions id={a.id} role={roleLabel(a.requestedRole)} />
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-2 border-t pt-4 text-sm sm:grid-cols-2">
                  {[
                    ["Business", a.businessName],
                    ["Registration no.", a.businessRegNumber],
                    ["Phone", a.phone],
                    ["Location", [a.city, a.region].filter(Boolean).join(", ")],
                  ]
                    .filter(([, v]) => v)
                    .map(([label, value]) => (
                      <div key={label as string} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-right font-medium">{value}</dd>
                      </div>
                    ))}
                </dl>
                {a.message && (
                  <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    {a.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Decided</h2>
          <div className="mt-4 space-y-2">
            {decided.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {a.user.name ?? a.user.email} → {roleLabel(a.requestedRole)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.reviewedAt ? formatDate(a.reviewedAt) : ""}
                    {a.reviewer?.name ? ` by ${a.reviewer.name}` : ""}
                    {a.reviewNote ? ` — ${a.reviewNote}` : ""}
                  </p>
                </div>
                <Badge variant={a.status === "APPROVED" ? "success" : "muted"}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
