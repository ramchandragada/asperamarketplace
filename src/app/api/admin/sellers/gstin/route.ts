import { requireActor } from "@/modules/identity/service";
import { adminSetSellerGstinSchema } from "@/modules/seller/schema";
import { adminSetSellerGstin } from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = adminSetSellerGstinSchema.parse(await request.json());
    const result = await adminSetSellerGstin(actor, body, requestId);
    return jsonOk(
      {
        seller: {
          id: result.seller.id,
          status: result.seller.status,
          gstinMasked: result.seller.gstinMasked,
          version: result.seller.version,
        },
        republished: result.republished,
      },
      requestId,
      {
        message:
          result.republished > 0
            ? `GSTIN saved; ${result.republished} listing(s) republished`
            : "GSTIN saved",
      },
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
