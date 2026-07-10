import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const users = [
  { name: "Kwame Mensah", email: "kwame@email.com", role: "CUSTOMER", status: "ACTIVE", joined: "Jan 2025" },
  { name: "Prime Motors Ghana", email: "sales@primemotors.gh", role: "DEALER", status: "ACTIVE", joined: "Dec 2024" },
  { name: "GenuineParts GH", email: "hello@genuineparts.gh", role: "PARTS_SELLER", status: "ACTIVE", joined: "Nov 2024" },
  { name: "AutoFix Mechanics", email: "info@autofix.gh", role: "SERVICE_PROVIDER", status: "PENDING", joined: "Jan 2025" },
  { name: "Ama Owusu", email: "ama@email.com", role: "CUSTOMER", status: "ACTIVE", joined: "Jan 2025" },
  { name: "West Coast Autos", email: "west@coast.gh", role: "DEALER", status: "SUSPENDED", joined: "Oct 2024" },
];

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

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-bold">User Management</h1>
      <p className="mt-1 text-muted-foreground">Manage all platform users, roles and status.</p>

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
                <tr key={u.email} className="hover:bg-accent/40">
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
                    <Badge variant={roleVariant[u.role]}>{u.role.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[u.status]}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">Manage</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
