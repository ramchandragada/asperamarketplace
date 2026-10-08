import { describe, expect, it } from "vitest";
import {
  actorHasSellerCapability,
  actorIsAdmin,
  requireAdmin,
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

describe("admin role checks", () => {
  it("treats admin and super_admin as administrators", () => {
    expect(actorIsAdmin(makeActor([{ key: "admin", sellerId: null }]))).toBe(
      true,
    );
    expect(
      actorIsAdmin(makeActor([{ key: "super_admin", sellerId: null }])),
    ).toBe(true);
    expect(() =>
      requireAdmin(makeActor([{ key: "admin", sellerId: null }])),
    ).not.toThrow();
  });

  it("rejects customers and seller staff as administrators", () => {
    expect(
      actorIsAdmin(makeActor([{ key: "customer", sellerId: null }])),
    ).toBe(false);
    expect(
      actorIsAdmin(
        makeActor([{ key: "seller_owner", sellerId: "seller-1" }]),
      ),
    ).toBe(false);
    expect(() =>
      requireAdmin(makeActor([{ key: "customer", sellerId: null }])),
    ).toThrow(AuthorizationError);
  });

  it("does not treat auditor as administrator", () => {
    const auditor = makeActor([{ key: "auditor", sellerId: null }]);
    expect(actorIsAdmin(auditor)).toBe(false);
    expect(() => requireAdmin(auditor)).toThrow(AuthorizationError);
  });
});

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
