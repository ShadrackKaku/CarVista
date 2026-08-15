/**
 * Several answers to one question, stored in one string.
 *
 * Every browser on the platform keeps its filters in the query string so a
 * search is shareable and can be saved. Comma-joining a facet's values keeps
 * that true without changing the shape of anything: `brand=Toyota` from a link
 * made before multi-select existed still parses, still matches, and still means
 * exactly what it did.
 *
 * Lives apart from any one browser because parts, dealers, suppliers and import
 * stock all need it, and a shell component that renders the checkboxes should
 * not have to import from a vehicle module to do so.
 */

/** The values chosen in a facet. Empty string means "no constraint". */
export function selectedValues(value: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

/**
 * Whether a value is chosen.
 *
 * Compares whole entries, never substrings — `isSelected("Toyota", "Toy")` is
 * false, and a "Kia" filter does not light up because "Kia,Nissan" contains it.
 */
export function isSelected(current: string, value: string): boolean {
  return selectedValues(current).includes(value);
}

/** Add the value if absent, remove it if present. */
export function toggleValue(current: string, value: string): string {
  const values = selectedValues(current);
  const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
  return next.join(",");
}

/**
 * Whether a row survives a facet.
 *
 * Within a facet the chosen values are an OR: ticking a second brand widens the
 * search. Read as an AND it would return nothing at all, since no car is both a
 * Toyota and a Honda — the classic way multi-select filters ship broken.
 *
 * A row whose own value is missing fails a set filter rather than passing every
 * one of them: a listing with no region recorded is not in every region.
 */
export function matchesAny(filterValue: string, actual: string | null | undefined): boolean {
  const values = selectedValues(filterValue);
  if (values.length === 0) return true;
  return actual != null && values.includes(actual);
}

/** True when any of the row's values is chosen — for list-valued fields. */
export function matchesAnyOf(
  filterValue: string,
  actual: readonly string[] | null | undefined,
): boolean {
  const values = selectedValues(filterValue);
  if (values.length === 0) return true;
  return (actual ?? []).some((a) => values.includes(a));
}

/** Reads a facet back the way somebody would say it: "Toyota, Honda or Kia". */
export function describeValues(value: string, tidy: (s: string) => string = (s) => s): string | null {
  const values = selectedValues(value).map(tidy);
  if (!values.length) return null;
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
