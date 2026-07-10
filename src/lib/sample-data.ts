/**
 * Sample catalogue data used to render the public marketing & marketplace
 * pages without requiring a live database connection. The same shapes are
 * produced by Prisma queries in production (see `prisma/seed.ts`).
 *
 * Images are royalty-free Unsplash automotive photos referenced by URL.
 */

export interface SampleVehicle {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  engineSize: number;
  bodyType: string;
  color: string;
  condition: string;
  importStatus: string;
  city: string;
  region?: string;
  countryOfOrigin?: string;
  location: string;
  featured: boolean;
  verified: boolean;
  images: string[];
  dealer: { name: string; slug: string; verified: boolean };
  auctionGrade?: string;
  vin?: string;
  features: string[];
  description: string;
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const SAMPLE_VEHICLES: SampleVehicle[] = [
  {
    id: "v1",
    slug: "2021-toyota-camry-se",
    title: "2021 Toyota Camry SE",
    brand: "Toyota",
    model: "Camry",
    year: 2021,
    price: 285000,
    mileage: 42000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: 2.5,
    bodyType: "SEDAN",
    color: "Pearl White",
    condition: "FOREIGN_USED",
    importStatus: "CLEARED",
    city: "Accra",
    location: "Airport City, Accra",
    featured: true,
    verified: true,
    auctionGrade: "4.5",
    vin: "4T1G11AK5MU******",
    images: [
      img("photo-1621007947382-bb3c3994e3fb"),
      img("photo-1503376780353-7e6692767b70"),
      img("photo-1552519507-da3b142c6e3d"),
    ],
    dealer: { name: "Prime Motors Ghana", slug: "prime-motors-ghana", verified: true },
    features: ["Reverse Camera", "Apple CarPlay", "Alloy Wheels", "Leather Seats", "Cruise Control"],
    description:
      "Clean 2021 Toyota Camry SE, foreign used, accident-free with full service history. Duty paid and ready for registration.",
  },
  {
    id: "v2",
    slug: "2020-honda-crv-ex",
    title: "2020 Honda CR-V EX",
    brand: "Honda",
    model: "CR-V",
    year: 2020,
    price: 320000,
    mileage: 55000,
    fuelType: "PETROL",
    transmission: "CVT",
    engineSize: 1.5,
    bodyType: "SUV",
    color: "Metallic Grey",
    condition: "FOREIGN_USED",
    importStatus: "CLEARED",
    city: "Kumasi",
    location: "Adum, Kumasi",
    featured: true,
    verified: true,
    auctionGrade: "4",
    images: [img("photo-1568844293986-8d0400bd4745"), img("photo-1519641471654-76ce0107ad1b")],
    dealer: { name: "Kumasi Auto Hub", slug: "kumasi-auto-hub", verified: true },
    features: ["Sunroof", "Lane Assist", "Push Start", "Blind Spot Monitor", "Heated Seats"],
    description:
      "Spacious and fuel-efficient Honda CR-V EX. Perfect family SUV in excellent condition.",
  },
  {
    id: "v3",
    slug: "2019-mercedes-benz-c300",
    title: "2019 Mercedes-Benz C300",
    brand: "Mercedes-Benz",
    model: "C300",
    year: 2019,
    price: 410000,
    mileage: 61000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: 2.0,
    bodyType: "SEDAN",
    color: "Obsidian Black",
    condition: "FOREIGN_USED",
    importStatus: "AVAILABLE_FOR_IMPORT",
    city: "Accra",
    location: "East Legon, Accra",
    featured: true,
    verified: true,
    auctionGrade: "4.5",
    images: [img("photo-1618843479313-40f8afb4b4d8"), img("photo-1617531653332-bd46c24f2068")],
    dealer: { name: "Prime Motors Ghana", slug: "prime-motors-ghana", verified: true },
    features: ["Panoramic Roof", "Burmester Sound", "Ambient Lighting", "AMG Line", "360 Camera"],
    description:
      "Luxurious Mercedes-Benz C300 with AMG styling. Available for import — request a duty quote today.",
  },
  {
    id: "v4",
    slug: "2018-toyota-tacoma-trd",
    title: "2018 Toyota Tacoma TRD Off-Road",
    brand: "Toyota",
    model: "Tacoma",
    year: 2018,
    price: 375000,
    mileage: 78000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: 3.5,
    bodyType: "PICKUP",
    color: "Cement Grey",
    condition: "FOREIGN_USED",
    importStatus: "IMPORT_IN_PROGRESS",
    city: "Takoradi",
    location: "Market Circle, Takoradi",
    featured: false,
    verified: true,
    auctionGrade: "4",
    images: [img("photo-1533473359331-0135ef1b58bf"), img("photo-1605893477799-b99e3b8b93fe")],
    dealer: { name: "West Coast Autos", slug: "west-coast-autos", verified: true },
    features: ["4WD", "Crawl Control", "Bed Liner", "Tow Package", "Multi-Terrain Select"],
    description: "Rugged Tacoma TRD Off-Road, ideal for Ghana's terrain. Currently in transit.",
  },
  {
    id: "v5",
    slug: "2022-hyundai-elantra",
    title: "2022 Hyundai Elantra SEL",
    brand: "Hyundai",
    model: "Elantra",
    year: 2022,
    price: 245000,
    mileage: 28000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: 2.0,
    bodyType: "SEDAN",
    color: "Intense Blue",
    condition: "FOREIGN_USED",
    importStatus: "CLEARED",
    city: "Accra",
    location: "Spintex, Accra",
    featured: true,
    verified: false,
    images: [img("photo-1580273916550-e323be2ae537"), img("photo-1494976388531-d1058494cdd8")],
    dealer: { name: "Spintex Car Centre", slug: "spintex-car-centre", verified: false },
    features: ["Digital Cluster", "Wireless CarPlay", "Blind Spot Monitor", "Keyless Entry"],
    description: "Almost new Hyundai Elantra with low mileage and a modern tech package.",
  },
  {
    id: "v6",
    slug: "2020-kia-sportage",
    title: "2020 Kia Sportage LX",
    brand: "Kia",
    model: "Sportage",
    year: 2020,
    price: 265000,
    mileage: 49000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: 2.4,
    bodyType: "SUV",
    color: "Snow White Pearl",
    condition: "FOREIGN_USED",
    importStatus: "CLEARED",
    city: "Tema",
    location: "Community 1, Tema",
    featured: false,
    verified: true,
    images: [img("photo-1550355291-bbee04a92027"), img("photo-1544829099-b9a0c07fad1a")],
    dealer: { name: "Tema Motors Ltd", slug: "tema-motors-ltd", verified: true },
    features: ["Backup Camera", "Bluetooth", "Alloy Wheels", "Roof Rails"],
    description: "Reliable compact SUV in pristine condition. Duty paid and registered.",
  },
  {
    id: "v7",
    slug: "2021-lexus-rx350",
    title: "2021 Lexus RX 350 F-Sport",
    brand: "Lexus",
    model: "RX 350",
    year: 2021,
    price: 560000,
    mileage: 38000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: 3.5,
    bodyType: "SUV",
    color: "Nightfall Mica",
    condition: "FOREIGN_USED",
    importStatus: "AVAILABLE_FOR_IMPORT",
    city: "Accra",
    location: "Cantonments, Accra",
    featured: true,
    verified: true,
    auctionGrade: "5",
    images: [img("photo-1619767886558-efdc259cde1a"), img("photo-1606664515524-ed2f786a0bd6")],
    dealer: { name: "Prime Motors Ghana", slug: "prime-motors-ghana", verified: true },
    features: ["Mark Levinson Audio", "Ventilated Seats", "Head-Up Display", "F-Sport Package"],
    description: "Top-of-the-range Lexus RX 350 F-Sport. Premium comfort and reliability.",
  },
  {
    id: "v8",
    slug: "2017-ford-f150",
    title: "2017 Ford F-150 XLT",
    brand: "Ford",
    model: "F-150",
    year: 2017,
    price: 340000,
    mileage: 92000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    engineSize: 3.5,
    bodyType: "PICKUP",
    color: "Race Red",
    condition: "FOREIGN_USED",
    importStatus: "CLEARED",
    city: "Kumasi",
    location: "Ejisu, Kumasi",
    featured: false,
    verified: false,
    images: [img("photo-1605559424843-9e4c228bf1c2"), img("photo-1558618666-fcd25c85cd64")],
    dealer: { name: "Kumasi Auto Hub", slug: "kumasi-auto-hub", verified: true },
    features: ["EcoBoost V6", "Tow Package", "Bed Liner", "Running Boards"],
    description: "Powerful and dependable F-150 XLT with the twin-turbo EcoBoost engine.",
  },
];

export interface SamplePart {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  brand: string;
  price: number;
  discountPrice?: number;
  condition: string;
  stock: number;
  rating: number;
  reviewCount: number;
  oemNumber?: string;
  compatibleMakes: string[];
  image: string;
  store: { name: string; slug: string; verified: boolean };
  featured: boolean;
}

export const SAMPLE_PARTS: SamplePart[] = [
  {
    id: "p1",
    slug: "toyota-corolla-front-brake-pads",
    name: "Front Brake Pads — Ceramic",
    category: "Brake Parts",
    categorySlug: "brake-parts",
    brand: "Bosch",
    price: 420,
    discountPrice: 350,
    condition: "NEW",
    stock: 34,
    rating: 4.8,
    reviewCount: 56,
    oemNumber: "04465-02220",
    compatibleMakes: ["Toyota"],
    image: img("photo-1486262715619-67b85e0b08d3"),
    store: { name: "GenuineParts GH", slug: "genuineparts-gh", verified: true },
    featured: true,
  },
  {
    id: "p2",
    slug: "bosch-s5-car-battery",
    name: "Bosch S5 Car Battery 74Ah",
    category: "Batteries",
    categorySlug: "batteries",
    brand: "Bosch",
    price: 950,
    condition: "NEW",
    stock: 18,
    rating: 4.9,
    reviewCount: 41,
    compatibleMakes: ["Toyota", "Honda", "Nissan", "Kia", "Hyundai"],
    image: img("photo-1620714223084-8fcacc6dfd8d"),
    store: { name: "PowerCell Ghana", slug: "powercell-ghana", verified: true },
    featured: true,
  },
  {
    id: "p3",
    slug: "michelin-primacy-4-tyre",
    name: "Michelin Primacy 4 — 205/55 R16",
    category: "Tyres & Wheels",
    categorySlug: "tyres-wheels",
    brand: "Michelin",
    price: 1150,
    discountPrice: 999,
    condition: "NEW",
    stock: 60,
    rating: 4.9,
    reviewCount: 88,
    compatibleMakes: ["Toyota", "Honda", "Volkswagen", "Hyundai"],
    image: img("photo-1449426468159-d96dbf800f19"),
    store: { name: "TyrePro Accra", slug: "tyrepro-accra", verified: true },
    featured: true,
  },
  {
    id: "p4",
    slug: "denso-oil-filter",
    name: "Denso Oil Filter",
    category: "Filters",
    categorySlug: "filters",
    brand: "Denso",
    price: 85,
    condition: "NEW",
    stock: 120,
    rating: 4.7,
    reviewCount: 33,
    oemNumber: "90915-YZZE1",
    compatibleMakes: ["Toyota", "Lexus"],
    image: img("photo-1635784063388-1ff609e6dee8"),
    store: { name: "GenuineParts GH", slug: "genuineparts-gh", verified: true },
    featured: true,
  },
  {
    id: "p5",
    slug: "led-headlight-assembly",
    name: "LED Headlight Assembly (Pair)",
    category: "Lights",
    categorySlug: "lights",
    brand: "OEM",
    price: 2400,
    condition: "NEW",
    stock: 8,
    rating: 4.6,
    reviewCount: 19,
    compatibleMakes: ["Honda"],
    image: img("photo-1591637333184-19aa84b3e01f"),
    store: { name: "AutoLux Parts", slug: "autolux-parts", verified: false },
    featured: false,
  },
  {
    id: "p6",
    slug: "ngk-spark-plugs-set",
    name: "NGK Iridium Spark Plugs (Set of 4)",
    category: "Engine Parts",
    categorySlug: "engine-parts",
    brand: "NGK",
    price: 320,
    condition: "NEW",
    stock: 45,
    rating: 4.8,
    reviewCount: 62,
    compatibleMakes: ["Toyota", "Honda", "Nissan", "Mazda"],
    image: img("photo-1599256621730-535171e28e50"),
    store: { name: "GenuineParts GH", slug: "genuineparts-gh", verified: true },
    featured: true,
  },
  {
    id: "p7",
    slug: "android-car-stereo-10inch",
    name: '10" Android Touchscreen Car Stereo',
    category: "Car Electronics",
    categorySlug: "car-electronics",
    brand: "Pioneer",
    price: 1800,
    discountPrice: 1550,
    condition: "NEW",
    stock: 22,
    rating: 4.5,
    reviewCount: 47,
    compatibleMakes: ["Toyota", "Honda", "Kia", "Hyundai"],
    image: img("photo-1558618666-fcd25c85cd64"),
    store: { name: "AutoLux Parts", slug: "autolux-parts", verified: false },
    featured: false,
  },
  {
    id: "p8",
    slug: "front-shock-absorbers",
    name: "KYB Front Shock Absorbers (Pair)",
    category: "Suspension Parts",
    categorySlug: "suspension-parts",
    brand: "KYB",
    price: 1250,
    condition: "NEW",
    stock: 15,
    rating: 4.7,
    reviewCount: 28,
    compatibleMakes: ["Toyota", "Nissan"],
    image: img("photo-1537041373298-55b8d99c50e0"),
    store: { name: "SuspensionPro", slug: "suspensionpro", verified: true },
    featured: false,
  },
];

export function getPartById(id: string): SamplePart | undefined {
  return SAMPLE_PARTS.find((p) => p.id === id);
}

export function getPartBySlug(slug: string): SamplePart | undefined {
  return SAMPLE_PARTS.find((p) => p.slug === slug);
}

export interface SampleDealer {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  vehicleCount: number;
  yearsInBusiness: number;
  logo: string;
  cover: string;
  description: string;
}

export const SAMPLE_DEALERS: SampleDealer[] = [
  {
    id: "d1",
    slug: "prime-motors-ghana",
    name: "Prime Motors Ghana",
    city: "Accra",
    region: "Greater Accra",
    verified: true,
    rating: 4.8,
    reviewCount: 214,
    vehicleCount: 68,
    yearsInBusiness: 12,
    logo: img("photo-1560179707-f14e90ef3623"),
    cover: img("photo-1562141961-b5d1dc5c1e9b"),
    description:
      "Ghana's premier importer of luxury and executive vehicles. Every car is inspected, duty-paid and comes with a satisfaction guarantee.",
  },
  {
    id: "d2",
    slug: "kumasi-auto-hub",
    name: "Kumasi Auto Hub",
    city: "Kumasi",
    region: "Ashanti",
    verified: true,
    rating: 4.6,
    reviewCount: 156,
    vehicleCount: 52,
    yearsInBusiness: 8,
    logo: img("photo-1567808291548-fc3ee04dbcf0"),
    cover: img("photo-1552519507-da3b142c6e3d"),
    description:
      "The Ashanti Region's trusted destination for quality foreign-used vehicles at fair prices.",
  },
  {
    id: "d3",
    slug: "west-coast-autos",
    name: "West Coast Autos",
    city: "Takoradi",
    region: "Western",
    verified: true,
    rating: 4.5,
    reviewCount: 89,
    vehicleCount: 34,
    yearsInBusiness: 6,
    logo: img("photo-1541443131876-44b03de101c5"),
    cover: img("photo-1503376780353-7e6692767b70"),
    description: "Specialists in pickups, 4x4s and commercial vehicles for the oil city.",
  },
  {
    id: "d4",
    slug: "tema-motors-ltd",
    name: "Tema Motors Ltd",
    city: "Tema",
    region: "Greater Accra",
    verified: true,
    rating: 4.7,
    reviewCount: 132,
    vehicleCount: 45,
    yearsInBusiness: 10,
    logo: img("photo-1552519507-da3b142c6e3d"),
    cover: img("photo-1494976388531-d1058494cdd8"),
    description: "Located minutes from Tema Port — the smart choice for freshly cleared imports.",
  },
];

export interface SampleService {
  id: string;
  slug: string;
  name: string;
  type: string;
  typeLabel: string;
  city: string;
  region: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  image: string;
  services: string[];
  priceRange: string;
}

export const SAMPLE_SERVICES: SampleService[] = [
  {
    id: "s1",
    slug: "autofix-master-mechanics",
    name: "AutoFix Master Mechanics",
    type: "MECHANIC",
    typeLabel: "Mechanic",
    city: "Accra",
    region: "Greater Accra",
    verified: true,
    rating: 4.8,
    reviewCount: 176,
    image: img("photo-1487754180451-c456f719a1fc"),
    services: ["Engine Repair", "Diagnostics", "Servicing", "Suspension"],
    priceRange: "GHS 150 – 2,500",
  },
  {
    id: "s2",
    slug: "sparkle-auto-detailing",
    name: "Sparkle Auto Detailing",
    type: "DETAILING",
    typeLabel: "Detailing",
    city: "Accra",
    region: "Greater Accra",
    verified: true,
    rating: 4.9,
    reviewCount: 98,
    image: img("photo-1520340356584-f9917d1eea6f"),
    services: ["Interior Detailing", "Ceramic Coating", "Paint Correction"],
    priceRange: "GHS 200 – 1,800",
  },
  {
    id: "s3",
    slug: "voltage-auto-electricals",
    name: "Voltage Auto Electricals",
    type: "AUTO_ELECTRICIAN",
    typeLabel: "Auto Electrician",
    city: "Kumasi",
    region: "Ashanti",
    verified: true,
    rating: 4.6,
    reviewCount: 64,
    image: img("photo-1632823469850-2f77dd9c7f93"),
    services: ["Wiring", "ECU Repair", "AC Systems", "Battery"],
    priceRange: "GHS 100 – 1,200",
  },
  {
    id: "s4",
    slug: "safedrive-driving-school",
    name: "SafeDrive Driving School",
    type: "DRIVING_SCHOOL",
    typeLabel: "Driving School",
    city: "Tema",
    region: "Greater Accra",
    verified: true,
    rating: 4.7,
    reviewCount: 112,
    image: img("photo-1449965408869-eaa3f722e40d"),
    services: ["DVLA Licensing", "Manual & Auto", "Defensive Driving"],
    priceRange: "GHS 800 – 2,000",
  },
];

export interface SampleTestimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  quote: string;
}

