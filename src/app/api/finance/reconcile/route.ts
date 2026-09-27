import { requireActor } from "@/modules/identity/service";
import {
  createReconciliationSchema,
  resolveReconciliationSchema,
} from "@/modules/finance/schema";
import {
  createReconciliationException,
  listReconciliationExceptions,
  resolveReconciliationException,
} from "@/modules/finance/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const exceptions = await listReconciliationExceptions(actor);
    return jsonOk({ exceptions }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const json = await request.json();
    if (json && typeof json === "object" && "exceptionId" in json) {
      const body = resolveReconciliationSchema.parse(json);
      const exception = await resolveReconciliationException(
        actor,
        body,
        requestId,
      );
      return jsonOk({ exception }, requestId, {
        message: "Reconciliation exception closed",
      });
    }
    const body = createReconciliationSchema.parse(json);
    const exception = await createReconciliationException(
      actor,
      body,
      requestId,
    );
    return jsonOk({ exception }, requestId, {
      status: 201,
      message: "Reconciliation exception opened",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
