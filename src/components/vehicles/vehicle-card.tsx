import { Fuel, Gauge, MapPin, Settings2, ShieldCheck } from "lucide-react";
import { SaveVehicleButton } from "@/components/vehicles/save-vehicle-button";
import {
  ListingCard,
  ListingCardBody,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardPrice,
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

  // What used to be stamped on the photograph. Two at most, deliberately: a
  // third wraps to a second row, which makes that one card taller than its
  // neighbours and leaves the grid ragged — the bulk coming back in by the
  // side door. Verification is about the seller rather than the car, so it
  // rides beside the dealer's name in the footer where it belongs.
  const tags: ListingTag[] = [
    { label: CONDITION_LABELS[vehicle.condition] ?? vehicle.condition, tone: "brand" },
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
            { icon: Fuel, label: enumLabel(vehicle.fuelType) },
            { icon: Settings2, label: enumLabel(vehicle.transmission) },
            { icon: MapPin, label: vehicle.city },
          ]}
        />

        <ListingCardFooter>
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            {vehicle.dealer.verified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Verified dealer" />
            )}
            <span className="truncate">{vehicle.dealer.name}</span>
          </span>
          <span className="shrink-0 font-medium text-foreground">{vehicle.year}</span>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