export const SAMPLE_TESTIMONIALS: SampleTestimonial[] = [
  {
    id: "t1",
    name: "Kwame Mensah",
    role: "Imported a Toyota Highlander",
    location: "Accra",
    avatar: "https://i.pravatar.cc/120?img=12",
    rating: 5,
    quote:
      "CarVista's import calculator was spot on — the final duty was within GHS 300 of the estimate. My Highlander arrived in 6 weeks. Truly professional service.",
  },
  {
    id: "t2",
    name: "Ama Owusu",
    role: "Bought a Honda CR-V",
    location: "Kumasi",
    avatar: "https://i.pravatar.cc/120?img=45",
    rating: 5,
    quote:
      "I found a verified dealer, chatted on WhatsApp, and bought my CR-V the same week. The verification badge gave me real peace of mind.",
  },
  {
    id: "t3",
    name: "Yaw Boateng",
    role: "Parts Seller",
    location: "Tema",
    avatar: "https://i.pravatar.cc/120?img=33",
    rating: 5,
    quote:
      "As a parts seller, the dashboard makes managing inventory and orders effortless. My sales have grown 40% since joining CarVista.",
  },
  {
    id: "t4",
    name: "Efua Sarpong",
    role: "First-time buyer",
    location: "Takoradi",
    avatar: "https://i.pravatar.cc/120?img=20",
    rating: 4,
    quote:
      "The financing calculator helped me plan my budget properly. I knew exactly what my monthly payments would be before committing.",
  },
];

