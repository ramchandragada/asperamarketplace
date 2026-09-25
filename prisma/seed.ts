import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/identity/crypto";
import { ROLE_DEFINITIONS } from "../src/modules/identity/roles";
import { seedMarketplaceCatalogue } from "../src/modules/catalogue/seed-catalogue";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "../src/modules/catalogue/seed-catalogue-data";

const prisma = new PrismaClient();

const DEV_ADMIN_EMAIL = "admin@aspera.local";
const DEV_ADMIN_PASSWORD = "AsperaAdminDevOnly1!";
const DEV_SELLER_EMAIL = "seller@aspera.local";
const DEV_SELLER_PASSWORD = "AsperaSellerDevOnly1!";

async function ensureSeller(input: {
  email: string;
  password: string;
  displayName: string;
  legalName: string;
  tradeName: string;
  adminId: string;
  sellerRoleId: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      displayName: input.displayName,
      passwordHash: await hashPassword(input.password),
      emailVerifiedAt: new Date(),
    },
    update: {},
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId_scopeKey: {
        userId: user.id,
        roleId: input.sellerRoleId,
        scopeKey: "global",
      },
    },
    create: {
      userId: user.id,
      roleId: input.sellerRoleId,
      scopeKey: "global",
    },
    update: {},
  });

  let seller = await prisma.seller.findFirst({
    where: { ownerUserId: user.id },
  });
  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        ownerUserId: user.id,
        legalName: input.legalName,
        tradeName: input.tradeName,
        status: "approved",
        contactEmail: input.email,
        contactPhone: "9876543210",
        panLast4: "234F",
        gstinMasked: "29****F1Z5",
        registeredState: "Karnataka",
        agreementAcceptedAt: new Date(),
        submittedAt: new Date(),
        reviewedAt: new Date(),
        reviewedByUserId: input.adminId,
        approvedAt: new Date(),
        statusReason: "Seeded approved demo seller for catalogue density",
      },
    });
  } else {
    seller = await prisma.seller.update({
      where: { id: seller.id },
      data: {
        status: "approved",
        tradeName: input.tradeName,
        legalName: input.legalName,
        approvedAt: seller.approvedAt ?? new Date(),
        reviewedAt: new Date(),
        reviewedByUserId: input.adminId,
        statusReason: "Seeded approved demo seller for catalogue density",
      },
    });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId_scopeKey: {
        userId: user.id,
        roleId: input.sellerRoleId,
        scopeKey: seller.id,
      },
    },
    create: {
      userId: user.id,
      roleId: input.sellerRoleId,
      scopeKey: seller.id,
      sellerId: seller.id,
    },
    update: { sellerId: seller.id },
  });

  return { user, seller };
}

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

  const home = await ensureSeller({
    email: DEV_SELLER_EMAIL,
    password: DEV_SELLER_PASSWORD,
    displayName: "Home Seller",
    legalName: "HomeCraft Essentials Private Limited",
    tradeName: "HomeCraft Essentials",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });
  const fashion = await ensureSeller({
    email: "seller.fashion@aspera.local",
    password: "AsperaFashionDevOnly1!",
    displayName: "Fashion Seller",
    legalName: "Priya Boutique Private Limited",
    tradeName: "Priya's Boutique",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });
  const tech = await ensureSeller({
    email: "seller.tech@aspera.local",
    password: "AsperaTechDevOnly1!",
    displayName: "Tech Seller",
    legalName: "TechZone India LLP",
    tradeName: "TechZone India",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });
  const wellness = await ensureSeller({
    email: "seller.wellness@aspera.local",
    password: "AsperaWellnessDevOnly1!",
    displayName: "Wellness Seller",
    legalName: "GreenLeaf Organics Private Limited",
    tradeName: "GreenLeaf Organics",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });
  const textile = await ensureSeller({
    email: "seller.textile@aspera.local",
    password: "AsperaTextileDevOnly1!",
    displayName: "Textile Seller",
    legalName: "Delhi Textile House Private Limited",
    tradeName: "Delhi Textile House",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });
  const sports = await ensureSeller({
    email: "seller.sports@aspera.local",
    password: "AsperaSportsDevOnly1!",
    displayName: "Sports Seller",
    legalName: "FitLife Sports Private Limited",
    tradeName: "FitLife Sports",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });
  const mumbai = await ensureSeller({
    email: "seller.mumbai@aspera.local",
    password: "AsperaMumbaiDevOnly1!",
    displayName: "Mumbai Fashion Seller",
    legalName: "Mumbai Fashion Studio LLP",
    tradeName: "Mumbai Fashion Studio",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });
  const artisan = await ensureSeller({
    email: "seller.artisan@aspera.local",
    password: "AsperaArtisanDevOnly1!",
    displayName: "Artisan Seller",
    legalName: "Artisan Weaves Company Private Limited",
    tradeName: "Artisan Weaves Co.",
    adminId: admin.id,
    sellerRoleId: sellerRole.id,
  });

  const staffSeeds = [
    {
      email: "seller.ops@aspera.local",
      password: "AsperaOpsDevOnly1!",
      displayName: "Dev Seller Ops",
      roleKey: "seller_operations",
    },
    {
      email: "seller.finance@aspera.local",
      password: "AsperaFinanceDevOnly1!",
      displayName: "Dev Seller Finance",
      roleKey: "seller_finance",
    },
    {
      email: "seller.support@aspera.local",
      password: "AsperaSupportDevOnly1!",
      displayName: "Dev Seller Support",
      roleKey: "seller_support",
    },
  ] as const;

  const staffAccounts: Array<{ email: string; password: string; role: string }> =
    [];
  for (const staff of staffSeeds) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { key: staff.roleKey },
    });
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      create: {
        email: staff.email,
        displayName: staff.displayName,
        passwordHash: await hashPassword(staff.password),
        emailVerifiedAt: new Date(),
      },
      update: {},
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId_scopeKey: {
          userId: user.id,
          roleId: role.id,
          scopeKey: home.seller.id,
        },
      },
      create: {
        userId: user.id,
        roleId: role.id,
        scopeKey: home.seller.id,
        sellerId: home.seller.id,
      },
      update: { sellerId: home.seller.id },
    });
    staffAccounts.push({
      email: staff.email,
      password: staff.password,
      role: staff.roleKey,
    });
  }

  const catalogue = await seedMarketplaceCatalogue(prisma, {
    adminUserId: admin.id,
    sellers: {
      home: { id: home.seller.id },
      fashion: { id: fashion.seller.id },
      tech: { id: tech.seller.id },
      wellness: { id: wellness.seller.id },
      textile: { id: textile.seller.id },
      sports: { id: sports.seller.id },
      mumbai: { id: mumbai.seller.id },
      artisan: { id: artisan.seller.id },
    },
  });

  const { ensureDefaultTaxProfiles } = await import("../src/modules/tax/service");
  await ensureDefaultTaxProfiles();

  const approvedPublic = SEED_PRODUCTS.filter(
    (product) => (product.status ?? "approved") === "approved",
  ).length;

  console.log(
    JSON.stringify(
      {
        seeded: true,
        environment: "development-or-preview-only",
        admin: { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD },
        sellers: [
          { key: "home", email: DEV_SELLER_EMAIL, password: DEV_SELLER_PASSWORD },
          {
            key: "fashion",
            email: "seller.fashion@aspera.local",
            password: "AsperaFashionDevOnly1!",
          },
          {
            key: "tech",
            email: "seller.tech@aspera.local",
            password: "AsperaTechDevOnly1!",
          },
          {
            key: "wellness",
            email: "seller.wellness@aspera.local",
            password: "AsperaWellnessDevOnly1!",
          },
        ],
        sellerStaff: staffAccounts,
        catalogue: {
          categories: catalogue.categories,
          productsDefined: catalogue.productsDefined,
          approvedPublicTarget: approvedPublic,
          created: catalogue.created,
          updated: catalogue.updated,
          perCategory: catalogue.perCategory,
          categoryNames: SEED_CATEGORIES.map((category) => category.name),
        },
        note: "Fictional development credentials and catalogue imagery only. No fake payments or customer reviews.",
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
