import type { SupplierCategory } from "@prisma/client";

/**
 * What a supplier trades in.
 *
 * The labels live here rather than beside each use so the browse filter, the
 * card, the profile and the console all name a category identically — and so a
 * new category is one line rather than a hunt.
 */
export const SUPPLIER_CATEGORY_LABELS: Record<string, string> = {
  VEHICLES: "Vehicles",
  PARTS: "Parts",
  TYRES: "Tyres",
  LUBRICANTS: "Lubricants",
  ACCESSORIES: "Accessories",
  EQUIPMENT: "Workshop equipment",
};

/**
 * Spelled out as a tuple rather than derived from the labels, because zod's
 * `z.enum` needs a non-empty tuple type and `Object.keys` only gives `string[]`.
 * The `satisfies` keeps the two in step: a category here that has no label, or
 * one that is not a real enum member, fails the typecheck.
 */
export const SUPPLIER_CATEGORIES = [
  "VEHICLES",
  "PARTS",
  "TYRES",
  "LUBRICANTS",
  "ACCESSORIES",
  "EQUIPMENT",
] as const satisfies readonly SupplierCategory[];

export function isSupplierCategory(value: string): value is SupplierCategory {
  return value in SUPPLIER_CATEGORY_LABELS;
}
