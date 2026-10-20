import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SellerProductEditPanel } from "@/components/seller-product-edit-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { getSellerProduct } from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

export default async function SellerProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");
  const seller = await resolveSellerForActor(actor, "catalogue.write");
  if (!seller) {
    return (
      <EmptyState
        title="Catalogue access unavailable"
        description="Requires an approved seller and catalogue capability."
        action={
          <Link href="/seller/onboarding" className="text-sm underline">
            Onboarding
          </Link>
        }
      />
    );
  }

  const { id } = await params;
  const product = await getSellerProduct(actor, seller.id, id);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Edit product</h1>
        <p className="mt-2 text-muted">{product.title}</p>
      </div>
      <SellerProductEditPanel
        sellerId={seller.id}
        product={{
          id: product.id,
          title: product.title,
          summary: product.summary,
          description: product.description,
          status: product.status,
          statusReason: product.statusReason,
          images: product.images,
          variants: product.variants,
        }}
      />
    </div>
  );
}
