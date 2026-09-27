import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Download App · Aspera Marketplace",
  description: "Get the Aspera Marketplace app for exclusive deals and faster shopping.",
};

export default function DownloadAppPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Download the Aspera App</h1>
      <p className="mt-3 text-muted">
        Shop on the go with exclusive app-only drops, faster checkout, and deal
        alerts. Native iOS and Android builds are coming soon — use the mobile
        web storefront today.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted">
          App Store — Coming soon
        </span>
        <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted">
          Google Play — Coming soon
        </span>
      </div>
      <p className="mt-8 text-sm">
        <Link href="/shop" className="font-medium text-accent underline">
          Continue shopping on web →
        </Link>
      </p>
    </PageShell>
  );
}
