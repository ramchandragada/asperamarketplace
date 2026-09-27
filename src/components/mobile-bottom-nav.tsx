"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function NewIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h15l-1.5 9H8L6 8Zm0 0L5 4H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19c1.4-2.8 3.8-4.2 6.5-4.2S17.1 16.2 18.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Meesho-style mobile tabs: Home · Categories · New · Cart · Account */
const items = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/shop", label: "Categories", Icon: CategoriesIcon },
  { href: "/shop?sort=newest", label: "New", Icon: NewIcon, match: "/shop" },
  { href: "/cart", label: "Cart", Icon: CartIcon },
  { href: "/account", label: "Account", Icon: UserIcon },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href.startsWith("/shop?")
                ? pathname.startsWith("/shop")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <item.Icon />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
