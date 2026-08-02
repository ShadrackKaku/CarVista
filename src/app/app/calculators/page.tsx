import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Import & finance tools",
  description:
    "Calculate landed cost, import duty, shipping and financing for a vehicle in Ghana — priced off real ICUMS customs assessments.",
};

export default function CalculatorsPage() {
  return (
    <div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const soon = tool.status === "SOON";

          const body = (
            <>
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  soon ? "bg-muted text-muted-foreground" : "bg-brand-600/10 text-brand-600",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-4 flex items-center gap-2">
                <span className="font-semibold">{tool.name}</span>
                {soon && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Soon
                  </span>
                )}
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                {tool.blurb}
              </span>
              {!soon && (
                <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </>
          );

          const shell = "flex flex-col rounded-2xl border p-5 transition-all";

          return soon ? (
            <div key={tool.id} className={cn(shell, "opacity-60")}>
              {body}
            </div>
          ) : (
            <Link
              key={tool.id}
              href={tool.href}
              className={cn(shell, "hover:border-brand-300 hover:shadow-lift")}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
