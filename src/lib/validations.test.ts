import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  vehicleListingSchema,
  dutyCalcSchema,
} from "./validations";

describe("registerSchema", () => {
  const valid = {
    name: "Ada Mensah",
    email: "ada@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts a valid registration and defaults the role to CUSTOMER", () => {
    const parsed = registerSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.role).toBe("CUSTOMER");
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
