import { describe, expect, it } from "vitest";
import {
  createAdminCatalogueProductSchema,
  updateAdminCatalogueProductSchema,
  updateSellerProductSchema,
} from "@/modules/catalogue/schema";

const PRODUCT = "11111111-1111-4111-8111-111111111111";
const CATEGORY = "22222222-2222-4222-8222-222222222222";
const VARIANT = "33333333-3333-4333-8333-333333333333";
const SELLER = "44444444-4444-4444-8444-444444444444";

describe("closed catalogue schemas", () => {
  it("accepts admin catalogue create with Unsplash image", () => {
    const parsed = createAdminCatalogueProductSchema.parse({
      categoryId: CATEGORY,
      title: "AMD Ryzen 5 5600",
      summary: "Six-core desktop CPU for gaming builds.",
      description:
        "Fictional admin catalogue SKU used to validate closed-catalogue authoring rules.",
      imageUrl:
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
      variant: {
        sku: "CPU-R5-5600",
        title: "Tray",
        mrpPaise: 1599900,
        sellingPricePaise: 1299900,
      },
    });
    expect(parsed.variant.sku).toBe("CPU-R5-5600");
  });

  it("rejects seller content fields on update schema", () => {
    const parsed = updateSellerProductSchema.parse({
      sellerId: SELLER,
      productId: PRODUCT,
      title: "Should be ignored",
      variant: { id: VARIANT, onHand: 4, sellingPricePaise: 99900 },
    });
    expect(parsed.variant?.onHand).toBe(4);
    expect("title" in parsed).toBe(false);
  });

  it("accepts admin catalogue identity updates", () => {
    const parsed = updateAdminCatalogueProductSchema.parse({
      productId: PRODUCT,
      title: "Updated catalogue title for SKU",
      status: "archived",
    });
    expect(parsed.title).toContain("Updated");
    expect(parsed.status).toBe("archived");
  });
});
