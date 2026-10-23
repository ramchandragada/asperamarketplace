/**
 * One-off admin endpoint to reseed the catalogue as a Pune PC marketplace.
 * Admin-only + an explicit confirmation token. Intended to be run once and
 * then removed. See src/modules/catalogue/seed-pc.ts.
 */
import { getOptionalActor } from "@/modules/identity/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";
import { seedPcCatalogue } from "@/modules/catalogue/seed-pc";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CONFIRM = "RESET-TO-PUNE-PC";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await getOptionalActor();
    if (!actor || !actorIsAdmin(actor)) {
      return jsonOk(
        { ok: false },
        requestId,
        { status: 403, message: "Admin only" },
      );
    }
    const body = (await request.json().catch(() => ({}))) as {
      confirm?: string;
    };
    if (body?.confirm !== CONFIRM) {
      return jsonOk(
        { ok: false },
        requestId,
        { status: 400, message: `Pass { "confirm": "${CONFIRM}" } to proceed` },
      );
    }
    const result = await seedPcCatalogue(prisma);
    return jsonOk(result, requestId, {
      message: "Catalogue reseeded as a Pune PC marketplace",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
