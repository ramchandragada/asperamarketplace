import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller compliance · Aspera Marketplace" };

export default async function SellerCompliancePage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "dashboard.read");
  if (!seller) {
    return (
      <EmptyState
        title="No seller profile"
        description="Compliance cues appear after seller onboarding."
      />
    );
  }

  const taxProfile = await prisma.taxProfile.findFirst({
    where: { active: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold">Tax & compliance</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Operational status only. This screen is not legal approval, GST advice,
          or completion of assumptions A-20–A-28.
        </p>
      </header>
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone={seller.status === "approved" ? "success" : "warning"}>
            KYC {seller.status}
          </Badge>
          {seller.gstinMasked ? (
            <Badge tone="info">GSTIN on file (masked)</Badge>
          ) : (
            <Badge tone="warning">GSTIN missing</Badge>
          )}
        </div>
        <p className="text-sm">
          Active tax profile:{" "}
          {taxProfile
            ? `${taxProfile.name} (${taxProfile.key}) — configurable placeholder`
            : "None configured"}
        </p>
        <p className="text-xs text-muted">
          Platform compliance evidence is tracked in COMPLIANCE_REGISTER.md for
          operators—not displayed as a customer-facing “legally approved” badge.
        </p>
      </Card>
      <Link href="/seller/onboarding" className="text-sm underline">
        Update KYC / onboarding
      </Link>
    </div>
  );
}
