import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  vehicleListingSchema,
  dutyCalcSchema,
  dutyAssessmentSchema,
  assessmentReviewSchema,
  icumsCatalogSchema,
} from "./validations";

describe("registerSchema", () => {
  const valid = {
    name: "Ada Mensah",
    email: "ada@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("never lets a caller choose their own role", () => {
    // Registration used to take `role` straight from the request body, so
    // anyone could POST {role:"DEALER"} and be a dealer instantly. The schema
    // must now strip it, and the route pins USER regardless.
    for (const role of ["DEALER", "PARTS_SELLER", "SERVICE_PROVIDER", "ADMIN"]) {
      const parsed = registerSchema.safeParse({ ...valid, role });
      expect(parsed.success).toBe(true);
      expect(parsed.success && "role" in parsed.data).toBe(false);
    }
  });

  it("rejects mismatched passwords", () => {
    const parsed = registerSchema.safeParse({ ...valid, confirmPassword: "Password2" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.errors[0].path).toContain("confirmPassword");
  });

  it("enforces password strength (length, uppercase, number)", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "alllower1", confirmPassword: "alllower1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "NoNumber", confirmPassword: "NoNumber" }).success).toBe(false);
  });

  it("accepts a blank phone but rejects a malformed one", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, phone: "0244123456" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });
});

describe("loginSchema & forgotPasswordSchema", () => {
  it("requires a valid email and non-empty password to log in", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });

  it("validates the forgot-password email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("vehicleListingSchema", () => {
  const valid = {
    title: "2021 Toyota Camry SE",
    brandId: "Toyota",
    year: 2021,
    price: 285000,
    mileage: 42000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    bodyType: "SEDAN",
    condition: "FOREIGN_USED",
  };

  it("accepts a valid listing", () => {
    expect(vehicleListingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a pre-1980 year, a missing brand and an invalid enum", () => {
    expect(vehicleListingSchema.safeParse({ ...valid, year: 1975 }).success).toBe(false);
    expect(vehicleListingSchema.safeParse({ ...valid, brandId: "" }).success).toBe(false);
    expect(vehicleListingSchema.safeParse({ ...valid, fuelType: "STEAM" }).success).toBe(false);
  });

  it("rejects a non-URL image", () => {
    expect(vehicleListingSchema.safeParse({ ...valid, images: ["not-a-url"] }).success).toBe(false);
    expect(vehicleListingSchema.safeParse({ ...valid, images: ["https://x.com/a.jpg"] }).success).toBe(true);
  });
});

describe("dutyCalcSchema", () => {
  const valid = {
    cifValue: 12000,
    manufactureYear: 2020,
    engineSizeCc: 1800,
    fuelType: "PETROL",
    bodyType: "SEDAN",
  };

  it("accepts valid input and coerces numeric strings, defaulting currency to USD", () => {
    const parsed = dutyCalcSchema.safeParse({ ...valid, cifValue: "12000", engineSizeCc: "1800" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cifValue).toBe(12000);
      expect(parsed.data.currency).toBe("USD");
    }
  });

  it("rejects a non-positive CIF and an out-of-range year", () => {
    expect(dutyCalcSchema.safeParse({ ...valid, cifValue: 0 }).success).toBe(false);
    expect(dutyCalcSchema.safeParse({ ...valid, manufactureYear: 1969 }).success).toBe(false);
  });
});

describe("dutyAssessmentSchema", () => {
  const valid = {
    chassisNumber: "jtdbr32e720123456",
    make: "Toyota",
    modelType: "Corolla",
    yearOfManufacture: 2016,
    totalTax: "48500",
  };

  it("accepts a minimal submission, coerces numbers and uppercases the chassis", () => {
    const parsed = dutyAssessmentSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.chassisNumber).toBe("JTDBR32E720123456");
      expect(parsed.data.totalTax).toBe(48500);
    }
  });

  it("accepts the full ICUMS field set", () => {
    const parsed = dutyAssessmentSchema.safeParse({
      ...valid,
      trimLevel: "LE",
      vehicleType: "Saloon",
      engineSizeCc: "1800",
      originCode: "US",
      fuelType: "Petrol",
      hsCode: "8703.23",
      hdv: "9200",
      cifNcy: "165000",
      assessedAt: "2026-05-10",
      port: "Tema",
      documentUrls: ["https://res.cloudinary.com/x/taxbill.jpg"],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.engineSizeCc).toBe(1800);
  });

  it("rejects missing total tax and short chassis numbers", () => {
    expect(dutyAssessmentSchema.safeParse({ ...valid, totalTax: 0 }).success).toBe(false);
    expect(dutyAssessmentSchema.safeParse({ ...valid, chassisNumber: "AB12" }).success).toBe(false);
  });

  it("rejects future and pre-ICUMS assessment dates", () => {
    expect(dutyAssessmentSchema.safeParse({ ...valid, assessedAt: "2030-01-01" }).success).toBe(
      false,
    );
    expect(dutyAssessmentSchema.safeParse({ ...valid, assessedAt: "2019-06-01" }).success).toBe(
      false,
    );
  });
});

describe("assessmentReviewSchema", () => {
  it("accepts verify and reject actions", () => {
    expect(assessmentReviewSchema.safeParse({ action: "VERIFY" }).success).toBe(true);
    expect(
      assessmentReviewSchema.safeParse({ action: "REJECT", rejectionReason: "Blurry photo" })
        .success,
    ).toBe(true);
    expect(assessmentReviewSchema.safeParse({ action: "DELETE" }).success).toBe(false);
  });
});

describe("icumsCatalogSchema", () => {
  it("accepts makes and models with 5-digit codes", () => {
    const parsed = icumsCatalogSchema.safeParse({
      makes: [{ code: "00042", name: "Toyota" }],
      models: [{ code: "00856", name: "Camry", makeCode: "00042" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-5-digit codes and empty payloads", () => {
    expect(
      icumsCatalogSchema.safeParse({ makes: [{ code: "42", name: "Toyota" }] }).success,
    ).toBe(false);
    expect(icumsCatalogSchema.safeParse({}).success).toBe(false);
  });
});
