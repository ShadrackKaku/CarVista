import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^(\+?233|0)[0-9]{9}$/, "Enter a valid Ghana phone number")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    role: z
      .enum(["CUSTOMER", "DEALER", "PARTS_SELLER", "SERVICE_PROVIDER"])
      .default("CUSTOMER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Duty calculator ───────────────────────────────────────────
export const dutyCalcSchema = z.object({
  cifValue: z.coerce.number().positive("Enter a valid CIF value"),
  currency: z.enum(["USD", "GHS", "EUR", "GBP"]).default("USD"),
  exchangeRate: z.coerce.number().positive().optional(),
  manufactureYear: z.coerce
    .number()
    .int()
    .min(1970)
    .max(new Date().getFullYear() + 1),
  engineSizeCc: z.coerce.number().int().positive().max(10000),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "PLUGIN_HYBRID", "LPG"]),
  bodyType: z.enum([
    "SEDAN",
    "SUV",
    "HATCHBACK",
    "COUPE",
    "CONVERTIBLE",
    "WAGON",
    "PICKUP",
    "VAN",
    "MINIVAN",
    "TRUCK",
    "BUS",
  ]),
  shippingCost: z.coerce.number().min(0).optional(),
});

// ── Contact / newsletter ──────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

// ── Import request ────────────────────────────────────────────
export const importRequestSchema = z.object({
  countryOfOrigin: z.string().min(2),
  auctionSource: z.string().optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1980),
  budget: z.coerce.number().positive().optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "PLUGIN_HYBRID", "LPG"]).optional(),
  transmission: z.enum(["AUTOMATIC", "MANUAL", "CVT", "DUAL_CLUTCH"]).optional(),
  color: z.string().optional(),
  auctionLink: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

// ── Vehicle listing (dealer) ──────────────────────────────────
export const vehicleListingSchema = z.object({
  title: z.string().min(4).max(120),
  brandId: z.string().min(1, "Select a brand"),
  modelId: z.string().optional(),
  year: z.coerce.number().int().min(1980),
  price: z.coerce.number().positive(),
  mileage: z.coerce.number().min(0),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "PLUGIN_HYBRID", "LPG"]),
  transmission: z.enum(["AUTOMATIC", "MANUAL", "CVT", "DUAL_CLUTCH"]),
  engineSize: z.coerce.number().positive().optional(),
  bodyType: z.enum([
    "SEDAN",
    "SUV",
    "HATCHBACK",
    "COUPE",
    "CONVERTIBLE",
    "WAGON",
    "PICKUP",
    "VAN",
    "MINIVAN",
    "TRUCK",
    "BUS",
  ]),
  condition: z.enum(["NEW", "FOREIGN_USED", "GHANA_USED", "SALVAGE"]),
  color: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type DutyCalcInput = z.infer<typeof dutyCalcSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ImportRequestInput = z.infer<typeof importRequestSchema>;