export interface SampleBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover: string;
  author: string;
  date: string;
  readTime: number;
}

export const SAMPLE_BLOG_POSTS: SampleBlogPost[] = [
  {
    id: "b1",
    slug: "ghana-car-import-duty-guide-2025",
    title: "The Complete Guide to Ghana Car Import Duty in 2025",
    excerpt:
      "Everything you need to know about calculating import duty, VAT and levies when bringing a vehicle into Ghana — with worked examples.",
    category: "Import Guides",
    cover: img("photo-1494976388531-d1058494cdd8"),
    author: "CarVista Editorial",
    date: "2025-01-15",
    readTime: 8,
  },
  {
    id: "b2",
    slug: "roro-vs-container-shipping",
    title: "RoRo vs Container Shipping: Which is Right for Your Import?",
    excerpt:
      "We break down the costs, risks and transit times of the two most popular vehicle shipping methods into Tema Port.",
    category: "Shipping",
    cover: img("photo-1605559424843-9e4c228bf1c2"),
    author: "CarVista Editorial",
    date: "2025-01-08",
    readTime: 6,
  },
  {
    id: "b3",
    slug: "top-10-reliable-cars-ghana-roads",
    title: "Top 10 Most Reliable Cars for Ghanaian Roads",
    excerpt:
      "From pothole-proof suspensions to fuel economy, here are the vehicles that thrive in Ghana's driving conditions.",
    category: "Buying Advice",
    cover: img("photo-1552519507-da3b142c6e3d"),
    author: "CarVista Editorial",
    date: "2024-12-22",
    readTime: 7,
  },
  {
    id: "b4",
    slug: "spotting-genuine-vs-fake-car-parts",
    title: "How to Spot Genuine vs Fake Car Parts",
    excerpt:
      "Counterfeit parts are everywhere. Learn the tell-tale signs and protect your engine with these expert tips.",
    category: "Maintenance",
    cover: img("photo-1486262715619-67b85e0b08d3"),
    author: "CarVista Editorial",
    date: "2024-12-10",
    readTime: 5,
  },
];

