import type { RoleKey } from "@/modules/identity/roles";

export type Actor = {
  userId: string;
  email: string;
  displayName: string;
  roles: Array<{ key: RoleKey; sellerId: string | null }>;
  sessionId: string;
};

export function actorHasRole(
  actor: Actor,
  role: RoleKey,
  sellerId?: string,
): boolean {
  return actor.roles.some((entry) => {
    if (entry.key !== role) {
      return false;
    }
    if (sellerId === undefined) {
      return true;
    }
    return entry.sellerId === sellerId;
  });
}

export function actorIsAdmin(actor: Actor): boolean {
  return actorHasRole(actor, "admin") || actorHasRole(actor, "super_admin");
}

export function actorOwnsSeller(actor: Actor, sellerId: string): boolean {
  return actorHasRole(actor, "seller_owner", sellerId);
}

export function requireAdmin(actor: Actor): void {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  readonly code = "UNAUTHENTICATED";

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}
