import { describe, expect, it } from "vitest";
import { assertUuid, HttpValidationError, isUuid } from "@/platform/http/errors";
import { canTransitionProductStatus } from "@/modules/catalogue/helpers";

describe("seller products API guards", () => {
  it("rejects invalid product ids before Prisma", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(() => assertUuid("not-a-uuid", "id")).toThrow(HttpValidationError);
    try {
      assertUuid("nav-1og", "id");
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpValidationError);
      expect((error as HttpValidationError).fieldErrors?.id?.[0]).toMatch(
        /UUID/i,
      );
    }
  });

  it("accepts valid UUIDs", () => {
    const id = "40d917bc-14ab-4171-b988-e621255ab137";
    expect(isUuid(id)).toBe(true);
    expect(() => assertUuid(id, "id")).not.toThrow();
  });

  it("allows approved listings to return to submitted for content edits", () => {
    expect(canTransitionProductStatus("approved", "submitted")).toBe(true);
  });
});
