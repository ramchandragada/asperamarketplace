import { describe, expect, it } from "vitest";
import {
  hashPassword,
  hashSessionToken,
  maskGstin,
  maskPan,
  verifyPassword,
} from "@/modules/identity/crypto";

describe("identity crypto", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("AsperaSellerDevOnly1!");
    await expect(verifyPassword("AsperaSellerDevOnly1!", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("masks PAN and GSTIN", () => {
    expect(maskPan("ABCDE1234F")).toBe("234F");
    expect(maskGstin("29ABCDE1234F1Z5")).toBe("29****F1Z5");
  });

  it("hashes session tokens", () => {
    expect(hashSessionToken("abc")).toHaveLength(64);
  });
});
