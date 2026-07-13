import { Users } from "lucide-react";
import { getAllUsers } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import { getInitials, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const roleVariant: Record<string, "brand" | "muted" | "secondary"> = {
  ADMIN: "brand",
  DEALER: "secondary",
  PARTS_SELLER: "secondary",
  SERVICE_PROVIDER: "secondary",
  CUSTOMER: "muted",
};
const statusVariant: Record<string, "success" | "warning" | "destructive"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "destructive",
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-bold">User Management</h1>
      <p className="mt-1 text-muted-foreground">Manage all platform users, roles and status.</p>

      {users.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No users yet</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant[u.role] ?? "muted"}>{u.role.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[u.status] ?? "muted"}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.joined)}</td>
                    <td className="px-4 py-3 text-right">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <UserStatusActions userId={u.id} status={u.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
