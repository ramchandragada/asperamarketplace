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
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
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
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </main>
  );
}
