import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/ui/page-shell";
import { safeInternalPath } from "@/lib/safe-path";
import { getOptionalActor } from "@/modules/identity/service";

export const metadata = { title: "Register" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeInternalPath(params.next);
  const registerHref = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : "/login";

  let actor: Awaited<ReturnType<typeof getOptionalActor>> = null;
  try {
    actor = await getOptionalActor();
  } catch {
    actor = null;
  }
  if (actor) {
    redirect(nextPath ?? "/account");
  }

  return (
    <PageShell narrow className="items-center justify-center py-16 md:py-24">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
        <h1 className="font-display text-3xl font-semibold">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Shopper accounts only. Want to sell on Aspera?{" "}
          <Link href="/sell" className="font-medium text-accent underline">
            Apply to become a seller
          </Link>
          .
        </p>
        <div className="mt-6">
          <AuthForm mode="register" nextPath={nextPath} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Already registered?{" "}
          <Link href={registerHref} className="font-medium text-accent underline">
            Sign in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
