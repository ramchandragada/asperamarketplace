import type { RoleKey } from "@/modules/identity/roles";

export type Actor = {
  userId: string;
  email: string;
  displayName: string;
  roles: Array<{ key: RoleKey; sellerId: string | null }>;
  sessionId: string;
};

/** Server-enforced seller capabilities (not UI-only). */
export const SELLER_CAPABILITIES = [
  "dashboard.read",
  "catalogue.write",
  "fulfilment.write",
  "returns.review",
  "support.read",
  "finance.read",
  "analytics.read",
] as const;

export type SellerCapability = (typeof SELLER_CAPABILITIES)[number];

const OWNER_AND_OPS: RoleKey[] = ["seller_owner", "seller_operations"];
const OWNER_OPS_SUPPORT: RoleKey[] = [
  "seller_owner",
  "seller_operations",
  "seller_support",
];
const OWNER_AND_FINANCE: RoleKey[] = ["seller_owner", "seller_finance"];
const ANY_SELLER_STAFF: RoleKey[] = [
  "seller_owner",
  "seller_operations",
  "seller_finance",
  "seller_support",
];

const CAPABILITY_ROLES: Record<SellerCapability, readonly RoleKey[]> = {
  "dashboard.read": ANY_SELLER_STAFF,
  "catalogue.write": OWNER_AND_OPS,
  "fulfilment.write": OWNER_AND_OPS,
  "returns.review": OWNER_OPS_SUPPORT,
  "support.read": OWNER_OPS_SUPPORT,
  "finance.read": OWNER_AND_FINANCE,
  "analytics.read": ANY_SELLER_STAFF,
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

export function actorHasSellerStaffRole(
  actor: Actor,
  sellerId: string,
): boolean {
  return ANY_SELLER_STAFF.some((role) => actorHasRole(actor, role, sellerId));
}

export function actorHasSellerCapability(
  actor: Actor,
  sellerId: string,
  capability: SellerCapability,
): boolean {
  if (actorIsAdmin(actor)) {
    return true;
  }
  const allowed = CAPABILITY_ROLES[capability];
  return allowed.some((role) => actorHasRole(actor, role, sellerId));
}

export function requireSellerCapability(
  actor: Actor,
  sellerId: string,
  capability: SellerCapability,
): void {
  if (!actorHasSellerCapability(actor, sellerId, capability)) {
    throw new AuthorizationError(
      `Seller capability required: ${capability}`,
    );
  }
}

export function requireAdmin(actor: Actor): void {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
}

/** Seller IDs the actor can access for a given capability (excludes admin-all). */
export function sellerIdsForCapability(
  actor: Actor,
  capability: SellerCapability,
): string[] {
  const allowed = new Set(CAPABILITY_ROLES[capability]);
  const ids = new Set<string>();
  for (const entry of actor.roles) {
    if (entry.sellerId && allowed.has(entry.key)) {
      ids.add(entry.sellerId);
    }
  }
  return [...ids];
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
