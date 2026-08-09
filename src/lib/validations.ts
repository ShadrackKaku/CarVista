import { z } from "zod";
import { APPLICABLE_ROLES, ROLE_PROFILES } from "@/lib/roles";
import { SUPPLIER_CATEGORIES } from "@/lib/suppliers";
import { FOB_CURRENCIES, SOURCE_MARKETS } from "@/lib/import-stock";

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
    // Deliberately no `role`. Registration creates a plain account and
    // nothing else; specialised capabilities are applied for and granted by
    // an admin. Accepting a role here let anyone self-assign DEALER or
    // PARTS_SELLER simply by posting one.
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Applying for a specialised role.
 *
 * `requestedRole` is checked against APPLICABLE_ROLES rather than against the
 * whole enum, so ADMIN and SUPER_ADMIN are unreachable through this path no
 * matter what is posted. `status` is absent on purpose: only a reviewer sets it.
 *
 * The per-role required fields live in ROLE_PROFILES; `refine` reads them from
 * there so the form and the API cannot disagree about what is mandatory.
 */
export const roleApplicationSchema = z
  .object({
    requestedRole: z.enum(APPLICABLE_ROLES),
    businessName: z.string().trim().max(120).optional().or(z.literal("")),
    businessRegNumber: z.string().trim().max(60).optional().or(z.literal("")),
    phone: z
      .string()
      .trim()
      .regex(/^(\+?233|0)[0-9]{9}$/, "Enter a valid Ghana phone number")
      .optional()
      .or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    region: z.string().trim().max(80).optional().or(z.literal("")),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    documentUrls: z.array(z.string().url("Each document must be a URL")).max(6).optional(),
  })
  .superRefine((data, ctx) => {
    for (const field of ROLE_PROFILES[data.requestedRole].requires) {
      if (!data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "Required for this role",
        });
      }
    }
  });

/** A reviewer's decision. Approving is what writes the role onto the account. */
export const roleApplicationReviewSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    reviewNote: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((d) => d.action !== "REJECT" || !!d.reviewNote, {
    message: "Tell the applicant why, so they can fix it and re-apply",
    path: ["reviewNote"],
  });

/**
 * A wholesale enquiry.
 *
 * `status` and `response` are absent: the buyer opens the conversation, the
 * supplier answers it, and neither is settable from the other's request body.
 */
export const supplierEnquirySchema = z.object({
  supplierId: z.string().min(1, "Missing supplier"),
  item: z.string().trim().min(3, "Tell them what you need").max(200),
  quantity: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.enum(SUPPLIER_CATEGORIES).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** The supplier's side: answer, or close it. */
export const supplierEnquiryReplySchema = z
  .object({
    status: z.enum(["QUOTED", "CLOSED", "DECLINED"]),
    response: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((d) => d.status !== "QUOTED" || !!d.response, {
    message: "A quote needs the actual quote in it",
    path: ["response"],
  });

/** Editing your own supplier profile. */
export const supplierProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Name your business").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  categories: z.array(z.enum(SUPPLIER_CATEGORIES)).max(6),
  minimumOrder: z.string().trim().max(80).optional().or(z.literal("")),
  servesRegions: z.array(z.string().trim().max(80)).max(20).optional(),
  leadTimeDays: z.coerce.number().int().min(0).max(365).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?233|0)[0-9]{9}$/, "Enter a valid Ghana phone number")
    .optional()
    .or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  website: z.string().trim().url("Enter a full URL").optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  region: z.string().trim().max(80).optional().or(z.literal("")),
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
  region: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).max(20).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
});

