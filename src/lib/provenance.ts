/**
 * What a car can prove about where it came from.
 *
 * The passport timeline below this is a log — good, but it reads the same
 * whether a vehicle carries five verified customs events or none at all. This
 * is the headline: the handful of facts a buyer standing in front of a foreign
 * used car actually wants, stated plainly and only when they are real.
 *
 * Everything here is a by-product of owning the whole chain. The auction grade
 * comes from the importer who bought it, the clearance from the licensed broker
 * who paid the duty, the entry number from ICUMS. No listing site that only
 * hosts adverts can assemble this, because none of it is something a seller
 * types in — which is exactly why it is worth showing.
 */

export interface ProvenanceInput {
  countryOfOrigin?: string | null;
  auctionSource?: string | null;
  auctionGrade?: string | null;
  chassisNumber?: string | null;
  clearedAt?: Date | null;
  actualDutyGhs?: number | null;
  customsEntryNumber?: string | null;
  agentName?: string | null;
  agentLicenceNumber?: string | null;
  purchasedAt?: Date | null;
  arrivedAt?: Date | null;
}

export interface Provenance {
  origin: string | null;
  auctionSource: string | null;
  auctionGrade: string | null;
  chassisNumber: string | null;
  purchasedAt: Date | null;
  arrivedAt: Date | null;
  clearedAt: Date | null;
  dutyPaid: number | null;
  entryNumber: string | null;
  agentName: string | null;
  agentLicensed: boolean;
  /** True once customs is behind it and the entry number is on file. */
  customsVerified: boolean;
  /** How much of the journey we can actually evidence, 0–4. */
  strength: number;
}

/**
 * Assemble it, or return null.
 *
 * Null rather than a shell of empty rows: a provenance panel showing four
 * blanks is worse than no panel, because it advertises that we know nothing
 * about this car while claiming to be the site that knows. An ordinary
 * privately-listed Corolla should simply not have one.
 */
export function buildProvenance(input: ProvenanceInput | null | undefined): Provenance | null {
  if (!input) return null;

  const dutyPaid =
    typeof input.actualDutyGhs === "number" && input.actualDutyGhs > 0
      ? input.actualDutyGhs
      : null;
  const customsVerified = Boolean(input.clearedAt && input.customsEntryNumber);

  const provenance: Provenance = {
    origin: input.countryOfOrigin?.trim() || null,
    auctionSource: input.auctionSource?.trim() || null,
    auctionGrade: input.auctionGrade?.trim() || null,
    chassisNumber: input.chassisNumber?.trim() || null,
    purchasedAt: input.purchasedAt ?? null,
    arrivedAt: input.arrivedAt ?? null,
    clearedAt: input.clearedAt ?? null,
    dutyPaid,
    entryNumber: input.customsEntryNumber?.trim() || null,
    agentName: input.agentName?.trim() || null,
    agentLicensed: Boolean(input.agentLicenceNumber?.trim()),
    customsVerified,
    strength: 0,
  };

  // One point per link of the chain we can actually evidence. Origin alone is
  // a claim anybody could make, so it does not count on its own.
  provenance.strength =
    (provenance.auctionSource || provenance.auctionGrade ? 1 : 0) +
    (provenance.purchasedAt || provenance.arrivedAt ? 1 : 0) +
    (customsVerified ? 1 : 0) +
    (provenance.agentName ? 1 : 0);

  return provenance.strength > 0 ? provenance : null;
}

/**
 * The one line that goes at the top.
 *
 * Written as a sentence rather than a field list because this is the sentence
 * a dealer will repeat to a customer standing beside the car, and it should
 * survive being said out loud.
 */
export function provenanceHeadline(p: Provenance): string {
  if (p.customsVerified && p.origin) {
    return `Imported from ${p.origin} and cleared through customs on this platform.`;
  }
  if (p.customsVerified) return "Cleared through customs on this platform.";
  if (p.origin) return `Imported from ${p.origin} and tracked on this platform.`;
  return "Tracked on this platform from purchase to arrival.";
}
