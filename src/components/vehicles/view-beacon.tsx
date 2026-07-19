"use client";

import { useEffect } from "react";

/**
 * Fires a one-time view ping for a listing. Deduped per browser session so a
 * refresh in the same tab doesn't inflate the count. Silent and non-blocking.
 */
export function ViewBeacon({ vehicleId }: { vehicleId: string }) {
  useEffect(() => {
    const key = `cv-viewed:${vehicleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable — still count the view.
    }
    fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [vehicleId]);

  return null;
}
