import { describe, expect, it } from "vitest";
import {
  CATALOGUE_PICK_GROUPS,
  pickGroupForCategorySlug,
} from "@/modules/catalogue/pick-groups";
import { PC_CATEGORIES } from "@/modules/catalogue/pc-catalogue-data";

describe("catalogue pick groups", () => {
  it("covers every seeded PC category slug exactly once", () => {
    const covered = CATALOGUE_PICK_GROUPS.flatMap((group) => [
      ...group.categorySlugs,
    ]);
    const seeded = PC_CATEGORIES.map((row) => row.slug);
    expect([...covered].sort()).toEqual([...seeded].sort());
    expect(new Set(covered).size).toBe(covered.length);
  });

  it("resolves a leaf category back to its parent group", () => {
    expect(pickGroupForCategorySlug("processors")?.key).toBe("pc-components");
    expect(pickGroupForCategorySlug("laptops")?.key).toBe("systems");
    expect(pickGroupForCategorySlug("unknown")).toBeUndefined();
  });
});
