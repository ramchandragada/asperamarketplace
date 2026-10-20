import { z } from "zod";
import { checkPincodeServiceability } from "@/modules/fulfilment/pincode";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  postalCode: z.string().trim().min(1).max(12),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const body = bodySchema.parse(await request.json());
    const result = checkPincodeServiceability(body.postalCode);
    return jsonOk({ check: result }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
