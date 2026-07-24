import Link from "next/link";
import Image from "next/image";
import { Fuel, Gauge, MapPin, Settings2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveVehicleButton } from "@/components/vehicles/save-vehicle-button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { SampleVehicle } from "@/lib/sample-data";

const IMPORT_STATUS_LABELS: Record<string, string> = {
  CLEARED: "Duty Paid",
  AVAILABLE_FOR_IMPORT: "Import to Order",
  IMPORT_IN_PROGRESS: "In Transit",
  NOT_IMPORTED: "Local",
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Brand New",
  FOREIGN_USED: "Foreign Used",
  GHANA_USED: "Ghana Used",
  SALVAGE: "Salvage",
};

export function VehicleCard({ vehicle }: { vehicle: SampleVehicle }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
      <Link href={`/vehicles/${vehicle.slug}`} className="block">
        <div className="relative aspect-[16/11] overflow-hidden bg-muted">
          <Image
            src={vehicle.images[0]}
            alt={vehicle.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge variant="brand">{CONDITION_LABELS[vehicle.condition]}</Badge>
            {vehicle.importStatus === "CLEARED" && (
              <Badge variant="success">{IMPORT_STATUS_LABELS[vehicle.importStatus]}</Badge>
            )}
          </div>
          {vehicle.verified && (
            <Badge className="absolute right-3 top-3 bg-white/95 text-brand-700" variant="secondary">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/vehicles/${vehicle.slug}`} className="min-w-0">
            <h3 className="truncate font-semibold leading-tight transition-colors group-hover:text-brand-600">
              {vehicle.title}
            </h3>
          </Link>
          <SaveVehicleButton vehicleId={vehicle.id} className="-mr-1 -mt-1" />
        </div>

        <p className="mt-2 font-display text-base font-bold text-brand-700 transition-colors group-hover:text-foreground dark:text-brand-400 dark:group-hover:text-foreground">
          {formatCurrency(vehicle.price)}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" /> {formatNumber(vehicle.mileage)} km
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5" /> {vehicle.fuelType.toLowerCase()}
          </span>
          <span className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> {vehicle.transmission.toLowerCase()}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {vehicle.city}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
          <span className="text-muted-foreground">{vehicle.dealer.name}</span>
          <span className="font-medium text-foreground">{vehicle.year}</span>
        </div>
      </div>
    </div>
  );
}
