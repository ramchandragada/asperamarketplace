import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export default function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-muted">
        {description ??
          "This page is coming soon. Meanwhile, keep shopping on Aspera."}
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-flex w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
      >
        Continue shopping
      </Link>
    </PageShell>
  );
}
