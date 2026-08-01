import Link from "next/link";
import { ToolRail } from "@/components/tools/tool-rail";

/**
 * The tools workspace. The rail persists across every tool, so switching
 * between them swaps only the content column.
 */
export default function CalculatorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b bg-card">
      <div className="container-page">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Tools
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Import workspace
            </h1>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Everything you need to price an import, in one place — priced off real customs
            assessments, not guesswork.
          </p>
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-[13.5rem_1fr] lg:gap-12 lg:py-10">
          {/* min-w-0: below `lg` this is a single-column grid, and a grid item
              defaults to min-width:auto — so the rail's intrinsic width would
              size the track and push the whole page sideways. */}
          <div className="min-w-0">
            <ToolRail />
            <div className="mt-6 hidden rounded-2xl bg-brand-600 p-5 text-white lg:block">
              <h2 className="text-sm font-semibold">Need help importing?</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-brand-100">
                We can source, ship, clear and deliver your vehicle end to end.
              </p>
              <Link
                href="/import"
                className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                Start an import
              </Link>
            </div>
          </div>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
