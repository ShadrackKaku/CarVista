import { Check } from "lucide-react";
import { IMPORT_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ImportTimeline({ currentStage }: { currentStage: string }) {
  const stages = IMPORT_STAGES;
  const currentIndex = stages.findIndex((s) => s.value === currentStage);

  return (
    <ol className="relative space-y-0">
      {stages.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={stage.value} className="relative flex gap-4 pb-8 last:pb-0">
            {i < stages.length - 1 && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-full w-0.5",
                  done ? "bg-brand-500" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                done && "border-brand-500 bg-brand-500 text-white",
                active && "border-brand-500 bg-background text-brand-600 ring-4 ring-brand-100 dark:ring-brand-900/40",
                !done && !active && "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <div className={cn("pt-1", !done && !active && "opacity-60")}>
              <p className={cn("font-semibold", active && "text-brand-600")}>{stage.label}</p>
              {active && (
                <p className="mt-0.5 text-sm text-muted-foreground">Current stage</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
