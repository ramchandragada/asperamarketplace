import { prisma } from "@/platform/db/prisma";
import { TAX_POLICY } from "@/modules/cart/pricing";

export async function ensureDefaultTaxProfiles() {
  await prisma.taxProfile.upsert({
    where: { key: TAX_POLICY.key },
    create: {
      key: TAX_POLICY.key,
      name: "India placeholder GST trace",
      description:
        "Development-only placeholder. Not a legal GST/TCS determination. A-21 and A-24 remain open.",
      rateBps: TAX_POLICY.rateBps,
      active: true,
      version: TAX_POLICY.version,
      explanation: TAX_POLICY.explanation,
    },
    update: {
      name: "India placeholder GST trace",
      description:
        "Development-only placeholder. Not a legal GST/TCS determination. A-21 and A-24 remain open.",
      explanation: TAX_POLICY.explanation,
    },
  });

  await prisma.taxProfile.upsert({
    where: { key: "india_exempt_placeholder" },
    create: {
      key: "india_exempt_placeholder",
      name: "Exempt / zero placeholder",
      description: "Inactive alternative profile for configuration drills.",
      rateBps: 0,
      active: false,
      version: 1,
      explanation:
        "Zero-rate placeholder for engineering tests. Do not treat as legally exempt merchandise.",
    },
    update: {},
  });
}

export async function resolveActiveTaxPolicy() {
  await ensureDefaultTaxProfiles();
  const active = await prisma.taxProfile.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!active) {
    return {
      key: TAX_POLICY.key,
      version: TAX_POLICY.version,
      rateBps: TAX_POLICY.rateBps,
      explanation: TAX_POLICY.explanation,
    };
  }
  return {
    key: active.key,
    version: active.version,
    rateBps: active.rateBps,
    explanation: active.explanation,
  };
}

export async function listTaxProfiles() {
  await ensureDefaultTaxProfiles();
  return prisma.taxProfile.findMany({ orderBy: { key: "asc" } });
}
