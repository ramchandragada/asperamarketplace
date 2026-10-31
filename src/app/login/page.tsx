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
        <h1 className="font-display text-3xl font-semibold">Sign in</h1>
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
          <Link
            href={
              nextPath
                ? `/register?next=${encodeURIComponent(nextPath)}`
                : "/register"
            }
            className="font-medium text-accent underline"
          >
            Register
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
