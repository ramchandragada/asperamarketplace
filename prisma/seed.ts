import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/identity/crypto";
import { ROLE_DEFINITIONS } from "../src/modules/identity/roles";
import { seedPcCatalogue } from "../src/modules/catalogue/seed-pc";
import { PC_PRODUCTS } from "../src/modules/catalogue/pc-catalogue-data";

const prisma = new PrismaClient();

const DEV_ADMIN_EMAIL = "admin@aspera.local";
const DEV_ADMIN_PASSWORD = "AsperaAdminDevOnly1!";
const DEV_CUSTOMER_EMAIL = "customer@aspera.local";
const DEV_CUSTOMER_PASSWORD = "AsperaCustomerDevOnly1!";
const PRIMARY_SELLER_EMAIL = "pcc@aspera.local";
const PRIMARY_SELLER_PASSWORD = "AsperaSellerDevOnly1!";

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

  // Source of truth: Pune PC catalogue (creates PC sellers + products).
  const catalogue = await seedPcCatalogue(prisma);
  const primarySeller = await prisma.seller.findFirstOrThrow({
    where: { contactEmail: PRIMARY_SELLER_EMAIL },
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
      update: {
        displayName: staff.displayName,
        passwordHash: await hashPassword(staff.password),
        status: "active",
        deletedAt: null,
      },
    });
    // Drop orphan staff roles pointed at deleted/non-PC sellers, then bind to PCC.
    await prisma.userRole.deleteMany({
      where: {
        userId: user.id,
        roleId: role.id,
        NOT: { scopeKey: primarySeller.id },
      },
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId_scopeKey: {
          userId: user.id,
          roleId: role.id,
          scopeKey: primarySeller.id,
        },
      },
      create: {
        userId: user.id,
        roleId: role.id,
        scopeKey: primarySeller.id,
        sellerId: primarySeller.id,
      },
      update: { sellerId: primarySeller.id },
    });
    staffAccounts.push({
      email: staff.email,
      password: staff.password,
      role: staff.roleKey,
    });
  }

  const { ensureDefaultTaxProfiles } = await import("../src/modules/tax/service");
  await ensureDefaultTaxProfiles();

  const customerRole = await prisma.role.findUniqueOrThrow({
    where: { key: "customer" },
  });
  const customerUser = await prisma.user.upsert({
    where: { email: DEV_CUSTOMER_EMAIL },
    create: {
      email: DEV_CUSTOMER_EMAIL,
      displayName: "Aspera Shopper",
      passwordHash: await hashPassword(DEV_CUSTOMER_PASSWORD),
      emailVerifiedAt: new Date(),
    },
    update: {
      displayName: "Aspera Shopper",
      passwordHash: await hashPassword(DEV_CUSTOMER_PASSWORD),
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId_scopeKey: {
        userId: customerUser.id,
        roleId: customerRole.id,
        scopeKey: "global",
      },
    },
    create: {
      userId: customerUser.id,
      roleId: customerRole.id,
      scopeKey: "global",
    },
    update: {},
  });

  console.log(
    JSON.stringify(
      {
        seeded: true,
        environment: "development-or-preview-only",
        admin: { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD },
        customer: {
          email: DEV_CUSTOMER_EMAIL,
          password: DEV_CUSTOMER_PASSWORD,
        },
        sellers: [
          {
            key: "pcc",
            email: PRIMARY_SELLER_EMAIL,
            password: PRIMARY_SELLER_PASSWORD,
          },
        ],
        sellerStaff: staffAccounts,
        catalogue: {
          sourceOfTruth: "pc-catalogue-data (MD Computers import)",
          categories: catalogue.categories,
          brands: catalogue.brands,
          puneSellers: catalogue.sellers,
          products: catalogue.products,
          productsDefined: PC_PRODUCTS.length,
          removedNonPc: catalogue.removedNonPc,
        },
        note: "PC-only marketplace seed. Non-PC catalogue data has been removed from the repo.",
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
