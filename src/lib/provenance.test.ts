import { describe, it, expect } from "vitest";
import { buildProvenance, provenanceHeadline } from "./provenance";

const full = {
  countryOfOrigin: "Japan",
  auctionSource: "USS Nagoya",
  auctionGrade: "4.5",
  chassisNumber: "ZSU60-0123456",
  clearedAt: new Date("2026-07-02"),
  actualDutyGhs: 82_000,
  customsEntryNumber: "TEMA-2026-114857",
  agentName: "Owusu Clearing & Forwarding",
  agentLicenceNumber: "GRA-CB-2024-0881",
  purchasedAt: new Date("2026-06-03"),
  arrivedAt: new Date("2026-07-01"),
};

describe("when a car gets a provenance panel at all", () => {
  it("gets one when the platform imported it", () => {
    expect(buildProvenance(full)).not.toBeNull();
  });

  it("gets none when there is nothing to show", () => {
    // A panel of four blanks is worse than no panel: it advertises that we
    // know nothing about this car while claiming to be the site that knows.
    expect(buildProvenance(null)).toBeNull();
    expect(buildProvenance({})).toBeNull();
  });

  it("gets none from an origin claim alone", () => {
    // "Imported from Japan" is a sentence any seller can type. On its own it
    // is not evidence, so it does not earn the panel.
    expect(buildProvenance({ countryOfOrigin: "Japan" })).toBeNull();
  });

  it("gets one from an auction record alone", () => {
    const p = buildProvenance({ auctionSource: "USS Nagoya", auctionGrade: "4.5" });
    expect(p).not.toBeNull();
    expect(p!.strength).toBe(1);
  });
});

describe("how much of the journey is evidenced", () => {
  it("scores the full chain highest", () => {
    expect(buildProvenance(full)!.strength).toBe(4);
  });

  it("does not count customs until the entry number is on file", () => {
    // A cleared date with no entry number is an assertion. The number is what
    // makes it checkable against ICUMS, which is the whole point.
    const noEntry = buildProvenance({ ...full, customsEntryNumber: null })!;
    expect(noEntry.customsVerified).toBe(false);
    expect(noEntry.strength).toBe(3);
  });

  it("does not count customs from an entry number with no clearance date", () => {
    expect(buildProvenance({ ...full, clearedAt: null })!.customsVerified).toBe(false);
  });
});

describe("the facts it carries", () => {
  it("marks the broker licensed only when a licence is recorded", () => {
    expect(buildProvenance(full)!.agentLicensed).toBe(true);
    expect(buildProvenance({ ...full, agentLicenceNumber: null })!.agentLicensed).toBe(false);
    expect(buildProvenance({ ...full, agentLicenceNumber: "  " })!.agentLicensed).toBe(false);
  });

  it("ignores a zero or missing duty rather than printing GH¢0", () => {
    expect(buildProvenance({ ...full, actualDutyGhs: 0 })!.dutyPaid).toBeNull();
    expect(buildProvenance({ ...full, actualDutyGhs: null })!.dutyPaid).toBeNull();
    expect(buildProvenance(full)!.dutyPaid).toBe(82_000);
  });

  it("trims blank strings down to null instead of rendering empty rows", () => {
    const p = buildProvenance({ ...full, auctionGrade: "   ", chassisNumber: "" })!;
    expect(p.auctionGrade).toBeNull();
    expect(p.chassisNumber).toBeNull();
  });
});

describe("the sentence a dealer will say out loud", () => {
  it("claims customs only when customs is proven", () => {
    expect(provenanceHeadline(buildProvenance(full)!)).toBe(
      "Imported from Japan and cleared through customs on this platform.",
    );
  });

  it("falls back to tracking when the car has not cleared", () => {
    const p = buildProvenance({ ...full, clearedAt: null, customsEntryNumber: null })!;
    expect(provenanceHeadline(p)).toBe("Imported from Japan and tracked on this platform.");
    expect(provenanceHeadline(p)).not.toMatch(/cleared/);
  });

  it("still says something useful with no origin recorded", () => {
    const p = buildProvenance({ ...full, countryOfOrigin: null })!;
    expect(provenanceHeadline(p)).toBe("Cleared through customs on this platform.");
  });
});
