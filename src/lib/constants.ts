export const SITE = {
  name: "CarVista",
  tagline: "Ghana's Complete Automotive Marketplace",
  description:
    "Buy, sell and import vehicles, shop genuine car parts, calculate import duties, and find trusted dealers & automotive services across Ghana — all in one place.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@carvista.com.gh",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "233200000000",
  phone: "+233 20 000 0000",
  address: "Airport City, Accra, Ghana",
};

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

export const NAV_LINKS = [
  { label: "Buy a Car", href: "/vehicles" },
  { label: "Import a Car", href: "/import" },
  { label: "Car Parts", href: "/parts" },
  { label: "Dealers", href: "/dealers" },
  { label: "Services", href: "/services" },
  { label: "Calculators", href: "/calculators/import-duty" },
  { label: "Blog", href: "/blog" },
];
