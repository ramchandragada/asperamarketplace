/**
 * One-shot: suspend sellers missing Regular GSTIN and unpublish their listings.
 * Usage: node --import tsx scripts/unpublish-sellers-without-gstin.mjs
 */
import { PrismaClient } from "@prisma/client";
import { unpublishSellersWithoutGstin } from "../src/modules/catalogue/seed-pc.ts";

const prisma = new PrismaClient();

async function main() {
  const result = await unpublishSellersWithoutGstin(prisma);
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
