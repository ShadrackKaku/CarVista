import { describe, it, expect } from "vitest";
import {
  dealerVerificationSchema,
  verificationReviewSchema,
  inspectionReportSchema,
} from "@/lib/validations";

const validKyc = {
  businessRegNumber: "BN-12345",
  contactName: "Ama Owusu",
  contactPhone: "0244123456",
  idType: "Ghana Card",
  idNumber: "GHA-000111222",
};

describe("dealerVerificationSchema", () => {
  it("accepts a complete submission", () => {
    expect(dealerVerificationSchema.safeParse(validKyc).success).toBe(true);
  });

  it("allows an empty-string document link (optional)", () => {
    expect(dealerVerificationSchema.safeParse({ ...validKyc, documentUrl: "" }).success).toBe(true);
  });

  it("rejects a malformed document link", () => {
    expect(dealerVerificationSchema.safeParse({ ...validKyc, documentUrl: "not-a-url" }).success).toBe(
      false,
    );
  });

  it("requires the core identity fields", () => {
    expect(dealerVerificationSchema.safeParse({ businessRegNumber: "BN-1" }).success).toBe(false);
  });
});

describe("verificationReviewSchema", () => {
  it("accepts approve/reject only", () => {
    expect(verificationReviewSchema.safeParse({ action: "approve" }).success).toBe(true);
    expect(verificationReviewSchema.safeParse({ action: "reject", reviewNote: "Blurry ID" }).success).toBe(
      true,
    );
    expect(verificationReviewSchema.safeParse({ action: "maybe" }).success).toBe(false);
  });
});

describe("inspectionReportSchema", () => {
  it("requires a grade and a summary", () => {
    expect(
      inspectionReportSchema.safeParse({ overallGrade: "A", reportSummary: "Clean, no accidents." })
        .success,
    ).toBe(true);
    expect(inspectionReportSchema.safeParse({ overallGrade: "A" }).success).toBe(false);
  });
});
