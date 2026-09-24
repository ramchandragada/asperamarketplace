import { checkDatabaseStatus } from "@/platform/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const database = await checkDatabaseStatus();
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
            Service foundation
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            This deployment runs the application shell, platform database
            tables, a health check, and structured logs. Catalogue, checkout,
            and payments arrive in later slices.
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
              <dd className="font-medium">Foundations</dd>
            </div>
            <div>
              <dt className="text-muted">Database</dt>
              <dd className="font-medium">{databaseLabel}</dd>
            </div>
          </dl>
          <a
            href="/api/health"
            className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
          >
            Open health check
          </a>
        </section>
      </main>
    </>
  );
}
