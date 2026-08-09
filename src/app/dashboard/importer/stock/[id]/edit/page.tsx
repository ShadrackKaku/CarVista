import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getImporterForUser } from "@/lib/queries";
import { StockForm, type StockFormValues } from "@/components/import-stock/stock-form";

export const dynamic = "force-dynamic";

/** Numbers come back as Decimal; the form works in strings. */
const str = (v: unknown) => (v == null ? "" : String(v));

export default async function EditImportListingPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const importer = user ? await getImporterForUser(user.id) : null;
  if (!importer) redirect("/dashboard/importer");

  // Scoped to the importer, so an id belonging to somebody else's listing is a
  // 404 rather than an edit form for a car they do not own.
  const listing = await prisma.importListing
    .findFirst({ where: { id: params.id, importerId: importer.id } })
    .catch(() => null);
  if (!listing) notFound();

  const initial: StockFormValues = {
    title: listing.title,
    make: listing.make,
    model: listing.model,
    trim: str(listing.trim),
    year: String(listing.year),
    mileage: str(listing.mileage),
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    bodyType: listing.bodyType,
    color: str(listing.color),
    countryOfOrigin: listing.countryOfOrigin,
    portOfLoading: str(listing.portOfLoading),
    auctionGrade: str(listing.auctionGrade),
    chassisNumber: str(listing.chassisNumber),
    fobAmount: str(listing.fobAmount),
    fobCurrency: listing.fobCurrency,
    fxRateToGhs: str(listing.fxRateToGhs),
    freightGhs: str(listing.freightGhs),
    serviceFeeGhs: str(listing.serviceFeeGhs),
    quantity: String(listing.quantity),
    etaDays: str(listing.etaDays),
    description: str(listing.description),
  };

  return <StockForm listingId={listing.id} initial={initial} />;
}
