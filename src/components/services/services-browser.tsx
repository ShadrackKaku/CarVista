"use client";

import { useState } from "react";
import { ServiceCard } from "@/components/services/service-card";
import { SERVICE_TYPES } from "@/lib/constants";
import type { SampleService } from "@/lib/sample-data";

export function ServicesBrowser({ services }: { services: SampleService[] }) {
  const [type, setType] = useState("");

  const filtered = type ? services.filter((s) => s.type === type) : services;

  return (
    <div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setType("")}
          className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
            type === "" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30" : "hover:bg-accent"
          }`}
        >
          All services
        </button>
        {SERVICE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
              type === t.value ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30" : "hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      ) : (
        <p className="mt-16 rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No providers in this category yet. Check back soon.
        </p>
      )}
    </div>
  );
}