export const partListingSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(140),
    categorySlug: z.string().min(1, "Select a category"),
    brand: z.string().max(80).optional(),
    oemNumber: z.string().max(80).optional(),
    partNumber: z.string().max(80).optional(),
    condition: z.enum(["NEW", "USED", "REFURBISHED"]),
    price: z.coerce.number().positive("Enter a valid price"),
    discountPrice: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().min(0).max(1_000_000),
    sku: z.string().max(60).optional(),
    compatibleMakes: z.array(z.string()).max(50).optional(),
    compatibleModels: z.array(z.string()).max(100).optional(),
    yearFrom: z.coerce.number().int().min(1950).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1950).max(2100).optional(),
    fitmentPosition: z.string().max(40).optional(),
    description: z.string().max(5000).optional(),
    images: z.array(z.string().url()).max(12).optional(),
  })
  .refine((d) => d.discountPrice == null || d.discountPrice < d.price, {
    message: "Discount price must be lower than the price",
    path: ["discountPrice"],
  })
  .refine((d) => d.yearFrom == null || d.yearTo == null || d.yearTo >= d.yearFrom, {
    message: "“Year to” must be the same as or after “Year from”",
    path: ["yearTo"],
  });

export const blogPostSchema = z.object({
  title: z.string().min(4, "Title is too short").max(160),
  excerpt: z.string().max(400).optional(),
  content: z.string().min(20, "Content is too short"),
  category: z.string().max(60).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).max(20).optional(),
  readTime: z.coerce.number().int().min(1).max(120).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// ── Reviews ───────────────────────────────────────────────────
export const reviewSchema = z.object({
  targetType: z.enum(["vehicle", "part", "dealer", "service"]),
  targetId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(5, "Please write at least a few words").max(2000),
});

// ── Messaging ─────────────────────────────────────────────────
// Two flows share the /api/messages endpoint:
//   • Start a new conversation  → provide `recipientId` (+ optional context).
//   • Reply in an existing one   → provide `conversationId`.
export const messageSchema = z
  .object({
    conversationId: z.string().min(1).optional(),
    recipientId: z.string().min(1).optional(),
    subject: z.string().max(150).optional(),
    body: z.string().min(2, "Your message is too short").max(2000),
    vehicleId: z.string().optional(),
    partId: z.string().optional(),
  })
  .refine((d) => Boolean(d.conversationId) || Boolean(d.recipientId), {
    message: "A recipient or conversation is required",
    path: ["recipientId"],
  });

// ── Vehicle Passport ──────────────────────────────────────────
export const vehicleEventSchema = z.object({
  type: z.enum([
    "IMPORTED",
    "SHIPPED",
    "CLEARED",
    "INSPECTED",
    "LISTED",
    "PRICE_CHANGE",
    "SOLD",
    "OWNERSHIP_TRANSFER",
    "SERVICED",
    "REPAIRED",
    "INSURED",
    "REGISTERED",
    "MILEAGE_UPDATE",
    "NOTE",
  ]),
  title: z.string().min(2, "Add a short title").max(120),
  notes: z.string().max(2000).optional(),
  occurredAt: z.string().optional(),
});

// ── Import ops (admin) ────────────────────────────────────────
const IMPORT_STAGES = [
  "REQUESTED",
  "QUOTED",
  "VEHICLE_SELECTED",
  "PURCHASED",
  "SHIPPING_PENDING",
  "IN_TRANSIT",
  "ARRIVED_AT_PORT",
  "CUSTOMS_CLEARANCE",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export const importTrackingUpdateSchema = z.object({
  stage: z.enum(IMPORT_STAGES),
  title: z.string().min(2, "Add a short title").max(140),
  description: z.string().max(2000).optional(),
  location: z.string().max(120).optional(),
  estimatedArrival: z.string().optional(),
  trackingNumber: z.string().max(80).optional(),
});

export const importQuoteSchema = z.object({
  quotedCif: z.coerce.number().nonnegative().optional(),
  quotedDuty: z.coerce.number().nonnegative().optional(),
  quotedShipping: z.coerce.number().nonnegative().optional(),
  quotedTotal: z.coerce.number().nonnegative().optional(),
});

// ── Milestone escrow ──────────────────────────────────────────
export const escrowMilestoneInputSchema = z.object({
  label: z.string().min(2, "Add a label").max(80),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  unlockStage: z.enum(IMPORT_STAGES),
});

/**
 * Create/replace an escrow plan. Either pass `useTemplate: true` with a
 * `totalAmount` (auto-splits 20/30/30/20), or supply explicit `milestones`.
 */
export const escrowPlanSchema = z
  .object({
    totalAmount: z.coerce.number().positive("Enter the total amount"),
    useTemplate: z.boolean().optional(),
    milestones: z.array(escrowMilestoneInputSchema).min(1).max(8).optional(),
  })
  .refine((d) => d.useTemplate || (d.milestones && d.milestones.length > 0), {
    message: "Provide milestones or use the template",
    path: ["milestones"],
  });

export const escrowPlanActionSchema = z.object({
  action: z.enum(["activate", "cancel", "reopen"]),
});

export const escrowPaySchema = z.object({
  milestoneId: z.string().min(1, "milestoneId is required"),
});

// ── Saved searches ────────────────────────────────────────────
export const savedSearchSchema = z.object({
  name: z.string().trim().min(1, "Give this search a name").max(80),
  query: z.string().max(500).default(""),
});

// ── Dealer bulk listing actions ───────────────────────────────
export const dealerBulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one listing").max(200),
  action: z.enum(["sold", "unpublish", "republish"]),
});

