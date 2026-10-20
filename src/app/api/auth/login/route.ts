import {
  loginUser,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/modules/identity/service";
import { loginSchema } from "@/modules/identity/schema";
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
    const body = loginSchema.parse(await request.json());
    const result = await loginUser(body, {
      ...requestMeta(request),
      correlationId: requestId,
    });

    if (result.kind === "totp_required") {
      return jsonOk(
        {
          requiresTotp: true,
          challengeToken: result.challengeToken,
          userId: result.userId,
        },
        requestId,
        { message: "Authenticator code required" },
      );
    }

    const jar = await cookies();
    const guestToken = jar.get(GUEST_CART_COOKIE)?.value;
    if (guestToken) {
      try {
        await mergeGuestCartIntoUser(guestToken, result.userId, requestId);
        await clearGuestCartCookie();
      } catch {
        // Sign-in must succeed even if guest-cart merge fails (DB blip, etc.).
      }
    }

    const response = jsonOk(
      {
        userId: result.userId,
        expiresAt: result.expiresAt.toISOString(),
        requiresTotp: false,
      },
      requestId,
      { message: "Signed in" },
    );
    response.cookies.set(
      SESSION_COOKIE,
      result.token,
      sessionCookieOptions(result.expiresAt),
    );
    return response;
  } catch (error) {
    return jsonError(requestId, error);
  }
}
