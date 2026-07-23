import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { queryToFilters, type VehicleFilters } from "@/lib/vehicle-search";
import { sendMail, priceDropEmail, savedSearchAlertEmail } from "@/lib/email";
import { formatCurrency, absoluteUrl } from "@/lib/utils";

/**
 * Buyer alerts — price drops on saved vehicles and new matches for saved
 * searches. Run on a schedule by the /api/cron/alerts endpoint.
 */

/** Build a Prisma vehicle `where` clause from a saved search's filters. */
export function filtersToVehicleWhere(filters: VehicleFilters): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {};
  if (filters.q) where.title = { contains: filters.q, mode: "insensitive" };
  if (filters.brand) where.brand = { name: filters.brand };
  if (filters.bodyType)
    where.bodyType = filters.bodyType as Prisma.VehicleWhereInput["bodyType"];
  if (filters.fuelType)
    where.fuelType = filters.fuelType as Prisma.VehicleWhereInput["fuelType"];
  if (filters.transmission)
    where.transmission = filters.transmission as Prisma.VehicleWhereInput["transmission"];
  if (filters.condition)
    where.condition = filters.condition as Prisma.VehicleWhereInput["condition"];
  if (filters.region) where.region = filters.region;
  if (filters.minPrice || filters.maxPrice) {
    const price: Prisma.DecimalFilter = {};
    if (filters.minPrice) price.gte = new Prisma.Decimal(filters.minPrice);
    if (filters.maxPrice) price.lte = new Prisma.Decimal(filters.maxPrice);
    where.price = price;
  }
  if (filters.minYear || filters.maxYear) {
    const year: Prisma.IntFilter = {};
    if (filters.minYear) year.gte = Number(filters.minYear);
    if (filters.maxYear) year.lte = Number(filters.maxYear);
    where.year = year;
  }
  return where;
}

/**
 * Notify savers when a saved vehicle's price falls below the last price we saw.
 * Rows without a baseline are initialised (no alert); rows whose price rose have
 * their baseline advanced silently so future drops are measured from the new price.
 */
export async function runPriceDropAlerts(): Promise<{ notified: number; initialised: number }> {
  let notified = 0;
  let initialised = 0;

  const saves = await prisma.savedVehicle.findMany({
    include: {
      vehicle: { select: { slug: true, title: true, price: true, status: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  for (const s of saves) {
    if (s.vehicle.status !== "ACTIVE") continue;
    const current = Number(s.vehicle.price);

    if (s.lastPrice == null) {
      await prisma.savedVehicle.update({ where: { id: s.id }, data: { lastPrice: current } });
      initialised++;
      continue;
    }

    const previous = Number(s.lastPrice);
    if (current < previous) {
      const link = `/vehicles/${s.vehicle.slug}`;
      await prisma.notification
        .create({
          data: {
            userId: s.user.id,
            type: "SYSTEM",
            title: "Price drop on a saved vehicle",
            body: `${s.vehicle.title} is now ${formatCurrency(current)} (was ${formatCurrency(previous)}).`,
            link,
          },
        })
        .catch(() => null);
      if (s.user.email) {
        await sendMail({
          to: s.user.email,
          subject: `Price drop: ${s.vehicle.title}`,
          html: priceDropEmail(
            s.user.name ?? "there",
            s.vehicle.title,
            previous,
            current,
            absoluteUrl(link),
          ),
        }).catch(() => null);
      }
      await prisma.savedVehicle.update({ where: { id: s.id }, data: { lastPrice: current } });
      notified++;
    } else if (current > previous) {
      await prisma.savedVehicle.update({ where: { id: s.id }, data: { lastPrice: current } });
    }
  }

  return { notified, initialised };
}

/**
 * Notify users when new ACTIVE vehicles (created since the last run) match a
 * saved search. The watermark (lastNotifiedAt) is always advanced so old
 * vehicles are never re-scanned.
 */
export async function runSavedSearchAlerts(): Promise<{ notified: number }> {
  let notified = 0;
  const searches = await prisma.savedSearch.findMany({
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const now = new Date();

  for (const search of searches) {
    const { filters } = queryToFilters(new URLSearchParams(search.query));
    const since = search.lastNotifiedAt ?? search.createdAt;

    const matches = await prisma.vehicle.count({
      where: {
        ...filtersToVehicleWhere(filters),
        status: "ACTIVE",
        createdAt: { gt: since },
      },
    });

    if (matches > 0) {
      const link = `/vehicles?${search.query}`;
      await prisma.notification
        .create({
          data: {
            userId: search.user.id,
            type: "SYSTEM",
            title: `${matches} new match${matches === 1 ? "" : "es"} for “${search.name}”`,
            body: `New vehicles match your saved search “${search.name}”.`,
            link,
          },
        })
        .catch(() => null);
      if (search.user.email) {
        await sendMail({
          to: search.user.email,
          subject: `New matches for “${search.name}”`,
          html: savedSearchAlertEmail(
            search.user.name ?? "there",
            search.name,
            matches,
            absoluteUrl(link),
          ),
        }).catch(() => null);
      }
      notified++;
    }

    await prisma.savedSearch.update({ where: { id: search.id }, data: { lastNotifiedAt: now } });
  }

  return { notified };
}

export async function runBuyerAlerts() {
  const priceDrops = await runPriceDropAlerts();
  const savedSearches = await runSavedSearchAlerts();
  return { priceDrops, savedSearches };
}
