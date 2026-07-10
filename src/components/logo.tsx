import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
  href = "/",
}: {
  className?: string;
  withText?: boolean;
  href?: string | null;
}) {
  const mark = (
    <span className="flex items-center gap-2">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 shadow-glow">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" aria-hidden>
          <path
            d="M3 13.5 4.6 9a3 3 0 0 1 2.8-2h9.2a3 3 0 0 1 2.8 2L21 13.5M3 13.5h18M3 13.5v4a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1V17m14-3.5v4a1 1 0 0 1-1 1H17a1 1 0 0 1-1-1v-.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="15" r="1.1" fill="currentColor" />
          <circle cx="17" cy="15" r="1.1" fill="currentColor" />
        </svg>
      </span>
      {withText && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          Car<span className="text-gradient">Vista</span>
        </span>
      )}
    </span>
  );

  if (href === null) return <div className={cn("inline-flex", className)}>{mark}</div>;

  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {mark}
    </Link>
  );
}
