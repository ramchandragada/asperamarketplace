import {
  loginUser,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/modules/identity/service";
import { loginSchema } from "@/modules/identity/schema";
import { getRequestId, jsonError, jsonOk, requestMeta } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const body = loginSchema.parse(await request.json());
    const session = await loginUser(body, {
      ...requestMeta(request),
      correlationId: requestId,
    });
    const response = jsonOk(
      {
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      },
      requestId,
      { message: "Signed in" },
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
