import Link from "next/link";
import {
  CatalogueBrowse,
  type BrowseProduct,
} from "@/components/catalogue-browse";
import { getOptionalActor } from "@/modules/identity/service";
import { searchApprovedProducts } from "@/modules/catalogue/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse · Aspera Marketplace" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const result = await searchApprovedProducts({
    q: query || undefined,
    page: 1,
    pageSize: 12,
  });
  const actor = await getOptionalActor();

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <main
        id="content"
        className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-16"
      >
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-muted uppercase">
            Aspera Marketplace
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Browse approved listings
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            Public discovery over moderated catalogue data. Prices and stock come
            from the server in paise and units — not from the browser.
          </p>
        </header>
        <CatalogueBrowse
          initialItems={result.items as BrowseProduct[]}
          initialQuery={query}
          initialTotal={result.total}
        />
        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="underline">
            Home
          </Link>
          {actor ? (
            <Link href="/account" className="underline">
              Account
            </Link>
          ) : (
            <Link href="/login" className="underline">
              Sign in
            </Link>
          )}
        </nav>
      </main>
    </>
  );
}
