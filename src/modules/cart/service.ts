import { prisma } from "@/platform/db/prisma";
import type { Actor } from "@/modules/identity/policy";
import type { CartIdentity } from "@/modules/cart/guest";
import {
  availableQuantity,
  buildCheckoutSnapshot,
  TotalsMismatchError,
  type CheckoutSnapshot,
} from "@/modules/cart/pricing";
import { resolveActiveTaxPolicy } from "@/modules/tax/service";
import type {
  AddCartItemInput,
  ConfirmCheckoutInput,
  CreateAddressInput,
  PreviewCheckoutInput,
  UpdateCartItemInput,
} from "@/modules/cart/schema";
import {
  beginIdempotentCommand,
  completeIdempotentCommand,
} from "@/platform/idempotency/store";

const RESERVATION_MINUTES = 15;

export class CartValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "CartValidationError";
  }
}

export class CartConflictError extends Error {
  readonly code = "CONFLICT";
  constructor(message: string) {
    super(message);
    this.name = "CartConflictError";
  }
}

export class InsufficientStockError extends Error {
  readonly code = "INSUFFICIENT_STOCK";
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

async function getOrCreateOpenCart(identity: CartIdentity) {
  if (identity.type === "user") {
    const existing = await prisma.cart.findFirst({
      where: { userId: identity.userId, status: "open" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;
    return prisma.cart.create({
      data: { userId: identity.userId, status: "open" },
    });
  }

  const existing = await prisma.cart.findFirst({
    where: { guestToken: identity.guestToken, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return prisma.cart.create({
    data: { guestToken: identity.guestToken, status: "open" },
  });
}

function actorIdForAudit(identity: CartIdentity) {
  return identity.type === "user" ? identity.userId : null;
}

function serializeCart(
  cart: {
    id: string;
    status: string;
    version: number;
    currencyCode: string;
    items: Array<{
      id: string;
      quantity: number;
      variant: {
        id: string;
        title: string;
        sku: string;
        sellingPricePaise: number;
        mrpPaise: number;
        weightGrams: number | null;
        product: {
          id: string;
          title: string;
          slug: string;
          status: string;
          seller: {
            id: string;
            legalName: string;
            tradeName: string | null;
            status: string;
          };
        };
        inventory: { onHand: number; reserved: number } | null;
      };
    }>;
  },
) {
  const items = cart.items.map((item) => {
    const available = availableQuantity(
      item.variant.inventory?.onHand ?? 0,
      item.variant.inventory?.reserved ?? 0,
    );
    return {
      id: item.id,
      variantId: item.variant.id,
      quantity: item.quantity,
      productTitle: item.variant.product.title,
      productSlug: item.variant.product.slug,
      variantTitle: item.variant.title,
      sku: item.variant.sku,
      unitPricePaise: item.variant.sellingPricePaise,
      mrpPaise: item.variant.mrpPaise,
      lineTotalPaise: item.variant.sellingPricePaise * item.quantity,
      availableQty: available,
      sellerName:
        item.variant.product.seller.tradeName ??
        item.variant.product.seller.legalName,
      sellerId: item.variant.product.seller.id,
      inStock: available >= item.quantity,
    };
  });
  const merchandisePaise = items.reduce(
    (sum, item) => sum + item.lineTotalPaise,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: cart.id,
    status: cart.status,
    version: cart.version,
    currencyCode: cart.currencyCode,
    merchandisePaise,
    itemCount,
    items,
  };
}

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  legalName: true,
                  tradeName: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getCartForIdentity(identity: CartIdentity) {
  const cart = await getOrCreateOpenCart(identity);
  const full = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
  return serializeCart(full);
}

export async function getCartForActor(actor: Actor) {
  return getCartForIdentity({ type: "user", userId: actor.userId });
}

/** Empty cart view for guests before first mutation (no DB write). */
export function emptyCartView() {
  return {
    id: "",
    status: "open" as const,
    version: 0,
    currencyCode: "INR",
    merchandisePaise: 0,
    itemCount: 0,
    items: [] as ReturnType<typeof serializeCart>["items"],
  };
}

function toCartIdentity(input: CartIdentity | Actor): CartIdentity {
  if ("type" in input && (input.type === "user" || input.type === "guest")) {
    return input;
  }
  return { type: "user", userId: input.userId };
}

export async function addCartItem(
  identityOrActor: CartIdentity | Actor,
  input: AddCartItemInput,
  correlationId: string,
) {
  const identity = toCartIdentity(identityOrActor);
  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: {
      inventory: true,
      product: { include: { seller: true } },
    },
  });
  if (!variant || !variant.isActive || variant.product.status !== "approved") {
    throw new CartValidationError("Variant is not available for purchase");
  }
  if (variant.product.seller.status !== "approved") {
    throw new CartValidationError("Seller is not approved for sales");
  }
  const available = availableQuantity(
    variant.inventory?.onHand ?? 0,
    variant.inventory?.reserved ?? 0,
  );
  if (available < input.quantity) {
    throw new InsufficientStockError(
      `Only ${available} unit(s) available for this variant`,
    );
  }

  const cart = await getOrCreateOpenCart(identity);
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: { cartId: cart.id, variantId: input.variantId },
    },
  });
  const nextQty = (existing?.quantity ?? 0) + input.quantity;
  if (nextQty > available) {
    throw new InsufficientStockError(
      `Only ${available} unit(s) available for this variant`,
    );
  }

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: input.variantId,
          quantity: input.quantity,
        },
      });
    }
    await tx.cart.update({
      where: { id: cart.id },
      data: { version: { increment: 1 } },
    });
    await tx.auditLog.create({
      data: {
        actorId: actorIdForAudit(identity),
        action: "cart.item_added",
        targetType: "cart",
        targetId: cart.id,
        afterState: {
          variantId: input.variantId,
          quantity: nextQty,
          unitPricePaise: variant.sellingPricePaise,
          identity: identity.type,
        },
        reason: "Customer added item to cart",
        correlationId,
      },
    });
  });

  return getCartForIdentity(identity);
}

