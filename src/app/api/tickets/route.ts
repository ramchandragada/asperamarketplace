import { requireActor } from "@/modules/identity/service";
import { createTicketSchema } from "@/modules/fulfilment/schema";
import {
  createSupportTicket,
  listTicketsForActor,
} from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const tickets = await listTicketsForActor(actor);
    return jsonOk({ tickets }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createTicketSchema.parse(await request.json());
    const ticket = await createSupportTicket(actor, body, requestId);
    return jsonOk({ ticket }, requestId, {
      status: 201,
      message: "Support ticket opened",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
