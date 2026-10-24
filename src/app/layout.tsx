import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { BackToTopButton } from "@/components/back-to-top";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ToastHost } from "@/components/toast-host";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://aspera.market";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aspera — Pune PC components marketplace",
    template: "%s · Aspera",
  },
  description:
    "Shop CPUs, GPUs, motherboards, RAM, SSDs, monitors and more from verified Pune sellers. Clear pricing, secure prepaid checkout, and buyer protection.",
  openGraph: {
    title: "Aspera — Pune PC components marketplace",
    description:
      "Build your rig with CPUs, GPUs, SSDs and peripherals from trusted local sellers.",
    type: "website",
    siteName: "Aspera",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aspera — Pune PC components marketplace",
    description:
      "CPUs, GPUs, motherboards, RAM, SSDs and monitors from verified Pune sellers.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const surface = headerList.get("x-aspera-surface") ?? "shopper";
  const isPanel = surface === "admin" || surface === "seller";

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {isPanel ? null : <SiteHeader />}
        <div
          id="content"
          tabIndex={-1}
          className={isPanel ? "flex-1" : "flex-1 pb-[5.75rem] md:pb-0"}
        >
          {children}
        </div>
        {isPanel ? null : (
          <>
            <SiteFooter />
            <MobileBottomNav />
            <BackToTopButton />
          </>
        )}
        <ToastHost />
        {isPanel ? null : (
          <Suspense fallback={null}>
            <AnalyticsBeacon />
          </Suspense>
        )}
      </body>
    </html>
  );
}
