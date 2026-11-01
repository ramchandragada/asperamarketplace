import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Mobile shopping",
  description:
    "Aspera Express is available on mobile web. Native App Store and Google Play apps are not published.",
};

/** No fake store badges — native apps are not in the stores. */
export default function DownloadAppPage() {
  // Prefer sending traffic to the shop rather than a dead “coming soon” CTA.
  if (process.env.NEXT_PUBLIC_NATIVE_APPS_LIVE === "true") {
    redirect("/shop");
  }

  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">
        Shop Aspera on mobile web
      </h1>
      <p className="mt-3 text-muted leading-7">
        Native iOS and Android apps are not available in the App Store or Google
        Play. Use the mobile website at aspera.market — the same catalogue,
        prepaid checkout, and order tracking.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/shop" className="font-medium text-accent underline">
          Continue shopping →
        </Link>
      </p>
    </PageShell>
  );
}
