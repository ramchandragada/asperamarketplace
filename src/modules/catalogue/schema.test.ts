import { describe, expect, it } from "vitest";
import { createProductSchema } from "@/modules/catalogue/schema";

const validDraft = {
  sellerId: "11111111-1111-4111-8111-111111111111",
  categoryId: "22222222-2222-4222-8222-222222222222",
  title: "Studio Loom sample bottle",
  summary: "Reusable bottle for the daily commute.",
  description: "A fictional listing long enough to satisfy the catalogue description rule.",
  variant: {
    sku: "SLM-TEST-01",
    title: "750 ml",
    mrpPaise: 10000,
    sellingPricePaise: 8000,
    initialStock: 4,
  },
};

describe("createProductSchema image URL", () => {
  it("accepts an https Unsplash photo", () => {
    const parsed = createProductSchema.parse({
      ...validDraft,
      imageUrl:
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
    });
    expect(parsed.imageUrl).toContain("images.unsplash.com");
  });

  it("rejects image hosts outside the storefront allow list", () => {
    const result = createProductSchema.safeParse({
      ...validDraft,
      imageUrl: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(false);
  });
});
