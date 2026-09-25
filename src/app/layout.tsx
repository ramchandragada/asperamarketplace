import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BackToTopButton } from "@/components/back-to-top";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ToastHost } from "@/components/toast-host";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://asperamarketplace.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aspera Marketplace — Discover More. Choose Better.",
    template: "%s · Aspera Marketplace",
  },
  description:
    "Shop products from independent Indian sellers with clear pricing, easy discovery, transparent delivery, and secure checkout.",
  openGraph: {
    title: "Aspera Marketplace — Discover More. Choose Better.",
    description:
      "Shop products from independent Indian sellers with clear pricing, easy discovery, transparent delivery, and secure checkout.",
    type: "website",
    siteName: "Aspera Marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aspera Marketplace — Discover More. Choose Better.",
    description:
      "Shop products from independent Indian sellers with clear pricing and secure checkout.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <SiteHeader />
        <div id="content" className="flex-1 pb-16 md:pb-0">
          {children}
        </div>
        <SiteFooter />
        <MobileBottomNav />
        <BackToTopButton />
        <ToastHost />
      </body>
    </html>
  );
}
