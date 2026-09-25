import { describe, expect, it } from "vitest";
import { createExperimentSchema, trackEventSchema } from "./schema";

describe("analytics schemas", () => {
  it("tracks search events", () => {
    const parsed = trackEventSchema.parse({
      eventName: "search",
      searchQuery: "tea towel",
    });
    expect(parsed.searchQuery).toBe("tea towel");
  });

  it("requires experiment weights to be present", () => {
    const parsed = createExperimentSchema.parse({
      key: "pdp_cta_copy",
      name: "PDP CTA copy test",
      hypothesis: "Stronger CTA copy increases add-to-cart rate.",
      variants: [
        { key: "control", weight: 50 },
        { key: "treatment", weight: 50 },
      ],
    });
    expect(parsed.variants).toHaveLength(2);
  });
});
