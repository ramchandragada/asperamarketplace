/**
 * Publish the full PC catalogue as closed-catalogue shells for seller pick.
 * Usage: node --import tsx scripts/sync-closed-catalogue.mjs
 */
import { PrismaClient } from "@prisma/client";
import { syncClosedCatalogue } from "../src/modules/catalogue/sync-closed-catalogue.ts";

const prisma = new PrismaClient();

async function main() {
  const result = await syncClosedCatalogue(prisma);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
