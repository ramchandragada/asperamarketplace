import { z } from "zod";
import { requireActor } from "@/modules/identity/service";
import { lookupGstinProfile } from "@/modules/seller/gstin";
import { createSellerDraftSchema } from "@/modules/seller/schema";
import { ValidationError } from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  gstin: createSellerDraftSchema.shape.gstin,
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    await requireActor();
    const body = bodySchema.parse(await request.json());
    const profile = await lookupGstinProfile(body.gstin);
    if (!profile) {
      throw new ValidationError("Enter a valid Regular GSTIN");
    }
    return jsonOk(
      {
        profile: {
          gstin: profile.gstin,
          pan: profile.pan,
          registeredState: profile.registeredState,
          legalName: profile.legalName,
          tradeName: profile.tradeName,
          taxpayerType: profile.taxpayerType,
          status: profile.status,
          city: profile.city,
          source: profile.source,
        },
      },
      requestId,
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
