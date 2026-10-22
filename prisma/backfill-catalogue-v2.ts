/**
 * One-off backfill: populate the v2 shared-catalogue tables from the existing
 * approved products. Idempotent — safe to re-run. Run with:
 *   DATABASE_URL=... pnpm db:backfill:v2
 */
import { backfillCatalogueV2 } from "../src/modules/catalogue/catalogue-v2-backfill";
import { prisma } from "../src/platform/db/prisma";

async function main() {
  const result = await backfillCatalogueV2();
  console.log(
    `[catalogue-v2 backfill] groups=${result.groups} ` +
      `products=${result.created.products} variants=${result.created.variants} ` +
      `offers=${result.created.offers} skipped=${result.skipped}`,
  );
}

main()
  .catch((error) => {
    console.error("[catalogue-v2 backfill] failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
