import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountBusinessForm } from "@/components/account-business-form";
import { getBuyerProfile } from "@/modules/account/service";
import { listAddresses } from "@/modules/cart/service";
import { maskGstin } from "@/modules/identity/crypto";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Business settings" };

export default async function AccountBusinessPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/business");
  }
  const [profile, addresses] = await Promise.all([
    getBuyerProfile(actor),
    listAddresses(actor),
  ]);
  const defaultAddress =
    addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Account settings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Business & purchase settings
        </h1>
        <p className="mt-2 text-muted">
          GSTIN, tax invoice preference, and default checkout options for
          business buyers.
        </p>
      </div>

      <AccountBusinessForm
        initial={
          profile
            ? {
                businessName: profile.businessName,
                gstinMasked: profile.gstin ? maskGstin(profile.gstin) : null,
                hasGstin: Boolean(profile.gstin),
                taxInvoicePreferred: profile.taxInvoicePreferred,
                preferredPaymentMethod: profile.preferredPaymentMethod,
              }
            : null
        }
        defaultAddressLabel={
          defaultAddress
            ? `${defaultAddress.label} · ${defaultAddress.city}`
            : null
        }
      />

      <p className="text-sm">
        <Link href="/account/addresses" className="underline">
          Manage addresses
        </Link>
      </p>
    </div>
  );
}
