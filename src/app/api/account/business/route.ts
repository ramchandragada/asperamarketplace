import {
  getBuyerProfile,
  upsertBuyerProfile,
} from "@/modules/account/service";
import { updateBuyerProfileSchema } from "@/modules/account/schema";
import { maskGstin } from "@/modules/identity/crypto";
import { requireActor } from "@/modules/identity/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

function serialize(profile: Awaited<ReturnType<typeof getBuyerProfile>>) {
  if (!profile) return null;
  return {
    id: profile.id,
    businessName: profile.businessName,
    gstinMasked: profile.gstin ? maskGstin(profile.gstin) : null,
    hasGstin: Boolean(profile.gstin),
    taxInvoicePreferred: profile.taxInvoicePreferred,
    preferredPaymentMethod: profile.preferredPaymentMethod,
  };
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const profile = await getBuyerProfile(actor);
    return jsonOk({ profile: serialize(profile) }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = updateBuyerProfileSchema.parse(await request.json());
    const profile = await upsertBuyerProfile(actor, body, requestId);
    return jsonOk(
      { profile: serialize(profile) },
      requestId,
      { message: "Business settings saved" },
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
