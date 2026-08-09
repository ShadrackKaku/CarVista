import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import type { UserRole } from "@prisma/client";
import { isAdmin } from "@/lib/roles";
import { can, type Permission } from "@/lib/permissions";

type SessionUser = { id: string; role: UserRole; permissions?: string[] } & Record<
  string,
  unknown
>;

/**
 * Guard for admin API route handlers, gated on a named permission.
 *
 *   const { user, error } = await requirePermission("blog:write");
 *   if (error) return error;
 *
 * Every admin route names the one thing it does. That is what lets a content
 * editor exist: they hold `blog:write` and nothing else, so every other admin
 * route refuses them by default rather than by our remembering to check.
 */
export async function requirePermission(
  permission: Permission,
): Promise<{ user: SessionUser; error: null } | { user: null; error: NextResponse }> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Please sign in" }, { status: 401 }) };
  }
  if (!can(user, permission)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user: user as SessionUser, error: null };
}

/**
 * Guard for routes that require full administrative authority rather than one
 * permission — kept for anything a staff member should never reach whatever
 * they were granted.
 *
 * Note this is now the *narrow* door: `STAFF` fails it. New admin routes should
 * name a permission with `requirePermission` instead, so they can be delegated.
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
