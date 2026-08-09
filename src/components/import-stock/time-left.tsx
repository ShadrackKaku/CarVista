"use client";

import { useEffect, useState } from "react";

/**
 * How long is left on a hold, kept live.
 *
 * Rendering this on the server would freeze it at page-load time, and this page
 * is one a buyer leaves open while they arrange a bank transfer — "1 day left"
 * still on screen after the window has actually closed is the worst possible
 * lie for a page about money. So the server sends the deadline and the browser
 * does the counting, re-checking every thirty seconds.
 *
 * Before mount there is nothing trustworthy to say, so it renders the absolute
 * deadline instead: correct in every timezone, and no hydration mismatch.
 */
export function TimeLeft({ deadline }: { deadline: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(deadline).getTime();
  if (now === null || !Number.isFinite(target)) {
    return <span suppressHydrationWarning>{formatAbsolute(deadline)}</span>;
  }

  const ms = target - now;
  if (ms <= 0) return <span className="font-medium text-warning">Window closed</span>;

  return (
    <span className="font-medium" suppressHydrationWarning>
      {humanise(ms)} left
    </span>
  );
}

function humanise(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  // Below two days, hours are what the buyer can act on — "1 day" reads as
  // more room than 25 hours actually gives them.
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `${days} days`;
}

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
