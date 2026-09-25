import { describe, expect, it } from "vitest";
import {
  actorHasSellerCapability,
  requireSellerCapability,
  AuthorizationError,
  type Actor,
} from "@/modules/identity/policy";

function makeActor(
  roles: Actor["roles"],
): Actor {
  return {
    userId: "user-1",
    email: "t@aspera.local",
    displayName: "Test",
    sessionId: "sess-1",
    roles,
  };
}

describe("seller RBAC capabilities", () => {
  const sellerId = "seller-1";

  it("allows operations to write catalogue and fulfilment", () => {
    const actor = makeActor([
      { key: "seller_operations", sellerId },
    ]);
    expect(actorHasSellerCapability(actor, sellerId, "catalogue.write")).toBe(
      true,
    );
    expect(actorHasSellerCapability(actor, sellerId, "fulfilment.write")).toBe(
      true,
    );
    expect(actorHasSellerCapability(actor, sellerId, "finance.read")).toBe(
      false,
    );
  });

  it("allows finance to read settlements but not ship orders", () => {
    const actor = makeActor([{ key: "seller_finance", sellerId }]);
    expect(actorHasSellerCapability(actor, sellerId, "finance.read")).toBe(true);
    expect(actorHasSellerCapability(actor, sellerId, "fulfilment.write")).toBe(
      false,
    );
    expect(() =>
      requireSellerCapability(actor, sellerId, "fulfilment.write"),
    ).toThrow(AuthorizationError);
  });

  it("allows support to review returns but not edit catalogue", () => {
    const actor = makeActor([{ key: "seller_support", sellerId }]);
    expect(actorHasSellerCapability(actor, sellerId, "returns.review")).toBe(
      true,
    );
    expect(actorHasSellerCapability(actor, sellerId, "catalogue.write")).toBe(
      false,
    );
  });

  it("scopes capabilities to the seller id", () => {
    const actor = makeActor([
      { key: "seller_operations", sellerId: "other-seller" },
    ]);
    expect(actorHasSellerCapability(actor, sellerId, "catalogue.write")).toBe(
      false,
    );
  });

  it("lets admins pass any seller capability", () => {
    const actor = makeActor([{ key: "admin", sellerId: null }]);
    expect(actorHasSellerCapability(actor, sellerId, "finance.read")).toBe(true);
  });
});
