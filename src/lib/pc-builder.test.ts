import { describe, expect, it } from "vitest";
import {
  caseSupportValuesForBoard,
  compatibilityFacetsForSlot,
  compatibilityLockLabels,
  defaultMemoryTypeForPlatform,
  nextEmptyBuilderSlot,
  partMatchesCompatibilityFacets,
  platformForSocket,
  pruneIncompatibleSelection,
  type BuilderPart,
  type BuilderSelection,
} from "@/lib/pc-builder";

function part(
  partial: Partial<BuilderPart> & { facets: Record<string, string> },
): BuilderPart {
  return {
    productId: partial.productId ?? "p1",
    variantId: partial.variantId ?? "v1",
    slug: partial.slug ?? "part",
    title: partial.title ?? "Part",
    imageUrl: null,
    pricePaise: partial.pricePaise ?? 10_000_00,
    mrpPaise: null,
    availableQty: 3,
    sellerName: "Aspera",
    facets: partial.facets,
  };
}

describe("PC builder compatibility locks", () => {
  it("maps CPU socket to motherboard platform filter", () => {
    const selection: BuilderSelection = {
      cpu: part({
        facets: { socket: "AM4", memoryType: "DDR4" },
        title: "Ryzen 5 5500",
      }),
    };
    expect(compatibilityFacetsForSlot("motherboard", selection)).toEqual({
      cpuPlatform: ["AMD AM4"],
    });
    expect(compatibilityLockLabels("motherboard", selection)[0]).toContain(
      "AM4",
    );
  });

  it("locks RAM to board/CPU generation and desktop DIMM", () => {
    const selection: BuilderSelection = {
      cpu: part({ facets: { socket: "AM5", memoryType: "DDR5" } }),
      motherboard: part({
        facets: { cpuPlatform: "AMD AM5", formFactor: "ATX" },
      }),
    };
    expect(compatibilityFacetsForSlot("memory", selection)).toEqual({
      memoryType: ["DDR5"],
      formFactor: ["Desktop (DIMM)"],
    });
  });

  it("derives DDR5 for AM5 when board omits memoryType", () => {
    expect(defaultMemoryTypeForPlatform("AMD AM5")).toBe("DDR5");
    expect(platformForSocket("AM5")).toBe("AMD AM5");
  });

  it("expands case support for smaller boards", () => {
    expect(caseSupportValuesForBoard("mATX")).toEqual([
      "mATX",
      "ATX",
      "E-ATX",
    ]);
  });

  it("prunes incompatible motherboard after CPU socket change", () => {
    const selection: BuilderSelection = {
      cpu: part({
        variantId: "cpu-am5",
        facets: { socket: "AM5" },
      }),
      motherboard: part({
        variantId: "mobo-am4",
        facets: { cpuPlatform: "AMD AM4", memoryType: "DDR4" },
      }),
      memory: part({
        variantId: "ram-ddr4",
        facets: { memoryType: "DDR4", formFactor: "Desktop (DIMM)" },
      }),
    };
    const pruned = pruneIncompatibleSelection(selection, "cpu");
    expect(pruned.motherboard).toBeUndefined();
    expect(pruned.memory).toBeUndefined();
    expect(pruned.cpu?.variantId).toBe("cpu-am5");
  });

  it("keeps matching RAM when motherboard stays compatible", () => {
    const selection: BuilderSelection = {
      cpu: part({ facets: { socket: "AM5", memoryType: "DDR5" } }),
      motherboard: part({
        facets: {
          cpuPlatform: "AMD AM5",
          memoryType: "DDR5",
          formFactor: "ATX",
        },
      }),
      memory: part({
        facets: { memoryType: "DDR5", formFactor: "Desktop (DIMM)" },
      }),
    };
    const pruned = pruneIncompatibleSelection(selection, "cpu");
    expect(pruned.motherboard).toBeDefined();
    expect(pruned.memory).toBeDefined();
  });

  it("filters out laptop RAM against desktop lock", () => {
    const filters = {
      memoryType: ["DDR5"],
      formFactor: ["Desktop (DIMM)"],
    };
    expect(
      partMatchesCompatibilityFacets(
        part({
          facets: {
            memoryType: "DDR5",
            formFactor: "Laptop (SO-DIMM)",
          },
        }),
        filters,
      ),
    ).toBe(false);
    expect(
      partMatchesCompatibilityFacets(
        part({
          facets: {
            memoryType: "DDR5",
            formFactor: "Desktop (DIMM)",
          },
        }),
        filters,
      ),
    ).toBe(true);
  });

  it("advances to the next empty required slot", () => {
    const selection: BuilderSelection = {
      cpu: part({ facets: { socket: "AM5" } }),
    };
    expect(nextEmptyBuilderSlot(selection, "cpu")).toBe("motherboard");
  });
});
