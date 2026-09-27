import {
  registerUser,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/modules/identity/service";
import { registerSchema } from "@/modules/identity/schema";
import { getRequestId, jsonError, jsonOk, requestMeta } from "@/platform/http/respond";
import {
  clearGuestCartCookie,
  GUEST_CART_COOKIE,
} from "@/modules/cart/guest";
import { mergeGuestCartIntoUser } from "@/modules/cart/service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const body = registerSchema.parse(await request.json());
    const session = await registerUser(body, {
      ...requestMeta(request),
      correlationId: requestId,
    });

    const jar = await cookies();
    const guestToken = jar.get(GUEST_CART_COOKIE)?.value;
    if (guestToken) {
      await mergeGuestCartIntoUser(guestToken, session.userId, requestId);
      await clearGuestCartCookie();
    }

    const response = jsonOk(
      {
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      },
      requestId,
      { status: 201, message: "Account created" },
    );
    response.cookies.set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(session.expiresAt),
    );
    return response;
  } catch (error) {
    return jsonError(requestId, error);
  }
}
