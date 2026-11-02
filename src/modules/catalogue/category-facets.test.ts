import { describe, expect, it } from "vitest";
import {
  CATALOGUE_FACET_OPTIONS,
  CATEGORY_FACET_CONFIGS,
  extractProductFacets,
  facetQueryEntries,
  getCategoryFacetConfig,
  mergeFacetOverrides,
  parseFacetSearchParams,
  scopeFacetsToCategory,
} from "@/modules/catalogue/category-facets";

describe("extractProductFacets", () => {
  it("extracts processor brand, tier, and socket", () => {
    expect(
      extractProductFacets({
        slug: "amd-ryzen-5-7600",
        title: "AMD Ryzen 5 7600 Processor",
        categorySlug: "processors",
      }),
    ).toMatchObject({
      brandFamily: "AMD Ryzen",
      tier: "Ryzen 5",
      socket: "AM5",
      memoryType: "DDR5",
    });
  });

  it("classifies RTX 50-series GPUs and GDDR7", () => {
    expect(
      extractProductFacets({
        slug: "msi-rtx-5070",
        title: "MSI Geforce RTX 5070 Ventus 2X OC 12G GDDR7 Graphics Card",
        categorySlug: "graphics-cards",
      }),
    ).toMatchObject({
      generation: "RTX 50-series",
      series: "RTX 5070",
      vram: "12 GB",
      memoryType: "GDDR7",
    });
  });

  it("normalizes GTX series spacing", () => {
    expect(
      extractProductFacets({
        slug: "nextron-gtx1650",
        title: "Nextron GTX1650 4GB GDDR6 Graphics Card",
        categorySlug: "graphics-cards",
      }).series,
    ).toBe("GTX 1650");
  });

  it("parses PSU wattage from model codes", () => {
    expect(
      extractProductFacets({
        slug: "ant-vs400l",
        title: "Ant Esports VS400L SMPS",
        categorySlug: "power-supplies",
      }),
    ).toMatchObject({
      wattage: "400 W",
      wattageBand: "Under 500 W",
    });
  });

  it("parses decimal SSD capacities without truncating", () => {
    expect(
      extractProductFacets({
        slug: "kingston-dc600m",
        title: "Kingston DC600M 3.84TB Enterprise SSD",
        categorySlug: "storage-ssd",
      }),
    ).toMatchObject({
      storageCapacity: "3.84 TB",
      storageCapacityBand: "Above 2 TB",
      storageInterface: "SSD",
    });
  });

  it("tags NAS enclosures", () => {
    expect(
      extractProductFacets({
        slug: "qnap-ts-253e",
        title: "QNAP TS-253E-8G 2-Bay Tower NAS Enclosure",
        categorySlug: "storage-ssd",
      }).storageInterface,
    ).toBe("NAS / enclosure");
  });

  it("adds monitor panel type, size bands, and refresh rate", () => {
    const facets = extractProductFacets({
      slug: "msi-oled",
      title: "MSI MAG 341CQP QD-OLED 34 Inch 165Hz Curved Gaming Monitor",
      categorySlug: "monitors",
    });
    expect(facets).toMatchObject({
      sizeBand: `34" & ultrawide`,
      panelType: "OLED",
      monitorUseCase: "Gaming",
      refreshRate: "165 Hz & above",
    });
    expect(facets).not.toHaveProperty("screenSize");
    expect(facets).not.toHaveProperty("socket");
  });

  it("tags PSU modularity and keyboard switch type", () => {
    expect(
      extractProductFacets({
        slug: "corsair-rm750",
        title: "Corsair RM750x Fully Modular Gold SMPS 750W",
        categorySlug: "power-supplies",
      }),
    ).toMatchObject({
      modularity: "Fully modular",
      efficiency: "Gold",
      wattage: "750 W",
    });
    expect(
      extractProductFacets({
        slug: "keychron-k2",
        title: "Keychron K2 Wireless Mechanical Keyboard",
        categorySlug: "keyboard-mouse",
      }),
    ).toMatchObject({
      switchType: "Mechanical",
      peripheralType: "Keyboard",
    });
  });

  it("merges admin facet overrides and scopes to category", () => {
    expect(
      mergeFacetOverrides(
        { socket: "AM5", tier: "Ryzen 5" },
        { socket: "AM4", integratedGraphics: "Yes", screenSize: "27\"" },
        "processors",
      ),
    ).toEqual({
      socket: "AM4",
      tier: "Ryzen 5",
      integratedGraphics: "Yes",
    });
    expect(
      mergeFacetOverrides({ socket: "AM5" }, { socket: "" }, "processors"),
    ).toEqual({});
  });

  it("normalizes laptop processor families from overrides", () => {
    const facets = extractProductFacets({
      slug: "msi-prestige-14-h-b12ucx-gaming-laptop-i5-12450hrtx-2050-4gb-gddr6",
      title: "MSI Prestige 14 H B12UCX Gaming Laptop (i5-12450H/RTX 2050 4GB GDDR6)",
      categorySlug: "laptops",
    });
    expect(facets.processor).toBe("Intel Core 5 / i5");
    expect(facets.graphics).toBe("Discrete GPU");
    expect(facets.ram).toBe("16 GB");
  });
});

