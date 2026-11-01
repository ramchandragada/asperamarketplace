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
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeInternalPath(params.next);
  const intent = params.intent === "seller" ? "seller" : "customer";
  const isSellerSignup = intent === "seller";
  const loginHref = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : isSellerSignup
      ? `/login?next=${encodeURIComponent("/seller/onboarding")}`
      : "/login";

  let actor: Awaited<ReturnType<typeof getOptionalActor>> = null;
  try {
    actor = await getOptionalActor();
  } catch {
    actor = null;
  }
  if (actor) {
    redirect(
      nextPath ?? (isSellerSignup ? "/seller/onboarding" : "/account"),
    );
  }

  return (
    <PageShell narrow className="items-center justify-center py-16 md:py-24">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
        <h1 className="font-display text-3xl font-semibold">
          {isSellerSignup ? "Create a seller account" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isSellerSignup ? (
            <>
              Register as the business owner, then complete GSTIN KYC. Already
              shopping on Aspera?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(nextPath ?? "/seller/onboarding")}`}
                className="font-medium text-accent underline"
              >
                Sign in
              </Link>{" "}
              and open seller onboarding.
            </>
          ) : (
            <>
              Shopper account for orders and Express delivery. Want to sell?{" "}
              <Link
                href="/register?intent=seller&next=%2Fseller%2Fonboarding"
                className="font-medium text-accent underline"
              >
                Create a seller account
              </Link>
              .
            </>
          )}
        </p>
        <div className="mt-6">
          <AuthForm
            mode="register"
            nextPath={
              nextPath ?? (isSellerSignup ? "/seller/onboarding" : null)
            }
            intent={intent}
          />
        </div>
        <p className="mt-4 text-sm text-muted">
          Already registered?{" "}
          <Link href={loginHref} className="font-medium text-accent underline">
            Sign in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
