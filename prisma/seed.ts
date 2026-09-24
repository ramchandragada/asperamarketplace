import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/identity/crypto";
import { ROLE_DEFINITIONS } from "../src/modules/identity/roles";

const prisma = new PrismaClient();

const DEV_ADMIN_EMAIL = "admin@aspera.local";
const DEV_ADMIN_PASSWORD = "AsperaAdminDevOnly1!";
const DEV_SELLER_EMAIL = "seller@aspera.local";
const DEV_SELLER_PASSWORD = "AsperaSellerDevOnly1!";

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

  console.log(
    JSON.stringify(
      {
        seeded: true,
        admin: { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD },
        seller: { email: DEV_SELLER_EMAIL, password: DEV_SELLER_PASSWORD },
        note: "Fictional development credentials only",
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
