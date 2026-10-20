import { prisma } from "@/platform/db/prisma";
import {
  actorIsAdmin,
  AuthorizationError,
  type Actor,
} from "@/modules/identity/policy";

const DEMO_CONTACT_RE =
  /(00000|\.example\b|\.local\b|\bdemo\b|\bplaceholder\b|example\.com)/i;
const PLACEHOLDER_IMAGE_RE =
  /(placeholder|unsplash\.com|via\.placeholder|placehold\.co|picsum\.photos)/i;

function requireAdmin(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
}

export type DataQualityIssue = {
  kind:
    | "duplicate_title"
    | "placeholder_image"
    | "demo_contact"
    | "demo_copy";
  severity: "high" | "medium" | "low";
  entityType: "product" | "seller" | "image";
  entityId: string;
  label: string;
  detail: string;
};

/** Admin catalogue / contact data-quality report for Ticket 1. */
export async function buildCatalogueDataQualityReport(actor: Actor) {
  requireAdmin(actor);

  const [products, sellers, images] = await Promise.all([
    prisma.product.findMany({
      where: { status: { not: "archived" } },
      select: {
        id: true,
        title: true,
        summary: true,
        description: true,
        sellerId: true,
        status: true,
        seller: {
          select: { tradeName: true, legalName: true },
        },
      },
    }),
    prisma.seller.findMany({
      select: {
        id: true,
        legalName: true,
        tradeName: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
      },
    }),
    prisma.productImage.findMany({
      select: {
        id: true,
        productId: true,
        url: true,
        altText: true,
        product: { select: { title: true } },
      },
    }),
  ]);

  const issues: DataQualityIssue[] = [];

  const titlesBySeller = new Map<string, Map<string, string[]>>();
  for (const product of products) {
    const key = product.title.trim().toLowerCase();
    const sellerMap =
      titlesBySeller.get(product.sellerId) ?? new Map<string, string[]>();
    const ids = sellerMap.get(key) ?? [];
    ids.push(product.id);
    sellerMap.set(key, ids);
    titlesBySeller.set(product.sellerId, sellerMap);

    const blob = `${product.title}\n${product.summary ?? ""}\n${product.description ?? ""}`;
    if (DEMO_CONTACT_RE.test(blob)) {
      issues.push({
        kind: "demo_copy",
        severity: "medium",
        entityType: "product",
        entityId: product.id,
        label: product.title,
        detail: "Product title/summary/description contains demo/placeholder wording",
      });
    }
  }

  for (const [sellerId, titleMap] of titlesBySeller) {
    for (const [title, ids] of titleMap) {
      if (ids.length > 1) {
        issues.push({
          kind: "duplicate_title",
          severity: "high",
          entityType: "product",
          entityId: ids[0]!,
          label: title,
          detail: `Seller ${sellerId} has ${ids.length} products with the same title`,
        });
      }
    }
  }

  for (const image of images) {
    const haystack = `${image.url} ${image.altText ?? ""}`;
    if (PLACEHOLDER_IMAGE_RE.test(haystack)) {
      issues.push({
        kind: "placeholder_image",
        severity: "high",
        entityType: "image",
        entityId: image.id,
        label: image.product.title,
        detail: `Placeholder or stock image URL: ${image.url.slice(0, 120)}`,
      });
    }
  }

  for (const seller of sellers) {
    const contact = `${seller.contactEmail} ${seller.contactPhone ?? ""}`;
    if (DEMO_CONTACT_RE.test(contact)) {
      issues.push({
        kind: "demo_contact",
        severity: "high",
        entityType: "seller",
        entityId: seller.id,
        label: seller.tradeName ?? seller.legalName,
        detail: `Demo/placeholder seller contact: ${seller.contactEmail}`,
      });
    }
  }

  const summary = {
    productCount: products.length,
    sellerCount: sellers.length,
    imageCount: images.length,
    issueCount: issues.length,
    byKind: {
      duplicate_title: issues.filter((i) => i.kind === "duplicate_title").length,
      placeholder_image: issues.filter((i) => i.kind === "placeholder_image")
        .length,
      demo_contact: issues.filter((i) => i.kind === "demo_contact").length,
      demo_copy: issues.filter((i) => i.kind === "demo_copy").length,
    },
  };

  return { summary, issues: issues.slice(0, 200) };
}

/**
 * Archive duplicate catalogue listings (keep the oldest id per title+seller)
 * and soft-archive products whose only images are placeholders.
 */
export async function cleanupCatalogueDataQuality(
  actor: Actor,
  correlationId: string,
) {
  requireAdmin(actor);

  const products = await prisma.product.findMany({
    where: { status: { not: "archived" } },
    select: {
      id: true,
      title: true,
      sellerId: true,
      createdAt: true,
      images: { select: { url: true, altText: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const keep = new Set<string>();
  const archiveIds = new Set<string>();
  const seen = new Map<string, string>();

  for (const product of products) {
    const key = `${product.sellerId}::${product.title.trim().toLowerCase()}`;
    const existing = seen.get(key);
    if (existing) {
      archiveIds.add(product.id);
    } else {
      seen.set(key, product.id);
      keep.add(product.id);
    }
  }

  for (const product of products) {
    if (archiveIds.has(product.id) || product.images.length === 0) continue;
    const allPlaceholder = product.images.every((image) =>
      PLACEHOLDER_IMAGE_RE.test(`${image.url} ${image.altText ?? ""}`),
    );
    if (allPlaceholder) {
      archiveIds.add(product.id);
    }
  }

  const ids = [...archiveIds];
  if (ids.length === 0) {
    return { archivedCount: 0, archivedIds: [] as string[] };
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { id: { in: ids } },
      data: { status: "archived" },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "catalogue.data_quality_cleanup",
        targetType: "product",
        targetId: null,
        afterState: { archivedCount: ids.length, archivedIds: ids.slice(0, 50) },
        reason: "Admin catalogue cleanup: duplicates + placeholder-only images",
        correlationId,
      },
    });
  });

  return { archivedCount: ids.length, archivedIds: ids };
}
