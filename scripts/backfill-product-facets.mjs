/**
 * Refresh Product.attributes.facets from titles (+ preserved overrides).
 * Usage: node --import tsx scripts/backfill-product-facets.mjs [--dry-run]
 */
import { PrismaClient } from "@prisma/client";
import { backfillProductFacets } from "../src/modules/catalogue/backfill-facets.ts";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const result = await backfillProductFacets(prisma, { dryRun });
  console.log(JSON.stringify({ dryRun, ...result }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
