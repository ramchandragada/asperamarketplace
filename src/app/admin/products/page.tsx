import {
  AdminProductQueue,
  type AdminProductTab,
} from "@/components/admin-product-queue";
import {
  listActiveCategories,
  listAdminProducts,
} from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product moderation" };

const TABS = ["pending", "approved", "rejected", "paused"] as const;

function parseTab(raw: string | undefined): AdminProductTab {
  if (raw && (TABS as readonly string[]).includes(raw)) {
    return raw as AdminProductTab;
  }
  return "pending";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    page?: string;
    categoryId?: string;
    sellerId?: string;
  }>;
}) {
  const actor = await getOptionalActor();
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const categoryId = params.categoryId?.trim() || undefined;
  const sellerId = params.sellerId?.trim() || undefined;

  const [result, categories, sellers] = await Promise.all([
    listAdminProducts(actor!, {
      status: tab,
      q: q || undefined,
      categoryId,
      sellerId,
      page,
      pageSize: 20,
    }),
    listActiveCategories(),
    prisma.seller.findMany({
      where: { status: "approved" },
      orderBy: { legalName: "asc" },
      select: { id: true, legalName: true, tradeName: true },
      take: 200,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Product moderation</h1>
        <p className="mt-2 text-muted">
          Review catalogue listings by status, search, and seller.
        </p>
      </div>
      <AdminProductQueue
        tab={tab}
        query={q}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        pageCount={result.pageCount}
        counts={result.counts}
        categoryId={categoryId ?? ""}
        sellerId={sellerId ?? ""}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        sellers={sellers}
        products={result.items}
      />
    </div>
  );
}
