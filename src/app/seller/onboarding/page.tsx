import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerOnboardingPanel } from "@/components/seller-onboarding-panel";
import { getOptionalActor } from "@/modules/identity/service";
import { listOwnedSellers } from "@/modules/seller/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller onboarding · Aspera Marketplace" };

export default async function SellerOnboardingPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  const sellers = await listOwnedSellers(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Seller onboarding
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Apply as a seller</h1>
        <p className="mt-2 text-muted">
          Signed in as {actor.displayName}. PAN and GSTIN are stored masked.
          Upload only fictional sample documents.
        </p>
      </div>
      <SellerOnboardingPanel initialSellers={sellers} />
      <p className="text-sm">
        <Link href="/seller" className="underline">
          Seller dashboard
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </div>
  );
}