// ── Vehicle ownership transfer ────────────────────────────────
export const ownershipTransferSchema = z.object({
  email: z.string().trim().email("Enter the new owner's email"),
  note: z.string().max(500).optional(),
});

// ── Trust & verification ──────────────────────────────────────
export const dealerVerificationSchema = z.object({
  businessRegNumber: z.string().trim().min(2, "Business registration number is required").max(60),
  taxId: z.string().trim().max(60).optional(),
  contactName: z.string().trim().min(2, "Contact name is required").max(120),
  contactPhone: z.string().trim().min(7, "A valid phone is required").max(30),
  idType: z.string().trim().min(2, "Select an ID type").max(40),
  idNumber: z.string().trim().min(3, "ID number is required").max(60),
  documentUrl: z.string().trim().url("Enter a valid document link").max(500).optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
});

export const verificationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().max(1000).optional(),
});

export const inspectionReportSchema = z.object({
  overallGrade: z.string().trim().min(1, "Add a grade").max(10),
  reportSummary: z.string().trim().min(2, "Add a short summary").max(4000),
  reportUrl: z.string().trim().url("Enter a valid link").max(500).optional().or(z.literal("")),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
});

// ── Bookings ──────────────────────────────────────────────────
export const serviceBookingSchema = z.object({
  serviceProviderId: z.string().min(1),
  scheduledAt: z.string().min(1, "Choose a date & time"),
  vehicleInfo: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const inspectionBookingSchema = z.object({
  vehicleInfo: z.string().min(2, "Describe the vehicle"),
  location: z.string().min(2, "Enter a location"),
  scheduledAt: z.string().min(1, "Choose a date & time"),
  notes: z.string().max(1000).optional(),
});

// ── Duty assessments (real ICUMS outcomes) ────────────────────
// Public "submit your duty bill" form. Chassis + vehicle basics + the total
// tax are required; everything else on the ICUMS Tax Result screen is
// welcome-but-optional, since not every importer keeps the full bill.
export const dutyAssessmentSchema = z
  .object({
    // VINs are 17 chars but older/JDM chassis codes are shorter — accept both.
    chassisNumber: z
      .string()
      .trim()
      .min(6, "Enter the chassis / VIN number")
      .max(30)
      .transform((s) => s.toUpperCase()),
    make: z.string().trim().min(2, "Enter the make").max(60),
    modelType: z.string().trim().min(1, "Enter the model").max(80),
    yearOfManufacture: z.coerce
      .number()
      .int()
      .min(1980, "Enter a valid year")
      .max(new Date().getFullYear() + 1, "Enter a valid year"),
    totalTax: z.coerce.number().positive("Enter the total tax paid (GHS)").max(10_000_000),
    trimLevel: z.string().trim().max(80).optional(),
    vehicleType: z.string().trim().max(60).optional(),
    engineSizeCc: z.coerce.number().int().min(50).max(20_000).optional(),
    originCode: z.string().trim().max(10).optional(),
    color: z.string().trim().max(40).optional(),
    fuelType: z.string().trim().max(30).optional(),
    hsCode: z.string().trim().max(20).optional(),
    hdv: z.coerce.number().positive().max(10_000_000).optional(),
    fobNcy: z.coerce.number().positive().max(100_000_000).optional(),
    cifNcy: z.coerce.number().positive().max(100_000_000).optional(),
    assessedAt: z.coerce.date().optional(),
    port: z.string().trim().max(40).optional(),
    // GHS per USD shown on the assessment row in the ICUMS checker.
    exchangeRate: z.coerce.number().positive().max(1000).optional(),
    // ICUMS taxonomy codes when picked from our coded selectors.
    icumsMakeCode: z
      .string()
      .regex(/^\d{5}$/)
      .optional(),
    icumsModelCode: z
      .string()
      .regex(/^\d{5}$/)
      .optional(),
    documentUrls: z.array(z.string().url()).max(6).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((d) => !d.assessedAt || d.assessedAt.getTime() <= Date.now() + 86_400_000, {
    message: "Assessment date can't be in the future",
    path: ["assessedAt"],
  })
  // ICUMS launched June 2020 — an "ICUMS tax bill" older than that isn't one.
  .refine((d) => !d.assessedAt || d.assessedAt.getFullYear() >= 2020, {
    message: "Enter the date on the ICUMS tax bill (2020 or later)",
    path: ["assessedAt"],
  });

export const assessmentReviewSchema = z.object({
  action: z.enum(["VERIFY", "REJECT"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

// ── Landed-cost quote (data-backed duty estimate) ─────────────
export const landedCostQuerySchema = z.object({
  make: z.string().trim().min(2, "Enter the make").max(60),
  model: z.string().trim().min(1, "Enter the model").max(80),
  year: z.coerce
    .number()
    .int()
    .min(1980)
    .max(new Date().getFullYear() + 1),
  icumsMakeCode: z
    .string()
    .regex(/^\d{5}$/)
    .optional(),
  icumsModelCode: z
    .string()
    .regex(/^\d{5}$/)
    .optional(),
  /** Optional trim — when we hold its HDV the estimate gets much tighter. */
  trim: z.string().trim().max(80).optional(),
});

// ── ICUMS vehicle taxonomy (coded make/model catalogue) ───────
const icumsCode = z.string().regex(/^\d{5}$/, "ICUMS codes are 5 digits, e.g. 00042");

/** Admin bulk import of catalogue rows (paged uploads — the full catalogue
 *  is ~691 makes and thousands of models). */
export const icumsCatalogSchema = z
  .object({
    makes: z
      .array(z.object({ code: icumsCode, name: z.string().trim().min(1).max(80) }))
      .max(1000)
      .optional(),
    models: z
      .array(
        z.object({
          code: icumsCode,
          name: z.string().trim().min(1).max(120),
          makeCode: icumsCode,
        }),
      )
      .max(2000)
      .optional(),
  })
  .refine((d) => (d.makes?.length ?? 0) + (d.models?.length ?? 0) > 0, {
    message: "Provide makes and/or models to import",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type DutyCalcInput = z.infer<typeof dutyCalcSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ImportRequestInput = z.infer<typeof importRequestSchema>;
export type RoleApplicationInput = z.infer<typeof roleApplicationSchema>;
export type RoleApplicationReviewInput = z.infer<typeof roleApplicationReviewSchema>;
export type SupplierEnquiryInput = z.infer<typeof supplierEnquirySchema>;
export type SupplierProfileInput = z.infer<typeof supplierProfileSchema>;

// ── Import stock (importer console) ───────────────────────────

// Derived from the console's own pickers rather than restated here: a market
// or currency added to one list and not the other fails validation silently.
const FOB_CURRENCY_VALUES = FOB_CURRENCIES;
const SOURCE_MARKET_VALUES = SOURCE_MARKETS;

/**
 * What an importer may set on a stock listing.
 *
 * `status` is absent on purpose. It is driven by availability — the reservation
 * flow flips ACTIVE to FULLY_RESERVED and back from the live count of held
 * units — so accepting it here would let a form overwrite the truth about what
 * is actually on the market. Publishing and archiving go through their own
 * action, which is a different decision from editing the car's details.
 *
 * `quantity` is capped: an importer with two hundred identical units has a
 * data-entry error, not a shipment.
 */
export const importListingSchema = z.object({
  title: z.string().trim().min(4, "Give the listing a title").max(140),
  make: z.string().trim().min(2, "Enter the make").max(60),
  model: z.string().trim().min(1, "Enter the model").max(80),
  trim: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.coerce
    .number()
    .int()
    .min(1980)
    .max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().int().min(0).max(1_000_000).optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "PLUGIN_HYBRID", "LPG"]),
  transmission: z.enum(["AUTOMATIC", "MANUAL", "CVT", "DUAL_CLUTCH"]),
  bodyType: z.enum([
    "SEDAN",
    "SUV",
    "HATCHBACK",
    "COUPE",
    "CONVERTIBLE",
    "PICKUP",
    "VAN",
    "WAGON",
    "MINIVAN",
    "TRUCK",
    "BUS",
  ]),
  engineSize: z.coerce.number().positive().max(12).optional(),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  drivetrain: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),

  countryOfOrigin: z.string().trim().min(2, "Where is the car?").max(60),
  portOfLoading: z.string().trim().max(80).optional().or(z.literal("")),
  auctionSource: z.string().trim().max(80).optional().or(z.literal("")),
  auctionGrade: z.string().trim().max(12).optional().or(z.literal("")),
  chassisNumber: z.string().trim().max(40).optional().or(z.literal("")),

  fobAmount: z.coerce.number().positive("Enter the FOB price"),
  fobCurrency: z.enum(FOB_CURRENCY_VALUES),
  /**
   * Cedis per unit of `fobCurrency`. Optional, because an importer may publish
   * a car before settling a rate — the listing then shows what it cannot price
   * rather than guessing (see `stockPricing`).
   */
  fxRateToGhs: z.coerce.number().positive().max(1_000_000).optional(),
  serviceFeeGhs: z.coerce.number().min(0).max(1_000_000).optional(),
  freightGhs: z.coerce.number().min(0).max(1_000_000).optional(),

  quantity: z.coerce.number().int().min(1).max(50),
  etaDays: z.coerce.number().int().min(1).max(365).optional(),
  images: z.array(z.string().url()).max(20).optional(),
});

export type ImportListingInput = z.infer<typeof importListingSchema>;

/** Publishing is a separate decision from editing the car's details. */
export const importListingStatusSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

/**
 * Editing your own importer profile.
 *
 * `verified`, `featured`, `rating` and `reviewCount` are deliberately absent:
 * those are things the platform says about an importer, and a buyer trusting a
 * self-awarded verified badge is exactly the harm the badge exists to prevent.
 */
export const importerProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Name your business").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  sourceMarkets: z.array(z.enum(SOURCE_MARKET_VALUES)).max(8),
  leadTimeDays: z.coerce.number().int().min(1).max(365).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?233|0)[0-9]{9}$/, "Enter a valid Ghana phone number")
    .optional()
    .or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  website: z.string().trim().url("Enter a full URL").optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  region: z.string().trim().max(80).optional().or(z.literal("")),
});

export type ImporterProfileInput = z.infer<typeof importerProfileSchema>;
