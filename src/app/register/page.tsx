import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Register · Aspera Marketplace" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Aspera Marketplace
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Create an account</h1>
        <p className="mt-2 text-muted">
          Fictional development credentials only. Do not use real personal data.
        </p>
      </div>
      <AuthForm mode="register" />
      <p className="text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