export async function updateCartItem(
  identityOrActor: CartIdentity | Actor,
  input: UpdateCartItemInput,
  correlationId: string,
) {
  const identity = toCartIdentity(identityOrActor);
  const cart = await getOrCreateOpenCart(identity);
  const item = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: { cartId: cart.id, variantId: input.variantId },
    },
    include: { variant: { include: { inventory: true } } },
  });
  if (!item) {
    throw new CartValidationError("Cart item not found");
  }

  if (input.quantity === 0) {
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({ where: { id: item.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { version: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          actorId: actorIdForAudit(identity),
          action: "cart.item_removed",
          targetType: "cart",
          targetId: cart.id,
          beforeState: { variantId: input.variantId, quantity: item.quantity },
          reason: "Customer removed cart item",
          correlationId,
        },
      });
    });
    return getCartForIdentity(identity);
  }

  const available = availableQuantity(
    item.variant.inventory?.onHand ?? 0,
    item.variant.inventory?.reserved ?? 0,
  );
  if (input.quantity > available) {
    throw new InsufficientStockError(
      `Only ${available} unit(s) available for this variant`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity: input.quantity },
    });
    await tx.cart.update({
      where: { id: cart.id },
      data: { version: { increment: 1 } },
    });
    await tx.auditLog.create({
      data: {
        actorId: actorIdForAudit(identity),
        action: "cart.item_updated",
        targetType: "cart",
        targetId: cart.id,
        beforeState: { quantity: item.quantity },
        afterState: { quantity: input.quantity, variantId: input.variantId },
        reason: "Customer updated cart quantity",
        correlationId,
      },
    });
  });

  return getCartForIdentity(identity);
}

/**
 * Move guest cart lines into the signed-in user's open cart, then close the guest cart.
 */
export async function mergeGuestCartIntoUser(
  guestToken: string,
  userId: string,
  correlationId: string,
) {
  const guestCart = await prisma.cart.findFirst({
    where: { guestToken, status: "open" },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) {
    return;
  }

  const userCart = await getOrCreateOpenCart({ type: "user", userId });

  await prisma.$transaction(async (tx) => {
    for (const line of guestCart.items) {
      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: userCart.id,
            variantId: line.variantId,
          },
        },
      });
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + line.quantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: line.variantId,
            quantity: line.quantity,
          },
        });
      }
    }
    await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
    await tx.cart.update({
      where: { id: guestCart.id },
      data: { status: "abandoned" },
    });
    await tx.cart.update({
      where: { id: userCart.id },
      data: { version: { increment: 1 } },
    });
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: "cart.guest_merged",
        targetType: "cart",
        targetId: userCart.id,
        afterState: { guestCartId: guestCart.id, lines: guestCart.items.length },
        reason: "Merged guest cart after sign-in",
        correlationId,
      },
    });
  });
}

