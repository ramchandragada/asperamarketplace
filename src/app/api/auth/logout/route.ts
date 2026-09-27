import {
  logoutSession,
  SESSION_COOKIE,
} from "@/modules/identity/service";
import { getRequestId, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  await logoutSession(token);
  const response = jsonOk({ signedOut: true }, requestId, {
    message: "Signed out",
  });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
