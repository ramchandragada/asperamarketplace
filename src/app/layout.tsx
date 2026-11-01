import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { BackToTopButton } from "@/components/back-to-top";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  ShopperChromeGate,
  ShopperContentShell,
} from "@/components/shopper-chrome-gate";
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
    default: "Aspera Express — PC parts delivered in minutes",
    template: "%s · Aspera",
  },
  description:
    "Multi-vendor PC components marketplace by Aspera Technologies Private Limited. Prepaid Express delivery on configured Pune pins — GST invoices from the selling dealer.",
  openGraph: {
    title: "Aspera Express — PC parts in minutes",
    description:
      "PC parts from approved dealers. Set your pin, see the ETA, prepaid checkout.",
    type: "website",
    siteName: "Aspera",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aspera Express — PC parts in minutes",
    description:
      "Prepaid PC components for builders. Express windows on configured Pune pins.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Do not gate chrome on x-aspera-surface alone: the root layout survives
  // client navigations, so soft links from / → /seller kept the shopper
  // header (categories + Express search) stacked on OperatorChrome.
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <ShopperChromeGate>
          <SiteHeader />
        </ShopperChromeGate>
        <ShopperContentShell>{children}</ShopperContentShell>
        <ShopperChromeGate>
          <SiteFooter />
          <MobileBottomNav />
          <BackToTopButton />
          <Suspense fallback={null}>
            <AnalyticsBeacon />
          </Suspense>
        </ShopperChromeGate>
        <ToastHost />
      </body>
    </html>
  );
}
