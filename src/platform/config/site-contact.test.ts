import { describe, expect, it } from "vitest";
import { siteContact } from "@/platform/config/site-contact";

describe("siteContact", () => {
  it("exposes real support contacts without demo placeholders", () => {
    expect(siteContact.supportEmail).not.toMatch(/\.example|\.local|demo/i);
    expect(siteContact.supportPhoneDisplay).not.toMatch(/00000/);
    expect(siteContact.legalEntity).toContain("Aspera");
  });
});
