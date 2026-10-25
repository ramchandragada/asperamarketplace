/**
 * One-shot: seed the PC catalogue into the configured DATABASE_URL.
 * Usage: node --import tsx scripts/run-seed-pc.mjs
 */
import { PrismaClient } from "@prisma/client";
import { seedPcCatalogue } from "../src/modules/catalogue/seed-pc.ts";

const prisma = new PrismaClient();

async function main() {
  const result = await seedPcCatalogue(prisma);
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
