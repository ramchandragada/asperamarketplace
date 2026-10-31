import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared Aspera brand bar for seller + admin panels so operator surfaces
 * read as the same product as the storefront.
 */
export function OperatorChrome({
  surface,
  title,
  subtitle,
  showAdmin = false,
  showSeller = false,
  children,
}: {
  surface: "seller" | "admin";
  title: string;
  subtitle?: string;
  /** Only show the Admin surface link to actual admins. */
  showAdmin?: boolean;
  /** Only show the Selling surface link when the actor has a seller workspace. */
  showSeller?: boolean;
  children: ReactNode;
}) {
  const adminVisible = showAdmin || surface === "admin";
  const sellerVisible = showSeller || surface === "seller";

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-accent text-accent-foreground">
        <div className="container-shell flex flex-wrap items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="font-display text-[17px] font-semibold tracking-tight text-white"
            >
              Aspera
            </Link>
            <span className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-white/65 uppercase">
                {surface === "admin" ? "Admin console" : "Seller Central"}
              </p>
              <p className="truncate text-[13px] font-medium text-white">
                {title}
              </p>
              {subtitle ? (
                <p className="truncate text-[11px] text-white/65">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <nav
            aria-label="Aspera surfaces"
            className="flex flex-wrap items-center gap-1.5 text-xs"
          >
            <Link
              href="/"
              className="border border-white/25 px-2.5 py-1.5 text-white/90 hover:bg-white/10"
            >
              Shopping
            </Link>
            {sellerVisible ? (
              <Link
                href="/seller"
                className={`px-2.5 py-1.5 ${
                  surface === "seller"
                    ? "bg-white font-semibold text-accent"
                    : "border border-white/25 text-white/90 hover:bg-white/10"
                }`}
              >
                Selling
              </Link>
            ) : null}
            {adminVisible ? (
              <Link
                href="/admin"
                className={`px-2.5 py-1.5 ${
                  surface === "admin"
                    ? "bg-white font-semibold text-accent"
                    : "border border-white/25 text-white/90 hover:bg-white/10"
                }`}
              >
                Admin
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
