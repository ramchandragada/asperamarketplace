import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/safe-path";

/**
 * Server-side login redirect that always preserves a safe `next` path
 * (URL-encoded) so deep links survive the auth wall.
 */
export async function redirectToLogin(fallbackNext = "/account"): Promise<never> {
  const headerList = await headers();
  const path = headerList.get("x-aspera-pathname");
  const next =
    safeInternalPath(path && path.startsWith("/") ? path : null) ?? fallbackNext;
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
