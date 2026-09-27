import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const GUEST_CART_COOKIE = "aspera_guest_cart";

export type CartIdentity =
  | { type: "user"; userId: string }
  | { type: "guest"; guestToken: string };

export function guestCartCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Read existing guest token from the cookie jar (no create). */
export async function readGuestCartToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GUEST_CART_COOKIE)?.value ?? null;
}

/**
 * Ensure a guest cart cookie exists and return a CartIdentity.
 * Call only from Route Handlers / Server Actions that may mutate cookies.
 */
export async function ensureGuestCartIdentity(): Promise<CartIdentity> {
  const jar = await cookies();
  const existing = jar.get(GUEST_CART_COOKIE)?.value;
  if (existing) {
    return { type: "guest", guestToken: existing };
  }
  const guestToken = randomUUID();
  jar.set(GUEST_CART_COOKIE, guestToken, guestCartCookieOptions());
  return { type: "guest", guestToken };
}

export async function clearGuestCartCookie() {
  const jar = await cookies();
  jar.delete(GUEST_CART_COOKIE);
}
