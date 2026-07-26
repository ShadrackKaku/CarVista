import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { RESULT_TYPE_LABELS, type SearchResult } from "@/lib/site-search";

/** A single master-search hit: thumbnail, type badge, title + subtitle, linking
 *  through to the item's own detail page. */
export function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      href={result.href}
      className="group flex items-center gap-4 rounded-xl border bg-card p-3 shadow-soft transition-colors hover:border-brand-300 hover:bg-accent"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {result.image ? (
          <Image src={result.image} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-5 w-5" aria-hidden />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          {RESULT_TYPE_LABELS[result.type]}
        </span>
        <p className="mt-1 truncate font-semibold text-foreground transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {result.title}
        </p>
        {result.subtitle && (
          <p className="truncate text-sm text-muted-foreground">{result.subtitle}</p>
        )}
      </div>
    </Link>
  );
}
