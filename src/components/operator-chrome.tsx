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
  children,
}: {
  surface: "seller" | "admin";
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f7f3ec_0%,#f3efe6_40%,#efe9de_100%)]">
      <header className="border-b border-border/80 bg-[color-mix(in_oklab,var(--accent)_92%,black)] text-accent-foreground">
        <div className="container-shell flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-tight text-white"
            >
              Aspera
            </Link>
            <span className="hidden h-4 w-px bg-white/30 sm:block" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase">
                {surface === "admin" ? "Admin console" : "Seller console"}
              </p>
              <p className="truncate text-sm font-medium text-white">{title}</p>
              {subtitle ? (
                <p className="truncate text-xs text-white/70">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <nav
            aria-label="Aspera surfaces"
            className="flex flex-wrap items-center gap-2 text-xs"
          >
            <Link
              href="/"
              className="rounded-full border border-white/25 px-3 py-1.5 text-white/90 hover:bg-white/10"
            >
              Shopping
            </Link>
            <Link
              href="/seller"
              className={`rounded-full px-3 py-1.5 ${
                surface === "seller"
                  ? "bg-white text-accent"
                  : "border border-white/25 text-white/90 hover:bg-white/10"
              }`}
            >
              Selling
            </Link>
            <Link
              href="/admin"
              className={`rounded-full px-3 py-1.5 ${
                surface === "admin"
                  ? "bg-white text-accent"
                  : "border border-white/25 text-white/90 hover:bg-white/10"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
