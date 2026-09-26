import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Sign in · Aspera Marketplace" };

export default function LoginPage() {
  return (
    <PageShell narrow className="items-center justify-center py-16 md:py-24">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
        <h1 className="font-display text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Welcome back to Aspera Marketplace.
        </p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-sm text-muted">
          <Link href="/support" className="text-accent hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="mt-3 text-sm text-muted">
          Need an account?{" "}
          <Link href="/register" className="font-medium text-accent underline">
            Register
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
