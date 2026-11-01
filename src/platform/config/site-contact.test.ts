import { describe, expect, it } from "vitest";
import { siteContact } from "@/platform/config/site-contact";

describe("siteContact", () => {
  it("exposes Aspera Technologies entity and real support contacts", () => {
    expect(siteContact.supportEmail).not.toMatch(/\.example|\.local|demo/i);
    expect(siteContact.supportPhoneDisplay).not.toMatch(/00000/);
    expect(siteContact.legalEntity).toBe(
      "Aspera Technologies Private Limited",
    );
    expect(siteContact.gstinRegular).toBe("27AAXCA0147N1Z4");
    expect(siteContact.gstinTcs).toBe("27AAXCA0147N1CF");
  });
});
