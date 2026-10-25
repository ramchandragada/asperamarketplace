import { describe, expect, it } from "vitest";
import {
  listActiveBrands,
  listBrandFilterIndex,
} from "@/modules/catalogue/service";

describe("category-scoped brand filters", () => {
  it("lists only brands that sell motherboards", async () => {
    const brands = await listActiveBrands({ categorySlug: "motherboards" });
    const names = brands.map((brand) => brand.name);
    expect(names.length).toBeGreaterThan(0);
    expect(names).toEqual(expect.arrayContaining(["ASUS", "MSI", "Gigabyte"]));
    expect(names.some((name) => /acer|logitech|benq|aoc/i.test(name))).toBe(
      false,
    );
  });

  it("lists only AMD/Intel for processors", async () => {
    const brands = await listActiveBrands({ categorySlug: "processors" });
    expect(brands.map((brand) => brand.name).sort()).toEqual(["AMD", "Intel"]);
  });

  it("builds a per-category brand index without cross-category leakage", async () => {
    const index = await listBrandFilterIndex();
    expect(index.byCategory.motherboards?.map((b) => b.name)).toEqual([
      "ASUS",
      "Gigabyte",
      "MSI",
    ]);
    expect(
      index.byCategory["keyboard-mouse"]?.some((b) => b.name === "Logitech"),
    ).toBe(true);
    expect(
      index.byCategory.motherboards?.some((b) => b.name === "Logitech"),
    ).toBe(false);
    expect(index.all.length).toBeGreaterThan(
      index.byCategory.motherboards?.length ?? 0,
    );
  });
});
