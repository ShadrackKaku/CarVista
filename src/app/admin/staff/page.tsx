import { AlertTriangle, ShieldCheck } from "lucide-react";
import { guardPage } from "@/lib/page-guard";
import { getStaff } from "@/lib/queries";
import { CreateAccountForm } from "@/components/admin/create-account-form";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { StaffAccessEditor } from "@/components/admin/staff-access-editor";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Administrator",
  STAFF: "Staff",
};

export default async function AdminStaffPage() {
  await guardPage("staff:manage");
  const staff = await getStaff();

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <CreateAccountForm />
      </div>

      <aside className="space-y-3">
        <h2 className="font-semibold">Who has access</h2>
        {staff.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name ?? s.email}</p>
                <p className="truncate text-xs text-muted-foreground">{s.email}</p>
              </div>
              <Badge variant={s.role === "STAFF" ? "secondary" : "brand"}>
                {ROLE_LABEL[s.role] ?? s.role}
              </Badge>
            </div>

            {s.role === "STAFF" ? (
              <>
                {s.permissions.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {s.permissions.map((p) => (
                      <li key={p}>{PERMISSIONS[p as Permission] ?? p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No access to the console.
                  </p>
                )}
                <StaffAccessEditor
                  staffId={s.id}
                  name={s.name ?? s.email}
                  current={s.permissions}
                />
              </>
            ) : (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Full access to the console
                {s.role === "SUPER_ADMIN" && ", including creating accounts"}.
              </p>
            )}

            {/* The state worth noticing: an invite that was never accepted looks
                exactly like one being ignored, and both need a nudge. */}
            {/* `text-warning-foreground` is white, meant for a solid warning
                fill; on a 10% tint it is invisible. The tint carries the signal
                and the text uses the normal foreground, which flips with the
                theme. */}
            {s.activatedAt == null && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs text-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>
                  Invited{s.invitedByName ? ` by ${s.invitedByName}` : ""} — hasn&apos;t set a
                  password yet.
                </span>
              </p>
            )}
          </div>
        ))}
      </aside>
    </div>
  );
}
