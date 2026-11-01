import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/ui/page-shell";
import { safeInternalPath } from "@/lib/safe-path";
import { getOptionalActor } from "@/modules/identity/service";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeInternalPath(params.next);
  const sellerNext =
    nextPath === "/seller/onboarding" ||
    Boolean(nextPath?.startsWith("/seller/"));

  let actor: Awaited<ReturnType<typeof getOptionalActor>> = null;
  try {
    actor = await getOptionalActor();
  } catch {
    actor = null;
  }
  if (actor) {
    redirect(nextPath ?? "/account");
  }

  const registerHref = sellerNext
    ? `/register?intent=seller&next=${encodeURIComponent(nextPath ?? "/seller/onboarding")}`
    : nextPath
      ? `/register?next=${encodeURIComponent(nextPath)}`
      : "/register";

  return (
    <PageShell narrow className="items-center justify-center py-16 md:py-24">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
        <h1 className="font-display text-3xl font-semibold">Sign in</h1>
        {sellerNext ? (
          <p className="mt-2 text-sm text-muted">
            Sign in to continue your seller application, or create a seller
            account if you are new.
          </p>
        ) : null}
        <div className="mt-6">
          <AuthForm mode="login" nextPath={nextPath} />
        </div>
        <p className="mt-4 text-sm text-muted">
          <Link href="/support" className="text-accent hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="mt-3 text-sm text-muted">
          Need an account?{" "}
          <Link href={registerHref} className="font-medium text-accent underline">
            {sellerNext ? "Create a seller account" : "Register"}
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
