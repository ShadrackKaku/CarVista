import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      {trend && <p className="mt-1 text-xs font-medium text-success">{trend}</p>}
    </div>
  );
}