describe("category-scoped facet keys", () => {
  it("keeps facet key sets disjoint across unrelated categories", () => {
    const byKey = new Map<string, string[]>();
    for (const config of CATEGORY_FACET_CONFIGS) {
      for (const facet of config.facets) {
        const cats = byKey.get(facet.key) ?? [];
        cats.push(config.categorySlug);
        byKey.set(facet.key, cats);
      }
    }
    // memoryType is intentionally shared across PC-build memory categories.
    const allowedShared = new Set(["memoryType"]);
    for (const [key, cats] of byKey) {
      if (allowedShared.has(key)) continue;
      expect(cats, `facet key "${key}" shared by ${cats.join(", ")}`).toHaveLength(
        1,
      );
    }
    expect(byKey.get("socket")).toEqual(["processors"]);
    expect(byKey.get("monitorUseCase")).toEqual(["monitors"]);
    expect(byKey.get("screenSize")).toEqual(["laptops"]);
  });

  it("strips foreign keys when scoping facets to a category", () => {
    expect(
      scopeFacetsToCategory("monitors", {
        sizeBand: `27"`,
        socket: "AM5",
        screenSize: `27"`,
        panelType: "OLED",
      }),
    ).toEqual({
      sizeBand: `27"`,
      panelType: "OLED",
    });
    expect(
      scopeFacetsToCategory("processors", {
        socket: "LGA 1700",
        panelType: "OLED",
        brandFamily: "Intel Core",
      }),
    ).toEqual({
      socket: "LGA 1700",
      brandFamily: "Intel Core",
    });
  });
});

describe("facet catalogue options", () => {
  it("exposes options for every configured category facet", () => {
    for (const config of CATEGORY_FACET_CONFIGS) {
      const options = CATALOGUE_FACET_OPTIONS[config.categorySlug] ?? {};
      for (const facet of config.facets) {
        const values = options[facet.key] ?? [];
        expect(Array.isArray(values)).toBe(true);
        if (
          ![
            "chipset",
            "series",
            "ramSpeed",
            "wattage",
            "storageCapacity",
            "upsCapacity",
            "screenSize",
            "coolerSize",
            "modularity",
            "refreshRate",
            "switchType",
            "memoryType",
          ].includes(facet.key)
        ) {
          expect(
            values.length,
            `${config.categorySlug}.${facet.key}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("returns config by slug", () => {
    expect(getCategoryFacetConfig("processors")?.facets[0]?.key).toBe(
      "brandFamily",
    );
    expect(getCategoryFacetConfig("unknown")).toBeNull();
  });
});

describe("facet URL helpers", () => {
  it("parses single and multi-value facet.* search params", () => {
    const params = new URLSearchParams(
      "facet.socket=AM5&facet.socket=AM4&facet.tier=Ryzen%205&q=test",
    );
    expect(parseFacetSearchParams(params)).toEqual({
      socket: ["AM4", "AM5"],
      tier: ["Ryzen 5"],
    });
  });

  it("parses comma-separated facet values and Next.js param records", () => {
    expect(
      parseFacetSearchParams({
        "facet.socket": ["AM5", "AM4"],
        "facet.generation": "RTX 50-series,RTX 40-series",
      }),
    ).toEqual({
      generation: ["RTX 40-series", "RTX 50-series"],
      socket: ["AM4", "AM5"],
    });
  });

  it("serializes multi-select facet entries as repeated keys", () => {
    expect(
      facetQueryEntries({
        tier: ["Ryzen 5", "Ryzen 7"],
        socket: ["AM5"],
      }),
    ).toEqual([
      ["facet.socket", "AM5"],
      ["facet.tier", "Ryzen 5"],
      ["facet.tier", "Ryzen 7"],
    ]);
  });
});
