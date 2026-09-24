import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign in · Aspera Marketplace" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Aspera Marketplace
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-muted">
          Use your development account. Production identity providers are not
          wired yet.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="text-sm text-muted">
        Need an account?{" "}
        <Link href="/register" className="underline">
          Register
        </Link>
      </p>
    </main>
  );
}
