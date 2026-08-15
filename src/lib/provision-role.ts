import type { Prisma, RoleApplication, UserRole } from "@prisma/client";
import { slugify } from "@/lib/utils";

/**
 * Create the profile a granted role needs in order to be usable.
 *
 * Approving an application used to set `user.role` and stop there, which meant
 * the console the approval unlocked had nothing behind it: a brand-new dealer
 * landed on a dealer overview with no `Dealer` row to read, and no way to make
 * one. The role and the thing the role operates are the same decision, so they
 * are made together, inside the approval's transaction.
 *
 * Idempotent by design. A role can be granted more than once over an account's
 * life — approved, changed, approved again — and the second grant must not fail
 * on the unique `userId`, nor overwrite a profile the user has since filled in.
 */

/** Slugs are unique; a collision gets a short suffix rather than an error. */
async function uniqueSlug(
  tx: Prisma.TransactionClient,
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "business";
  if (!(await exists(root))) return root;
  for (let i = 2; i < 12; i += 1) {
    const candidate = `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  // Twelve businesses of the same name is not a naming problem any more.
  return `${root}-${Date.now().toString(36)}`;
}

export interface ProvisionResult {
  /** Which profile was created, or null when the role needs none. */
  created:
    | "dealer"
    | "partsStore"
    | "serviceProvider"
    | "supplier"
    | "importer"
    | "clearingAgent"
    | null;
  /** True when a profile already existed and was left untouched. */
  alreadyExisted: boolean;
}

/**
 * The details an applicant gave us, used to seed the profile so a new dealer
 * does not start by re-typing what they just submitted.
 */
type ApplicationDetails = Pick<
  RoleApplication,
  "businessName" | "phone" | "city" | "region" | "message"
>;

export async function provisionRoleProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  role: UserRole,
  details: ApplicationDetails,
): Promise<ProvisionResult> {
  const name = details.businessName?.trim() || "My business";
  const common = {
    userId,
    description: details.message?.trim() || null,
    phone: details.phone || null,
    city: details.city || null,
    region: details.region || null,
  };

  switch (role) {
    case "DEALER": {
      if (await tx.dealer.findUnique({ where: { userId }, select: { id: true } })) {
        return { created: null, alreadyExisted: true };
      }
      const slug = await uniqueSlug(tx, name, async (s) =>
        Boolean(await tx.dealer.findUnique({ where: { slug: s }, select: { id: true } })),
      );
      await tx.dealer.create({ data: { ...common, businessName: name, slug } });
      return { created: "dealer", alreadyExisted: false };
    }

    case "PARTS_SELLER": {
      if (await tx.partsStore.findUnique({ where: { userId }, select: { id: true } })) {
        return { created: null, alreadyExisted: true };
      }
      const slug = await uniqueSlug(tx, name, async (s) =>
        Boolean(await tx.partsStore.findUnique({ where: { slug: s }, select: { id: true } })),
      );
      await tx.partsStore.create({ data: { ...common, storeName: name, slug } });
      return { created: "partsStore", alreadyExisted: false };
    }

    case "SERVICE_PROVIDER": {
      if (await tx.serviceProvider.findUnique({ where: { userId }, select: { id: true } })) {
        return { created: null, alreadyExisted: true };
      }
      const slug = await uniqueSlug(tx, name, async (s) =>
        Boolean(await tx.serviceProvider.findUnique({ where: { slug: s }, select: { id: true } })),
      );
      await tx.serviceProvider.create({
        // The applicant did not pick a service type. MECHANIC is the most
        // common and the enum has no "unspecified"; they change it when they
        // edit the profile, which the console prompts them to do.
        data: { ...common, businessName: name, slug, serviceType: "MECHANIC", services: [] },
      });
      return { created: "serviceProvider", alreadyExisted: false };
    }

    case "SUPPLIER": {
      if (await tx.supplier.findUnique({ where: { userId }, select: { id: true } })) {
        return { created: null, alreadyExisted: true };
      }
      const slug = await uniqueSlug(tx, name, async (s) =>
        Boolean(await tx.supplier.findUnique({ where: { slug: s }, select: { id: true } })),
      );
      await tx.supplier.create({
        data: { ...common, businessName: name, slug, categories: [], servesRegions: [] },
      });
      return { created: "supplier", alreadyExisted: false };
    }

    case "IMPORTER": {
      // This branch used to fall through to `default`, on the reasoning that
      // an importer "works through ImportRequest, which is keyed on the user".
      // That was wrong in a way nobody saw, because the role application screen
      // promises importers three things — requests routed to them, clearing
      // tools, and landed-cost quoting — and none of them had anywhere to live.
      // An approved importer got a badge and the abilities of an ordinary user.
      // Stock is published by an Importer, so the row has to exist.
      if (await tx.importer.findUnique({ where: { userId }, select: { id: true } })) {
        return { created: null, alreadyExisted: true };
      }
      const slug = await uniqueSlug(tx, name, async (s) =>
        Boolean(await tx.importer.findUnique({ where: { slug: s }, select: { id: true } })),
      );
      await tx.importer.create({
        data: { ...common, businessName: name, slug, sourceMarkets: [] },
      });
      return { created: "importer", alreadyExisted: false };
    }

    case "CLEARING_AGENT": {
      if (await tx.clearingAgent.findUnique({ where: { userId }, select: { id: true } })) {
        return { created: null, alreadyExisted: true };
      }
      const slug = await uniqueSlug(tx, name, async (s) =>
        Boolean(await tx.clearingAgent.findUnique({ where: { slug: s }, select: { id: true } })),
      );
      await tx.clearingAgent.create({
        // Deliberately created unverified and with no licence number, even
        // though the application asked for a registration number. The licence
        // is the one fact on this profile that a buyer relies on, so it is
        // recorded by the administrator who checked it — not carried across
        // from a form the applicant filled in themselves.
        data: { ...common, businessName: name, slug, ports: [] },
      });
      return { created: "clearingAgent", alreadyExisted: false };
    }

    // USER, ADMIN and SUPER_ADMIN never reach here — the application schema
    // will not accept them.
    default:
      return { created: null, alreadyExisted: false };
  }
}
