import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { savedSearchSchema } from "@/lib/validations";

/** GET — the current user's saved searches, newest first. */
export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ searches: [] });
  try {
    const rows = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ searches: rows });
  } catch {
    return NextResponse.json({ searches: [] });
  }
}

/** POST — save the current search. */
export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in to save searches" }, { status: 401 });

  try {
    const parsed = savedSearchSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid search" },
        { status: 400 },
      );
    }
    // Cap how many a user can keep, and avoid exact duplicates.
    const count = await prisma.savedSearch.count({ where: { userId: user.id } });
    if (count >= 50) {
      return NextResponse.json({ error: "You've reached the saved-search limit." }, { status: 409 });
    }
    const search = await prisma.savedSearch.create({
      data: { userId: user.id, name: parsed.data.name, query: parsed.data.query },
    });
    return NextResponse.json({ success: true, search }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the search" }, { status: 500 });
  }
}
