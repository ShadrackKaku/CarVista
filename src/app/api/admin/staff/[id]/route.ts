import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";
import { presetById, sanitizePermissions } from "@/lib/permissions";
import { staffPermissionsSchema } from "@/lib/validations";

/**
 * PATCH /api/admin/staff/[id] — change what a staff member may do.
 *
 * Reserved to `staff:manage`, which only the super admin holds. Granting
 * permissions is the one action that can manufacture more authority, so it
 * cannot itself be delegated.
 *
 * Revoking everything is allowed and means "remove their access": with no
 * permissions they no longer pass `canReachAdmin` and the console disappears
 * for them. That is deliberately a normal edit rather than a separate destructive
 * button — the person who no longer does the job simply stops holding it.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user: actor, error } = await requirePermission("staff:manage");
  if (error) return error;

  const body = await req.json().catch(() => ({}));

  // A preset is just a named bundle; resolve it to the permissions it stands
  // for so the stored column is always the real answer rather than a label
  // whose meaning could drift later.
  const preset = typeof body.preset === "string" ? presetById(body.preset) : undefined;
  const requested = preset ? [...preset.permissions] : body.permissions;

  const parsed = staffPermissionsSchema.safeParse({ permissions: requested ?? [] });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid permissions" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!target) return NextResponse.json({ error: "No such account" }, { status: 404 });

  if (target.id === actor.id) {
    return NextResponse.json(
      { error: "You can't change your own access." },
      { status: 400 },
    );
  }

  // An administrator's authority comes from their role, not from this column,
  // so writing permissions onto one would be a no-op that reads on the page
  // like a real restriction — the worst kind of security control.
  if (target.role !== "STAFF") {
    return NextResponse.json(
      {
        error:
          "Administrators hold full access by role. Change their role first if you want to limit them.",
      },
      { status: 409 },
    );
  }

  // Sanitised even though the schema already validated: the schema says these
  // are real permission names, this says none of them is the reserved one.
  const permissions = sanitizePermissions(parsed.data.permissions);

  try {
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { permissions },
      select: { id: true, name: true, email: true, role: true, permissions: true },
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("[admin:staff:permissions]", err);
    return NextResponse.json({ error: "Could not save their access" }, { status: 500 });
  }
}
