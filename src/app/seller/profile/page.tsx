import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store profile" };

export default async function SellerProfilePage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "dashboard.read");
  if (!seller) {
    return (
      <EmptyState
        title="No store profile"
        description="Create a seller profile from onboarding."
        action={
          <Link href="/seller/onboarding" className="text-sm underline">
            Onboarding
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold">Store profile</h1>
        <p className="mt-2 text-sm text-muted">
          Public-facing trade details. Sensitive document numbers stay masked.
        </p>
      </header>
      <Card className="space-y-2 p-4 text-sm">
        <p className="text-lg font-semibold">
          {seller.tradeName ?? seller.legalName}
        </p>
        <p>{seller.legalName}</p>
        <Badge tone={seller.status === "approved" ? "success" : "warning"}>
          {seller.status}
        </Badge>
        <p className="text-muted">Contact {seller.contactEmail}</p>
        {seller.registeredState ? (
          <p className="text-muted">Registered state: {seller.registeredState}</p>
        ) : null}
        {seller.gstinMasked ? (
          <p className="text-muted">GSTIN (masked): {seller.gstinMasked}</p>
        ) : null}
        {seller.panLast4 ? (
          <p className="text-muted">PAN last4: {seller.panLast4}</p>
        ) : null}
        {seller.pickupCity ? (
          <p className="text-muted">
            Pickup: {seller.pickupLine1 ? `${seller.pickupLine1}, ` : ""}
            {seller.pickupCity}
            {seller.pickupPostalCode ? ` ${seller.pickupPostalCode}` : ""}
          </p>
        ) : null}
        {seller.bankIfsc ? (
          <p className="text-muted">
            Payout: {seller.bankAccountHolder ?? "—"} · {seller.bankName ?? "Bank"}{" "}
            · IFSC {seller.bankIfsc}
            {seller.bankAccountLast4
              ? ` · ****${seller.bankAccountLast4}`
              : ""}
          </p>
        ) : (
          <p className="text-warning">
            Add payout bank details during onboarding so settlements can be paid.
          </p>
        )}
      </Card>
      <Link href="/seller/onboarding" className="text-sm underline">
        Edit via onboarding
      </Link>
    </div>
  );
}
