/**
 * Promote an existing account to SUPER_ADMIN.
 *
 *   npm run promote:super-admin -- you@example.com
 *
 * Why this exists as a script rather than a page.
 *
 * `staff:manage` — creating accounts and granting permissions — is held by
 * SUPER_ADMIN alone, so that somebody promoted to ADMIN cannot promote anybody
 * else. That is the right rule, and it has one consequence: on a database whose
 * only administrator is an ADMIN, nobody can reach Team & Access, and no page
 * inside the app can fix that, because the page that would is the one being
 * gated. The first super admin has to be made from outside.
 *
 * Deliberately not exposed over HTTP in any form. An endpoint that hands out
 * the highest role in the system is worth more to an attacker than every other
 * route combined, however it is guarded — and this is a thing that needs doing
 * roughly once in the lifetime of the platform.
 *
 * Run against production by pointing DATABASE_URL at it:
 *   DATABASE_URL="postgres://…" npm run promote:super-admin -- you@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2]?.trim().toLowerCase();

async function main() {
  if (!email) {
    console.error("Usage: npm run promote:super-admin -- <email>");
    console.error("Pass the email address of an account that already exists.");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    // Deliberately explicit rather than creating one: an account conjured by a
    // typo would hold the highest role in the system and belong to nobody.
    console.error(`No account with the email ${email}.`);
    console.error("This promotes an existing account; it does not create one.");
    process.exitCode = 1;
    return;
  }

  if (user.role === "SUPER_ADMIN") {
    console.log(`${user.email} is already a super admin. Nothing to do.`);
    return;
  }

  const previous = user.role;
  await prisma.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });

  console.log(`✅ ${user.name ?? user.email} promoted: ${previous} → SUPER_ADMIN`);
  console.log("   They can now open Team & Access and create accounts for others.");
  console.log("   Sign out and back in if they were already signed in.");
}

main()
  .catch((error) => {
    console.error("Could not promote the account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
