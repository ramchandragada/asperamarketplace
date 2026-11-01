import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { SellerOnboardingPanel } from "@/components/seller-onboarding-panel";
import { redirectToLogin } from "@/lib/login-redirect";
import { actorCanStartSellerApplication } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";
import { listOwnedSellers } from "@/modules/seller/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller onboarding" };

export default async function SellerOnboardingPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    await redirectToLogin("/seller/onboarding");
  }
  if (!actor) return null;
  const sellers = await listOwnedSellers(actor);
  const canApply = actorCanStartSellerApplication(actor);

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
      {canApply ? (
        <SellerOnboardingPanel initialSellers={sellers} />
      ) : (
        <div
          role="status"
          className="rounded-[var(--radius)] border border-border bg-surface p-5"
        >
          <p className="font-semibold">This login cannot start a new shop</p>
          <p className="mt-2 text-sm text-muted">
            You are signed in with a seller staff account (ops / finance /
            support). Those accounts already belong to an existing seller and
            cannot open a new KYC application.
          </p>
          <p className="mt-3 text-sm text-muted">
            Sign out, then register or sign in with a{" "}
            <strong>customer</strong> account to apply. Or open Seller Central
            if you need the shop you already work for.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <LogoutButton />
            <Link
              href="/register?next=%2Fseller%2Fonboarding"
              className="underline"
            >
              Register a customer account
            </Link>
            <Link href="/seller" className="underline">
              Seller dashboard
            </Link>
          </div>
        </div>
      )}
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
