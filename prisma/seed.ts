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

  const seedCatalogue: Array<{
    slug: string;
    title: string;
    summary: string;
    description: string;
    sku: string;
    mrpPaise: number;
    sellingPricePaise: number;
    weightGrams: number;
    onHand: number;
    hsnCode: string;
  }> = [
    {
      slug: "stainless-steel-tiffin",
      title: "Stainless steel tiffin box",
      summary: "Three-tier lunch box for office and school days.",
      description:
        "Fictional seed listing. Leak-resistant stacking containers with a carry clip. Not a real product offer.",
      sku: "TIFFIN-01",
      mrpPaise: 89900,
      sellingPricePaise: 74900,
      weightGrams: 700,
      onHand: 25,
      hsnCode: "7323",
    },
    {
      slug: "handloom-cotton-stole",
      title: "Handloom cotton stole",
      summary: "Lightweight stole for travel and everyday wear.",
      description:
        "Fictional seed listing. Soft cotton stole with woven border. Development catalogue filler only.",
      sku: "STOLE-01",
      mrpPaise: 129900,
      sellingPricePaise: 99900,
      weightGrams: 220,
      onHand: 18,
      hsnCode: "6214",
    },
    {
      slug: "cast-iron-tadka-pan",
      title: "Cast iron tadka pan",
      summary: "Small seasoned pan for tempering spices.",
      description:
        "Fictional seed listing. Pre-seasoned cast iron with wooden handle. Demo inventory only.",
      sku: "TADKA-01",
      mrpPaise: 159900,
      sellingPricePaise: 129900,
      weightGrams: 1100,
      onHand: 12,
      hsnCode: "7323",
    },
    {
      slug: "bamboo-cutting-board",
      title: "Bamboo cutting board",
      summary: "Medium board with juice groove for kitchen prep.",
      description:
        "Fictional seed listing. Smooth bamboo surface. Seeded for browse density testing.",
      sku: "BOARD-01",
      mrpPaise: 79900,
      sellingPricePaise: 64900,
      weightGrams: 900,
      onHand: 30,
      hsnCode: "4419",
    },
    {
      slug: "copper-water-bottle",
      title: "Copper water bottle",
      summary: "1 litre bottle with leak-resistant cap.",
      description:
        "Fictional seed listing. Pure copper body for development demos. Not a medical claim.",
      sku: "COPPER-01",
      mrpPaise: 99900,
      sellingPricePaise: 84900,
      weightGrams: 350,
      onHand: 22,
      hsnCode: "7418",
    },
    {
      slug: "organic-cotton-apron",
      title: "Organic cotton apron",
      summary: "Adjustable apron with front pocket.",
      description:
        "Fictional seed listing. Durable weave for kitchen tasks. Demo catalogue only.",
      sku: "APRON-01",
      mrpPaise: 69900,
      sellingPricePaise: 54900,
      weightGrams: 280,
      onHand: 35,
      hsnCode: "6211",
    },
    {
      slug: "ceramic-spice-jars-set",
      title: "Ceramic spice jars set",
      summary: "Set of six labelled jars with wooden rack.",
      description:
        "Fictional seed listing. Matte ceramic jars. Used to flesh out search and browse.",
      sku: "SPICE-01",
      mrpPaise: 149900,
      sellingPricePaise: 119900,
      weightGrams: 1600,
      onHand: 15,
      hsnCode: "6912",
    },
    {
      slug: "neem-wood-comb",
      title: "Neem wood comb",
      summary: "Wide-tooth comb carved from neem wood.",
      description:
        "Fictional seed listing. Smooth finish. No therapeutic claims; development data only.",
      sku: "COMB-01",
      mrpPaise: 39900,
      sellingPricePaise: 29900,
      weightGrams: 40,
      onHand: 50,
      hsnCode: "9615",
    },
    {
      slug: "kantha-cushion-cover",
      title: "Kantha cushion cover",
      summary: "Hand-stitched cotton cover, 16 inch.",
      description:
        "Fictional seed listing. Envelope closure. Seeded for merchandising demos.",
      sku: "CUSHION-01",
      mrpPaise: 89900,
      sellingPricePaise: 69900,
      weightGrams: 180,
      onHand: 28,
      hsnCode: "6304",
    },
    {
      slug: "brass-diya-set",
      title: "Brass diya set",
      summary: "Pack of four small brass lamps.",
      description:
        "Fictional seed listing. Polished brass. Cultural demo inventory; not ritual advice.",
      sku: "DIYA-01",
      mrpPaise: 59900,
      sellingPricePaise: 44900,
      weightGrams: 320,
      onHand: 40,
      hsnCode: "7419",
    },
    {
      slug: "stoneware-mug-pair",
      title: "Stoneware mug pair",
      summary: "Two 300 ml mugs with speckled glaze.",
      description:
        "Fictional seed listing. Microwave-safe claim is fictional for seed only.",
      sku: "MUG-01",
      mrpPaise: 79900,
      sellingPricePaise: 59900,
      weightGrams: 600,
      onHand: 32,
      hsnCode: "6912",
    },
    {
      slug: "jute-market-tote",
      title: "Jute market tote",
      summary: "Reusable tote with cotton handles.",
      description:
        "Fictional seed listing. Sturdy jute body. Demo SKU for cart multi-line tests.",
      sku: "TOTE-01",
      mrpPaise: 49900,
      sellingPricePaise: 39900,
      weightGrams: 250,
      onHand: 45,
      hsnCode: "4202",
    },
  ];

  for (const item of seedCatalogue) {
    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
    });
    if (existing) {
      continue;
    }
    const document = buildSearchDocument({
      title: item.title,
      summary: item.summary,
      description: item.description,
      brandName: brand.name,
      categoryName: category.name,
      sku: item.sku,
    });
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sellerId: seller.id,
          categoryId: category.id,
          brandId: brand.id,
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          description: item.description,
          status: "approved",
          countryOfOrigin: "India",
          hsnCode: item.hsnCode,
          searchDocument: document,
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
          sku: item.sku,
          title: "Standard",
          mrpPaise: item.mrpPaise,
          sellingPricePaise: item.sellingPricePaise,
          weightGrams: item.weightGrams,
        },
      });
      const inventory = await tx.inventoryItem.create({
        data: {
          variantId: variant.id,
          sellerId: seller.id,
          onHand: item.onHand,
          reserved: 0,
          damaged: 0,
        },
      });
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory.id,
          movementType: "receive",
          quantity: item.onHand,
          reason: "Seed initial stock",
          actorId: admin.id,
          correlationId: `seed-${item.sku}`,
        },
      });
    });
  }

  const { ensureDefaultTaxProfiles } = await import("../src/modules/tax/service");
  await ensureDefaultTaxProfiles();

  console.log(
    JSON.stringify(
      {
        seeded: true,
        admin: { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD },
        seller: { email: DEV_SELLER_EMAIL, password: DEV_SELLER_PASSWORD },
        publicProductSlug: DEV_PRODUCT_SLUG,
        extraSeedListings: seedCatalogue.length,
        note: "Fictional development credentials and listings only",
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
