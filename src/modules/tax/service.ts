import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { TAX_POLICY } from "@/modules/cart/pricing";

async function upsertTaxProfile(
  args: Prisma.TaxProfileUpsertArgs,
): Promise<void> {
  try {
    await prisma.taxProfile.upsert(args);
  } catch (error) {
    // Parallel checkout/integration tests can race on first create.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    throw error;
  }
}

export async function ensureDefaultTaxProfiles() {
  await upsertTaxProfile({
    where: { key: TAX_POLICY.key },
    create: {
      key: TAX_POLICY.key,
      name: "India GST (CGST/SGST/IGST)",
      description:
        "Active GST profile: splits CGST+SGST for intra-state and IGST for inter-state based on seller registered state vs ship-to state.",
      rateBps: TAX_POLICY.rateBps,
      active: true,
      version: TAX_POLICY.version,
      explanation: TAX_POLICY.explanation,
    },
    update: {
      name: "India GST (CGST/SGST/IGST)",
      description:
        "Active GST profile: splits CGST+SGST for intra-state and IGST for inter-state based on seller registered state vs ship-to state.",
      rateBps: TAX_POLICY.rateBps,
      version: TAX_POLICY.version,
      explanation: TAX_POLICY.explanation,
      active: true,
    },
  });

  // Retire the old placeholder profile if it is still marked active.
  await prisma.taxProfile.updateMany({
    where: { key: "india_placeholder_gst_trace", active: true },
    data: { active: false },
  });

  await upsertTaxProfile({
    where: { key: "india_exempt_placeholder" },
    create: {
      key: "india_exempt_placeholder",
      name: "Exempt / zero rate",
      description: "Inactive alternative tax profile.",
      rateBps: 0,
      active: false,
      version: 1,
      explanation:
        "Zero-rate profile for engineering tests. Do not treat as legally exempt merchandise.",
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
