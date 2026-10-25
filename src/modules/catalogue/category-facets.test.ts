import { describe, expect, it } from "vitest";
import {
  CATALOGUE_FACET_OPTIONS,
  CATEGORY_FACET_CONFIGS,
  extractProductFacets,
  facetQueryEntries,
  getCategoryFacetConfig,
  parseFacetSearchParams,
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
      capacity: "3.84 TB",
      capacityBand: "Above 2 TB",
      interface: "SSD",
    });
  });

  it("tags NAS enclosures", () => {
    expect(
      extractProductFacets({
        slug: "qnap-ts-253e",
        title: "QNAP TS-253E-8G 2-Bay Tower NAS Enclosure",
        categorySlug: "storage-ssd",
      }).interface,
    ).toBe("NAS / enclosure");
  });

  it("adds monitor panel type and size bands", () => {
    expect(
      extractProductFacets({
        slug: "msi-oled",
        title: "MSI MAG 341CQP QD-OLED 34 Inch Curved Gaming Monitor",
        categorySlug: "monitors",
      }),
    ).toMatchObject({
      sizeBand: `34" & ultrawide`,
      panelType: "OLED",
      useCase: "Gaming",
    });
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

describe("facet catalogue options", () => {
  it("exposes options for every configured category facet", () => {
    for (const config of CATEGORY_FACET_CONFIGS) {
      const options = CATALOGUE_FACET_OPTIONS[config.categorySlug] ?? {};
      for (const facet of config.facets) {
        const values = options[facet.key] ?? [];
        expect(Array.isArray(values)).toBe(true);
        // Primary facets should have at least one real catalogue value
        if (
          ![
            "chipset",
            "series",
            "speed",
            "wattage",
            "capacity",
            "screenSize",
            "size",
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
  it("parses facet.* search params", () => {
    const params = new URLSearchParams(
      "facet.socket=AM5&facet.tier=Ryzen%205&q=test",
    );
    expect(parseFacetSearchParams(params)).toEqual({
      socket: "AM5",
      tier: "Ryzen 5",
    });
  });

  it("serializes facet entries stably", () => {
    expect(
      facetQueryEntries({ tier: "Ryzen 5", socket: "AM5" }),
    ).toEqual([
      ["facet.socket", "AM5"],
      ["facet.tier", "Ryzen 5"],
    ]);
  });
});
