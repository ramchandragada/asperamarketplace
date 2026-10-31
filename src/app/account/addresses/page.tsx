import { redirect } from "next/navigation";
import { AccountAddressesPanel } from "@/components/account-addresses-panel";
import { listAddresses } from "@/modules/cart/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Addresses" };

export default async function AccountAddressesPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/addresses");
  }
  const addresses = await listAddresses(actor);

  return (
    <>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Account settings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Your Addresses
        </h1>
        <p className="mt-2 text-muted">
          Add or manage delivery addresses used at checkout.
        </p>
      </div>

      <AccountAddressesPanel
        initialAddresses={addresses.map((address) => ({
          id: address.id,
          label: address.label,
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          isDefault: address.isDefault,
        }))}
      />
    </>
  );
}
