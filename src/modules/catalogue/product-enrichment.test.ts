import { describe, expect, it } from "vitest";
import { enrichProduct } from "@/modules/catalogue/product-enrichment";

describe("enrichProduct", () => {
  it("uses MD Computers overrides for Prestige 14 H", () => {
    const enriched = enrichProduct({
      slug: "msi-prestige-14-h-b12ucx-gaming-laptop-i5-12450hrtx-2050-4gb-gddr6",
      title: "MSI Prestige 14 H B12UCX Gaming Laptop (i5-12450H/RTX 2050 4GB GDDR6)",
      categorySlug: "laptops",
      brandSlug: "msi",
      brandName: "MSI",
    });
    expect(enriched.source).toBe("mdcomputers");
    expect(enriched.highlights.length).toBeGreaterThanOrEqual(5);
    expect(
      enriched.specificationGroups.some((g) =>
        g.rows.some((r) => /RTX 2050/i.test(r.value)),
      ),
    ).toBe(true);
    expect(enriched.warranty.summary).toMatch(/2 Year/i);
  });

  it("derives GPU specs from title", () => {
    const enriched = enrichProduct({
      slug: "msi-geforce-rtx-3050-ventus-2x-e-6gb-oc-gddr6-graphics-card",
      title: "MSI GeForce RTX 3050 Ventus 2X E 6GB OC GDDR6 Graphics Card",
      categorySlug: "graphics-cards",
      brandSlug: "msi",
    });
    expect(enriched.source).toBe("derived");
    expect(enriched.specificationGroups.length).toBeGreaterThan(0);
    expect(enriched.cardBullets.length).toBeGreaterThan(0);
  });

  it("derives processor socket hints for Ryzen", () => {
    const enriched = enrichProduct({
      slug: "amd-ryzen-5-5600x-processor",
      title: "AMD Ryzen 5 5600X Processor",
      categorySlug: "processors",
      brandSlug: "amd",
    });
    expect(enriched.summary.toLowerCase()).toContain("processors");
    expect(
      enriched.specificationGroups.some((g) =>
        g.rows.some((r) => r.key === "Socket"),
      ),
    ).toBe(true);
  });
});
