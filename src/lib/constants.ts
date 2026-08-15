/**
 * Everything the product is called, in one place.
 *
 * `SITE.name` is the only spelling of the brand anywhere in the application —
 * every heading, email, page title and WhatsApp message reads it from here, and
 * `brand-strings.test.ts` fails the build if a new literal appears. Renaming the
 * product is this file plus the environment, not a hundred-file sweep.
 */
const DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "carvista.com.gh";

export const SITE = {
  name: "CarVista",
  tagline: "Ghana's Complete Automotive Marketplace",
  description:
    "Buy, sell and import vehicles, shop genuine car parts, calculate import duties, and find trusted dealers & automotive services across Ghana — all in one place.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /** Bare domain, no scheme — the thing addresses are built on. */
  domain: DOMAIN,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? `support@${DOMAIN}`,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "233200000000",
  phone: "+233 20 000 0000",
  address: "Airport City, Accra, Ghana",
  // Social profiles — set via env once the handles exist. Empty values are not
  // rendered (no dead links).
  socials: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL ?? "",
  },
};

/**
 * Prefix for localStorage keys and custom DOM events.
 *
 * Deliberately a frozen string rather than derived from `SITE.name`. These keys
 * address data already sitting in people's browsers: tying them to the brand
 * would mean that renaming the product silently empties every existing user's
 * cart and wishlist, and collapses their sidebar preferences, for no benefit
 * anyone can see. Internal identifiers should not churn with marketing.
 *
 * Change this only with a deliberate migration.
 */
export const APP_KEY = "carvista";

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North",
];

export const IMPORT_COUNTRIES = [
  "United States",
  "Germany",
  "United Kingdom",
  "Japan",
  "United Arab Emirates",
  "Canada",
  "South Korea",
];

export const AUCTION_SOURCES = [
  "Copart",
  "IAAI",
  "Manheim",
  "USS Japan",
  "TAA",
  "BE FORWARD",
  "SBT Japan",
  "Dealer Direct",
  "Other",
];

export const POPULAR_BRANDS = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Kia",
  "Nissan",
  "Mercedes-Benz",
  "BMW",
  "Ford",
  "Volkswagen",
  "Lexus",
  "Mazda",
  "Chevrolet",
  "Land Rover",
  "Audi",
  "Mitsubishi",
];

export const FUEL_TYPES = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
  { value: "LPG", label: "LPG" },
] as const;

export const TRANSMISSIONS = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "MANUAL", label: "Manual" },
  { value: "CVT", label: "CVT" },
  { value: "DUAL_CLUTCH", label: "Dual Clutch" },
] as const;

export const BODY_TYPES = [
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "COUPE", label: "Coupe" },
  { value: "CONVERTIBLE", label: "Convertible" },
  { value: "WAGON", label: "Wagon" },
  { value: "PICKUP", label: "Pickup" },
  { value: "VAN", label: "Van" },
  { value: "MINIVAN", label: "Minivan" },
  { value: "TRUCK", label: "Truck" },
  { value: "BUS", label: "Bus" },
] as const;

export const VEHICLE_CONDITIONS = [
  { value: "NEW", label: "Brand New" },
  { value: "FOREIGN_USED", label: "Foreign Used" },
  { value: "GHANA_USED", label: "Ghana Used" },
  { value: "SALVAGE", label: "Salvage" },
] as const;

export const IMPORT_STAGES = [
  { value: "REQUESTED", label: "Request Received", icon: "FileText" },
  { value: "QUOTED", label: "Quotation Sent", icon: "Receipt" },
  { value: "VEHICLE_SELECTED", label: "Vehicle Selected", icon: "Car" },
  { value: "PURCHASED", label: "Purchased at Auction", icon: "ShoppingCart" },
  { value: "SHIPPING_PENDING", label: "Shipping Pending", icon: "Clock" },
  { value: "IN_TRANSIT", label: "In Transit", icon: "Ship" },
  { value: "ARRIVED_AT_PORT", label: "Arrived at Port", icon: "Anchor" },
  { value: "CUSTOMS_CLEARANCE", label: "Customs Clearance", icon: "ShieldCheck" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery", icon: "PackageCheck" },
  { value: "DELIVERED", label: "Delivered", icon: "CheckCircle2" },
] as const;

export const PART_CATEGORIES = [
  { name: "Engine Parts", slug: "engine-parts", icon: "Cog" },
  { name: "Body Parts", slug: "body-parts", icon: "Car" },
  { name: "Electrical Parts", slug: "electrical-parts", icon: "Zap" },
  { name: "Brake Parts", slug: "brake-parts", icon: "Disc" },
  { name: "Suspension Parts", slug: "suspension-parts", icon: "Waypoints" },
  { name: "Tyres & Wheels", slug: "tyres-wheels", icon: "CircleDot" },
  { name: "Batteries", slug: "batteries", icon: "BatteryCharging" },
  { name: "Filters", slug: "filters", icon: "Filter" },
  { name: "Lights", slug: "lights", icon: "Lightbulb" },
  { name: "Accessories", slug: "accessories", icon: "Sparkles" },
  { name: "Car Electronics", slug: "car-electronics", icon: "Radio" },
  { name: "Interior Accessories", slug: "interior-accessories", icon: "Armchair" },
];

export const SERVICE_TYPES = [
  { value: "MECHANIC", label: "Mechanics", icon: "Wrench" },
  { value: "AUTO_ELECTRICIAN", label: "Auto Electricians", icon: "Zap" },
  { value: "SPRAY_PAINTER", label: "Spray Painters", icon: "SprayCan" },
  { value: "CAR_WASH", label: "Car Wash", icon: "Droplets" },
  { value: "DETAILING", label: "Detailing", icon: "Sparkles" },
  { value: "INSURANCE", label: "Insurance", icon: "ShieldCheck" },
  { value: "DRIVING_SCHOOL", label: "Driving Schools", icon: "GraduationCap" },
  { value: "INSPECTION", label: "Vehicle Inspection", icon: "ClipboardCheck" },
  { value: "TOWING", label: "Towing", icon: "Truck" },
  { value: "TYRE_SERVICE", label: "Tyre Services", icon: "CircleDot" },
] as const;

/**
 * The display label for a vehicle enum value.
 *
 * The tables above already spell these correctly — "CVT", "SUV", "Plug-in
 * Hybrid" — and reading them is the only way to get that right. Lower-casing
 * the enum and leaning on CSS `capitalize` looks fine on PETROL and produces
 * "Cvt" and "Suv" on the acronyms, which is the sort of thing a buyer reads as
 * carelessness on a page asking them for GH₵289,000.
 *
 * Falls back to the raw value rather than throwing: an enum we have not
 * tabulated should render plainly, not break the page.
 */
const ENUM_LABELS: Record<string, string> = Object.fromEntries(
  [...FUEL_TYPES, ...TRANSMISSIONS, ...BODY_TYPES, ...VEHICLE_CONDITIONS].map((e) => [
    e.value,
    e.label,
  ]),
);

export function enumLabel(value: string | null | undefined): string {
  if (!value) return "";
  return ENUM_LABELS[value] ?? value;
}

/**
 * The public site's own navigation.
 *
 * Signed-in visitors never see this — the middleware moves them into the shell,
 * which has its own. So these are the pages that explain the product, plus the
 * catalogue a visitor can browse before deciding to join.
 */
export const NAV_LINKS = [
  { label: "Buy a Car", href: "/vehicles" },
  { label: "Import a Car", href: "/import" },
  { label: "Car Parts", href: "/parts" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Calculators", href: "/calculators" },
  { label: "Resources", href: "/resources" },
];
