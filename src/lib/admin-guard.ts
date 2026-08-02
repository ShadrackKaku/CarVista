import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import type { UserRole } from "@prisma/client";
import { isAdmin } from "@/lib/roles";

type SessionUser = { id: string; role: UserRole } & Record<string, unknown>;

/**
 * Guard for admin API route handlers. Returns the current user when they hold
 * an administrative role, otherwise a ready-to-return 401/403 response.
 *
 *   const { user, error } = await requireAdmin();
 *   if (error) return error;
 */
export async function requireAdmin(): Promise<
  { user: SessionUser; error: null } | { user: null; error: NextResponse }
> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Please sign in" }, { status: 401 }) };
  }
  if (!isAdmin(user.role)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user: user as SessionUser, error: null };
}
