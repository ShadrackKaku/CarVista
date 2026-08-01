"use client";

import { AdminActionButton } from "@/components/admin/admin-action-button";

/**
 * Status controls for a user row. Suspended users can be reactivated; active or
 * pending users can be suspended.
 */
export function UserStatusActions({ userId, status }: { userId: string; status: string }) {
  const endpoint = `/api/admin/users/${userId}`;

  if (status === "SUSPENDED") {
    return (
      <AdminActionButton
        endpoint={endpoint}
        body={{ status: "ACTIVE" }}
        variant="success"
        successMessage="User reactivated"
      >
        Reactivate
      </AdminActionButton>
    );
  }

  return (
    <div className="flex justify-end gap-1">
      {status === "PENDING" && (
        <AdminActionButton
          endpoint={endpoint}
          body={{ status: "ACTIVE" }}
          variant="success"
          successMessage="User approved"
        >
          Approve
        </AdminActionButton>
      )}
      {/* Quiet until you reach for it. A solid red button on every row of a
          long table reads as an alarm, not as an available action — the intent
          is carried by the hover state and the confirm prompt instead. */}
      <AdminActionButton
        endpoint={endpoint}
        body={{ status: "SUSPENDED" }}
        variant="ghost"
        className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
        confirmMessage="Suspend this user? They won't be able to sign in."
        successMessage="User suspended"
      >
        Suspend
      </AdminActionButton>
    </div>
  );
}
