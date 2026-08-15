import { Check } from "lucide-react";
import { SaveVehicleButton } from "@/components/vehicles/save-vehicle-button";
import {
  ListingCard,
  ListingCardBody,
  ListingCardEyebrow,
  ListingCardFooter,
  ListingCardMedia,
  ListingCardMeta,
  ListingCardPrice,
  ListingCardTitle,
} from "@/components/ui/listing-card";
import { enumLabel } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { SampleVehicle } from "@/lib/sample-data";

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Brand new",
  FOREIGN_USED: "Foreign used",
  GHANA_USED: "Ghana used",
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

/**
 * A car in a grid.
 *
 * The shape, the elevation and the hover all come from `ListingCard`, shared
 * with every other card on the platform. What is left here is what makes a car
 * a car: the eye falls down it in four stops — picture, name, price, details.
 */
export function VehicleCard({ vehicle, basePath = "/vehicles" }: VehicleCardProps) {
  const href = `${basePath}/${vehicle.slug}`;

  // Read as one sentence, in the order someone asks: how far has it gone, how
  // does it drive, what does it drink. No icons — a gauge glyph beside
  // "62,400 km" adds no information and costs a fixation.
  const specs = [
    `${formatNumber(vehicle.mileage)} km`,
    enumLabel(vehicle.transmission),
    enumLabel(vehicle.fuelType),
  ].filter(Boolean);

  return (
    <ListingCard>
      <ListingCardMedia src={vehicle.images[0]} alt={vehicle.title} />

      <ListingCardBody>
        <ListingCardEyebrow>
          {CONDITION_LABELS[vehicle.condition] ?? vehicle.condition}
          {vehicle.importStatus === "CLEARED" && (
            <span className="text-muted-foreground/60"> · Duty paid</span>
          )}
        </ListingCardEyebrow>

        <ListingCardTitle href={href}>{vehicle.title}</ListingCardTitle>

        <ListingCardPrice>{formatCurrency(vehicle.price)}</ListingCardPrice>
        <ListingCardMeta>{specs.join("  ·  ")}</ListingCardMeta>

        <ListingCardFooter>
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-[13px] font-medium">
              {vehicle.dealer.name}
              {vehicle.dealer.verified && (
                <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Verified dealer" />
              )}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{vehicle.city}</p>
          </div>

          {/* Sits above the card-wide link, so saving never navigates. */}
          <div className="relative z-10 shrink-0">
            <SaveVehicleButton vehicleId={vehicle.id} />
          </div>
        </ListingCardFooter>
      </ListingCardBody>
    </ListingCard>
  );
}
