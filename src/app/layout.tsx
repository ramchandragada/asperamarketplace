import type { Metadata } from "next";
import { Source_Serif_4, DM_Sans } from "next/font/google";
import { BackToTopButton } from "@/components/back-to-top";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ToastHost } from "@/components/toast-host";
import "./globals.css";

const display = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aspera Marketplace — India's Trusted Multi-Vendor Marketplace",
    template: "%s · Aspera Marketplace",
  },
  description:
    "India-first multi-vendor marketplace with verified sellers, transparent pricing, and responsible commerce.",
  openGraph: {
    title: "Aspera Marketplace",
    description:
      "Shop quality products from verified Indian sellers at the best prices.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
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
