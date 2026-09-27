import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Register · Aspera Marketplace" };

export default function RegisterPage() {
  return (
    <PageShell narrow className="items-center justify-center py-16 md:py-24">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
        <h1 className="font-display text-3xl font-semibold">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Join Aspera to shop and sell with verified marketplace tools.
        </p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
        <p className="mt-4 text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-accent underline">
            Sign in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
