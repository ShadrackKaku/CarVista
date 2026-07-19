/**
 * Pure mapping from a dealer bulk action to the resulting listing status.
 * Shared by the API (to apply) and available for tests, so the rule can't drift.
 */
export type DealerBulkAction = "sold" | "unpublish" | "republish";

export const BULK_ACTION_STATUS: Record<DealerBulkAction, "SOLD" | "DRAFT" | "ACTIVE"> = {
  sold: "SOLD",
  unpublish: "DRAFT",
  republish: "ACTIVE",
};

export function bulkActionLabel(action: DealerBulkAction): string {
  return { sold: "Mark as sold", unpublish: "Unpublish", republish: "Republish" }[action];
}
