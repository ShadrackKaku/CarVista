import { prisma } from "@/lib/prisma";
import type { VehicleEventType } from "@prisma/client";

/**
 * Vehicle Passport write helpers — the append-only trust timeline.
 *
 * A passport is created lazily the first time a vehicle needs an event, so any
 * flow (import, admin approval, a seller logging service) can simply call
 * `addVehicleEvent` without worrying about whether the passport exists yet.
 */

/** Ensure a vehicle has a passport; returns its id (or null if the vehicle is gone). */
export async function ensurePassportForVehicle(vehicleId: string): Promise<string | null> {
  try {
    const existing = await prisma.vehiclePassport.findUnique({
      where: { vehicleId },
      select: { id: true },
    });
    if (existing) return existing.id;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        vin: true,
        year: true,
        brand: { select: { name: true } },
        model: { select: { name: true } },
      },
    });
    if (!vehicle) return null;

    // Use the real VIN when present; otherwise synthesise a stable, unique one
    // from the vehicle id so the passport always has an identity.
    const vin = vehicle.vin || `CV-${vehicleId.slice(0, 12).toUpperCase()}`;

    const passport = await prisma.vehiclePassport.create({
      data: {
        vin,
        vehicleId,
        make: vehicle.brand?.name ?? null,
        model: vehicle.model?.name ?? null,
        year: vehicle.year ?? null,
      },
      select: { id: true },
    });
    return passport.id;
  } catch (e) {
    console.error("[passport:ensure]", e);
    return null;
  }
}

/** Append an event to a vehicle's passport. Never throws — returns success. */
export async function addVehicleEvent(input: {
  vehicleId: string;
  type: VehicleEventType;
  title: string;
  notes?: string | null;
  occurredAt?: Date;
  verified?: boolean;
  source?: string;
  recordedById?: string | null;
}): Promise<boolean> {
  try {
    const passportId = await ensurePassportForVehicle(input.vehicleId);
    if (!passportId) return false;

    await prisma.vehicleEvent.create({
      data: {
        passportId,
        type: input.type,
        title: input.title,
        notes: input.notes ?? null,
        occurredAt: input.occurredAt ?? new Date(),
        verified: input.verified ?? false,
        source: input.source ?? null,
        recordedById: input.recordedById ?? null,
      },
    });
    // Touch the passport so its updatedAt reflects the latest event.
    await prisma.vehiclePassport.update({
      where: { id: passportId },
      data: { updatedAt: new Date() },
    });
    return true;
  } catch (e) {
    console.error("[passport:addEvent]", e);
    return false;
  }
}
