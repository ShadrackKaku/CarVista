import { describe, it, expect } from "vitest";
import { pageMetaFor } from "./page-meta";

describe("pageMetaFor", () => {
  it("resolves a plain route", () => {
    expect(pageMetaFor("/admin/users")).toMatchObject({ title: "User management" });
    expect(pageMetaFor("/dashboard/saved")).toMatchObject({ title: "Saved vehicles" });
  });

  it("distinguishes the section root from its children", () => {
    expect(pageMetaFor("/admin")?.title).toBe("Admin overview");
    expect(pageMetaFor("/dashboard")?.title).toBe("Overview");
    expect(pageMetaFor("/dashboard/dealer")?.title).toBe("Dealer overview");
  });

  it("matches a dynamic segment", () => {
    expect(pageMetaFor("/admin/imports/clx123")?.title).toBe("Import request");
    expect(pageMetaFor("/admin/blog/clx123/edit")?.title).toBe("Edit post");
    expect(pageMetaFor("/dashboard/seller/products/abc/edit")?.title).toBe("Edit product");
  });

  it("prefers a literal route over a dynamic one at the same depth", () => {
    // /admin/blog/new must not be read as /admin/blog/:id.
    expect(pageMetaFor("/admin/blog/new")?.title).toBe("New post");
    expect(pageMetaFor("/dashboard/seller/products/new")?.title).toBe("New product");
  });

  it("falls back to the closest ancestor for an unlisted child", () => {
    expect(pageMetaFor("/admin/users/clx123/audit")?.title).toBe("User management");
    expect(pageMetaFor("/dashboard/dealer/listings/clx1/edit")?.title).toBe("My listings");
  });

  it("does not let a deep unknown path fall all the way to a wrong section", () => {
    expect(pageMetaFor("/admin/nonexistent")?.title).toBe("Admin overview");
    expect(pageMetaFor("/dashboard/nonexistent")?.title).toBe("Overview");
  });

  it("ignores a trailing slash", () => {
    expect(pageMetaFor("/admin/users/")?.title).toBe("User management");
    expect(pageMetaFor("/")).toBeNull();
  });

  it("returns null outside the shell", () => {
    expect(pageMetaFor("/vehicles")).toBeNull();
    expect(pageMetaFor("/calculators/taxes")).toBeNull();
  });
});
