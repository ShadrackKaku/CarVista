import { Fuel, Gauge, MapPin, Settings2, ShieldCheck } from "lucide-react";
import { SaveVehicleButton } from "@/components/vehicles/save-vehicle-button";
import {
  ListingCard,
  ListingCardAction,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardPrice,
  ListingCardSeller,
  ListingCardSpecs,
  ListingCardTags,
  ListingCardTitle,
  type ListingTag,
} from "@/components/ui/listing-card";
import { enumLabel } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { SampleVehicle } from "@/lib/sample-data";

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Brand New",
  FOREIGN_USED: "Foreign Used",
  GHANA_USED: "Ghana Used",
  SALVAGE: "Salvage",
};

export interface VehicleCardProps {
  vehicle: SampleVehicle;
  /**
   * Where the card links. Defaults to the public listing; the Marketplace
   * module passes its own path so a click stays inside the shell instead of
   * dropping the user back onto the marketing site.
   */
  basePath?: string;
}

export function VehicleCard({ vehicle, basePath = "/vehicles" }: VehicleCardProps) {
  const href = `${basePath}/${vehicle.slug}`;

  const tags: ListingTag[] = [
    { label: CONDITION_LABELS[vehicle.condition] ?? vehicle.condition, tone: "brand" },
    // Duty paid is the fact a Ghanaian buyer checks first: it is the difference
    // between a price and a price plus a surprise at Tema.
    ...(vehicle.importStatus === "CLEARED"
      ? [{ label: "Duty Paid", tone: "success" as const }]
      : []),
  ];

  return (
    <ListingCard>
      <ListingCardMedia src={vehicle.images[0]} alt={vehicle.title} />

      <ListingCardBody>
        <ListingCardTags tags={tags} />

        <ListingCardTitle href={href} action={<SaveVehicleButton vehicleId={vehicle.id} />}>
          {vehicle.title}
        </ListingCardTitle>

        <ListingCardPrice>{formatCurrency(vehicle.price)}</ListingCardPrice>

        <ListingCardSpecs
          items={[
            { icon: Gauge, label: `${formatNumber(vehicle.mileage)} km` },
            { icon: Settings2, label: enumLabel(vehicle.transmission) },
            { icon: Fuel, label: enumLabel(vehicle.fuelType) },
            { icon: MapPin, label: vehicle.city },
          ]}
        />

        <ListingCardFooter className="mt-5">
          <ListingCardSeller
            name={vehicle.dealer.name}
            verified={vehicle.dealer.verified}
            verifiedLabel="Verified Dealer"
            icon={ShieldCheck}
          />
          <ListingCardAction />
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
