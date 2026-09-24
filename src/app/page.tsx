import Link from "next/link";
import { checkDatabaseStatus } from "@/platform/health";
import { getOptionalActor } from "@/modules/identity/service";
import { searchApprovedProducts } from "@/modules/catalogue/service";
import { formatPaise } from "@/modules/catalogue/helpers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const database = await checkDatabaseStatus();
  const actor = await getOptionalActor();
  const catalogue = await searchApprovedProducts({ page: 1, pageSize: 3 });
  const databaseLabel =
    database === "configured"
      ? "Configured"
      : database === "unavailable"
        ? "Unavailable"
        : "Not configured";

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
            Catalogue and discovery
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            Browse moderated seller listings without signing in. Prices and stock
            are server-owned integers.
          </p>
        </header>
        <section
          aria-labelledby="status-heading"
          className="rounded-card border border-border bg-surface p-6"
        >
          <h2 id="status-heading" className="text-xl font-semibold">
            Current status
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Phase</dt>
              <dd className="font-medium">Catalogue and discovery</dd>
            </div>
            <div>
              <dt className="text-muted">Database</dt>
              <dd className="font-medium">{databaseLabel}</dd>
            </div>
            <div>
              <dt className="text-muted">Session</dt>
              <dd className="font-medium">
                {actor ? actor.displayName : "Signed out"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Public listings</dt>
              <dd className="font-medium">{catalogue.total}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
            >
              Browse catalogue
            </Link>
            {actor ? (
              <Link
                href="/account"
                className="inline-flex rounded-lg border border-border px-4 py-2 font-medium"
              >
                Account
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex rounded-lg border border-border px-4 py-2 font-medium"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="inline-flex rounded-lg border border-border px-4 py-2 font-medium"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>
        {catalogue.items.length > 0 ? (
          <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
            <h2 id="featured-heading" className="text-xl font-semibold">
              Approved listings
            </h2>
            <ul className="flex flex-col gap-4">
              {catalogue.items.map((item) => (
                <li key={item.id} className="border-b border-border pb-3">
                  <Link href={`/products/${item.slug}`} className="hover:underline">
                    <span className="font-medium">{item.title}</span>
                  </Link>
                  <p className="text-sm text-muted">
                    {formatPaise(item.minPricePaise)} · {item.sellerName}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
