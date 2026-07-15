import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  onImage = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: { label: string; href: string };
  className?: string;
  /** Render for placement over a dark image (light text). */
  onImage?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "mx-auto max-w-2xl")}>
        {eyebrow && (
          <span
            className={cn(
              "mb-2 inline-block text-sm font-semibold uppercase tracking-wide",
              onImage ? "text-brand-200" : "text-brand-600",
            )}
          >
            {eyebrow}
          </span>
        )}
        <h2
          className={cn(
            "font-display text-2xl font-bold tracking-tight sm:text-3xl",
            onImage && "text-white",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-2 max-w-2xl", onImage ? "text-white/80" : "text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold",
            onImage ? "text-white hover:text-white/80" : "text-brand-600 hover:text-brand-700",
          )}
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
