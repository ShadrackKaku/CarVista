import type { ImportStage } from "@prisma/client";

/**
 * Customs clearance: the last link in the chain, and the one that pays for
 * itself twice.
 *
 * Once for the buyer, who stops having to find a broker on WhatsApp and hope
 * the licence is real. And once for the platform, because the agent enters what
 * customs *actually* charged — the single number the whole landed-cost engine
 * spends its life trying to predict, and the only place it can be observed
 * first-hand. Every car cleared here becomes evidence that sharpens the next
 * estimate.
 */

/**
 * When a clearing agent can be engaged.
 *
 * Not before the car is at the port. An agent assigned to a vehicle still at
 * sea has nothing to do and no way to know when it lands, and the assignment
 * would rot: by arrival their licence may have lapsed or their queue filled.
 */
export const AGENT_ASSIGNABLE_STAGES = [
  "ARRIVED_AT_PORT",
  "CUSTOMS_CLEARANCE",
] as const satisfies readonly ImportStage[];

export function canAssignAgent(stage: ImportStage): boolean {
  return (AGENT_ASSIGNABLE_STAGES as readonly ImportStage[]).includes(stage);
}

/** Why not, in words the person on the screen can act on. */
export function assignBlockedReason(stage: ImportStage): string | null {
  if (canAssignAgent(stage)) return null;
  if (stage === "CANCELLED") return "This import was cancelled.";
  if (stage === "READY_FOR_DELIVERY" || stage === "DELIVERED")
    return "This car has already cleared customs.";
  return "You can choose an agent once the car reaches the port.";
}

/**
 * Whether an agent may record the clearance.
 *
 * The same window as assignment. Recording a clearance for a car that has
 * already cleared would overwrite a customs entry number with a second one,
 * and there is only ever one.
 */
export function canRecordClearance(stage: ImportStage): boolean {
  return canAssignAgent(stage);
}

/**
 * Only agents a buyer should actually be offered.
 *
 * Verified, and working the port the car is sitting at. A Takoradi broker
 * cannot clear a vehicle at Tema, and offering them would waste days before
 * anybody noticed.
 */
export interface AgentLike {
  id: string;
  verified: boolean;
  ports: string[];
}

export function agentsForPort<T extends AgentLike>(agents: T[], port?: string | null): T[] {
  const eligible = agents.filter((a) => a.verified);
  if (!port) return eligible;
  const wanted = port.trim().toLowerCase();
  // An agent who has not said where they work is still offered: the field is
  // optional, and silence is not evidence they are in the wrong place.
  return eligible.filter(
    (a) => a.ports.length === 0 || a.ports.some((p) => p.trim().toLowerCase() === wanted),
  );
}

export interface DutyVariance {
  /** actual − estimated, in cedis. Positive means it cost more than we said. */
  delta: number;
  /** Same, as a share of the estimate. */
  percent: number;
  direction: "over" | "under" | "exact";
}

/**
 * What we said it would be, against what it was.
 *
 * Shown to the buyer rather than quietly discarded. A platform that publishes
 * its own misses is making a much stronger claim than one that only publishes
 * estimates, and this is the number that proves the engine is real.
 */
export function dutyVariance(estimated: number | null, actual: number | null): DutyVariance | null {
  if (estimated == null || actual == null || estimated <= 0) return null;
  const delta = actual - estimated;
  const percent = (delta / estimated) * 100;
  // Rounded to the cedi before comparison: a 40-pesewa difference on a
  // GH₵78,000 bill is not a miss anybody cares about.
  const direction = Math.round(delta) === 0 ? "exact" : delta > 0 ? "over" : "under";
  return { delta, percent, direction };
}

/** Human summary of a variance, for the line under the figures. */
export function varianceSummary(variance: DutyVariance | null): string | null {
  if (!variance) return null;
  if (variance.direction === "exact") return "Exactly as estimated.";
  const magnitude = Math.abs(variance.percent);
  const word = variance.direction === "over" ? "more" : "less";
  return `${magnitude.toFixed(1)}% ${word} than we estimated.`;
}

export interface ClearanceRecord {
  make: string;
  modelType: string;
  yearOfManufacture: number;
  chassisNumber?: string | null;
  engineSizeCc?: number | null;
  fuelType?: string | null;
  port: string;
  /** What customs actually charged, in cedis. */
  totalTax: number;
  /** What we quoted before it sailed — the calibration signal. */
  predictedTotalTax?: number | null;
  cifNcy?: number | null;
  customsEntryNumber?: string | null;
  assessedAt?: Date | null;
  submittedById?: string | null;
}

/**
 * Turn a recorded clearance into training data for the duty engine.
 *
 * Deliberately PENDING, never VERIFIED. The schema's own warning is that one
 * bad bill must not poison a cohort, and an agent typing a figure into a form
 * is exactly the unreviewed input that warning is about — a transposed digit
 * would drag every future estimate for that model. An administrator checks it
 * against the entry number before it teaches the engine anything.
 */
export function assessmentFromClearance(record: ClearanceRecord) {
  return {
    make: record.make,
    modelType: record.modelType,
    yearOfManufacture: record.yearOfManufacture,
    chassisNumber: record.chassisNumber ?? null,
    engineSizeCc: record.engineSizeCc ?? null,
    fuelType: record.fuelType ?? null,
    port: record.port,
    totalTax: record.totalTax,
    predictedTotalTax: record.predictedTotalTax ?? null,
    cifNcy: record.cifNcy ?? null,
    assessedAt: record.assessedAt ?? new Date(),
    notes: record.customsEntryNumber ? `Customs entry ${record.customsEntryNumber}` : null,
    source: "AGENT" as const,
    status: "PENDING" as const,
    submittedById: record.submittedById ?? null,
    documentUrls: [],
  };
}