/**
 * Expand the base catalogue into a fuller marketplace by generating realistic
 * variants (different trims, years, colours, cities). Deterministic so SSR and
 * client render identically.
 */
const CITY_REGION: Record<string, string> = {
  Accra: "Greater Accra",
  Tema: "Greater Accra",
  Kumasi: "Ashanti",
  Takoradi: "Western",
  "Cape Coast": "Central",
  Tamale: "Northern",
};

export function getExpandedVehicles(): SampleVehicle[] {
  const cities = ["Accra", "Kumasi", "Tema", "Takoradi", "Cape Coast", "Tamale"];
  const regions = ["Greater Accra", "Ashanti", "Greater Accra", "Western", "Central", "Northern"];
  const base = SAMPLE_VEHICLES.map((v) => ({
    ...v,
    region: v.region ?? CITY_REGION[v.city] ?? "Greater Accra",
    countryOfOrigin: v.countryOfOrigin ?? "United States",
  }));
  const colors = ["Silver", "Black", "White", "Grey", "Blue", "Red"];
  const conditions = ["FOREIGN_USED", "GHANA_USED", "NEW"];
  const extra: SampleVehicle[] = [];

  base.forEach((item, bi) => {
    for (let i = 0; i < 3; i++) {
      const seed = bi * 3 + i;
      const cityIdx = seed % cities.length;
      const yearDelta = (seed % 4) - 1;
      const priceFactor = 1 + ((seed % 5) - 2) * 0.06;
      extra.push({
        ...item,
        id: `${item.id}-v${i}`,
        slug: `${item.slug}-${i + 2}`,
        year: item.year + yearDelta,
        price: Math.round((item.price * priceFactor) / 1000) * 1000,
        mileage: item.mileage + seed * 3200,
        color: colors[seed % colors.length],
        condition: conditions[seed % conditions.length],
        city: cities[cityIdx],
        region: regions[cityIdx],
        featured: false,
        images: [item.images[(i + 1) % item.images.length], ...item.images],
      });
    }
  });

  return [...base, ...extra];
}

export const HOME_STATS = [
  { label: "Vehicles Listed", value: "12,400+" },
  { label: "Verified Dealers", value: "340+" },
  { label: "Cars Imported", value: "5,600+" },
  { label: "Happy Customers", value: "28,000+" },
];
