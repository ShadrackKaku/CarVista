"use client";

import { Phone, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { whatsappUrl } from "@/lib/utils";

export function SellerContact({
  dealerName,
  verified,
  vehicleTitle,
  price,
  children,
}: {
  dealerName: string;
  verified: boolean;
  vehicleTitle: string;
  price: string;
  children?: React.ReactNode;
}) {
  const message = `Hi ${dealerName}, I'm interested in the ${vehicleTitle} (${price}) listed on ${SITE.name}. Is it still available?`;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {dealerName.charAt(0)}
        </div>
        <div>
          <p className="flex items-center gap-1.5 font-semibold">
            {dealerName}
            {verified && <ShieldCheck className="h-4 w-4 text-success" />}
          </p>
          <p className="text-xs text-muted-foreground">
            {verified ? "Verified dealer" : "Private seller"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <Button asChild className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]">
          <a href={whatsappUrl(SITE.whatsapp, message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
            <Phone className="h-4 w-4" /> Call seller
          </a>
        </Button>
        {children}
      </div>

      <p className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mb-1 inline h-3.5 w-3.5 text-brand-500" /> Safety tip: Always inspect
        the vehicle and verify documents before making any payment. Never pay in full before seeing
        the car.
      </p>
    </div>
  );
}
