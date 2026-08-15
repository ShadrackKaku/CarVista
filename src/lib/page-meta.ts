import { SITE } from "@/lib/constants";
/**
 * Page titles for the signed-in shell.
 *
 * The topbar sits outside the scroll container, so a title rendered there stays
 * visible all the way down a long table — which is why it lives here rather
 * than at the top of each page's content.
 *
 * `ShellTopbar` is a client component, so it resolves this with `usePathname()`
 * during render — on the server too. That means the title is in the first
 * paint: no store, no effect, and no flash of an empty header.
 */
export interface PageMeta {
  title: string;
  subtitle?: string;
}

/**
 * Route patterns, most specific first. `:id` matches exactly one path segment,
 * so `/admin/blog/:id/edit` matches `/admin/blog/abc123/edit` but not
 * `/admin/blog/new` — which has its own entry above it.
 */
const ROUTES: [pattern: string, meta: PageMeta][] = [
  // ── Marketplace module ─────────────────────────────────────────
  ["/app/marketplace", { title: "Marketplace", subtitle: "Vehicles, parts, dealers and services in one place." }],
  ["/app/marketplace/vehicles", { title: "Vehicles", subtitle: `Every car listed on ${SITE.name}.` }],
  ["/app/marketplace/vehicles/:id", { title: "Vehicle", subtitle: "Specs, history and landed cost." }],
  ["/app/marketplace/parts", { title: "Parts", subtitle: "Genuine and aftermarket parts from verified sellers." }],
  ["/app/marketplace/parts/:id", { title: "Part", subtitle: "Fitment, condition and delivery." }],
  ["/app/marketplace/dealers", { title: "Dealers", subtitle: "Verified dealerships across Ghana." }],
  ["/app/marketplace/dealers/:id", { title: "Dealer", subtitle: "Their stock, standing and contact details." }],
  ["/app/marketplace/suppliers", { title: "Suppliers", subtitle: "Wholesalers dealers and stores buy from." }],
  ["/app/marketplace/suppliers/:id", { title: "Supplier", subtitle: "What they stock, their terms, and how to get a quote." }],
  ["/app/marketplace/services", { title: "Services", subtitle: "Garages, inspectors and specialists near you." }],
  ["/app/marketplace/services/:id", { title: "Service provider", subtitle: "What they do and how to book." }],
  ["/app/marketplace/saved", { title: "Saved vehicles", subtitle: "Cars you're keeping an eye on." }],
  ["/app/marketplace/searches", { title: "Saved searches", subtitle: "We'll alert you when new matches land." }],
  ["/app/marketplace/listings", { title: "My listings", subtitle: "Every vehicle you have on the market." }],
  ["/app/marketplace/listings/new", { title: "List a vehicle", subtitle: "Photos, specs and price — it's free to list." }],
  ["/app/marketplace/listings/:id/edit", { title: "Edit listing", subtitle: "Update details, photos and price." }],
  ["/app/marketplace/cart", { title: "Cart", subtitle: "Parts you're ready to buy." }],
  ["/app/marketplace/checkout", { title: "Checkout", subtitle: "Delivery details and payment." }],
  ["/app/marketplace/checkout/verify", { title: "Payment", subtitle: "Confirming your order with Paystack." }],

  // ── Imports module ─────────────────────────────────────────────
  ["/app/imports/stock", { title: "Cars ready to import", subtitle: "Stock importers already have access to, priced landed in Tema." }],
  ["/app/imports/stock/:slug", { title: "Import stock", subtitle: "FOB, shipping and our duty estimate, itemised." }],
  ["/app/imports/new", { title: "Start an import", subtitle: "Tell us what you want and we'll quote the landed cost." }],
  ["/app/imports/mine", { title: "My imports", subtitle: "Every car you're bringing in, and where it is." }],
  ["/app/imports/reservations", { title: "My reservations", subtitle: "Cars you're holding, how long is left, and what the fee is worth." }],
  ["/app/imports/track", { title: "Track a shipment", subtitle: "Look up an import by its reference." }],
  ["/app/imports/duty-check", { title: "Share a duty bill", subtitle: "Add a real ICUMS assessment and sharpen everyone's estimate." }],
  ["/app/imports/escrow/verify", { title: "Payment", subtitle: "Confirming your escrow deposit." }],
  ["/app/imports/:id", { title: "Import", subtitle: "Timeline, documents and landed cost." }],

  // ── Search ─────────────────────────────────────────────────────
  ["/app/search", { title: "Search", subtitle: "Cars, parts, services and dealers." }],

  // ── Calculators module ─────────────────────────────────────────
  ["/app/calculators", { title: "Calculators", subtitle: "Price an import before you commit." }],
  ["/app/calculators/import-duty", { title: "Landed cost", subtitle: "Duty, levies, shipping and clearing in one number." }],
  ["/app/calculators/shipping", { title: "Shipping", subtitle: "Freight, insurance and port charges." }],
  ["/app/calculators/financing", { title: "Financing", subtitle: "Monthly repayments at Ghanaian bank rates." }],
  ["/app/calculators/taxes", { title: "Taxes & duties", subtitle: "The full GRA levy stack, line by line." }],
  ["/app/calculators/share-bill", { title: "Share a duty bill", subtitle: "Add a real assessment and sharpen everyone's estimate." }],

  // ── Admin ──────────────────────────────────────────────────────
  ["/admin", { title: "Admin overview", subtitle: "Platform-wide metrics and activity." }],
  ["/admin/users", { title: "User management", subtitle: "Manage all platform users, roles and status." }],
  ["/admin/staff", { title: "Team & access", subtitle: "Create accounts, and decide what each person may do." }],
  ["/admin/vehicles", { title: "Vehicles", subtitle: "Every listing on the platform." }],
  ["/admin/parts", { title: "Parts", subtitle: "Every part listed by your vendors." }],
  ["/admin/dealers", { title: "Dealers", subtitle: "Dealer accounts and their standing." }],
  ["/admin/verifications", { title: "Dealer verifications", subtitle: "Review documents and approve dealers." }],
  ["/admin/role-applications", { title: "Role applications", subtitle: "Approve or reject requests for specialised roles." }],
  ["/admin/inspections", { title: "Inspections", subtitle: "Requested and completed vehicle inspections." }],
  ["/admin/orders", { title: "Orders", subtitle: "Parts orders across the marketplace." }],
  ["/admin/imports", { title: "Import requests", subtitle: `Every import ${SITE.name} is handling.` }],
  ["/admin/imports/:id", { title: "Import request", subtitle: "Timeline, documents and status." }],
  ["/admin/escrow", { title: "Escrow", subtitle: "Funds held, released and refunded." }],
  ["/admin/duty-rates", { title: "Duty & levy rates", subtitle: "The rates every calculator quotes from." }],
  ["/admin/assessments", { title: "Duty data", subtitle: "Verified customs assessments behind our estimates." }],
  ["/admin/assessments/import", { title: "Import assessments", subtitle: "Paste ICUMS results to add them in bulk." }],
  ["/admin/accuracy", { title: "Estimate accuracy", subtitle: "How close our quotes land to real assessments." }],
  ["/admin/reviews", { title: "Reviews", subtitle: "Moderate reviews across the marketplace." }],
  ["/admin/blog", { title: "Blog", subtitle: "Manage articles and guides." }],
  ["/admin/blog/new", { title: "New post" }],
  ["/admin/blog/:id/edit", { title: "Edit post" }],

  // ── Dealer console ─────────────────────────────────────────────
  ["/dashboard/dealer", { title: "Dealer overview", subtitle: "How your listings are performing." }],
  ["/dashboard/dealer/listings", { title: "My listings", subtitle: "Every vehicle you have on the market." }],
  ["/dashboard/dealer/leads", { title: "Leads", subtitle: "Buyers who reached out about your stock." }],
  ["/dashboard/dealer/analytics", { title: "Analytics", subtitle: "Views, enquiries and conversion." }],
  ["/dashboard/dealer/verification", { title: "Get verified", subtitle: "Prove your dealership and earn the badge." }],

  // ── Seller console ─────────────────────────────────────────────
  ["/dashboard/seller", { title: "Seller overview", subtitle: "How your store is performing." }],
  ["/dashboard/seller/products", { title: "Products", subtitle: "Everything you have listed for sale." }],
  ["/dashboard/seller/products/new", { title: "New product" }],
  ["/dashboard/seller/products/:id/edit", { title: "Edit product" }],
  ["/dashboard/seller/orders", { title: "Orders", subtitle: "Orders placed with your store." }],
  ["/dashboard/seller/analytics", { title: "Analytics", subtitle: "Sales, views and stock movement." }],

  // ── Supplier console ───────────────────────────────────────────
  ["/dashboard/importer", { title: "Importer overview", subtitle: "Your stock, and who is holding it." }],
  ["/dashboard/importer/stock", { title: "My stock", subtitle: "Cars you have published for reservation." }],
  ["/dashboard/importer/stock/new", { title: "List a car", subtitle: "Saved as a draft until the pricing is set." }],
  ["/dashboard/importer/stock/:id/edit", { title: "Edit listing", subtitle: "Correcting details never changes whether the car is published." }],
  ["/dashboard/importer/reservations", { title: "Reservations", subtitle: "Who is holding what, and until when." }],
  ["/dashboard/importer/profile", { title: "My importer profile", subtitle: "What buyers see when they browse your stock." }],
  ["/dashboard/clearing", { title: "Clearing queue", subtitle: "Vehicles at the port with your name on them." }],
  ["/dashboard/supplier", { title: "Supplier overview", subtitle: "Enquiries waiting on you." }],
  ["/dashboard/supplier/enquiries", { title: "Enquiries", subtitle: "Buyers asking you to quote." }],
  ["/dashboard/supplier/profile", { title: "My supplier profile", subtitle: "What buyers see, and how they filter to you." }],

  // ── My Garage ──────────────────────────────────────────────────
  ["/dashboard", { title: "Overview", subtitle: "What's happening with your account." }],
  ["/dashboard/saved", { title: "Saved vehicles", subtitle: "Cars you're keeping an eye on." }],
  ["/dashboard/searches", { title: "Saved searches", subtitle: "We'll alert you when new matches land." }],
  ["/dashboard/orders", { title: "My orders", subtitle: "Parts you've bought and their status." }],
  ["/dashboard/inspections", { title: "Inspections", subtitle: "Independent checks you've requested." }],
  ["/dashboard/messages", { title: "Messages", subtitle: "Conversations with dealers and sellers." }],
  ["/dashboard/profile", { title: "Profile & settings", subtitle: "Your details, password and preferences." }],
  ["/dashboard/upgrade", { title: "Upgrade my account", subtitle: "Apply for the role that matches what you do." }],
];

function matches(pattern: string, pathname: string): boolean {
  const p = pattern.split("/");
  const a = pathname.split("/");
  if (p.length !== a.length) return false;
  return p.every((seg, i) => seg === ":id" || seg === a[i]);
}

/**
 * The title for a path, falling back to the closest ancestor that has one —
 * so an unlisted child route still shows its section's title rather than a
 * blank header.
 */
export function pageMetaFor(pathname: string): PageMeta | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;

  const exact = ROUTES.find(([pattern]) => matches(pattern, clean));
  if (exact) return exact[1];

  // Longest matching ancestor wins.
  const ancestors = ROUTES.filter(([pattern]) => {
    const depth = pattern.split("/").length;
    const segments = clean.split("/").slice(0, depth).join("/");
    return depth < clean.split("/").length && matches(pattern, segments);
  }).sort((a, b) => b[0].split("/").length - a[0].split("/").length);

  return ancestors[0]?.[1] ?? null;
}
