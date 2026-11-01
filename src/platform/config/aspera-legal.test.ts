import { describe, expect, it } from "vitest";
import { asperaLegal, imprintLines } from "@/platform/config/aspera-legal";
import { siteContact } from "@/platform/config/site-contact";

describe("asperaLegal", () => {
  it("uses Aspera Technologies Private Limited — never Marketplace Private Limited", () => {
    expect(asperaLegal.legalEntity).toBe(
      "Aspera Technologies Private Limited",
    );
    expect(asperaLegal.legalEntity).not.toMatch(/Marketplace Private Limited/i);
    expect(siteContact.legalEntity).toBe(asperaLegal.legalEntity);
  });

  it("exposes CIN, PAN, Regular GSTIN, and TCS GSTIN", () => {
    expect(asperaLegal.cin).toBe("U72900PN2022PTC211370");
    expect(asperaLegal.pan).toBe("AAXCA0147N");
    expect(asperaLegal.gstinRegular).toBe("27AAXCA0147N1Z4");
    expect(asperaLegal.gstinTcs).toBe("27AAXCA0147N1CF");
  });

  it("uses Solapur TCS PPoB from GST records", () => {
    const joined = asperaLegal.tcsPpob.lines.join(" ");
    expect(joined).toMatch(/PANJWANI MARKET/i);
    expect(joined).toMatch(/SOLAPUR/i);
    expect(asperaLegal.tcsPpob.pincode).toBe("413006");
  });

  it("imprint lines include both GSTINs", () => {
    const lines = imprintLines().join(" | ");
    expect(lines).toContain(asperaLegal.gstinRegular);
    expect(lines).toContain(asperaLegal.gstinTcs);
    expect(lines).toContain(asperaLegal.cin);
  });

  it("exposes real support contacts without demo placeholders", () => {
    expect(asperaLegal.supportEmail).not.toMatch(/\.example|\.local|demo/i);
    expect(asperaLegal.supportPhoneDisplay).not.toMatch(/00000/);
    expect(asperaLegal.grievanceOfficer.name).toBe("Ramchandra Gada");
    expect(asperaLegal.supportEmail).toBe("support@asperamarketplace.com");
    expect(asperaLegal.supportPhoneDisplay).toBe("+91 80 4680 1200");
  });
});
