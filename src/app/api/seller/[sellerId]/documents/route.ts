import { requireActor } from "@/modules/identity/service";
import { z } from "zod";
import {
  uploadSellerDocument,
  ValidationError,
} from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const metaSchema = z.object({
  documentType: z.string().trim().min(2).max(64),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ sellerId: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { sellerId } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const documentType = metaSchema.parse({
      documentType: String(form.get("documentType") ?? ""),
    }).documentType;

    if (!(file instanceof File)) {
      throw new ValidationError("A file is required");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const document = await uploadSellerDocument({
      actor,
      sellerId,
      documentType,
      fileName: file.name || "document.pdf",
      contentType: file.type || "application/pdf",
      bytes,
      correlationId: requestId,
    });

    return jsonOk({ document }, requestId, {
      status: 201,
      message: "Document uploaded",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
