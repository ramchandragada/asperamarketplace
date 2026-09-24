import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/identity/crypto";
import { ROLE_DEFINITIONS } from "../src/modules/identity/roles";
import { buildSearchDocument } from "../src/modules/catalogue/helpers";

const prisma = new PrismaClient();

const DEV_ADMIN_EMAIL = "admin@aspera.local";
const DEV_ADMIN_PASSWORD = "AsperaAdminDevOnly1!";
const DEV_SELLER_EMAIL = "seller@aspera.local";
const DEV_SELLER_PASSWORD = "AsperaSellerDevOnly1!";
const DEV_PRODUCT_SLUG = "cotton-tea-towel-set-demo";

async function main() {
  for (const [key, definition] of Object.entries(ROLE_DEFINITIONS)) {
    await prisma.role.upsert({
      where: { key },
      create: {
        key,
        name: definition.name,
        description: definition.description,
      },
      update: {
        name: definition.name,
        description: definition.description,
      },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { key: "admin" },
  });
  const sellerRole = await prisma.role.findUniqueOrThrow({
    where: { key: "seller_owner" },
  });

  const admin = await prisma.user.upsert({
    where: { email: DEV_ADMIN_EMAIL },
    create: {
      email: DEV_ADMIN_EMAIL,
      displayName: "Dev Admin",
      passwordHash: await hashPassword(DEV_ADMIN_PASSWORD),
      emailVerifiedAt: new Date(),
    },
    update: {},
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId_scopeKey: {
        userId: admin.id,
        roleId: adminRole.id,
        scopeKey: "global",
      },
    },
    create: {
      userId: admin.id,
      roleId: adminRole.id,
      scopeKey: "global",
    },
    update: {},
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: DEV_SELLER_EMAIL },
    create: {
      email: DEV_SELLER_EMAIL,
      displayName: "Dev Seller",
      passwordHash: await hashPassword(DEV_SELLER_PASSWORD),
      emailVerifiedAt: new Date(),
    },
    update: {},
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId_scopeKey: {
        userId: sellerUser.id,
        roleId: sellerRole.id,
        scopeKey: "global",
      },
    },
    create: {
      userId: sellerUser.id,
      roleId: sellerRole.id,
      scopeKey: "global",
    },
    update: {},
  });

  const category = await prisma.category.upsert({
    where: { slug: "general-merchandise" },
    create: {
      slug: "general-merchandise",
      name: "General merchandise",
      description:
        "Configurable seed category. Not a launch-category business decision.",
      isActive: true,
    },
    update: {
      isActive: true,
      name: "General merchandise",
    },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: "aspera-home" },
    create: { slug: "aspera-home", name: "Aspera Home" },
    update: { name: "Aspera Home" },
  });

  let seller = await prisma.seller.findFirst({
    where: { ownerUserId: sellerUser.id },
  });
  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        ownerUserId: sellerUser.id,
        legalName: "Aspera Demo Traders Private Limited",
        tradeName: "Aspera Demo Mart",
        status: "approved",
        contactEmail: DEV_SELLER_EMAIL,
        contactPhone: "9876543210",
        panLast4: "234F",
        gstinMasked: "29****F1Z5",
        registeredState: "Karnataka",
        agreementAcceptedAt: new Date(),
        submittedAt: new Date(),
        reviewedAt: new Date(),
        reviewedByUserId: admin.id,
        approvedAt: new Date(),
        statusReason: "Seeded approved seller for local development",
      },
    });
  } else if (seller.status !== "approved") {
    seller = await prisma.seller.update({
      where: { id: seller.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        reviewedAt: new Date(),
        reviewedByUserId: admin.id,
        statusReason: "Seeded approved seller for local development",
      },
    });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId_scopeKey: {
        userId: sellerUser.id,
        roleId: sellerRole.id,
        scopeKey: seller.id,
      },
    },
    create: {
      userId: sellerUser.id,
      roleId: sellerRole.id,
      scopeKey: seller.id,
      sellerId: seller.id,
    },
    update: {
      sellerId: seller.id,
    },
  });

  const searchDocument = buildSearchDocument({
    title: "Cotton tea towel set",
    summary: "Pack of three absorbent cotton tea towels for everyday kitchens.",
    description:
      "Fictional development listing. Soft cotton towels with hanging loops. Suitable for drying crockery and wiping counters. Seeded for public browse without login.",
    brandName: brand.name,
    categoryName: category.name,
    sku: "TOWEL-SET-01",
  });

  const existingProduct = await prisma.product.findUnique({
    where: { slug: DEV_PRODUCT_SLUG },
    include: { variants: { include: { inventory: true } } },
  });

  if (!existingProduct) {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sellerId: seller.id,
          categoryId: category.id,
          brandId: brand.id,
          slug: DEV_PRODUCT_SLUG,
          title: "Cotton tea towel set",
          summary:
            "Pack of three absorbent cotton tea towels for everyday kitchens.",
          description:
            "Fictional development listing. Soft cotton towels with hanging loops. Suitable for drying crockery and wiping counters. Seeded for public browse without login.",
          status: "approved",
          countryOfOrigin: "India",
          hsnCode: "6302",
          searchDocument,
          submittedAt: new Date(),
          reviewedAt: new Date(),
          reviewedByUserId: admin.id,
          publishedAt: new Date(),
          statusReason: "Seeded approved listing for local discovery",
        },
      });
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku: "TOWEL-SET-01",
          title: "Pack of 3",
          mrpPaise: 49900,
          sellingPricePaise: 39900,
          weightGrams: 450,
        },
      });
      const inventory = await tx.inventoryItem.create({
        data: {
          variantId: variant.id,
          sellerId: seller.id,
          onHand: 40,
          reserved: 0,
          damaged: 0,
        },
      });
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory.id,
          movementType: "receive",
          quantity: 40,
          reason: "Seed initial stock",
          actorId: admin.id,
          correlationId: "seed-catalogue",
        },
      });
    });
  }

  console.log(
    JSON.stringify(
      {
        seeded: true,
        admin: { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD },
        seller: { email: DEV_SELLER_EMAIL, password: DEV_SELLER_PASSWORD },
        publicProductSlug: DEV_PRODUCT_SLUG,
        note: "Fictional development credentials and listing only",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
