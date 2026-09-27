import { prisma } from "@/platform/db/prisma";
import {
  actorIsAdmin,
  sellerIdsForCapability,
  type Actor,
  type SellerCapability,
} from "@/modules/identity/policy";

/**
 * Resolve an approved seller the actor may access for a capability.
 * Prefers preferredSellerId; otherwise first scoped role match, then owned seller.
 * Owners (ownerUserId) get all seller capabilities even if scoped role rows are missing.
 */
export async function resolveSellerForActor(
  actor: Actor,
  capability: SellerCapability,
  preferredSellerId?: string,
) {
  const canAccess = (sellerId: string, ownerUserId: string) => {
    if (actorIsAdmin(actor)) {
      return true;
    }
    if (sellerIdsForCapability(actor, capability).includes(sellerId)) {
      return true;
    }
    return ownerUserId === actor.userId;
  };

  if (preferredSellerId) {
    const seller = await prisma.seller.findUnique({
      where: { id: preferredSellerId },
    });
    if (
      !seller ||
      seller.status !== "approved" ||
      !canAccess(seller.id, seller.ownerUserId)
    ) {
      return null;
    }
    return seller;
  }

  const roleSellerIds = sellerIdsForCapability(actor, capability);
  if (roleSellerIds.length > 0) {
    const byRole = await prisma.seller.findFirst({
      where: { id: { in: roleSellerIds }, status: "approved" },
      orderBy: { createdAt: "asc" },
    });
    if (byRole && canAccess(byRole.id, byRole.ownerUserId)) {
      return byRole;
    }
  }

  const owned = await prisma.seller.findFirst({
    where: { ownerUserId: actor.userId, status: "approved" },
    orderBy: { createdAt: "asc" },
  });
  if (owned && canAccess(owned.id, owned.ownerUserId)) {
    return owned;
  }
  return null;
}
