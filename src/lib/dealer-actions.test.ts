import { describe, it, expect } from "vitest";
import { BULK_ACTION_STATUS, bulkActionLabel } from "@/lib/dealer-actions";

describe("BULK_ACTION_STATUS", () => {
  it("maps each bulk action to the right listing status", () => {
    expect(BULK_ACTION_STATUS.sold).toBe("SOLD");
    expect(BULK_ACTION_STATUS.unpublish).toBe("DRAFT");
    expect(BULK_ACTION_STATUS.republish).toBe("ACTIVE");
  });
});

describe("bulkActionLabel", () => {
  it("gives a human label for each action", () => {
    expect(bulkActionLabel("sold")).toBe("Mark as sold");
    expect(bulkActionLabel("unpublish")).toBe("Unpublish");
    expect(bulkActionLabel("republish")).toBe("Republish");
  });
});