export async function listAddresses(actor: Actor) {
  return prisma.customerAddress.findMany({
    where: { userId: actor.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(
  actor: Actor,
  input: CreateAddressInput,
  correlationId: string,
) {
  const address = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.customerAddress.updateMany({
        where: { userId: actor.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const created = await tx.customerAddress.create({
      data: {
        userId: actor.userId,
        label: input.label,
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        isDefault: input.isDefault ?? false,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "address.created",
        targetType: "customer_address",
        targetId: created.id,
        afterState: {
          city: created.city,
          state: created.state,
          postalCode: created.postalCode,
        },
        reason: "Customer saved delivery address",
        correlationId,
      },
    });
    return created;
  });
  return address;
}

async function loadPricedLines(cartId: string) {
  const cart = await prisma.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: cartInclude,
  });
  if (cart.items.length === 0) {
    throw new CartValidationError("Cart is empty");
  }

  const lines = [];
  let totalWeightGrams = 0;
  for (const item of cart.items) {
    const { variant } = item;
    if (!variant.isActive || variant.product.status !== "approved") {
      throw new CartValidationError(
        `${variant.product.title} is no longer available`,
      );
    }
    if (variant.product.seller.status !== "approved") {
      throw new CartValidationError(
        `Seller for ${variant.product.title} is not approved`,
      );
    }
    const available = availableQuantity(
      variant.inventory?.onHand ?? 0,
      variant.inventory?.reserved ?? 0,
    );
    if (item.quantity > available) {
      throw new InsufficientStockError(
        `Insufficient stock for ${variant.product.title} (${variant.title})`,
      );
    }
    totalWeightGrams += (variant.weightGrams ?? 500) * item.quantity;
    lines.push({
      variantId: variant.id,
      productId: variant.product.id,
      sellerId: variant.product.seller.id,
      sellerName:
        variant.product.seller.tradeName ?? variant.product.seller.legalName,
      productTitle: variant.product.title,
      variantTitle: variant.title,
      sku: variant.sku,
      quantity: item.quantity,
      unitPricePaise: variant.sellingPricePaise,
      availableQty: available,
    });
  }

  return { cart, lines, totalWeightGrams };
}

function assertClientTotal(
  snapshot: CheckoutSnapshot,
  clientTotalPaise: number | undefined,
) {
  if (
    clientTotalPaise !== undefined &&
    clientTotalPaise !== snapshot.totalPaise
  ) {
    throw new TotalsMismatchError(
      "Browser total does not match server checkout snapshot",
    );
  }
}

export async function previewCheckout(
  actor: Actor,
  input: PreviewCheckoutInput,
) {
  const address = await prisma.customerAddress.findFirst({
    where: { id: input.addressId, userId: actor.userId },
  });
  if (!address) {
    throw new CartValidationError("Address not found");
  }
  const cart = await getOrCreateOpenCart({
    type: "user",
    userId: actor.userId,
  });
  const priced = await loadPricedLines(cart.id);
  const taxPolicy = await resolveActiveTaxPolicy();
  const snapshot = buildCheckoutSnapshot({
    lines: priced.lines,
    couponCode: input.couponCode,
    destinationState: address.state,
    totalWeightGrams: priced.totalWeightGrams,
    taxPolicy,
  });
  assertClientTotal(snapshot, input.clientTotalPaise);
  return {
    cart: serializeCart(priced.cart),
    address,
    snapshot,
  };
}

export async function confirmCheckout(
  actor: Actor,
  input: ConfirmCheckoutInput,
  correlationId: string,
) {
  type ConfirmResult = {
    checkout: {
      id: string;
      status: string;
      totalPaise: number;
      subtotalPaise: number;
      discountPaise: number;
      shippingPaise: number;
      taxPaise: number;
      reservedUntil: Date | string | null;
      currencyCode: string;
    };
    snapshot: CheckoutSnapshot;
  };

  const idempotency = await beginIdempotentCommand<ConfirmResult>({
    key: input.idempotencyKey,
    scope: `checkout:${actor.userId}`,
    requestPayload: {
      addressId: input.addressId,
      couponCode: input.couponCode ?? null,
      expectedCartVersion: input.expectedCartVersion,
      clientTotalPaise: input.clientTotalPaise ?? null,
    },
  });
  if (idempotency.kind === "cached") {
    return idempotency.body;
  }

  const address = await prisma.customerAddress.findFirst({
    where: { id: input.addressId, userId: actor.userId },
  });
  if (!address) {
    throw new CartValidationError("Address not found");
  }

  const openCart = await getOrCreateOpenCart({
    type: "user",
    userId: actor.userId,
  });
  if (openCart.version !== input.expectedCartVersion) {
    throw new CartConflictError(
      "Cart was updated. Reload and review totals before confirming.",
    );
  }

  const priced = await loadPricedLines(openCart.id);
  const taxPolicy = await resolveActiveTaxPolicy();
  const snapshot = buildCheckoutSnapshot({
    lines: priced.lines,
    couponCode: input.couponCode,
    destinationState: address.state,
    totalWeightGrams: priced.totalWeightGrams,
    taxPolicy,
  });
  assertClientTotal(snapshot, input.clientTotalPaise);

  const reservedUntil = new Date(
    Date.now() + RESERVATION_MINUTES * 60 * 1000,
  );

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUniqueOrThrow({
      where: { id: openCart.id },
    });
    if (cart.version !== input.expectedCartVersion || cart.status !== "open") {
      throw new CartConflictError(
        "Cart was updated. Reload and review totals before confirming.",
      );
    }

    for (const line of snapshot.lines) {
      const inventory = await tx.inventoryItem.findUnique({
        where: { variantId: line.variantId },
      });
      if (!inventory) {
        throw new InsufficientStockError(`No inventory for ${line.sku}`);
      }
      const available = availableQuantity(inventory.onHand, inventory.reserved);
      if (available < line.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for ${line.productTitle}`,
        );
      }
      const updated = await tx.inventoryItem.updateMany({
        where: { id: inventory.id, version: inventory.version },
        data: {
          reserved: { increment: line.quantity },
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new CartConflictError(
          "Inventory changed during checkout. Retry with a fresh preview.",
        );
      }
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory.id,
          movementType: "reserve",
          quantity: line.quantity,
          reason: "Checkout stock reservation",
          actorId: actor.userId,
          correlationId,
        },
      });
    }

    const checkout = await tx.checkoutSession.create({
      data: {
        userId: actor.userId,
        cartId: cart.id,
        addressId: address.id,
        status: "reserved",
        couponCode: snapshot.coupon.code,
        snapshot,
        subtotalPaise: snapshot.subtotalPaise,
        discountPaise: snapshot.discountPaise,
        shippingPaise: snapshot.shippingPaise,
        taxPaise: snapshot.taxPaise,
        totalPaise: snapshot.totalPaise,
        reservedUntil,
        idempotencyKey: input.idempotencyKey,
      },
    });

    await tx.cart.update({
      where: { id: cart.id, version: cart.version },
      data: {
        status: "checked_out",
        version: { increment: 1 },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "checkout.reserved",
        targetType: "checkout_session",
        targetId: checkout.id,
        afterState: {
          totalPaise: checkout.totalPaise,
          lineCount: snapshot.lines.length,
          reservedUntil: reservedUntil.toISOString(),
          groups: snapshot.groups,
        },
        reason: "Customer confirmed checkout review; stock reserved",
        correlationId,
      },
    });

    await tx.outboxEvent.create({
      data: {
        eventType: "CheckoutReserved",
        aggregateType: "checkout_session",
        aggregateId: checkout.id,
        payload: {
          userId: actor.userId,
          totalPaise: checkout.totalPaise,
          reservedUntil: reservedUntil.toISOString(),
          sellerIds: snapshot.groups.map((group) => group.sellerId),
        },
      },
    });

    return { checkout, snapshot };
  });

  const body = {
    checkout: {
      id: result.checkout.id,
      status: result.checkout.status,
      totalPaise: result.checkout.totalPaise,
      subtotalPaise: result.checkout.subtotalPaise,
      discountPaise: result.checkout.discountPaise,
      shippingPaise: result.checkout.shippingPaise,
      taxPaise: result.checkout.taxPaise,
      reservedUntil: result.checkout.reservedUntil,
      currencyCode: result.checkout.currencyCode,
    },
    snapshot: result.snapshot,
  };

  await completeIdempotentCommand({
    key: input.idempotencyKey,
    scope: `checkout:${actor.userId}`,
    responseCode: "OK",
    responseBody: body,
  });

  return body;
}

export async function getLatestReservedCheckout(actor: Actor) {
  return prisma.checkoutSession.findFirst({
    where: { userId: actor.userId, status: "reserved" },
    orderBy: { createdAt: "desc" },
    include: { address: true },
  });
}
