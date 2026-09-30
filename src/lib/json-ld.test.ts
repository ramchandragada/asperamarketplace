import { describe, expect, it } from "vitest";
import { safeJsonLd } from "./json-ld";

describe("safeJsonLd", () => {
  it("escapes script-breaking characters in seller-controlled text", () => {
    const html = safeJsonLd({
      name: "</script><script>alert(1)</script>",
    });
    expect(html).not.toContain("</");
    expect(html).toContain("\\u003c/script>");
  });
});
