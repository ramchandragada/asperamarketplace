import Link from "next/link";
import { checkDatabaseStatus } from "@/platform/health";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const database = await checkDatabaseStatus();
  const actor = await getOptionalActor();
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
            Identity and seller foundations
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            Register, sign in, apply as a seller, and approve sellers in the
            local mock environment. Catalogue and checkout arrive later.
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
              <dd className="font-medium">Identity and seller onboarding</dd>
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
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/api/health"
              className="inline-flex rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
            >
              Open health check
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
      </main>
    </>
  );
}
