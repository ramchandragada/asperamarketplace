import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerFulfilmentPanel } from "@/components/seller-fulfilment-panel";
import { getOptionalActor } from "@/modules/identity/service";
import {
  listReturnsForSeller,
  listSellerFulfilment,
} from "@/modules/fulfilment/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller fulfilment · Aspera Marketplace" };

export default async function SellerFulfilmentPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }

  const seller = await prisma.seller.findFirst({
    where: {
      ownerUserId: actor.userId,
      status: "approved",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!seller) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold">Seller fulfilment</h1>
        <p className="text-muted">
          An approved seller profile is required before fulfilling orders.
        </p>
        <Link href="/seller/onboarding" className="underline">
          Go to seller onboarding
        </Link>
      </main>
    );
  }

  const [groups, returns] = await Promise.all([
    listSellerFulfilment(actor, seller.id),
    listReturnsForSeller(actor, seller.id),
  ]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Seller
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Fulfilment</h1>
        <p className="mt-2 text-muted">
          Process, ship, deliver, or cancel paid groups for{" "}
          {seller.tradeName ?? seller.legalName}. Mock logistics only.
        </p>
      </div>
      <SellerFulfilmentPanel
        sellerId={seller.id}
        initialGroups={groups}
        initialReturns={returns}
      />
      <p className="text-sm">
        <Link href="/seller/catalogue" className="underline">
          Catalogue
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </main>
  );
}
