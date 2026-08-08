"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PAGE_SIZE, paginate, type PageOf } from "./pagination";

export interface PagedList<T> extends PageOf<T> {
  /** Change page and put the top of the results back in view. */
  goToPage: (page: number) => void;
  /** Put on the element the grid should scroll back to. */
  anchorRef: React.RefObject<HTMLDivElement>;
}

/**
 * Page a client-filtered list.
 *
 * Every browse surface holds its whole result set in memory and filters it
 * there, so paging is a slice rather than a query. What each of them would
 * otherwise have to remember independently is the awkward part, and it is the
 * same three things every time:
 *
 *  - Reset to page 1 when the filters change. Otherwise you narrow a search
 *    while sitting on page 3 and land on an empty grid that reads as "nothing
 *    matches" — `paginate` clamps, so you would instead land on the last page
 *    of a search you never asked to be deep inside.
 *  - Scroll the results back to the top when the page changes. Clicking "next"
 *    at the bottom of the grid and staying at the bottom shows you the footer
 *    of a page you have not read.
 *  - Never let the page number outlive the result set it indexed into.
 *
 * `resetKey` is whatever string changes when the filters do — the query string
 * for vehicles, a joined tuple elsewhere.
 */
export function usePagedList<T>(
  items: T[],
  resetKey: string,
  pageSize: number = PAGE_SIZE,
): PagedList<T> {
  const [page, setPage] = useState(1);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const goToPage = useCallback((next: number) => {
    setPage(next);
    // `scrollIntoView` walks up to the nearest scrollable ancestor, which is
    // the shell's content column inside the app and the window on the public
    // pages — so this works on both without either knowing about the other.
    anchorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  return { ...paginate(items, page, pageSize), goToPage, anchorRef };
}
